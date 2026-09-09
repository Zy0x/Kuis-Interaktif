# Catatan Perubahan (Changelog)
Seluruh riwayat rilis dan pembaruan sistem **Kuis SD Seru** dicatat pada dokumen ini sesuai dengan standar penomoran versi berlanjut.

---

## [2.1.6] - 2026-09-09
### Redesain UI Anti-AI-Slop, Tipografi Nyaman, Estetika Modern & Presisi Mobile-First Hingga Ultrawide

#### Peningkatan Desain & Pengalaman Pengguna (Design & UX Refresh)
- **Eliminasi Gaya "AI Slop" & Gradien Melelahkan:**
  - Menghapus gradien pelangi pekat, efek garis tebal kartun berlebihan, dan pola latar belakang yang membuat mata lelah dan pusing.
  - Menerapkan palet warna bersih dan menenangkan (*Clean Slate-50 background, Indigo/Blue primary accents, Emerald untuk jawaban benar, Rose untuk jawaban salah*).
- **Tipografi Bersih & Hierarki Ramah Siswa:**
  - Mengganti bobot huruf serba tebal `font-black` dengan tipografi terstruktur dan seimbang (*font-bold* untuk judul, *font-semibold* untuk kartu, dan *font-medium* untuk teks bacaan) berstandar kontras WCAG AA.
- **Penyempurnaan Elemen Visual & PWA:**
  - Kartu kuis dirancang ulang dengan elevasi modern lembut (`shadow-card`, rounded-2xl, dan pembatas slate-200 yang halus).
  - Banner instalasi PWA diposisikan ulang ke *bottom toast banner* yang elegan dan tidak menghalangi bilah navigasi atas.
  - Tombol aksi header ponsel beradaptasi otomatis dengan teks ringkas tanpa pembungkusan baris ganda (*whitespace-nowrap*).
- **Konsistensi Responsif Mobile-S (320px) hingga Ultrawide (2560px+):**
  - Antarmuka tetap fleksibel, adaptif, proporsional, dan nyaman dibaca oleh siswa SD di seluruh ukuran layar tanpa distorsi atau elemen terpotong.

---

## [2.1.5] - 2026-09-09
### Arsitektur Tata Letak Fluid Penuh (Mobile-S hingga Ultrawide & 4K)

#### Peningkatan Kualitas & Presisi Visual (Improved)
- **Penghapusan Celah Kosong Sisi Kanan/Kiri (Edge-to-Edge Fluidity):**
  - Mengganti pembatas kaku `max-w-5xl` dengan kontainer adaptif cerdas `max-w-[2200px] w-full mx-auto px-4 sm:px-6 lg:px-10 xl:px-14`.
  - Halaman kini mengisi seluruh lebar layar secara alami dan harmonis baik pada layar ponsel 320px maupun monitor layar lebar / *ultrawide* 1920px hingga 4K (2560px).
- **Sistem Grid Dinamis Lintas Perangkat:**
  - `grid-cols-1` pada Mobile-S (320px), Mobile-M (375px), Mobile-L (425px).
  - `grid-cols-2` pada perangkat Tablet / iPad (640px–1024px).
  - `grid-cols-3` pada Layar Laptop / Desktop Standar (1024px–1280px).
  - `grid-cols-4` pada Monitor Full HD (1280px–1920px).
  - `grid-cols-5` hingga `grid-cols-6` pada Monitor Lebar & Ultrawide (1920px–2560px+).
- **Banner Beranda Berimbang (*Adaptive Hero Banner*):**
  - Pada layar lebar, banner otomatis menampilkan ringkasan informasi kuis aktif dan bidang studi di sisi kanan sehingga tampilan tidak hampa atau memanjang canggung.
  - Pada ponsel, banner tetap ringkas, ramah anak, dan mudah dioperasikan dengan satu tangan.
- **Pencegahan Teks/Tombol Terpotong & Modal Aman:**
  - Lencana kartu kuis menggunakan `flex-wrap` sehingga judul dan status "Karya Guru" tidak pernah berhimpitan atau saling tindih.
  - Seluruh modal dialog (Aturan Singkat, Profil Pemain, Keluar Kuis) menggunakan pembatas tinggi `max-h-[92vh]` dan *scroll* internal mandiri agar aman dari risiko terpotong pada orientasi *landscape* ponsel pendek (1080×2460, 1080×2380).
- **Studio Pembuat Kuis Dua Kolom:**
  - Pada layar desktop/ultrawide, editor kuis guru otomatis membagi tampilan menjadi 2 kolom (Daftar Bank Soal di sisi kiri dan Formulir Input di sisi kanan) untuk efisiensi kerja guru.

---

## [2.1.4] - 2026-09-09
### Optimasi Presisi Mobile-First (Mobile-S 320px, Mobile-M 375px, Mobile-L 425px) & Verifikasi E2E
- Penyempurnaan bilah navigasi atas (*Header Navbar*) agar tidak tumpang tindih pada layar 320 px.
- Target sentuh terverifikasi minimal 44×44 px hingga 48×55 px pada seluruh tombol navigasi dan pilihan kuis.
- Penambahan berkas peluncur Windows sekali klik: `BUKA_KUIS.bat` dan `JALANKAN_KUIS_SD_SERU.bat`.

---

## [2.1.3] - 2026-09-09
### Rilis Fitur Fase 2: Studio Penyusun Kuis Guru (Quiz Creator Studio)
- Wizard penyusunan bertahap 3 langkah: Identitas Kuis -> Bank Soal & Gambar -> Pratinjau Mobile & Publikasi.
- Editor bank soal interaktif: Pilihan Ganda (2–4 opsi) dan Benar/Salah (*True/False*).
- Fitur sisipkan gambar: Unggah foto dari perangkat atau pilih cepat stiker ilustrasi edukatif.
- Penentuan kunci jawaban satu-klik berbingkai hijau dan kolom penjelasan edukatif.
- Penyimpanan kuis ganda: LocalStorage reaktif + sinkronisasi otomatis ke basis data Supabase.

---

## [2.1.2] - 2026-09-09
### Pondasi Arsitektur & Rilis Fitur Fase 1 (Core Gameplay & PWA)
- Implementasi Beranda Kuis dengan filter kelas 1–6 SD dan mata pelajaran.
- Implementasi Arena Kuis ramah anak dengan target sentuh minimal 48×48 px dan umpan balik suara instan Web Audio API.
- Implementasi Hasil Kuis dengan evaluasi 3 Bintang Emas, konfeti selebrasi, tab pembahasan soal edukatif, dan Papan Peringkat (*Leaderboard*).
- Implementasi standar PWA: Manifest, Service Worker offline caching, Splash Screen animasi 1.5s, dan Reorientation Overlay.
- Penyusunan skrip backend Supabase mandiri `docs/setup.sql` ber-RLS ketat, `docs/backup-restore-guide.md`, dan `docs/database-architecture.md`.

---

## [2.1.1] - 2026-09-09
### Rilis Perencanaan & Dokumen Kebutuhan Produk (PRD)
- Penyusunan dokumen PRD komprehensif berdasarkan peta fitur Fase 1, Fase 2, dan Fase 3.
- Penetapan standar mobile-first, arsitektur database Supabase, dan protokol backup admin.
