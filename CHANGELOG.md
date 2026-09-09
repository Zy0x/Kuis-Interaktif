# Catatan Perubahan (Changelog)
Seluruh riwayat rilis dan pembaruan sistem **Kuis SD Seru** dicatat pada dokumen ini sesuai dengan standar penomoran versi berlanjut.

## [2.2.11] - 2026-09-09
### Header Kartu Kompak dengan Penempatan Lencana Mapel Bersebelahan Logo Bebas Tabrakan (Ultra-Compact Side-By-Side Card Header Layout)

#### Peningkatan Tata Letak Kompak & Ergonomis (*Compact UI Architecture*)
- **Penempatan Lencana Mapel Sejajar Logo (*Side-by-Side Subject Badge Alignment*):**
  - Mengembalikan posisi lencana mata pelajaran ke samping logo/emoji kuis dalam satu baris terpadu, mengurangi tinggi kartu secara vertikal (*vertical height efficiency*) sehingga keseluruhan kisi kartu terlihat jauh lebih ringkas, padat berisi, dan hemat ruang layar.
- **Arsitektur Pembatas Lebar Aman (*Bounded Min-W Flexbox Architecture*):**
  - Menerapkan kontainer fleksibel terikat (`min-w-0 flex-1`) dengan pembatas lebar aman (`block w-fit max-w-full truncate`) pada lencana mata pelajaran.
  - Menjamin bahwa teks panjang seperti *"Pendidikan Pancasila"* memiliki ruang baca yang sangat lega, sekaligus terikat kuat sehingga **100% mustahil menabrak atau menimpa lencana jenjang kelas** (`Kelas {grade}`) di pojok kanan kartu.
- **Konsistensi Visual & Sinkronisasi Pratinjau Kuis:**
  - Menyelaraskan kartu pratinjau siswa pada modul Pembuat Kuis (*Quiz Creator Step 3*) dengan arsitektur kompak satu baris yang sama persis.
  - Teruji presisi pada resolusi smartphone (375px), Android (412px), laptop, hingga monitor desktop 4K di mode terang maupun mode gelap.

---

## [2.2.10] - 2026-09-09
### Pembatasan Maksimal 4 Kartu Per Baris & Pembungkusan Responsif Alami (Max 4-Card Fluid Grid & Clean Downward Wrap)

#### Peningkatan Tata Letak Kisi (*Grid Layout & Responsive Refinement*)
- **Pembatasan Kolom Maksimal (*Max 4 Columns Constraint*):**
  - Mengonfigurasi kisi kartu kuis (`QuizHome`) agar dibatasi maksimal 4 kolom per baris (`xl:grid-cols-4`) pada resolusi besar, menghapus pemaksaan 5 atau 6 kolom pada layar 2K, 4K, dan monitor ultra-lebar.
  - Setiap kartu kini memiliki ruang horizontal yang jauh lebih lega dan proporsional (*generous card width*), sehingga seluruh konten, judul, lencana mata pelajaran, dan deskripsi muat dengan sangat lapang tanpa terasa padat.
- **Pembungkusan Baris Rapi (*Graceful Downward Row Wrapping*):**
  - Kartu ke-5, ke-6, ke-7 dan seterusnya secara otomatis dan elegan dibungkus (*wrapped*) ke baris di bawahnya, menjaga keseimbangan simetris dan ritme visual beranda.
- **Konsistensi Seluruh Resolusi:**
  - Tetap beradaptasi dengan mulus: 1 kolom di ponsel sempit, 2 kolom di tablet, 3 kolom di laptop sedang, dan maksimal 4 kolom di desktop hingga layar 4K.

---

## [2.2.9] - 2026-09-09
### Penataan Ulang Header Kartu Kuis Bebas Tabrakan Badge & Presisi Multi-Resolusi (Zero-Collision Quiz Card Architecture & Visual Polish)

#### Perbaikan Tata Letak & Responsivitas (Responsive Card Header & Anti-Overlap Architecture)
- **Arsitektur Header Kartu Dua Tingkat (*Two-Tier Decoupled Header Layout*):**
  - Memisahkan elemen ikon/jenjang kelas dari lencana mata pelajaran (*subject badge*) yang sebelumnya bertumpuk atau terpotong pada lebar kartu sempit.
  - **Baris Atas (Meta Row):** Menampilkan kotak ikon emoji kuis (`w-12 h-12` berbingkai lembut dan rounded modern) di sebelah kiri, serta pill `Kelas {grade}` dan lencana `Guru` yang terkunci rapi di sebelah kanan dengan jarak bebas horizontal yang luas (150px+), menjamin 0% kemungkinan tabrakan elemen.
  - **Baris Khusus Kategori (*Dedicated Subject Pill Row*):** Menempatkan lencana mata pelajaran (seperti *"Pendidikan Pancasila"*, *"Bahasa Indonesia"*, *"Matematika"*, *"IPA"*) pada baris mandiri di atas judul kuis. Teks nama mata pelajaran yang panjang kini memiliki ruang baca 100% penuh tanpa distorsi, tanpa overlap, dan tanpa pemotongan teks (*line truncation*) yang merusak estetika.
- **Harmonisasi Kontras Mode Gelap (*Dark Mode High-Contrast Accents*):**
  - Memperbarui palet warna latar dan teks `getSubjectBadge` agar memiliki varian Dark Mode yang sejuk, kontras tinggi, dan nyaman di mata (misal: aksen ungu gelap `dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/80` untuk Pendidikan Pancasila), mengeliminasi efek latar belakang putih menyilaukan saat mode malam aktif.
- **Sinkronisasi Pratinjau Kuis Guru (*Quiz Creator Preview Sync*):**
  - Menerapkan arsitektur tata letak kartu yang identik pada kartu pratinjau siswa di Langkah 3 Pembuat Kuis (*Quiz Creator*), menjaga konsistensi visual 100% di seluruh aplikasi.
- **Pengujian Lintas Resolusi (360px HP hingga 4K Smartboard):**
  - Teruji presisi pada smartphone Android portrait & landscape (360×780 hingga 1080×2460), tablet (768×1024), serta desktop lebar (1080p & 4K), sepenuhnya mematuhi standar *Mobile-First & Presisi Antar-Platform*.

---

## [2.2.8] - 2026-09-09
### Penataan Ulang Tata Letak Banner Angkasa Bebas Halangan (Zero-Obstruction Celestial Banner Across All Viewports)

#### Peningkatan Tata Letak & Interaktivitas (Responsive Layout Polish & Zero-Obstruction Artistry)
- **Arsitektur Tata Letak Dua Zona (*Zero-Obstruction 2-Zone Layout*):**
  - Mengisolasi sisi kanan banner secara khusus untuk kanvas visual `CelestialSkyVisual` (matahari, bulan, awan, dan bintang) sehingga pemandangan langit terbentang utuh dan 100% bebas dari tumpukan elemen kartu statistik maupun tombol aksi pada seluruh resolusi.
  - Memindahkan kartu "Bintang Terkumpul" (mode Siswa) dan tombol "Buka Dashboard Guru" (mode Guru) ke kolom kiri di bawah teks deskripsi, menciptakan hierarki informasi alami dari atas ke bawah.
- **Kapsul Glassmorphism Interaktif Siswa (*Interactive Star Trophy Capsule*):**
  - Mengubah tampilan bintang terkumpul menjadi kapsul elegan dengan ikon piala 🏆, teks jumlah perolehan bintang emas, dan indikator petunjuk profil (`Atur nama & koleksi avatar ›`).
  - Menjadikan kapsul bintang interaktif: mengklik kapsul langsung membuka **Modal Profil & Akun Siswa** untuk mengubah nama panggilan serta memilih avatar hewan ceria dengan target sentuh ramah jari (min-h 44px).
- **Penskalaan Responsif Komprehensif (360px HP hingga 4K Smartboard):**
  - **Smartphone Sempit (360px – 640px):** Ilustrasi berskala kompak di kanan tanpa mendesak ruang baca teks sapaan siswa/guru.
  - **Tablet & Laptop (768px – 1280px):** Ilustrasi berskala sedang dengan jarak aman optimal.
  - **Monitor Lebar & Smartboard 4K (>1536px – 4K):** Ilustrasi berskala megah (hingga 420×260 px) dengan pendaran cahaya atmosfer luas tanpa pernah terpotong atau tertutup kartu.

---

## [2.2.7] - 2026-09-09
### Banner Beranda Berbasis Waktu Dinamis (Dynamic Celestial Time Banner: 6 Fase Matahari, Bulan, Bintang & Sapaan Adaptif)

#### Fitur Baru & Peningkatan Estetika Interaktif (Dynamic Celestial Sky & Time-Aware Greetings)
- **Siklus 6 Fase Angkasa Real-Time (*Dynamic 6-Phase Celestial Cycle*):**
  - **Dini Hari / Fajar (03:00 - 05:59):** Menampilkan rona langit fajar ungu-kebiruan, Bintang Kejora (*Morning Star*) bersinar dengan sinar silang 4 arah, serta siluet bulan sabit halus yang mulai memudar.
  - **Pagi Hari (06:00 - 10:59):** Menampilkan matahari terbit sedikit di atas cakrawala (*rising sun*) berpadu pendaran cahaya keemasan hangat dan awan pagi lembut (*"jika pagi maka ada matahari sedikit"*).
  - **Siang Hari (11:00 - 14:59):** Menampilkan matahari penuh benderang (*full midday sun*) dengan sinar pendar melingkar penuh (*sunburst rays*) di langit biru cerah (*"kemudian jika siang maka full"*).
  - **Sore Hari / Senja (15:00 - 18:29):** Menampilkan matahari senja keemasan/oranye yang perlahan turun ke cakrawala (*golden hour / sunset*) dengan awan senja bernuansa hangat.
  - **Malam Hari (18:30 - 23:59):** Menampilkan bulan bersinar lembut bersanding dengan taburan bintang malam berkilau halus (*twinkling stars*) di langit biru indigo pekat.
  - **Tengah Malam (00:00 - 02:59):** Menampilkan bulan sabit anggun di bentangan langit malam pekat (*deep midnight*) yang hening dan tenang.
- **Teks Sapaan & Kutipan Motivasi Dinamis (*Contextual Greeting & Microcopy*):**
  - Mengadaptasi judul sapaan utama secara otomatis: *"Selamat Pagi"*, *"Selamat Siang"*, *"Selamat Sore"*, *"Selamat Malam"*, dan *"Selamat Dini Hari"* untuk Siswa maupun Guru.
  - Menyediakan pesan motivasi yang diselaraskan dengan suasana jam (semangat belajar pagi, energi siang, refleksi sore, relaksasi malam, serta pengingat istirahat tengah malam).
  - Disertai lencana waktu informatif real-time (contoh: `🌅 Pagi Hari • 08:30 WIB`) yang diperbarui otomatis setiap menit.
- **Ilustrasi Vektor SVG Murni & Animasi CSS Ringan (*Lightweight GPU Keyframes*):**
  - Menggunakan grafis SVG murni tanpa aset gambar berat eksternal, berkinerja tinggi 60 FPS pada perangkat berspesifikasi rendah, smartphone Android, maupun layar besar Smartboard IFP.
  - Animasi mikro halus (*celestial-pulse*, *celestial-float*, *star-twinkle*, *horizon-glow*) yang hemat daya dan mematuhi batas durasi gerak nyaman.
  - Komposisi tata letak adaptif dengan pemisahan ruang aman sehingga elemen angkasa tidak menutupi teks bacaan (*Readability First*).

---

## [2.2.6] - 2026-09-09
### Sistem Tema Dark & Light Mode Menyeluruh (App-Wide Theme System & Aesthetic Harmony)

#### Fitur Baru & Peningkatan Antarmuka (Universal Dark & Light Mode)
- **Tombol Alih Tema Terpadu (*Universal Theme Toggle Button*):**
  - Menghadirkan tombol alih tema fleksibel dengan target sentuh ramah jari (minimal 44×44 px) yang ditempatkan secara konsisten di seluruh navigasi utama: Beranda Kuis (*QuizHome*), Dasbor Pendidik (*TeacherDashboard*), Studio Pembuat Kuis (*QuizCreator*), Lobi Siswa (*StudentLobby*), Arena Kuis Interaktif (*QuizArena*), dan Halaman Hasil & Pembahasan (*QuizResult*).
  - Dilengkapi ikon dinamis Matahari (*Sun*) dan Bulan (*Moon*) dengan rotasi halus dan penanda label aksesibilitas (`aria-label`) dwibahasa untuk keterbacaan optimal.
- **Palet Warna Slate Gelap Ergonomis (*Deep Slate Color Harmony*):**
  - Menerapkan palet warna latar belakang *Deep Slate* (`#0B0F19` / `bg-slate-950` / `bg-slate-900`) yang ramah mata dan bebas silau saat ditampilkan pada layar proyektor ruang kelas atau papan interaktif Smartboard (IFP).
  - Memastikan kontras rasio tinggi (*Readability First*) dengan tipografi tajam (`text-slate-100`, `text-white`), batas pemisah halus (`border-slate-800`), dan badge aksen berwarna cerah yang mempertahankan keterbacaan anak-anak maupun guru.
- **Persistensi Preferensi & Sinkronisasi Sistem (*Theme Persistence & System Sync*):**
  - Menyimpan status tema pengguna secara andal di penyimpanan lokal (`localStorage` kunci `kuis_sd_theme`) sehingga preferensi tetap terjaga saat memuat ulang halaman.
  - Mendeteksi preferensi bawaan sistem operasi / browser pengguna (`prefers-color-scheme`) secara otomatis saat pengguna pertama kali mengakses aplikasi.
  - Memperbarui tag meta PWA `<meta name="theme-color">` secara dinamis (`#0F172A` untuk tema gelap dan `#2563EB` untuk tema terang) guna menyelaraskan bilah status browser mobile dan aplikasi terpasang.

---

## [2.2.5] - 2026-09-09
### Sinkronisasi Identitas Peran Beranda & Eliminasi Total Profil Tamu Saat Sesi Guru Aktif

#### Peningkatan Antarmuka & Manajemen Sesi (Role-Based Profile & UX Polish)
- **Sinkronisasi Profil Header Sesuai Peran (*Single Active Role-Based Profile*):**
  - Menggantikan profil tamu siswa (`🦁 Saya / [Nama] | X Bintang`) secara otomatis dengan identitas resmi Guru (`🎓 [Nama Guru] • [Nama Sekolah]`) di sudut kanan atas navbar ketika akun Guru sedang aktif.
  - Menghilangkan duplikasi tombol identitas ganda di header, mengeliminasi kebingungan pengguna di mana profil tamu siswa sebelumnya masih bersanding di samping tombol guru.
  - Menyediakan Modal Profil Guru terintegrasi yang menampilkan nama lengkap, asal sekolah, email pendidik, status akses Pro, pintasan langsung ke *Dashboard Guru*, serta tombol *Logout Akun Guru*.
- **Spanduk Beranda Khusus Pendidik (*Teacher-Centric Welcoming Banner*):**
  - Mengadaptasi spanduk sambutan di beranda utama secara dinamis ketika Guru login: menampilkan sapaan personal *"Halo, [Nama Guru]!"* berlatar *Ruang Pendidik SD*, deskripsi fungsional untuk guru, dan tombol aksi *"Buka Dashboard Guru"*.
  - Menjaga antarmuka siswa tetap ceria saat dalam mode tamu/siswa, serta beralih profesional seketika saat masuk sebagai Guru.

---

## [2.2.4] - 2026-09-09
### Penguncian Scroll Latar Belakang Modal, Label Mapel Tetap Statis, dan Bilah Gulir Horizontal Rapi (Hover Reveal)

#### Peningkatan Antarmuka & Ergonomi Interaksi (UX Polish & Scroll Containment)
- **Penguncian Scroll Latar Belakang Menyeluruh (*Body Scroll Lock & Anti-Chaining*):**
  - Mengintegrasikan pengunci scroll latar belakang berbasis reference counter (`useBodyScrollLock`) pada seluruh dialog dan modal aplikasi (Modal Profil Siswa, Modal Login Guru, Modal Aturan Singkat Kuis, serta Dialog Konfirmasi Keluar Kuis Arena).
  - Mengeliminasi tembusnya scroll (*scroll leakage*) ke halaman belakang saat menggulir dengan sentuhan layar, roda mouse, atau touchpad.
  - Menerapkan `overscroll-behavior: contain` dan penanganan `paddingRight` otomatis untuk mencegah pergeseran layout (*layout shift*) pada desktop saat bilah gulir dikunci.
- **Label Mata Pelajaran Tetap Statis (*Stationary Mapel Label*):**
  - Memisahkan teks dan ikon **"Mapel:"** dari wadah gulir horizontal agar selalu terpancang di sisi kiri dan tidak ikut bergeser saat pengguna menggulir daftar pilihan mata pelajaran.
  - Meningkatkan keterbacaan kategori pelajaran serta mempermudah siswa dan guru dalam membedakan jenjang kelas dan mata pelajaran.
- **Bilah Gulir Horizontal Rapi dengan Efek Hover (*Clean Scrollbar with Hover Reveal*):**
  - Menyembunyikan bilah gulir horizontal secara default pada filter jenjang kelas, filter mata pelajaran, dan tab navigasi dasbor untuk menjaga kerapian antarmuka.
  - Bilah gulir ramping beranimasi halus hanya ditampilkan ketika kursor diarahkan (*hover*) ke area filter, serta memberikan pengalaman geser sentuh alami tanpa gangguan visual pada smartphone dan tablet.

---

## [2.2.3] - 2026-09-09
### Sistem Back Gesture Multi-Input & Navigasi Mundur Bertingkat (Zero-Jump Hierarchy)

#### Fitur Baru & Peningkatan Navigasi (Gesture & Navigation Precision)
- **Dukungan Penuh Multi-Input Back Gesture:**
  - **Layar Sentuh (*Touchscreen Edge Swipe*):** Deteksi usapan dari tepi kiri ke kanan layaknya aplikasi native iOS dan Android modern.
  - **Mouse Khusus (*Mouse Back Button*):** Integrasi tombol samping browser back (tombol 3 dan 4) pada mouse multifungsi.
  - **Peramban & Tombol Fisik (*Browser Popstate & Android Virtual Back*):** Menangkap tombol back peramban dan tombol back perangkat fisik/virtual Android tanpa menutup situs web secara tidak sengaja.
  - **Papan Ketik (*Keyboard Shortcuts*):** Tombol `Escape` dan `Alt + ArrowLeft` untuk desktop, laptop, dan smartboard kelas (IFP).
- **Indikator Umpan Balik Visual Ceria (*Visual Back Feedback Cue*):**
  - Menampilkan kapsul pill animasi mengambang *"‹ Kembali"* di tepi kiri layar secara halus (150–250 ms) sebagai konfirmasi visual interaksi sentuh.
- **Hierarki Navigasi Bertingkat Tanpa Lompatan (*Zero-Jump Strict Priority Stack*):**
  - **Tingkat 1 (Prioritas 100 - Modal & Dialog):** Menutup modal/dialog aktif (Profil Siswa, Login Guru, Aturan Kuis, Polling Smartboard, Konfirmasi Keluar) tanpa mengubah layar di bawahnya.
  - **Tingkat 1 Pengaman (Prioritas 80 - Safety Guard):** Mencegah pembatalan kuis berjalan secara tiba-tiba saat di arena kuis dengan memunculkan dialog konfirmasi terlebih dahulu.
  - **Tingkat 2 (Prioritas 50 - Sub-Langkah & Tab):** Mundur bertahap pada sub-langkah form pembuat kuis (Langkah 3 -> Langkah 2 -> Langkah 1) dan tab dasbor guru (Generator/Buku Nilai -> Daftar Kuis).
  - **Tingkat 3 (Prioritas 20 - Transisi Layar):** Berpindah dari layar sekunder (Cetak LKS, Lobi Siswa, Hasil Kuis, Dasbor Guru) kembali ke Beranda.
  - **Tingkat 4 (Prioritas 10 - Filter & Proteksi Akar Beranda):** Mereset filter kategori aktif di beranda, serta perlindungan ketuk ganda *"Tekan sekali lagi untuk keluar"* di akar beranda.

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
