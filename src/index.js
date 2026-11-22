// Starpoint Garage owner-spg — proxy resmi ke aplikasi Supabase aktif.
// Sumber UI dan logika tetap di Supabase agar sinkron dengan APK.
const APP_URL = "https://msvdxyicostwztisvbvl.supabase.co/functions/v1/owner-app/";
const APP_BASE = "/functions/v1/owner-app/";
const pageHeaders = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
  "X-Robots-Tag": "noindex, nofollow, noarchive"
};
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }
    const isHealth = url.pathname === "/health";
    const upstream = new URL(isHealth ? "health" : "", APP_URL);
    if (isHealth) {
      return new Response(JSON.stringify({ ok: true, app: "owner-app" }), {
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
      });
    }
    let response;
    try {
      response = await fetch(upstream.toString(), { method: "GET", redirect: "follow" });
    } catch (_) {
      return new Response("Aplikasi belum dapat dihubungi. Coba lagi.", { status: 502, headers: { "Cache-Control": "no-store" } });
    }
    if (!response.ok) {
      return new Response("Aplikasi sedang tidak tersedia.", { status: 502, headers: { "Cache-Control": "no-store" } });
    }
    let html = await response.text();
    // Aplikasi aslinya menggunakan base path Supabase; pada subdomain harus memakai root.
    html = html.replace('<base href="' + APP_BASE + '">', '<base href="/">');
    return new Response(request.method === "HEAD" ? null : html, { status: 200, headers: pageHeaders });
  }
};
