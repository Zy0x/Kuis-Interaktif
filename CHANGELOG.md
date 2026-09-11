# Catatan Perubahan (Changelog)
Seluruh riwayat rilis dan pembaruan sistem **Kuis Seru** dicatat pada dokumen ini sesuai dengan standar penomoran versi berlanjut.

## [2.3.12] - 2026-09-11
### Presisi Area Interaksi: Eliminasi Phantom Hover pada Tombol Melayang FAB

#### 1. Masalah yang Diselesaikan
- **Area Hover Tidak Presisi (*Phantom Hover Hit-Box*)**: Menu anak Speed Dial sebelumnya berada di dalam alur tata letak normal (`flex-col`) dari kontainer tombol melayang (FAB). Meskipun menu anak disembunyikan (`opacity-0 pointer-events-none`), ia tetap menyumbang tinggi dan lebar fisik (~150px × ~170px) pada pembungkus luar.
- Akibatnya, kursor mouse yang berjarak jauh (hingga 120px di atas atau di samping tombol) secara tidak sengaja memicu *hover* dan membuka menu Speed Dial (*unintended trigger*).

#### 2. Implementasi & Presisi Interaksi (`QuizCreator.tsx`)
- **Isolasi Penuh Menu Anak dengan `position: absolute`**:
  - Menu anak Speed Dial dipindahkan menjadi `position: absolute; bottom: 100%; right: 0;`.
  - Ketika tertutup (`isSpeedDialOpen === false`), menu anak diberi status `invisible opacity-0 pointer-events-none scale-90 translate-y-3`.
  - Ukuran pembungkus luar saat tertutup kini **100% presisi identik dengan ukuran tombol bulat itu sendiri (48×48px di ponsel, 52×52px di desktop)**.
- **Pemicu Hover Eksklusif pada Tombol Pemicu**:
  - Listener `onMouseEnter` dipindahkan langsung ke elemen tombol bulat (`<button>`), bukan pada kontainer luar yang luas.
  - Hover kini hanya akan aktif jika kursor mouse secara fisik dan nyata menyentuh permukaan tombol bulat FAB.
- **Transisi Halus Tanpa Celah (*Zero Gap Transition*)**:
  - Menu anak dilengkapi bantalan bawah `pb-3` yang menjembatani tombol dan menu tanpa celah kosong, sehingga pergerakan kursor ke atas untuk memilih *"Tambah Soal"* atau *"Ke Atas"* tetap stabil dan tidak terputus.

## [2.3.11] - 2026-09-11
### Penerapan Slim Control Bar Bank Soal & Penguatan Deteksi Mode AI

#### 1. Masalah yang Diselesaikan
- **Pemborosan Ruang Layar Atas Bank Soal**: Kartu header Bank Soal sebelumnya memakan ~40% tinggi layar ponsel karena memuat ikon besar, judul, deskripsi, tombol besar *"+ Tambah Soal"*, dan baris counter. Hal ini mendorong butir Soal #1 ke bawah layar.
- **Redundansi Tombol Tambah Soal**: Keberadaan tombol tambah soal selebar 100% layar di kartu atas bersifat redundan dengan tombol melayang (*Smart Speed Dial FAB*) yang sudah ada di sudut kanan bawah dan kartu putus-putus di akhir daftar soal.
- **Deteksi Mode AI pada Draf Lama**: Draf kuis yang tersimpan di penyimpanan lokal dari sesi sebelumnya terkunci pada status `'manual'` meskipun kontennya nyata-nyata berasal dari AI Generator.

#### 2. Implementasi & Penyempurnaan Antarmuka (`QuizCreator.tsx`)
- **Penerapan Slim Control Bar (Opsi A)**:
  - Mengganti kartu tebal dengan baris kontrol ramping horizontal (*height ~44px*).
  - Sisi kiri: status counter informatif `[Layers] X Butir Soal` dan deskripsi singkat di layar besar.
  - Sisi kanan: toggle cepat `💡 Buka/Tutup Semua Pembahasan`.
  - Menghilangkan tombol *Tambah Soal* dari baris atas, sehingga **Soal #1 langsung terlihat 100% utuh di layar ponsel tanpa perlu scroll**.
- **Pemanfaatan Penuh Smart FAB Melayang**:
  - Tombol melayang (*Floating Action Button*) kini selalu aktif sejak awal halaman (`scrollY === 0`) untuk memfasilitasi penambahan soal instan dengan satu ibu jari (*thumb zone*).
  - FAB otomatis bersembunyi dengan halus saat mendekati dasar halaman (`< 180px`) agar tidak pernah menutupi tombol navigasi bawah.
- **Deteksi Otomatis Konten Hasil AI**:
  - `creatorMode` secara cerdas mengenali tanda khas AI (seperti keberadaan `funnelTopic`, judul eksplorasi, atau deskripsi bertema Kurikulum Merdeka) sehingga draf AI selalu membuka alur AI (Step 1 = Bank Soal, Step 2 = Pengaturan Kuis).

## [2.3.10] - 2026-09-11
### Penyelarasan Alur Tab Pasca-Generasi AI: Langsung Masuk ke Bank Soal (Step 1 AI)

#### 1. Masalah yang Diselesaikan
- **Urutan Tab Tidak Tepat Pasca AI Generator**: Setelah AI selesai meracik kuis, layar studio kuis malah menampilkan tab awal *"1. Info"* (*Pengaturan Kuis*) dan header *"Studio Kuis Guru 🧑‍🏫"*. Padahal setelah kuis diracik oleh asisten AI, guru seharusnya langsung ditunjukkan butir-butir soal yang baru saja di-generate pada tab *"1. Bank Soal"* untuk langsung diperiksa dan divalidasi, baru kemudian beralih ke *"2. Pengaturan Kuis"* dan *"3. Pratinjau & Simpan"*.
- **Penyebab Teknis (*Root Cause*)**:
  - Variabel penentu mode `isAiMode` sebelumnya bukan berupa React State dinamis melainkan variabel statis hasil kalkulasi awal `initialMode` dan status draf lama di `localStorage`.
  - Jika sesi draf sebelumnya tersimpan dalam mode manual, atau jika halaman dimuat ulang (*refresh*) tanpa mempertahankan query navigasi, `isAiMode` tetap bernilai `false`.
  - Akibatnya saat callback generator AI `onGenerated` selesai dan memanggil `setCurrentStep(1)`, komponen jatuh ke percabangan mode manual (di mana Step 1 manual adalah *"Pengaturan Kuis"* dan Step 2 adalah *"Bank Soal"*).

#### 2. Implementasi & Penyelarasan Alur (`QuizCreator.tsx` & `App.tsx`)
- **State Dinamis `creatorMode` (`useState<'ai' | 'manual'>`)**:
  - Mengonversi `creatorMode` menjadi state terkelola penuh dalam React.
  - Memastikan inisialisasi cerdas: jika pengguna memilih opsi *Generator Kilat AI*, sistem langsung mengunci mode sebagai `'ai'` dan mengaktifkan funnel AI.
- **Transisi Otomatis ke Studio Kuis AI pada Callback `onGenerated`**:
  - Begitu AI menyelesaikan pembuatan soal, `setCreatorMode('ai')` dipanggil secara eksplisit bersamaan dengan `setAiFunnelActive(false)` dan `setCurrentStep(1)`.
  - Header studio secara konsisten menampilkan identitas *"Studio Kuis AI ⚡"* dengan subjudul *"Langkah 1 dari 3: Bank Soal"*.
  - Tab navigasi atas tersusun rapi sesuai alur AI:
    - **Tab 1**: `1. Bank Soal (X)` (Aktif & langsung menampilkan butir-butir soal hasil generasi AI).
    - **Tab 2**: `2. Pengaturan Kuis` (Informasi dasar kuis, durasi timer, opsi acak, dll).
    - **Tab 3**: `3. Pratinjau & Simpan` (Pratinjau lengkap sebelum disimpan ke penyimpanan).
- **Penanganan Kembali (*Back Handler*) & Racik Ulang Terpadu**:
  - Tombol kembali (hardware/gesture Android maupun header `←`) pada Step 1 Mode AI langsung memunculkan modal konfirmasi *"Racik Ulang Kuis AI?"* untuk mencegah hilangnya draf secara tidak sengaja.
- **Sinkronisasi Navigasi Browser (*Navigation State Persistence*)**:
  - Menyimpan `creatorMode` ke dalam `sessionStorage` melalui `saveNavigationState` di `App.tsx`, sehingga jika browser di-reload (F5), status mode AI tetap bertahan utuh.

## [2.3.9] - 2026-09-11
### Diferensiasi Visual & Hierarki Warna: Tombol Tambah Soal Bertema Indigo Studio

#### 1. Masalah yang Diselesaikan
- **Dominasi Warna Biru Monoton (*Blue Overload*)**: Sebelumnya tombol *"Edit Soal"*, *"Tambah Soal"*, *"Lanjut ke Pengaturan Kuis"*, dan tab aktif semuanya memakai warna biru (`blue-600`). Hal ini menyulitkan pengguna membedakan secara instan antara aksi mengubah butir soal yang sudah ada (*Edit*), aksi membuat konten baru (*Create/Add*), dan aksi navigasi alur (*Next*).

#### 2. Penerapan Identitas Warna Indigo Studio (`QuizCreator.tsx`)
- **Diferensiasi Tombol Tambah Soal**:
  - Mengubah warna tombol `[+ Tambah Soal]` di kartu header Bank Soal menjadi **Indigo Kreatif** (`bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs`).
  - Tombol melayang FAB `+` (trigger utama dan tombol anak) juga diselaraskan menjadi Indigo (`bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/35`).
  - Tombol kartu putus-putus (*dashed*) di bawah soal terakhir kini menggunakan highlight Indigo saat disentuh/di-hover (`hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-600`).
  - Tombol pada status kosong (*empty state*) `"Buat Butir Soal Pertama"` diselaraskan ke Indigo (`bg-indigo-600 hover:bg-indigo-700`).
- **Hierarki Visual Jernih & Anti-Benturan**:
  - **Indigo (`indigo-600`)**: Penambahan butir soal baru (*Content Creation*).
  - **Biru (`blue-600`)**: Pengeditan butir soal & navigasi langkah (*Primary Flow*).
  - **Hijau (`emerald-600`)**: Kunci jawaban benar (*Success/Validation*).
  - **Merah (`rose-600`)**: Hapus butir soal (*Destructive*).
  - **Kuning (`amber-500`)**: Poin nilai & bintang (*Reward*).

## [2.3.8] - 2026-09-11
### Harmonisasi Navigasi Studio: Tombol Simpan Draf di Bawah, Racik Ulang Terpadu via Header Back, & Eliminasi Benturan FAB

#### 1. Masalah yang Diselesaikan
- **Benturan Fisik Tombol (*Overlap Collision*)**: Tombol melayang FAB `+` menutupi tombol *"Lanjut ke Pengaturan Kuis"* di sudut kanan bawah saat pengguna menggulir sampai mentok ke bawah.
- **Redundansi & Kebingungan Aksi AI**: Keberadaan tombol *"Asisten AI"* (modal tambah soal satuan) di kartu atas dan tombol melayang membingungkan pengguna yang sebenarnya ingin meracik ulang (*regenerate*) kuis AI mereka.
- **Ketiadaan Tombol Simpan Draf Cepat**: Guru membutuhkan tombol tegas untuk menyimpan draf progres pembuatan kuis kapan saja.
- **Tombol Back Header Keluar Studio**: Menekan `←` di header saat berada di Bank Soal Mode AI sebelumnya langsung keluar dari studio kuis, bukan kembali ke formulir konfigurasi AI.

#### 2. Implementasi Harmonisasi Navigasi (`QuizCreator.tsx`)
- **Pintu Racik Ulang AI Terpadu di Header Back (`←`)**:
  - Menekan tombol `←` di header saat berada di Step 1 Mode AI kini memunculkan modal konfirmasi elegan *"Racik Ulang Kuis AI?"*.
  - Jika dikonfirmasi, guru kembali ke formulir Funnel AI (Tahap 1–4) dengan seluruh topik, jenjang, mata pelajaran, dan format soal yang tetap tersimpan utuh.
- **Tombol "Simpan Draf" di Dasar Halaman**:
  - Tombol kiri navigasi bawah diubah menjadi `[💾 Simpan Draf]`. Guru dapat menyimpan progres kuis ke penyimpanan lokal secara instan disertai notifikasi toast konfirmasi.
- **Eliminasi Total Tombol "Asisten AI" yang Redundan**:
  - Dihapus dari kartu header Bank Soal dan dari Speed Dial FAB.
  - Kartu header Bank Soal kini sangat bersih, hanya memuat judul dan tombol utama `[+ Tambah Soal]`.
  - Speed Dial FAB kini super ramping hanya memuat 2 aksi: `[Tambah Soal]` dan `[Ke Atas]`.
- **Deteksi Dasar Halaman (*Bottom Threshold Auto-Hide*)**:
  - Menambahkan sensor `isNearBottom` (`< 180px` dari batas bawah). Saat pengguna mendekati bagian bawah halaman di mana tombol navigasi berada, tombol FAB melayang otomatis *fade-out* menyembunyikan diri.
  - Memberikan padding bawah lega `pb-20 sm:pb-24` sehingga tombol *"Lanjut ke Pengaturan Kuis"* 100% bebas dari segala bentuk benturan fisik.

## [2.3.7] - 2026-09-11
### Optimasi Presisi Mobile-First Header Card Bank Soal: Grid Aksi 50-50 Simetris & Sub-Bar Anti-Tabrakan

#### 1. Masalah yang Diselesaikan
- **Tombol Aksi Patah Asimetris pada Mobile**: Tombol `[🪄 Asisten AI]` dan `[+ Tambah Soal]` terlempar ke baris kedua karena judul Bank Soal memakan lebar penuh, menyisakan ruang kosong besar di sisi kanan dan terlihat menggantung tidak rapi.
- **Tabrakan Teks di Baris Bawah**: Teks *"Menampilkan 5 butir soal"* dan *"💡 Buka Semua Pembahasan"* berdempetan dan hampir bertabrakan di layar ponsel dengan lebar 360–390px.
- **Tautan Pembahasan Belum Berbentuk Tombol Sentuh yang Nyaman**: Teks buka pembahasan berupa tautan polos tanpa kontainer tombol.
- **Pemborosan Ruang Vertikal**: Padding kartu yang terlalu tebal memakan ~40% tinggi layar sebelum kartu soal pertama terlihat.

#### 2. Penataan Ulang Presisi Header Bank Soal (`QuizCreator.tsx`)
- **Grid Aksi 50%-50% Simetris di Smartphone (`grid grid-cols-2 gap-2 w-full`)**:
  - Pada layar ponsel (`< sm`), tombol `Asisten AI` dan `Tambah Soal` membagi baris secara seimbang (50% kiri, 50% kanan) dengan tinggi ergonomis 44px, mengisi baris secara presisi dan harmonis.
  - Pada layar tablet/desktop (`sm:` ke atas), kedua tombol otomatis kembali sejajar ke sisi kanan judul secara horizontal (`sm:flex sm:w-auto`).
- **Sub-Bar Anti-Tabrakan & Tombol Pil Lembut**:
  - Teks counter disajikan rapi: `Menampilkan X butir soal` dengan pembatas `truncate` agar tidak pernah bertabrakan.
  - Tombol pembahasan diubah menjadi pil lembut (*soft pill badge*): `bg-blue-50 text-blue-600 px-2.5 sm:px-3 py-1.5 rounded-xl border border-blue-100 font-bold text-xs` yang jelas sebagai elemen interaktif dan nyaman disentuh.
- **Proporsi Padding Responsif**:
  - Mengubah padding kartu menjadi `p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl space-y-3.5 sm:space-y-4` guna menghemat ruang vertikal layar HP dan membuat butir soal pertama langsung terlihat tanpa menggulir banyak.

## [2.3.6] - 2026-09-11
### Rombak FAB Melayang Menjadi Compact Speed Dial (48×48px) Hemat Ruang Mobile dengan Ekspansi Vertikal ke Atas

#### 1. Masalah yang Diselesaikan
- **Penutupan Konten Kartu Soal pada Layar Smartphone (*Mobile Screen Blockage*)**: Pada versi sebelumnya, kapsul melayang horizontal membentang selebar ~70–80% layar ponsel, menutupi tautan *"Lihat Pembahasan Edukatif"* dan baris tombol aksi kartu soal di bawahnya.

#### 2. Arsitektur Compact Speed Dial FAB (`QuizCreator.tsx`)
- **Default Super Kompak (48×48px)**:
  - Tombol melayang dikurangi secara drastis menjadi hanya satu tombol bulat/squircle kompak (48×48px di mobile / 52×52px di desktop) di sudut kanan bawah:
    `bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 right-4 sm:right-6 lg:right-10 z-40`.
  - Jejak visual (*footprint*) sangat minim sehingga 100% konten kartu soal di layar smartphone tetap terlihat dan dapat disentuh tanpa terhalang.
- **Ekspansi Menu Vertikal ke Atas (*Upward Speed Dial*)**:
  - **Mekanisme Trigger**: Mengetuk tombol `+` di ponsel atau hover/klik di desktop memutar ikon `+` menjadi tanda silang `✕` (`rotate-45`) dan membuka daftar aksi yang mengalir rapi ke atas.
  - **Item Menu Berlabel Jelas di Sisi Kiri**:
    1. **`Tambah Soal`**: Tombol bulat biru (44×44px) dengan badge teks `[ Tambah Soal ]` di sebelah kiri.
    2. **`Asisten AI`**: Tombol bulat indigo (44×44px) dengan badge teks `[ Asisten AI ]` di sebelah kiri.
    3. **`Ke Atas`**: Tombol bulat netral (44×44px) dengan badge teks `[ Ke Atas ]` di sebelah kiri.
- **Backdrop Perlindungan Cerdas (*Tap-Outside to Close*)**:
  - Saat menu Speed Dial terbuka, lapisan transparan samar (`bg-slate-950/20 dark:bg-slate-950/40 backdrop-blur-[1px]`) aktif. Mengetuk area mana pun di luar menu atau menekan tombol `Escape` otomatis menutup menu kembali ke status 1 tombol.
  - Memilih salah satu aksi langsung menutup menu dan menjalankan fungsinya secara instan.
- **Standar Aksesibilitas**: Seluruh tombol memenuhi target sentuh ergonomis minimum `≥ 44×44 px` (Rule 1 & Rule 2).

## [2.3.5] - 2026-09-11
### Implementasi Smart Floating Action Capsule (FAB Modern) pada Studio Bank Soal

#### 1. Masalah yang Diselesaikan
- **Kehilangan Akses Tombol Tambah Soal saat Menggulir (*Scroll Loss*)**: Ketika guru meninjau daftar butir soal yang panjang (5–20+ butir soal), tombol `+ Tambah Soal` dan `✨ Asisten AI` di header atas tergulir keluar layar (*out of view*). Pengguna terpaksa harus terus menggulir bolak-balik ke paling atas hanya untuk menambah butir soal baru atau memanggil asisten AI.

#### 2. Implementasi Smart Floating Action Capsule (`QuizCreator.tsx`)
- **Deteksi Scroll Pintar (*Smart Trigger*)**: Memasang listener gulir layar (`scrollY > 180px`) yang secara otomatis memunculkan kapsul melayang hanya saat pengguna telah melewati header kartu Bank Soal. Saat kembali ke paling atas, kapsul melayang menghilang secara anggun (`opacity-0 translate-y-6 scale-95`) untuk mencegah redundansi visual.
- **Komponen Kapsul Bersih & Anti-AI Slop**:
  - **Tombol Pintas Kembali ke Atas (`ChevronUp`)**: Memungkinkan pengguna melompat kembali ke header dengan mulus (*smooth scroll to top*).
  - **Tombol Sekunder Asisten AI (`Sparkles`)**: Tombol indigo lembut untuk memicu generator soal instan tanpa harus mencari tombol di atas.
  - **Tombol Utama Tambah Soal (`Plus`)**: Tombol biru tegas dengan kontras tinggi untuk langsung membuka editor pembuatan butir soal baru.
- **Standar Aksesibilitas & Ergonomi (Rule 1 & Rule 2)**:
  - Seluruh target interaktif memenuhi ukuran sentuh ergonomis minimum `44×44 px`.
  - Menggunakan posisi *thumb-friendly* di pojok kanan bawah dengan adaptasi safe-area perangkat seluler: `bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 right-3 xs:right-4 sm:right-6 lg:right-12 z-40`.
  - Otomatis tersembunyi saat pengguna sedang membuka formulir editor soal (`isAddingQuestion === true`) sehingga tidak menutupi area pengisian form.

## [2.3.4] - 2026-09-11
### Eliminasi Celah Samping Layar Lebar & Penyelarasan Kontainer Penuh `max-w-[2000px]` dengan Grid Opsi 4-Kolom

#### 1. Masalah yang Diselesaikan
- **Celah Samping Timpang di Monitor Layar Lebar (*Widescreen Canyon Margins*)**: Pada layar monitor desktop 1080p, 2K, hingga 4K, kontainer Bank Soal dan tab navigasi sebelumnya dibatasi `max-w-4xl 2xl:max-w-5xl` (~1024px), sementara navbar header atas menggunakan `max-w-[2000px]`. Hal ini menghasilkan celah kosong (*gutter*) yang sangat lebar (~450px di kiri dan kanan) dan membuat konten kuis tampak menciut di tengah.
- **Penyajian Opsi Jawaban Menumpuk**: Opsi pilihan ganda (A, B, C, D) di monitor lebar sebelumnya hanya memakai 2 kolom, memboroskan ruang horizontal dan memperpanjang kartu secara vertikal.

#### 2. Penyelarasan Kontainer Lebar Maksimal Harmonis (`QuizCreator.tsx`)
- **Penyelarasan Presisi Seluruh Viewport**: Mengubah kontainer tab AI Funnel, Tab Navigasi 3 Langkah, Studio Bank Soal, dan Halaman Pratinjau & Simpan menjadi `w-full max-w-[2000px] mx-auto px-3 xs:px-4 sm:px-8 lg:px-12`. Tampilan kini sejajar sempurna dengan navbar header aplikasi di seluruh ukuran layar.
- **Tetap Mempertahankan 1-Kolom Mengalir ke Bawah (*Single Downward Flow*)**: Sesuai instruksi, kartu soal tidak dipecah menjadi 2 kolom kartu bersebelahan, melainkan tetap mengalir ke bawah secara alami dan teratur.
- **Opsi Jawaban 4 Kolom di Layar Lebar (`lg:grid-cols-4`)**: Pilihan jawaban A, B, C, dan D pada kartu soal serta formulir editor soal otomatis menyebar proporsional dalam 4 kolom sejajar di layar besar (`lg:grid-cols-4`), 2 kolom di tablet (`sm:grid-cols-2`), dan 1 kolom di ponsel (`grid-cols-1`). Hal ini menghemat ruang vertikal dan mengisi ruang horizontal secara estetis dan ergonomis.
- **Kartu Menjodohkan 4 Kolom**: Pasangan butir soal menjodohkan juga ditingkatkan menjadi `lg:grid-cols-4` di layar desktop.

## [2.3.3] - 2026-09-11
### Eliminasi Kolom Kosong & Penerapan Tata Letak 1-Kolom Responsif Mengalir ke Bawah pada Studio Bank Soal

#### 1. Masalah yang Diselesaikan
- **Pemborosan 50% Layar Desktop (*Dead Space*)**: Sebelumnya, separuh layar kanan monitor pada Studio Bank Soal dihabiskan hanya untuk kartu placeholder kosong ("Editor Soal Siap Digunakan") saat tidak sedang mengedit soal, sementara daftar soal di sisi kiri terhimpit sempit.
- **Peregangan Ekstrem Tab Wizard**: Tab langkah wizard direntangkan selebar 2000px tanpa batas proporsional sehingga tombol menjadi terlalu renggang di monitor lebar.
- **Scrollbar Ganda di Layar Besar**: Adanya scrollbar internal sempit di kolom kiri membuat peninjauan butir soal terasa terbatas seperti berada di dalam iframe.

#### 2. Arsitektur 1-Kolom Responsif Mengalir ke Bawah (`QuizCreator.tsx`)
- **Penghapusan Total Pembagian 2 Kolom & Kolom Kosong**: Struktur `grid-cols-12` dan kolom placeholder kosong dihapus sepenuhnya. Seluruh tata letak kini mengalir ke bawah (*single downward flow*) terpusat (`max-w-3xl lg:max-w-4xl 2xl:max-w-5xl mx-auto`).
- **Penyajian Daftar Soal Lapang & Alami**: Kartu-kartu butir soal mengalir ke bawah dengan lebar ergonomis, opsi pilihan ganda berbaris seimbang 2 kolom (`grid-cols-1 sm:grid-cols-2`), dan bebas dari scrollbar internal kotak sempit.
- **Tombol Tambah Cepat di Bawah Kartu**: Ditambahkan tombol kartu putus-putus (*dashed*) `+ Tambah Butir Soal Baru` di bawah butir soal terakhir agar guru dapat langsung menambahkan soal baru di akhir alur peninjauan.
- **Fokus Editor Terpadu**: Saat menekan *"Edit Soal"* atau *"+ Tambah Soal"*, tampilan kontainer bertransisi rapi ke formulir editor soal yang lapang dengan tombol navigasi `← Kembali ke Daftar Soal` yang selalu aktif di semua perangkat (ponsel hingga desktop lebar).
- **Pembatasan Lebar Tab Wizard & Pratinjau**: Tab langkah wizard atas dan pratinjau langkah 3 dibatasi secara harmonis (`max-w-4xl 2xl:max-w-5xl mx-auto`) sehingga proporsional dan tidak meregang liar di layar lebar.

## [2.3.2] - 2026-09-11
### Optimasi Presisi Mobile-First Studio Bank Soal: Action Bar 1-Baris Utuh & Perapian Header Metadata

#### 1. Masalah yang Diselesaikan
- **Action Bar Bawah Patah Menjadi 2 Baris**: Di layar smartphone (360–390px), tombol panah urutan dan grup tombol aksi terpisah menjadi 2 baris asimetris karena keterbatasan lebar dan pemakaian `flex-wrap`, menyisakan ruang kosong besar di baris pertama dan memboroskan ruang vertikal.
- **Badge Metadata Header Patah**: Lencana durasi (`[🕒 30d]`) terlempar sendirian ke baris kedua persis di bawah lencana nomor soal.
- **Nested Scrollbar Mengganggu di Layar HP**: Pembatasan `max-h-[calc(100vh-280px)]` dengan `overflow-y-auto` memunculkan scrollbar ganda yang tidak nyaman bagi gestur usap layar sentuh ponsel.

#### 2. Implementasi Rekomendasi A (Action Bar 1-Baris Presisi) (`QuizCreator.tsx`)
- **Segmented Control Panah Urutan**: Tombol `↑` dan `↓` disatukan dalam satu grup kapsul kompak (`inline-flex rounded-xl bg-slate-100 p-0.5`) dengan target sentuh lega dan proporsional.
- **Tombol Utilitas Ikonik Mobile**: Tombol Salin dan Hapus tampil dalam bentuk tombol ikonik minimalis berbingkai di layar HP (`< sm`), dengan teks label otomatis muncul di layar lebih lebar (`sm:` ke atas).
- **Tombol Utama "Edit Soal" Fleksibel (`flex-1`)**: Tombol aksi utama melebar mengisi sisa ruang secara proporsional dan simetris di sisi kanan, menjadi target jempol yang paling dominan dan mudah diakses.
- **Bebas Wrapping**: Seluruh 4 tombol aksi kini terkunci dalam 1 baris horizontal rapi pada resolusi 320px–420px.

#### 3. Header Metadata Simetris & Scroll Alami Mobile
- **Header 2 Zona Seimbang**:
  - Zona Kiri: Nomor soal (`Soal #X`) dan tipe soal.
  - Zona Kanan: Poin nilai (`⭐ 10p`), durasi (`🕒 30s`), dan indikator gambar. Keduanya berhadapan rapi dalam 1 baris tanpa pembungkusan yang canggung.
- **Tombol Pembahasan Bergaya Soft Pill**: Tombol toggle pembahasan materi kini dibungkus latar pil lembut (`bg-blue-50/60 text-blue-600`) yang ramah sentuhan.
- **Scroll Alami pada Ponsel**: Menghilangkan batas `max-h` kaku pada mobile (`lg:max-h-[calc(100vh-280px)] lg:overflow-y-auto`) sehingga daftar soal mengalir alami bersama guliran halaman tanpa memunculkan scrollbar ganda.

## [2.3.1] - 2026-09-11
### Redesain Studio Bank Soal: Anti-AI Slop, Pratinjau Opsi & Kunci Jawaban Lengkap, dan Ergonomi Mobile-First

#### 1. Masalah & Temuan Audit Tampilan Sebelumnya
- **Teks Soal Terpotong (`line-clamp-2`)**: Teks soal dipotong paksa sehingga guru tidak dapat membaca stimulus dan esensi pertanyaan secara utuh tanpa mengklik edit terlebih dahulu.
- **Opsi Jawaban & Kunci Tidak Terlihat**: Guru tidak dapat melihat pilihan ganda (A, B, C, D), status benar/salah, maupun kunci jawaban langsung dari daftar soal.
- **Tombol Aksi Sangat Mungil & Rawan Salah Tekan**: 5 tombol ikon mikro (`↑`, `↓`, `Edit`, `Salin`, `Hapus`) berukuran ~22×22 px berjejer rapat di pojok kanan atas kartu, melanggar standar ergonomi sentuh mobile (minimal 44×44 px).
- **Alur Pengeditan Terputus di Mobile**: Pada layar HP, menekan tombol edit menampilkan formulir di bagian bawah daftar panjang soal, sehingga layar tidak berpindah fokus dan pengguna bingung di mana formulir pengeditan berada.
- **Tampilan Padat & "AI Slop"**: Kesan tampilan padat dan kaku dengan kontras warna yang kurang berjenjang.

#### 2. Redesain Kartu Soal & Pratinjau Komprehensif (`QuizCreator.tsx`)
- **Teks Soal Utuh**: Menghapus pembatasan baris (`line-clamp-2`) dengan tipografi yang jernih, lega, dan kontras tinggi (`text-slate-800 dark:text-slate-100`).
- **Pratinjau Opsi Lengkap Berdasarkan Tipe Soal**:
  - **Pilihan Ganda**: Menampilkan seluruh opsi (A, B, C, D) dengan badge huruf tegas. Opsi kunci jawaban disorot otomatis dengan palet hijau emerald cerah (`bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200`) dan lencana centang `✓ (Kunci)`.
  - **Benar / Salah**: Menampilkan kartu pilihan Benar dan Salah dengan penanda kunci jawaban aktif.
  - **Isian Singkat**: Menampilkan kunci kata kunci jawaban yang diterima dalam badge hijau berlatar rapi.
  - **Menjodohkan**: Menampilkan pasangan premis dan target secara berdampingan dengan panah penghubung (`↔`).
- **Akordeon Pembahasan Interaktif**: Penjelasan materi (`explanation`) disajikan dalam akordeon lipat yang rapi dengan ikon `💡`, plus tombol global *"Buka/Tutup Semua Pembahasan"* di header daftar soal.
- **Pratinjau Gambar / Stimulus**: Thumbnail gambar ilustrasi soal ditampilkan proporsional di sisi soal tanpa merusak tata letak.

#### 3. Ergonomi Sentuh Mobile-First & Tombol Aksi Nyaman (≥ 44×44 px)
- **Bar Aksi Bawah Mandiri**: Tombol aksi dipindahkan ke bar bawah setiap kartu soal dengan tata letak yang lega:
  - Tombol urutan naik/turun (`↑`, `↓`) berukuran presisi `44×44 px` (`w-11 h-11`).
  - Tombol *"✏️ Edit Soal"* berlabel jelas dengan aksen primer yang mudah dijangkau satu jempol.
  - Tombol *"📋 Salin"* dan *"🗑️ Hapus"* dengan target sentuh lega dan dialog konfirmasi proteksi penghapusan tidak sengaja.
- **Master-Detail Flow Khusus Mobile**:
  - Saat menekan edit soal atau tambah soal baru di perangkat smartphone (`< lg`), tampilan secara cerdas beralih penuh ke fokus Editor Soal dengan tombol navigasi jelas `← Kembali ke Daftar Soal` di bagian atas.
  - Pada layar tablet dan desktop (`≥ lg`), tata letak berdampingan (side-by-side) tetap dipertahankan untuk produktivitas maksimal.
- **Floating Bottom Bar Adaptif**: Tombol navigasi langkah wizard otomatis disembunyikan saat sedang fokus mengedit butir soal di HP agar layar bersih dan tidak membingungkan.

## [2.3.0] - 2026-09-11
### Auto-Generate Informasi Dasar & Identitas Kuis Lengkap via AI

#### 1. Masalah yang Diselesaikan
- Sebelumnya, saat pengguna meracik soal kuis dengan AI, informasi dasar kuis seperti Judul, Deskripsi, Emoji Sampul, Lencana Prestasi, dan Durasi Pengerjaan hanya diisi menggunakan template statis/generik (misalnya: `"Kuis Matematika: Pecahan"` dan deskripsi template biasa), sehingga belum mencerminkan esensi materi secara inspiratif dan pedagogis.
- Guru masih harus mengetik atau mengedit judul dan deskripsi pengantar secara manual di formulir informasi kuis.

#### 2. Engine Generator Identitas Kuis Cerdas (`geminiApi.ts` & `aiQuestionParser.ts`)
- **Metadata Lengkap Terintegrasi**: Mesin AI kini mengompilasi metadata kuis bersamaan dengan butir-butir soal dalam satu respons JSON utuh:
  - **Judul Kuis (`title`)**: Judul bertema petualangan atau eksplorasi konsep nyata yang ramah anak dan kurikuler (contoh: *"Petualangan Sains: Menguak Siklus Air"*, *"Master Pecahan Cepat: Logika & Hitung Tangkas"*).
  - **Deskripsi Kuis (`description`)**: 2–3 kalimat pengantar bermakna mengenai capaian pembelajaran, pengenalan stimulus, dan kata-kata penyemangat bagi peserta didik.
  - **Emoji Sampul (`coverEmoji`)**: Emoji representatif yang kontekstual dan presisi tinggi dengan materi (misal: 💧 untuk siklus air, 🪐 untuk tata surya, 🍕 untuk pecahan, 🫀 untuk peredaran darah, 🌿 untuk fotosintesis, 🏛️ untuk sejarah).
  - **Lencana Prestasi (`badgeTitle`)**: Gelar juara apresiatif bertema materi (contoh: *"Ahli Hidrologi Cilik"*, *"Penjelajah Antariksa"*, *"Master Pecahan"*).
  - **Durasi Pengerjaan Ideal (`durationPerQuestionSec`)**: Durasi rata-rata per butir soal disesuaikan dengan tingkat kesulitan dan jenjang kelas (30s, 35s, 40s, atau 45s).
  - **Warna Tema (`themeColor`)**: Palet warna selaras dengan rumpun mata pelajaran.
- **Dukungan Dua Arah (Engine Cloud & Ekstraksi Teks/Prompt)**: Mendukung eksekusi AI langsung (DeepSeek/Groq/Gemini), prompt salin-tempel mandiri dari AI eksternal (`parseRawQuizPayload`), serta fallback instan (`generateCreativeQuizMetadata`) yang menjamin metadata selalu terisi penuh tanpa gagal.

#### 3. Penerapan Otomatis ke Studio & Form Pembuatan Kuis (`QuizCreator.tsx` & `AiGeneratorStep.tsx`)
- Callback `onGenerated` langsung memetakan judul, deskripsi, emoji, lencana prestasi, durasi, dan tema warna ke state kuis aktif, sehingga ketika guru masuk ke tab Studio Bank Soal maupun Pengaturan Kuis, seluruh identitas kuis telah siap pakai.

#### 4. Fitur On-Demand Racik/Segarkan Identitas di Formulir Kuis (`InfoKuisStep.tsx`)
- Disediakan kartu aksi interaktif modern *"✨ Racik Identitas Kuis Otomatis via AI"* pada langkah pengaturan informasi dasar kuis.
- Guru dapat membuat baru atau menyegarkan judul, deskripsi, emoji, dan lencana kuis kapan saja hanya dengan sekali klik tanpa perlu mengulang pembuatan butir soal.
- Mematuhi standar desain mobile-first & touch-first (target sentuh ≥ 44×44 px) dengan indikator animasi pemuatan halus (150–350 ms).

## [2.2.99] - 2026-09-11
### Auto-Save & Persistensi Penuh Progres Pembuatan Kuis saat Halaman Ter-refresh

#### 1. Masalah yang Diselesaikan
- Pengguna yang sedang membuat kuis di Studio Kuis atau menyusun konfigurasi di AI Generator kehilangan seluruh progres ketika browser ter-refresh secara tidak sengaja (tombol F5, reload bar, atau gesture swipe-down di perangkat mobile).
- Status mode (`creatorMode: 'ai' | 'manual'`) dan nomor tahapan form tidak tersimpan di navigasi sesi, menyebabkan pengguna terlempar kembali ke mode default.

#### 2. Auto-Save Form Pembuatan Soal Aktif & Bank Soal (`QuizCreator.tsx`)
- **Penyimpanan Draft Soal Berjalan (`activeQuestionDraft`)**: Teks soal, tipe soal, opsi jawaban, kunci jawaban, pembahasan materi, kata kunci isian singkat, kartu menjodohkan, poin, dan durasi kustom kini disimpan otomatis ke `localStorage` secara reaktif.
- **Deteksi Mode Otomatis**: Menyimpan dan memulihkan status funnel AI (`aiFunnelActive`, `aiFunnelStage`, `funnelTopic`) dan tab pembuatan kuis.
- **Notifikasi Pemulihan Draft**: Toast ramah otomatis memberitahu guru saat draft kuis sebelumnya berhasil dipulihkan setelah reload halaman.
- **Peringatan Reload Browser (`beforeunload`)**: Peringatan konfirmasi asli browser ditampilkan jika terdapat pekerjaan atau teks soal yang sedang disusun dan belum disimpan.
- **Pembersihan Draft Terpadu**: Draft otomatis dibersihkan secara bersih saat kuis berhasil diterbitkan atau saat tombol "Reset Draft" dikonfirmasi.

#### 3. Persistensi Penuh AI Generator Step (`AiGeneratorStep.tsx`)
- **Penyimpanan Konfigurasi AI Generator (`kuis_ai_generator_draft_v1`)**: Menyimpan seluruh konfigurasi Tahap 1–4, meliputi: catatan konteks, jumlah soal, proporsi tipe soal, fokus kognitif Bloom (C1–C6), konteks Kurikulum Merdeka, pemilihan mesin AI, dan teks prompt mentah/dokumen yang diimpor.
- **Pemulihan Otomatis pada Mount**: Form langsung terisi kembali sesuai konfigurasi sebelumnya tanpa perlu memilih ulang dari awal.
- **Peringatan Navigasi & Reload**: Event listener `beforeunload` aktif jika pengguna berada pada tahapan funnel lanjutan atau telah mengisi topik/catatan.

#### 4. Sinkronisasi Status Navigasi URL & Sesi (`navigationState.ts` & `App.tsx`)
- Parameter query `mode=ai` atau `mode=manual` disinkronkan secara aman ke URL dan `sessionStorage` sehingga perpindahan dan penyegaran halaman tetap mempertahankan mode pilihan pengguna.

## [2.2.98] - 2026-09-11
### Integrasi Alur Kerja Microsoft Bing Image Creator (DALL-E 3) & Smart Clipboard Paste

#### 1. Masalah yang Diselesaikan
- AI diagram lokal terkadang menghasilkan teks atau label yang kurang tajam untuk konsep biologi/sains yang sangat rumit.
- Guru menginginkan opsi untuk menggunakan mesin gambar tingkat tinggi seperti DALL-E 3 tanpa biaya API berbayar.

#### 2. Generator Pintar Microsoft Bing Image Creator (`ImageSelectorModal.tsx`)
- Tab khusus generator Bing Image Creator terpadu dengan penyusunan prompt otomatis berbasis prompt Kurikulum Merdeka.
- Tombol salin prompt sekali klik dan tombol langsung menuju Bing Image Creator di tab baru.
- Dukungan *Smart Clipboard Paste* (Ctrl+V) langsung ke modal untuk menempelkan gambar hasil racikan Bing tanpa perlu menyimpan berkas manual ke hard disk.

## [2.2.97] - 2026-09-11
### Peningkatan Akurasi Ilustrasi Soal: Sistem Pencarian Hybrid (Ensiklopedia & AI Diagram Flux)

#### 1. Masalah yang Diselesaikan
- Sebelumnya, generator ilustrasi hanya bergantung pada generator gambar umum tanpa panduan diagram spesifik, sehingga menghasilkan gambar abstrak, kubus isometrik, atau bentuk teknologi yang tidak relevan dengan konsep pelajaran (misalnya soal evaporasi/air laut menghasilkan papan sirkuit).
- Guru/pembuat soal tidak memiliki opsi untuk mengganti atau mencari diagram pendidikan nyata ketika hasil otomatis kurang akurat.

#### 2. Layanan Gambar Edukasi Multi-Sumber (`imageService.ts`)
- **Pencarian Ensiklopedia Terpadu**: Terintegrasi langsung dengan API Wikipedia Bahasa Indonesia, Wikipedia Bahasa Inggris, dan Wikimedia Commons secara gratis tanpa memerlukan kunci API pengguna.
- **Generator AI Anti-Abstrak (Flux Model)**: Menggunakan formula prompt terstruktur khusus kurikulum sekolah (`educational 2D scientific textbook diagram, labeled, clean white background, no isometric 3D, no fantasy art`).
- Menyediakan 3 gaya visual: Diagram Pelajaran (2D skematik), Kartun Edukatif (buku anak ceria), dan Foto Nyata (dokumentasi sains/alam).

#### 3. Modal Pemilih & Peracik Ilustrasi Edukasi (`ImageSelectorModal.tsx`)
- Tombol **"Cari / Ganti Gambar"** tersedia langsung pada setiap butir soal di Studio Kuis (`QuizCreator.tsx`).
- **Tab 1 — Ensiklopedia**: Cari ribuan diagram dan foto sains/sejarah/geografi dari Wikipedia/Wikimedia dengan pratinjau thumbnail dan 1-klik terapkan.
- **Tab 2 — Generator AI**: Kemampuan meracik ulang gambar dengan biji (*seed*) baru, menyesuaikan deskripsi prompt, dan memilih gaya visual.
- **Tab 3 — Unggah & URL**: Dukungan unggah berkas dari perangkat lokal atau menempel tautan URL gambar eksternal.

#### 4. Komponen Tampilan Ilustrasi Terpadu (`QuizIllustration.tsx`)
- Menangani pemuatan gambar secara progresif, penanganan error cerdas, dan cadangan (*fallback*) otomatis agar tampilan kuis selalu rapi di semua perangkat.

## [2.2.96] - 2026-09-11
### Redesign Selektor Level Kognitif — Clean Minimal, Anti-AI-Slop

#### 1. Preset Pills Level Kognitif
- Tampilan diganti dari 3 kartu besar dengan banyak teks menjadi **5 pill compact** horizontal: Auto, Seimbang, HOTS, LOTS, Kustom.
- Default baru: **Auto** — AI memilih distribusi level Bloom terbaik sesuai fase dan topik secara otomatis.
- Deskripsi singkat tampil sebagai hint kecil di samping label (di layar lebar), tidak memenuhi kartu.

#### 2. Mode Kustom: 6 Kartu C1–C6
- Dipilih jika preset "Kustom" aktif, muncul grid **3 kolom × 2 baris** berisi kartu C1–C6 compact (multi-select).
- Setiap kartu menampilkan kode level dan kata kerja Bloom singkat.
- Minimal 1 level harus dipilih (tidak bisa deselect semua).
- Tombol **"Atur proporsi (%)"** muncul di bawah kartu — tersembunyi secara default, hanya buka jika diperlukan.
- Proporsi per level menggunakan stepper +/− dan progress bar mini horizontal.

#### 3. Latar Cerita — Chip Row Horizontal
- Diganti dari grid 2×4 berisi kartu dengan deskripsi menjadi **chip row single-line** kompak: Auto · Keseharian · Sains & Alam · Literasi & Data · Sesuai Materi.
- Default: **Auto** (AI pilih konteks terbaik).

#### 4. Tombol Info "i"
- Penjelasan Taksonomi Bloom dipindahkan ke tombol **"i"** di sudut kanan header.
- Tooltip muncul saat hover, tidak pernah memenuhi layar.

#### 5. Perluasan Tipe & Prompt
- `cognitiveFocus` diperluas: `'auto' | 'balanced' | 'hots' | 'lots' | 'custom'`.
- `kurmerContext` diperluas: `'auto' | 'daily_life' | 'science_nature' | 'literacy_numeracy' | 'general'`.
- Logika prompt di `aiQuestionParser.ts` dan `geminiApi.ts` diperbarui untuk mendukung mode `auto` (AI bebas memilih) dan `custom` (level + proporsi spesifik).

## [2.2.95] - 2026-09-11
### Integrasi Standar Asesmen Kurikulum Merdeka (BSKAP RI), Selektor HOTS & Generator Soal Berkualitas Tinggi

#### 1. Selektor Tingkat Penalaran & Karakter Soal (HOTS) di Tahap 3
- **Tiga Pilihan Tingkat Kognitif Terstandar**:
  - **Seimbang (MOTS + HOTS) [Rekomendasi]**: Mengalokasikan 40% pemahaman/aplikasi konsep dasar dan 60% penalaran analitis kritis berbasis stimulus nyata.
  - **Fokus Penuh HOTS (Level C4-C6 AKM)**: 100% soal berorientasi analisis, evaluasi, dan pemecahan masalah non-algoritmik untuk persiapan Asesmen Nasional / AKM.
  - **Penguatan Fondasi (Level C1-C3)**: Fokus pemahaman esensial dan penguasaan fakta inti tanpa jebakan membingungkan (cocok untuk apersepsi atau remedial).
- **Desain Kartu Sentuh Responsif (Touch-First)**: Masing-masing opsi menggunakan tata letak kartu grid 1-kolom di ponsel dan 3-kolom di layar besar dengan target sentuh lega (`min-h-[108px]`) dan ring fokus aktif yang tegas.

#### 2. Pilihan Latar Cerita & Konteks Stimulus Kurikulum Merdeka
- Menyediakan 4 mode konteks stimulus cerita nyata Indonesia:
  - *🏠 Keseharian & Budaya Nusantara* (kehidupan keluarga, sekolah, pasar tradisional, gotong royong warga, karakter akrab Siti, Edo, Dayu, Budi).
  - *🌿 Sains & Alam Sekitar* (pengamatan tumbuhan sekolah, hewan, cuaca, energi, daur ulang).
  - *📊 Literasi & Numerasi Terapan* (data konkret, tabel mini, jadwal piket/ronda, hitungan belanjaan nyata).
  - *🎯 Sesuai Topik Materi* (kontekstual alami mengalir sesuai mapel).

#### 3. Adaptasi Pedagogi Berbasis Fase Kurikulum Merdeka (Fase A, B, C, D, E/F)
- Menyematkan kartu panduan karakteristik fase aktif di antarmuka pendidik.
- **Fase A (Kelas 1–2 SD, Usia 6–8 Tahun)**: Bahasa konkret, kalimat pendek 1–2 baris, tanpa kosakata asing/abstrak. Soal HOTS diarahkan pada pengelompokan benda, pola, dan prediksi langsung.
- **Fase B (Kelas 3–4 SD, Usia 8–10 Tahun)**: Stimulus narasi mini 2–3 kalimat, penalaran hubungan sebab-akibat sederhana, penafsiran tabel/data mini, dan kesimpulan logis.
- **Fase C (Kelas 5–6 SD, Usia 10–12 Tahun)**: Studi kasus multi-faktor, analisis alternatif terbaik, deteksi kekeliruan argumen, dan pemecahan masalah (*problem-solving*).
- **Fase D (SMP) & Fase E/F (SMA)**: Analisis komparatif saintifik/sosial dan terminologi baku.

#### 4. Standar Mutu Butir Soal Anti-AI Slop (High-Pedagogy Directives)
- **Eliminasi Soal Hafalan Kamus Kering**: Melarang pembuatan soal bertipe kamus mati (*"Apa pengertian..."*, *"Sebutkan definisi..."*).
- **Pengecoh Masuk Akal (*Plausible Distractors*)**: Pilihan salah wajib merefleksikan miskonsepsi umum siswa, bukan opsi konyol atau asal-asalan.
- **Kesetaraan Panjang Opsi**: Menjamin panjang teks pilihan A, B, C, D seimbang agar jawaban tidak mudah ditebak dari opsi terpanjang.
- **Pembahasan Edukatif Mendalam**: Properti `explanation` wajib menjelaskan konsep inti kebenaran kunci serta meluruskan kekeliruan opsi pengecoh secara santun (1–3 kalimat membangun rasa percaya diri).

## [2.2.94] - 2026-09-11
### Peningkatan Presisi Responsivitas, Estetika & Standar Aksesibilitas Notifikasi Toast

#### 1. Optimalisasi Dimensi & Kerapian Tata Letak Multi-Perangkat (Mobile-First)
- **Penanganan Lebar Responsif Proporsional**: Mengganti lebar dinamis sempit yang sebelumnya memotong teks menjadi 3 baris kecil pada ponsel sempit dengan konfigurasi lebar adaptif: `w-[calc(100vw-2rem)] xs:w-[calc(100vw-2.5rem)] sm:w-auto sm:min-w-[360px] sm:max-w-[480px]`.
- **Kerapian Tipografi 2 Tingkat**: Menyematkan badge kategori ringkas (*BERHASIL*, *PERHATIAN*, *KENDALA*, *INFORMASI*) dengan teks utama yang mengalir alami tanpa terpotong kaku.
- **Dukungan Penuh Safe-Area Inset**: Menjaga jarak aman dari bilah navigasi bawah sistem Android dan gesture bar iOS (`bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:bottom-8`).

#### 2. Peningkatan Estetika & Keterbacaan Kontras Tinggi (Anti-AI Slop)
- **Desain Permukaan Glassmorphic Slate**: Menggantikan latar belakang neon pekat yang bertabrakan dengan tema menjadi kartu mengambang *slate-900* dengan *backdrop-blur-xl*, bayangan lembut (*ambient glow*), serta garis tepi halus beraksen status.
- **Kenyamanan Visual Lintas Mode**: Kontras teks putih jernih (`text-slate-100`) terbukti nyaman di mata dan terbaca jelas baik pada mode terang (*Light Mode*) maupun mode gelap (*Dark Mode*).
- **Badge Ikon Status Proporsional**: Wadah ikon tersendiri (`w-9 h-9 sm:w-10 sm:h-10 rounded-xl`) dengan latar transparan beraksen lembut sesuai jenis notifikasi.

#### 3. Kepatuhan Target Sentuh Standar (Touch-Target Compliance)
- **Tombol Tutup 44×44 px**: Memperbesar target sentuh tombol silang penutup dari sebelumnya `28×28 px` menjadi ukuran standar minimum `44×44 px` (`min-w-[44px] min-h-[44px] w-11 h-11`) untuk kemudahan interaksi satu tangan di layar sentuh.

#### 4. Animasi Ringan & Indikator Hitung Mundur (Motion & Feedback)
- **Transisi Halus 240 ms**: Menggantikan animasi pantulan kasar (*bounce*) dengan transisi *slide-up* dan *scale* halus (240 ms) sesuai batasan performa perangkat rendah.
- **Bilah Progres Auto-Dismiss**: Menambahkan garis progres dinamis 2.5 px di dasar notifikasi yang bergerak menyusut secara sinkron dengan durasi 3.8 detik penutupan otomatis.

## [2.2.93] - 2026-09-11
### Perbaikan Penanganan Penyalinan Prompt AI & Sistem Clipboard Multi-Tier Universal

#### 1. Implementasi Utilitas Clipboard Universal & Tangguh (`copyTextToClipboard`)
- Mengatasi kendala kegagalan penyalinan prompt (*"Gagal menyalin teks prompt ke clipboard"*) yang terjadi saat peramban berada di lingkungan non-HTTPS (seperti akses jaringan lokal HTTP / IP), peramban mobile/WebView, atau ketika peramban membatasi akses `navigator.clipboard.writeText`.
- Menyediakan mekanisme fallback berlapis (*multi-tier fallback*):
  - **Tier 1 (Modern Async API)**: Menggunakan `navigator.clipboard.writeText` jika didukung dan diizinkan peramban.
  - **Tier 2 (In-DOM Direct Selection)**: Jika elemen target (seperti textarea prompt) tersedia, langsung memfokuskan dan mengeksekusi `document.execCommand('copy')` dari elemen yang sudah ada di DOM.
  - **Tier 3 (Off-Screen Buffer)**: Membuat elemen textarea tersembunyi dengan konfigurasi kompatibilitas penuh untuk iOS Safari, Android, dan iframe.
  - **Tier 4 (Visual Selection Fallback)**: Jika seluruh API clipboard ditolak oleh kebijakan keamanan peramban, sistem secara otomatis menandai (*select all*) teks prompt dan memunculkan toast edukatif agar pengguna dapat menekan tombol Salin atau pintasan keyboard (Ctrl+C / ⌘+C).

#### 2. Integrasi Menyeluruh di Seluruh Modul Aplikasi
- Memperbarui tombol **Salin Prompt** pada *Funnel AI Creator* (`AiGeneratorStep.tsx`) dengan menghubungkan referensi `promptTextareaRef` ke komponen `ResizableTextarea`.
- Memperbarui modal generator soal AI (`AiQuestionModal.tsx`) agar menggunakan `copyTextToClipboard` tanpa risiko kesalahan *unhandled exception*.
- Menyelaraskan seluruh aksi salin PIN dan tautan kuis pada Dasbor Guru (`TeacherDashboard.tsx`), Detail Kuis (`QuizDetail.tsx`), Pengaturan Kuis (`QuizSettingsModal.tsx`), serta pembagian skor hasil kuis (`QuizResult.tsx`) sehingga bekerja andal di semua perangkat.

## [2.2.92] - 2026-09-11
### Overhaul Acuan Template Prompt AI Anti-Chat & Parser Ekstra Tangguh Multi-Lapis

#### 1. Anti-Chat Role Lock & System Override (`generateAiPrompt`)
- **Eliminasi Pemicu Mode Obrolan Interaktif**: Menghapus frasa pemicu roleplay obrolan seperti *"kuis interaktif"* dan *"komunikatif"* yang sebelumnya menyebabkan model AI chat (seperti ChatGPT, Gemini, Claude, DeepSeek) menyapa pengguna, bertanya *"Apakah kamu siap?"*, dan menyajikan soal satu demi satu layaknya pemandu kuis (*interactive quiz master*).
- **Penetapan Peran Kompiler Data Murni**: Menerapkan blok instruksi tegas di bagian awal prompt: `PERAN: ENGINE GENERATOR DATA MURNI / HEADLESS JSON COMPILER`.
- **Negative Constraints Mutlak**: Melarang keras kalimat pengantar/penutup, melarang menyapa, melarang menyajikan soal satu demi satu, dan mewajibkan seluruh butir soal dikeluarkan sekaligus dalam format blok kode JSON array `[ ... ]` murni.
- **Tail Lock**: Menyisipkan pengingat penutup di baris terbawah prompt untuk memaksa model langsung memulai responsnya dengan karakter pembuka `[`.

#### 2. Contoh JSON Dinamis Berbasis Tipe Soal Terpilih (*Dynamic JSON Examples*)
- Menghilangkan contoh statis 5-tipe soal yang sebelumnya membingungkan model AI berkemampuan rendah (*untrained/dumb LLMs*) sehingga meniru seluruh tipe soal meski pengguna hanya memilih satu format.
- Mengintegrasikan generator contoh yang secara dinamis hanya menampilkan blok contoh untuk format yang benar-benar aktif (misalnya jika memilih *Pilihan Ganda*, contoh yang ditampilkan hanya *Pilihan Ganda* dengan jumlah opsi yang sesuai).
- Menyesuaikan struktur contoh secara tepat untuk mode *Benar/Salah*, *Isian Singkat*, *Menjodohkan*, *Tebak Gambar*, maupun proporsi seimbang pada tipe *Campuran*.

#### 3. Aturan Skema Anti-Bodoh (*Foolproof Schema Rules*)
- **Opsi Bersih Tanpa Label**: Memberikan larangan eksplisit untuk tidak menyertakan prefiks huruf seperti `"A. "`, `"B. "`, atau `"1. "` di dalam array `options` (menghindari tampilan berulang seperti *"A. A. Jakarta"* di antarmuka).
- **Kunci 0-Based Integer**: Menegaskan bahwa `correctIndex` wajib berupa angka bulat 0-based (`0` untuk opsi pertama, `1` untuk kedua), serta melarang keras penggunaan huruf `"A"` atau string angka `"0"`.

#### 4. Parser Ekstra Tangguh Multi-Lapis (*Ultra-Resilient Parser*)
- **Ekstraksi Substring Cerdas**: Memotong teks masukan dari karakter `[` pertama hingga `]` terakhir (atau `{` pertama hingga `}` terakhir) sehingga salam pembuka chat (*pleasantries*) dan salam penutup AI dibuang secara otomatis tanpa merusak data.
- **Sanitasi Sintaks JSON**: Membersihkan *trailing comma* sebelum `}` atau `]`, komentar satu baris (`//`) dan multi-baris (`/* */`), serta menstandarisasi tanda kutip miring (*smart/curly quotes*) menjadi kutip standar RFC 8259.
- **Pembersih Prefiks Opsi Otomatis (`cleanOptionText`)**: Memotong awalan huruf/angka seperti `A. `, `(A) `, `[A] `, `1. `, `A - `, `A: ` pada setiap opsi agar teks pilihan selalu bersih dan rapi.
- **Resolusi Kunci Jawaban Fleksibel (`resolveCorrectIndex`)**: Mampu mengonversi indeks kunci dari berbagai variasi keluaran AI, baik berupa integer, string angka, huruf (`A` -> `0`, `B` -> `1`), maupun teks jawaban langsung yang dicocokkan dengan teks opsi.
- **Perbaikan Deteksi Format Teks Alami (`parseNaturalTextFormat`)**: Membuang kalimat pembuka percakapan sebelum nomor soal pertama, serta menyempurnakan ekspresi reguler deteksi isian singkat agar tidak salah mengenali kunci pilihan ganda umum (`Kunci: A`).

## [2.2.91] - 2026-09-11
### Implementasi Floating Toast Notification & Mini Spec Card Adaptif Funnel AI

#### 1. Floating Toast Notification (Bebas Peringatan Statis Tersembunyi)
- Menghapus sepenuhnya spanduk merah statis (*static alert banner*) di bagian atas kontainer yang sebelumnya kerap luput dari pandangan pengguna saat berada di bagian bawah formulir atau saat menggulir layar (*scrolling*).
- Mengintegrasikan sistem notifikasi mengambang (*floating toast notification*) menggunakan portal viewport (`fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-[200]`) sehingga selalu tampil jelas dan langsung terbaca di layar perangkat mana pun tanpa bergantung pada posisi scroll.
- Mendukung berbagai varian status visual dengan kontras tinggi dan aksen warna ramah mata:
  - **Peringatan / Warning (Amber)**: Untuk validasi kelengkapan berkas, teks input, atau kuota cloud limit.
  - **Kendala / Error (Rose)**: Untuk kegagalan pembacaan format berkas atau sintaks soal.
  - **Sukses / Success (Emerald)**: Untuk umpan balik penyalinan prompt AI dan pemuatan berkas.
- Dilengkapi tombol tutup cepat (`✕`), pengatur waktu hilang otomatis (*auto-dismiss* 3,8 detik), serta dukungan pembaca layar (*accessibility* ARIA `role="alert"`).

#### 2. Mini Spec Card Adaptif Tahap 4 & Tahap 3 (Opsi 1 - Bebas AI Slop)
- Menggantikan *pill badge* 1-baris yang sempit dan rentan terpotong (*truncated*) dengan **Mini Spec Card** 2-tingkat yang adaptif, rapi, dan elegan:
  - **Baris 1**: Ikon & Nama Mata Pelajaran beserta Tingkat Kelas di sisi kiri; Lencana jumlah target butir soal, status ilustrasi, serta tombol pintas *"Ubah"* di sisi kanan.
  - **Baris 2**: Judul materi/topik kuis utuh yang melipat secara wajar (`leading-snug break-words`) tanpa terpotong titik-titik konyol (*no aggressive truncation*), bahkan untuk judul materi yang panjang.
- Menerapkan desain kartu ringkas yang hemat ruang vertikal dengan latar `bg-slate-50/90 dark:bg-slate-850/70 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4` yang konsisten di mode terang maupun gelap.
- Menyelaraskan kartu ringkasan serupa pada Tahap 3 yang dilengkapi tautan *"Ubah Topik"* langsung kembali ke Tahap 2 dengan satu sentuhan mudah.

#### 3. Rekomendasi Solutif Kuota Cloud Limit
- Menyempurnakan kartu informasi kuota habis pada pilihan mesin cloud spesifik untuk langsung mengarahkan guru ke mode **Prompt / Berkas (Direkomendasikan)** guna menjaga kualitas dan variasi soal kuis yang dihasilkan.

## [2.2.90] - 2026-09-11
### Penonaktifan Cerdas AI Cloud Saat Limit & Pengalihan Rekomendasi ke Prompt/Berkas

#### 1. Penonaktifan Visual & Interaksi AI Cloud Saat Limit Kuota
- Menerapkan status nonaktif (*grayed out*, `opacity-50 cursor-not-allowed`, `disabled`) pada kartu model cloud spesifik (DeepSeek, Groq, Gemini) ketika status kuotanya mencapai batas harian (`quota_exhausted` / 429).
- Ketika seluruh AI Cloud yang terkonfigurasi mengalami limit kuota, kartu utama **Otomatis** secara otomatis dinonaktifkan dengan lencana *"Semua Cloud Limit"*, indikator status *(Kuota Habis)*, serta teks panduan solutif.
- Menghadirkan *Alert Banner* edukatif di bagian atas yang menerangkan penyebab penonaktifan cloud dan memandu guru untuk menggunakan AI eksternal tanpa batasan kuota.

#### 2. Pengalihan Otomatis ke Mode Prompt / Berkas (Direkomendasikan)
- Mengalihkan pilihan mesin AI secara otomatis ke **Prompt / Berkas** saat seluruh AI Cloud limit, menghindari *default* ke Generator Lokal karena hasil racikan lokal cenderung monoton dan kurang matang.
- Mengubah lencana pada kartu **Prompt / Berkas** menjadi **"Direkomendasikan"** dengan aksen bintang (*Sparkles*), serta memperbarui deskripsi kartu guna menegaskan solusi terbaik saat kuota Cloud habis.
- Kartu **Lokal** tetap dapat diakses secara manual jika guru membutuhkan pengerjaan luring (*offline*), namun tidak dijadikan rekomendasi sistem.

#### 3. Proteksi Runtime Generator AI Direct
- Menambahkan parameter `allowLocalFallback: false` pada mode Otomatis dan Cloud sehingga kegagalan kuota di tingkat server tidak akan secara diam-diam (*silent fallback*) menghasilkan soal lokal berkualitas rendah, melainkan langsung beralih ke formulir Prompt / Berkas siap salin dengan notifikasi yang jelas.

## [2.2.89] - 2026-09-11
### Penyederhanaan Pilihan Mesin AI 3-Pilar & Eliminasi Navigasi Bawah Redundan

#### 1. Restrukturisasi Pilihan Mesin AI Menjadi 3 Pilar Utama
- Menyederhanakan tata letak pilihan mesin AI pada Tahap 4 dari sebelumnya 6 kartu terbuka sekaligus menjadi 3 Pilar Inti yang mudah dipahami:
  - **Otomatis (Direkomendasikan)**: Kartu utama lebar penuh dengan deteksi pintar ketersediaan server AI dan kunci API aktif.
  - **Lokal (Offline)**: Kartu ringkas untuk pemrosesan mandiri di peramban tanpa koneksi internet.
  - **Prompt / Berkas (Manual)**: Kartu ringkas untuk salin-tempel prompt eksternal atau impor berkas secara fleksibel.
- Menghadirkan menu lipat (*collapsible accordion*) elegan **"Pilih Model Cloud Tertentu (DeepSeek, Groq, Gemini)"** yang menyembunyikan opsi lanjutan agar tidak membingungkan pengguna umum, namun tetap dapat dibuka sewaktu-waktu hanya dengan satu klik.
- Menghemat ruang vertikal hingga ~300px sehingga area input berkas atau prompt langsung tampak ergonomis di layar tanpa perlu *scrolling* panjang.

#### 2. Eliminasi Tombol Navigasi Bawah Redundan & Penataan Tombol Aksi Utama
- Menghapus tombol *"Kembali ke Format"* di navigasi bawah Tahap 4 karena navigasi antar-tahap telah tersedia secara jelas pada Stepper atas dan tombol *badge* konteks.
- Menata ulang tombol aksi primer (*"Buat Kuis Sekarang"* / *"Periksa & Buka Bank Soal"*) agar rata kanan (`justify-end`) di layar desktop/tablet dan membentang ergonomis penuh (`w-full`) di layar ponsel cerdas (*mobile-first*).

## [2.2.88] - 2026-09-11
### Penataan Responsif Toolbar Aksi Mesin AI (Bebas AI Slop)

#### 1. Optimalisasi Struktur Tata Letak 2-Baris Responsif
- Menata ulang header bagian **Pilih Mesin AI** pada Tahap 4 agar presisi di desktop maupun layar ponsel (*mobile-first*):
  - **Baris 1**: Judul bagian di sisi kiri dan toolbar aksi di sisi kanan selalu sejajar berdampingan (`flex items-center justify-between`) tanpa patah atau melayang canggung di bawah deskripsi.
  - **Baris 2**: Deskripsi panduan berada tepat di bawah judul secara proporsional.

#### 2. Penyempurnaan Desain Tombol Segarkan & Kunci API
- Mengubah tombol refresh menjadi *ghost icon button* yang halus (`p-2 rounded-xl text-slate-400 hover:text-blue-600`) dengan umpan balik animasi putar halus (`animate-spin`) saat pemeriksaan server aktif.
- Menyeragamkan tombol Kunci API menjadi tombol kapsul ramping (*compact pill*) dengan label komunikatif **"Kunci API"** dan indikator titik hijau aktif, menghilangkan beban visual berlebihan.

## [2.2.87] - 2026-09-11
### Standarisasi Input Field Teks Panjang & Eliminasi Handle Resize Ganda

#### 1. Standarisasi Komponen ResizableTextarea
- Menghadirkan komponen `ResizableTextarea` terpadu untuk seluruh kolom input teks panjang:
  - Gaya visual konsisten: sudut membulat `rounded-2xl`, bingkai presisi `border-2 border-slate-300 dark:border-slate-700`, latar belakang adaptif `bg-white dark:bg-slate-800`, serta cincin fokus interaktif.
  - Dilengkapi *grip* penarik kustom 6-titik yang ergonomis dan mendukung interaksi geser vertikal mulus baik menggunakan *mouse* di desktop maupun sentuhan jari di ponsel (*mobile touch-friendly*).
  - Teks petunjuk pembantu seragam di bawah kolom: *"Tarik sudut kanan bawah untuk perbesar"*.

#### 2. Eliminasi Penarik Resize Terluar Bawaan Browser
- Menghilangkan gagang penarik ganda (*duplicate resize handle*) pada sudut kanan bawah kolom teks:
  - Menerapkan `resize-none` pada elemen textarea serta aturan CSS global `textarea::-webkit-resizer { display: none; }` untuk menghapus garis segitiga bawaan browser di ujung terluar garis bingkai.
  - Memastikan hanya satu penarik kustom 6-titik yang elegan, bersih, dan fungsional yang tampil di dalam kolom.

#### 3. Penerapan Menyeluruh pada Alur Pembuatan Kuis
- Mengintegrasikan standarisasi ini pada:
  - **Catatan Tambahan (Opsional)** pada Tahap 2 Topik & Sasaran Pembelajaran.
  - **Salin Prompt AI** dan **Tempel Teks Respons AI** pada Tahap 4 Mesin AI.
  - **Deskripsi / Petunjuk untuk Siswa** pada Informasi Kuis.
  - **Teks Pertanyaan Soal** dan **Pembahasan Edukatif** pada Studio Pembuat Kuis.
  - **Tempel Teks Soal AI** pada Modal Generator Cepat.

## [2.2.86] - 2026-09-11
### Optimalisasi Responsivitas & Eliminasi Celah Kosong Tab Unggah Berkas

#### 1. Keselarasan Proporsi & Tata Letak Kartu Masukan Kuis
- Menghilangkan celah vertikal kosong (*empty gap*) pada kartu **Hasil Kuis / Berkas** (Tahap 4) saat tab *Unggah Berkas* dipilih:
  - Menerapkan pembungkus `flex-1 min-h-0` pada area konten utama sehingga area drop-zone berkas dan textarea teks mengisi ruang secara presisi dan dinamis.
  - Memperbarui zona unggah berkas (*drop-zone*) dengan fleksibilitas penuh (`flex-1 min-h-[150px]`) dan perataan terpusat yang proporsional.
- Menyelaraskan kotak catatan pembantu (*footer helper note*) di dasar kedua kartu (Salin Prompt & Unggah/Tempel) dengan gaya visual serasi `rounded-2xl` serta ikon penjelas yang bersih.
- Menjamin stabilitas tinggi dan simetri visual antar-kartu di desktop maupun layar sentuh mobile tanpa pergeseran tata letak (*layout jump*).

## [2.2.85] - 2026-09-11
### Penyeragaman Desain Input Field Prompt & Berkas Selaras Tahap Sebelumnya

#### 1. Keselarasan Visual Input Field & Textarea
- Menyeragamkan gaya visual kolom input/textarea pada kartu **Prompt / Berkas** (Tahap 4) agar persis selaras dengan kolom input pada tahap sebelumnya (Tahap 2):
  - Menggunakan sudut membulat `rounded-2xl` yang halus dan konsisten.
  - Menerapkan ketebalan bingkai `border-2 border-slate-300 dark:border-slate-700` dengan elevasi bayangan `shadow-xs`.
  - Menyelaraskan warna latar permukaan `bg-white dark:bg-slate-800` pada mode terang dan gelap.
  - Menghadirkan ring fokus interaktif `focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`.
- Memperbarui tab switcher metode masukan (*Tempel Teks* vs *Unggah Berkas*) serta tombol aksi utama dengan palet warna primer biru yang konsisten.

## [2.2.84] - 2026-09-11
### Pembersihan Modal Kunci API Pribadi (Bebas AI Slop & Bahasa Jelas)

#### 1. Penyederhanaan Judul & Tab Provider
- Menyederhanakan judul modal menjadi **"Kunci API Pribadi"** dan menghapus jargon teknis yang tidak perlu (*BYOK*).
- Merapikan label switcher tab penyedia menjadi **DeepSeek**, **Groq**, dan **Gemini** yang bersih dan konsisten dengan tampilan kartu utama.

#### 2. Bahasa Antarmuka Komunikatif & Opsi Model Bersih
- Menata ulang pesan status kunci bawaan agar komunikatif tanpa membingungkan pengguna.
- Merapikan penamaan opsi pilihan model pada *dropdown* (DeepSeek-V3, DeepSeek-R1 HOTS, Llama 3.3 70B, Gemini 2.0 Flash) dengan penjelasan fungsi yang ringkas dan bebas redundansi.
- Memperbarui tautan panduan resmi (*Dapatkan Kunci*) serta catatan privasi penyimpanan lokal dengan visual proteksi yang tenang.

## [2.2.83] - 2026-09-11
### Penyesuaian Penamaan Kartu Mesin Alternatif: Lokal & Prompt / Berkas

#### 1. Pembaruan Penamaan Kartu Pembuat Kuis
- Mengubah nama kartu mesin peramban offline dari **"Tanpa Internet"** menjadi **"Lokal"** agar lebih tegas, profesional, dan ringkas.
- Mengubah nama kartu impor manual dari **"Salin / Berkas"** menjadi **"Prompt / Berkas"** agar lebih deskriptif terhadap dukungan salin prompt AI eksternal maupun berkas dokumen.
- Memperbarui sub-judul kategori kelompok menjadi **"Alternatif & Lokal:"** untuk menjaga konsistensi hierarki antarmuka.

## [2.2.82] - 2026-09-11
### Pemisahan Terstruktur Mesin Cloud AI dan Opsi Alternatif/Offline

#### 1. Pengelompokan Kategori Mesin yang Jelas & Terpisah
- Memisahkan secara tegas antara pilihan **Model Cloud AI (Online)** dan **Pilihan Alternatif & Offline**:
  - **Tingkat 1 (Opsi Utama)**: Kartu **Mode Otomatis (Direkomendasikan)** dengan deteksi model aktif dan rantai *fallback* otomatis.
  - **Tingkat 2 (Model Cloud AI)**: Grid 3 kartu terfokus untuk model cloud online (**DeepSeek AI**, **Groq Cloud**, dan **Google Gemini**) lengkap dengan ikon asli, badge status koneksi, dan deskripsi ringkas.
  - **Tingkat 3 (Alternatif & Tanpa Internet)**: Grid 2 kartu khusus untuk pembuatan kuis tanpa API (**Tanpa Internet / Lokal** & **Salin / Berkas / Impor Manual**).
- Mengeliminasi pencampuran visual antara mesin cloud berbasis server dan mesin lokal/manual, menciptakan hierarki informasi yang teratur, rapi, dan mudah dipahami guru.

## [2.2.81] - 2026-09-11
### Pembersihan Deskripsi Mesin AI (Bebas AI Slop & Bahasa Natural)

#### 1. Deskripsi Pilihan Mesin AI Ringkas & Bersih
- Menulis ulang seluruh deskripsi mesin AI pada kartu generator agar lebih komunikatif, natural, dan bebas dari istilah promosi berlebih (*AI slop*):
  - **Otomatis**: *"Pilih model terbaik otomatis. Beralih ke cadangan jika batas tercapai."*
  - **Lokal**: *"Buat soal langsung di peramban tanpa internet atau kuota API."*
  - **DeepSeek AI**: *"Fokus pada soal penalaran logis dan berpikir kritis (HOTS)."*
  - **Groq Cloud**: *"Generasi butir soal paling cepat dengan pemrosesan efisien."*
  - **Google Gemini**: *"Gaya bahasa luwes dengan variasi pertanyaan yang luas."*
  - **Salin / Berkas**: *"Gunakan hasil prompt AI eksternal atau impor berkas dokumen."*

#### 2. Penyeragaman Modal Pengaturan Kunci API Pribadi
- Menghapus kotak promosi berlebih pada tab DeepSeek dan menggantinya dengan catatan privasi penyimpanan lokal yang konsisten dan informatif.
- Merapikan label opsi pilihan model (*dropdown*) di seluruh tab penyedia API (DeepSeek, Groq, Gemini) agar menggunakan penamaan teknis yang ringkas tanpa klaim berlebihan.

## [2.2.80] - 2026-09-11
### Integrasi Sempurna Mode Otomatis dengan Restorasi Ikon Ikonik Mesin AI

#### 1. Mode Otomatis (Auto) sebagai Opsi Utama
- Menghadirkan kembali kartu **Mode Otomatis (Direkomendasikan)** di posisi teratas dengan deteksi model aktif dinamis (`Aktif: 🐋 DeepSeek` dsb.) serta rantai fallback cerdas saat kuota/antrean server tercapai.
- Pengguna tetap dapat memilih model AI spesifik langsung dari daftar kartu di bawahnya secara bebas.

#### 2. Restorasi Total Ikon Ikonik Mesin AI
- Mengembalikan gaya ikon kotak squircle dengan palet warna asli untuk seluruh pilihan mesin:
  - **Otomatis**: Ikon `⚡` dalam kotak biru solid (`bg-blue-600`).
  - **Lokal**: Ikon `🤖` dalam kotak squircle biru lembut (`bg-blue-100 dark:bg-blue-900/60 text-blue-600`).
  - **DeepSeek AI**: Ikon `🐋` dalam kotak squircle biru langit (`bg-sky-100 dark:bg-sky-900/60 text-sky-600`).
  - **Groq Cloud**: Ikon `⚡` dalam kotak squircle amber (`bg-amber-100 dark:bg-amber-900/60 text-amber-600`).
  - **Google Gemini**: Ikon `✨` dalam kotak squircle ungu (`bg-purple-100 dark:bg-purple-900/60 text-purple-600`).
  - **Salin / Berkas**: Ikon `📝` dalam kotak squircle indigo (`bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600`).

## [2.2.79] - 2026-09-11
### Pengembalian Tampilan Pilihan Mesin AI ke Format Standar (5 Kartu)

#### 1. Restorasi Grid Mesin AI (Tahap 4)
- Mengembalikan susunan dan tata letak pilihan Mesin AI ke format 5 kartu grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5`):
  - **Lokal**: Mesin pembuat kuis cepat tanpa internet/kuota API (Selalu Siap).
  - **DeepSeek**: Model penalaran mendalam (R1 & V3).
  - **Groq**: Generasi ultra-cepat dengan LPU.
  - **Gemini**: Pembuatan soal luas & kontekstual.
  - **Salin / Berkas**: Alur salin prompt manual atau impor berkas dokumen.
- Mempertahankan fitur diagnostik koneksi AI yang telah ditingkatkan: tombol **Refresh** status paralel, pengecekan ketersediaan kunci, serta banner informasi status yang akurat.

## [2.2.78] - 2026-09-11
### Penyempurnaan Tampilan Bersih (Clean UI) Mesin AI & Kunci API Pribadi

#### 1. Pembersihan Tampilan Pilihan Mesin AI (Tahap 4)
- Menghilangkan dekorasi visual berlebih (emoji berulang, dot indikator kompleks, dan badge berlapis) demi menghadirkan antarmuka yang tenang, rapi, dan mudah dipindai di berbagai ukuran layar.
- Kartu **Otomatis (Direkomendasikan)** ditata secara elegan sebagai opsi utama lengkap dengan status mesin aktif saat ini.
- Tiga mesin cloud (**DeepSeek**, **Groq**, dan **Google Gemini**) disusun dalam grid 3 kolom yang kompak, simetris, dan responsif.
- Opsi alternatif (**Tanpa Internet / Offline** dan **Salin Teks / Berkas / Manual**) disajikan dalam dua kartu sejajar yang bersih tanpa perlu membuka-tutup accordion yang rumit.
- Target sentuh disesuaikan mengikuti standar mobile-first (minimal 44px) dengan visual feedback yang halus.

#### 2. Redesain Elegan Modal Kunci API Pribadi
- Menghapus seluruh teks promosi dan istilah teknis yang tidak perlu (*AI slop*) pada modal pengaturan API Key.
- Mengganti penamaan teknis *BYOK* menjadi **Kunci API Pribadi** yang komunikatif bagi para pendidik.
- Pemilihan model disederhanakan menggunakan nama resmi yang ringkas dan bebas dari deskripsi berlebihan.
- Segmented tab navigasi diperbarui menjadi flat, minimalis, dan dilengkapi indikator dot hijau jika kunci telah tersimpan.
- Catatan keamanan data disajikan secara profesional dan transparan (kunci hanya tersimpan di peramban lokal perangkat pengguna).

## [2.2.77] - 2026-09-11
### Redesign Tahap 4 — Mode Otomatis & Tampilan Mesin AI yang Lebih Cerdas

#### 1. Mode Pilihan Otomatis (Auto) — Default
- Ditambahkan opsi **Otomatis** sebagai pilihan baru yang menjadi default saat masuk ke Tahap 4.
- Aplikasi secara cerdas memilih AI terbaik yang tersedia mengikuti urutan prioritas: DeepSeek → Groq → Gemini → Lokal.
- Chip dinamis menampilkan AI yang akan digunakan secara real-time.
- Jika eksekusi gagal, mode Auto secara diam-diam beralih ke AI cadangan berikutnya tanpa menampilkan error kepada pengguna.

#### 2. Indikator Kecepatan & Kedalaman per Mesin AI
- Setiap kartu cloud AI kini menampilkan dua indikator visual: **Cepat** (hijau) dan **Pintar** (biru) dalam skala 4 dot, membantu guru memilih sesuai kebutuhan.
- Indikator dot meredup (abu-abu) jika mesin tidak tersedia, memberikan umpan balik visual yang jelas.

#### 3. Pengelompokan Ulang Opsi
- Opsi terbagi menjadi dua kelompok yang terpisah secara visual:
  - **Kartu Auto** (full-width, di atas): pilihan utama yang direkomendasikan.
  - **Grid 3 Cloud AI**: DeepSeek, Groq, Gemini dalam tata letak 3 kolom kompak.
  - **Cara Lain** (ekspander collapse/expand): mengelompokkan "Tanpa Internet" dan "Salin / Berkas" agar tidak menghabiskan ruang layar.
- "Lokal" diganti nama menjadi **"Tanpa Internet"** agar lebih komunikatif untuk pengguna non-teknis.

#### 4. Status Warning yang Lebih Ramping
- Banner peringatan saat mesin bermasalah (quota habis, sibuk, error) kini lebih ringkas dengan tombol **"Pakai Auto"** untuk beralih cepat ke mode otomatis.

## [2.2.76] - 2026-09-10
### Fleksibilitas Format Soal: Opsi Pilihan Ganda 3/4/5, Gaya Benar/Salah, dan Jumlah Pasang Menjodohkan

#### 1. Kontrol Jumlah Opsi Pilihan Ganda (3, 4, atau 5)
- Guru kini dapat memilih jumlah opsi jawaban pilihan ganda: **3 opsi (A, B, C)**, **4 opsi (A, B, C, D)**, atau **5 opsi (A, B, C, D, E)** sesuai kebutuhan soal dan usia siswa.
- Panel pengaturan lanjutan tampil otomatis di bawah kartu format saat tipe terkait dipilih.
- Deskripsi kartu format diperbarui secara dinamis mengikuti pilihan yang aktif.

#### 2. Gaya Label Benar / Salah
- Tiga gaya pasangan opsi kini tersedia: **Benar / Salah** (default), **Sesuai / Tidak Sesuai**, dan **Ya / Tidak**, dapat dipilih langsung di pengaturan format soal.
- Deskripsi kartu Benar/Salah diperbarui secara real-time sesuai gaya aktif.

#### 3. Jumlah Pasangan Kartu Menjodohkan (3, 4, atau 5 pasang)
- Guru dapat menentukan jumlah pasang kartu per soal menjodohkan: **3**, **4**, atau **5 pasang**, dengan stepper tombol yang intuitif.

#### 4. Sinkronisasi Pipeline AI End-to-End
- `buildInstructionText` di pipeline AI langsung (`geminiApi.ts`) kini sepenuhnya dinamis mengikuti pilihan `mcOptionCount`, `trueFalseStyle`, dan `matchingPairCount` — tidak ada lagi instruksi hardcoded "4 opsi A, B, C, D".
- `generateAiPrompt` untuk fitur Salin Prompt juga disinkronkan dengan parameter yang sama.
- `normalizeQuestions` diperbarui untuk menggunakan fallback opsi yang sesuai `mcOptionCount`.
- Parser teks bebas (`aiQuestionParser.ts`) diperluas mendukung opsi **E** pada pilihan ganda: regex deteksi opsi, kunci jawaban, dan `letterIdx` semuanya diperbarui ke `[A-E]`.

## [2.2.75] - 2026-09-10
### Audit Menyeluruh Tahap Mesin AI: Eliminasi AI Slop, Layout Mobile Ramping & Peningkatan Keterbacaan

#### 1. Eliminasi Total AI Slop & Repetisi Teks Kaku
- Menghapus teks footer kaku dan repetitif (`"✓ Sedang Dipilih"` dan `"Klik untuk Memilih"`) pada seluruh kartu mesin AI, menggantikannya dengan indikator radio checkmark lingkaran modern yang bersih dan intuitif.
- Memperbaiki kalimat copywriting kartu dari jargon teknis yang kaku menjadi manfaat nyata yang ramah dan manusiawi (menghapus istilah robotik seperti *"Komputasi LPU Llama 3.3 70B"* dan klaim klise).
- Memperbaiki inkonsistensi teks hardcoded *"ramah anak SD"* pada Gemini menjadi deskripsi universal dan adaptif terhadap seluruh jenjang pendidikan (SD, SMP, dan SMA/SMK).
- Memperbaiki teks status peracikan tombol eksekusi (`"Sedang Meracik Butir Soal SD..."` menjadi `"Sedang Meracik Butir Soal..."`) agar akurat dan konsisten untuk semua tingkatan kuis.

#### 2. Desain Kartu Mobile-First Kompak & Proporsional
- Menerapkan layout kartu horizontal yang sangat ergonomis di layar ponsel (`min-h-[58px]` dengan target sentuh $\ge 48$px), memangkas lebih dari 400px tinggi vertikal halaman sehingga 5 kartu mesin dapat langsung terlihat tanpa perlu scroll berulang kali.
- Menyediakan badge status mini adaptif di mobile (`Siap`, `Sibuk`, `Habis`, `Kendala`, `Belum`) dan badge lengkap di layar desktop (`Selalu Siap`, `Siap Digunakan`, `Belum Disetel`, dll).
- Di layar tablet dan desktop, kartu tetap tersusun dalam bento grid 5-kolom yang luas, elegan, dan berimbang.

#### 3. Optimalisasi Sub-antarmuka Salin Prompt & Berkas (Opsi 5)
- Menyeimbangkan ketinggian textarea prompt sistem dan textarea tempel teks dari yang sebelumnya raksasa `rows={10}` menjadi proporsional `rows={5}`, menjaga fokus pengisian dan menghemat ruang layar ponsel.
- Memperbaiki petunjuk tata letak teks agar sesuai dengan orientasi responsif (*"samping/bawah"*).
- Merampingkan kotak seret-dan-lepas berkas (*file upload*) dengan tautan unduh template CSV kuis yang bersih.

#### 4. Navigasi & Tindakan Cepat (One-Tap Action)
- Menyematkan tombol *"Gunakan Mesin Lokal Saja"* langsung di dalam kotak alert kuota dan error, memungkinkan pengguna beralih dalam 1 ketukan tanpa perlu mencari tombol secara manual.
- Menyematkan tombol navigasi *"Kembali ke Format"* di sisi kiri tombol eksekusi kuis untuk pengalaman alur kerja yang mudah dan intuitif di mobile maupun desktop.
- Mengintegrasikan kolom *Catatan Tambahan* ke dalam parameter instruksi pembuatan kuis AI.

## [2.2.74] - 2026-09-10
### Pembersihan Gaya Bahasa (Copywriting) Kartu Ilustrasi Soal

#### 1. Eliminasi Redundansi & AI Slop pada Label Fitur
- Menyederhanakan judul fitur dari *"Sertakan Gambar Ilustrasi AI"* menjadi lebih lugas, elegan, dan profesional: **"Ilustrasi Soal"** dengan badge status **BETA**.
- Mengganti kalimat deskripsi yang terkesan kaku dan bertele-tele (*AI slop*) menjadi satu kalimat manusiawi yang ringkas dan bersahabat: *"Buat gambar visual pendukung yang sesuai dengan materi kuis."*
- Memperbarui badge ringkasan Tahap 4 menjadi `+ Ilustrasi (Beta)`.

## [2.2.73] - 2026-09-10
### Pelabelan Status Beta Ilustrasi AI & Penegasan Relevansi Gambar Nyata

#### 1. Pelabelan Status Beta pada Antarmuka (*Experimental Beta Badge*)
- Menyematkan badge **BETA** warna aksen amber yang jelas pada kartu toggle *"Sertakan Gambar Ilustrasi AI"* di Tahap 3 dan ringkasan konfigurasi Tahap 4.
- Memperbarui deskripsi fitur secara transparan: menjelaskan bahwa fitur ini berada pada tahap eksperimental (*Beta*) yang berupaya mencari/menghasilkan gambar ilustrasi nyata yang relevan dengan pertanyaan (bukan ikon generik/stiker acak), dan hasilnya bergantung pada ketersediaan generator AI.

#### 2. Peningkatan Akurasi & Relevansi Generator Gambar
- Mempertegas instruksi prompt sistem AI untuk mewajibkan properti `imagePrompt` berbahasa Inggris yang spesifik dan kontekstual terhadap materi kuis (menghindari ikon kartun abstrak).
- Membersihkan emoji dan karakter non-standar dari input prompt gambar agar tidak merusak tautan URL generator Pollinations AI.
- Mengutamakan `imagePrompt` kontekstual dalam `normalizeQuestions` untuk menghasilkan diagram atau ilustrasi edukasi nyata yang presisi.

## [2.2.72] - 2026-09-10
### Optimalisasi Tinggi Kolom Catatan Tambahan & Interaktivitas Drag Resize di Mobile

#### 1. Peningkatan Tinggi Awal (*Comfortable Base Height*)
- Meningkatkan tinggi dasar kolom **Catatan Tambahan** pada Tahap Topik dari yang sebelumnya hanya 3 baris (~70px) menjadi lebih luas dan lega (`min-h-[115px] sm:min-h-[125px]`, `rows={4}`), sehingga pengguna di perangkat mobile dapat mengetik instruksi khusus tanpa merasa sempit.

#### 2. Kontrol Tarik Ujung Interaktif (*Custom Drag Resize Handle*)
- Mengaktifkan fitur perbesaran vertikal mandiri (`resize-y`) dengan batasan proporsional.
- Menyematkan indikator grip 6-titik universal di sudut kanan bawah yang mendukung sentuhan langsung jari pada layar ponsel (*touch drag via PointerEvent*) maupun mouse/trackpad di desktop, memungkinkan pengguna memperbesar tinggi kolom secara bebas sesuai kebutuhan instruksi mereka.

## [2.2.71] - 2026-09-10
### Refaktor Tahap Format Soal: Eliminasi AI Slop, Layout Ringkas, dan Konsistensi Konteks

#### 1. Penyelarasan Strip Konteks (Tahap 2, 3, dan 4)
- Menghapus tombol redundan *"Ubah Topik"* dan *"Ubah Pengaturan"* yang sebelumnya memakan ruang dan memicu pemenggalan baris janggal (*broken wrap*) pada layar ponsel.
- Menerapkan chip konteks ramping 1 baris terpadu (`[Emoji] Mapel • Kelas • "Topik" • [Soal]`) yang dapat diklik langsung untuk kembali ke tahap sebelumnya secara mulus.

#### 2. Penyederhanaan Pilihan Jumlah Butir Soal
- Mengeliminasi repetisi teks berulang (*AI slop*) dari tombol butir soal (`"X Butir Soal"` disederhanakan menjadi `{X} Soal`).
- Memperbaiki kotak input kustom ke-6 agar tidak lagi menampilkan duplikasi angka yang membingungkan saat opsi preset dipilih. Kotak kustom kini memiliki placeholder jernih (`Kustom`) dan status fokus yang jelas.
- Menyusun tombol preset dalam tata letak responsif 3-kolom di ponsel (2 baris rapi) dan 6-kolom di desktop (1 baris seimbang).

#### 3. Redesain Kompak Kartu Format Tipe Soal
- Mengeliminasi teks deskripsi ganda yang berulang pada judul bagian.
- Menata 4 kartu format dalam format grid 2×2 di ponsel dan 4-kolom di desktop sehingga seluruh format dapat ditinjau langsung tanpa harus menggulir berlebihan.
- Menghilangkan *triple status indicator* (lingkaran radio + badge "Terpilih" + footer "✓ Aktif dalam Kuis"), digantikan dengan indikator centang terpadu yang elegan dan modern.

#### 4. Kontrol Proporsi Cerdas & Toggle Ilustrasi AI Modern
- Menyembunyikan banner penguncian 100% yang bertele-tele saat hanya 1 tipe format aktif, sehingga tampilan tetap bersih dan fokus pada pengisian.
- Menampilkan kontrol proporsi (*Seimbang* vs *Kustom*) secara dinamis hanya jika pengguna memilih 2 format atau lebih.
- Mengubah kotak ilustrasi AI menjadi kartu toggle switch modern dengan ikon palet seni yang ramah sentuhan.

## [2.2.70] - 2026-09-10
### Penegasan Hierarki Visual Input Utama & Eliminasi Truncate pada Saran Ide Topik

#### 1. Penegasan Kolom Input Utama & Catatan Tambahan
- Meningkatkan ketegasan visual (*visual dominance*) kolom **Topik Pembahasan Kuis** dan **Catatan Tambahan** dengan batas tebal (`border-2 border-slate-300 dark:border-slate-700`), ring fokus yang kontras, serta latar belakang kartu yang tegas.
- Memastikan kolom input utama tetap menjadi pusat perhatian (*primary focus*) yang jelas, tidak teredam atau tersaingi oleh elemen pembantu di sekitarnya.

#### 2. Kartu Saran Topik Ringan & Tanpa Truncate (Zero Truncate)
- Mengeliminasi pemotongan elipsis (*no truncate / no line-clamp*) pada kartu saran ide topik, sehingga seluruh frasa materi kurikulum panjang terbungkus rapi ke bawah (*natural soft-wrapping / break-words*) dan terbaca 100% utuh.
- Mengubah gaya visual kartu saran topik menjadi chip pembantu sekunder yang ringan (*lightweight secondary helper*):
  - Latar belakang transparan halus dengan border tipis teratur.
  - Ikon aksen `+` / `✓` yang anggun dan minimalis.
  - Mencegah kesan kartu saran menyerupai kolom input ganda yang membingungkan pengguna.

## [2.2.69] - 2026-09-10
### Penyempurnaan Saran Topik Cepat: Bento Grid 2-Kolom Maksimal 2 Baris di Layar Lebar

#### 1. Transformasi Bento Grid Adaptif di Layar Lebar (*Desktop & Tablet*)
- Menghadirkan tata letak **Bento Grid 2-Kolom (`sm:grid-cols-2`)** untuk seksi saran topik cepat di layar lebar (tablet/desktop), membatasi susunan rekomendasi menjadi **maksimal 2 baris** (2 × 2 card).
- Mengeliminasi bilah geser horisontal (*horizontal scrollbar*) dan panah geser yang sebelumnya mengganggu estetika desktop, sehingga area rekomendasi menyatu secara elegan dengan lebar form input di atasnya.
- Setiap kartu Bento dilengkapi indikator titik aksen modern, perataan vertikal yang seimbang, *hover effect* lembut, dan pembungkusan judul hingga 2 baris (`line-clamp-2`) tanpa merusak keseragaman grid.

#### 2. Optimasi Jalur Geser Bersih Tanpa Scrollbar di Layar Ponsel (*Mobile Track*)
- Mempertahankan format 1 baris geser (*single swipeable track*) di layar ponsel untuk menghemat ruang vertikal.
- Menghilangkan tampilan bilah geser bawaan peramban menggunakan kelas utilitas `[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`, menghasilkan interaksi sentuh geser jempol yang mulus dan bersih.

## [2.2.68] - 2026-09-10
### Bidang Input Judul & Topik Fleksibel dengan Pembungkusan Teks Otomatis (Auto-Wrap & Auto-Resize)

#### 1. Pembungkusan Teks Otomatis ke Bawah (*Downward Text Wrapping*)
- Mengonversi elemen input satu baris (*single-line input*) pada kolom **Topik Pembahasan Kuis** (Tahap 2 Generator AI dan Modal AI) serta **Judul Kuis** (Info Kuis Dasar) menjadi bidang teks yang membungkus kata ke bawah (*soft wrapping*) secara otomatis ketika teks melebihi batas lebar layar.
- Mencegah teks terpotong secara horisontal (*horizontal ellipsis/clipping*) pada layar ponsel, sehingga topik panjang seperti *"Operasi Perkalian dan Pembagian Bilangan Cacah"* dapat terbaca utuh 100% tanpa ada huruf yang tersembunyi.

#### 2. Penyesuaian Tinggi Dinamis (*Flexible Dynamic Height*)
- Mengimplementasikan penyesuaian tinggi otomatis berbasis `scrollHeight` yang adaptif:
  - Dimulai dari ketinggian standar 1 baris ramping (~46 px).
  - Mengembang (*expand*) ke bawah secara dinamis mengikuti penambahan baris teks.
- Dilengkapi sanitasi enter (`Enter` key suppression) untuk menjaga teks judul/topik tetap merupakan satu kesatuan frasa tanpa baris kosong berlebih.
- Mengaktifkan `spellCheck={false}` untuk tampilan antarmuka yang bersih bebas dari garis merah pemeriksa ejaan.

## [2.2.67] - 2026-09-10
### Transformasi Ringkasan Mapel Menjadi Strip Pill Mini Ramping 1 Baris (Opsi B)

#### 1. Penggantian Card Besar dengan Strip Konteks Mini
- Mengganti kartu ringkasan mata pelajaran dan kelas di Tahap 2 yang sebelumnya memakan ruang vertikal besar (~60–75 px) menjadi strip pill mini ramping 1 baris (`inline-flex` ~32 px).
- Menghapus tombol *"Ubah ✏️"* terpisah yang redundan dengan Tab 1 Mapel pada sticky header atas.
- Strip pill mini tetap berfungsi informatif sebagai penunjuk konteks mapel/kelas yang aktif, sekaligus dapat diklik secara halus untuk kembali ke Tahap 1 jika pengguna menginginkannya.
- Menghemat ruang vertikal secara drastis di layar ponsel, sehingga formulir input topik dan catatan langsung terlihat tanpa perlu menggulir (*zero clutter / mobile-first*).

## [2.2.66] - 2026-09-10
### Eliminasi Redundansi Tombol Kembali Bawah & Penyempurnaan Ergonomi Tombol Lanjut (Mobile-First)

#### 1. Penghapusan Tombol Kembali Redundan pada Area Bawah
- Menghapus tombol *"Kembali"* di samping tombol *"Lanjut"* pada seluruh tahapan pembuat kuis AI (Tahap 2, Tahap 3, dan Tahap 4) karena telah terakomodasi secara permanen oleh tombol panah kembali (`←`) di sticky header atas serta bilah tab nomor tahapan.
- Mengeliminasi distorsi tata letak di mana tombol kembali bawah sebelumnya menghimpit tombol aksi utama (*Call-to-Action*) dan menyebabkan teks terpotong atau patah menjadi 3 baris di perangkat ponsel.

#### 2. Tombol Aksi Utama Lega (*Full-Width* Mobile & Rapi di Kanan Desktop)
- Mengubah tombol navigasi maju menjadi elemen tunggal penuh (*full-width*) di perangkat ponsel dan rata kanan rapi di layar desktop (`w-full sm:w-auto`).
- Teks label tombol diperjelas menjadi 1 baris ringkas: **Lanjut ke Format Soal →**, **Lanjut ke Pilihan Mesin AI →**, dan **Buat Kuis Sekarang & Buka Bank Soal ⚡**, memberikan area tap jempol yang nyaman ($\ge 48$ px).

#### 3. Perapian Banner Mapel & Kelas Serta Tab Progres
- Merapikan tata letak kartu ringkasan kelas & mata pelajaran di Tahap 2 agar teks jenjang dan mapel tidak terpecah dengan titik pemisah terisolasi di layar sempit.
- Mengoptimalkan *padding* dan ukuran teks pada 4 tab navigasi di perangkat mobile (`px-0.5 xs:px-1.5`) sehingga label tahapan (seperti "Format") tidak terpotong menjadi elipsis.
- Menambahkan atribut `spellCheck={false}` pada kolom catatan tambahan untuk mencegah garis merah pemeriksa ejaan yang mengganggu estetika.

## [2.2.65] - 2026-09-10
### Optimalisasi Tampilan Saran Topik Menjadi 1 Baris Horisontal Swipeable & Penegasan Kotak Catatan Khusus

#### 1. Kompaksi Saran Topik Cepat (Ultra-Compact Single Track)
- Mengubah susunan saran rekomendasi topik kuis dari multi-baris vertikal (*flex-wrap*) menjadi 1 baris horisontal yang dapat digeser (*single swipeable track* / `flex-nowrap overflow-x-auto touch-pan-x`).
- Membatasi ketinggian vertikal section saran topik menjadi ramping (~34px) sehingga menghemat ruang layar vertikal secara signifikan di perangkat *smartphone*.
- Mengatur panjang chip rekomendasi dengan *text truncation* anggun (`max-w-[260px] truncate`) dan *touch target* nyaman yang mematuhi standar ergonomis sentuhan.

#### 2. Penegasan Visibilitas Kotak Catatan Tambahan (Bahan Pertimbangan Khusus)
- Menyederhanakan judul label menjadi **Catatan Tambahan (Opsional)** yang lugas dan komunikatif.
- Mengatur ketinggian textarea menjadi 3 baris proporsional (`rows={3}`) dengan kontras batas dan latar belakang yang tegas, memastikan kotak catatan tidak lagi tenggelam atau tertutup oleh tumpukan teks rekomendasi di perangkat mobile.
- Memberikan deskripsi panduan yang ringkas dan informatif di bawah textarea tanpa membebani antarmuka.

## [2.2.64] - 2026-09-10
### Perbaikan Redundansi Penomoran pada Tab Tahapan Pembuat Kuis Sticky Header

#### 1. Eliminasi Nomor Ganda pada Tab Navigasi Langkah
- Memperbaiki redundansi penomoran di mana lencana nomor bulat telah menampilkan angka tahap (`1`, `2`, `3`, `4`), namun teks label di sebelahnya masih memuat awalan angka yang sama (`1. Mapel & Kelas`, `2. Topik Materi`, dst).
- Menyederhanakan teks label tahapan menjadi bersih dan proporsional:
  - Tab 1: Bulat `1` + **Mapel & Kelas** (Ponsel: **Mapel**)
  - Tab 2: Bulat `2` + **Topik Materi** (Ponsel: **Topik**)
  - Tab 3: Bulat `3` + **Format Soal** (Ponsel: **Format**)
  - Tab 4: Bulat `4` + **Mesin AI** (Ponsel: **Mesin**)
- Mengoptimalkan ruang tampilan (*screen real-estate*) tombol tab di layar ponsel agar label tidak terpotong atau mengalami *text-wrap* canggung.

## [2.2.63] - 2026-09-10
### Integrasi Matriks Profil Perangkat Emulasi Kustom untuk Quality Check Responsivitas

#### 1. Konfigurasi Profil Perangkat Nyata (Android & Desktop Split)
- Mengintegrasikan 8 profil perangkat kustom Chrome DevTools ke dalam sistem dokumentasi (`docs/devices-emulation.json`) dan panduan pengembang (`AGENTS.md`):
  - **Infinix Note 50s**: Potret (392 × 778 px, DPR 2.75) dan Lanskap (850 × 296 px, DPR 2.75).
  - **Redmi Note 7**: Potret (431 × 846 px, DPR 2.51) dan Lanskap (901 × 347 px, DPR 2.51).
  - **Infinix Note 11s**: Potret (415 × 866 px, DPR 2.60) dan Lanskap (946 × 335 px, DPR 2.60).
  - **Desktop Multi-Window**: Half Screen (723 × 704 px, DPR 1.00) dan Quarter Screen (723 × 296 px, DPR 1.00).

#### 2. Skrip Otomasi Audit Responsivitas & Verifikasi Multi-Device
- Menghadirkan skrip otomatisasi audit responsivitas `scripts/audit-responsive.js` yang dapat dijalankan melalui perintah `npm run audit:responsive`.
- Melakukan verifikasi langsung menggunakan Playwright pada seluruh 8 profil perangkat, membuktikan `scrollWidth === clientWidth` (100% bebas luapan horizontal / *zero overflow*) dan tata letak tetap stabil bahkan pada rasio layar sempit dan ketinggian minimal (296 px).

## [2.2.62] - 2026-09-10
### Audit Kebersihan & Minimalisme Antarmuka Tahap 2 Pembuat Kuis (Eliminasi AI Slop)

#### 1. Transformasi Rekomendasi Topik Cerdas Menjadi Tag Ringkas
- Mengganti kotak kartu rekomendasi topik yang tebal dan memakan ruang dengan deretan *quick suggestion chips* yang minimalis dan elegan langsung di bawah bidang input topik kuis.
- Menempatkan aksi *"Acak Ide"* secara rapi dan kompak sejajar dengan label saran cepat tanpa wadah latar belakang yang berat.
- Memberikan interaksi pemilihan topik instan: satu ketukan pada chip rekomendasi akan langsung mengisi topik kuis dan preferensi konteks terkait.

#### 2. Penghapusan Kotak Tips Berulang & Penataan Ruang Napas Mobile
- Menghapus kotak informasi instruksional (*callout box*) berisikan butir-butir teks panjang yang menimbulkan kesan *AI slop* dan memperpanjang guliran layar ponsel secara tidak perlu.
- Menyederhanakan instruksi tambahan menjadi keterangan teks satu baris yang tenang dan informatif di bawah area *textarea* catatan khusus.
- Menghasilkan tata letak yang proporsional, simetris di desktop (kolom kiri dan kanan seimbang), serta ringkas dalam satu pandangan layar utuh (*single-fold*) di perangkat ponsel cerdas.

## [2.2.61] - 2026-09-10
### Reset Otomatis Posisi Scroll & Fokus ke Bagian Atas Halaman saat Navigasi Langkah Pembuat Kuis

#### 1. Reset Posisi Scroll Instan (Scroll-to-Top)
- Mengatasi kendala posisi scroll yang tertahan di bagian bawah saat berpindah tahapan (*Next* / *Previous*) pada Asisten Racik Kuis AI maupun Studio Kuis.
- Menerapkan mekanisme reset scroll langsung (`window.scrollTo({ top: 0, left: 0, behavior: 'instant' })`) yang diperkuat dengan sinkronisasi `requestAnimationFrame` untuk mencegah efek loncat (*scroll retention*) saat peramban menghitung tata letak baru.
- Menetapkan `window.history.scrollRestoration = 'manual'` guna memastikan peramban tidak memaksakan posisi scroll dari langkah sebelumnya.

#### 2. Manajemen Fokus Aksesibilitas (a11y)
- Menambahkan referensi kontainer utama (`mainContentRef` dan `containerRef`) dengan atribut `tabIndex={-1}` yang secara otomatis memindahkan fokus peramban ke bagian atas kartu konten baru tanpa pergeseran scroll yang tidak diinginkan (`preventScroll: true`).
- Memastikan pembaca layar (*screen reader*) dan navigasi keyboard langsung memulai interaksi dari awal tahapan baru (judul tahapan dan masukan utama), alih-alih tertahan pada elemen tombol lama yang telah dilepas (*unmounted*).

## [2.2.60] - 2026-09-10
### Penyelarasan Presisi Tata Letak Tab Tahapan Pembuat Kuis Sticky Header dengan Kontainer Konten

#### 1. Penyelarasan Margin dan Padding Horizontal Tab Sticky Header
- Menyelaraskan padding horizontal kontainer tab 4-tahap pembuatan kuis AI (`px-3 xs:px-4 sm:px-8 lg:px-12`) agar sejajar presisi dengan tepi kiri dan kanan kartu konten di bawahnya (`AiGeneratorStep`).
- Menghilangkan tampilan tab yang sebelumnya terlalu menempel ke tepi layar (*edge-to-edge*), menghadirkan ruang napas visual yang harmonis di perangkat desktop, tablet, maupun layar sentuh ponsel.
- Menambahkan bantalan vertikal bawah (`pb-2.5 sm:pb-3`) pada kontainer tab agar indikator *progress track* memiliki jarak estetis yang konsisten dengan garis pembatas header.
- Menerapkan penyesuaian penyelarasan yang sama pada tab navigasi 3-langkah mode Studio Kuis utama.

#### 2. Kestabilan Responsivitas & Target Sentuh Mobile
- Mempertahankan ukuran target sentuh ramah jari ($\ge 44\times 44\text{ px}$) untuk semua tombol tab tahapan di berbagai orientasi layar.
- Memastikan label tahapan tetap rapi dan tidak mengalami distorsi layout pada berbagai resolusi layar ponsel reguler maupun non-reguler.

## [2.2.59] - 2026-09-10
### Standarisasi Mata Pelajaran IPS SD, Kartu Pemilihan Format Tipe Soal Cerdas Dinamis, Deteksi Status Kesehatan Mesin AI & Penyeragaman Nama Mesin Lokal

#### 1. Standarisasi Mata Pelajaran SD: Pengetahuan Umum Diubah Menjadi IPS
- Mengubah nama mata pelajaran **Pengetahuan Umum** menjadi **IPS** (Ilmu Pengetahuan Sosial) pada jenjang SD di seluruh katalog kurikulum, topik tematik, kamus emoji, dan pemetaan Capaian Pembelajaran (CP).
- Menghadirkan silabus topik tematik dan materi esensial IPS lengkap untuk Kelas 1 sampai Kelas 6 SD (Lingkungan Rumah, Denah & Peta, Sejarah Daerah, Keragaman Budaya, Aktivitas Ekonomi, dan Pelestarian Alam).
- Menyediakan mekanisme alias cerdas dari istilah lama ke IPS untuk menjaga kompatibilitas data kuis terdahulu.

#### 2. Kartu Pemilihan Format Tipe Soal & Alokasi Proporsi Cerdas Dinamis
- **Tahap Pemilihan Kartu Format (Pre-Selection)**:
  - Menyediakan 4 kartu format tipe soal interaktif: **Pilihan Ganda**, **Benar / Salah**, **Isian Singkat**, dan **Menjodohkan**.
  - Pendidik dapat memilih 1 format tunggal maupun mengombinasikan beberapa format secara fleksibel dengan target sentuh ramah sentuhan (≥ 44×44 px).
- **Alokasi Proporsi Cerdas Dinamis**:
  - **Format Tunggal**: Jika hanya 1 format yang dipilih, sistem mengunci alokasi 100% secara otomatis tanpa memerlukan penyetelan slider/stepper manual.
  - **Multi-Format Terpilih**:
    - **Mode Otomatis Berimbang**: Menghitung dan membagikan butir soal secara seimbang ke format-format yang aktif dengan rincian butir transparan.
    - **Mode Kustom Mandiri**: Hanya menampilkan kartu pengatur butir untuk format yang telah dipilih sebelumnya, lengkap dengan verifikasi kecocokan total butir kuis.

#### 3. Deteksi Status Kesehatan Mesin AI (Informatif & Sederhana)
- Menghadirkan indikator status kesehatan (*health status*) pada setiap mesin pembuat soal (DeepSeek AI, Groq Cloud LPU, Google Gemini AI):
  - 🟢 **Siap Digunakan**: Layanan aktif dan siap memproses prompt kuis.
  - 🟡 **Sedang Sibuk**: Server eksternal mendeteksi lonjakan antrean/beban trafik tinggi.
  - 🔴 **Limit Kuota Habis**: Limit laju permintaan harian (HTTP 429) tercapai.
  - 🔴 **Gangguan Mesin**: Kendala koneksi jaringan atau respon timeout.
  - 🔑 **Kunci Belum Disetel**: Belum terhubung ke kredensial pengguna.
- Kotak notifikasi rekomendasi ramah pengguna yang menginformasikan status mesin terpilih dan menawarkan failover instan atau pengalihan ke mesin lokal.

#### 4. Penyeragaman Nama Mesin Pembuat Soal "Lokal"
- Memperbarui label kartu mesin mandiri menjadi **"Lokal"** dengan lencana "Selalu Siap", menegaskan pemrosesan cepat instan langsung di peramban tanpa ketergantungan kuota API maupun jaringan internet.

## [2.2.58] - 2026-09-10
### Dukungan Penuh Multi-Jenjang Pendidikan Kurikulum Merdeka (SD / MI, SMP / MTs, dan SMA / SMK)

#### 1. Arsitektur Multi-Jenjang Pendidikan (Progressive Disclosure)
- Menghadirkan alur pemilihan jenjang pendidikan bertahap (*progressive disclosure*) yang intuitif:
  - **🎒 SD / MI**: Kelas 1–6 (Fase A: Kelas 1–2, Fase B: Kelas 3–4, Fase C: Kelas 5–6).
  - **🏫 SMP / MTs**: Kelas 7–9 (Fase D: Kelas 7, 8, 9) dengan fokus penalaran ilmiah, eksplorasi kontekstual, dan logika terpadu.
  - **🎓 SMA / SMK**: Kelas 10–12 (Fase E: Kelas 10 Fondasi Peminatan; Fase F: Kelas 11 & 12 Pendalaman Spesialisasi & HOTS).
- Komponen Segmented Level Switcher dengan target sentuh ramah sentuhan (≥ 44×44 px) di Tahap 1 Asisten AI dan Beranda Aplikasi.
- Penyimpanan preferensi jenjang lokal (`localStorage`) agar pendidik langsung kembali ke jenjang pilihannya tanpa pengaturan berulang.

#### 2. Katalog Mata Pelajaran & Peminatan Komprehensif
- Mendukung mata pelajaran khusus untuk setiap jenjang:
  - **SD**: Matematika, IPA, IPAS, Bahasa Indonesia, Pendidikan Pancasila, Pengetahuan Umum, Bahasa Inggris, PJOK, Seni Musik, Seni Rupa, Seni Tari, Seni Teater, Pendidikan Agama (PAI, Kristen, Katolik, Hindu, Buddha, Konghucu), Bahasa Daerah, Informatika.
  - **SMP**: Penambahan mata pelajaran terpadu: IPA Terpadu, IPS Terpadu, Informatika, Prakarya & Kewirausahaan.
  - **SMA / SMK**: Penambahan mata pelajaran peminatan MIPA (Fisika, Kimia, Biologi, Matematika Tingkat Lanjut) serta peminatan IPS & Humaniora (Ekonomi, Sosiologi, Geografi, Sejarah, Antropologi).
- Modal katalog mata pelajaran terstruktur dengan pencarian instan dan klasifikasi kategori dinamis sesuai jenjang yang aktif.

#### 3. Capaian Pembelajaran (CP) & Asisten AI Spesifik Jenjang & Kelas
- Rumusan Capaian Pembelajaran (CP) spesifik kelas untuk seluruh mata pelajaran dari Kelas 1 hingga Kelas 12.
- Penyesuaian instruksi psikologis dan tingkat kognitif AI:
  - SD: Pemahaman konkret ramah anak, C1–C3 Bloom, bahasa hangat dan suportif.
  - SMP: Pembuktian ilmiah sebab-akibat, C3–C4 Bloom, logika terpadu.
  - SMA: Soal berpikir tingkat tinggi (*Higher Order Thinking Skills* - HOTS), C4–C6 Bloom, studi kasus dan penalaran analitis.
- Fitur Elaborasi CP & Brainstorm Topik Pintar otomatis beradaptasi dengan jenjang dan kelas yang dipilih.

#### 4. Pembaruan Antarmuka Beranda (Home), Filter Kuis & Studio Pembuatan Manual
- **Beranda Kuis**: Tab switcher jenjang pendidikan di atas chip kelas dinamis, menyaring kuis berdasarkan jenjang (SD, SMP, SMA) dan tingkatan kelas secara real-time.
- **Kartu Kuis**: Lencana kelas kini menampilkan jenjang yang akurat (`Kelas 7 SMP`, `Kelas 10 SMA`, dll).
- **Studio Kuis Manual**: Formulir informasi kuis mendukung pemilihan target kelas 1–12 dan mata pelajaran terkelompok rapi berdasarkan jenjang.
- **Kuis Bawaan (Seed)**: Menambahkan kuis contoh untuk jenjang SMP (Interaksi Makhluk Hidup & Lingkungan) dan SMA (Kinematika Gerak Lurus & Vektor).

## [2.2.57] - 2026-09-10
### Integrasi Mesin Kecerdasan Buatan DeepSeek AI (DeepSeek-V3 & DeepSeek-R1), Modal Manajemen Kunci API Mandiri (BYOK) & Server-Side Cloud Secrets

#### 1. Integrasi Mesin AI DeepSeek (DeepSeek-V3 & DeepSeek-R1)
- Menambahkan DeepSeek AI sebagai penyedia kecerdasan buatan terpadu sejajar dengan Google Gemini AI dan Groq LPU.
- Mendukung dua model unggulan DeepSeek:
  - **DeepSeek-V3 (`deepseek-chat`)**: Model komputasi efisien dengan kecepatan generasi tinggi, tata bahasa Indonesia yang kaya konteks, dan output terstruktur format JSON instan.
  - **DeepSeek-R1 (`deepseek-reasoner`)**: Model penalaran logika mendalam (*reasoning model*) yang sangat akurat untuk pembuatan soal berpikir tingkat tinggi (HOTS), pemecahan matematika terstruktur, dan analisis konsep sains IPA.
- Terintegrasi penuh pada alur perumusan Capaian Pembelajaran (CP), rekomendasi ide topik pembelajaran dinamis, dan peracikan butir soal kuis multi-format.

#### 2. Modal Manajemen Kunci API Mandiri (Bring Your Own Key - BYOK) di Tahap 4 & Studio Kuis
- Menghadirkan modal interaktif pengaturan kunci API mandiri di Tahap 4 Wizard Pembuatan Kuis dan laci pengaturan Asisten AI Bank Soal.
- Mendukung konfigurasi terpisah dengan penyimpanan aman client-side (`localStorage`) untuk:
  - DeepSeek AI (`deepseek-chat`, `deepseek-reasoner`).
  - Groq Cloud LPU (`qwen/qwen3.8-27b`, `openai/gpt-oss-20b`, `llama-3.3-70b`, `llama-3.1-8b`, dll).
  - Google Gemini AI (`gemini-3.8-flash`, `gemini-3.6-flash`, `gemini-3.1-flash-lite`, `gemini-1.5-pro`, dll).
- Dilengkapi tombol pratinjau visibilitas kunci (*show/hide password*), panduan pintas tautan platform resmi, dan indikator status aktif real-time.

#### 3. Dukungan Cloud Server-Side & Cascade Failover Berlapis
- Mengembangkan dukungan server-side pada fungsi komputasi awan (`generate-quiz-ai`) untuk mendeteksi rahasia terenkripsi tanpa mengekspos kredensial ke publik.
- Mengimplementasikan mekanisme ketahanan bertingkat (*failover cascade*): jika salah satu mesin AI mengalami lonjakan kuota atau kendala jaringan, sistem secara otomatis beralih ke penyedia pendukung berikutnya hingga generator kurikulum internal SD (100% luring bebas gagal).

#### 4. Dokumentasi Teknis & Panduan Integrasi
- Menambahkan panduan teknis komprehensif `docs/panduan-integrasi-deepseek-ai.md` yang merinci langkah pendaftaran akun, pembuatan kunci API, perbandingan karakteristik model, dan arsitektur hybrid kuis.
- Memperbarui panduan fungsi komputasi awan untuk konfigurasi rahasia server.

## [2.2.56] - 2026-09-10
### Perbaikan Tampilan Modal Katalog Mapel (Stacking Portal), Capaian Pembelajaran (CP) Spesifik Kelas 1–6 & Integrasi Elaborasi AI

#### 1. Perbaikan Visual Modal Katalog Mata Pelajaran (React Portal & Stacking Context Fix)
- Mengisolasi dialog modal katalog mata pelajaran ke tingkat `document.body` menggunakan `createPortal` dengan elevasi lapisan `z-[100]`.
- Memperbaiki kendala tampilan sebelumnya di mana header atas (*sticky header*) menutupi bagian judul modal dan tombol tutup dialog.
- Lapisan latar belakang redup (*backdrop blur*) kini menyelimuti seluruh layar peramban secara merata baik pada mode terang (*light mode*) maupun mode gelap (*dark mode*).
- Dialog modal terpusat secara presisi (*vertically & horizontally centered*) dengan tinggi maksimum adaptif `max-h-[85vh]` sehingga nyaman diakses pada perangkat beresolusi apa pun.

#### 2. Capaian Pembelajaran (CP) Spesifik Per Tingkat Kelas 1 hingga 6
- Mengembangkan pustaka Capaian Pembelajaran (CP) terstandar Kurikulum Merdeka yang spesifik untuk masing-masing kelas (Kelas 1, 2, 3, 4, 5, dan 6) pada seluruh 19 mata pelajaran.
- Setiap pergantian kelas kini secara seketika memperbarui pernyataan kompetensi yang unik dan terukur:
  - **Kelas 1**: Pengenalan konkret, sensori awal, dan bilangan 1–20.
  - **Kelas 2**: Penjumlahan bersusun s.d. 100, konsep perkalian berulang, dan pecahan konkret 1/2 & 1/4.
  - **Kelas 3**: Perkalian/pembagian bilangan cacah s.d. 1.000, pecahan garis bilangan, dan keliling bangun datar.
  - **Kelas 4**: Pecahan senilai, KPK/FPB, luas bangun datar, dan daur hidup metamorfosis.
  - **Kelas 5**: Operasi pecahan campuran desimal, organ pernapasan/pencernaan, dan volume bangun ruang.
  - **Kelas 6**: Bilangan bulat negatif, unsur lingkaran, sistem tata surya, dan penalaran kritis.

#### 3. Elaborasi & Perumusan CP Spesifik Kelas Berbasis AI
- Menghadirkan tombol interaktif *"Elaborasi CP via AI"* pada kartu pratinjau CP di Tahap 1.
- Terhubung langsung dengan mesin AI untuk memperluas rumusan capaian menjadi Alur Tujuan Pembelajaran (ATP) kontekstual dan aplikatif ramah anak SD.
- Dilengkapi mekanisme rotasi varian pedagogis kontekstual jika mode luring/offline aktif sehingga guru selalu mendapatkan inspirasi pengajaran tanpa hambatan.
- Ditandai dengan badge indikator visual *AI Generated ✨*.

## [2.2.55] - 2026-09-10
### Katalog Mata Pelajaran Lengkap Kurikulum Merdeka, Pengelompokan Fase Kelas & Brainstorming Topik AI Dinamis

#### 1. Kotak ke-6 "Lainnya" & Modal Overlay Katalog Mata Pelajaran Terkurasi
- Menghadirkan kotak ke-6 (*Lainnya 📚*) pada kisi pilihan mata pelajaran Tahap 1. Saat diklik, membuka dialog modal overlay katalog komprehensif mata pelajaran Kurikulum Merdeka SD.
- Katalog dikelompokkan secara terstruktur berdasarkan rumpun pembelajaran:
  - **Mata Pelajaran Wajib Utama**: IPA, Matematika, Bahasa Indonesia, Pendidikan Pancasila, Pengetahuan Umum.
  - **Bahasa & Literasi**: Bahasa Inggris, Bahasa Daerah / Muatan Lokal.
  - **Jasmani & Olahraga**: PJOK (Pendidikan Jasmani, Olahraga, dan Kesehatan).
  - **Seni & Kebudayaan**: Seni Rupa, Seni Musik, Seni Tari, Seni Teater.
  - **Pendidikan Agama & Budi Pekerti**: PAI, Kristen, Katolik, Hindu, Buddha, Konghucu.
  - **Teknologi & Literasi Digital**: Informatika / Literasi Digital SD.
- Dilengkapi fitur pencarian instan (*real-time filter*) untuk kemudahan penemuan mata pelajaran.
- Menjaga kebersihan sistem dengan membatasi pilihan hanya pada mata pelajaran resmi terstandar (tanpa input acak/bebas).

#### 2. Visual Pengelompokan Fase Kurikulum Merdeka (Fase A, B, dan C)
- Pilihan tingkat kelas 1 hingga 6 kini dikelompokkan secara visual sesuai fase pedagogis Kurikulum Merdeka:
  - **Fase A (Kelas 1 & 2 SD)**: Fondasi Awal literasi, sensori, dan berhitung konkret.
  - **Fase B (Kelas 3 & 4 SD)**: Penguatan Konsep, logika dasar, dan eksplorasi lingkungan.
  - **Fase C (Kelas 5 & 6 SD)**: Penalaran Lanjut, analisis masalah, dan sintesis data.
- Setiap fase ditandai dengan badge indikator warna tematik, target sentuh tombol $\ge 48\text{px}$, dan sorotan visual aktif saat kelas dipilih.

#### 3. Banner Pratinjau Capaian Pembelajaran (CP) Interaktif
- Menambahkan kartu pratinjau Capaian Pembelajaran (CP) dinamis pada Tahap 1 yang secara otomatis menyesuaikan kutipan capaian resmi berdasarkan kombinasi mata pelajaran dan fase/kelas terpilih.
- Memberikan panduan instruksional langsung bagi guru sebelum meracik butir soal kuis.

#### 4. Brainstorming Topik Cerdas Berbasis AI Dinamis (Anti Monoton & Statis)
- Tombol *Acak Ide AI* pada Tahap 2 kini terhubung langsung dengan mesin AI untuk menghasilkan 4 ide materi kontekstual baru beserta fokus instruksional ramah anak SD secara dinamis.
- Mengimplementasikan mekanisme *cascade fallback* mulus: jika koneksi AI tidak aktif, sistem otomatis memutar dan mengacak bank topik terkurasi kurikulum tanpa pernah gagal (*zero failure*).
- Menghilangkan redundansi tombol *Ganti Metode* pada bagian bawah Tahap 1 agar alur navigasi lebih bersih dan fokus pada tombol aksi primer.

## [2.2.54] - 2026-09-10
### Restrukturisasi Modular Asisten Racik Kuis AI Menjadi 4 Tahap Terfokus

#### 1. Pemecahan Alur Funnel Menjadi 4 Tahap Terstruktur & Ergonomis
- Menjawab kebutuhan pengguna agar konten tidak menumpuk terlalu banyak dalam satu layar (*cognitive overload*), alur pembuatan kuis AI kini dipecah menjadi **4 Tahap Mandiri**:
  - **Tahap 1 (Mata Pelajaran & Kelas SD)**: Fokus tunggal pada pemilihan 5 mata pelajaran Kurikulum Merdeka dan jenjang kelas 1–6 SD tanpa terganggu isian topik.
  - **Tahap 2 (Topik & Sasaran Pembelajaran)**: Ruang lapang untuk penentuan topik kuis, eksplorasi ide dengan rekomendasi topik cerdas (*Acak Ide* 🔀), catatan khusus AI, dan tips instruksional guru SD.
  - **Tahap 3 (Format & Konfigurasi Butir Soal)**: Pengaturan kuantitas soal (preset 5–25 dan kustom 1–50), mode proporsi tipe soal (Otomatis Seimbang vs Kustom Mandiri 4 format), serta opsi ilustrasi gambar edukasi AI.
  - **Tahap 4 (Pilihan Mesin AI & Eksekusi)**: Ringkasan lengkap konfigurasi kuis, seleksi 4 mesin AI (Lokal, Groq LPU, Gemini AI, Salin Prompt/Berkas), laci kerja interaktif berkas, dan tombol eksekusi langsung ke Studio Bank Soal.

#### 2. Sticky Header 4 Tab & Bilah Progres 4 Segmen (Mobile-First)
- Mengadaptasi bilah navigasi sticky header menjadi 4 tab simetris:
  - **Desktop / Tablet**: `[ 1. Mapel & Kelas ]` | `[ 2. Topik Materi ]` | `[ 3. Format Soal ]` | `[ 4. Mesin AI ]`.
  - **Mobile Portrait**: Label ringkas responsif `[ 1. Mapel ]` | `[ 2. Topik ]` | `[ 3. Soal ]` | `[ 4. AI ]` dengan target sentuh $\ge 44\text{px}$ tanpa tumpang tindih.
- Bilah progres kini memiliki 4 segmen visual yang menyala halus (25%, 50%, 75%, 100%) seiring kemajuan pengisian kuis guru.

#### 3. Navigasi & Back Handler Presisi Bertingkat
- Tombol *Sebelumnya* di header maupun tombol fisik *Back* browser kini melangkah mundur secara bertahap (Tahap 4 ➔ 3 ➔ 2 ➔ 1 ➔ Konfirmasi Ganti Metode).
- Validasi prasyarat tetap terjaga (misalnya pencegahan melompat ke Tahap 3/4 sebelum topik terisi dengan notifikasi *toast* ramah).

## [2.2.53] - 2026-09-10
### Integrasi Indikator Tahap & Navigasi Funnel ke Sticky Header (Mobile-First & Anti Hilang Saat Scroll)

#### 1. Indikator Tahap Terintegrasi di Sticky Header Pinned
- Memindahkan kartu indikator tahap (`Tahap 1 dari 2` & `Tahap 2 dari 2`) serta bilah progres 2 segmen dari badan halaman statis langsung ke dalam bilah **Sticky Header** (`header.sticky.top-0.z-30`).
- Bilah navigasi tahap dan progres kini senantiasa terlihat (*pinned*), interaktif, dan mudah diakses bahkan saat pengguna menggulir (*scroll*) jauh ke bawah di formulir pertanyaan, pilihan mesin AI, maupun area unggah berkas.
- Menghilangkan redundansi elemen judul ganda dan kartu statis di badan halaman, memaksimalkan area kerja formulir (*screen real estate*).

#### 2. Tata Letak Fleksibel & Touch Target Mobile-First (Rule 1 & 2)
- Mengadaptasi header secara responsif untuk seluruh ukuran layar:
  - **Baris Atas**: Tombol navigasi kontekstual (`Ganti Metode` / `Kembali`), judul studio dinamis yang menampilkan topik kuis secara *real-time*, dan tombol pengganti tema.
  - **Baris Bawah**: Tab tahapan 2 kolom interaktif (`[ 1. Materi & Sasaran ]` dan `[ 2. Pengaturan Soal & AI ]`) dengan target sentuh ramah jari $\ge 44\text{px}$, ikon check aktif saat selesai, dan garis indikator progres 2 segmen beranimasi halus.
- Memastikan tata letak tetap stabil dan tidak bertumpukan pada smartphone Android portrait (360–412px), iPhone (390px), tablet, hingga layar resolusi tinggi (1080p s/d 4K).

#### 3. Sinkronisasi Status Interaktif & Transisi Lancar
- State tahap funnel (`aiFunnelStage`) dan judul topik kuis terhubung secara reaktif antara komponen induk `QuizCreator.tsx` dan formulir `AiGeneratorStep.tsx`.
- Pengguna dapat langsung berpindah antar tahap melalui klik tab di header kapan saja tanpa kehilangan isian formulir.

## [2.2.52] - 2026-09-10
### Rekonstruksi Alur Pembuatan Kuis AI (Two-Stage Creation Flow & Eliminasi Redundansi UX)

#### 1. Penghapusan Istilah Robotik & AI Slop
- Menghapus sepenuhnya label "*Generator AI Wizard*" dan istilah-istilah artifisial yang tidak komunikatif untuk menghadirkan pengalaman pengguna (*UX*) yang bersih, elegan, dan ramah pendidik.
- Menyederhanakan tata nama menjadi **Asisten Racik Kuis AI** yang komunikatif dan profesional (sesuai Rule 3).

#### 2. Penerapan Arsitektur Dua Fase (Funnel ➔ Studio Kuis Utama)
- **Fase 1: Asisten Racik Kuis AI (Creation Funnel)**:
  - Bilah tab navigasi Studio (*Bank Soal*, *Pengaturan Kuis*, *Pratinjau*) disembunyikan sepenuhnya selama guru berada dalam fase peracikan, menghapus beban kognitif ganda (*double-stepper redundancy*).
  - Alur peracikan disederhanakan menjadi **2 Tahap Alami**:
    - **Tahap 1 (Materi & Sasaran Pembelajaran)**: Pemilihan 5 kartu mata pelajaran Kurikulum Merdeka (1 baris desktop), tingkat kelas SD (1–6), kolom input topik & rekomendasi topik cerdas interaktif, serta area catatan khusus dan tips instruksional guru.
    - **Tahap 2 (Pengaturan Soal & Pilihan Mesin AI)**: Penentuan jumlah butir soal, mode proporsi format (Otomatis Seimbang vs Kustom Mandiri), kotak centang gambar edukasi AI, serta 4 pilihan mesin (Kurikulum SD Lokal, Groq Cloud LPU, Google Gemini AI, dan Salin Prompt / Berkas).
- **Transisi Instan Tanpa Langkah Konfirmasi Redundan**:
  - Memilih mesin AI langsung meracik butir soal dan secara otomatis membuka **Studio Bank Soal**, meniadakan klik konfirmasi yang tidak perlu.
  - Memilih Salin Prompt / Berkas membuka laci kerja interaktif berdampingan (prompt siap pakai di kiri, kolom input/unggah berkas di kanan) dengan tombol periksa langsung ke Bank Soal.

#### 3. Konsolidasi 3 Tab Bersih di Studio Kuis Utama
- Mengkonsolidasikan navigasi Studio Kuis menjadi **3 Tab Utama yang Simetris & Intuitif**:
  - `[ 1. Bank Soal (N) ]`: Tempat utama guru memeriksa, mengoreksi, menduplikasi, dan menambah butir soal baru (dilengkapi tombol modal *Asisten AI*).
  - `[ 2. Pengaturan Kuis ]`: Mengatur judul kuis, deskripsi, durasi timer per soal, acak opsi, dan aksesibilitas.
  - `[ 3. Pratinjau & Simpan ]`: Pratinjau tampilan kartu kuis siswa dan penerbitan langsung ke database.
- Tombol navigasi bawah disinkronkan secara konsisten di setiap tab dengan tombol *Racik Ulang dengan AI* yang memudahkan kembali ke funnel jika diinginkan.

#### 4. Kepatuhan Presisi Tampilan Mobile-First & Aksesibilitas (Rule 1 & 8)
- Seluruh elemen antarmuka diuji dan dioptimalkan untuk perangkat mobile portrait (390px), landscape, tablet, hingga resolusi monitor ultra-wide (2000px).
- Menjamin target sentuh minimal $\ge 44\text{px}$ (48px direkomendasikan) pada seluruh tombol, selektor opsi, dan kontrol formulir.

## [2.2.51] - 2026-09-10
### Optimalisasi Tata Letak Responsif Monitor Lebar & Ultra-Wide (Studio Kuis AI)

#### 1. Penyesuaian Lebar Kontainer Penuh (Pixel-Perfect Grid)
- Memperluas kontainer antarmuka *Studio Kuis AI Wizard* dari batas sempit `max-w-4xl` (896px) menjadi `max-w-[2000px]` dengan padding fleksibel `px-3 xs:px-4 sm:px-8 lg:px-12`.
- Menyelaraskan batas horizontal seluruh langkah wizard agar tepat sejajar secara presisi dengan bilah navigasi tab (*1. Generator AI*, *2. Bank Soal*, *3. Info Kuis*, *4. Pratinjau*) dan header atas, meniadakan celah kosong yang berlebihan pada layar besar (1080p, 2K, hingga 4K).

#### 2. Layout Multi-Kolom Ergonomis di Seluruh Sub-Langkah
- **Step 1 (Mapel & Kelas SD)**: Kartu mata pelajaran kini tersusun rata dalam 5 kolom seimbang (`xl:grid-cols-5`) dan baris tombol kelas 1–6 membentang rapi dengan sentuhan touch target $\ge 48\text{px}$.
- **Step 2 (Topik & Konteks AI)**: Menerapkan tata letak 2-kolom berdampingan (`lg:grid-cols-12`) dengan area input topik & saran cerdas di kolom kiri serta area bahan pertimbangan khusus AI & panduan prompt di kolom kanan.
- **Step 3 (Format & Proporsi)**: Grid 4-kolom horisontal (`lg:grid-cols-4`) untuk counter butir soal per tipe (Pilihan Ganda, Benar/Salah, Isian Singkat, Menjodohkan) yang terorganisasi proporsional.
- **Step 4 (Mesin Pembuat Soal)**: 4 kartu mesin (Kurikulum SD Lokal, Groq Cloud LPU, Google Gemini AI, dan Generate Prompt) tersusun rapi dalam 1 baris 4-kolom setara dengan status Cloud dan aksi pilih yang jelas.
- **Step 5 (Salin Prompt & Unggah Berkas)**: Pembagian 2-kolom berdampingan antara panel teks prompt siap pakai di sebelah kiri dan area masukan (tempel teks / dropzone berkas) di sebelah kanan tanpa perlu pengguliran vertikal berlebih.
- **Step 6 (Inspektor Verifikasi Visual)**: Kartu-kartu pratinjau butir soal disusun dalam format grid multi-kolom (`lg:grid-cols-2 2xl:grid-cols-3`) sehingga pendidik dapat memeriksa banyak butir soal sekaligus secara nyaman.
- **Step 7 (Konfirmasi Spesifikasi Kuis)**: Transformasi ringkasan akhir menjadi dasbor metrik eksekutif 4-kolom (`lg:grid-cols-4`) yang ringkas, modern, dan komunikatif.

#### 3. Kepatuhan Standar Aksesibilitas & Mobile-First (Rule 1)
- Menjamin tampilan tetap 100% responsif dan bebas distorsi di perangkat mobile portrait (320px–480px), tablet, hingga monitor resolusi tinggi non-reguler.

## [2.2.50] - 2026-09-10
### Studio Kuis AI Clean Wizard (7 Langkah Terstruktur Tanpa Panel Samping)

#### 1. Perombakan Total Antarmuka Tab Generator AI Menjadi Clean Wizard
- Menghilangkan panel samping (*Spesifikasi Target Kuis* & *Format Butir Soal*) dari Tab Generator AI untuk menghadirkan alur kerja terpusat (*single-focus wizard*) yang lega, modern, dan bebas dari distorsi layar.
- Mengimplementasikan **Stepper Indikator 7 Sub-Langkah** dengan indikator nomor, label tahapan, dan bilah progres visual dinamis yang responsif di seluruh ukuran layar (*mobile-first* dan desktop).

#### 2. Alur Kerja 7 Langkah Terstruktur & Presisi Tinggi
- **Step 1 (Mata Pelajaran & Kelas SD)**: Pemilihan kartu interaktif 5 mata pelajaran Kurikulum Merdeka dan tombol jenjang kelas 1–6 dengan target sentuh minimal 48px.
- **Step 2 (Topik, Konteks AI & Saran Cerdas)**: Kolom topik kuis, area bahan pertimbangan khusus AI, serta chip rekomendasi topik cerdas yang dinamis berdasarkan kombinasi Mapel + Kelas SD dilengkapi tombol *Acak Ide Lain*.
- **Step 3 (Jumlah, Proporsi Format & Gambar)**: Pemilihan kuota butir soal (5, 10, 15, kustom 1–50) dengan dua mode format: *Otomatis Seimbang* atau *Kustom Proporsi* per jenis format (Pilihan Ganda, Benar/Salah, Isian Singkat, Menjodohkan) dengan validasi real-time, serta opsi kotak centang ilustrasi edukasi AI.
- **Step 4 (Mesin Pembuat Soal & Percabangan Alur)**: Pilihan kartu mesin (Kurikulum SD Lokal, Groq Cloud LPU, Google Gemini AI, dan Generate Prompt/Unggah Berkas). Tiga mesin langsung mengeksekusi peracikan dan langsung menuju Step 7, sementara Generate Prompt mengalir ke Step 5.
- **Step 5 (Salin Prompt & Unggah Berkas)**: Menyediakan teks prompt terstruktur presisi tinggi (100% patuh JSON murni tanpa AI slop) dengan tombol salin instan, area tempel teks cerdas multi-format, serta dropzone berkas (.xlsx, .xls, .csv, .json, .txt) dilengkapi unduhan template resmi CSV.
- **Step 6 (Inspektor Verifikasi Visual Read-Only)**: Verifikasi kelengkapan butir soal hasil parsing (pertanyaan, opsi, kunci jawaban hijau, pembahasan, dan gambar) tanpa redundansi editing, dengan tombol kembali ke Step 5 jika ingin merevisi teks input.
- **Step 7 (Konfirmasi Spesifikasi Target Kuis)**: Kartu ringkasan spesifikasi menyeluruh sebelum tombol aksi utama memindahkan soal secara otomatis ke **Tab 2 (Bank Soal)**.

## [2.2.49] - 2026-09-10
### Sinkronisasi Penuh Autentikasi Cloud Supabase (Guru & Siswa) & Auto-Confirm Email

#### 1. Integrasi Menyeluruh Auth Supabase (Guru & Siswa)
- Mengintegrasikan seluruh pintu masuk dan pendaftaran (*Sign In* dan *Sign Up*) akun Guru dan Siswa langsung ke Supabase Cloud Auth (`auth.users`) dan tabel publik (`profiles_teacher` & `profiles_player`).
- Memastikan seluruh kata sandi dienkripsi dengan standar kriptografi server-side Supabase (*bcrypt/argon2* - Rule 9), tanpa penyimpanan plaintext di sisi frontend atau penyimpanan lokal.
- Sinkronisasi metadata otomatis: profil Guru menyimpan nama lengkap dan nama sekolah, sedangkan profil Siswa menyimpan nama panggilan (*nickname*), jenjang kelas, dan data kemajuan bermain.

#### 2. Auto-Confirm Email Otomatis untuk Lingkungan Belajar Sekolah
- Mengimplementasikan trigger cerdas database `trigger_auto_confirm_user` pada tabel `auth.users` (`BEFORE INSERT`).
- Siswa dan guru yang baru mendaftar langsung terverifikasi secara instan tanpa hambatan tautan konfirmasi email (*zero-friction instant login*), sangat ideal untuk penggunaan cepat di laboratorium komputer dan kelas sekolah.
- Menjamin sinkronisasi dua arah antara `auth.users` dengan tabel profil publik melalui trigger `on_auth_user_created` (`handle_new_user()`).

#### 3. Keamanan Tingkat Tinggi & Robust Fallback
- Memastikan proteksi data akun dengan Row Level Security (RLS) berbasis `auth.uid()`.
- Menjaga integritas data profil siswa dengan mekanisme `upsert` yang sinkron dan bebas konflik UUID.

## [2.2.48] - 2026-09-10
### Integrasi Penuh AI Server-Side via Supabase Secrets & Edge Functions (Zero-Leak Security)

#### 1. Penghubungan Aman API AI via Supabase Secrets & Edge Functions
- Mengintegrasikan mesin komputasi AI (*Google Gemini* dan *Groq Cloud LPU*) langsung ke Supabase Edge Functions (`generate-quiz-ai`), memanfaatkan penyimpanan rahasia server-side (`Supabase Secrets`).
- Menjamin keamanan tingkat tinggi (*Non-Negotiable Security - Rule 9 & 10*): Kunci API tidak lagi disimpan di browser pengguna (`localStorage`) dan tidak pernah terekspos ke frontend publik.
- Seluruh pemanggilan AI dijalankan secara aman melalui `supabase.functions.invoke('generate-quiz-ai')` dengan verifikasi serverless Deno runtime.

#### 2. Fitur AI Otomatis Terbuka di Antarmuka Studio Kuis
- Studio Kuis dan Generator Kilat AI kini secara otomatis mendeteksi ketersediaan kunci API di Supabase Cloud Secrets saat formulir dimuat.
- Opsi mesin AI *Google Gemini AI* dan *Groq Cloud LPU* langsung aktif dan terbuka dengan label status terverifikasi `(Aktif via Supabase Cloud)`.
- Menghadirkan lencana indikator status *Cloud Secrets Aktif* yang memberikan kepastian visual kepada guru bahwa sistem AI siap digunakan seketika.

#### 3. Dukungan Model Generasi Baru & Mekanisme Failover Cerdas
- Mendukung model inferensi mutakhir berkecepatan tinggi:
  - **Groq Cloud:** Mendukung model *Qwen 3.8 27B* dan *GPT-OSS* dengan pemahaman Kurikulum Merdeka yang sangat akurat.
  - **Google Gemini:** Mendukung generasi terbaru *Gemini 3.8 Flash*, *Gemini 3.6 Flash*, dan *Gemini 3.1 Flash-Lite*.
- Dilengkapi sistem *multi-model cascade failover*: jika sebuah model mengalami lonjakan antrean trafik, sistem secara otomatis beralih ke model cadangan server-side tanpa mengganggu alur pembuatan kuis oleh guru.

## [2.2.47] - 2026-09-10
### Ekspansi Lebar Penuh Studio Kuis (Ultra-Wide max-w-[2000px]) Selaras dengan Dashboard Guru

#### 1. Perluasan Maksimal Antarmuka Studio Kuis ke Layar Lebar
- Menghilangkan batas sempit `max-w-6xl 2xl:max-w-7xl` (1280px) pada Studio Kuis yang sebelumnya masih menyisakan ruang kosong besar di sisi kiri dan kanan monitor resolusi 1080p, 2K, maupun 4K.
- Menyesuaikan batas kontainer kerja Studio Kuis menjadi `max-w-[2000px] px-3 xs:px-4 sm:px-8 lg:px-12` persis selaras dengan tata letak Dashboard Guru (`TeacherDashboard`).
- Seluruh elemen antarmuka (Navbar Studio, Bilah Tab Langkah 1–4, Formulir Konfigurasi, dan Panel Pratinjau Real-Time) kini membentang secara elegan, proporsional, dan seimbang memenuhi ruang layar lebar tanpa celah kosong berlebih.

#### 2. Keseimbangan Tata Letak 2 Kolom pada Layar Monitor
- **Kolom Kiri (Utama):** Mendapatkan ruang kerja yang lega untuk pengisian judul, opsi jawaban, butir soal, dan pengaturan kuis.
- **Kolom Kanan (Pratinjau & Status):** Memanfaatkan ruang layar sisi kanan secara produktif untuk *Live Preview* kartu katalog siswa dan spesifikasi butir soal.

## [2.2.46] - 2026-09-10
### Eliminasi Total "AI Slop" & Pengisian Celah Kosong Layar Lebar dengan Panel Pratinjau Fungsional

#### 1. Pembersihan Menyeluruh Elemen "AI Slop" & Clutter
- Menghapus total banner promosi ungu raksasa (*hero banner*) yang memakan ruang vertikal dan menenggelamkan tombol aksi.
- Menghapus seluruh kartu teks artikel/pemasaran AI yang tidak dibutuhkan guru (seperti promosi kecepatan Groq LPU, klaim komputasi Gemini, dan tips umum).
- Mengembalikan antarmuka ke standar alat profesional yang bersih, fokus, dan langsung pada fungsi pembuatan kuis.

#### 2. Mengatasi Celah Kosong Kiri dan Kanan pada Layar Lebar (Desktop/Widescreen)
- Menyempurnakan kontainer antarmuka Studio Kuis menjadi `max-w-6xl 2xl:max-w-7xl` yang konsisten di semua tahapan (*Info Kuis*, *Generator AI*, *Bank Soal*, dan *Pratinjau*).
- Menghadirkan tata letak 2 kolom adaptif yang fungsional dan relevan:
  - **Di Langkah 1 Info Kuis:**
    - Kolom Kiri: Formulir lengkap konfigurasi identitas kuis.
    - Kolom Kanan: **Pratinjau Kartu Siswa Real-Time (*Live Preview*)** yang memperbarui tampilan kartu kuis di katalog secara langsung saat guru mengetik, serta **Checklist Kesiapan Kuis** fungsional.
  - **Di Langkah 1 Generator Kilat AI:**
    - Kolom Kiri: Formulir input topik, pilihan mapel, kelas, jumlah butir, format soal, dan mesin AI tanpa scroll berlebih. Tombol *"Buat Kuis Sekarang & Buka Editor"* kini langsung terlihat di layar.
    - Kolom Kanan: **Spesifikasi Target Kuis**, **Pratinjau Format Butir Soal (Mockup Pertanyaan, Opsi, Kunci, dan Pembahasan)**, serta **Alur Kerja Studio**.
- Menghilangkan kesan "kotak sempit mengambang" dengan celah kosong berlebih di monitor desktop, sembari menjaga kenyamanan responsif satu kolom di perangkat smartphone dan tablet.

## [2.2.45] - 2026-09-10
### Studio Kuis AI Halaman Penuh, Navigasi Pemilihan Metode Cerdas, Isolasi Interaksi Kartu Kuis, dan Optimalisasi Responsivitas Layar Lebar

#### 1. Isolasi Interaksi Kartu Kuis (Dashboard Guru)
- Menghilangkan interaksi klik global pada kontainer kartu kuis untuk mencegah pembukaan tidak sengaja saat navigasi.
- Seluruh tindakan dikendalikan secara presisi lewat tombol-tombol aksi resmi yang berdedikasi:
  - Tombol *"Mode IFP"* untuk menyajikan kuis di Smartboard kelas.
  - Tombol *"Bagi Tautan"* untuk membagikan tautan langsung siswa.
  - Tombol *"Detail & Nilai"* untuk mengakses statistik, rekap perolehan nilai, dan pratinjau soal.
  - Menu titik tiga (*Actions Menu*) untuk duplikasi, ubah status akses publik/privat, dan penghapusan kuis.

#### 2. Generator Kilat AI Halaman Penuh di Studio Kuis (`QuizCreator`)
- Menggantikan modal pop-up AI berukuran terbatas dengan antarmuka kerja halaman penuh yang luas, nyaman, dan kaya fitur di Studio Kuis.
- **Alur 4 Tahap Terpadu Khusus Mode AI:**
  1. **Langkah 1: ⚡ Generator AI** — Racik soal otomatis berbasis Kurikulum Merdeka atau tempel teks dokumen pelajaran, pemilihan tingkat kelas SD (1–6), jumlah butir (5, 10, 15, custom hingga 50), mesin komputasi AI (Lokal, Gemini 2.0 / PRO, Groq LPU), dan sakelar ilustrasi gambar edukasi AI gratis.
  2. **Langkah 2: 📝 Bank Soal** — Tinjau hasil generasi butir soal, koreksi kalimat soal, edit opsi jawaban & kunci, tambah ilustrasi gambar, atau tambah soal baru.
  3. **Langkah 3: ℹ️ Info Kuis** — Lengkapi judul kuis, deskripsi instruksi siswa, durasi pengerjaan per butir, gelar lencana, emoji sampul, mode game bawaan, dan visibilitas kuis.
  4. **Langkah 4: 👁️ Pratinjau & Simpan** — Tinjau keseluruhan kuis dengan kartu pratinjau siswa langsung (*Live Card Preview*) sebelum diterbitkan.
- **Mode Manual & Edit Tetap Ringkas 3 Langkah:**
  - `1. Info Kuis` ➔ `2. Bank Soal` ➔ `3. Pratinjau`.

#### 3. Navigasi Batal / Kembali Cerdas ke Modal Pemilihan Metode
- Saat guru berada di Langkah 1 Generator Kilat AI dan memutuskan untuk kembali atau berganti metode, tombol *"Ganti Metode"* maupun *"Kembali"* langsung mengarahkan guru kembali ke Dashboard Guru dengan membuka otomatis modal *"Pilih Metode Pembuatan Kuis"*.
- Menghilangkan friksi pengguna sehingga guru dapat dengan cepat beralih antara racik kilat AI ataupun buat kuis mandiri dari nol tanpa harus mengulang navigasi dari awal.

#### 4. Presisi Responsivitas Layar Lebar & Touch Target Mobile-First
- Memperluas lebar kontainer kerja Studio Kuis menjadi `max-w-6xl 2xl:max-w-7xl` untuk menghilangkan celah kosong berlebih pada layar monitor desktop dan smartboard interaktif.
- Mengadopsi tata letak adaptif 2 kolom di layar besar:
  - Kolom utama formulir dan butir soal di sisi kiri.
  - Kolom panduan, tips Kurikulum Merdeka, keunggulan komputasi AI, serta *Live Quiz Card Preview* interaktif di sisi kanan.
- Memastikan seluruh target sentuh memenuhi standar $\ge 44 \times 44\text{ px}$ dan tata letak tetap stabil dan rapi dari layar mobile portrait (390px) hingga monitor 4K.

## [2.2.44] - 2026-09-10
### Redesain Dashboard Guru Clean & Terfokus, Tampilan Terpadu Detail Kuis & Rekap Nilai Siswa, serta Akses Instan Generator Kilat AI

#### 1. Tampilan Dashboard Guru Bersih & Terfokus (Tanpa 3 Tab)
- **Struktur Antarmuka Lebih Ringkas dan Efisien:**
  - Menghilangkan navigasi 3 tab (*Bank Kuis*, *Rekap Nilai Siswa*, *Generator Kilat Soal*) di halaman utama dashboard guru guna memberikan fokus maksimal pada manajemen kuis aktif.
  - Menghadirkan bilah pencarian cerdas terintegrasi untuk mencari judul kuis, mata pelajaran, ataupun 4 digit PIN kelas.
  - Dilengkapi filter multi-kriteria: Mata Pelajaran (Matematika, IPAS, Bahasa Indonesia, Pendidikan Pancasila, Seni & Bahasa Daerah), Tingkat Kelas (Kelas 1–6), serta Status Akses (Publik/Privat).
  - Dilengkapi menu pengurutan (*sorting*): Kuis Terbaru, Terlama, Judul A-Z, Judul Z-A, dan Jumlah Soal Terbanyak.
  - Indikator hasil filter dinamis dengan tombol satu-klik *"Reset Filter"*.

#### 2. Tampilan Terpadu Detail Kuis (`QuizDetail`)
- **Pusat Informasi & Rekap Nilai Spesifik Tiap Kuis:**
  - Mengklik kartu kuis atau tombol *"Detail & Nilai"* akan membuka halaman detail khusus kuis tersebut.
  - Ringkasan metadata kuis lengkap: Emoji sampul, lencana kelulusan, mata pelajaran, tingkat kelas, durasi per butir, dan tanggal rilis.
  - Manajemen PIN Kelas praktis: Tombol salin PIN satu-klik, acak ulang PIN 4 digit baru, dan pengatur status visibilitas (Publik di Katalog Siswa / Khusus PIN Privat).
  - Bilah Aksi Guru terpadu: Buka Mode IFP / Layar TV Smartboard Kelas, Cetak Lembar Kerja Siswa (LKS PDF), Salin Tautan Langsung, Duplikasi Kuis, dan Hapus Kuis.
- **Tab 1: Rekap Nilai Siswa Terperinci:**
  - 4 Kartu Metrik Utama: Jumlah Siswa Selesai, Rata-Rata Nilai, Skor Tertinggi, dan Rata-Rata Waktu Pengerjaan.
  - Tombol Ekspor Nilai ke CSV / Excel untuk rekapitulasi nilai rapor guru.
  - Tabel interaktif responsif menampilkan nama siswa, skor perolehan, akurasi persentase, durasi pengerjaan, dan tanggal waktu pengerjaan.
- **Tab 2: Pratinjau Butir Soal & Kunci Jawaban:**
  - Guru dapat membaca seluruh butir soal, gambar ilustrasi materi, opsi jawaban lengkap dengan penanda kunci yang benar, serta pembahasan edukatif.
  - Tombol pintasan langsung *"Edit Kuis / Tambah Soal"* untuk membuka formulir editor kuis.

#### 3. Generator Kilat AI Terintegrasi pada Tombol "Buat Kuis Baru"
- **Modal Pemilihan Metode Pembuatan Kuis (`CreateQuizMethodModal`):**
  - Mengklik tombol `+ Buat Kuis Baru` menampilkan modal pilihan metode yang modern:
    1. **⚡ Generator Kilat AI (Otomatis):** Cukup tentukan topik materi, mata pelajaran, kelas, jumlah soal (5, 10, 15, atau kustom hingga 50), jenis soal, dan mesin AI yang diinginkan (Kurikulum SD Lokal, Gemini AI, Groq LPU, atau Tempel Teks Dokumen).
    2. **✏️ Buat Kuis Manual (Dari Nol):** Membuka editor kuis kosong untuk perancangan manual langkah demi langkah.
  - **Alur Kerja Instan Langsung ke Editor:**
    - Soal hasil racikan Generator Kilat AI langsung membawa guru ke `QuizCreator` di **Langkah 2 (Bank Soal)** dengan butir-butir soal yang sudah terisi lengkap.
    - Guru dapat langsung meninjau, mengoreksi teks, menambah opsi, mengganti gambar, atau menambah butir soal baru sebelum disimpan.

## [2.2.43] - 2026-09-10
### Ekspansi Model AI Generasi Baru (Gemini 2.0 Flash Thinking, Groq DeepSeek R1), Generator Gambar Edukasi AI 100% Gratis & Dokumentasi Komprehensif

#### 1. Ekspansi Model AI Generasi Baru (Gemini & Groq)
- **Keluarga Model Google Gemini Terkini:**
  - `gemini-2.0-flash`: Generasi terbaru dengan kecepatan respon tinggi dan instruksi cerdas untuk penyusunan soal tematik.
  - `gemini-2.0-flash-thinking-exp-01-21`: Model penalaran bertahap (*chain-of-thought*) untuk penyusunan soal HOTS, literasi kompleks, dan eksplorasi sains.
  - `gemini-1.5-pro`: Model kasta tertinggi dengan penalaran mendalam, optimal untuk pengguna langganan Google One AI Premium / Gemini PRO.
  - `gemini-1.5-flash` & `gemini-1.5-flash-8b`: Pilihan model cepat dan ultra hemat kuota.
  - Klarifikasi seputar penamaan versi AI (Google Gemini 2.0 vs rumor generasi mendatang).
- **Ragam Model Unggulan Groq Cloud LPU™:**
  - `llama-3.3-70b-versatile`: Model 70B berkualitas tinggi setara GPT-4 dengan tata bahasa Indonesia presisi.
  - `deepseek-r1-distill-llama-70b`: Model reasoning penalaran tingkat tinggi untuk logika matematika dan deduksi sains SD.
  - `llama-3.1-8b-instant`: Kecepatan komputasi super kilat (< 0,5 detik).
  - `gemma2-9b-it` & `mixtral-8x7b-32768`: Alternatif model kompak dan pemrosesan konteks panjang.

#### 2. Integrasi Pembuat Gambar Edukasi AI (100% Gratis Selamanya)
- **Mesin Visual Pollinations AI / Flux Engine:**
  - Menghadirkan generator ilustrasi edukatif berbasis AI secara cuma-cuma tanpa memerlukan API key tambahan, tanpa langganan, dan tanpa batasan kuota.
  - Otomatis mengoptimasi prompt menjadi gaya ilustrasi 3D vektor edukasi anak SD (*clean, colorful, vibrant, child-friendly*).
- **Pembuatan Gambar Otomatis di Modal Asisten AI:**
  - Dilengkapi sakelar *"🎨 Sertakan Ilustrasi Gambar AI"* yang secara otomatis melampirkan gambar visual relevan ke butir soal kuis atau mode tebak gambar (*image_guess*).
- **Tombol "🎨 Buat Gambar AI" Mandiri di Editor Soal:**
  - Guru dapat membuat gambar ilustrasi langsung dari kata kunci deskripsi atau teks pertanyaan pada formulir pembuatan soal (Langkah 2).
  - Pratinjau thumbnail visual langsung muncul dengan informasi asal media serta tombol hapus cepat.

#### 3. Panduan Resmi Komprehensif Model & Gambar AI
- Menyediakan dokumen panduan lengkap `docs/panduan-model-ai-dan-generate-gambar.md` yang merinci setiap model yang didukung, cara memanfaatkan langganan Gemini PRO, akses gratis Groq Cloud, dan panduan lengkap membuat gambar edukasi AI.

## [2.2.42] - 2026-09-10
### Dukungan Penuh Groq LPU Cloud API (Super Cepat ⚡), Panel Multi-Provider Gemini & Groq, serta Panduan Lengkap

#### 1. Mesin Komputasi Groq LPU™ Cloud (Super Cepat & Instan)
- **Kecepatan Inferensi Kilat (300–800 token/detik):**
  - Mengintegrasikan Groq Cloud API yang ditenagai chip prosesor khusus LPU™ (Language Processing Unit).
  - Pembuatan 5 hingga 10 butir soal kuis interaktif lengkap selesai diproduksi dalam waktu kurang dari 1 detik!
- **Model Tercanggih Open-Source Meta AI:**
  - Mendukung `llama-3.3-70b-versatile` dengan penalaran mendalam dan tata bahasa Indonesia ramah anak SD.
  - Mendukung `llama-3.1-8b-instant` untuk kebutuhan pembuatan latihan kuis ultra cepat.
- **Dukungan 100% Gratis Tanpa Kartu Kredit:**
  - Kuota pengembang gratis melimpah hingga 30 request per menit dan 14.400 request per hari di console.groq.com.

#### 2. Antarmuka Pemilih Multi-Provider AI (Studio Kuis Guru)
- **Bilah Pemilih Provider Interaktif:**
  - Guru dapat berganti antara **Google Gemini AI** dan **Groq LPU (Super Cepat ⚡)** hanya dengan 1 kali klik di modal Asisten AI.
  - Form input kunci API, link portal resmi, dan dropdown model AI beradaptasi otomatis sesuai provider aktif.
  - Tombol aksi cerdas dinamis: *"Buat Langsung via Groq AI ⚡"* dengan tema amber-orange atau *"Buat Langsung via Gemini AI"* dengan tema biru-indigo.
- **Failover Antar-Provider Mulus (Smart Fallback):**
  - Jika provider aktif mengalami gangguan, sistem otomatis mencoba provider cadangan yang kuncinya tersedia, atau langsung beralih ke Generator Kurikulum SD internal tanpa kegagalan proses.

#### 3. Supabase Edge Function Multi-Provider
- Skrip backend server-side `supabase/functions/generate-quiz-ai` kini dapat menangani `GROQ_API_KEY` maupun `GEMINI_API_KEY` dengan aman dari Supabase Secrets.

#### 4. Dokumentasi Panduan Groq API (`docs/panduan-integrasi-groq-ai.md`)
- Panduan terperinci pendaftaran gratis di console.groq.com tanpa kartu kredit.
- Cara memasukkan kunci API di aplikasi (BYOK & Supabase Secrets).
- Perbandingan komprehensif keunggulan Groq LPU vs Google Gemini.

## [2.2.41] - 2026-09-10
### Integrasi Google Gemini AI Arsitektur Hybrid, Kunci API Mandiri Guru (BYOK), Supabase Edge Function & Panduan Lengkap

#### 1. Arsitektur AI Hybrid Tiga Lapis (Triple-Layer Reliability)
- **Direct API Call ke Google Gemini AI:**
  - Mengintegrasikan pemanggilan langsung ke Google Gemini API (`gemini-1.5-flash`, `gemini-1.5-pro`, dan `gemini-2.0-flash`) untuk meracik soal interaktif otomatis dengan daya analisis mendalam sesuai topik Kurikulum Merdeka.
  - Normalisasi otomatis seluruh 5 tipe soal: Pilihan Ganda, Benar/Salah, Isian Singkat (dengan variasi sinonim ejaan), Menjodohkan (dengan pasangan konsep), dan Tebak Gambar (dengan petunjuk gambar).
- **Auto Fallback Tanpa Kendala (Zero-Downtime Guarantee):**
  - Jika kunci API belum disetel, koneksi internet terputus, atau kuota gratis habis (status 429), aplikasi secara otomatis dalam hitungan milidetik beralih ke Generator Kurikulum SD Internal tanpa memunculkan pesan error teknis yang membingungkan.
- **Salin Prompt AI Terstandar:**
  - Tetap menyediakan opsi salin prompt terstruktur untuk digunakan pada antarmuka web ChatGPT, Claude, atau Gemini Web bagi pengguna yang ingin menyusun soal secara manual.

#### 2. Panel Pengaturan Kunci API Guru (BYOK – Bring Your Own Key)
- **Pengaturan Mandiri Ramah Pengguna:**
  - Guru dapat memasukkan API Key Google Gemini mereka sendiri di modal Asisten AI.
  - Fitur sensor sandi dengan tombol intip (eye toggle), pemilihan model AI default, tombol simpan, dan opsi hapus kunci.
  - Status indikator aktif (*🟢 Gemini AI Aktif*) dan status generator internal (*⚡ Mode Kurikulum SD*).
  - Kunci disimpan aman secara lokal di peramban guru (`localStorage`) dan tidak pernah dikirim ke antarmuka siswa.

#### 3. Supabase Edge Function Siap Pakai (`generate-quiz-ai`)
- Menyediakan arsitektur fungsi server-side di `supabase/functions/generate-quiz-ai` yang memanggil Google Gemini API dengan proteksi rahasia `GEMINI_API_KEY` pada Supabase Secrets sesuai standar keamanan data tertinggi.

#### 4. Dokumentasi Panduan Integrasi Gemini AI (`docs/panduan-integrasi-gemini-ai.md`)
- Panduan terperinci mengenai perbedaan langganan konsumen **Gemini PRO / Advanced** dengan **Google AI Studio Developer API**.
- Langkah-demi-langkah mendapatkan API Key gratis dari Google AI Studio (`aistudio.google.com`).
- Tutorial konfigurasi kunci via antarmuka guru maupun via Supabase Secrets / CLI.
- Panduan pemilihan model dan penanganan kendala (troubleshooting).

## [2.2.40] - 2026-09-10
### Generator Soal Instan Kurikulum SD, Asisten Multi-Format 5 Tipe Soal, Bobot Poin & Durasi Khusus Per Butir Soal

#### 1. Generator Cepat Soal Kurikulum SD Langsung (Instant In-App Generator)
- **Pembuatan Soal 1-Klik Tanpa Keluar Aplikasi:**
  - Menghadirkan fitur *Buat Langsung Sekarang* di dalam Asisten Pembuat Soal yang langsung memproduksi paket soal tematik Kurikulum Merdeka SD siap pakai secara instan.
  - Mendukung paket materi tematik sains, matematika, organ pernapasan & pencernaan, hingga pendidikan Pancasila.
  - Menyediakan opsi pemilihan tipe format spesifik maupun variasi kombinasi (*Campuran*) yang secara otomatis memadukan berbagai tipe soal dalam satu paket kuis.

#### 2. Generator Prompt AI & Parser Cerdas Multi-Format (5 Jenis Soal)
- **Generator Prompt AI Berstandar Desain:**
  - Menghasilkan instruksi terstruktur untuk AI eksternal (seperti ChatGPT, Gemini, atau Claude) dengan skema format yang presisi untuk 5 tipe soal: Pilihan Ganda, Benar/Salah, Isian Singkat, Tebak Gambar, dan Menjodohkan Kartu.
  - Menyertakan instruksi otomatis untuk menghasilkan variasi kunci jawaban isian (*acceptableAnswers*), pasangan konsep kartu (*matchingPairs*), petunjuk visual gambar (*imageCaption*), serta estimasi bobot nilai poin.
- **Parser Deteksi Otomatis Format JSON & Teks Alami:**
  - Menganalisis masukan teks guru baik dalam format terstruktur maupun format ketikan bebas/catatan guru.
  - Mendeteksi simbol penanda pasangan kartu (seperti tanda `↔` atau `->`), baris kunci isian, dan penanda poin secara otomatis tanpa menuntut guru menghafal sintaks teknis.
  - Pratinjau interaktif kartu soal sebelum diimpor ke bank soal dengan lencana tipe, bobot poin, durasi waktu khusus, dan status validasi isi.

#### 3. Kustomisasi Bobot Nilai Poin & Durasi Waktu Khusus Per Butir Soal
- **Pengaturan Bobot Poin Fleksibel (QuizCreator):**
  - Guru dapat menentukan bobot nilai untuk masing-masing butir soal (preset cepat: 5, 10, 15, 20 poin, atau input angka kustom).
  - Soal dengan tingkat kesulitan lebih tinggi (seperti menjodohkan atau tebak gambar bertingkat) dapat diberikan bobot poin yang lebih besar secara proporsional.
- **Pengaturan Durasi Waktu Khusus (Custom Duration Override):**
  - Guru dapat memberikan waktu tambahan (misalnya 45 atau 60 detik) khusus untuk butir soal yang membutuhkan penalaran lebih panjang, tanpa mengubah durasi standar soal lainnya.
- **Integrasi Arena Gameplay & Layar Hasil (Scoring Engine):**
  - Arena kuis secara otomatis mengadaptasi penghitung waktu mundur sesuai durasi khusus masing-masing soal yang sedang aktif.
  - Layar hasil akhir menghitung skor akhir secara proporsional berdasarkan akumulasi total poin perolehan terhadap total poin maksimal kuis, dilengkapi lencana bintang perolehan poin di setiap nomor soal.

#### 4. Sinkronisasi Data Database Cloud Supabase Menyeluruh
- Skema tabel database `quizzes` dan `quiz_questions` telah disinkronkan secara menyeluruh untuk mendukung penyimpanan mode permainan bawaan, opsi pengacakan, variasi kunci isian, pasangan kartu menjodohkan, bobot poin, dan durasi waktu khusus per butir soal.
- Deployment skema database telah diverifikasi aktif dengan integritas data dan keamanan akses RLS yang terjamin.

## [2.2.39] - 2026-09-10
### Arena Gameplay Multi-Format (5 Jenis Soal), 3 Mode Permainan Edukatif & Asisten AI Studio Kuis

#### 1. Mesin Arena Gameplay Multi-Format (5 Tipe Soal)
- **Format Isian Singkat (`short_answer`):**
  - Siswa dapat mengetik langsung jawaban singkat pada kotak masukan teks responsif.
  - Dilengkapi fitur *Bantuan Huruf Pertama* untuk menuntun siswa SD tanpa memberikan jawaban langsung.
  - Validasi otomatis bersifat *case-insensitive* dan mendukung multi-sinonim melalui daftar `acceptableAnswers`.
- **Format Tebak Gambar Misteri (`image_guess`):**
  - Gambar soal ditutupi oleh 9 blok puzzle misteri yang dapat dibuka bertahap.
  - Siswa dapat mengetuk masing-masing kotak atau menekan tombol *Buka 1 Kotak Acak* untuk mengintip petunjuk visual sebelum memilih opsi jawaban.
  - Gambar terbuka penuh secara otomatis saat siswa memilih jawaban atau ketika waktu habis.
- **Format Menjodohkan Kartu (`matching_pairs`):**
  - Menghadirkan antarmuka dua kolom interaktif (Kolom A untuk konsep/pertanyaan dan Kolom B untuk pasangan/jawaban) yang diacak secara mandiri.
  - Interaksi tap-to-match intuitif: mengetuk kartu di Kolom A menyorot kartu terpilih, dilanjutkan memilih pasangannya di Kolom B.
  - Validasi visual instan dengan kunci centang hijau saat cocok, dan animasi getar lembut saat belum tepat.
- **Dukungan Pilihan Ganda (`multiple_choice`) & Benar/Salah (`true_false`):**
  - Dipertahankan dengan presisi tinggi dan tombol buka kunci guru (*Teacher Unlock*) yang diperbarui untuk seluruh 5 tipe soal.

#### 2. Tiga Mode Permainan Edukatif (Game Modes)
- **Mode Standar (⏱️):** Permainan berbasis waktu per butir soal dengan indikator kecepatan dan skor kombo bertingkat.
- **Mode 3 Hati / Survival (❤️):** Menghadirkan tantangan 3 kesempatan nyawa. Jawaban yang salah atau waktu yang habis mengurangi 1 hati. Dilengkapi dialog evaluasi belajar jika seluruh hati habis.
- **Mode Santai / Untimed (🧘):** Membebaskan siswa dari tekanan stopwatch, sangat ideal untuk remedial, latihan mandiri di rumah, atau anak berkebutuhan khusus.

#### 3. Pembaruan Studio Kuis Guru (QuizCreator)
- **Pengaturan Mode & Fair Play (Langkah 1):**
  - Guru dapat menentukan Mode Permainan Bawaan kuis (*defaultGameMode*).
  - Opsi pengacakan kuis: *Acak Urutan Soal* dan *Acak Urutan Pilihan Jawaban*.
- **Pembangun Soal 5 Format (Langkah 2):**
  - Bilah pemilih format soal dinamis: Pilgan, Benar/Salah, Isian Singkat, Tebak Gambar, dan Menjodohkan.
  - Formulir pasangan kartu dinamis untuk Menjodohkan dengan tombol tambah/hapus pasangan.
  - Kolom masukan kunci utama dan variasi sinonim ejaan untuk Isian Singkat.
- **Pratinjau Akurat (Langkah 3):**
  - Kartu simulasi dan daftar ringkasan butir soal menampilkan rincian mode dan kunci jawaban yang tepat untuk seluruh format.

#### 4. Asisten AI & Generator Cepat Guru
- Mengintegrasikan modal asisten AI dengan generator prompt terstruktur untuk mempermudah guru merancang soal tematik berkualitas tinggi.
- Parser cerdas yang mampu mendeteksi format JSON maupun teks terstruktur untuk diimpor langsung ke bank soal.

#### 5. Integrasi Lobi Siswa & Tinjauan Hasil Lengkap
- Lobi siswa kini dilengkapi pemilih kartu mode permainan sebelum memulai petualangan kuis.
- Layar hasil akhir (*QuizResult*) menampilkan ulasan jawaban siswa dan kunci jawaban yang rapi untuk seluruh format soal.

## [2.2.38] - 2026-09-10
### Fitur Manajemen Butir Soal Lengkap: Edit Soal, Duplikasi, Pengaturan Urutan, dan Alur Simpan Cepat

#### Fitur Interaktif Manajemen Butir Soal (QuizCreator Step 2)
- **Fitur Edit Butir Soal Terintegrasi:**
  - Guru kini dapat memilih butir soal mana pun dari daftar Bank Soal untuk dimuat kembali ke formulir editor secara instan.
  - Kartu soal yang sedang diedit diberi penanda visual aktif (*ring border* dan badge *Diedit* berwarna emas).
  - Formulir secara otomatis beralih ke mode pengeditan dengan judul dinamis `Edit Soal #X`, tombol `Perbarui Soal`, dan opsi `Batal Edit`.
  - Pembaruan data soal dilakukan secara *in-place* dengan reaktivitas instan tanpa merusak susunan draf kuis.
- **Fitur Duplikasi Butir Soal Kilat (One-Click Clone):**
  - Menghadirkan tombol *Duplikat* di setiap kartu butir soal pada Bank Soal.
  - Memungkinkan guru membuat variasi soal serupa secara cepat tanpa perlu mengetik ulang dari awal.
- **Fitur Pengaturan Urutan Soal (Reorder Naik / Turun):**
  - Menambahkan tombol panah navigasi *Geser ke Atas* dan *Geser ke Bawah* di setiap butir soal.
  - Tombol secara cerdas menonaktifkan diri pada batas urutan (soal teratas tidak bisa digeser ke atas, soal terbawah tidak bisa digeser ke bawah).
  - Perpindahan posisi nomor soal berlangsung halus dan reaktif.
- **Alur Kerja Pembuatan Soal Berkelanjutan (*Simpan & Buat Baru* vs *Simpan & Selesai*):**
  - Menyediakan tombol primer `Simpan & Buat Baru` yang menyimpan soal ke bank dan langsung menyiapkan formulir bersih untuk soal berikutnya tanpa bolak-balik klik tombol buka.
  - Menyediakan tombol sekunder `Simpan & Selesai` yang menyimpan soal sekaligus menutup formulir untuk menampilkan daftar ringkasan.
- **Pintasan Langsung Edit dari Layar Pratinjau (Step 3 Preview):**
  - Setiap butir soal pada ringkasan pratinjau kuis kini dapat diklik langsung untuk melompat kembali ke Langkah 2 dengan soal tersebut telah termuat siap diedit.

#### Optimasi Tata Letak & Responsivitas Mobile-First
- Menyesuaikan bilah atas formulir soal dengan tata letak adaptif (*flex column* pada layar sempit $\le 360\text{ px}$ dan *flex row* pada layar tablet/desktop).
- Memastikan seluruh tombol aksi di kartu soal dan formulir mempertahankan target sentuh yang nyaman ($\ge 44 \times 44\text{ px}$) serta bebas luapan horizontal di seluruh perangkat.

## [2.2.37] - 2026-09-10
### Standardisasi Baku AGENTS.md, Penyelarasan Studio Kuis & Protokol Audit Responsivitas

#### Standar Utama Panduan Kerja AI (AGENTS.md)
- **Standardisasi Baku Anti-AI Slop & Zero Backend Exposure:**
  - Menetapkan larangan mutlak penggunaan kata-kata teknis backend (`Cloud Supabase`, `SQL Editor`, `REST API`, `schema public`, `database`, dll) di seluruh antarmuka pengguna (`src/components/`).
  - Menjadikan kesederhanaan, keterbacaan, kehangatan pedagogis, dan teks yang ringkas (*minim kata, maksimal makna*) sebagai standar wajib seluruh pengembang/AI Agent.
  - Membakukan penggunaan `whitespace-nowrap` dan `flex-shrink-0` pada seluruh badge/pill untuk mencegah distorsi vertikal (*anti-warping*).
- **Protokol Audit Multi-Viewport Mandatori:**
  - Memasukkan matriks pengujian 8 profil resolusi (Mobile-S 320px, Mobile-M 375px, Android Tall 412px, Tablet Potret 768px, Tablet Lanskap 1024px, Desktop HD 1440px, Wide Full HD 1920px, Ultrawide/4K IFP 2560px-3840px) ke dalam `AGENTS.md`.
  - Mewajibkan verifikasi nol luapan horizontal (`scrollWidth === clientWidth`) dan target sentuh minimal 44x44 px pada setiap perubahan antarmuka.

#### Penyelarasan Visual Studio Kuis Guru (QuizCreator)
- **Harmonisasi Bilah Tahapan & Konten Utama:**
  - Mengatasi peregangan visual yang tidak seimbang pada Step 1 (Info Kuis) dan Step 3 (Pratinjau) di mana tab navigasi sebelumnya melebar ekstrem ke 2000px sementara kartu formulir terpusat di tengah.
  - Bilah tahapan kini menyelaraskan batas lebarnya secara dinamis (`max-w-4xl 2xl:max-w-5xl`) saat berada di Step 1 & Step 3 sehingga simetris dan sejajar presisi dengan kartu konten, serta bertransisi mulus ke `max-w-[2000px]` pada Step 2 (Bank Soal) untuk mendukung tata letak 2 kolom layar lebar.

## [2.2.36] - 2026-09-10
### Penyempurnaan Antarmuka Dasbor Guru & Perombakan Kartu Kuis Anti-Warping

#### Pembersihan Istilah Teknis & Penyederhanaan Visual (*Clarity & Aesthetics First*)
- **Eliminasi Teks Teknis & Slop Non-Edukatif:**
  - Menghapus label teknis backend dan banner status database pada dasbor guru sehingga antarmuka berfokus sepenuhnya pada pengalaman belajar-mengajar yang intuitif.
  - Memperbarui label identitas pada bilah atas dasbor dengan nama sekolah/institusi pendidik yang lebih komunikatif dan profesional.
  - Menyelaraskan teks keterangan rekap nilai siswa menjadi bahasa yang ringkas, komunikatif, dan ramah pengguna.

#### Desain Ulang Kartu Kuis (*Anti-Warping & Fluid Spacing*)
- **Tata Letak Kartu yang Kokoh & Estetis:**
  - Mengatasi kendala pelipatan teks/badge (warping) pada indikator kelas dan mata pelajaran dengan penerapan `whitespace-nowrap` dan pemisahan baris yang ergonomis.
  - Mengelompokkan nomor PIN kuis di sisi kiri atas dan status visibilitas (Publik/Privat) beserta tombol menu aksi tiga titik di sisi kanan atas secara seimbang.
  - Menata avatar ikon kuis tematik dalam wadah persegi lengkung modern berdampingan dengan judul dan deskripsi kuis.
- **Bilah Informasi & Tombol Aksi Edukatif:**
  - Menyederhanakan baris ringkasan soal dengan indikator jumlah pertanyaan dan durasi per soal yang bersih tanpa pengulangan informasi.
  - Mempertahankan akses cepat tombol primer *Mode IFP* untuk layar interaktif ruang kelas, didukung tombol sekunder *Bagi Tautan* dan *Edit* dengan target sentuh responsif minimal 44x44 px.

#### Verifikasi Multi-Tema & Multi-Perangkat
- Menguji keselarasan tampilan kartu kuis pada mode terang dan gelap (*Dark & Light Mode*).
- Memastikan tata letak tetap proporsional dan nyaman dioperasikan dari layar smartphone ringkas hingga monitor layar lebar.

## [2.2.35] - 2026-09-10
### Audit Visual Menyeluruh & Eliminasi Celah Lebar Antar-Platform (Mobile-S hingga IFP Smartboard 4K)

#### Tata Letak Responsif & Eliminasi Celah Sisi (*Zero Dead-Space Across All Viewports*)
- **Penyesuaian Lebar Kontainer Komprehensif (`max-w-[2000px]`):**
  - Mengeliminasi celah hitam/kosong di sisi kiri dan kanan pada monitor desktop lebar (1920px Full HD), layar Ultrawide (2560px/3440px), hingga Interactive Flat Panel (IFP) Smartboard 4K (3840px).
  - Menyelaraskan seluruh kontainer utama aplikasi (`QuizHome`, `TeacherDashboard`, `QuizCreator`, `StudentLobby`, `QuizArena`, dan `QuizResult`) ke grid fluida adaptif `w-full max-w-[2000px] mx-auto px-3 xs:px-4 sm:px-8 lg:px-12`.
  - Grid kartu kuis kini beradaptasi secara berjenjang dari 1 kolom (Mobile-S/M/L), 2 kolom (Tablet potret), 3 kolom (Tablet lanskap), 4 kolom (Desktop), 5 kolom (2xl), hingga 6 kolom (3xl/IFP 4K).

#### Optimalisasi Antarmuka Kuis & Ruang Belajar Guru (*Studio & Arena UI Scaling*)
- **Studio Kuis Guru (`QuizCreator`):**
  - Header navigasi dan bilah tahapan (1. Info Kuis, 2. Bank Soal, 3. Pratinjau) kini mengisi lebar tampilan monitor secara seimbang tanpa terpotong.
  - Tahap 2 (Bank Soal) mengadopsi tata letak dua kolom proporsional pada layar lebar (`lg:col-span-5 2xl:col-span-4` untuk daftar soal dan `lg:col-span-7 2xl:col-span-8` untuk formulir input pertanyaan).
  - Formulir informasi kuis dan pratinjau kartu kuis diposisikan secara simetris dan elegan (`max-w-4xl 2xl:max-w-5xl mx-auto`).

- **Arena Kuis & Mode Interaktif IFP Smartboard (`QuizArena`):**
  - Memperluas kontainer kartu pertanyaan kuis dari pembatas statis 768px menjadi `max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl 4k:max-w-[1800px] mx-auto`.
  - Target sentuh tombol opsi jawaban diperbesar hingga `519px`–`583px` dengan tinggi sentuh $\ge 72\text{ px}$ (hingga $80\text{ px}$ pada IFP 4K), menjamin kemudahan interaksi sentuhan langsung di papan tulis digital kelas.
  - Tipografi pertanyaan ditingkatkan secara proporsional hingga `3xl:text-4xl` agar mudah dibaca oleh seluruh siswa dari sudut ruang kelas mana pun.

- **Halaman Hasil Belajar Siswa (`QuizResult`):**
  - Memperluas kontainer ulasan nilai dan pembahasan soal menjadi `max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto`.
  - Pada layar lebar, ulasan butir soal disajikan dalam grid 2 kolom (`grid-cols-1 lg:grid-cols-2`) yang rapi dan meminimalkan ruang kosong vertikal.

#### Audit Presisi Mobile-S & Target Sentuh (*Rule 1 & Rule 2 Verified*)
- **Verifikasi Nol Overflow Horizontal (`scrollWidth === clientWidth`):**
  - Melakukan audit otomatis dengan peramban tanpa kepala pada 10 profil resolusi (Mobile-S 320px, Mobile-M 375px, Mobile-L 425px, Android Non-Reguler 412x915, Tablet Potret 768px, Tablet Lanskap 1024px, Desktop HD 1440px, Wide 1920px, Ultra-Wide 2560px, dan IFP 4K 3840px).
  - Seluruh halaman lulus pengujian dengan 0px horizontal scroll dan 100% kepatuhan ukuran target sentuh minimal $\ge 44\times 44\text{ px}$.

---

## [2.2.34] - 2026-09-10
### Otomatisasi Penuh Deployment Skema Database Cloud & Panduan Kerja AI (Autonomous Supabase Deployment & AGENTS.md Integration)

#### Otomatisasi Deployment Mandiri (*Autonomous Database Pipeline*)
- **Pipeline Deployment Supabase Terprogram (`npm run db:deploy`):**
  - Membuat utilitas otomatis [`scripts/deploy-supabase.js`](file:///E:/Data/GitHub/Kuis%20Interaktif/scripts/deploy-supabase.js) yang mengeksekusi skema database langsung ke Supabase Management API menggunakan token akses terenkripsi tanpa intervensi manual.
  - Skrip membaca konfigurasi proyek secara otomatis dari `.env` dan memvalidasi integritas baris data di seluruh tabel (`quizzes`, `quiz_questions`, `profiles_player`, `profiles_teacher`, `quiz_attempts`).
  - Berhasil mengeksekusi dan memverifikasi skema database cloud: 6 kuis dan 22 butir soal resmi kini 100% aktif di PostgreSQL Supabase.

#### Standar Operasional AI Agent (*SOP Standard & AI Protocol*)
- **Dokumen Prosedur AI Agent Resmi ([`AGENTS.md`](file:///E:/Data/GitHub/Kuis%20Interaktif/AGENTS.md)):**
  - Menetapkan aturan mutlak bagi seluruh AI Agent untuk selalu mengeksekusi `npm run db:deploy` setiap kali ada perubahan pada skema atau seed data, tanpa meminta pengguna melakukan salin-tempel manual.
  - Mendokumentasikan kepatuhan keamanan data tingkat tinggi (Rule 9 & 10), standar mobile-first (Rule 1), target sentuh $\ge 44\times 44\text{ px}$, dan verifikasi kualitas.

---

## [2.2.33] - 2026-09-10
### Aktivasi Sinkronisasi Database Cloud Penuh & Skrip Migrasi Skema Mandiri (Full Cloud Database Sync & Resilient Schema Migration)

#### Integrasi Database & Sinkronisasi Cloud (*Full Cloud Integration & Live Sync*)
- **Sinkronisasi Otomatis Beranda & Dasbor Guru (*Live Cloud Fetch & Cache Fallback*):**
  - Mengimplementasikan `fetchQuizzesFromCloud()` pada `DataManager` yang mengambil data kuis dan bank butir soal secara langsung dari database cloud saat halaman dimuat.
  - Memperbarui sistem penyimpanan lokal secara adaptif sebagai lapisan *offline-first cache* berkecepatan tinggi, sehingga aplikasi tetap dapat dimainkan saat jaringan lambat atau terputus.
  - Penyelarasan mutasi data real-time: pembuatan kuis baru, penyuntingan pertanyaan, penggandaan, pembaruan pengaturan, serta pencatatan skor dan rekapitulasi nilai tersinkronisasi langsung ke entitas tabel cloud.

- **Pemeriksaan Kesehatan Koneksi & Skema (*Database Health Check & Diagnostic Status*):**
  - Menambahkan metode diagnostik `checkSupabaseHealth()` untuk memverifikasi kesiapan koneksi REST API dan ketersediaan tabel di skema database.
  - Menampilkan lencana status cerdas di navbar Dasbor Guru yang mengindikasikan kondisi koneksi (*Aktif*, *Menunggu Setup SQL*, atau *Mode Offline*).
  - Menampilkan banner edukatif interaktif pada Dasbor Guru yang memandu pengguna saat tabel database belum dieksekusi, lengkap dengan tombol verifikasi ulang instan (*Cek Status Tabel*).

- **Skrip Skema Database Lengkap & Kebijakan Akses (*Complete Database Schema & Safe RLS Policies*):**
  - Memperbarui dokumen migrasi skema resmi [`docs/setup.sql`](file:///E:/Data/GitHub/Kuis%20Interaktif/docs/setup.sql) ke versi `2.2.33`.
  - Mengonfigurasi seluruh tabel inti sistem: `profiles_player`, `profiles_teacher`, `quizzes`, `quiz_questions`, `quiz_attempts`, `audit_logs`, dan `system_backups`.
  - Mengaktifkan *Row Level Security* (RLS) di seluruh tabel dengan kebijakan yang aman untuk akses publik kuis sekolah, pencatatan hasil siswa, serta pengelolaan kuis oleh guru.
  - Menyertakan pemicu otomatis (*triggers*) untuk sinkronisasi profil pengguna baru dan pembaruan stempel waktu (*timestamp*).
  - Menyertakan data benih (*seed data*) 6 kuis interaktif resmi beserta 23 butir soal kurikulum SD.

---

## [2.2.32] - 2026-09-09
### Perampingan Minimalis Menu Pengaturan Kuis & Eliminasi Teks Penjelas Berlebih (Ultra-Clean Settings Sheet & Minimalist Action UI)

#### Optimalisasi Antarmuka & Penyederhanaan Desain (*Clean & Minimalist Action Menu*)
- **Format Menu Pengaturan Ringkas (*Sleek Action Rows*):**
  - Mengeliminasi seluruh teks penjelas, paragraf bertele-tele, dan komponen kontainer bersarang ganda pada menu titik tiga kuis.
  - Setiap aksi kini disajikan sebagai tombol/baris pengaturan yang bersih (*native settings row*), minim kata-kata, dan langsung ke fungsi esensial:
    1. **Duplikat:** Tombol baris bersih untuk menggandakan kuis seketika dengan indikator pemrosesan.
    2. **Lihat Rekap:** Tombol baris bersih dengan panah navigasi menuju tab rekapitulasi nilai siswa.
    3. **Cetak LKS:** Tombol baris bersih menuju format cetak lembar kerja siswa A4.
    4. **Status Visibilitas:** Baris sakelar instan dengan lencana status aktif (*Publik* / *Privat*) yang dapat diubah dalam sekali klik tanpa kartu bersarang.
    5. **PIN:** Baris ringkas dengan tampilan kode PIN font mono serta tombol aksi cepat *Acak* dan *Salin*.
    6. **Hapus Kuis:** Baris aksi destruktif berlatar merah lembut dengan proteksi konfirmasi modal in-app.
- **Penyelarasan Tombol Muka Kartu (*In-Card Buttons Refinement*):**
  - Menyelaraskan teks tombol pada muka kartu menjadi ringkas dan tepat sasaran: `Mode IFP`, `Bagi Tautan`, dan `Edit`.

#### Verifikasi Multi-Viewport (*Quality Gate Verification*)
- Diuji pada resolusi Mobile-S (320px) hingga Desktop (1280px) menggunakan peramban nyata (Playwright).
- Terverifikasi 100% bebas luapan horizontal (`hasDocOverflow: false`, `modalHasOverflow: false`) dengan target sentuh $\ge 44\times 44\text{ px}$.
- Pengurangan ukuran bundel JavaScript sebesar ~7.4 kB berkat eliminasi teks redundan dan struktur DOM bersarang.

---

## [2.2.31] - 2026-09-09
### Penataan Ulang Tombol Kartu Kuis dan Menu Titik Tiga Bebas Redundansi (Card Action Streamlining & Dedicated 6-Action Three-Dots Menu)

#### Optimalisasi Antarmuka & Pemisahan Aksi (*Action Hierarchy & Redundancy Removal*)
- **Penataan Tombol Muka Kartu Kuis (*In-Card Actions*):**
  - Muka kartu kuis pada Dasbor Guru kini disederhanakan secara presisi menjadi 3 tombol esensial bebas dari penumpukan tombol:
    1. **Mode IFP:** Tombol primer untuk langsung membuka kuis di Smartboard / Interactive Flat Panel ruang kelas.
    2. **Bagi Tautan:** Tombol sekunder untuk menyalin tautan langsung ruang kuis dengan umpan balik visual tersalin.
    3. **Edit Soal:** Membuka kuis langsung ke antarmuka *Quiz Creator* dengan seluruh draf dan pertanyaan terisi lengkap untuk penyuntingan instan.
  - Memindahkan tombol *Cetak LKS* dan tombol *Hapus Kuis* dari muka kartu ke dalam menu titik tiga, menjadikan kartu kuis ramping dan ergonomis.
- **Penyempurnaan Menu Titik Tiga 6-Aksi (*Dedicated 6-Item Three-Dots Bottom Sheet*):**
  - Mengonfigurasi lembar aksi titik tiga agar fokus pada 6 tindakan manajemen kuis yang tidak redundan dengan muka kartu:
    1. **Duplikat Kuis:** Menggandakan kuis dengan judul salinan dan kode PIN ruang unik baru secara instan (`DataManager.duplicateQuiz`).
    2. **Lihat Rekap Nilai:** Mengarahkan guru langsung ke tab Rekap Nilai Siswa untuk menganalisis akurasi dan jawaban kelas.
    3. **Cetak Lembar LKS:** Membuka tampilan cetak lembar kerja siswa format kertas dan kunci jawaban PDF.
    4. **Status Visibilitas:** Pengalihan visibilitas kuis secara interaktif antara mode *Publik* dan *Privat*.
    5. **Konfigurasi PIN Siswa:** Tampilan kode PIN dengan tata letak grid 3 kolom responsif berisi opsi *Acak PIN*, *Salin PIN*, dan *Salin Tautan*.
    6. **Hapus Kuis Ini:** Aksi destruktif di posisi bawah dengan warna peringatan merah dan perlindungan konfirmasi modal in-app.

#### Verifikasi Quality Gate Multi-Viewport (*Quality Gate Verification*)
- **Ketahanan Tampilan Mobile-S (320px) hingga Desktop (1280px):**
  - Diuji pada peramban nyata dengan Playwright pada resolusi Mobile-S (320px), Mobile-M (375px), dan Layar Lebar (1280px).
  - Terverifikasi 100% bebas dari teks terpotong (`overflow-x: clip`, `hasDocOverflow: false`, `modalHasOverflow: false`).
  - Seluruh tombol interaktif memenuhi batas minimal target sentuh $\ge 44\times 44\text{ px}$ (Rule 1).

---

## [2.2.30] - 2026-09-09
### Implementasi Menu Titik Tiga & Lembar Pengaturan Kuis Interaktif (Interactive Quiz Settings Bottom Sheet & Three-Dots Action Menu)

#### Antarmuka Pengguna & Interaksi Pengaturan Kuis (*UI & Quiz Settings Flow*)
- **Tombol Menu Titik Tiga Terintegrasi (*Three-Dots Action Button*):**
  - Menggantikan tombol sakelar publik/privat yang sebelumnya sempit dan rawan salah tekan pada kartu kuis dengan tombol menu titik tiga (`MoreVertical`) yang bersih, ergonomis, dan intuitif.
  - Memisahkan indikator status kuis (lencana status *Publik* / *Privat*) dari tombol pemicu konfigurasi untuk keterbacaan yang jauh lebih baik.
  - Memastikan ukuran target sentuh memenuhi standar minimum 44×44 px (`min-h-[44px] min-w-[44px]`) untuk kenyamanan penggunaan pada layar ponsel dan tablet.
- **Lembar Pengaturan Kuis Interaktif (*Interactive Quiz Settings Bottom Sheet & Modal*):**
  - Menghadirkan komponen antarmuka baru `QuizSettingsModal.tsx` yang secara otomatis bertransformasi menjadi *Bottom Sheet* halus dengan pegangan geser (*drag handle pill*) pada perangkat seluler, serta modal terpusat berlatar kabur lembut (*glassmorphic dialog*) pada layar desktop/tablet.
  - **Konfigurasi Visibilitas Beranda:** Kartu pilihan interaktif untuk mode *Publik* (tampil di beranda bagi seluruh siswa) dan mode *Privat* (disembunyikan dari beranda, hanya dapat diakses melalui PIN atau tautan langsung) dengan penjelasan ringkas dan tanda centang aktif yang jelas.
  - **Penyesuaian Alokasi Waktu per Soal:** Tombol pilihan waktu instan (*chips*) dengan opsi 15s, 20s, 25s, 30s, 45s, dan 60s per soal beserta kalkulasi durasi otomatis.
  - **Manajemen PIN Ruang Ujian:** Tampilan kartu PIN siswa dengan fitur *Acak PIN* (regenerasi kode 4 digit unik), salin PIN, dan salin tautan kuis langsung ke papan klip dengan umpan balik visual instan.
  - **Pintasan Aksi & Manajemen Lanjutan:** Tombol akses cepat ke Mode Smartboard (IFP), Cetak Lembar LKS, serta opsi penghapusan kuis berproteksi konfirmasi.
  - **Tombol Simpan & Umpan Balik Responsif:** Tombol simpan cerdas yang hanya aktif saat terdapat perubahan data, dilengkapi animasi sukses dan penutupan otomatis.
- **Sinkronisasi Data Real-Time (`DataManager.updateQuizSettings`):**
  - Menyediakan fungsi mutasi pengaturan kuis yang tersinkronisasi langsung, baik pada penyimpanan lokal maupun basis data daring.
  - Mengimplementasikan penyaringan deduplikasi kuis bawaan agar kuis yang disesuaikan tidak terduplikasi pada katalog kuis.

#### Standar Quality Gate Multi-Viewport (*Quality Gate Verification*)
- **Verifikasi Lintas Perangkat (Mobile-S 320px hingga Desktop 1280px):**
  - Diuji secara menyeluruh menggunakan Playwright pada Mobile-S (320px), Mobile-M (375px), dan Layar Lebar (1280px).
  - Terverifikasi 100% bebas dari luapan horizontal (`hasDocOverflow: false`, `modalHasOverflow: false`).
  - Mendukung penutupan intuitif via gestur tombol kembali Android, tombol Esc keyboard, serta klik area luar modal.

---

## [2.2.29] - 2026-09-09
### Dukungan Penuh Penghapusan & Pengujian Kuis Aktif oleh Admin serta Mekanisme Pemulihan Kuis Bawaan (Admin Active Quiz Deletion & Seed Restoration System)

#### Manajemen Kuis & Pengujian Admin (*Quiz Management & Testing Control*)
- **Penghapusan Kuis Aktif untuk Pengujian Fleksibel:**
  - Menyediakan kemampuan penuh bagi Admin (`zy0x.noir@gmail.com`) untuk menghapus kuis aktif mana pun sewaktu-waktu demi kebutuhan pengujian tanpa hambatan.
  - Memperbaiki pembatasan tombol hapus pada `TeacherDashboard.tsx` dan `QuizHome.tsx` yang sebelumnya hanya memeriksa prefix ID `custom_`. Kini tombol hapus aktif secara presisi berdasarkan model hak akses (`canDelete = isMasterTeacher || quiz.creatorId === teacher.id || isCustom`).
  - Mengintegrasikan dialog konfirmasi `ConfirmDeleteModal` berstandar glassmorphic dengan proteksi sentuhan dan penguncian scroll body saat dialog terbuka.
- **Mekanisme Pelacakan Kuis Terhapus (`DataManager`):**
  - Mengimplementasikan `STORAGE_KEY_DELETED_QUIZZES` untuk mencatat kuis yang dihapus, memastikan kuis bawaan (*seed quizzes*) yang dihapus tidak muncul kembali saat halaman dimuat ulang.
  - Menyelaraskan `getAllQuizzes`, `getQuizById`, dan `getQuizByPin` agar kuis terhapus konsisten disaring di semua pintu masuk pencarian.
  - Mendukung penghapusan berjenjang pada Supabase (`quiz_questions` dihapus sebelum `quizzes`) untuk mencegah galat *foreign key constraint*.
- **Tombol Pemulihan Kuis Bawaan (*One-Click Seed Restore*):**
  - Menghadirkan tombol `Pulihkan Kuis Bawaan (N)` pada Dasbor Guru saat ada kuis bawaan yang terhapus, memungkinkan Admin mengembalikan seluruh bank soal pengujian kapan pun diperlukan.

#### Standar Quality Gate Multi-Viewport (*Quality Gate Verification*)
- **Presisi Responsif & Target Sentuh:**
  - Terverifikasi pada Mobile-S (320px), Mobile-M (375px), Android tinggi 20.5:9 (393×896), dan Layar Lebar (1280px) dengan `hasOverflow: false`.
  - Seluruh tombol aksi penghapusan memenuhi standar target sentuh minimal 44×44 px (Rule 1).

---

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
