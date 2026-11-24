# Second Starpoint Partshop — Operasional

## Tampilan login
- Hanya username, password, tombol masuk dan toggle lihat password.
- Username khusus: `starpointpart`. Akun Auth terpisah yang dituju adalah `starpointgarageindonesia+partshop@gmail.com`.
- Akun Auth belum tercipta. Registrasi otomatis aplikasi tidak dapat digunakan karena trigger pendaftaran Garage mensyaratkan proses khusus member/staff.
- Account harus dibuat sekali oleh administrator Supabase melalui Authentication > Users > Add User, dengan email di atas dan password yang dipilih pengguna, dikonfirmasi oleh admin (tanpa menjalankan signup publik).
- Login pertama akan mengaktifkan akses Partshop melalui RPC `partshop_claim_access()` hanya jika email sudah verified.
- Password Owner Garage tidak diubah; sistem Garage tetap tidak tersentuh.

## Isolasi
- Branch GitHub `second-partshop`.
- Cloudflare `second-starpoint-partshop` / `second.starpointgarage.com`.
- Database hanya `partshop_access`, `partshop_motorcycles`, `partshop_parts`.
- Storage bucket privat `starpoint-partshop-private`.
- Jangan ubah trigger atau auth flow Garage, maupun branch Garage.
