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

## Member di Website (sinkronisasi aktif GitHub + Supabase)
- Website utama tetap berada di `/` dengan katalog, layanan, galeri, lokasi, FAQ, dan WhatsApp. Tombol **Member** di header tetap terpisah dan berada tepat di sisi kontrol ID/EN.
- **Sumber tunggal tampilan Member:** Supabase Edge Function `member-app`. `public/member.html` dan `member.html` berisi *bootloader* kecil yang mengambil HTML terbaru langsung dari Edge Function setiap kali halaman Member dibuka atau dimuat ulang. Tidak perlu lagi menyalin HTML APK ke GitHub setelah setiap perubahan UI pada Supabase.
- Browser mengunduh HTML dengan CORS dari endpoint publik `member-app`, mengganti base URL khusus Edge Function agar sesuai domain `starpointgarage.com`, menyesuaikan header dan viewport web, serta mempertahankan deep link `?mode=daftar`.
- Kedua belas foto katalog dari `SERVICE_IMG` pada HTML aktif diganti pada saat pemuatan dengan **aset WebP yang sama** di `/assets/app-services/*.webp`. Jika ada gambar/fitur baru pada APK, kode Member lainnya tetap diambil utuh dari sumber Supabase, sementara optimasi aset perlu ditinjau ulang bila pemetaan berubah.
- **Fallback:** `public/member-backup.html` / `member-backup.html` menyimpan snapshot web lengkap yang terakhir diketahui. Jika layanan UI Supabase tidak dapat diambil, browser otomatis mengarahkan pengguna ke versi tersebut (dan menyediakan tautan cadangan). Fallback tetap membutuhkan koneksi ke backend Supabase untuk login dan data.
- Browser berinteraksi dengan `member-auth`, PostgREST RPC, dan Supabase Storage menggunakan publishable key dan token pengguna. **Service-role/secret API key tidak disimpan di GitHub atau browser.**
- Sesi login pada domain website memakai `localStorage` `spg_member_session` milik kode Member; APK berbeda origin dan mungkin meminta login tersendiri, tetapi keduanya membaca/menulis akun, booking, progres, poin, voucher, riwayat, dan data yang sama di Supabase.
- `reset-password.html` tetap menjadi URL resmi pemulihan password, sesuai redirect pada `member-auth`. Tidak ada skema database, Edge Function, akun, transaksi, atau histori pelanggan yang diubah untuk mekanisme sinkronisasi ini.
- **Batasan:** perubahan UI Supabase langsung diterima saat kunjungan/muat ulang halaman Member berikutnya, bukan otomatis mengganti kode di tab yang sudah terbuka. Peluncuran perubahan backend yang merusak kompatibilitas tetap harus diuji. Jika fungsi `member-app` gagal, snapshot cadangan dipakai sampai sumber kembali tersedia.

## Pengecekan integrasi Member
- Pemeriksaan `node scripts/check-member-parity.mjs` memverifikasi kesamaan berkas root/produksi, tombol Member di samping bahasa, keberadaan fallback, 12 gambar katalog WebP, dan sintaks pemuat.
- Pengecekan menarik HTML aktif `member-app` melalui GET tanpa autentikasi pelanggan, menguji optimasi dan penyesuaian HTML beserta skripnya, lalu memverifikasi CORS `member-auth` untuk domain website. **Tidak membuat akun, booking, transaksi, atau perubahan database.**
- Workflow `.github/workflows/member-parity.yml` menjalankan pemeriksaan saat berkas terkait berubah, setiap hari, serta atas permintaan manual. Keberhasilan otomasi perlu diperiksa melalui status GitHub Actions.
- Pengujian end-to-end pendaftaran, login, booking, progres pekerjaan, dan pembayaran membutuhkan akun tester. Pemeriksaan statis/CORS saja bukan bukti transaksi sukses.
