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
