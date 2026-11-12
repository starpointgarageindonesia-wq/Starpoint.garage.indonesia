# Starpoint Garage Showroom — Pembukuan Internal

URL produksi: https://showroom.starpointgarage.com/

**Bukan** situs jual beli publik. Ini adalah aplikasi administrasi keuangan internal yang di-deploy lewat Cloudflare Worker `starpoint-showroom`, dengan production branch GitHub `showroom`. Website bengkel `https://starpointgarage.com` tetap memakai branch `main` dan Worker terpisah.

## Fitur utama
- Dashboard: jumlah unit aktif, modal tertanam, laba proyeksi, laba unit terjual, PR pending, saldo kas.
- Unit motor: merek, model, varian, tahun, odometer, plat, kode unit, harga beli/modal, target jual, harga jual aktual, tanggal beli/jual, status, catatan.
- Detail tiap motor: PR/checklist dengan prioritas dan status; sparepart dengan jumlah, harga beli/pcs, estimasi jual/pcs, harga jual aktual, qty terjual, tujuan pemasangan atau jual terpisah; pengeluaran rencana dan aktual.
- Setoran dan penarikan modal per pemodal; arus kas dari seluruh transaksi tercatat; ekspor CSV.
- Foto multiple pada motor maupun sparepart (Supabase Storage bucket `showroom-private`, RLS, signed URL).
- Riwayat perubahan data untuk Owner (audit log).
- Pembaruan antarperangkat dengan Supabase Realtime Postgres Changes + pemuatan ulang berkala saat aktif.

## Akses dan keamanan
- Login menggunakan **Supabase Auth** (email + password) yang sudah dimiliki akun Owner aplikasi Starpoint Garage.
- Bootstrap `showroom_access`: hanya satu akun `staff_profiles.role=owner` yang aktif. Member dan teknisi tidak otomatis diberi hak melihat pembukuan.
- Tabel terpisah dengan prefiks `showroom_`, RLS per tabel, Storage privat, audit trail.
- Tidak ada service-role key pada frontend. Hanya Supabase publishable key.
- Halaman memakai `noindex`; tidak ditujukan untuk pencarian publik.
- Akses tambahan Editor/Viewer harus ditambahkan secara khusus ke tabel `showroom_access` oleh admin, bukan terbuka untuk pendaftaran umum.
- Jika email/password akun Owner tidak diketahui, lakukan reset password melalui pengaturan akun Auth sesuai proses resmi; jangan membagikan kata sandi melalui chat.

## Perhitungan
- HPP realisasi = harga pembelian motor + harga pembelian sparepart yang sudah dibeli + pengeluaran aktual.
- HPP proyeksi = HPP realisasi + biaya rencana (sparepart dan pengeluaran).
- Pendapatan proyeksi = harga target jual motor (harga aktual apabila unit berstatus terjual) + nilai penjualan sparepart terpisah (aktual + target untuk sisa kuantitas).
- Perkiraan laba = pendapatan proyeksi − HPP proyeksi. Jika target motor belum diisi, proyeksi laba dianggap *belum tersedia*, bukan dianggap rugi.
- Laba realisasi motor terjual = harga jual aktual motor + penjualan aktual sparepart terpisah − HPP realisasi.
- Estimasi biaya pada **PR** hanya referensi dan tidak dihitung ulang dalam HPP. Catat biaya yang dibayar pada Pengeluaran atau Sparepart.
- Saldo kas tercatat = setoran − penarikan − pembelian motor − pembelian sparepart − pengeluaran aktual + pendapatan penjualan.
- Saldo tercatat bukan koneksi langsung ke rekening bank.

## File dan deployment
- `wrangler.jsonc` mengaktifkan Cloudflare Worker bernama `starpoint-showroom` dengan custom domain `showroom.starpointgarage.com`.
- `public/index.html`: shell aplikasi dan login.
- `public/style.css`: UI responsive desktop, tablet, HP.
- `public/core.js`: Supabase Auth, database, RLS client usage, kalkulasi, foto dan Realtime.
- `public/views.js`: ringkasan, motor, sparepart, arus kas, laporan, riwayat.
- `public/forms.js`: formulir unit, PR, sparepart, pengeluaran, modal.
- `public/app.js`: interaksi, CRUD, autentikasi, ekspor CSV.
- `public/robots.txt` dan meta noindex menjaga halaman tidak dipromosikan untuk pencarian umum.

## Catatan implementasi
Schema/database dan privasi foto disiapkan di proyek Supabase Starpoint Garage yang sudah ada. Tidak mengubah tabel `bookings`, member, owner, teknisi, transaksi bengkel, atau Edge Functions lain.
Pada awal pembuatan tabel showroom masih kosong: tidak ada unit, angka laba, sparepart, atau foto fiktif.
Tidak ada password/secret API key di repository.
