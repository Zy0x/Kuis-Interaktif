# Catatan Perubahan (Changelog)
Seluruh riwayat rilis dan pembaruan sistem **Kuis Seru** dicatat pada dokumen ini sesuai dengan standar penomoran versi berlanjut.

## [2.2.28] - 2026-09-09
### Perbaikan Penjangkaran Bilah Atas Beranda (*Sticky Header*) saat Digulir Melalui Modernisasi Kontainer `overflow-x-clip` (Home Sticky Header Restoration & Ancestor Scroll Unification)

#### Perbaikan Tata Letak & UX Navigasi (*Layout & Navigation UX*)
- **Pemulihan Perilaku Lengket Bilah Atas (*Sticky Header Restoration*):**
  - Menyelesaikan masalah bilah atas beranda web (*header*) yang tenggelam atau ikut tergulir hilang saat pengguna menelusuri daftar kuis ke arah bawah.
  - Menganalisis dan mengidentifikasi akar kendala teknis pada rantai leluhur DOM: deklarasi `overflow-x: hidden` pada `index.html`, `src/index.css`, dan kontainer pembungkus `src/App.tsx` memaksa peramban mengaktifkan kontainer gulir bersarang (*nested scroll container*), yang membatalkan kalkulasi `position: sticky; top: 0` pada viewport jendela utama.
  - Memutakhirkan seluruh properti pemangkas luapan horizontal dari `overflow-x-hidden` menjadi standar CSS Overflow modern `overflow-x-clip` pada `index.html` (`<body>`), `src/index.css` (`html, body`), dan `src/App.tsx` (`<div className="overflow-x-clip">`).
  - Menjamin bilah navigasi atas di Beranda (`QuizHome`), Ruang Tunggu (`StudentLobby`), Dasbor Guru (`TeacherDashboard`), dan Penyusun Kuis (`QuizCreator`) selalu menempel mantap di puncak layar (`sticky top-0 z-30`) dengan latar kabur lembut (*backdrop blur*) saat konten digulir.
- **Konsistensi Aksesibilitas Bilah Navigasi:**
  - Memastikan seluruh kontrol utama (Logo, Identitas Aplikasi, Avatar Profil Cerdas, dan Pintasan Dasbor) dapat diakses instan oleh pengguna tanpa harus repot menggulir balik ke atas.

#### Verifikasi Quality Gate Multi-Viewport (*Quality Gate Verification*)
- **Pengujian Gulir Lintas Resolusi (Mobile-S hingga Layar Lebar):**
  - Dilakukan pengujian otomatis menggunakan Playwright pada simulasi gulir vertikal sejauh 400px–600px di berbagai ukuran layar: Mobile-S (320×568), Mobile-M (375×667), Mobile-L (412×915), Android rasio tinggi (393×896), Tablet (768×1024), dan Layar Lebar (1280×800).
  - Terverifikasi 100% presisi: posisi koordinat vertikal bilah atas terkunci tepat pada `top = 0px` dengan nilai `hasOverflow: false` di semua skenario.

---

## [2.2.27] - 2026-09-09
### Eliminasi Pemicu Gestur Keluar Palsu saat Menggeser Filter & Penerapan Standar Quality Gate Multi-Viewport (Back Gesture Collision Fix & Responsive Quality Gate)

#### Perbaikan Interaksi & Aksesibilitas (*Interaction Polish & Gesture Isolation*)
- **Pembersihan Pemicu Usap Mundur Palsu (`navigationHistory.ts`):**
  - Menyelesaikan masalah munculnya notifikasi *"Tekan sekali lagi untuk keluar"* ketika pengguna hanya melakukan usapan atau pengguliran horizontal (*horizontal slide/scroll*) pada deretan chip Jenjang Kelas dan Mata Pelajaran di beranda.
  - Menghapus aturan usapan umum (*general horizontal swipe*) yang sebelumnya secara keliru mendeteksi setiap sapuan horizontal di sembarang koordinat layar.
  - Membatasi deteksi usapan kembali secara ketat hanya pada tepi bezel fisik paling kiri (`<= 24px`) dengan sudut mendatar tegas (`deltaY <= 30px`).
  - Menambahkan pemeriksa hierarki kontainer gulir (`isInsideScrollable(targetEl)`): jika sentuhan dimulai di dalam elemen yang dapat digulir horizontal (`overflow-x-auto`, `overflow-x-scroll`, atau `scrollWidth > clientWidth`), pelacakan gestur kembali otomatis dinonaktifkan seketika.
- **Pembaruan Spesifikasi Meta PWA Modern (`index.html`):**
  - Menambahkan `<meta name="mobile-web-app-capable" content="yes" />` mendampingi tag apple legacy untuk kepatuhan penuh peramban modern.

#### Standar Quality Gate Responsivitas Multi-Viewport (*Quality Gate Inspection*)
- **Verifikasi Lintas Rentang Layar Android & Desktop:**
  - Melakukan inspeksi komprehensif pada Mobile-S (320×568), Mobile-M (375×667), Mobile-L (412×915), Android rasio tinggi non-reguler 20.5:9 (393×896), Tablet (768×1024), hingga layar 4K (2560×1440).
  - Memastikan seluruh tampilan beranda, arena kuis, ruang tunggu, dasbor guru, dan penyusun kuis memiliki nilai `hasOverflow: false` dengan toleransi nol pergeseran horizontal.

---

## [2.2.26] - 2026-09-09
### Perbaikan Tuntas Bilah Atas Arena Kuis pada Layar Ponsel: Penjangkaran Viewport Fixed dan Proteksi Notch Status Bar (Mobile Arena Header Viewport Lock & Notch Protection)

#### Perbaikan Bug & Presisi Mobile-First (*Mobile-First Responsive Fix*)
- **Penjangkaran Viewport Arena Kuis Penuh (`QuizArena`):**
  - Menyelesaikan kendala bilah atas (*header*) arena kuis (Nomor Soal, Timer, Tombol Jeda, dan Menu Alat) yang terpotong atau tidak tampil pada perangkat ponsel (Mobile-S 320px, Mobile-M 375px, dan Mobile-L 425px).
  - Mengubah wadah utama arena kuis dari elemen alur normal bertinggi relatif menjadi penjangkaran mutlak terhadap viewport jendela (`fixed inset-0 z-30 w-full h-full h-[100dvh]`), mengeliminasi pergeseran vertikal akibat padding dokumen atau pergeseran posisi scroll dari halaman sebelumnya.
- **Proteksi Takik Ponsel & Area Aman (*Safe Area Inset Notch & Status Bar Protection*):**
  - Menambahkan bantalan atas area aman adaptif `pt-[max(env(safe-area-inset-top),0.625rem)]` pada bilah atas arena kuis.
  - Menjamin seluruh tombol navigasi atas (Keluar `[ ✕ ]`, Nomor Soal, Indikator Waktu, Tombol Jeda, dan Menu Alat) tampil 100% utuh dan tidak lagi terhalang oleh lubang kamera ponsel (*punch-hole*), takik (*notch*), maupun bilah status sistem Android/iOS.
  - Menyelaraskan padding area aman atas pada seluruh bilah navigasi aplikasi: `QuizHome`, `StudentLobby`, `TeacherDashboard`, dan `QuizCreator`.
- **Reset Scroll Layar & Pengendalian Riwayat Navigasi (`App.tsx`):**
  - Mengonfigurasi `window.history.scrollRestoration = 'manual'` dan menyuntikkan reset gulir otomatis (`window.scrollTo(0, 0)`) setiap kali terjadi transisi layar aplikasi (*screen state change*).
  - Menjamin ketika pengguna menggulir daftar kuis di beranda lalu menekan *"Mulai Kuis"*, layar arena kuis langsung dimuat pada posisi paling atas secara presisi.

---

## [2.2.25] - 2026-09-09
### Arsitektur Header Ultra-Compact Mobile dengan Smart Avatar dan Quick Action Sheet Overlay (Mobile Ultra-Compact Header & Bottom Sheet Actions)

#### Antarmuka Pengguna & Presisi Mobile-First (*Mobile-First Responsive Precision*)
- **Arsitektur Header Ultra-Compact Mobile (`QuizHome`):**
  - Mengatasi kepadatan tombol di bilah atas (*navbar*) pada perangkat mobile (Mobile-S 320px, Mobile-M 375px, dan Mobile-L 425px) dengan menerapkan sistem hibrida cerdas.
  - Pada layar ponsel (`<640px` / `<sm`), seluruh tombol yang sebelumnya memenuhi header (Sakelar Tema, Tombol Audio, dan Pil Akun) dikonsolidasikan menjadi satu tombol **Smart Avatar** ramah sentuhan (target sentuh minimal 44×44px) di sisi kanan atas.
  - Memberikan ruang horizontal ekstra (~136px pada layar 320px) sehingga logo dan nama aplikasi `Kuis Seru` dapat bernapas lega tanpa distorsi, pembungkusan teks (*warping*), maupun penambahan tinggi bilah header.
  - Pada layar tablet, desktop, dan papan interaktif kelas IFP SmartBoard (`≥640px` / `≥sm`), toolbar lengkap tetap dipertahankan untuk akses langsung 1-klik yang efisien.
- **Lembar Aksi Cepat Bawah Ponsel (`MobileProfileSheet`):**
  - Menghadirkan komponen modal *bottom sheet* bergaya aplikasi *native* yang meluncur mulus dari bawah saat tombol Smart Avatar ditekan.
  - Dilengkapi bilah pegangan geser (*drag bar*), tombol tutup cepat, penguncian gulir latar belakang (*Body Scroll Lock*), serta integrasi tombol kembali fisik Android (*Hardware Back Button*) prioritas 80.
  - Menampilkan ringkasan status akun pengguna yang kontekstual:
    - **Guru:** Lencana *Guru Pro*, nama sekolah, dan email dinas.
    - **Siswa:** Nama panggilan, jenjang kelas, serta jumlah perolehan bintang prestasi.
    - **Tamu:** Status tamu ramah anak dengan ajakan personalisasi avatar.
  - Menyediakan ubin sakelar cepat (*Quick Settings Tiles*) berukuran 64px (target sentuh 48px) untuk **Mode Tampilan (Terang / Gelap)** dan **Efek Suara (SFX Aktif / Senyap)** lengkap dengan lencana indikator status.
  - Tombol tindakan utama akun disesuaikan dengan peran: akses ke Dashboard Guru, pengelolaan profil/sekolah, pergantian maskot avatar, masuk/daftar akun, hingga keluar sistem secara aman.

---

## [2.2.24] - 2026-09-09
### Inspeksi dan Perombakan Menyeluruh Responsivitas Lintas Viewport: Mobile-S (320px) hingga IFP SmartBoard 4K (Comprehensive Multi-Viewport Precision & Zero-Overflow Refactor)

#### Antarmuka Pengguna & Presisi Mobile-First (*Mobile-First Responsive Polish*)
- **Penataan Fleksibel Beranda (`QuizHome`):**
  - Mengatasi kendala pemotongan teks logo (`Kui...`) pada viewport Mobile-S 320px dengan mentransformasikan pill profil akun (Guru & Siswa) menjadi *icon-only* (target sentuh 44×44px) secara adaptif pada layar `<360px` (`<xs`), menjaga teks logo `Kuis Seru` tetap utuh dan jelas.
  - Kartu input PIN kilat kini beralih otomatis dari baris menjadi susunan vertikal (`flex-col xs:flex-row`) pada layar berukuran sempit, memastikan kolom input dan tombol aksi *"Masuk Kuis ➔"* tetap proporsional tanpa pergeseran horizontal (*zero horizontal scrollbar*).
  - Spanduk instalasi PWA (`InstallPrompt`) dipoles penuh dengan dukungan tema gelap (*dark-mode*), padding inset area aman (*safe-area-inset-bottom*), serta ukuran tombol yang padat dan presisi.
- **Header Adaptif Dashboard Guru (`TeacherDashboard`):**
  - Mengatur ulang komposisi header pada layar sempit: menyembunyikan ikon dekoratif pada `<360px`, memotong teks nama panjang secara anggun (*truncate*), serta menampilkan tombol *"Buat Kuis"* dalam bentuk ikon `[ + ]` ringkas sehingga tombol Tema, Tambah Kuis, dan Keluar Akun muat 100% di layar 320px tanpa terdorong ke luar layar.
  - Tab navigasi koleksi kuis dan rekap nilai siswa kini dilengkapi `flex-shrink-0` dan bilah gulir halus (*horizontal scrollbar*), menjamin keterbacaan penuh di semua variasi resolusi ponsel Android non-reguler.
- **Studio Penyusun Kuis (`QuizCreator`):**
  - Header disederhanakan menjadi *"Studio Kuis Guru 🧑‍🏫"* dengan judul terpotong rapi (*truncate*) dan menyembunyikan lencana soal redundan pada layar `<640px`.
  - Label tab 3 langkah adaptif: bertransformasi menjadi `1. Info`, `2. Soal (X)`, dan `3. Simpan` pada viewport `<360px`.
- **Ruang Tunggu Siswa (`StudentLobby`):**
  - Header navigasi disesuaikan menjadi `← Katalog` pada `<360px` serta menyembunyikan teks pendukung guna membebaskan ruang untuk tombol pengubah tema.
- **Halaman Hasil Kuis (`QuizResult`):**
  - Bilah tombol aksi sticky footer dipoles dengan gap responsif (`gap-1.5 xs:gap-2.5`) dan padding aman, memastikan tombol Beranda, Main Lagi, Bagikan Skor, dan Ganti Tema muat secara serasi pada layar 320px.
- **Format Cetak LKS (`WorksheetPrintView`):**
  - Tombol bilah atas dibuat ringkas (*Kembali* dan *Cetak*) pada layar perangkat mobile, menjaga kenyamanan pratinjau sebelum cetak.
- **Pengamanan Global Viewport (`App.tsx`):**
  - Menambahkan pembungkus global `w-full max-w-full overflow-x-hidden` untuk menjamin stabilitas layar terhadap pergeseran horizontal tak disengaja di seluruh platform.

#### Kerapian Bahasa & Keterbacaan (*Readability First*)
- **Pembersihan Imbuhan Kata 'SD' Redundan:**
  - Menyelaraskan seluruh judul aplikasi, pesan salam (*time greetings*), keterangan LKS, dan footer menjadi netral dan berjenjang alami (`Kuis Seru`, `Ruang Pendidik`, `LEMBAR KERJA SISWA (LKS) INTERAKTIF`, `Kuis Interaktif Seru • Platform Belajar Terpadu`) sesuai prinsip desain tanpa label jenjang yang kaku.

---

## [2.2.23] - 2026-09-09
### Perombakan Responsivitas Menyeluruh Arena Kuis: Dari Mobile-S (320px) hingga SmartBoard IFP 4K (Comprehensive Responsive Arena Overhaul & Mobile Tools Drawer)

#### Antarmuka Pengguna & Responsivitas Mobile-First (*Mobile-First Responsive Polish*)
- **Penataan Ulang Header Arena Kuis Satu Baris (*Single-Row Header Architecture*):**
  - Mengeliminasi penumpukan dan pembengkakan tinggi (*warping*) pada header arena kuis di perangkat mobile berlayar kecil (Mobile S 320px, Mobile M 375px, Mobile L 425px).
  - Mengelompokkan tombol kontrol kuis di perangkat mobile (<640px) menjadi tombol aksi cepat utama (*Jeda/Lanjut*) serta pemicu menu alat (*Mobile Tools Trigger* `[ ⋮ ]`).
  - Menyembunyikan atau memotong teks judul kuis secara adaptif sesuai lebar layar agar indikator nomor soal (`Soal 1/4`) dan pil pengatur waktu kuis tetap proporsional tanpa saling tumpang tindih.
- **Laci Pengaturan & Fitur Sesi Mobile (*Mobile Tools Sheet Modal*):**
  - Menghadirkan modal bottom-sheet alat mobile yang ramah sentuhan (target sentuh minimum 48px) untuk mengakses pengaturan tema (Terang/Gelap), efek suara (SFX), musik latar prosedural (BGM), mode layar penuh (Fullscreen), dan pencatatan suara kelas (Polling).
  - Terintegrasi dengan sistem navigasi tombol kembali Android (*Hardware Back Button*) prioritas tingkat 1 (100) serta penguncian gulir latar belakang (*Body Scroll Lock*).

#### Skalabilitas Layar Besar & Papan Interaktif (*SmartBoard & IFP Classroom Optimization*)
- **Skalabilitas Kartu & Tipografi Kelas:**
  - Kartu kuis kini berskala secara bertingkat dari `max-w-2xl` di perangkat mobile hingga `max-w-5xl` pada layar desktop dan papan tulis digital interaktif (*IFP SmartBoard 1080p / 4K*).
  - Ukuran teks soal dan pilihan ganda meningkat proporsional (hingga `2xl:text-3xl`) sehingga dapat dibaca dengan jelas oleh seluruh siswa di ruang kelas dari jarak jauh.
  - Target sentuh tombol opsi jawaban dan navigasi diperbesar secara dinamis (hingga 72px pada IFP) untuk kenyamanan penggunaan jari maupun pena stylus interaktif.
- **Penyempurnaan Alur Gulir & Penanganan Orientasi Layar:**
  - Memperbaiki penataan flexbox menggunakan `my-auto` agar konten soal yang panjang atau memiliki ilustrasi tinggi dapat digulirkan secara alami dari atas ke bawah tanpa terpotong di bagian atas pada layar pendek atau orientasi landscape.
  - Memastikan spanduk instalasi PWA hanya aktif di beranda utama (`home`) dan tidak menutupi tombol navigasi di dalam arena kuis.

---

## [2.2.22] - 2026-09-09
### Otomatisasi Kapitalisasi Input PIN Kuis: Eliminasi Human-Error Huruf Kecil/Besar (Auto-Uppercase PIN Input & Case-Insensitive Matching)

#### Pengalaman Pengguna & Validasi Input (*UX Polish & Input Normalization*)
- **Transformasi Otomatis Huruf Kapital pada Input PIN:**
  - Input teks PIN kuis pada beranda (`QuizHome`) kini secara otomatis mentransformasikan setiap karakter huruf yang diketik menjadi huruf kapital (`e.target.value.toUpperCase()`).
  - Menghilangkan potensi kesalahan tak disengaja pengguna akibat perbedaan penggunaan *Caps Lock* atau keyboard perangkat ponsel.
  - Menambahkan kelas CSS visual `uppercase tracking-wider font-mono` untuk penyajian teks PIN yang rapi dan konsisten, dengan placeholder natural (`Masukkan PIN Kuis...`).
- **Pencocokan PIN Fleksibel (*Case-Insensitive Database & Local Matching*):**
  - Pada lapisan `DataManager` dan `supabaseClient.ts`, pencarian kuis via PIN dinormalisasi menggunakan `trim().toUpperCase()` baik untuk kueri Supabase maupun fallback data lokal, memastikan kecocokan 100% tanpa sensitivitas huruf.

---

## [2.2.21] - 2026-09-09
### Penyederhanaan Label Jenjang Kelas: Eliminasi Redundansi Imbuhan 'SD' (Clean Grade Level Nomenclature Polish)

#### Antarmuka Pengguna & Keterbacaan (*UI Typography & Minimalist Polish*)
- **Penyederhanaan Penamaan Jenjang Kelas Berurutan:**
  - Menghilangkan kata 'SD' yang redundan pada tombol filter beranda (`QuizHome`), mengubah label dari *"Kelas 1 SD"* s.d. *"Kelas 6 SD"* menjadi lebih ringkas dan proporsional: **`Kelas 1`**, **`Kelas 2`**, **`Kelas 3`**, **`Kelas 4`**, **`Kelas 5`**, dan **`Kelas 6`**.
  - Memperbarui teks indikator penyaringan di beranda menjadi *"Khusus Kelas {grade}"* dan judul bagian menjadi *"Tingkat Kelas"*.
- **Penyelarasan Menyeluruh Lintas Komponen Aplikasi:**
  - **Portal Autentikasi (`UnifiedAuthModal`):** Mengganti label pilihan pendaftaran siswa dari *"Kelas {g} SD"* menjadi *"Kelas {g}"*.
  - **Studio Pembuat Kuis (`QuizCreator`):** Memperbarui formulir pemilihan target kelas dan kartu pratinjau menjadi *"Target Kelas"* dan *"Kelas {grade}"*.
  - **Lobi PIN Siswa (`StudentLobby`):** Mempercantik pill informasi kuis menjadi *"Kelas {grade}"*.
  - **Cetak LKPD (`WorksheetPrintView`):** Menyelaraskan informasi tingkat lembar kerja menjadi *"Tingkat: Kelas {grade}"*.
  - **Layar Hasil Akhir (`QuizResult`):** Memperbarui teks subjudul informasi kuis menjadi *"Kuis: {title} (Kelas {grade})"*.
  - **Generator Kilat Soal (`TeacherDashboard`):** Menyelaraskan teks instruksi generator menjadi *"Pilih Tingkat Kelas:"*.

---

## [2.2.20] - 2026-09-09
### Mesin Persistensi Status Layar & Pemulihan Progres Kuis saat Muat Ulang Halaman (Navigation State & In-Progress Quiz Persistence Engine)

#### Navigasi & Pemulihan Layar (*Screen State & Refresh Resilience Engine*)
- **Persistensi Layar Dinamis Menghadapi Reload / F5:**
  - Mengimplementasikan `src/lib/navigationState.ts` yang menyinkronkan status layar aktif (`ScreenState`), ID kuis aktif, kode PIN, tab aktif guru, jawaban sebelumnya, dan durasi pengerjaan.
  - Memanfaatkan sinergi parameter URL query (`?screen=...&quiz=...&tab=...`) dan `sessionStorage` (`kuis_app_nav_session_v1`) agar perpindahan dan muat ulang halaman berlangsung presisi tanpa ketergantungan konfigurasi server rewrite.
  - Saat pengguna memuat ulang halaman (*F5* atau *pull-to-refresh*) di Dashboard Guru (`teacher-dashboard`), Studio Pembuat Kuis (`creator`), Arena Kuis (`arena`), Lobi PIN Siswa (`student-lobby`), Lembar Hasil (`result`), maupun Cetak LKPD (`worksheet-print`), aplikasi tetap bertahan di layar yang bersangkutan.
- **Bypass Animasi Splash Otomatis Saat Refresh:**
  - Menghilangkan tampilan animasi splash yang redundan saat memuat ulang layar aktif atau jika pengguna telah melewati splash di sesi peramban yang sama (`kuis_splash_seen_v1`), menjaga efisiensi interaksi.
- **Sinkronisasi Tab Pendidik:**
  - Tab aktif di Dashboard Guru (*Koleksi Kuis*, *Rekap Nilai Siswa*, dan *Generator Kilat Soal*) terikat ke parameter URL (`?tab=...`), sehingga saat tab Rekap Nilai dimuat ulang, tampilan tetap bertahan pada rekap nilai tanpa kembali ke tab pertama.

#### Ketahanan Data Pengerjaan Siswa & Draf Pembuatan Kuis (*Zero Data Loss Safeguards*)
- **Pemulihan Progres Pengerjaan Soal Siswa di Arena Kuis (`QuizArena`):**
  - Progres pengerjaan soal siswa (nomor soal aktif, riwayat jawaban yang sudah dikunci, sisa timer, total durasi, dan streak) tersimpan otomatis di `sessionStorage` (`kuis_arena_progress_{quizId}`).
  - Jika koneksi atau halaman termuat ulang di tengah kuis, siswa langsung melanjutkan pada nomor soal yang sedang dikerjakan tanpa kehilangan poin atau jawaban sebelumnya.
  - Progres otomatis dibersihkan secara bersih saat kuis telah diselesaikan atau saat siswa mengonfirmasi keluar kuis secara sukarela.
- **Penyimpanan Draf Otomatis Studio Pembuat Kuis (`QuizCreator`):**
  - Mengintegrasikan mesin *auto-save draft* ke `localStorage` (`kuis_creator_draft_v1`) yang menyimpan seluruh masukan judul, deskripsi, mata pelajaran, jenjang kelas, durasi per soal, visibilitas, hingga butir bank soal yang telah disusun.
  - Membuka kembali Studio Pembuat Kuis atau memuat ulang browser akan memulihkan formulir secara instan.
  - Menyediakan tombol *Reset Draf* dengan dialog konfirmasi in-app yang elegan serta pembersihan otomatis saat kuis berhasil disimpan dan diterbitkan.

#### Antarmuka & Kepatuhan Standar (*UI Polish & Non-System Dialogs*)
- **Pembersihan Total Dialog Sistem (`window.alert` & `window.confirm`):**
  - Mengganti seluruh sisa panggilan `alert()` pada `QuizCreator` dengan notifikasi melayang (*floating in-app toast*) yang estetik, modern, dan tidak memblokir interaksi peramban.
  - Menggantikan dialog konfirmasi reset draf peramban dengan modal konfirmasi in-app yang konsisten dengan tema terang/gelap.

---

## [2.2.19] - 2026-09-09
### Penyempurnaan Desain Antarmuka: Eliminasi Teks Berlebih & Jargon Teknis pada Portal Akun (Clean UI Polish & Technical Jargon Elimination)

#### Antarmuka Pengguna & Keterbacaan (*UI Design & Readability Polish*)
- **Pembersihan Total Teks Status & Jargon Teknis:**
  - Mengeliminasi bilah status teknis (*"Sinkronisasi Cloud Supabase Aktif"*) pada dialog autentikasi terpadu (`UnifiedAuthModal`).
  - Menghapus kotak promosi fitur berbasis ikon kilau (*Sparkles*) di bawah form masuk guru demi menyajikan pengalaman masuk yang bersih, profesional, dan fokus pada formulir utama.
  - Memperbarui tajuk modal menjadi ringkas dan komunikatif: *"Masuk / Daftar Akun"* dengan deskripsi *"Pilih peran Anda untuk melanjutkan"*.
- **Penyelarasan Bahasa Alami pada Seluruh Modul Pengguna:**
  - Menghilangkan frasa teknis pada modal profil siswa di beranda (`QuizHome`), mengganti istilah berbasis backend/cloud menjadi bahasa alami yang ramah anak (*"Simpan prestasi belajar Anda"*, *"Prestasi tersimpan di akun"*, dan *"Bintang Terkumpul"*).
  - Menyederhanakan tampilan modal profil guru dengan menghapus blok deskripsi hak akses yang bertele-tele dan menyisakan aksi navigasi penting (*"Buka Dashboard Guru"* dan *"Keluar Akun Guru"*).
  - Mengganti ikon kilau pada generator soal di Dashboard Guru dengan ikon edukasi buku terbuka (`BookOpen`) yang lebih sesuai dengan ranah pedagogis sekolah.

---

## [2.2.18] - 2026-09-09
### Portal Akun Terpadu Guru & Siswa, Visibilitas Kuis Publik/Privat, dan Isolasi Bank Kuis Master (Unified Account Portal, Public/Private Quiz Visibility, and Multi-Tenant Teacher Bank)

#### Autentikasi & Pengalaman Masuk Pengguna (*Unified Entry & Identity Management*)
- **Portal Autentikasi Terpadu (*Single-Entry Unified Auth Portal*):**
  - Menggabungkan autentikasi pendidik dan siswa dalam satu dialog modal terpadu (`UnifiedAuthModal`) dengan tab tersegmentasi yang bersih: 🎓 **Pendidik / Guru** dan 🎒 **Siswa / Pelajar**.
  - Mengeliminasi tombol *Guru Demo* secara permanen demi kepatuhan integritas akun dan autentikasi nyata berbasis sesi cloud/lokal.
  - Mempertahankan akses bermain instan bagi siswa dengan opsi *"Tetap Bermain di Mode Tamu"* tanpa mewajibkan registrasi awal.
- **Navigasi Dinamis & Ringkas Berbasis Status Masuk:**
  - Navbar beranda kini menampilkan pill terpadu: saat belum masuk menyajikan tombol *"Masuk / Akun"* berdampingan dengan avatar mode tamu; saat pendidik masuk bertransformasi menjadi pill nama guru dan asal instansi dengan menu profil mandiri; saat siswa terdaftar masuk menampilkan pill nama, kelas, dan jumlah bintang pencapaian.

#### Tata Kelola Konten & Visibilitas Kuis (*Quiz Visibility & Privacy Engine*)
- **Dukungan Kuis Publik vs Privat (*Public & Private Quiz Modes*):**
  - Menambahkan atribut visibilitas kuis (`visibility: 'public' | 'private'`).
  - **Kuis Publik:** Ditampilkan secara terbuka di beranda katalog kuis siswa sesuai jenjang kelas dan mata pelajaran yang relevan.
  - **Kuis Privat:** Disembunyikan dari etalase publik dan hanya dapat diakses secara eksklusif melalui masukan 4 digit PIN kuis kelas atau tautan langsung yang dibagikan pendidik.
- **Kendali Visibilitas Fleksibel di Panel Guru & Studio Pembuat:**
  - Menyediakan tombol peralihan 1-klik (*1-click instant toggle*) pada setiap kartu kuis di **Dashboard Guru** untuk mengubah status antara `🌐 Publik` dan `🔒 Privat`.
  - Mengintegrasikan selektor kartu radio visibilitas pada tahap pembuatan kuis di `QuizCreator` dengan deskripsi panduan yang informatif.

#### Isolasi Koleksi Kuis & Hibah Kepemilikan Master Guru (*Multi-Tenant Isolation & Master Account*)
- **Isolasi Bank Soal Antar-Guru:**
  - Setiap pendidik yang mendaftar atau masuk ke sistem kini hanya melihat, mengedit, dan mengelola bank kuis yang dibuat oleh akunnya sendiri. Guru baru memulai dengan bank kuis bersih (`0` kuis) disertai panduan pembuatan kuis kilat.
- **Koleksi Kuis Awal Dikelola Penuh oleh Master Teacher:**
  - Seluruh kuis bawaan dan koleksi kuis awal secara otomatis dihibahkan dan diikat kepemilikannya ke akun pendidik utama master (`zy0x.noir@gmail.com`).
  - Akun master memiliki visibilitas dan hak kelola menyeluruh atas seluruh kuis koleksi awal.

---

## [2.2.17] - 2026-09-09
### Penegakan Hak Akses Berbasis Peran Ketat: Proteksi Penuh Siswa & Tamu dari Modifikasi/Penghapusan Kuis (Strict Role-Based Access Control - RBAC Enforcement)

#### Keamanan Sistem & Tata Kelola Peran (*RBAC & Data Protection Engine*)
- **Penegakan Hak Akses Role Siswa & Tamu (*Read-Only Quiz Access*):**
  - Mengonfigurasi model RBAC formal (`ROLE_PERMISSIONS` & `UserRole`) di mana Siswa dan Tamu berstatus murni *read-only* terhadap katalog kuis (`canPlayQuiz: true`, `canCreateQuiz: false`, `canEditQuiz: false`, `canDeleteQuiz: false`).
  - Menghilangkan total seluruh tombol aksi hapus (`Trash2`) atau modifikasi dari antarmuka beranda ketika diakses oleh peran Siswa maupun Tamu.
- **Proteksi Rute Layar Sensitif (*Screen & Route Guarding*):**
  - Menambahkan *route guard* reaktif pada `App.tsx` yang secara otomatis mengalihkan navigasi kembali ke beranda jika pengguna tanpa sesi Guru aktif berusaha mengakses layar pembuat kuis (`creator`) atau panel guru (`teacher-dashboard`).
  - Komponen `QuizCreator` hanya dirender jika terverifikasi memiliki sesi Guru aktif.
- **Validasi Ketat di Lapisan Data (*DataManager Layer Authorization*):**
  - Menyematkan validasi kredensial peran Guru pada `saveCustomQuiz` dan `deleteCustomQuiz` di `supabaseClient.ts`. Setiap pemanggilan mutasi tanpa profil guru akan ditolak seketika (*Access Denied Exception*).
  - Mengikat identitas pembuat (`creatorId` & `creatorName`) secara mutlak ke sesi Guru yang sah saat kuis dibuat.
- **Penguatan Kebijakan Database Supabase RLS (*Database Row Level Security Hardening*):**
  - Memperbarui [docs/setup.sql](file:///E:/Data/GitHub/Kuis%20Interaktif/docs/setup.sql) dengan kebijakan RLS berkeamanan tinggi (`Teachers Manage Own Quizzes` dan `Teachers Manage Questions For Own Quizzes`).
  - Memastikan secara arsitektural database bahwa peran Siswa, Tamu, maupun *anon public key* tidak dapat menjalankan operasi `INSERT`, `UPDATE`, maupun `DELETE` pada tabel `quizzes` dan `quiz_questions`.

---

## [2.2.16] - 2026-09-09
### Eliminasi Dialog Bawaan Peramban & Penerapan Modal Konfirmasi Hapus In-App Kustom (Custom In-App Delete Confirmation Modal & System Dialog Elimination)

#### Antarmuka Pengguna & Dialog Interaktif (*UI & Modal Experience Polish*)
- **Penggantian Penuh `window.confirm` Bawaan Browser:**
  - Mengeliminasi seluruh popup dialog sistem bawaan peramban (`localhost says: Yakin ingin menghapus kuis ini?`) yang kaku dan mengganggu estetika web.
  - Menghadirkan komponen reusable baru `ConfirmDeleteModal` dengan desain modern glassmorphic, visual backdrop blur halus (`backdrop-blur-sm`), dan animasi kartu masuk yang mulus.
- **Kejelasan Konteks & Keamanan Tindakan (*Action Clarity & Safety Guard*):**
  - Menampilkan lencana ikon peringatan hapus (`Trash2`) dalam lingkaran merah lembut tematik.
  - Menyebutkan secara eksplisit judul kuis yang akan dihapus (misal: *"Latihan Kilat Matematika Kelas 3"*) beserta pesan peringatan permanen agar guru terhindar dari kesalahan hapus tak disengaja.
  - Menyediakan dua tombol berjarak aman: tombol netral "Batal" dan tombol destruktif berpenegasan "Ya, Hapus Kuis".
- **Presisi Mobile-First & Aksesibilitas:**
  - Kedua tombol mematuhi standar ukuran sentuh minimal 44×44 px (`min-h-[44px]`).
  - Terintegrasi otomatis dengan penguncian scroll latar (`useBodyScrollLock`) dan dukungan tombol kembali Android/Desktop (`useBackHandler`) berprioritas tinggi.
- **Konsistensi Lintas Modul:**
  - Diterapkan menyeluruh pada **Dashboard Guru** (`TeacherDashboard`) dan kartu kuis beranda (`QuizHome`).
  - Menggantikan `alert()` bawaan browser pada ekspor rekapan pengerjaan kosong menjadi notifikasi peringatan in-app yang elegan dan non-intrusif.

---

## [2.2.15] - 2026-09-09
### Musik Latar In-Game Prosedural Adaptif & Tombol Kontrol Musik Mandiri (Procedural Web Audio In-Game BGM with Adaptive Dynamics)

#### Fitur Audio & Musik Latar (*In-Game Procedural BGM Engine*)
- **Sintesis Audio Prosedural Murni (*Zero-Asset Web Audio API Synthesis*):**
  - Mengimplementasikan generator musik in-game langsung via Web Audio API tanpa perlu mengunduh file MP3/OGG berukuran besar (0 KB network overhead, zero latency, 100% ramah offline PWA).
  - Menghasilkan nada ceria pentatonik C Mayor bernuansa marimba, bass santai ramah anak, dan shaker ritmis teratur yang meningkatkan fokus dan keseruan siswa saat menjawab soal.
- **Dinamika Musik Adaptif (*Dynamic Audio States & Ducking*):**
  - **Auto-Ducking:** Volume musik latar otomatis turun perlahan ke ~22% saat siswa memilih jawaban, memastikan efek suara (SFX) benar atau salah terdengar jernih tanpa tabrakan frekuensi.
  - **Akselerasi Tempo:** Tempo ritme otomatis berakselerasi dari 110 BPM menjadi 128 BPM pada 5 detik terakhir hitung mundur soal untuk memberikan stimulasi ketegangan positif.
  - **Sinkronisasi Jeda Guru & Modal Keluar:** Musik otomatis dijeda (*paused*) saat tombol jeda guru ditekan atau saat modal konfirmasi keluar ditampilkan, dan otomatis melanjutkan saat kuis diteruskan.
  - **Penghentian Bersih:** Musik otomatis berhenti total (*stopped & memory cleanup*) ketika kuis selesai menuju rekap skor atau ketika pengguna keluar dari arena kuis.
- **Tombol Kontrol Musik Mandiri di Header Arena (*Independent BGM Toggle*):**
  - Menyediakan tombol ikon musik (🎵) tersendiri di header `QuizArena` tepat di sebelah tombol efek suara (🔊), sehingga pengguna dapat mengatur musik latar dan efek suara secara independen.
  - Preferensi musik latar tersimpan persisten di penyimpanan lokal peramban (`localStorage` key `'kuis_sd_bgm_muted'`).
  - Mematuhi ukuran target sentuh minimal 44×44 px dengan indikator dot visual status bisu (*mute dot indicator*).

---

## [2.2.14] - 2026-09-09
### Otomatisasi Tema Berbasis Waktu Nyata: 18.00–07.00 Gelap & 07.00–18.00 Terang (Time-Aware Automatic Dark & Light Mode System)

#### Fitur Tema & Otomatisasi Waktu (*Time-Driven Ambient Theme Engine*)
- **Aturan Tema Berbasis Jam Lokal (*Automated Circadian Theme Logic*):**
  - **Malam Hari (18.00 - 06.59.59):** Aplikasi secara otomatis menerapkan **Mode Gelap (*Dark Theme*)** untuk kenyamanan mata pengguna di malam hari.
  - **Siang Hari (07.00 - 17.59.59):** Aplikasi secara otomatis menerapkan **Mode Terang (*Light Theme*)** dengan latar bersih dan kontras tinggi.
- **Deteksi Jam Otomatis Tanpa Kedip (*Zero-Flicker Inline Boot Script*):**
  - Menanamkan inisialisasi skrip langsung pada `<head>` di `index.html` sehingga tema gelap/terang terpasang instan pada milidetik ke-0 tanpa ada kedipan putih (*no flash of unstyled theme*).
- **Sinkronisasi Waktu Nyata (*Live Heartbeat Check*):**
  - Memeriksa waktu lokal perangkat secara berkala setiap 30 detik melalui `useTheme`, sehingga jika pengguna menggunakan aplikasi saat jam melintasi batas 18:00 atau 07:00, tema akan berpindah secara halus.
- **Dukungan Toggle Manual Pengguna:**
  - Pengguna tetap memiliki kebebasan penuh menekan tombol toggle tema (Matahari / Bulan) di bilah navigasi untuk berganti mode sesuai preferensi ruang baca saat itu, yang tersimpan aman pada sesi peramban.

---

## [2.2.13] - 2026-09-09
### Relokasi Proyek ke Disk E: & Pembersihan Penuh Disk C: Sistem (Full Project Migration to E:\Data\GitHub\Kuis Interaktif)

#### Manajemen Ruang Kerja & Infrastruktur (*Workspace & Infrastructure Migration*)
- **Migrasi Penuh ke Partisi Data (`E:\Data\GitHub\Kuis Interaktif`):**
  - Memindahkan seluruh kode sumber, konfigurasi PWA, aset, dan riwayat repositori Git dari direktori sementara Disk C ke direktori kerja permanen di `E:\Data\GitHub\Kuis Interaktif`.
  - Mengonfigurasi dependensi dan deduplikasi bundler Vite (`resolve.dedupe: ['react', 'react-dom']`) untuk stabilitas eksekusi lintas partisi penyimpanan.
- **Pembersihan Bersih Disk C: Sistem Windows (*Complete System Drive Cleanup*):**
  - Menghapus direktori proyek lama di partisi C: secara tuntas (`Remove-Item -Recurse -Force`), menjaga integritas dan keleluasaan kapasitas penyimpanan partisi sistem operasi Windows.
- **Server Pengembangan Berjalan di Lokasi Baru:**
  - Menjalankan kembali server Vite Dev Server langsung dari direktori baru di drive E: dan memverifikasi fungsionalitas aplikasi tetap 100% normal tanpa eror.

---

## [2.2.12] - 2026-09-09
### Sinkronisasi Jam Lokal Akurat & Eliminasi Istilah Zona Waktu Bias (Strict Device Local Time & Timezone Bias Removal)

#### Peningkatan Logika Waktu & Presisi UI (*Time & Localization Polish*)
- **Penyelarasan Jam Lokal Otomatis Berbasis UTC (*Strict Local Time Clock*):**
  - Memperbarui `useTimeGreeting` agar secara murni mengonversi stempel waktu UTC menjadi format waktu lokal perangkat pengguna (`HH:mm`) secara akurat tanpa bias wilayah.
- **Penghapusan Label Zona Waktu Tertentu (*Timezone Label Bias Removal*):**
  - Menghapus akhiran statis `"WIB"` pada lencana waktu banner beranda.
  - Mencegah kebingungan bagi pengguna yang berada di zona waktu lain seperti WITA (Waktu Indonesia Tengah / UTC+8), WIT (Waktu Indonesia Timur / UTC+9), maupun pengguna internasional.
  - Lencana waktu kini menampilkan format murni seperti `🌙 Malam Hari • 19:15`, sepenuhnya sinkron dengan jam sistem perangkat pengguna.

---

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
