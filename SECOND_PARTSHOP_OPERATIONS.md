# Second Starpoint Partshop — Jalur Login Independen
- URL: https://second.starpointgarage.com
- Backend: Supabase Edge Function `second-partshop-api` (baru), dengan CORS hanya mengizinkan origin subdomain Second.
- Login: username `starpointpart`, password sesuai yang dipilih owner; diverifikasi di server sebagai digest, tanpa mengubah `auth.users` atau login Garage.
- Session: token HMAC 2 jam, disimpan di sessionStorage per tab. Logout menghapus token browser.
- Backend secara eksplisit membatasi akses ke `partshop_motorcycles`, `partshop_parts`, dan bucket `starpoint-partshop-private`. Tidak mengakses tabel bisnis Garage.
- Endpoint hanya menerima action `login`, `load`, `save`, `delete`, `photo`, `logout` dan upload foto (multipart). Login memakai rate limiter.
- Branch deploy: `second-partshop`; Worker: `second-starpoint-partshop`; domain: `second.starpointgarage.com`.
- Jangan mengubah fungsi trigger Auth Garage atau password Owner Garage.
- Keamanan: password yang sangat pendek meningkatkan risiko pembobolan akun. Direkomendasikan mengganti password Partshop kelak dengan password yang lebih kuat, tanpa memengaruhi Garage.

Verifikasi diperlukan:
1. Deploy terbaru branch `second-partshop` Ready.
2. Login langsung dengan username/password Partshop.
3. Simpan, edit, hapus motor + sparepart; upload dan lihat foto.
4. Periksa status, modal, laporan CSV dan logout.
5. Pastikan situs Owner, Teknisi, Showroom, dan Garage tetap bekerja.
