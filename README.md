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
- Profil dan katalog 4 layanan utama, 4 gambar treatment dari arsip tampilan aplikasi dan matriks harga lima kategori motor (Small, Medium, Large, Big Bike, Luxury).
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
5. Gambar yang tersedia: `public/assets/store.webp` (foto lokasi asli), `public/assets/app-showcase.webp` (ilustrasi aplikasi), `public/assets/services-archive.webp` (empat cuplikan foto treatment yang berhasil dipulihkan dari tangkapan layar aplikasi pelanggan), dan logo historis `public/assets/starpoint-logo.webp`. Empat foto treatment memiliki resolusi terbatas karena bersumber dari screenshot, bukan berkas foto asli. Foto/video asli koleksi H2, Harley, XMAX, BMW dan Car Care dari VPS lama belum ditemukan. Jangan mengklaim cuplikan screenshot sebagai file foto full-resolution asli.
6. Form booking tidak melakukan pembayaran maupun membuat reservasi otomatis. Semua slot dikonfirmasi admin via WhatsApp.

## Perawatan
Bila mengubah halaman, samakan `public/index.html` dan `index.html`. Hindari menambahkan promosi yang sudah kedaluwarsa. Situs ini dapat dilayani dengan hosting statis tanpa VPS/cPanel.
