/**
 * Starpoint Garage Member integration smoke test.
 * The website bootloader loads the active Supabase member-app on every visit.
 * Its static fallback remains in GitHub for continuity during an outage.
 *
 * Run: node scripts/check-member-parity.mjs
 * No customer identities, credentials, JWTs, or secret API keys are used.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';

const endpoint = process.env.SPG_MEMBER_APP_URL ||
  'https://msvdxyicostwztisvbvl.supabase.co/functions/v1/member-app';
const memberAuth = 'https://msvdxyicostwztisvbvl.supabase.co/functions/v1/member-auth';
const siteOrigin = 'https://starpointgarage.com';
const expectedPhotos = [
  'signature-wash.webp', 'paint-correction.webp', 'deep-detailing.webp',
  'nano-coating-10h.webp', 'full-body-repaint.webp', 'helmet-care.webp',
  'wheel-repaint.webp', 'deep-tar-removal.webp', 'deep-rust-remover.webp',
  'ultimate-degreaser.webp', 'all-in-ala-carte.webp', 'car-care.webp',
];

function ensure(condition, message) {
  if (!condition) throw Error(message);
}
const read = (path) => readFile(resolve(process.cwd(), path), 'utf8');

async function request(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35000);
  try {
    return await fetch(url, { ...init, signal: controller.signal, redirect: 'error' });
  } finally {
    clearTimeout(timer);
  }
}

async function run() {
  const [home, homeRoot, portal, portalRoot, backup, backupRoot] = await Promise.all([
    read('public/index.html'), read('index.html'),
    read('public/member.html'), read('member.html'),
    read('public/member-backup.html'), read('member-backup.html'),
  ]);
  ensure(home === homeRoot, 'Main website root and published copy differ.');
  ensure(portal === portalRoot, 'Member loader root and published copy differ.');
  ensure(backup === backupRoot, 'Member fallback root and published copy differ.');
  ensure(/class="member-button"[\s\S]{0,260}id="languageToggle"/.test(home),
    'Keep Member button separate, adjacent to language control.');
  ensure(portal.includes(endpoint), 'Member loader has wrong Supabase source.');
  ensure(portal.includes('document.write(page)'), 'Live UI loading is missing.');
  ensure(portal.includes('spg-website-member-deeplink'), 'Member signup deep-link is missing.');
  ensure(portal.includes('/member-backup.html'), 'Static fallback is not configured.');
  ensure(!/sb_secret_|service[_-]?role.{0,12}[:=]/i.test(portal),
    'Do not expose a privileged API key in public website.');
  ensure(backup.includes('id="authScreen"') && backup.includes('id="mainScreen"'),
    'Static Member fallback lacks login or dashboard.');

  for (const file of expectedPhotos) {
    ensure(portal.includes('/assets/app-services/' + file),
      'Bootloader image mapping missing: ' + file);
    const bytes = await readFile(resolve('public/assets/app-services', file));
    ensure(bytes.length > 1000 && bytes.toString('ascii', 0, 4) === 'RIFF',
      'WebP catalog asset is missing or corrupt: ' + file);
  }

  const scripts = [...portal.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
  ensure(scripts.length === 1, 'Expected one bootloader script.');
  const boot = scripts[0][1];
  new vm.Script(boot, { filename: 'member-loader.js' });
  const first = boot.indexOf('var endpoint =');
  const last = boot.indexOf('var originalFallback =');
  ensure(first >= 0 && last > first, 'Member UI transformer could not be located.');
  const prepare = vm.runInNewContext(
    '(function(){' + boot.slice(first, last) + '\nreturn prepare;})()',
    {},
  );

  const response = await request(endpoint, {
    headers: { Accept: 'text/html', Origin: siteOrigin },
    cache: 'no-store',
  });
  ensure(response.ok, 'Supabase member-app unavailable: HTTP ' + response.status);
  ensure((response.headers.get('content-type') || '').includes('text/html'),
    'Supabase member-app did not return HTML.');
  ensure(response.headers.get('access-control-allow-origin') === '*' ||
         response.headers.get('access-control-allow-origin') === siteOrigin,
    'Browser CORS access to member-app is not allowed.');
  const remote = await response.text();
  const rendered = prepare(remote);

  ensure(rendered.includes('<base href="/">'), 'Website base URL rewriting failed.');
  ensure(rendered.includes('spg-live-member-web-fixes'), 'Browser-safe header CSS missing.');
  ensure(rendered.includes('spg-website-member-deeplink'), 'Registration deep-link injection failed.');
  ensure(rendered.includes('id="authScreen"') && rendered.includes('id="mainScreen"'),
    'Live Member login or dashboard missing.');
  ensure(rendered.includes('/rest/v1/rpc/'), 'Member Supabase RPC requests not found.');
  ensure(rendered.includes('/functions/v1/member-auth'),
    'Member authentication endpoint missing.');
  ensure(rendered.length < 350000,
    'Website optimization failed: images might still be embedded in HTML.');

  for (const file of expectedPhotos) {
    ensure(rendered.includes('/assets/app-services/' + file),
      'Live Member output has no local image reference: ' + file);
  }
  const embeddedScripts = [...rendered.matchAll(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi)];
  for (const [i, script] of embeddedScripts.entries()) {
    if (script[1].trim()) new vm.Script(script[1], { filename: 'member-live-inline-' + i + '.js' });
  }

  const preflight = await request(memberAuth, {
    method: 'OPTIONS',
    headers: {
      Origin: siteOrigin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type,apikey,authorization',
    },
  });
  ensure(preflight.ok, 'Member Auth CORS preflight failed: HTTP ' + preflight.status);
  ensure(preflight.headers.get('access-control-allow-origin') === siteOrigin,
    'Member Auth does not accept starpointgarage.com origin.');

  console.log('PASS: GitHub home, Member loader and fallback copies match.');
  console.log('PASS: 12 Member catalog photos available in WebP.');
  console.log('PASS: Supabase Member UI loads, transforms and compiles.');
  console.log('PASS: Supabase Member Auth allows the website origin.');
  console.log('PASS: Member data uses the same Supabase APIs as the APK.');
}

run().catch((error) => {
  console.error('FAIL:', error?.message || error);
  process.exitCode = 1;
});
