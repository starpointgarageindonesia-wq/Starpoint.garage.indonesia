# Second Starpoint Partshop — Isolasi Operasional

## Peraturan penting
- Perubahan kode HANYA pada branch `second-partshop`. Jangan merge ke `main`, `showroom`, `deploy-owner-spg-2026`, atau `deploy-teknisi-spg-2026`.
- Cloudflare Worker: `second-starpoint-partshop`, domain `second.starpointgarage.com`.
- Database HANYA `public.partshop_access`, `public.partshop_motorcycles`, `public.partshop_parts`.
- Storage HANYA bucket privat `starpoint-partshop-private`.
- Jangan ubah konfigurasi Auth global, tabel showroom/member/bookings atau Edge Functions Garage.
- Source frontend menggunakan kunci publishable Supabase, tidak boleh menyimpan secret/service-role ataupun password dalam repository.

## Aktivasi username starpointpart (belum aktif)
Supabase project saat ini menggunakan autentikasi email di backend. Untuk memasukkan username `starpointpart`:
1. Admin Supabase membuka Authentication > Users > Add user / Create new user.
2. Buat user dengan email internal `starpointpart@starpointgarage.com`; tentukan password di UI Supabase (JANGAN di kode GitHub). Jika dashboard menyediakan opsi Auto-confirm, aktifkan untuk user yang dibuat manual.
3. Setelah user benar-benar tercipta, beri user tersebut role owner pada `public.partshop_access`, dan cabut akses bootstrap lama hanya dari tabel tersebut. Jangan memodifikasi `public.showroom_access` atau tabel Garage mana pun.
4. Login dari `second.starpointgarage.com` menggunakan username `starpointpart` dan password yang dibuat.

Catatan: Jika email alias tidak memiliki inbox yang dapat menerima surat, pemulihan password via email tidak tersedia. Pastikan admin dapat mengelola akun ini melalui dashboard.

## Rangkaian tes setelah deployment
1. Login dan logout (jangan simpan password plaintext).
2. Tambah motor + foto, verifikasi daftar motor dan statistik.
3. Tambah part untuk motor, verifikasi relasi serta foto part.
4. Edit motor/part, ubah status ke terjual bersama harga jual.
5. Pencarian motor/part, filter tahun, menu Terjual/Belum Terjual.
6. Ekspor laporan CSV dan cek angka modal/penjualan.
7. Konfirmasi semua data tetap di tabel `partshop_*`.
8. Jalankan smoke-test terpisah pada website Garage untuk memastikan tidak berubah.

## Deploy
Cloudflare Workers: production branch `second-partshop`, command `npx wrangler deploy`, root `/`. Jangan mengalihkan domain Garage atau memakai `wrangler.jsonc` main.
