# Second Starpoint Partshop: Password Terpisah, Infrastruktur Tetap Bersama

## Akun Partshop
- Username web: `starpointpart`.
- Auth email: `starpointgarageindonesia+partshop@gmail.com` (alias Gmail yang masuk ke inbox Owner Starpoint Garage).
- Password dibuat hanya melalui formulir aktivasi di website, **tidak disimpan di kode**.
- Klik **Aktifkan login starpointpart** lalu konfirmasi email yang tiba di inbox owner. Supabase Auth bisa meminta pengaturan Redirect URL jika link konfirmasi mengarah ke tempat lain; cukup kembali ke website Second setelah email terverifikasi.
- Saat login pertama kali setelah konfirmasi, fungsi `public.partshop_claim_access()` memberikan akses hanya untuk user dengan email yang cocok dan terverifikasi, menambahkan izin ke `partshop_access` saja.
- Username `starpointgarage` tetap menggunakan identitas Auth Owner Garage yang lama bila dibutuhkan.
- **Jangan** mengganti password identitas Owner Garage.

## Isolasi
- Branch GitHub `second-partshop`.
- Worker dan domain: `second-starpoint-partshop` / `second.starpointgarage.com`.
- Database Partshop hanya: `public.partshop_access`, `public.partshop_motorcycles`, `public.partshop_parts`.
- Storage foto hanya di bucket privat `starpoint-partshop-private`.
- **Tidak** mengubah data/showroom/member/booking/sesi atau password Starpoint Garage.

## Pengujian
1. Aktifkan akun, konfirmasi email, lalu login `starpointpart`.
2. Tambah motor beserta foto, tambah sparepart beserta foto, edit/hapus.
3. Cek status terjual, harga jual, filter dan CSV.
4. Cek data hanya muncul dalam tabel dan bucket Partshop.
5. Pastikan login Owner Garage lama tetap berjalan.
