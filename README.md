# Starpoint Garage — Website Publik

Website resmi `https://starpointgarage.com/` untuk layanan premium motorcycle care di Surabaya.

## Deployment
- Repository: `starpointgarageindonesia-wq/Starpoint.garage.indonesia`.
- Branch produksi: `main`.
- Domain kustom: `CNAME` berisi `starpointgarage.com`.
- Cloudflare static assets: `wrangler.jsonc` menggunakan `./public`.
- `public/index.html` adalah berkas yang dipublikasikan oleh konfigurasi Cloudflare.
- `index.html` di root disamakan untuk kompatibilitas dengan hosting statis lain.

## Fitur
- Tampilan responsif dengan navigasi mobile.
- Profil dan katalog 4 layanan utama, memakai foto dari `SERVICE_IMG` aplikasi Member (WebP 720×720), serta matriks harga lima kategori motor (Small, Medium, Large, Big Bike, Luxury).
- Kategori motor, ala carte, layanan tambahan, dan detail treatment interaktif.
- Informasi aplikasi member; galeri terbatas pada foto yang memang tersedia.
- Form booking yang membuka pesan WhatsApp tanpa menyimpan data pelanggan di server.
- Galeri foto workshop, visual arsip treatment, testimoni historis, Google Maps, FAQ, dan ketentuan layanan historis.
- SEO: meta description, Open Graph, schema AutomotiveBusiness, favicon, robots.txt, sitemap.xml.

## Penting sebelum publikasi
1. Pastikan pengaturan Cloudflare Pages/Workers terhubung dengan branch `main` dan folder `public`.
2. Konfirmasi tarif, kebijakan DP, jadwal kerja, serta gratis antar-jemput dengan admin jika terjadi perubahan.
3. Ulasan, statistik rating, dan promo lama tidak dinyatakan sebagai data real-time.
4. Nomor WhatsApp saat ini tertulis `6281345115758`; ubah pada link dan script jika nomor bisnis berganti.
5. Gambar yang tersedia: `public/assets/store.webp` (foto lokasi asli), `public/assets/app-showcase.webp` (ilustrasi aplikasi), `public/assets/services-archive.webp` (empat cuplikan foto treatment yang berhasil dipulihkan dari tangkapan layar aplikasi pelanggan), dan logo resmi terbaru berdasarkan berkas yang diberikan pemilik `public/assets/starpoint-official.svg` (vektor transparan; dipasang di header dan footer). Berkas lama `public/assets/starpoint-logo.webp` dipertahankan sebagai cadangan. Gambar-gambar treatment yang tampil berasal langsung dari sumber aplikasi Member; arsip screenshot lama sudah tidak dipakai di website.
6. Form booking tidak melakukan pembayaran maupun membuat reservasi otomatis. Semua slot dikonfirmasi admin via WhatsApp.

## Perawatan
Bila mengubah halaman, samakan `public/index.html` dan `index.html`. Hindari menambahkan promosi yang sudah kedaluwarsa. Situs ini dapat dilayani dengan hosting statis tanpa VPS/cPanel.

## Aset merek resmi
Logo resmi di header, footer, dan favicon mengikuti gambar yang diunggah pemilik pada 8 November 2026. Wordmark diubah menjadi vektor transparan tanpa merancang ulang lettering atau warna. Ke-12 foto katalog perawatan yang dipakai website sekarang adalah aset WebP 720×720 tertanam dalam Edge Function `member-app`, bukan hasil cropping screenshot. Tidak diklaim sebagai file kamera 4K maupun sebagai dokumentasi spesifik pelanggan.

## Restorasi foto aplikasi Member (8 November 2026)
- Sumber resmi: Supabase Edge Function `member-app` pada project Starpoint; constant `SERVICE_IMG` menyimpan 12 aset gambar WebP berukuran 720×720.
- Disimpan sebagai berkas mandiri di `public/assets/app-services/*.webp` tanpa penambahan gambar AI baru.
- Dipakai untuk hero, empat layanan utama, dan galeri delapan layanan lainnya.
- Background `services-archive.webp` versi screenshot resolusi 280×168 telah dihapus dari seluruh referensi CSS/HTML yang aktif.
- Gambar ini adalah visual katalog aplikasi, tidak secara otomatis membuktikan hasil pengerjaan suatu unit pelanggan.

## Member di Website (integrasi aplikasi penuh)
- Halaman utama tetap berisi layanan, katalog harga, foto, galeri, lokasi, ulasan, FAQ, dan booking WhatsApp. Tombol **Member** berada di header tepat di sebelah kontrol bahasa ID/EN, bukan di menu utama.
- Halaman `public/member.html` / `member.html` adalah salinan teroptimasi dari HTML **Supabase Edge Function `member-app`** yang digunakan APK Member. Semua tampilan inti dan alur register, login, booking, status pengerjaan, riwayat, poin, voucher, notifikasi, QR Member, profil, dan kendaraan menggunakan kode aplikasi yang sama.
- Foto katalog WebP tetap **file identik** dari aplikasi; 12 gambar base64 di HTML diganti referensi statis `/assets/app-services/*.webp` yang sudah ada sehingga halaman lebih cepat. Logo dan visual lain tetap mengikuti aplikasi.
- Browser berkomunikasi langsung dengan Supabase `member-auth`, PostgREST RPC, dan Storage menggunakan *publishable* API key dan token user. **Jangan menaruh service-role/secret key di file publik.**
- Sesi login aplikasi website disimpan dalam `localStorage` domain `starpointgarage.com` oleh kode Member asli (`spg_member_session`). Sesi dari APK berbeda origin dan tidak otomatis ikut login, tetapi akun, booking, status, poin, riwayat, dan data Supabase tetap satu sumber.
- Deep link `/member.html?mode=daftar` membuka tab Daftar, sedangkan `/member.html` dan `/member.html?mode=masuk` membuka tab Masuk. Seluruh alur tetap diproses fungsi asli Member.
- `reset-password.html` adalah halaman pemulihan email. *Native bridge* `window.StarpointNative` hanya berjalan di APK; browser memakai fallback bawaan untuk fitur yang mendukungnya.
- **Sinkronisasi versi UI:** HTML website adalah snapshot dari `member-app` pada saat deployment. Jika Edge Function aplikasi berubah di masa depan, salinan website perlu diperbarui dari sumber yang sama agar tetap identik. Data tidak disalin dan selalu dibaca/ditulis langsung di Supabase.
- Tidak ada skema database, Edge Function, akun, atau transaksi pelanggan yang diubah dalam pekerjaan ini.

## Pemeriksaan kesamaan Member website dan APK
- Pemeriksaan `node scripts/check-member-parity.mjs` membandingkan HTML lengkap `public/member.html` dengan halaman aktif Supabase Edge Function `member-app`.
- Pengecualian hanya untuk metadata khusus browser, pemilihan gambar katalog WebP lokal, serta deep link daftar pada website; seluruh JavaScript utama dan alur Member harus tetap identik dengan aplikasi.
- Pemeriksaan memastikan tombol Member tetap terpisah di sebelah bahasa, 12 gambar katalog tersedia, serta `index.html`/`member.html` root sama dengan berkas di `public/`.
- Workflow `.github/workflows/member-parity.yml` dijalankan ketika file terkait berubah, terjadwal harian, dan bisa dijalankan manual dari GitHub Actions. Jika gagal, cek perubahan Edge Function lalu sesuaikan kedua salinan HTML secara hati-hati.
- Pemeriksaan ini **tidak otomatis menimpa** kode website, tidak menyentuh database, tidak mengubah akun, dan tidak menghapus riwayat pelanggan. Kegagalan pengecekan bukan berarti akun atau booking telah bermasalah.
