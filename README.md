# Starpoint Garage Showroom

Source khusus showroom motor Starpoint Garage Surabaya.

## Deployment
- Worker Cloudflare: `starpoint-showroom`
- Domain tujuan: `showroom.starpointgarage.com`
- Git repository: `starpointgarageindonesia-wq/Starpoint.garage.indonesia`
- Production branch untuk Worker showroom: `showroom`
- Konfigurasi Wrangler: `wrangler.jsonc` dengan name `starpoint-showroom`
- Folder deploy: `./public`
- File halaman: `public/index.html`
- Data stok: `public/units.json` (saat ini kosong untuk menghindari menampilkan unit/harga fiktif)

## Pemisahan
Branch `main` tetap berisi website bengkel di `starpointgarage.com`.
Jangan mengubah production branch Worker bengkel utama. Pada Worker `starpoint-showroom` gunakan production branch `showroom` agar perubahan branch ini memicu deployment ke showroom, bukan ke bengkel utama.

## Catatan
Subdomain hanya boleh dihubungkan pada Worker `starpoint-showroom` setelah halaman showroom berhasil di-deploy dan diverifikasi. Tidak ada perubahan backend Supabase, member, atau aplikasi teknisi/owner dalam branch ini.
