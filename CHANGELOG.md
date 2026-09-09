# Catatan Perubahan (Changelog)
Seluruh riwayat rilis dan pembaruan sistem **Kuis SD Seru** dicatat pada dokumen ini sesuai dengan standar penomoran versi berlanjut.

---

## [2.2.2] - 2026-09-09
### Penyesuaian Identitas Profil "Saya" & Sapaan Dinamis Beranda Siswa

#### Pembaruan Antarmuka & Personalisasi (Profile & Greeting Polish)
- **Tombol Profil Beranda ("Saya"):**
  - Mengubah label profil bawaan (*default*) pada bilah navigasi atas menjadi **"Saya"**, sehingga langsung terasa intuitif sebagai tombol profil/akun siswa.
  - Mempertahankan tampilan raihan bintang siswa di bawah label "Saya" secara rapi dan proporsional.
- **Sapaan Cerdas Beranda (*Dynamic Welcoming Greeting*):**
  - Menghindari kalimat kaku *"Halo, Saya!"* saat profil siswa menggunakan nama bawaan.
  - Ketika profil dalam keadaan bawaan / "Saya", spanduk beranda menyapa secara hangat dan memotivasi dengan: **"Halo, Siswa Hebat!"**.
  - Jika siswa telah memasukkan nama panggilan pribadinya di pengaturan profil (selain "Saya", misal: "Farhan" atau "Aisyah"), spanduk secara otomatis menampilkan nama personal: **"Halo, [Nama Siswa]!"**.
- **Pembersihan Formulir Profil:**
  - Menghilangkan teks isian bawaan yang mengganjal pada formulir nama panggilan, sehingga kolom siap diisi secara langsung tanpa perlu menghapus teks manual.

---

## [2.2.1] - 2026-09-09
### Isolasi Bersih Antarmuka Siswa, Akun Siswa Cloud Opsional (Mode Tamu Default), dan Eliminasi Total Placeholder

#### Pembaruan & Peningkatan Sistem (Clean Interface & Flexible Student Identity)
- **Isolasi Penuh Akses Pembuat Kuis:**
  - Menghilangkan tombol pembuat kuis dari bilah navigasi dan beranda utama siswa. Tombol dan alat manajemen kuis kini sepenuhnya terlokalisasi di dalam Portal Guru yang berwenang.
  - Tampilan beranda siswa difokuskan 100% pada penjelajahan modul pembelajaran, entri PIN kuis kelas, dan koleksi bintang prestasi.
- **Fleksibilitas Profil Siswa & Cloud Sync:**
  - **Mode Tamu (Default Aktif):** Siswa dapat langsung memakai aplikasi, memilih maskot hewan ceria, dan bermain kuis tanpa perlu pendaftaran maupun login awal (bebas hambatan).
  - **Dukungan Akun Siswa Cloud (Opsional):** Siswa yang ingin mencadangkan bintang prestasi dan histori skor di awan kini dapat mendaftar/masuk dengan akun siswa, lengkap dengan penanda tingkatan kelas SD (Kelas 1–6).
- **Eliminasi Seluruh Teks Placeholder:**
  - Menghapus seluruh atribut *placeholder* pada setiap kolom input dan textarea di seluruh aplikasi (pencarian PIN, lobi nama siswa, formulir autentikasi, serta pembuat kuis).
  - Menggantikan teks semu dengan label semantik yang jelas, deskriptif, dan ramah pengguna dengan target sentuh standar minimal 44–48 px.

---

## [2.2.0] - 2026-09-09
### Integrasi Platform EdTech Guru & Siswa, Smartboard IFP Mode, Sistem PIN Kuis, dan Generator Kilat Matematika

#### Fitur Baru & Peningkatan Sistem (Platform Superpowers & Classroom Ready)
- **Akses Langsung Siswa (*Direct Student Entry & Lobby Room*):**
  - Siswa kini dapat masuk langsung mengerjakan kuis melalui tautan pintar dengan parameter URL (`?pin=1234` atau `?quiz=ID`) tanpa terdistraksi katalog bank soal.
  - Halaman **Lobi Siswa (*Student Lobby*)** yang ramah anak dengan kartu nama, pilihan maskot hewan, informasi jenjang kelas, dan tombol masuk langsung.
  - Bilah **Cari PIN Cepat** di beranda siswa untuk bergabung ke ruang kuis kelas hanya dengan memasukkan 4 digit angka.
- **Mode Layar Sentuh TV / Smartboard Kelas (*Interactive Flat Panel 65"–86"*):**
  - **Layar Penuh Instan (*Fullscreen Toggle*):** Mengoptimalkan antarmuka ke rasio layar panel pintar kelas.
  - **Jeda Waktu Guru (*Teacher Pause/Resume*):** Guru dapat menjeda hitungan mundur timer kuis kapan saja untuk memberikan penjelasan materi di depan kelas.
  - **Buka Kunci Jawaban (*Teacher Answer Reveal*):** Membuka kunci dan pembahasan materi secara langsung dengan efek suara istimewa.
  - **Penghitung Voting Langsung (*Live Classroom Polling*):** Menghitung jumlah acungan tangan siswa untuk masing-masing opsi jawaban (A, B, C, D) langsung di layar.
- **Synthesizer Efek Suara Ceria Web Audio API (100% Bebas Aset Eksternal):**
  - Sintesis nada beruntun (*Combo Streak Fanfares*) saat siswa menjawab benar 3x dan 5x berturut-turut.
  - Efek pantul kartun jenaka (*Cartoon Boing*) saat jawaban keliru agar siswa tetap bersemangat dan tidak merasa tertekan.
  - Efek detik jam (*Countdown Tick*) pada 5 detik terakhir pertanyaan.
  - Efek tepuk tangan dan sorak riuh kelas (*Classroom Applause*) saat kuis diselesaikan dengan gemilang.
- **Portal Guru & Rekap Nilai Siswa Real-Time (*Teacher Cockpit*):**
  - Autentikasi Guru mandiri dengan dukungan sinkronisasi basis data awan dan fallback lokal.
  - Dasbor manajemen kuis lengkap dengan tampilan PIN 4 digit per kuis, tombol salin tautan, dan peluncur mode smartboard.
  - **Rekap Nilai Siswa (Buku Nilai Otomatis):** Tabel pemantauan skor, raihan bintang, durasi pengerjaan, dan akurasi yang dapat diunduh ke format file spreadsheet (CSV/Excel).
  - **Generator Kilat Soal Matematika (*Quick Math Engine*):** Pembuat soal otomatis per jenjang kelas 1–6 SD lengkap dengan 4 opsi pilihan dan pembahasan langkah dalam 1 detik.
- **Cetak Lembar Kerja Siswa A4 (*Printable Worksheet & PDF*):**
  - Tampilan format cetak A4 LKS berstandar Kurikulum Merdeka lengkap dengan identitas siswa, kolom nilai/paraf, dan lembar kunci jawaban terpisah untuk guru.

---

## [2.1.8] - 2026-09-09
### Tata Letak Satu Layar Penuh (Zero-Scroll 100dvh) Arena Kuis & Eliminasi Konten Terpotong Halaman Hasil

#### Peningkatan Tata Letak & Ergonomi Pengguna (Layout & Ergonomics)
- **Arena Kuis Pas Satu Layar Penuh (*Zero-Scroll Viewport Fit 100dvh*):**
  - Mengunci tinggi arena kuis ke `h-[100dvh] max-h-screen overflow-hidden flex flex-col justify-between`.
  - Bilah atas (*Header Arena*) dan bilah bawah (*Tombol Soal Berikutnya*) dipin permanen (`flex-shrink-0`), memastikan tombol navigasi **selalu terlihat 100% di layar kapan pun tanpa perlu di-scroll**.
  - Mengintegrasikan penghitung waktu mundur (*Timer Pill*) langsung ke samping indikator nomor soal pada header, menghemat lebih dari 45 px ruang vertikal.
  - Opsi jawaban A/B/C/D disesuaikan dalam kisi dinamis 2×2 pada tablet/laptop dan tombol sentuh proporsional 44–48 px pada ponsel.
  - Seluruh teks soal, ilustrasi gambar, 4 pilihan ganda, kartu pembahasan, dan tombol "Soal Berikutnya" kini tercakup utuh dalam 1 tampilan layar tanpa gulir (*zero scroll*).
  - *Fallback Gulir Aman:* Pada ponsel pendek (misal orientasi *landscape* sempit), hanya wadah soal bagian tengah yang dapat digulirkan secara halus, sementara tombol navigasi dan header tetap terkunci kokoh di layar.
- **Pencegahan Pemotongan Konten Halaman Hasil (*Quiz Result Safe Docking*):**
  - Mengubah bilah aksi (*Beranda, Main Lagi, Bagikan*) dari posisi `fixed` mengambang menjadi `sticky bottom-0` terintegrasi.
  - Menambahkan *clearance buffer* di akhir daftar soal sehingga saat digulir ke bawah, kartu soal terakhir (`Soal 4` beserta kotak penjelasan lengkap) tampil utuh dengan ruang lega di atas tombol, bebas dari masalah tertutup atau terpotong.

---

## [2.1.7] - 2026-09-09
### Perbaikan Animasi Modal Dialog & Isolasi Lapisan Backdrop Blur (Zero Blur-Box Artifacts)

#### Perbaikan Bug & Optimasi Animasi (Bug Fixes & Visual Refinements)
- **Isolasi Penuh Lapisan Backdrop Blur & Kartu Modal:**
  - Memisahkan elemen *Backdrop Overlay* (`fixed inset-0 bg-slate-900/40 backdrop-blur-sm`) dari elemen kartu dialog putih.
  - Menghapus efek `transform: translateY` pada kontainer yang memiliki efek blur CSS. Sebelumnya, animasi translasi pada elemen `backdrop-filter` menyebabkan seluruh latar belakang buram bergeser 6px secara fisik (*moving blur-box artifact*).
- **Sistem Animasi Mandiri (*Independent Motion Design*):**
  - **Lapisan Latar Belakang (*Backdrop*):** Menggunakan `animate-backdrop-fade` (transisi *opacity* murni dari 0 ke 1 tanpa gerakan translasi). Latar belakang buram kini diam kokoh dan memudar dengan halus berstandar iOS/macOS.
  - **Kartu Dialog (*Modal Card*):** Menggunakan `animate-modal-card-in` (skala lembut dari 0.96 ke 1 dengan pergeseran 6px yang elegan hanya pada kartu putih itu sendiri).
- **Interaksi Pengguna Ramah & Alami (*Click-to-Dismiss*):**
  - Mengetuk atau mengklik area luar (backdrop) di luar kartu modal kini otomatis menutup modal secara intuitif.
- **Pembersihan Komponen PWA & Overlays:**
  - Menghapus animasi translasi pada `ReorientationOverlay` dan beralih ke warna solid `bg-slate-900/95` untuk menghindari interferensi GPU *rasterization* pada perangkat seluler.

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
