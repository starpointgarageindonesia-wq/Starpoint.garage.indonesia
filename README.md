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
- Profil dan katalog 4 layanan utama lengkap harga mulai serta estimasi durasi.
- Kategori motor, ala carte, layanan tambahan, dan detail treatment interaktif.
- Informasi aplikasi member; galeri terbatas pada foto yang memang tersedia.
- Form booking yang membuka pesan WhatsApp tanpa menyimpan data pelanggan di server.
- Testimoni arsip, Google Maps, FAQ, dan ketentuan layanan historis.
- SEO: meta description, Open Graph, schema AutomotiveBusiness, favicon, robots.txt, sitemap.xml.

## Penting sebelum publikasi
1. Pastikan pengaturan Cloudflare Pages/Workers terhubung dengan branch `main` dan folder `public`.
2. Konfirmasi tarif, kebijakan DP, jadwal kerja, serta gratis antar-jemput dengan admin jika terjadi perubahan.
3. Ulasan, statistik rating, dan promo lama tidak dinyatakan sebagai data real-time.
4. Nomor WhatsApp saat ini tertulis `6281345115758`; ubah pada link dan script jika nomor bisnis berganti.
5. Gambar yang tersedia: `public/assets/store.webp` dan `public/assets/app-showcase.webp`. Foto galeri premium lama dan logo final belum tersedia sebagai asset repository.
6. Form booking tidak melakukan pembayaran maupun membuat reservasi otomatis. Semua slot dikonfirmasi admin via WhatsApp.

## Perawatan
Bila mengubah halaman, samakan `public/index.html` dan `index.html`. Hindari menambahkan promosi yang sudah kedaluwarsa. Situs ini dapat dilayani dengan hosting statis tanpa VPS/cPanel.
