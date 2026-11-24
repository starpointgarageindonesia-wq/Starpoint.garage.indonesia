# Second Starpoint Partshop — Akun bersama, sistem terpisah

## Login yang digunakan
- Gunakan **akun Supabase Auth Owner Starpoint Garage yang sudah ada**, bukan akun baru.
- Alias pada website Second Partshop: `starpointpart` atau `starpointgarage`, keduanya mengarah ke email owner `starpointgarageindonesia@gmail.com`.
- Password tetap password autentikasi akun Owner Garage yang sudah berlaku. Jangan menaruh password di repository.
- Izin akses Second Partshop berasal **hanya dari** `public.partshop_access`, tidak dari `staff_access`, `showroom_access`, atau hak akses bisnis Garage.
- Mengubah password shared Auth akan berpengaruh ke semua aplikasi yang menggunakan akun itu; karena itu jangan ubah password dari proyek Partshop.

## Isolasi yang wajib dipertahankan
- GitHub branch `second-partshop`, bukan `main`, `showroom`, `deploy-owner-spg-2026`, atau `deploy-teknisi-spg-2026`.
- Cloudflare Worker `second-starpoint-partshop` dengan domain `second.starpointgarage.com`.
- Tabel khusus `public.partshop_access`, `public.partshop_motorcycles`, `public.partshop_parts`.
- Storage bucket privat `starpoint-partshop-private`, hanya untuk foto Partshop.
- Jangan modifikasi fungsi Edge Auth Garage, aturan keamanan global, tabel data Garage, atau deployment Garage.

## Pengujian setelah perubahan
1. Login di website Partshop dengan alias dan password akun owner Garage yang berlaku.
2. Tambah motor, modal dan foto; cek penyimpanan ke `partshop_motorcycles`.
3. Tambah part yang ditautkan ke motor; cek `partshop_parts` dan bucket privat.
4. Uji edit, ubah status terjual disertai harga, filter, pencarian, laporan, dan logout.
5. Pastikan Garage dan aplikasi lainnya masih beroperasi tanpa perubahan.

## Deployment
Cloudflare Worker production branch `second-partshop`, root `/`, deploy command `npx wrangler deploy`. Jangan merge ke main.
