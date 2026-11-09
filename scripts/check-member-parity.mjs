/**
 * Verify the public Member portal remains functionally identical to the
 * currently deployed Supabase member-app (excluding deliberate web-only
 * metadata, navigation and locally hosted image assets).
 *
 * No customer data, account credentials or service-role keys are used.
 * Run: node scripts/check-member-parity.mjs
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const endpoint = process.env.SPG_MEMBER_APP_URL ||
  'https://msvdxyicostwztisvbvl.supabase.co/functions/v1/member-app';

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function portableMarkup(markup) {
  return markup
    .replace(/data:image\/webp;base64,[A-Za-z0-9+/=]+/g, '[app-image]')
    .replace(/\/assets\/app-services\/[a-z0-9-]+\.webp/g, '[app-image]')
    .replace(/data:image\/png;base64,[A-Za-z0-9+/=]+/g, '[png-image]');
}

async function read(path) {
  return readFile(resolve(process.cwd(), path), 'utf8');
}

async function run() {
  const [website, rootWebsite, portal, rootPortal] = await Promise.all([
    read('public/index.html'), read('index.html'),
    read('public/member.html'), read('member.html'),
  ]);

  check(website === rootWebsite, 'index.html and public/index.html differ');
  check(portal === rootPortal, 'member.html and public/member.html differ');

  check(
    /class="member-button"[\s\S]{0,260}id="languageToggle"/.test(website),
    'Member button must remain separate and adjacent to language selector',
  );
  check(
    portal.includes('id="spg-website-member-link-routing"'),
    'Member registration deep-link routing is missing',
  );

  const localImages = [
    ...portal.matchAll(/\/assets\/app-services\/([a-z0-9-]+\.webp)/g),
  ].map((match) => match[1]);

  check(
    localImages.length === 12 && new Set(localImages).size === 12,
    'Expected 12 distinct local service photos from Member app',
  );

  for (const filename of localImages) {
    const image = await readFile(resolve('public/assets/app-services', filename));
    check(image.length > 1000, 'Catalog image missing or invalid: ' + filename);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  let response;
  try {
    response = await fetch(endpoint, {
      headers: { Accept: 'text/html' },
      signal: controller.signal,
      redirect: 'follow',
    });
  } finally {
    clearTimeout(timeout);
  }

  check(response.ok, 'Supabase Member app fetch failed with HTTP ' + response.status);
  const remote = await response.text();
  check(remote.includes('<html lang="id">'), 'Unexpected Member app response');

  const webOnlyRoute =
    /<script id="spg-website-member-link-routing">[\s\S]*?<\/script>/g;
  const siteCore = portal.replace(webOnlyRoute, '');
  check(siteCore !== portal, 'Website-specific registration routing not found');

  // Preserve the app itself, adjusting only the static website's head.
  const remoteForWebsite = remote
    .replace(
      '<meta name="theme-color" content="#050505">\n<base href="/functions/v1/member-app/">',
      '<meta name="theme-color" content="#050505"><meta name="robots" content="noindex,nofollow"><link rel="icon" href="/favicon.svg" type="image/svg+xml">\n<base href="/">',
    )
    .replace('<title>Starpoint Garage</title>', '<title>Member | Starpoint Garage</title>');

  const expected = portableMarkup(remoteForWebsite);
  const actual = portableMarkup(siteCore);

  if (actual !== expected) {
    let offset = 0;
    while (offset < Math.min(actual.length, expected.length) &&
           actual[offset] === expected[offset]) offset += 1;
    throw new Error(
      'Website Member is no longer in sync with the deployed app. ' +
      'First mismatch at normalized offset ' + offset +
      '. Review the latest member-app before updating either website copy.',
    );
  }

  console.log('PASS: Website / public files match.');
  console.log('PASS: Member entry remains beside the language selector.');
  console.log('PASS: All 12 Member catalog images are available locally.');
  console.log('PASS: Full Member code matches the live Supabase member-app.');
}

run().catch((error) => {
  console.error('FAIL:', error.message);
  process.exitCode = 1;
});
