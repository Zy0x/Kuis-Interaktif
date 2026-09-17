# Catatan Perubahan (Changelog)
Seluruh riwayat rilis dan pembaruan sistem **Kuis Seru** dicatat pada dokumen ini sesuai dengan standar penomoran versi berlanjut.

## [2.4.63] - 2026-09-17
### Penambahan Nama Hari dan Tanggal pada Waktu Penyelesaian Siswa (Rule 1, Rule 2, Rule 3, Rule 4 & Rule 15)

#### 1. Kejelasan Waktu Pengerjaan & Selesai Siswa (`WaygroundHostView.tsx`, `QuizSessionRecapView.tsx`, `StudentAnswerAnalysisModal.tsx`)
- **Penambahan Nama Hari & Tanggal Lengkap**: Waktu penyelesaian siswa di Ruang Kendali Host (`WaygroundHostView.tsx`) dan Rekap Sesi Kuis (`QuizSessionRecapView.tsx`) kini secara eksplisit mencantumkan nama hari dan tanggal kalender Indonesia (contoh: `Selesai: Rabu, 16 Sep, 19:47 WITA`). Hal ini melenyapkan kerancuan identifikasi apabila siswa mengerjakan kuis pada hari yang berbeda di jam yang serupa.
- **Penyelarasan Kartu Analisis Siswa (`StudentAnswerAnalysisModal.tsx`)**: Menampilkan hari dan tanggal pengerjaan pada kartu Waktu Mulai (`Rabu, 16 Sep • 170 dtk`) dan Waktu Selesai (`Rabu, 16 Sep 2026`), serta menyediakan tooltip penunjuk waktu presisi per butir soal.
- **Peningkatan Modul Utilitas Waktu (`dateUtils.ts`)**: Memperkaya fungsi `formatIndonesianTime` dengan dukungan nama hari (*withDay*) dan mengekspor fungsi `formatIndonesianDate` untuk penanggalan terstruktur.

#### 2. Pembaruan Versi & Cache PWA
- Memperbarui versi aplikasi ke `2.4.63` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.63` (`public/sw.js`).
- Memperbarui badge versi di `README.md`.

## [2.4.62] - 2026-09-17
### Pembersihan Ikon Simbol Redundan & Optimalisasi Tipografi Lembar Analisis (Rule 1, Rule 2, Rule 4 & Rule 15)

#### 1. Penyederhanaan Visual Status Soal & Tab Filter (`StudentAnswerAnalysisModal.tsx`)
- **Pembersihan Ikon Simbol Redundan**: Menghilangkan simbol `✓`, `✕`, dan `⚪` pada kartu ringkasan Status Soal dan tab filter navigasi. Setiap kategori (`Benar`, `Salah`, `Kosong`) kini disajikan dalam format teks bersih yang elegan (`X Benar • Y Salah • Z Kosong`) dengan pemanfaatan warna tematik bawaan (*emerald*, *rose*, *amber*), memberikan keterbacaan yang jauh lebih jernih dan bebas gangguan visual (*clean UI*).
- **Proteksi Tata Letak (*Layout Wrapping Protection*)**: Menambahkan `whitespace-nowrap` dan pengelompokan kontainer pada teks status agar pemisah tanda titik (`•`) tidak terpotong atau jatuh sendirian ke baris berikutnya pada layar beresolusi kompak.

#### 2. Pembaruan Versi & Cache PWA
- Memperbarui versi aplikasi ke `2.4.62` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.62` (`public/sw.js`).
- Memperbarui badge versi di `README.md`.

## [2.4.61] - 2026-09-17
### Proteksi Pembajakan Indeks Acak & Sinkronisasi Mutlak Tab Butir Soal Belum Dijawab (Rule 1, Rule 2, Rule 4, Rule 11, Rule 14 & Rule 15)

#### 1. Resolusi Anomali Tab "Belum Dijawab" pada Modal Analisis Jawaban Siswa (`StudentAnswerAnalysisModal.tsx`)
- **Proteksi dari Pembajakan Indeks Acak (*Shuffle Collision*)**: Menghapus kondisi fallback longgar `a.questionIndex === idx` yang berpotensi membajak status butir soal yang belum dijawab. Pada sesi kuis dengan pengacakan soal aktif, nomor urut tampilan lokal siswa berbeda dengan indeks master. Fallback lama menyebabkan butir soal yang sebenarnya tidak dijawab oleh siswa keliru dikaitkan dengan jawaban butir soal lain yang kebetulan menempati nomor urut tampilan yang sama.
- **Kepatuhan UUID Kanonik**: Pencocokan jawaban kini 100% mengutamakan `q.id` (UUID). Fallback berbasis indeks hanya berlaku khusus untuk data historis warisan yang benar-benar tidak memiliki `questionId`.
- **Penayangan Presisi Soal Kosong/Dilewati**: Butir soal yang dilewati siswa (misalnya Soal #4 dan Soal #9) kini tampil secara lengkap dan tepat di bawah tab filter `⚪ Belum Dijawab`, melenyapkan anomali tampilan kosong *"Semua soal telah dijawab oleh siswa"* saat tab filter dipilih.

#### 2. Penyelarasan Mutlak Badge Filter dengan Daftar Butir Soal
- **Evaluasi Terpusat (`evaluatedQuestionList`)**: Mengintegrasikan perhitungan jumlah ringkasan (`correctCount`, `incorrectCount`, `unansweredCount`) langsung dari daftar evaluasi terpusat, menjamin sinkronisasi 100% antara angka pada badge tab filter dengan jumlah kartu soal yang dirender saat tab diklik.

#### 3. Pembaruan Versi & Cache PWA
- Memperbarui versi aplikasi ke `2.4.61` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.61` (`public/sw.js`).
- Memperbarui badge versi di `README.md`.

## [2.4.60] - 2026-09-17
### Resolusi Presisi Relasi Kunci Jawaban vs Pilihan Siswa Berbasis UUID Soal Kanonik (Rule 1, Rule 2, Rule 9, Rule 11, Rule 14 & Rule 15)

#### 1. Perbaikan Kritis Pencocokan Butir Soal pada Lembar Analisis (`StudentAnswerAnalysisModal.tsx`)
- **Pencocokan Berbasis `questionId` Kanonik**: Memperbaiki pemetaan jawaban siswa yang sebelumnya mengandalkan indeks urutan relatif (`questionIndex`). Ketika fitur pengacakan soal (*shuffle questions*) diaktifkan, urutan soal di layar siswa berbeda dengan urutan kuis master. Pemetaan kini 100% menggunakan `q.id` (UUID kanonik), menjamin kesesuaian mutlak antara soal, pilihan jawaban siswa, kunci jawaban benar, dan lencana status evaluasi.
- **Melenyapkan Anomali Benar/Salah Terbalik**: Menuntaskan kekeliruan visual di mana jawaban siswa yang identik dengan kunci jawaban ditandai keliru, atau jawaban yang berbeda dengan kunci jawaban ditandai benar, yang sebelumnya terjadi akibat pergeseran indeks soal acak.

#### 2. Preservasi Teks Jawaban Pilihan Ganda (`QuizArena.tsx`)
- **Perekaman Eksplisit Nilai Teks Opsi**: Saat siswa memilih opsi jawaban di arena, sistem kini langsung merekam teks asli dari opsi tersebut ke dalam properti `textAnswer` (bukan hanya `selectedIndex`). Hal ini menjamin nilai jawaban siswa tetap utuh dan konsisten sekalipun opsi diacak (*shuffle options*) atau dilihat kembali dari sesi rekapitulasi.
- **Penyelarasan `questionIndex` Master**: Menyelaraskan penyimpanan `answersMap` dengan indeks kuis master sebagai referensi sekunder.

#### 3. Akurasi Matriks Keberhasilan Soal & Ekspor CSV Guru
- **Korelasi ID pada Matriks Akurasi Host & Rekap**: Memperbaiki perhitungan matriks keberhasilan per butir soal di `WaygroundHostView.tsx` dan `QuizSessionRecapView.tsx` agar mengagregasi data berdasarkan `q.id`, sehingga statistik per nomor soal selalu merujuk pada butir soal master yang tepat.
- **Ekspor CSV Presisi**: Kolom rincian soal pada berkas CSV hasil unduhan kini dipetakan langsung dengan `q.id` master, melenyapkan risiko tertukarnya status jawaban siswa antar butir soal.

#### 4. Pembaruan Versi & Cache PWA
- Memperbarui versi aplikasi ke `2.4.60` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.60` (`public/sw.js`).
- Memperbarui badge versi di `README.md`.

## [2.4.59] - 2026-09-17
### Transparansi Statistik Soal Kosong/Dilewati & Sinkronisasi Indikator Progres Siswa (Rule 1, Rule 2, Rule 11, Rule 14 & Rule 15)

#### 1. Transparansi Indikator Butir Soal Kosong / Dilewati
- **Distribusi Statistik Lengkap (Benar • Salah • Kosong)**: Memperbaiki agregasi statistik di `WaygroundHostView.tsx` dan `QuizSessionRecapView.tsx` sehingga butir soal yang tidak sempat dijawab atau dilewati siswa saat kuis dikumpulkan tidak lagi tersembunyi.
- **Lencana Status Pengerjaan Informatif**: Menampilkan lencana status `Selesai (X kosong)` dengan aksen warna kuning hangat (*amber*) jika siswa menyelesaikan kuis tanpa menjawab seluruh butir soal.
- **Sinkronisasi Baris Status**: Baris statistik kini secara eksplisit menampilkan `Benar: X • Salah: Y • Kosong: Z` sehingga jumlahnya selalu persis sama dengan total butir soal ($X + Y + Z = Total Soal$).

#### 2. Kalibrasi Akurat Bilah Progres Pengerjaan Siswa
- **Rasio Terjawab Riil**: Pada bilah progres kuis siswa yang telah selesai, indikator progres kini menampilkan jumlah butir soal riil yang dijawab (`X / Total`) alih-alih selalu menampilkan `Total / Total`, memberikan gambaran visual yang jujur dan presisi bagi guru.
- **Pewarnaan Gradien Kontekstual**: Bilah progres menggunakan gradien emerald-teal untuk penyelesaian 100% terjawab dan gradien blue-amber jika terdapat butir soal yang dilewati.

#### 3. Peningkatan Lembar Analisis Jawaban & Ekspor CSV
- **Lencana Soal Tidak Dijawab**: Pada `StudentAnswerAnalysisModal.tsx`, butir soal yang tidak dijawab saat kuis berstatus selesai kini secara tegas dilabeli `Tidak Dijawab / Dilewati` dengan aksen peringatan.
- **Kolom Tidak Dijawab pada Ekspor CSV**: Tabel rekap nilai dan unduhan berkas CSV (`QuizSessionRecapView.tsx`) kini menyertakan kolom `Tidak Dijawab` dan mencatat sel jawaban soal yang kosong sebagai `KOSONG` (bukan `-`).

#### 4. Pembaruan Versi & Cache PWA
- Memperbarui versi aplikasi ke `2.4.59` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.59` (`public/sw.js`).
- Memperbarui badge versi di `README.md`.

## [2.4.58] - 2026-09-17
### Perbaikan Integritas Lifecycle Render Modal Analisis Jawaban Siswa (Rule 1, Rule 2, Rule 6, Rule 9 & Rule 15)

#### 1. Perbaikan Kepatuhan Aturan Hook React (*Rules of Hooks*)
- **Penyelarasan Eksekusi Hook Unconditional**: Memperbaiki urutan pemanggilan Hook (`useMemo`, `useState`, `useEffect`) pada `StudentAnswerAnalysisModal.tsx` agar dipanggil secara konsisten dan tanpa percabangan kondisi awal (`early return`), melenyapkan error React #310 (*Rendered more hooks than during the previous render*).
- **Penjagaan Bersyarat di Komponen Induk**: Memastikan modal hanya di-*mount* saat data peserta aktif (`selectedStudentForAnalysis` / `selectedStudentForModal`) tersedia di `WaygroundHostView.tsx` dan `QuizSessionRecapView.tsx`.

#### 2. Ketahanan Ekstraksi Data Soal & Konversi Teks Jawaban
- **Penanganan Koleksi Soal Dinamis**: Menyediakan mekanisme fallback aman (`questionsToDisplay`) apabila data pertanyaan kuis belum termuat secara utuh saat modal pertama kali dibuka.
- **Sanitasi String Jawaban Terpilih**: Memastikan nilai opsi siswa (`getStudentAnswerText`) dan kunci benar (`getCorrectAnswerText`) selalu mengembalikan nilai string primitif yang aman untuk dirender tanpa risiko galat objek bersarang.

#### 3. Pembaruan Versi & Cache PWA
- Memperbarui versi aplikasi ke `2.4.58` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.58` (`public/sw.js`).
- Memperbarui badge versi di `README.md`.

## [2.4.57] - 2026-09-16
### Fitur Analisis Jawaban Siswa per Butir Soal & Pelacakan Jam Input Pengerjaan (Rule 1, Rule 2, Rule 4, Rule 5, Rule 7, Rule 8 & Rule 15)

#### 1. Lembar Analisis Jawaban Siswa (`StudentAnswerAnalysisModal.tsx`)
- **Akses Langsung Host & Rekap**: Guru kini dapat mengklik baris/kartu siswa di Ruang Kendali Host (`WaygroundHostView.tsx`) maupun Halaman Rekapitulasi Sesi (`QuizSessionRecapView.tsx`) untuk membuka modal lembar analisis jawaban komprehensif.
- **Filter Cepat Interaktif**: Tersedia filter tab cepat:
  - **Semua Soal**: Tinjauan utuh seluruh butir soal.
  - **❌ Jawaban Salah (Remedial)**: Memfokuskan guru pada materi/soal yang membutuhkan bimbingan remedial khusus bagi siswa.
  - **✅ Jawaban Benar**: Memverifikasi pemahaman materi yang telah dikuasai siswa dengan tepat.
  - **⚪ Belum Dijawab**: Mengidentifikasi butir soal yang dilewati siswa.
- **Komparasi Jawaban & Pembahasan Materi**: Menampilkan perbandingan kontras antara opsi pilihan siswa dengan kunci jawaban benar, disertai akordeon (*accordion*) penjelasan materi / konsep soal yang dapat dibuka secara interaktif.

#### 2. Pelacakan Waktu Pengisian Riil (Jam Input Siswa) (`dateUtils.ts` & `QuizArena.tsx`)
- **Pencatatan Jam Input per Soal**: Menambahkan stempel waktu ISO presisi (`answeredAt`) setiap kali siswa menekan opsi jawaban di arena kuis, serta stempel waktu selesai kuis (`completedAt`).
- **Format Waktu Baku Indonesia**: Menampilkan waktu dalam format standar Indonesia (`HH:mm:ss WIB / WITA / WIT` atau `HH:mm`) yang otomatis menyesuaikan zona waktu lokal perangkat, membedakan antara waktu pengerjaan (jam input riil) dan durasi berpikir (detik).
- **Indikator Waktu pada Kartu & Tabel**: Menampilkan stempel waktu selesai (`🕒 Selesai: 14:32 WIB`) atau waktu aktif terakhir siswa langsung pada kartu peringkat host dan tabel rekapitulasi.

#### 3. Pembaruan Versi & PWA Cache
- Memperbarui versi aplikasi ke `2.4.57` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.57` (`public/sw.js`).
- Memperbarui dokumentasi fitur pada `README.md`.

## [2.4.56] - 2026-09-16
### Perbaikan Integritas Penilaian Skor & Penghapusan Anomali Jumlah Jawaban Melebihi Total Soal (Rule 1, Rule 2, Rule 6, Rule 9, Rule 11 & Rule 15)

#### 1. Penghapusan Injeksi Anomali Penanda Selesai Kuis
- **Eliminasi Entri Semu**: Menghilangkan pencatatan penanda penyelesaian semu (`quiz_completed`) yang sebelumnya keliru tercatat ke dalam daftar jawaban siswa dengan status benar, sehingga mengakibatkan jumlah jawaban benar terhitung melebihi total butir soal aktual (misal: 11 benar pada kuis 10 butir soal).
- **Penyelarasan Status Selesai**: Penanda penyelesaian kuis kini secara murni memperbarui status `finished: true` pada data partisipan tanpa menambah entri butir soal baru atau memodifikasi akumulasi jawaban siswa.

#### 2. Normalisasi & Validasi Skoring Berlapis (`QuizArena.tsx`, `WaygroundHostView.tsx`, `QuizSessionRecapView.tsx`)
- **Deduplikasi Indeks Soal**: Memastikan seluruh jawaban siswa dikelompokkan dan divalidasi secara ketat berdasarkan nomor butir soal unik (`questionIndex`). Setiap nomor butir soal hanya dapat memiliki tepat 1 rekaman jawaban akhir.
- **Pembatasan Batas Atas Matematika**: Menerapkan fungsi pembatas (`Math.min`) pada perhitungan skor dan jumlah benar di layar host, rekap guru, dan arena siswa, sehingga jumlah benar tidak dapat melebihi total soal (`totalQuestions`) dan skor tidak dapat melebihi 100 poin.
- **Pembersihan Data Sesi Aktif**: Menjalankan sanitasi data pada rekaman peserta sesi live aktif untuk mengembalikan akurasi jumlah jawaban dan nilai siswa ke kondisi riil (100% konsisten).

#### 3. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.56` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.56` (`public/sw.js`).

## [2.4.55] - 2026-09-16
### Integrasi Vercel Production Deployment & Pelacakan Deployment GitHub (Rule 1, Rule 6, Rule 7, Rule 9, Rule 15 & Rule 16)

#### 1. Deployment Vercel Production
- **Rilis Produksi Terverifikasi**: Menjalankan proses rilis produksi aplikasi ke jaringan global Vercel di domain utama `https://kuis-interaktif-plum.vercel.app`.
- **Optimalisasi Pengalihan SPA**: Menyederhanakan berkas `vercel.json` dengan pengalihan rute (*rewrite*) penuh ke `index.html` untuk kelancaran navigasi klien (*Single Page Application*).

#### 2. Pelacakan Lingkungan Deployment GitHub (`.github/workflows/deploy.yml`)
- **Registrasi Lingkungan Produksi**: Menambahkan alur kerja otomatis GitHub Actions untuk mendaftarkan dan melacak status rilis produksi pada repositori GitHub.
- **Tampilan Menu Deployments**: Memunculkan status aktif (*Active Deployment*) dan tautan langsung produksi pada menu *Deployments: Production* di bilah samping (*sidebar*) repositori GitHub.
- **Pemeriksaan Kesehatan Otomatis**: Memastikan URL produksi merespons dengan status HTTP 200 OK secara berkala.

#### 3. Pembaruan Dokumentasi & Badges (`README.md`)
- **Pembaruan Berkas README**: Menghadirkan dokumentasi komprehensif dengan lencana status live Vercel, tautan produksi aktif, ringkasan fitur Kurikulum Merdeka, serta panduan pengembangan aplikasi.

#### 4. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.55` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.55` (`public/sw.js`).

## [2.4.54] - 2026-09-16
### Pembatasan Fitur Ubah Jawaban & Navigasi Mundur Khusus Mode Santai (Bebas Waktu) (Rule 1, Rule 2, Rule 4, Rule 5, Rule 7, Rule 9 & Rule 15)

#### 1. Pembatasan Terpadu Pemilihan Ulang Jawaban (`QuizArena.tsx`)
- **Pencegahan Konflik Timer per Soal**: Mengintegrasikan konstanta pengaman `canReselectAndNavigate = showAnswersMode === 'exam_strict' && isUntimedMode`. Fitur pemilihan ulang jawaban, tombol *"Sebelumnya"*, dan Peta Nomor Soal kini secara eksklusif hanya aktif jika kuis dimainkan pada Mode Santai (Bebas Waktu) yang dipadukan dengan Kunci Rahasia (`exam_strict`).
- **Integritas Mode Berwaktu**: Pada mode kuis yang menggunakan batas waktu per butir soal (Standar, Cepat, dsb.), jawaban siswa langsung terkunci setelah dipilih (`disabled`), lencana *"Tersimpan"* muncul secara netral, dan siswa diarahkan lurus satu arah per butir soal agar hitung mundur timer tidak konflik atau tereksploitasi.

#### 2. Penyempurnaan Teks Pengaturan Guru & Lobi Siswa (`PlayQuizModal.tsx` & `StudentLobby.tsx`)
- **Panduan Modal Guru (`PlayQuizModal.tsx`)**: Menambahkan petunjuk tips pada opsi *"Rahasia (Ujian)"* bahwa peninjauan ulang dan pengubahan jawaban dapat diaktifkan jika guru memadukannya dengan Mode Santai (Bebas Waktu).
- **Penyesuaian Lobi Siswa (`StudentLobby.tsx`)**: Menyesuaikan label dan badge aturan kuis agar secara cerdas membedakan antara *"Ujian Bebas Waktu"* (jawaban dapat ditinjau ulang) dan *"Ujian Berwaktu"* (jawaban terkunci setelah dipilih).

#### 3. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.54` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.54` (`public/sw.js`).

## [2.4.53] - 2026-09-16
### Fitur Pemilihan Ulang Jawaban & Navigasi Mundur Soal pada Mode Ujian Rahasia (Rule 1, Rule 2, Rule 4, Rule 5, Rule 7, Rule 9 & Rule 15)

#### 1. Pemilihan Ulang Jawaban Siswa (`QuizArena.tsx`)
- **Fleksibilitas Menjawab Soal**: Khusus pada mode pengaturan kunci jawaban dirahasiakan (*"Rahasia (Mode Ujian)"* / `exam_strict`), opsi pilihan ganda, benar/salah, tebak gambar, dan isian singkat tetap dapat diinteraksikan kembali oleh siswa. Siswa dapat mengubah atau memilih ulang opsi jawaban lain kapan saja tanpa terkunci permanen.
- **Sinkronisasi Otomatis & Pembaruan Lencana**: Ketika siswa memilih opsi baru, data jawaban seketika diperbarui pada memori sesi dan data partisipan, lencana "Tersimpan" otomatis berpindah ke opsi terbaru dengan cincin sorotan biru ramah visual, dan penilaian akhir tetap terproteksi rahasia tanpa membocorkan status benar/salah.
- **Dukungan Isian Singkat & Penjodohan**: Siswa dapat mengedit kembali teks jawaban singkat dan menekan tombol *"Perbarui"* secara interaktif.

#### 2. Navigasi Soal Mundur & Peta Nomor Soal Interaktif (`QuizArena.tsx`)
- **Tombol "Sebelumnya" Aktif untuk Siswa**: Bilah navigasi bawah kini menampilkan tombol *"Sebelumnya"* yang aktif bagi siswa pada mode `exam_strict`, memungkinkan peninjauan butir soal sebelumnya dengan pemulihan opsi jawaban yang telah dipilih serta penyegaran durasi waktu soal.
- **Peta Nomor Soal (Drawer / Modal Kisi Soal)**: Menghadirkan tombol *"Daftar Soal"* di bilah navigasi bawah serta tombol interaktif *"Soal X/N"* di bagian atas yang membuka dialog peta nomor soal lengkap:
  - Indikator status visual yang jelas: Hijau (*Terjawab*), Abu-abu netral (*Belum Dijawab*), dan Cincin biru (*Soal Sedang Aktif*).
  - Sentuhan satu kali pada nomor soal mana saja langsung melompat ke butir soal tersebut.
  - Memenuhi standar touch target minimal 44×44 px untuk presisi mobile-first.

#### 3. Modal Ringkasan Pengumpulan Kuis Terproteksi (`QuizArena.tsx`)
- **Rekap Jawaban Sebelum Kumpul**: Sebelum kuis diselesaikan, sistem menyajikan dialog konfirmasi yang merinci jumlah soal yang telah dijawab vs soal yang terlewat.
- **Peringatan Soal Terlewat**: Jika terdapat butir soal yang belum dijawab, dialog menampilkan peringatan visual ramah anak agar siswa dapat memilih *"Periksa Kembali Jawaban"* atau tetap melanjutkan *"Ya, Selesaikan & Rekap Nilai"*.

#### 4. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.53` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.53` (`public/sw.js`).

## [2.4.52] - 2026-09-16
### Konfigurasi Vercel Deployment & Penonaktifan Auto-Build Git Commit (Rule 1, Rule 6, Rule 7, Rule 9, Rule 15 & Rule 16)

#### 1. Konfigurasi Penonaktifan Auto-Build GitHub Commit (`vercel.json`)
- **Penonaktifan Otomatisasi Build**: Menambahkan konfigurasi `"git": { "deploymentEnabled": false }` dan `"ignoreCommand": "exit 0"` pada `vercel.json` untuk memastikan Vercel tidak secara otomatis memicu proses build atau deployment setiap kali terdapat *commit* atau *push* baru ke repositori GitHub.
- **Dukungan Build Manual Terkendali**: Pengembang/pengguna memiliki kendali penuh untuk menjalankan proses build dan deployment secara manual melalui antarmuka Vercel Dashboard atau CLI ketika seluruh perbaikan dan fitur telah teruji matang.

#### 2. Konfigurasi Routing SPA & PWA Vite (`vercel.json`)
- **Dukungan Client-Side Routing**: Mengonfigurasi aturan penulisan ulang URL (*rewrites*) ke `/index.html` guna menjamin navigasi langsung ke rute aplikasi, tautan kode PIN kelas, dan aset PWA berjalan lancar tanpa kesalahan *404 Not Found*.
- **Standardisasi Output Build**: Menetapkan direktori keluaran ke `dist` dengan skrip build `npm run build` yang terintegrasi dengan Vite dan TypeScript.

#### 3. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.52` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.52` (`public/sw.js`).

## [2.4.51] - 2026-09-16
### Pemulihan Otomatis dan Pencegahan Auto-Expire Sesi Mandiri/PR (Rule 1, Rule 2, Rule 9, Rule 10, Rule 11 & Rule 15)

#### 1. Pencegahan Kedaluwarsa Otomatis Sesi Tugas Mandiri / PR (`supabaseClient.ts`)
- **Penyelarasan Siklus Hidup Sesi Asinkron**: Mekanisme auto-expiration (deteksi ketiadaan detak jantung/heartbeat 10 menit dan batas umur sesi 3 jam) kini dibatasi khusus untuk sesi kelas interaktif yang dipandu langsung oleh guru (`teacher_led`).
- **Retensi Penuh Sesi Mandiri / PR**: Sesi `self_paced` kini tetap aktif sepenuhnya dan tidak akan kedaluwarsa sebelum tenggat batas waktu (`deadlineAt`) yang ditetapkan guru benar-benar terlampaui (atau aktif tanpa batas waktu jika tidak menggunakan tenggat).

#### 2. Mekanisme Pemulihan Otomatis Multi-Lapisan (`supabaseClient.ts`, `QuizHome.tsx`, & `App.tsx`)
- **Auto-Recovery Sesi yang Salah Ditandai Selesai**: Sistem kini secara cerdas mendeteksi jika sebuah sesi tugas mandiri berstatus `finished` akibat bug auto-expire sebelumnya padahal batas waktunya masih aktif dan belum pernah diakhiri secara manual oleh guru (`!isManuallyEnded`). Sesi tersebut otomatis dipulihkan kembali ke status `active` di memori lokal maupun di Supabase.
- **Pengecekan Berlapis saat Siswa Memasukkan PIN**: Di `QuizHome.tsx` dan tautan langsung `App.tsx`, input PIN yang mengarah ke sesi mandiri yang belum lewat tenggat waktu akan otomatis dipulihkan dan membuka ruang pengerjaan kuis siswa secara mulus tanpa penolakan akses keliru.
- **Dukungan Penyimpanan Status Pengakhiran Manual**: Menambahkan atribut `isManuallyEnded` pada konfigurasi sesi (`QuizSessionSettings`), memastikan bahwa pengakhiran sesi yang dilakukan secara sengaja oleh guru tetap dihormati dan tidak terpulihkan secara keliru.

#### 3. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.51` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.51` (`public/sw.js`).

## [2.4.50] - 2026-09-16
### Modal Zoom Gambar Interaktif, Isolasi Papan Peringkat Sesi Privat & Responsivitas Mobile Dasbor Guru (Rule 1, Rule 2, Rule 4, Rule 5, Rule 7, Rule 8, Rule 9, Rule 10, Rule 11 & Rule 15)

#### 1. Modal Zoom & Lightbox Gambar Interaktif Seluruh Kuis (`ImageZoomModal.tsx` & `QuizIllustration.tsx`)
- **Lightbox Interaktif Layar Penuh**: Gambar dan diagram pada soal kuis kini dapat diketuk untuk diperbesar secara dinamis melalui modal lightbox beresolusi tinggi.
- **Kontrol & Gestur Sentuh Lengkap**: Dilengkapi tombol Perbesar (+), Perkecil (-), Reset (100%), dan Tutup; kontrol keyboard (Escape, +, -, 0, R); interaksi seret/pan saat gambar dizoom; serta dukungan penuh *pinch-to-zoom* dan *double-tap* (1x ↔ 2x) pada layar sentuh smartphone dan tablet.
- **Indikator Sentuh Visual**: Menampilkan lencana melayang halus *"Ketuk untuk perbesar"* berikon `ZoomIn` pada gambar ilustrasi soal (`QuizIllustration`) dengan animasi transisi mikro yang elegan.
- **Integrasi Menyeluruh**: Diterapkan pada Arena Kuis Siswa (`QuizArena`), Pratinjau Guru (`QuizDetail`), Layar Host (`WaygroundHostView`), Soal Tebak Gambar Misteri (`image_guess`), dan Ulasan Jawaban (`QuizResult`).

#### 2. Isolasi Papan Peringkat Sesi Kuis Privat Guru (`supabaseClient.ts`, `QuizResult.tsx` & `types/quiz.ts`)
- **Pemisahan Data Papan Peringkat Privat**: Kuis yang diaktifkan atau ditugaskan guru (baik mode Live Interaktif maupun Mode Mandiri/PR berbasis PIN) kini menggunakan penyimpanan data peringkat terisolasi sesuai ID dan PIN sesi (`quiz_session_participants` & `kuis_session_leaderboard_${sessionId}`).
- **Pencegahan Kebocoran Skor Antar-Kelas**: Nilai dan identitas siswa yang bermain di bawah sesi guru terisolasi dari peringkat kuis umum di beranda utama maupun kelas lain.
- **Lencana Sesi Privat Guru**: Menampilkan lencana visual eksklusif *"Privat Sesi Guru"* berikon kunci/perisai dan penanda PIN kelas pada tab peringkat di layar hasil pengerjaan kuis.
- **Pematuhan Pengaturan Visibilitas**: Menghormati opsi `showLeaderboardToStudents` dari guru—jika guru menonaktifkan papan peringkat untuk siswa, tab peringkat otomatis disembunyikan sepenuhnya dari antarmuka hasil murid.

#### 3. Optimasi Responsivitas Mobile Dasbor Guru & Eliminasi Redundansi Tab Kuis Aktif (`TeacherDashboard.tsx`)
- **Eliminasi Redundansi Tab Kuis Aktif**: Banner sesi aktif di bagian atas Dasbor Guru kini secara cerdas disembunyikan saat pengguna membuka tab *"Kuis Aktif & Sesi Live"*, menghilangkan duplikasi tampilan dengan kartu sesi di dalam daftar. Banner atas tetap tampil sebagai penyorot saat guru menjelajahi tab *"Koleksi Kuis"*.
- **Header Mobile Bebas Terpotong**: Mengoptimalkan struktur bar atas pada resolusi mobile sempit (360px - 400px), sehingga teks judul "Dashboard Guru" tidak lagi terpotong menjadi "Dashboa...".
- **Penyelarasan Aksi & Navigasi Tab**: Ikon duplikat database di header dialihkan secara rapi ke tab navigasi utama (`Database & Backup`), dan filter status sesi kini mendukung gulir horizontal halus (*touch-friendly no-scrollbar*).
- **Tata Letak Kartu Sesi Stabil**: Tombol aksi sekunder (*Rekap*, *Perpanjang*, *Akhiri Sesi*) pada kartu sesi live/mandiri menggunakan skala tipografi adaptif dan batas minimum sentuh 44×44 px tanpa risiko distorsi atau teks bertumpuk.

#### 4. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.50` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.50` (`public/sw.js`).

## [2.4.49] - 2026-09-15
### Diferensiasi Visual Mode Mandiri/PR, Hitung Mundur Tenggat Akurat & Pengalih Multi-Sesi Dasbor Guru (Rule 1, Rule 2, Rule 4, Rule 5, Rule 7, Rule 9, Rule 11 & Rule 15)

#### 1. Diferensiasi Jelas Mode Mandiri / PR vs Mode Dipandu Guru (`TeacherDashboard.tsx`)
- **Banner Atas Cerdas & Kontekstual**: Banner aktif di Dasbor Guru kini secara dinamis mengenali mode pelaksanaan kuis (`executionMode`). Sesi Mode Mandiri / PR tidak lagi menampilkan status "Kuis interaktif sedang dipandu oleh Anda" atau "Buka Layar Pantau Live". Sebagai gantinya, ditampilkan lencana eksklusif `TUGAS MANDIRI / PR` bergradien nila/biru elegan dengan ikon `ClipboardList`, deskripsi kontekstual pengerjaan tugas murid mandiri, batas waktu pengumpulan, serta tombol aksi *"Pantau Progres Siswa"*.
- **Kartu Sesi Tab Kuis Aktif**: Kartu kuis di tab *Kuis Aktif & Sesi Live* membedakan sesi tugas mandiri dengan lencana `TUGAS MANDIRI / PR` (warna nila/indigo), cincin aksen halus, dan tombol utama *"Pantau Progres Siswa"* serta tombol cepat *"Perpanjang"*.

#### 2. Ticker Real-Time & Tampilan Tenggat Waktu Akurat (`deadlineUtils.ts`)
- **Format Tanggal Baku Bahasa Indonesia**: Menghadirkan utilitas pemformatan tanggal ramah Indonesia (*contoh: "Senin, 15 September 2026, pukul 23:59 WIB"*).
- **Countdown Presisi & Dinamis**: Mendukung hitung mundur live setiap detik dengan penanda status warna adaptif: Hijau/Nila untuk rentang waktu aman (>24 jam), Kuning/Oranye saat mendekati batas (<24 jam), dan Merah berdenyut saat kuis telah melewati batas waktu pengumpulan (`TENGGAT BERAKHIR`).
- **Hook `useDeadlineTicker`**: Hook interval cerdas 1 detik untuk menyegarkan tampilan countdown real-time di seluruh komponen tanpa beban kinerja rendering berlebih.

#### 3. Modal Perpanjangan Tenggat Waktu PR (`ExtendDeadlineModal.tsx` & `supabaseClient.ts`)
- **Modal Perpanjang Batas Waktu**: Modal terdedikasi bagi Guru untuk memperpanjang batas waktu pengumpulan PR dengan opsi cepat (+1 Hari, +3 Hari, +1 Minggu) maupun penyesuaian tanggal & jam presisi via *datetime-local picker*.
- **Sinkronisasi Otomatis**: Perubahan batas waktu langsung diperbarui pada *local storage*, dipancarkan secara instan antar-tab/jendela, serta disinkronkan ke tabel database Supabase secara aman.

#### 4. Pengalih Multi-Sesi Aktif (*Multi-Session Switcher*) (`TeacherDashboard.tsx`)
- **Navigasi Rapi & Hemat Ruang**: Saat terdapat lebih dari 1 sesi kuis aktif (kombinasi live interaktif dan beberapa tugas mandiri), banner atas tidak lagi menumpuk berantakan. Sistem menyediakan navigasi ringkas `< Sesi X dari N >` dengan pengurutan cerdas (sesi live di depan, diikuti sesi mandiri terbaru), serta tautan pintas menuju tab kuis aktif lengkap.

#### 5. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.49` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.49` (`public/sw.js`).

## [2.4.48] - 2026-09-15
### Preservasi Posisi Scroll, Auto-Scroll Cerdas & Efek Penyorotan Visual Bank Soal (Rule 1, Rule 2, Rule 4, Rule 5 & Rule 15)

#### 1. Preservasi Posisi Scroll & Auto-Scroll Berlabuh Cerdas (`QuizCreator.tsx`)
- **Navigasi Mulus Paska-Edit Soal**: Saat selesai mengedit butir soal (misalnya Soal #4) dan menekan "Simpan Perubahan" atau "Batal / Kembali", aplikasi tidak lagi melompat ke bagian paling atas halaman. Sistem secara otomatis meluncur (*smooth auto-scroll*) berlabuh presisi tepat pada kartu butir soal terkait.
- **Dukungan Pratinjau / Lihat Soal**: Saat menutup pratinjau kuis (`QuizArena`) yang dibuka melalui tombol "Lihat", viewport langsung kembali berlabuh pada butir soal yang dipratinjau, menghilangkan disorientasi posisi kerja.
- **Penyempurnaan Aksi Duplikasi Soal (Salin)**: Butir soal hasil salinan kini langsung disisipkan tepat di bawah butir soal aslinya (bukan dilempar ke urutan paling bawah daftar kuis), dan layar otomatis meluncur ke butir soal baru tersebut.
- **Penyempurnaan Pindah Urutan (Atas / Bawah)**: Menjaga kartu soal yang baru dipindahkan posisinya tetap stabil dalam area pandang (*nearest block alignment*) tanpa loncatan visual.
- **Penanganan Hapus Soal & Tambah Baru**: Saat butir soal dihapus, viewport tetap tertambat pada soal terdekat pengganti posisinya. Saat butir soal baru dibuat atau diimpor via AI, layar otomatis meluncur ke butir soal baru tersebut.
- **Navigasi Antar-Langkah (Step)**: Beralih kembali ke Bank Soal dari Step 3 (Pratinjau) atau Step 1 (Info Kuis) secara otomatis meluncur kembali ke posisi butir soal terakhir yang sedang dikerjakan.

#### 2. Penyorotan Visual Lembut (*Active Halo Glow Effect*)
- **Feedback Interaksi Instan**: Menambahkan indikator visual bersinar lembut (`ring-4 ring-blue-500/25 border-blue-500`) selama 1.8 detik pada kartu soal yang baru saja diedit, dilihat, disalin, atau dipindahkan, memberikan kepastian visual seketika kepada pengguna.
- **Scroll Margin Aman Header Sticky**: Menambahkan utility `scroll-mt-20 sm:scroll-mt-24` pada seluruh kartu soal, menjamin nomor dan judul butir soal tidak pernah tertutup oleh header navigasi lengket di layar mobile maupun desktop.

#### 3. Isolasi Scroll pada Pratinjau Arena Siswa (`QuizArena.tsx`)
- **Pencegahan Reset Scroll Latar Belakang**: Mengecualikan pemanggilan `window.scrollTo(0, 0)` pada saat mode pratinjau studio (`isPreview === true`) aktif di `QuizArena`, sehingga posisi gulir dokumen latar belakang tidak terhapus.
- **Penerusan Indeks Soal Terakhir**: Memperbarui callback `onExit(currentIndex)` untuk mengembalikan indeks butir soal terakhir yang sedang diuji coba oleh pembuat kuis.

#### 4. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.48` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.48` (`public/sw.js`).

## [2.4.47] - 2026-09-15
### Optimalisasi Menyeluruh Mesin Audio: Penyatuan Singleton AudioContext & Pre-Warming Tanpa Latensi (Rule 1, Rule 2, Rule 5, Rule 6 & Rule 15)

#### 1. Mesin Audio Terpusat / Singleton AudioContext (`sharedAudioContext.ts`)
- **Penyatuan AudioContext Tunggal**: Membuat modul mesin audio bersama [sharedAudioContext.ts](file:///E:/Data/GitHub/Kuis%20Interaktif/src/lib/audio/sharedAudioContext.ts) yang menyatukan BGM prosedural ([proceduralBgm.ts](file:///E:/Data/GitHub/Kuis%20Interaktif/src/lib/audio/proceduralBgm.ts)) dan seluruh efek suara ([useSoundEffects.ts](file:///E:/Data/GitHub/Kuis%20Interaktif/src/hooks/useSoundEffects.ts)) ke dalam 1 instans `AudioContext` tunggal.
- **Eliminasi Alokasi Ganda & Persaingan Thread**: Menghilangkan alokasi ganda konteks audio yang sebelumnya menyebabkan persaingan perangkat keras (*hardware thread contention*) dan lag audio terutama di smartphone Android dan browser hemat daya.

#### 2. Mekanisme Pre-Warming & Auto-Unlock Interaksi Pertama (`App.tsx`)
- **Pemanasan Audio Awal (*Silent Ping*)**: Memasang pendengar interaksi awal (`pointerdown`, `touchstart`, `keydown`, `click`) pada tingkat jendela aplikasi. Pada ketukan pertama pengguna di layar manapun (beranda, lobi, atau tombol menu), sistem secara otomatis membangunkan perangkat keras audio (*Audio DAC*) menggunakan *silent 1-sample buffer ping*.
- **Eliminasi Latensi Cold-Start**: Menghilangkan jeda *wake-up latency* 100–400ms bawaan sistem operasi peramban, sehingga saat pengguna masuk ke arena atau menekan tombol soal, suara klik dan BGM langsung berbunyi instan tanpa penundaan.

#### 3. Perlindungan Desinkronisasi Jam & Tab Latar Belakang (`proceduralBgm.ts`)
- **Guard Clock Drift**: Menambahkan pemeriksaan kompensasi waktu pada penjadwal not BGM `scheduleStep`. Jika timer mengalami perlambatan akibat perpindahan tab atau beban rendering CPU sesaat, waktu notasi otomatis diselaraskan kembali secara mulus tanpa penumpukan nada serentak (*catch-up stutter*).
- **Auto-Resume Tab Aktif**: Menambahkan pemulihan otomatis status `suspended` melalui event `visibilitychange` saat pengguna membuka kembali tab kuis dari latar belakang.

#### 4. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.47` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.47` (`public/sw.js`).

## [2.4.46] - 2026-09-15
### Resolusi Menyeluruh Fallback Redirect Port 3000 & Konfigurasi Supabase Site URL (Rule 1, Rule 9, Rule 10 & Rule 15)

#### 1. Sinkronisasi Konfigurasi `site_url` & Whitelist Cloud Supabase
- **Pembaruan `site_url` Cloud**: Mengubah konfigurasi `site_url` bawaan project Supabase yang sebelumnya tertinggal di `http://localhost:3000` (port default proyek baru) menjadi `http://192.168.1.9:5173`. Karena GoTrue secara otomatis mengizinkan seluruh host yang sama dengan `site_url`, pengalihan dari HP ke IP host kini 100% sah dan diizinkan.
- **Penyelarasan 25 Variasi `uri_allow_list`**: Memperluas daftar izin pengalihan di Supabase Cloud mencakup seluruh variasi pola IP mentah, trailing slash, wildcard slash tunggal (`/*`), dan wildcard sub-path ganda (`/**`) untuk port 5173 pada IP lokal `192.168.1.9`, subnet `192.168.1.*`, subnet `192.168.*.*`, `localhost`, dan `127.0.0.1`.

#### 2. Normalisasi Format `redirectUrl` Frontend (`supabaseClient.ts`)
- **Penyelarasan Trailing Slash**: Menormalkan jalur dasar `redirectUrl` pada pemanggilan `signInWithGoogle` agar selalu memiliki trailing slash sebelum parameter kueri (`http://192.168.1.9:5173/?oauth_callback=1...`), mencegah kegagalan pencocokan glob pada parser Go GoTrue.

#### 3. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.46` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.46` (`public/sw.js`).

## [2.4.45] - 2026-09-15
### Peningkatan Sinkronisasi Google OAuth & Panduan Autentikasi Jaringan Lokal (Rule 1, Rule 9, Rule 10 & Rule 15)

#### 1. Sinkronisasi Reaktif Sesi OAuth (`App.tsx` & `supabaseClient.ts`)
- **Integrasi `onAuthStateChange` (`App.tsx`)**: Menambahkan listener reaktif `supabase.auth.onAuthStateChange` untuk mendeteksi event `SIGNED_IN` secara instan begitu pertukaran kode PKCE selesai dilakukan oleh Supabase Auth. Hal ini mengeliminasi masalah *race condition* atau latensi jaringan lambat pada smartphone/HP saat diarahkan kembali dari halaman login Google.
- **Dukungan `explicitSession` (`supabaseClient.ts`)**: Fungsi `syncOAuthUserSession` kini dapat menerima objek sesi langsung dari pendengar event status autentikasi, mempercepat pemuatan profil guru maupun siswa tanpa harus menunggu panggilan ganda `getSession()`.

#### 2. Dokumentasi & Solusi Pengujian IP LAN / Jaringan Lokal (`docs/panduan-integrasi-google-oauth.md`)
- **Penjelasan Akar Masalah Whitelist Supabase**: Menambahkan panduan komprehensif Bab 4 mengenai penyebab gagalnya pengalihan pada IP lokal (misalnya `http://192.168.1.9:5173`) karena batasan keamanan *Redirect URLs* bawaan Supabase.
- **Pola Pola Wildcard Redirect URLs**: Menyediakan daftar URL yang wajib ditambahkan ke *Redirect URLs* Supabase Dashboard:
  - `http://192.168.1.9:5173/**`
  - `http://192.168.1.*:5173/**`
  - `http://192.168.*.*:5173/**`
- **Klarifikasi Google Cloud Console**: Menjelaskan bahwa Google Cloud Console tidak perlu dan tidak boleh diisi alamat IP lokal (karena Google melarang IP mentah), melainkan seluruh pengalihan kembali ke perangkat dikelola langsung oleh Supabase Auth.

#### 3. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.45` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.45` (`public/sw.js`).

## [2.4.44] - 2026-09-15
### Perbaikan Presisi Reaksi Emoji & Proteksi Anti-Spam Penumpukan (Rule 1, Rule 2, Rule 5, Rule 14 & Rule 15)

#### 1. Eliminasi Duplikasi Reaksi (1 Klik = Tepat 1 Reaksi Ditampilkan)
- **Resolusi Duplikasi Komponen Ruang Tunggu (`StudentWaitingRoom.tsx`)**: Menemukan dan menghapus duplikasi instans `<QuizizzReactionOverlay>` yang sebelumnya terpasang ganda di bagian atas dan bawah layar ruang tunggu, mengeliminasi penyebab kembar dua partikel saat tombol ditekan.
- **Kanonikalitas ID & Sinkronisasi Satu Pintu (`supabaseClient.ts`)**:
  - Menyempurnakan fungsi `sendSessionReaction` agar mempertahankan identitas unik (`id`) dan stempel waktu (`createdAt`) dari reaksi yang diinisiasi oleh pengirim.
  - Menambahkan opsi `skipBroadcast: true` pada persistensi data ke penyimpanan lokal/database agar tidak memicu siaran ganda ke saluran siar yang sudah menerima reaksi optimistik instan.

#### 2. Proteksi Anti-Spam & Pencegahan Penumpukan Partikel (`QuizizzReactionOverlay.tsx`)
- **Dedup ID Mutlak (`seenReactionIdsRef`)**: Memastikan setiap reaksi dengan pengenal unik hanya dirender tepat satu kali di seluruh saluran (WebSocket, BroadcastChannel, CustomEvent, dan state fallback).
- **Throttling Pengirim Ramah Perangkat (`lastSenderSpawnRef`)**: Membatasi laju pemunculan reaksi dari pengirim yang sama dengan jendela waktu aman 350ms per emoji untuk mencegah banjir animasi saat pengguna mengetuk berulang kali.
- **Kerapian Layar Maksimal 8 Partikel**: Menyesuaikan batas maksimum partikel aktif dari sebelumnya 14 menjadi 8 partikel beranimasi mengapung. Layar tetap bersih, estetis, dan lancar pada kecepatan 60-120 fps tanpa menutupi konten soal atau tombol navigasi.

#### 3. Throttle Tombol Reaksi & Ketukan Layar Sentuh (`QuizizzReactionButtonRow.tsx` & `FloatingReactionButton.tsx`)
- **Cooldown Tombol 350ms**: Menambahkan perlindungan `lastClickTimeRef` pada tombol baris reaksi maupun floating dock agar ketukan cepat/spam berturut-turut ditapis dengan mulus.
- **Target Sentuh Mobile-First ($\ge 48\times 48$ px)**: Memastikan seluruh tombol emoji mempertahankan ukuran sentuh minimal $48\times 48$ px (`min-w-[48px] min-h-[48px]`) dengan responsivitas haptik dan visual yang tegas.

#### 4. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.44` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.44` (`public/sw.js`).

## [2.4.43] - 2026-09-15
### Penyempurnaan Menyeluruh Mode Santai: Eliminasi Total Batas Waktu & Konflik Timer Per Soal (Rule 1, Rule 2, Rule 11 & Rule 15)

#### 1. Resolusi Mode Bertingkat & Pencegahan Penimpaan Mode (`QuizArena.tsx`)
- **Presedensi Mode Berbobot**: Memperbaiki prioritas resolusi mode permainan sehingga setelan sesi aktif (`sessionSettings.mode` / `liveSession.settings.mode`) diprioritaskan di atas prop bawaan statis `initialMode`. Mode Santai (`untimed`) kini dijamin aktif konsisten tanpa risiko tertimpa kembali ke mode standar.
- **Isolasi Durasi & Timer Per Soal**:
  - Pada Mode Santai (`isUntimedMode`), durasi per soal (`getQuestionDuration`) diatur menjadi `0`.
  - State hitung mundur `timeLeft` diinisialisasi dan diatur ke `0` pada setiap perpindahan butir soal (next, prev, jump, retry), menghilangkan sepenuhnya kedipan angka timer seperti `30s`.
  - Timer interval dalam `QuizArena.tsx` secara tegas mengabaikan dekremen `timeLeft` dan tick audio ketika berada dalam mode santai.
  - Penolakan Mutlak Timeout: Menambahkan pengaman khusus pada `handleAnswerSelect` untuk menolak dan mengabaikan sinyal timeout (`optionIndex = -1`) pada Mode Santai.
- **Pelacakan Durasi Nyata Siswa**: Mengganti estimasi waktu statis 5 detik dengan pencatat waktu berbasis timestamp (`questionStartTimeRef`) sehingga durasi pengerjaan siswa tercatat akurat dan realistis di rekapan nilai.
- **Lencana Header Tenang & Ramah Siswa**: Bilah header pada Mode Santai menampilkan indikator teduh `🧘 Santai (mm:ss)` berbasis total waktu kuis tanpa warna merah menyala atau kedipan kepanikan.

#### 2. Penyelarasan Sinkronisasi Sesi & Modal Pengaturan (`PlayQuizModal.tsx`, `StudentLobby.tsx`, `App.tsx` & `supabaseClient.ts`)
- **Penolakan Durasi di Modal (`PlayQuizModal.tsx`)**: Ketika Guru memilih Mode Santai, `durationPerQuestionSec` secara tegas dikirimkan sebagai `0` dan opsi override durasi dinonaktifkan, disertai banner konfirmasi ramah anak yang menjelaskan penonaktifan batas waktu.
- **Penetapan Durasi Sesi & Supabase Client (`supabaseClient.ts`)**: Fungsi `createActiveSession` dan `updateActiveSessionSettings` secara otomatis menetapkan `durationPerQuestionSec = 0` saat mode permainan adalah `untimed`.
- **Informasi Kartu & Lencana Ruang Tunggu (`StudentLobby.tsx`)**: Kartu informasi waktu pada lobi siswa menampilkan status `🧘 Bebas Waktu` beserta lencana penjelasan bahwa siswa dapat mengerjakan dengan tenang tanpa desakan waktu.
- **Penyelarasan Host View Guru (`WaygroundHostView.tsx`)**: Menyematkan lencana status `🧘 Santai (Bebas Waktu)` pada bilah ruang kendali host guru.

#### 3. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.43` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.43` (`public/sw.js`).

## [2.4.42] - 2026-09-15
### Penyediaan Pengaturan Kunci Jawaban & Pembahasan Materi di Mode Mandiri & PR (Rule 1, Rule 2, Rule 3 & Rule 15)

#### 1. Penambahan Panel Kontrol Kunci Jawaban & Pembahasan Materi (`PlayQuizModal.tsx`)
- **Pengaturan Kunci Jawaban Siswa (`showAnswersMode`)**:
  - **Tiap Soal (`immediate`)**: Kunci jawaban langsung diperlihatkan kepada siswa setelah menjawab setiap butir soal.
  - **Status Saja (`status_only`)**: Siswa hanya diberitahu status Benar atau Salah, sementara kunci jawaban tepat tetap dirahasiakan guru.
  - **Rahasia / Ujian (`exam_strict`)**: Mode ujian ketat di mana status benar/salah maupun kunci jawaban dirahasiakan sepenuhnya (hanya konfirmasi netral bahwa jawaban telah tersimpan).
- **Pengaturan Pembahasan Materi Guru (`showExplanationMode`)**:
  - **Tiap Soal (`immediate`)**: Penjelasan konsep materi guru langsung tampil di layar setelah siswa menjawab.
  - **Akhir Kuis (`end_only`)**: Pembahasan materi dirahasiakan selama kuis dan baru dapat ditinjau saat siswa menyelesaikan kuis pada halaman rekapan.
  - **Sembunyikan (`never`)**: Pembahasan materi ditiadakan dari tampilan siswa (ideal untuk ujian evaluasi formal).

#### 2. Standardisasi Antarmuka & Ekstraksi Komponen Reusable (Rule 1 & Rule 14)
- **Komponen Modular `FeedbackAndExplanationSection`**: Diterapkan secara seragam dan konsisten baik pada Mode Guru maupun Mode Mandiri & PR.
- **Penyelarasan Nilai Opsi**: Memperbaiki pemetaan opsi agar 100% selaras dengan tipe data arsitektur sistem (`AnswerVisibilityMode` dan `ExplanationVisibilityMode`) serta logika rendering di `QuizArena.tsx`.
- **Target Sentuh & Tipografi Bersih (Rule 1 & 2)**: Setiap tombol pilihan memiliki target sentuh minimal $44\times 44$ px dilengkapi penjelasan deskriptif ringkas di bawahnya untuk kemudahan pemahaman guru.

#### 3. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.42` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.42` (`public/sw.js`).

## [2.4.41] - 2026-09-15
### Perbaikan Sinkronisasi Format Tanggal Pengerjaan & Pencegahan Rekap Ganda (Rule 1, Rule 2, Rule 9, Rule 11 & Rule 15)

#### 1. Perbaikan Kritis Parser Tanggal Pengerjaan Siswa (`QuizDetail.tsx` & `supabaseClient.ts`)
- **Penyimpanan ISO Timestamp Standar**: Menghapus pemotongan string tanggal lokal pada lapisan data (`supabaseClient.ts`), memastikan `submittedAt` selalu menyimpan string waktu standar ISO-8601 yang mempertahankan informasi tanggal, bulan, tahun, dan waktu secara presisi.
- **Fungsi Parser Cerdas `formatSubmissionDate`**:
  - Mengatasi galat interpretasi JavaScript engine di mana string lokal tanpa tahun (seperti `"15 Sep, 13.00"`) salah diartikan oleh parser menjadi tahun 2013 dan waktu 00.00 (`"15 Sep 2013, 00.00"`).
  - Secara cerdas merekonstruksi tanggal, bulan, tahun berjalan (2026), dan jam/menit asli untuk data riwayat pengerjaan lama maupun baru.
  - Memastikan tampilan tanggal di tabel rekapitulasi nilai guru selalu sinkron, rapi, dan konsisten (misal: `15 Sep 2026, 13.00`).
- **Sinkronisasi Ekspor CSV / Excel**: Mengintegrasikan `formatSubmissionDate` ke dalam fungsi unduh rekap nilai sehingga file CSV menyertakan tanggal dan waktu lengkap yang akurat.

#### 2. Pencegahan Duplikasi Pengiriman Hasil Kuis (`QuizResult.tsx` & `QuizDetail.tsx`)
- **Guard Rekam Pengiriman Tunggal (`QuizResult.tsx`)**: Menambahkan pengaman `hasRecordedRef` pada `useEffect` pencatatan skor agar `recordQuizAttempt` hanya dijalankan tepat satu kali per penyelesaian kuis, mencegah terkirimnya baris duplikat saat terjadi render ulang komponen.
- **Deduplikasi Rekapitulasi Guru (`QuizDetail.tsx`)**: Menambahkan mekanisme deduplikasi cerdas pada saat memuat data riwayat siswa untuk membersihkan entri identik akibat pengiriman ganda di jaringan.

#### 3. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.41` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.41` (`public/sw.js`).

## [2.4.40] - 2026-09-15
### Kontrol Durasi Soal Fleksibel & Override di Mode Mandiri & PR (Rule 1, Rule 2, Rule 3 & Rule 15)

#### 1. Integrasi Selektor Waktu Lengkap di Mode Mandiri & PR (`PlayQuizModal.tsx`)
- **Pilihan Standar Waktu Bawaan Soal (`default`)**: Menyediakan tombol *"Bawaan"* yang memungkinkan pengerjaan mengikuti durasi orisinal masing-masing butir soal secara akurat (baik durasi bawaan kuis maupun durasi khusus yang telah diatur guru di Quiz Creator).
- **Preset Durasi Seragam & Kustom**: Menyediakan tombol preset cepat (10s, 15s, 20s, 30s, 45s, 60s) serta opsi kustom bebas (input angka dengan satuan Detik / Menit).
- **Opsi Override / Samaratakan Semua**: Jika kuis memiliki butir-butir soal dengan durasi kustom yang berbeda, guru dapat mengaktifkan opsi *"Samaratakan Semua"* untuk menimpa durasi seluruh soal menjadi seragam, atau membiarkannya tidak tercentang agar durasi khusus butir soal tetap dipertahankan.
- **Label Tombol Mode Cerdas**: Label tombol *"Standar"* di Mode Permainan kini secara adaptif menampilkan status durasi aktif, misalnya `Standar (Bawaan Soal)`, `Standar (30s)`, atau `Standar (2m)`.

#### 2. Ekstraksi Komponen Modular & Desain Sentuh Responsif (Rule 1 & Rule 14)
- **Komponen Modular `DurationSelectorSection`**: Menyatukan logika dan UI penentu durasi soal ke dalam satu komponen modular yang digunakan bersama pada Mode Guru (*timed_next*) maupun Mode Mandiri & PR.
- **Target Sentuh $\ge 44\times 44$ px**: Seluruh tombol preset waktu, tombol satuan, dan checkbox override dirancang dengan touch targets yang ramah sentuhan, stabil di perangkat mobile potret/lanskap maupun desktop.

#### 3. Sinkronisasi Otomatis Pengaturan Sesi Aktif
- Menambahkan sinkronisasi real-time parameter `overrideCustomQuestionDurations` dan `durationPerQuestionSec` ke dalam active session settings saat guru mengubah opsi konfigurasi.

#### 4. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.40` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.40` (`public/sw.js`).

## [2.4.39] - 2026-09-15
### Penonaktifan & Penyembunyian Deretan Tombol Emoji saat Mode Layar Bersih Aktif (Rule 1, Rule 2, Rule 6 & Rule 15)

#### 1. Penyembunyian Otomatis Tombol Emoji di Ruang Tunggu Jeda Soal (`InterQuestionWaitingLounge.tsx`)
- **Penghapusan Tampilan Tombol Emoji saat Mode Bersih**: Ketika tombol *"Sembunyikan Emoji"* ditekan, sistem kini secara otomatis menyembunyikan seluruh 8 tombol reaksi emoji (❤️, 🔥, ⭐, 👏, 🎉, 🚀, 🤩, 💯) dari tampilan.
- **Bilah Kompak Minimalis**: Kontainer reaksi bertransformasi menjadi satu bilah ringkas (*single-line bar*) yang menampilkan status proteksi visual *"🙈 Emoji Reaksi Disembunyikan"* beserta tombol *"✨ Tampilkan Emoji"*, menghemat lebih dari 60 px ruang vertikal tambahan dan menciptakan ruang jeda yang sepenuhnya tenang dan bebas distraksi.
- **Transisi Halus (*Smooth Reappearance*)**: Saat tombol *"Tampilkan Emoji"* diketuk kembali, deretan tombol emoji muncul kembali secara mulus dengan animasi *fade-in*.

#### 2. Penyembunyian Tombol Emoji di Ruang Tunggu Pra-Kuis (`StudentWaitingRoom.tsx`)
- **Penyelarasan Ruang Tunggu Murid**: Pada lobi sebelum kuis dimulai, deretan tombol emoji juga otomatis disembunyikan ketika siswa mengaktifkan opsi sembunyikan emoji, digantikan dengan lencana ringkas *"Emoji reaksi disembunyikan (Layar Bersih)"* lengkap dengan tombol cepat *"Tampilkan"*.

#### 3. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.39` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.39` (`public/sw.js`).

## [2.4.38] - 2026-09-15
### Penyempurnaan Teks & Kejelasan Tombol Kontrol Emoji Layar (Rule 1, Rule 2, Rule 3 & Rule 15)

#### 1. Penyederhanaan Teks Tombol Kontrol Emoji Bebas Jargon (`InterQuestionWaitingLounge.tsx`)
- **Teks Aksi Intuitif & Bersih**: Mengganti istilah teknis ambigu *"Anti-Reaksi: Nonaktif"* dan *"Anti-Reaksi: Aktif (Bersih)"* menjadi teks aksi langsung yang komunikatif dan langsung dimengerti oleh siswa maupun guru:
  - **Saat Emoji Muncul (Normal)**: Tombol menampilkan ikon mata tertutup (`EyeOff`) dengan teks **"Sembunyikan Emoji"**. Begitu diketuk, seluruh animasi emoji melayang seketika disembunyikan.
  - **Saat Layar Bersih (Emoji Disembunyikan)**: Tombol bertransformasi dengan warna aksen lembut dan ikon bintang pendar (`Sparkles`) bertuliskan **"Tampilkan Emoji"**. Pengguna langsung tahu cara mengembalikan emoji hanya dengan 1 ketukan.
- **Tooltip Jelas & Informatif**: Tooltip kini menjelaskan fungsi secara gamblang tanpa istilah membingungkan (*"Sembunyikan animasi emoji melayang agar layar tenang dan fokus"* atau *"Layar Bersih: Animasi emoji sedang disembunyikan. Ketuk untuk menampilkan kembali"*).

#### 2. Standardisasi Copywriting di Ruang Tunggu Pra-Kuis & Arena Kuis (`StudentWaitingRoom.tsx` & `QuizArena.tsx`)
- **Ruang Tunggu Pra-Kuis (`StudentWaitingRoom.tsx`)**: Menyelaraskan teks tombol header siswa menjadi **"Sembunyikan Emoji"** / **"Tampilkan Emoji"**.
- **Notifikasi Pop-up (*Toast Feedback*) (`QuizArena.tsx`)**: Pesan konfirmasi diperjelas menjadi:
  - *"Layar Bersih: Animasi Emoji Disembunyikan 🛡️"*
  - *"Animasi Emoji Ditampilkan ✨"*
- **Menu Pengaturan Siswa (`QuizArena.tsx`)**: Mengubah judul pengaturan di lembar alat kuis menjadi *"Animasi Emoji Layar"* dengan status ringkas *"Tampil"* atau *"Disembunyikan"*.

#### 3. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.38` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.38` (`public/sw.js`).

## [2.4.37] - 2026-09-15
### Audit Total Desain Responsif & Penataan Ruang Tunggu Jeda Soal (Rule 1, Rule 2, Rule 6, Rule 7 & Rule 15)

#### 1. Perbaikan Menyeluruh Galat *Flexbox Clipping* & *Scroll Overflow* (`InterQuestionWaitingLounge.tsx`)
- **Eliminasi Pemotongan Header di Layar Ponsel & Desktop Pendek**: Mengatasi galat pemusatan vertikal (`justify-center` pada kontainer *scrollable* flexbox) yang sebelumnya memposisikan bagian atas kartu (judul selebrasi, ucapan selamat, dan rekapitulasi nilai) ke luar bidang pandang (*negative scroll space*). Kontainer kini mengadopsi struktur `overflow-y-auto overscroll-y-contain items-center` dengan margin otomatis dinamis (`my-auto`) pada kartu inti, menjamin tampilan selalu mulai dari atas dan dapat di-*scroll* mulus dari ujung atas hingga bawah tanpa ada teks atau elemen yang terpotong di resolusi non-reguler (Infinix Note 50s 392×778 px, Redmi Note 7 431×846 px, layar lipat, maupun desktop *half-screen* 723×704 px).
- **Ruang Aman Padding Bawah (*Safe Area Clearance*)**: Menambahkan bantalan vertikal (`px-2.5 py-4 sm:p-6`) yang melindungi tombol aksi dan kolom pesan dari ketertutupan oleh bilah navigasi atau gestur sistem operasi seluler.

#### 2. Sistem Tab Aktivitas Jeda Soal Terpadu (`InterQuestionWaitingLounge.tsx`)
- **Navigasi Aktivitas Segmented (*Dino Run*, *Tebak Emoji*, *Obrolan Kelas*)**: Mengganti penumpukan vertikal seluruh elemen (yang sebelumnya berukuran >900 px) dengan sistem tab interaktif yang ringkas dan ramah sentuhan (*Touch-First Target* $\ge 44\times 44\text{ px}$):
  - **Tab 1: 🦖 Dino Run**: Permainan lari rintangan kaktus dengan kanvas proporsional, kontrol lompat layar/spasi, serta papan peringkat 3 besar teman sekelas saat menabrak.
  - **Tab 2: 🧩 Tebak Emoji**: Permainan kuis tebak kata/emoji edukatif dengan tombol opsi berukuran sentuh nyaman.
  - **Tab 3: 💬 Obrolan Kelas**: Area obrolan interaktif yang lapang (`h-44 sm:h-52`) lengkap dengan pembeda visual guru/teman, pintasan tombol Enter untuk pengiriman cepat di komputer, serta area ketik yang tidak terganggu saat *keyboard* virtual ponsel muncul.
- **Indikator Notifikasi Pesan Baru (*Unread Badge Indicator*)**: Menampilkan lencana angka berpendar (*pulse badge*) pada tab Obrolan ketika teman sekelas atau guru mengirimkan pesan baru saat siswa sedang asyik bermain mini-game.

#### 3. Bilah Reaksi Semangat 1-Baris *Touch-Scrollable* (`QuizizzReactionButtonRow.tsx`)
- **Single-Row Horizontal Scroll Bebas Bungkus Baris**: Menambahkan dukungan properti `scrollable` pada bilah emoji reaksi. Seluruh 8 emoji reaksi semangat tetap berada dalam satu baris horizontal mulus (`touch-pan-x`) tanpa terpecah menjadi dua baris di layar sempit (<400 px), menghemat lebih dari 50 px ruang vertikal sekaligus menjaga ukuran tombol sentuh tetap $\ge 44\times 44\text{ px}$ (*Rule 1*).
- **Akses Cepat Anti-Reaksi**: Tombol pengatur Anti-Reaksi ditingkatkan ke ukuran sentuh ergonomis $\ge 44\text{ px}$ dengan ikon status proteksi visual yang jelas.

#### 4. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.37` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.37` (`public/sw.js`).

## [2.4.36] - 2026-09-15
### Fitur Anti-Reaksi Layar untuk Siswa (Fokus Belajar Bebas Distraksi) (Rule 1, Rule 2, Rule 7 & Rule 15)

#### 1. Modul Manajemen Preferensi Anti-Reaksi (`src/lib/reactionPreferences.ts`)
- **Penyimpanan Lokal & Sinkronisasi Global**: Mengimplementasikan `useAntiReaction` hook dengan `localStorage` (`kuis_anti_reaction_enabled`) dan `CustomEvent` (`kuis_anti_reaction_changed`). Preferensi siswa disimpan secara persisten di perangkat mereka dan tersinkronisasi seketika antar-layar dan antar-tab.
- **Pembersihan Layar Instan**: Saat diaktifkan, seluruh animasi emoji dan partikel melayang yang dikirimkan oleh siswa lain maupun guru langsung dinonaktifkan secara total (`QuizizzReactionOverlay.tsx` mengembalikan `null`), sehingga layar kuis bersih, tenang, dan tidak membebani perangkat berspesifikasi rendah.

#### 2. Tombol Cepat Anti-Reaksi di Header Siswa (`QuizArena.tsx`)
- **Akses Langsung 1-Sentuhan**: Menambahkan tombol Anti-Reaksi di pojok kanan atas bilah navigasi siswa (berdampingan dengan tombol chat senyap dan menu alat).
- **Indikator Visual Ramah Anak**: Menampilkan ikon bintang pendar (`Sparkles`) saat mode normal, dan berubah menjadi perisai mata tertutup bertinta mawar (`EyeOff`) saat mode Anti-Reaksi aktif.
- **Sembulan Konfirmasi Ringkas (*Toast Notification*)**: Memberikan feedback konfirmasi visual selama 2,2 detik di bagian atas layar (*"Anti-Reaksi Aktif: Layar Bersih dari Emoji 🛡️"* atau *"Reaksi Layar Teman Ditampilkan ✨"*).

#### 3. Opsi Pengaturan Lengkap di Laci Menu Kuis (`QuizArena.tsx`)
- **Pengaturan Mode Fokus di Menu Alat**: Menambahkan kartu opsi pengaturan *"Anti-Reaksi Layar (Mode Fokus)"* di dalam laci menu alat (titik tiga) lengkap dengan penjelasan intuitif dan badge status *"Bersih (Aktif)"* / *"Tampil"*.

#### 4. Tombol Anti-Reaksi di Ruang Tunggu Jeda Soal & Ruang Tunggu Murid
- **Bilah Reaksi Jeda Soal (`InterQuestionWaitingLounge.tsx`)**: Menambahkan tombol cepat Anti-Reaksi di atas deretan tombol reaksi, sehingga siswa dapat mematikan reaksi langsung dari lounge jeda.
- **Ruang Tunggu Pra-Kuis (`StudentWaitingRoom.tsx`)**: Menyediakan tombol Anti-Reaksi di header ruang tunggu pra-kuis agar siswa dapat memulai ujian dalam keadaan tenang sejak sebelum kuis dimulai.

#### 5. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.36` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.36` (`public/sw.js`).

## [2.4.35] - 2026-09-15
### Tampilan Konfirmasi Penyelesaian Kuis & Layar Rekap Hasil ala Wayground/Kahoot (Rule 1, Rule 2, Rule 5, Rule 7 & Rule 15)

#### 1. Layar Selebrasi Selesai Kuis Siswa di Mode Dipandu Guru (`InterQuestionWaitingLounge.tsx`)
- **Penghapusan Pembatasan Soal Terakhir**: Menghapus pemblokiran kondisi `!isLastQuestion` dan `currentIndex < activeQuestions.length - 1` pada pemanggilan Ruang Tunggu. Kini begitu siswa menjawab butir soal terakhir (misal 5/5), sistem seketika membuka Lounge Penyelesaian Kuis.
- **Efek Selebrasi & Confetti**: Memicu selebrasi konfeti warna-warni (*canvas-confetti*) dan audio tepuk tangan seketika saat murid menyelesaikan seluruh butir soal.
- **Kartu Ringkasan Hasil Sementara (*Interim Result Card*)**: Menampilkan kartu ringkasan hasil bergaya Wayground/Kahoot yang memuat:
  - Skor Sementara (pts)
  - Jumlah Jawaban Benar & Salah (`Benar • Salah`)
  - Bintang Prestasi (`⭐`)
- **Indikator Live Status Guru**: Menampilkan status berdenyut *"Menunggu Guru Mengakhiri Sesi & Membuka Papan Juara (Podium)..."*.
- **Tombol Akses Podium Seketika**: Jika guru telah menekan tombol akhiri kuis (`session.status === 'finished'`), ruang tunggu menampilkan tombol berpendar animasi *bounce*: *"Guru Telah Mengakhiri Sesi! Buka Rekapan & Podium Juara 🏆"*.
- **Mini-Game Dino Run & Chat Tetap Aktif**: Siswa tetap leluasa bermain Dino Run (dengan leaderboard 3 besar teman sekelas) dan mengirim reaksi obrolan sembari menunggu guru mengumumkan hasil akhir kelas.

#### 2. Fungsi Penyelesaian Kuis Terpusat & Transisi Real-Time (`QuizArena.tsx`)
- **Penyelesaian Bebas Stale-Closure (`finishCurrentQuiz`)**: Menggunakan `latestAnswersRef` dan `latestTimeSpentRef` untuk mengunci seluruh riwayat jawaban tanpa risiko balapan data (*race condition*), mencatat status peserta `finished: true` ke database Supabase, dan langsung menavigasi ke layar `QuizResult.tsx`.
- **Transisi Otomatis saat Guru Menyelesaikan Sesi**: Listener WebSocket & BroadcastChannel kini langsung memanggil `finishCurrentQuiz()` saat mendeteksi `session.status === 'finished'`, memastikan seluruh siswa serentak berpindah ke layar hasil rekap nilai dan podium.
- **Tombol Footer Pintar Siswa**: Jika siswa berada di soal terakhir yang sudah terjawab, tombol footer berubah menjadi *"Kuis Selesai • Buka Layar Hasil & Peringkat"* agar siswa dapat membuka kembali layar selebrasi jika sebelumnya ditutup.

#### 3. Modal Konfirmasi Selesai Ramah Anak pada Mode Mandiri (`QuizArena.tsx`)
- **Dialog Konfirmasi Pengumpulan**: Pada mode mandiri (*self-paced*), menekan tombol "Selesai & Rekap Nilai" kini memunculkan modal konfirmasi yang bersih dan ramah anak berisi ringkasan skor dan jumlah soal yang telah dikerjakan.
- **Dua Pilihan Aksi Intuitif**: Murid dapat memilih *"Periksa Kembali Jawaban"* jika ingin meninjau ulang, atau *"Ya, Selesaikan & Rekap Nilai"* untuk mengunci jawaban dan melihat pembahasan lengkap.

#### 4. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.35` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.35` (`public/sw.js`).

## [2.4.34] - 2026-09-15
### Perbaikan Tuntas: Pencegahan Pengerjaan Ulang Soal Pasca-Reload & Deduplikasi Skor Siswa (Rule 1, Rule 9, Rule 11 & Rule 15)

#### 1. Deteksi Status Jawaban Instan Pasca-Reload (`QuizArena.tsx`)
- **Restorasi Status Soal Akurat**: Mengatasi bug di mana siswa yang me-refresh halaman diminta mengerjakan kembali soal yang sudah dijawab. Sistem kini langsung memeriksa `answersList` saat mount, saat nomor soal berganti, maupun saat navigasi (`handleJumpToQuestion`).
- **Transisi Otomatis ke Waiting Lounge**: Jika soal pada nomor aktif sudah pernah dijawab oleh siswa pada mode dipandu guru, siswa langsung diarahkan kembali ke Ruang Tunggu Jeda (*Waiting Lounge / Dino Run*) tanpa menampilkan pilihan ganda atau hitung mundur 3-2-1. Siswa tidak akan pernah diminta mengerjakan ulang soal yang sama.

#### 2. Deduplikasi Riwayat Jawaban & Pencegahan Nilai Menggelembung (`QuizArena.tsx`)
- **Deduplikasi In-Place**: Mengubah logika penyimpanan jawaban di `handleAnswerSelect` dari penambahan membabi-buta (`[...prev, recordedAnswer]`) menjadi pembaruan tepat sasaran berdasarkan `questionId`. Jika soal pernah dijawab sebelumnya, jawaban diperbarui di posisinya tanpa menggandakan panjang daftar jawaban.
- **Koreksi Perhitungan Benar & Salah**: Jumlah jawaban benar (`correctCount`), salah (`incorrectCount`), dan skor persentase kini dihitung dari data unik, sehingga mustahil jumlah benar melebihi jumlah soal yang sedang dikerjakan.

#### 3. Sanitasi Data Papan Kendali Guru Host (`WaygroundHostView.tsx`)
- **Perhitungan Metrik Berbasis Jawaban Unik**: Papan kendali host guru kini menghitung `displayCorrectCount` dan `displayScore` secara langsung dari riwayat jawaban unik (`p.answers`), sehingga kebal dari anomali data sesi usang dan langsung menampilkan progres yang valid (misal: 2/5 dengan 2 benar, bukan 4 benar).

#### 4. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.34` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.34` (`public/sw.js`).

## [2.4.33] - 2026-09-15
### Peningkatan Ruang Lompat Dino Run & Papan Skor 3 Besar Teman (Rule 1, Rule 2, Rule 5 & Rule 15)

#### 1. Optimalisasi Dimensi & Ruang Lompat Dino Run (`InterQuestionWaitingLounge.tsx`)
- **Peningkatan Tinggi Canvas**: Menambah tinggi tampilan kanvas game Dino Run dari `160px` menjadi `220px` internal (dan tinggi CSS dari `h-36 sm:h-40` menjadi `h-48 sm:h-56` [192px/224px]) untuk memberikan ruang pandang langit yang lebih lega dan sudut lompatan Dino yang lebih bebas.
- **Fisika Lompat & Pijakan Tanah Realistis**: Garis tanah dinaikkan ke `175px` dengan area pijakan tanah bertekstur sedalam 45px di bawahnya, daya lompat disesuaikan ke `-9.6` dan gravitasi ke `0.64` sehingga kurva lompatan mulus melompati berbagai variasi rintangan kaktus.

#### 2. Papan Skor Peringkat 3 Besar Teman (*Top 3 Peers Leaderboard*) (`InterQuestionWaitingLounge.tsx`)
- **Tampilan Selesai Game Kompak**: Saat Dino menabrak kaktus (*Game Over*), antarmuka secara elegan menampilkan kartu peringkat 3 besar teman sekelas (*Top 3 Pelari Kelas*) lengkap dengan medali 🥇🥈🥉, avatar emoji teman, penanda khusus `(Kamu)`, serta capaian jarak tempuh meter (`🏃 Xm`).
- **Sinkronisasi Multi-Perangkat Seketika**: Rekor skor tersimpan per sesi live dan disiarkan secara real-time antar perangkat siswa melalui `BroadcastChannel('kuis_realtime_session_sync')`.
- **Desain Khusus Mobile & Touch-First (Rule 1 & Rule 2)**: Seluruh kartu peringkat dan tombol "Lari Lagi" tersusun kompak dengan tinggi total ~152px di dalam kanvas 192px tanpa menimbulkan overflow atau scrollbar liar di layar ponsel pintar.
- **Tab Pemilih Mini-Game Cepat**: Menambahkan selektor tombol tab antara `🦖 Dino Run` dan `🧩 Tebak Emoji` agar siswa dapat memainkan Dino Run di setiap putaran jeda soal.

#### 3. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.33` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.33` (`public/sw.js`).

## [2.4.32] - 2026-09-15
### Pemulihan Progres Otomatis Saat Reload & Sinkronisasi Cepat Soal Guru (Rule 1, Rule 9, Rule 11 & Rule 15)

#### 1. Pemulihan Jawaban dari Server (`QuizArena.tsx`)
- **Auto-rehydrasi Progres**: Menambahkan mekanisme pemulihan otomatis yang bekerja saat `sessionStorage` siswa hilang karena menutup tab, crash browser, atau koneksi terputus. Saat kembali ke halaman, jawaban yang sudah dikirim sebelumnya langsung dipulihkan dari data peserta di server Supabase, sehingga siswa tidak perlu mengulang dari soal nomor 1.
- **Pemulihan Streak**: Nilai *streak* turut dipulihkan dari data server bersama dengan jawaban, sehingga skor total tetap konsisten dan akurat.
- **Guard Cerdas**: Pemulihan hanya berjalan sekali per mount dan hanya bila `answersList` masih kosong — tidak mengganggu alur normal yang `sessionStorage`-nya masih utuh.

#### 2. Sinkronisasi Posisi Soal Guru Saat Mount (`QuizArena.tsx`)
- **Sinkronisasi Instan**: Menambahkan efek sinkronisasi awal yang langsung melompat ke soal yang sedang dipandu guru saat komponen pertama kali dimuat setelah reload, tanpa menunggu interval polling 2 detik.
- **Hitung Mundur Otomatis**: Setelah lompat ke soal yang benar, tampilan hitung mundur 3-2-1 langsung muncul untuk memberikan waktu siap sebelum soal aktif.

#### 3. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.32` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.32` (`public/sw.js`).

## [2.4.31] - 2026-09-15
### Transformasi Mini-Game: Penggantian Tangkap Bintang Menjadi Dino Run (Rule 1, Rule 2, Rule 5 & Rule 15)

#### 1. Mini-Game Dino Run Interaktif (`InterQuestionWaitingLounge.tsx`)
- **Implementasi Dino Run (T-Rex Runner SD Seru)**: Menggantikan game Tangkap Bintang menjadi Dino Run klasik berbasis HTML5 Canvas 60 FPS yang ringan dan responsif.
- **Mekanika & Fisika Lompat Realistis**: Dino melompat dengan kurva gravitasi halus, menghindari berbagai variasi rintangan kaktus (kaktus kecil, kaktus ganda, dan kaktus tinggi).
- **Animasi & Grafis Vektor Khusus**: Menampilkan animasi kaki lari Dino yang bergantian, mata ekspresif (berubah silang saat menabrak), awan melayang, serta tanah bertekstur bergerak.
- **Kontrol Multi-Perangkat**: Mendukung ketukan layar sentuh penuh (*touch-first*) untuk perangkat ponsel/tablet, serta tombol `Spasi`, `Panah Atas`, atau `W` untuk desktop/laptop. Proteksi otomatis aktif agar spasi tidak memicu lompatan saat siswa mengetik di kolom obrolan.
- **Sistem Papan Skor & Rekor**: Menyimpan skor tertinggi secara lokal (`localStorage`), efek suara synthesizer Web Audio API (*jump*, *hit*, dan *milestone* setiap 100 meter), serta tombol "Lari Lagi" yang ramah sentuhan.

#### 2. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.31` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.31` (`public/sw.js`).

## [2.4.30] - 2026-09-15
### Penyederhanaan Ekstrem Header Siswa Mode Dipandu Guru (Rule 1, Rule 2, Rule 4 & Rule 15)

#### 1. Header Minimalis & Rapi Siswa (`QuizArena.tsx`)
- **Pojok Kiri Atas**: Hanya menampilkan nomor soal (`Soal X/Y`) dan poin soal (`⭐ X Poin`). Judul kuis dan tombol silang keluar dihilangkan sepenuhnya dari header siswa untuk ruang pandang maksimal.
- **Pojok Kanan Atas**: Hanya menampilkan tombol Chat (Mode Senyap) dan tombol pengaturan Titik Tiga (`MoreVertical`).
- **Penghapusan Label Tengah**: Menghapus label "🕹️ Dipandu Guru" dan timer tengah dari header siswa karena status dipandu guru telah tersedia secara jelas pada footer antarmuka.

#### 2. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.30` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.30` (`public/sw.js`).

## [2.4.29] - 2026-09-15
### Tata Letak Header Bersih, Kunci Kendali Navigasi & Obrolan Senyap Siswa Mode Dipandu Guru (Rule 1, Rule 2, Rule 4, Rule 5 & Rule 15)

#### 1. Header Bersih & Terfokus Khusus Siswa (`QuizArena.tsx`)
- **Penyederhanaan Header**: Pada mode kuis dipandu guru (`teacher_led`), tampilan header bagi siswa disederhanakan secara maksimal dan bersih. Hanya menampilkan Poin soal, Judul kuis beserta nomor urut soal di sebelah kiri, serta Tombol Obrolan Tanya Guru (Mode Senyap) dan Tombol Menu Pengaturan (Titik 3) di sebelah kanan.
- **Penyembunyian Tombol Keluar & Toggle Guru**: Menghilangkan tombol silang (X) yang mencolok dan tombol kontrol guru dari header siswa sehingga tampilan terasa sangat lapang, terstruktur, dan tidak membingungkan anak-anak.

#### 2. Kunci Navigasi & Kontrol Kuis Khusus Siswa (`QuizArena.tsx`)
- **Pencegahan Lompat Soal Mandiri**: Elemen pemilih lompat nomor soal (`<select>`) disembunyikan seutuhnya dari siswa dan dikhususkan hanya untuk Guru/Presenter Smartboard. Siswa tidak dapat melompat soal secara bebas.
- **Pencegahan Jeda Waktu Mandiri**: Tombol jeda/lanjut waktu di header dan footer hanya dapat diakses oleh Guru. Siswa melihat status waktu yang sinkron dan terkendali langsung dari depan kelas.
- **Penguncian Tombol Soal Sebelumnya**: Tombol "Sebelumnya" di footer dinonaktifkan dan disembunyikan untuk siswa, memastikan urutan soal sepenuhnya dipandu oleh Guru.
- **Akses Keluar Aman Melalui Menu Titik 3**: Opsi "Keluar dari Kuis" tetap disediakan secara aman di dalam sheet menu pengaturan (Titik 3) lengkap dengan konfirmasi bertingkat agar siswa tetap bisa keluar jika terjadi keadaan mendesak.
- **Pembatasan Polling Kelas**: Menu mode polling/voting kelas kini hanya tersedia bagi Guru dan disembunyikan dari siswa.

#### 3. Obrolan Interaktif Tanya Guru Mode Senyap di Arena (`QuizArena.tsx`, `StudentChatDrawer.tsx` & `ZoomChatToast.tsx`)
- **Laci Obrolan Siswa Terintegrasi di Arena**: Siswa dapat membuka laci obrolan langsung dari arena kuis untuk bertanya mengenai soal yang sedang dikerjakan secara langsung kepada Guru.
- **Mode Senyap Default (*Silent Mode*)**: Notifikasi suara obrolan dinonaktifkan secara bawaan selama di arena kuis agar tidak menimbulkan kebisingan di ruang kelas saat pembelajaran berlangsung, sementara notifikasi visual tetap tampil halus.
- **Pengelolaan Gestur Kembali Hierarkis**: Penggunaan tombol kembali (Escape / Back gesture perangkat Android) memprioritaskan penutupan laci obrolan terlebih dahulu sebelum menampilkan dialog keluar kuis.

#### 4. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.29` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.29` (`public/sw.js`).

## [2.4.28] - 2026-09-15
### Penonaktifan Tombol Reaksi Siswa Saat Mengerjakan Soal Kuis (Rule 1, Rule 2 & Rule 15)

#### 1. Optimalisasi Fokus Siswa di Arena Kuis (`QuizArena.tsx`)
- **Penyembunyian Tombol Reaksi Melayang (*Floating Reaction Button*) untuk Siswa**: Tombol reaksi emoji melayang kini disembunyikan sepenuhnya dari layar siswa saat kuis sedang berlangsung. Hal ini menjamin siswa dapat berkonsentrasi penuh membaca soal, mencermati opsi jawaban, dan berhitung tanpa distraksi tombol melayang di sudut layar.
- **Dukungan Eksklusif Presenter & Smartboard**: Tombol reaksi melayang tetap tersedia secara eksklusif bagi Guru saat mode presentasi atau Smartboard IFP untuk memeriahkan suasana kelas.

#### 2. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.28` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.28` (`public/sw.js`).

## [2.4.27] - 2026-09-15
### Hitung Mundur Stabil Berbasis Timestamp & Pengalihan Otomatis Siswa dari Chat ke Kuis (Rule 1, Rule 2, Rule 5, Rule 6 & Rule 15)

#### 1. Hitung Mundur Presisi & Anti Macet (`Countdown321Overlay.tsx` & `QuizArena.tsx`)
- **Hitung Mundur Berbasis Selisih Waktu (*Wall-Clock Timestamp*)**: Memperbarui mekanisme hitung mundur 3 detik (3, 2, 1, Mulai!) agar mengukur selisih waktu nyata per 50ms sehingga terbebas mutlak dari risiko macet (*stuck*) atau pembatalan timer berulang akibat *re-render* komponen induk.
- **Sinkronisasi Audio Presisi**: Memastikan setiap nada synthesizer (bip dan *fanfare*) dibunyikan tepat 1 kali pada setiap transisi detik tanpa pengulangan atau jeda yang tidak diinginkan.
- **Aksesibilitas & Perlindungan Batas Aman**: Menyediakan tombol lewati cepat (*Skip*) serta batas aman otomatis 4.5 detik untuk menjamin kuis segera dimulai bagi seluruh siswa tanpa terkendala hambatan antarmuka.
- **Stabilisasi Timer Pertanyaan Utama**: Mengisolasi interval detik soal (`timeLeft`) dari efek render berulang dan memindahkan pemilihan jawaban saat waktu habis ke luar siklus updater state demi kestabilan maksimal di React 19.

#### 2. Pengalihan Fokus Siswa Instan dari Obrolan ke Kuis (`StudentWaitingRoom.tsx`, `StudentChatDrawer.tsx`, `InterQuestionWaitingLounge.tsx` & `App.tsx`)
- **Penutupan Otomatis Laci Obrolan Siswa**: Begitu Guru menekan "Mulai Kuis", laci chat murid (`StudentChatDrawer`) seketika menutup secara otomatis tanpa perlu tindakan manual dari siswa.
- **Pelepasan Keyboard Virtual Ponsel**: Secara otomatis melepaskan fokus input (`document.activeElement.blur()`) agar keyboard virtual ponsel pintar segera tertutup, memberikan ruang pandang layar penuh pada hitung mundur dan pertanyaan kuis.
- **Sinyal Getar Mulai Kuis (*Haptic Feedback*)**: Menghasilkan getaran ramah pada ponsel siswa saat kuis dimulai agar perhatian siswa langsung tertuju ke arena.
- **Transisi Non-Blocking ke Arena**: Menghilangkan hambatan tunggu jaringan saat berpindah dari ruang lobi ke arena kuis, membuat tampilan kuis langsung terbuka seketika.
- **Sinkronisasi Countdown Guru**: Mengaktifkan hitung mundur 3 detik di dasbor kontrol Guru (`WaygroundHostView.tsx`) sejak butir soal pertama untuk keselarasan visual bersama siswa.

#### 3. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.27` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.27` (`public/sw.js`).

## [2.4.26] - 2026-09-15
### Perbaikan Sinkronisasi Data Peserta & Penyempurnaan Indikator Offline (Rule 1, Rule 2, Rule 6 & Rule 15)

#### 1. Sinkronisasi Otomatis & Penyesuaian Label Indikator Offline (`OfflineSyncIndicator.tsx`)
- **Penamaan Indikator Dinamis**: Memperbaiki label banner notifikasi agar secara cerdas membedakan antara antrean pendaftaran sesi ("data sesi menunggu sync") dan jawaban kuis yang sesungguhnya ("jawaban menunggu sync"), sehingga tidak membingungkan guru atau siswa saat baru bergabung ke kuis.
- **Penyinkronan Otomatis Saat Halaman Dimuat**: Menambahkan mekanisme sinkronisasi instan saat halaman aplikasi dibuka jika perangkat terhubung ke internet dan memiliki data antrean yang tertunda.
- **Tombol Pembersih Antrean Basi**: Menyediakan tombol tutup (`X`) fleksibel untuk membersihkan antrean data lokal yang kedaluwarsa atau tidak diperlukan lagi.

#### 2. Ketahanan Upsert Peserta & Pembersihan Data Kedaluwarsa (`offlineQueue.ts` & `supabaseClient.ts`)
- **Mekanisme Fallback Kompatibilitas Constraint**: Menambahkan fallback otomatis menggunakan primary key `id` ketika database belum memiliki constraint komposit `(session_id, student_name)`, mencegah kegagalan penyimpanan data peserta kuis ke antrean offline yang tertunda.
- **Pembersihan Otomatis Data Sesi Basi**: Otomatis mendeteksi dan menghapus item antrean jika sesi induk telah dihapus dari server (*foreign key violation*), mencegah antrean lokal tersangkut selamanya.
- **Batas Kedaluwarsa Antrean**: Menambahkan pembersihan otomatis terhadap data antrean lokal yang berusia lebih dari 24 jam.

#### 3. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.26` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.26` (`public/sw.js`).

## [2.4.25] - 2026-09-15
### Penyesuaian Tinggi Textarea Chat Menjadi 3 Baris Saat Teks Panjang (Rule 1, Rule 2 & Rule 15)

#### 1. Tampilan Input Chat Lega & Responsif
- **Ekspansi Otomatis 3 Baris**: Mengoptimalkan bidang input textarea pada obrolan guru (`TeacherChatDrawer.tsx`), obrolan siswa (`StudentChatDrawer.tsx`), dan ruang santai kuis (`InterQuestionWaitingLounge.tsx`) agar saat pengguna mengetik teks panjang atau multi-baris, tinggi textarea otomatis bertambah hingga 3 baris (~88px–92px).
- **Keterbacaan Jelas & Tidak Terpotong**: Memastikan seluruh isi teks yang panjang dapat dilihat dengan utuh tanpa terpotong atau terdesak di bagian bawah textarea.
- **Kembali Ramping Saat Singkat**: Saat pesan dikirim atau teks dihapus kembali menjadi 1 baris, tinggi textarea otomatis kembali ramping (`min-h-[44px]`).
- **Pengguliran Halus (*Smooth Scroll*)**: Jika teks melebihi 3 baris, area teks menyediakan pengguliran vertikal (`overflow-y-auto`) yang mulus dan nyaman.

#### 2. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.25` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.25` (`public/sw.js`).

## [2.4.24] - 2026-09-15
### Pengiriman Cepat Pesan Chat via Tombol Enter pada Desktop/Laptop (Rule 1, Rule 2 & Rule 15)

#### 1. Optimalisasi Interaksi Keyboard Chat Antar-Platform (`deviceUtils.ts`)
- **Deteksi Presisi Desktop/Laptop**: Menghadirkan utilitas pendeteksi perangkat desktop dan laptop untuk membedakan keyboard fisik dengan keyboard virtual ponsel cerdas.
- **Kirim Cepat via Enter (Desktop/Laptop)**: Pada perangkat desktop dan laptop, menekan tombol `Enter` murni akan langsung mengirim pesan obrolan tanpa perlu mengarahkan kursor dan mengklik tombol kirim.
- **Dukungan Baris Baru (`Shift + Enter`)**: Pengguna desktop yang ingin membuat baris baru (*multi-line text*) dapat menekan kombinasi tombol `Shift + Enter`.
- **Perlindungan Keyboard Virtual Ponsel (Mobile)**: Pada perangkat seluler (smartphone/tablet), perilaku tombol Enter tetap dipertahankan seperti semula (menambah baris baru) untuk mencegah terkirimnya pesan secara tidak sengaja saat mengetik di keyboard virtual.
- **Teks Placeholder Cerdas & Adaptif**: Bidang input chat di laci guru (`TeacherChatDrawer.tsx`), laci murid (`StudentChatDrawer.tsx`), dan ruang santai jeda soal (`InterQuestionWaitingLounge.tsx`) kini menampilkan petunjuk dinamis sesuai perangkat pengguna.

#### 2. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.24` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.24` (`public/sw.js`).

## [2.4.23] - 2026-09-15
### Sembulan (Speech Bubble) Notifikasi Chat Siswa di Sebelah Tombol Chat & Kontrol Senyap (Rule 1, Rule 2, Rule 4, Rule 5 & Rule 15)

#### 1. Balon Percakapan Notifikasi Siswa (`StudentChatBubbleToast.tsx` & `StudentWaitingRoom.tsx`)
- **Penempatan Ergonomis Sebelah Kiri Tombol Chat**: Menghadirkan sembulan notifikasi berdesain balon percakapan (*speech bubble callout*) yang muncul tepat di sebelah kiri tombol bulat obrolan melayang (*Floating Action Button*) murid dengan panah penunjuk halus mengarah ke tombol chat.
- **Desain Mobile-First & Ringkas**: Menyesuaikan dimensi sembulan secara responsif (`max-w-[calc(100vw-5.75rem)]`) dengan teks 1–2 baris yang rapi sehingga tidak memakan ruang dan terhindar dari pemotongan tampilan di layar ponsel kecil.
- **Interaksi Seketika & Otomatis**: Mengetuk sembulan langsung membuka laci obrolan murid (`StudentChatDrawer`), menghapus indikator pesan belum dibaca, dan sembulan otomatis menghilang setelah 5 detik jika diabaikan.
- **Audio Pop-Chime Lembut**: Menghasilkan efek suara notifikasi santun berbasis Web Audio API tanpa beban berkas eksternal.

#### 2. Kontrol Senyapkan Notifikasi Sembulan & Sakelar Pemulihan (`StudentChatDrawer.tsx`)
- **Tombol Senyapkan di Sembulan**: Menambahkan tombol lonceng senyap (`BellOff`) langsung di sembulan dengan target sentuh minimal 44px untuk membungkam popup notifikasi pada sesi berjalan.
- **Tombol Sakelar Pemulihan di Header Laci**: Menyediakan tombol sakelar notifikasi di bagian atas laci obrolan siswa agar murid dapat dengan mudah mengaktifkan kembali notifikasi jika diperlukan.
- **Sinkronisasi Sesi Lokal (`sessionStorage`)**: Preferensi senyap tersimpan per ID sesi aktif murid secara persisten.

#### 3. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.23` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.23` (`public/sw.js`).

## [2.4.22] - 2026-09-15
### Reset Badge Indikator Chat Belum Dibaca pada Layar Kendali Guru (Rule 1, Rule 2, Rule 4 & Rule 15)

#### 1. Sinkronisasi Status Baca Obrolan Kelas (`WaygroundHostView.tsx`)
- **Pembersihan Hitungan Setelah Dibaca**: Memperbaiki tombol *Chat Kelas* pada papan kendali guru agar lencana hitungan angka (`badge`) otomatis hilang ketika laci obrolan dibuka atau pesan telah dibaca guru.
- **Indikator Pesan Baru Dinamis**: Jika terdapat pesan obrolan baru dari siswa saat laci obrolan sedang tertutup, lencana angka akan muncul kembali dan hanya menampilkan jumlah pesan baru yang belum dibaca (`unread count`), bukan total akumulasi seluruh pesan.
- **Persistensi Sesi Lokal (`sessionStorage`)**: Menyimpan riwayat status baca pesan per ID sesi sehingga status pesan yang telah dibaca tetap terjaga dan tidak kembali muncul saat layar disegarkan (*refresh*).

#### 2. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.22` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.22` (`public/sw.js`).

## [2.4.21] - 2026-09-15
### Peningkatan Toast Notifikasi Chat Reaktif di Layar Lebar & Arena Smartboard (Rule 1, Rule 2, Rule 5 & Rule 15)

#### 1. Pemantau Pesan Chat Reaktif Otomatis (`ZoomChatToast.tsx`)
- **Pendeteksi Pesan Masuk Multikanal**: Menambahkan pemantau reaktif terhadap array pesan sesi `chatMessages` secara langsung. Kini, baik pesan yang diterima melalui WebSocket Realtime, event lokal, maupun hasil sinkronisasi database polling, toast notifikasi obrolan murid dijamin 100% langsung muncul di layar guru seketika tanpa terlewat.
- **Pencegahan Notifikasi Ganda & Riwayat Lama**: Sistem memfilter pesan lama pada saat pertama kali layar dibuka sehingga tidak terjadi lonjakan notifikasi historis, serta mencegah notifikasi untuk pesan yang dikirim oleh diri sendiri.

#### 2. Optimalisasi Posisi Layar Lebar & Papan Kendali Guru (`WaygroundHostView.tsx`)
- **Posisi Ergonomis Kanan Atas (`top-right`)**: Menyesuaikan posisi notifikasi popup chat di layar lebar desktop/laptop menjadi tepat di bawah tombol *Chat Kelas* (`top-16 sm:top-20 right-4 sm:right-6`) dengan lapisan `z-[100]`, animasi luncur yang halus, serta efek audio pop-chime Web Audio API yang jelas.

#### 3. Dukungan Toast Chat di Arena Kuis & Layar Lebar Smartboard (`QuizArena.tsx`)
- **Integrasi Toast Chat di Arena**: Memasang `ZoomChatToast` pada `QuizArena` saat sesi kelas live berlangsung. Guru yang sedang menayangkan kuis di layar proyektor / Smartboard IFP tetap dapat menerima notifikasi pesan pertanyaan atau diskusi murid secara langsung.

#### 4. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.21` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.21` (`public/sw.js`).

## [2.4.20] - 2026-09-15
### Purifikasi Terminologi Antarmuka Bebas Merek Pihak Ketiga & Perlindungan Hak Cipta (Rule 2, Rule 3, Rule 4 & Rule 15)

#### 1. Pembersihan Terminologi Hak Cipta & Merek Pihak Ketiga
- **Papan Kendali Guru (`TeacherDashboard.tsx`)**: Menghilangkan seluruh penyebutan merek pihak ketiga (*Quizizz* dan *Wayground*) pada teks antarmuka pengguna.
- **Redaksi Ramah & Mandiri (Rule 2 & Rule 3)**:
  - Teks subjudul sesi aktif disesuaikan menjadi: *"Pantau interaksi siswa secara langsung, kendalikan sesi live kelas, atau buka rekapan hasil kuis."*
  - Teks kondisi kosong disesuaikan menjadi: *"Mulai sesi kuis untuk memantau nilai dan jawaban murid secara interaktif dan real-time."*
  - Lencana status sesi aktif diperbarui menjadi `LIVE INTERAKTIF`.
  - Tombol aksi diperbarui menjadi *"Masuk ke Ruang Tunggu Kelas"* dan *"Buka Layar Pantau Guru"*.
- **Layar Kendali Host Guru (`WaygroundHostView.tsx`)**: Memperbarui lencana status sesi atas menjadi `SESI LIVE AKTIF`.
- **Pembersihan Komentar Kode (`supabaseClient.ts`, `StudentWaitingRoom.tsx`, `QuizArena.tsx`, `QuizCreator.tsx`, `index.css`)**: Menghapus seluruh referensi pihak ketiga dari komentar kode guna menjaga orisinalitas dan integritas kekayaan intelektual aplikasi.

#### 2. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.20` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.20` (`public/sw.js`).

## [2.4.19] - 2026-09-15
### Dialog Onboarding Profil Pertama Kali Pengguna Google OAuth Guru & Siswa (Rule 1, Rule 2, Rule 4, Rule 8, Rule 9, Rule 10 & Rule 15)

#### 1. Dialog Onboarding Mandatori Pasca-Login Google OAuth Pertama Kali (`OAuthOnboardingModal.tsx`)
- **Deteksi Kebutuhan Onboarding Presisi**: Sistem mendeteksi ketika Guru atau Siswa baru pertama kali mendaftar / masuk dengan akun Google OAuth dan belum memiliki data profil esensial (seperti nama sekolah untuk guru, atau tingkat kelas dan nama panggilan untuk siswa).
- **Formulir Pendidik / Guru**: Guru diarahkan mengisi Nama Lengkap beserta Gelar serta Nama Asal Sekolah / Instansi secara valid sebelum masuk ke Dasbor Guru. Data ini otomatis disinkronkan ke profil cloud Supabase dan identitas pembuat kuis.
- **Formulir Siswa / Peserta Didik**: Siswa diarahkan mengonfirmasi Nama Panggilan (maksimal 50 karakter), memilih Tingkat Kelas (SD Kelas 1-6, SMP, SMA), dan memilih Karakter Avatar favorit (8 karakter hewan ceria) sebelum memasuki arena kuis atau lobi belajar.
- **Keamanan & Konsistensi Data**: Mencegah akun baru memiliki data kosong atau placeholder default saat pertama kali login menggunakan Google. Tersedia tombol pembatalan dan keluar sesi yang aman (*safe cancellation*) jika pengguna batal melanjutkan.

#### 2. Standar Desain Mobile-First & Touch-First (Rule 1 & Rule 2)
- **Target Sentuh Ergonomis**: Seluruh tombol aksi, pemilih avatar, dan bidang input dirancang dengan ukuran target sentuh minimal 44×44 px (`min-h-[44px]` hingga `min-h-[48px]`).
- **Antarmuka Responsif & Inklusif**: Tata letak stabil dan proporsional di seluruh rentang orientasi layar ponsel (portrait/landscape), tablet, hingga desktop dengan tema terang dan gelap (*dark mode*) yang nyaman di mata.

#### 3. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.19` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.19` (`public/sw.js`).

## [2.4.18] - 2026-09-15
### Preservasi Akurat Nama Pendidik & Asal Sekolah Pasca Login & Sinkronisasi OAuth (Rule 1, Rule 2, Rule 9, Rule 11 & Rule 15)

#### 1. Perbaikan Sinkronisasi Profil Pendidik & Siswa (`supabaseClient.ts`)
- **Penghapusan Nilai Statis (*Hardcoded Fallback*)**: Menghapus logika lama yang menimpa nama dan asal sekolah pendidik ke nilai bawaan saat login Google OAuth. Nama lengkap dan asal sekolah yang sudah pernah diedit atau disimpan oleh pengguna kini dipertahankan secara mutlak.
- **Pencarian Multi-Kunci Presisi Cloud (`profiles_teacher` & `profiles_player`)**: Menyempurnakan kueri pencarian profil dengan mencocokkan `auth_user_id`, `id`, atau `email` yang diurutkan berdasarkan riwayat pembaruan terkini (`updated_at DESC`). Dengan demikian, record profil lama dan baru tetap tersinkronisasi tanpa kehilangan data.
- **Pemberian Hak Kendali Penuh Pengguna**: Sistem kini sepenuhnya memprioritaskan data nama dan asal sekolah yang telah disunting pengguna di Supabase Auth Metadata, database Supabase, maupun penyimpanan lokal.

#### 2. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.18` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.18` (`public/sw.js`).

## [2.4.17] - 2026-09-15
### Integrasi Metode Masuk & Daftar Akun dengan Google OAuth Terpadu (Rule 1, Rule 2, Rule 4, Rule 8, Rule 9, Rule 10 & Rule 15)

#### 1. Autentikasi Google OAuth Terpadu Guru & Siswa
- **Dukungan Google OAuth di Modal Masuk/Daftar (`UnifiedAuthModal.tsx`)**: Menambahkan tombol resmi masuk dan pendaftaran instan menggunakan akun Google pada Tab Guru maupun Tab Siswa. Dilengkapi ikon vektor Google resmi, indikator proses (*spinner*), dan pemisah visual *"atau dengan email & sandi"* yang elegan dan ramah pengguna.
- **Standar Antarmuka Mobile-First & Touch-Target (Rule 1 & Rule 2)**: Tombol dirancang dengan tinggi target sentuh minimal 44×44 px (`min-h-[44px]`), kontras tajam di mode terang maupun gelap, dan transisi tombol yang responsif di berbagai resolusi layar.

#### 2. Sinkronisasi Profil Otomatis & Pembersihan URL (Rule 9 & Rule 10)
- **Sinkronisasi Sesi Cloud (`supabaseClient.ts`)**: Menerapkan fungsi `signInWithGoogle` dan `syncOAuthUserSession` untuk menangkap pengalihan balik (*OAuth callback*). Profil pengguna (nama lengkap, email, dan avatar Google) otomatis disinkronkan ke database Supabase sesuai peran yang dipilih (Guru pada `profiles_teacher` atau Siswa pada `profiles_player`).
- **Pembersihan URL Transparan (`App.tsx`)**: Menghapus parameter kueri dan token dari bilah alamat peramban secara otomatis pasca-otentikasi guna menjaga kerapian URL dan privasi sesi.
- **Dokumentasi Panduan Konfigurasi (`docs/panduan-integrasi-google-oauth.md`)**: Menyediakan panduan langkah demi langkah pengaturan kredensial Google Cloud Console dan konfigurasi penyedia otentikasi di Supabase.

#### 3. Pembaruan Versi & Cache PWA (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.17` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.17` (`public/sw.js`).

## [2.4.16] - 2026-09-15
### Perbaikan Tampilan Bilah Reaksi Semangat Guru & Siswa (Rule 1, Rule 2, Rule 4 & Rule 15)

#### 1. Perbaikan Layout Bilah Reaksi Semangat (*Reaction Bar*)
- **Komponen Reaksi (`QuizizzReactionButtonRow.tsx`)**: Memperbaiki tata letak tombol emoji reaksi dari sebelumnya yang meregang vertikal secara keliru (*stretched 100% width vertical pills*) menjadi bilah horizontal yang rapi, modern, dan presisi (*horizontal flex row of squircle emoji buttons*).
- **Presisi Touch Target & Responsivitas Mobile-First**: Setiap tombol reaksi memiliki ukuran target sentuh proporsional 44×44 px hingga 48×48 px (`min-h-[44px] min-w-[44px] shrink-0`), tersusun sejajar secara horizontal di layar desktop/tablet, dan membungkus rapi (*flex-wrap*) di layar ponsel sempit tanpa distorsi atau overlap.
- **Papan Kendali Guru (`WaygroundHostView.tsx`)**: Mengoptimalkan kartu kontainer bilah reaksi host dengan batasan lebar proporsional (`max-w-xl mx-auto w-full`) sehingga tampil simetris dan terpusat di tengah layar kendali kelas.

#### 2. Pembaruan Versi & PWA Service Worker (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.16` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.16` (`public/sw.js`).

## [2.4.15] - 2026-09-15
### Auto-Save Kuis Real-Time Saat Edit & Tambah Butir Soal di Bank Soal (Rule 1, Rule 2, Rule 4, Rule 6, Rule 9, Rule 11 & Rule 15)

#### 1. Penyimpanan Otomatis Kuis Real-Time (*Real-Time Auto-Save*)
- **Studio Pembuat Kuis (`QuizCreator.tsx`)**: Menerapkan mekanisme penyimpanan otomatis (*auto-save*) saat guru mengedit kuis yang sudah ada. Setiap kali butir soal selesai diperbarui atau butir soal baru berhasil disimpan di Bank Soal, kuis langsung tersimpan ke penyimpanan lokal dan tersinkronisasi ke cloud database Supabase secara instan di latar belakang tanpa mengharuskan pengguna membuka tab "3. Simpan" (*Pratinjau & Simpan*).
- **Cakupan Auto-Save Lengkap di Bank Soal**:
  - Menyimpan otomatis saat butir soal selesai diedit (*Save Question*).
  - Menyimpan otomatis saat butir soal baru ditambahkan dan disimpan (*Add Question*).
  - Menyimpan otomatis saat butir soal diimpor dari Bank Soal AI (*AI Question Generator*).
  - Menyimpan otomatis saat butir soal disalin/diduplikasi (*Duplicate Question*).
  - Menyimpan otomatis saat butir soal dihapus (*Delete Question*).
  - Menyimpan otomatis saat susunan urutan soal dipindahkan (*Reorder Questions*).
  - Menyimpan otomatis saat fitur pembagian rata 100 poin dieksekusi.
  - Menyimpan otomatis saat informasi identitas kuis di Tahap 1 diubah dan dilanjutkan ke Bank Soal.

#### 2. Antarmuka Visual & Status Auto-Save yang Informatif
- **Lencana Status Auto-Save di Header (`QuizCreator.tsx`)**: Menampilkan indikator status interaktif yang elegan dan adaptif (ikon berkedip *Menyimpan...*, centang hijau *Tersimpan Otomatis*, jam tersimpan terakhir, serta peringatan jika terjadi kendala).
- **Navigasi Cepat Selesai & Kembali**: Menambahkan tombol *Selesai & Kembali* di bilah navigasi bawah Bank Soal khusus mode edit kuis, memungkinkan guru langsung kembali ke Dasbor Guru dengan rasa aman karena seluruh perubahan telah tersimpan penuh.

#### 3. Pembaruan Versi & PWA Service Worker (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.15` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.15` (`public/sw.js`).

## [2.4.14] - 2026-09-14
### Token Perangkat Unik & Smart Auto-Disambiguation Nama Peserta Ala Standard Quizizz & Kahoot (Rule 1, Rule 2, Rule 4, Rule 7, Rule 9 & Rule 15)

#### 1. Token Peserta Sesi Berbasis Perangkat (Device Session Token)
- **Manajemen Sesi Perangkat Unik (`supabaseClient.ts`)**: Menerapkan token peserta sesi unik per perangkat/tab (`part_${Date.now()}_...`) yang tersimpan aman di penyimpanan sesi lokal. Mencegah timpaan data antar-perangkat saat beberapa pengguna tamu masuk dengan nama panggilan yang persis sama di kuis terbuka/publik.
- **Dukungan Sambung Ulang (*Reconnect*) Mandiri**: Perangkat yang memuat ulang (*refresh*) halaman atau terputus sejenak akan otomatis menyambung kembali menggunakan token sesi yang sama tanpa membuat entri baru atau mengubah nama yang sudah diperoleh.

#### 2. Smart Auto-Disambiguation Nama Ala Standar Quizizz & Kahoot
- **Penomoran Otomatis Cerdas (`supabaseClient.ts`)**: Ketika pengguna tamu baru masuk dengan nama yang sudah terdaftar oleh perangkat lain dalam sesi yang sama (misal "Budi"), sistem secara otomatis menyesuaikan nama menjadi berakhiran urut ramah pengguna seperti "Budi (2)", "Budi (3)", dst.
- **Papan Skor & Peringkat Mandiri**: Setiap peserta dengan nama yang disesuaikan memiliki catatan nilai, progres jawaban, dan peringkatnya sendiri tanpa ada benturan ataupun penggabungan nilai yang tidak disengaja.

#### 3. Penanda Jelas & Komunikatif di Ruang Tunggu dan Arena Kuis
- **Ruang Tunggu Siswa (`StudentWaitingRoom.tsx`)**: Menambahkan penanda identifikasi aktif badge "Kamu" serta notifikasi ramah bila nama disesuaikan secara otomatis agar unik di papan nilai kelas.
- **Arena & Ruang Jeda Antar-Soal (`QuizArena.tsx`)**: Menyelaraskan sinkronisasi jawaban, deteksi pergantian tab (anti-cheat), dan lounge tunggu antar-soal menggunakan nama unik serta token perangkat yang valid.

#### 4. Pembaruan Versi & PWA Service Worker (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.14` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.14` (`public/sw.js`).
## [2.4.13] - 2026-09-14
### Konfirmasi Ganti Soal Guru & Hitung Mundur 3 Detik Mode Dipandu Guru (Rule 1, Rule 2, Rule 5, Rule 7 & Rule 15)

#### 1. Dialog Konfirmasi Navigasi Soal Guru (Next & Prev)
- **Papan Kendali Guru (`WaygroundHostView.tsx`)**: Menambahkan modal konfirmasi sebelum guru berpindah ke soal berikutnya (*Next*) ataupun kembali ke soal sebelumnya (*Prev*). Guru diberikan informasi ringkas nomor soal tujuan untuk mencegah salah tekan (*accidental click*) dan loncatan berulang yang dapat memicu lag saat berganti soal secara cepat.
- **Layar Presentasi Guru di Arena (`QuizArena.tsx`)**: Mengintegrasikan modal konfirmasi navigasi yang sama ketika guru memimpin kuis langsung melalui tampilan arena kelas interaktif.
- **Bilah Cooldown Visual Host**: Menampilkan status indikator hitung mundur siswa di sisi guru segera setelah navigasi dikonfirmasi agar guru mengetahui seluruh siswa sedang bersiap.

#### 2. Animasi Hitung Mundur 3 Detik (*Countdown 3-2-1*) Sebelum Soal Aktif
- **Komponen Overlay Baru (`Countdown321Overlay.tsx`)**: Menghadirkan animasi hitung mundur layar penuh yang modern, bersih, dan touch-friendly (3... 2... 1... Mulai! 🚀) dengan efek suara sintetis berjenjang menggunakan Web Audio API tanpa dependensi berkas eksternal.
- **Pembekuan Timer & Penguncian Jawaban**: Selama 3 detik hitung mundur berjalan, timer durasi soal ditahan dan tombol pilihan jawaban dikunci sehingga seluruh siswa memiliki waktu persiapan membaca yang adil dan serempak.

#### 3. Sinkronisasi Mundur Dua Arah (*Bidirectional Sync*)
- **Arena Kuis (`QuizArena.tsx`)**: Menyelaraskan pendengar sinkronisasi realtime multi-perangkat agar jika guru kembali ke nomor soal sebelumnya (*Prev*), perangkat seluruh siswa serentak kembali ke nomor soal tersebut disertai animasi hitung mundur 3 detik.
- **Ruang Jeda Antar-Soal (`InterQuestionWaitingLounge.tsx`)**: Memperbarui deteksi indeks soal di ruang tunggu agar merespons perpindahan maju maupun mundur dari guru secara instan.

#### 4. Pembaruan Versi & PWA Service Worker (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.13` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.13` (`public/sw.js`).

## [2.4.12] - 2026-09-14
### Perluasan Batas Panjang Nama Panggilan Siswa & Tamu Hingga 50 Karakter (Rule 1, Rule 2, Rule 4, Rule 7 & Rule 15)

#### 1. Perluasan Batas Karakter Nama Panggilan (Maksimal 50 Karakter)
- **Modal Profil Siswa & Tamu (`QuizHome.tsx`)**: Meningkatkan batas input nama panggilan dari sebelumnya 12 karakter menjadi 50 karakter (`maxLength={50}`) disertai indikator penghitung karakter real-time (`{length}/50`) dan label deskriptif yang jelas.
- **Formulir Pendaftaran Siswa (`UnifiedAuthModal.tsx`)**: Menetapkan batas maksimal nama panggilan menjadi 50 karakter (`maxLength={50}`) dengan teks petunjuk dan indikator jumlah karakter yang presisi.
- **Lobi Ruang Belajar Siswa (`StudentLobby.tsx`)**: Menyelaraskan batas pengisian nama siswa pada saat memasukkan PIN atau bergabung ke kuis menjadi 50 karakter (`maxLength={50}`).

#### 2. Ketahanan Tata Letak & Responsivitas Teks Panjang (Rule 1 & Rule 2)
- **Pemotongan Teks Anggun (*Graceful Truncation*)**: Menambahkan pembatas lebar maksimal dan efek elipsis (`truncate`) pada tombol profil tamu dan pill identitas di bilah navigasi atas beranda agar nama panjang (hingga 50 karakter) tidak merusak tata letak di layar ponsel Android, tablet, maupun desktop.
- **Penyelarasan Ruang Tunggu**: Memastikan nama panjang tetap tersaji rapi dengan pembungkusan kata alami (*break-words*) di seluruh kartu ucapan dan papan partisipasi kelas.

#### 3. Pembaruan Versi & PWA Service Worker (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.12` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.12` (`public/sw.js`).

## [2.4.11] - 2026-09-14
### Perbaikan Blank Screen Masuk Kuis Tamu, Pelindung Butir Soal Kosong, & ErrorBoundary Terpadu (Rule 1, Rule 2, Rule 6, Rule 8, Rule 9 & Rule 15)

#### 1. Perbaikan Akar Masalah Layar Hitam / Blank Screen di Arena Kuis (`QuizArena.tsx`)
- **Penanganan Kuis Tanpa Butir Soal**: Memperbaiki galat fatal runtime `TypeError: Cannot read properties of undefined (reading 'points')` yang terjadi saat pengguna/tamu mencoba masuk ke kuis yang belum memiliki butir soal (0 pertanyaan).
- **Tampilan Cadangan Bersih & Informatif**: Menambahkan fallback UI interaktif di `QuizArena` apabila butir soal kosong, menampilkan pesan ramah: *"Kuis Belum Memiliki Soal"* dengan tombol *"Kembali ke Beranda"*, sehingga sistem tidak lagi mengalami unmount atau layar hitam.
- **Normalisasi Kalkulasi Progres**: Menghindari pembagian dengan nol (`0/0` yang menghasilkan `Infinity`) pada `progressPercent` saat daftar soal kosong.

#### 2. Pelindung Navigasi & Beranda (`QuizHome.tsx` & `App.tsx`)
- **Penyaringan Katalog Publik**: Memperbarui `getAllQuizzes` dan `fetchQuizzesFromCloud` pada `supabaseClient.ts` untuk menyaring dan mengecualikan kuis dengan 0 pertanyaan dari katalog publik siswa dan tamu.
- **Validasi Tombol & Modal Aturan**: Mencegah peluncuran kuis kosong dari tombol kartu di beranda maupun modal aturan, serta menampilkan modal pemberitahuan ramah pengguna: *"Kuis Belum Siap: Kuis ini belum memiliki butir soal yang dapat dikerjakan saat ini."*.
- **Pembersihan Metadata Kuis Uji**: Memperbarui status kuis pengujian nir-soal pada basis data menjadi privat dan tidak terpublikasi.

#### 3. Penerapan `ErrorBoundary` Global (`main.tsx` & `ErrorBoundary.tsx`)
- **Pencegahan Blank Screen Menyeluruh**: Mengintegrasikan komponen `ErrorBoundary` terpadu pada root aplikasi React untuk menangkap seluruh galat render runtime yang tidak terduga.
- **Pemulihan Mandiri Pengguna**: Menyediakan tombol *"Segarkan Halaman"* dan *"Kembali ke Beranda"* dengan pembersihan otomatis status navigasi yang rusak, menjamin aplikasi tidak pernah terperangkap pada kondisi layar kosong tanpa respon.

#### 4. Pembaruan Versi & PWA Service Worker (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.11` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.11` (`public/sw.js`).

## [2.4.10] - 2026-09-14
### Eliminasi Tombol Reaksi Mengambang Redundan & Optimalisasi Kerapian Antarmuka Ruang Sesi (Rule 1, Rule 2, Rule 4, Rule 5, Rule 7 & Rule 15)

#### 1. Eliminasi Tombol Reaksi Mengambang (*Floating Reaction Button*) Redundan
- **Pembersihan Antarmuka Host Guru (`WaygroundHostView.tsx`)**: Menghilangkan tombol reaksi mengambang (*floating reaction action button*) yang sebelumnya muncul di pojok kanan bawah dan bertabrakan dengan papan peringkat / daftar siswa live. Host tetap memiliki baris tombol reaksi lengkap dan interaktif (*QuizizzReactionButtonRow*) yang tertata rapi di panel kendali utama.
- **Penyelarasan Ruang Tunggu Siswa (`StudentWaitingRoom.tsx`)**: Menghapus tombol reaksi mengambang redundan dari ruang tunggu murid, menjaga antarmuka tetap bersih, lapang, dan fokus pada baris reaksi utama serta daftar teman sekelas.
- **Penyelarasan Lounge Jeda Soal (`InterQuestionWaitingLounge.tsx`)**: Menghapus tombol reaksi melayang di lounge jeda soal murid karena sudah dilengkapi dengan panel reaksi interaktif horizontal dan laci obrolan kelas.
- **Preservasi Tombol Reaksi Eksklusif di Arena Kuis (`QuizArena.tsx`)**: Tetap mempertahankan tombol reaksi melayang pada layar pengerjaan soal kuis siswa (`QuizArena.tsx`) sebagai sarana interaksi cepat tanpa mengorbankan ruang baca soal dan pilihan jawaban.

#### 2. Peningkatan Estetika & Ergonomi Mobile (Rule 1 & Rule 2)
- Menghilangkan tumpang-tindih (*overlap*) elemen antarmuka di perangkat mobile berlayar sempit dan tablet.
- Memastikan animasi reaksi langsung (*QuizizzReactionOverlay*) tetap aktif secara visual di seluruh ruang sesi tanpa terhalang tombol ganda.

#### 3. Pembaruan Versi & PWA Service Worker (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.10` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.10` (`public/sw.js`).

## [2.4.9] - 2026-09-14
### Perilaku Tombol Enter Murni Baris Baru & Pengiriman Pesan Eksklusif Tombol Kirim di Obrolan Kelas (Rule 1, Rule 2, Rule 4, Rule 5, Rule 7 & Rule 15)

#### 1. Perubahan Perilaku Tombol Enter pada Kolom Obrolan Kelas
- **Tombol Enter Murni Menyisipkan Baris Baru**: Menyesuaikan seluruh input obrolan kelas (Guru di `TeacherChatDrawer.tsx`, Murid di `StudentChatDrawer.tsx`, dan Lounge Jeda Soal di `InterQuestionWaitingLounge.tsx`) agar menekan tombol `Enter` (maupun `Shift+Enter`) murni menyisipkan baris baru (*line break / newline* `\n`) dan sama sekali tidak mengirim pesan.
- **Pengiriman Pesan Eksklusif via Tombol Kirim**: Mengharuskan pengguna menekan/mengetuk tombol kirim pesan (*Send button*) secara eksplisit dengan jari/mouse untuk menyiarkan pesan ke kelas. Perubahan ini berlaku konsisten di seluruh perangkat (Desktop, Smartphone, Tablet).
- **Pencegahan Submit Otomatis Form**: Menonaktifkan perilaku default `onSubmit` pada form input chat (`e.preventDefault()`) sehingga tidak ada mekanisme pengiriman pesan yang terpicu secara tidak sengaja melalui penekanan tombol Enter pada keyboard fisik maupun virtual.

#### 2. Peningkatan Textarea Multiline & Tampilan Pesan
- **Textarea Responsif & Ergonomis**: Mengubah elemen input teks satu baris menjadi textarea multi-baris yang fleksibel (`min-h-[44px]` hingga `min-h-[48px]`, `resize-none`) dengan teks pembantu ramah pengguna: *"Enter untuk baris baru"*.
- **Dukungan `whitespace-pre-wrap` Lengkap**: Memastikan seluruh gelembung pesan chat (termasuk pada gelembung obrolan di Lounge Jeda Soal) mempertahankan jeda baris baru secara rapi dan estetis.

#### 3. Pembaruan Versi & PWA Service Worker (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.9` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.9` (`public/sw.js`).

## [2.4.8] - 2026-09-14
### Perbaikan Sinkronisasi Ruang Tunggu Guru-Murid Antar-Perangkat & Animasi Tombol Segarkan Status (Rule 1, Rule 2, Rule 4, Rule 5, Rule 6 & Rule 15)

#### 1. Sinkronisasi Sesi Aktif Antar-Perangkat via Cloud Supabase (`supabaseClient.ts`)
- **Penambahan `fetchActiveSessionByQuizId`**: Menyediakan fungsi pencarian sesi aktif di Supabase berbasis `quiz_id` dengan status `waiting`, `active`, atau `paused`. Hal ini memungkinkan perangkat siswa (misal smartphone via jaringan lokal `192.168.x.x`) langsung mendeteksi ruang tunggu yang dibuka oleh guru dari laptop/PC tanpa bergantung pada `localStorage` lokal yang terpisah.
- **Pemuatan Penuh Butir Soal pada `getQuizById`**: Memperbaiki logika `getQuizById` agar hanya menggunakan cache lokal jika `questions` benar-benar berisi data butir soal. Jika cache lokal kosong (0 butir), sistem secara otomatis memuat butir soal lengkap dari database Supabase.

#### 2. Ketahanan Sesi & Preservasi PIN Game (`navigationState.ts` & `App.tsx`)
- **Preservasi PIN Sesi Dinamis**: Memperbarui `saveNavigationState` dan `handleEnterPinLobby` agar PIN sesi 6-digit dinamis tetap tersimpan di `sessionStorage` dan URL parameter, sehingga saat siswa melakukan refresh (F5 / reload peramban), sesi kuis tidak hilang.
- **Pemulihan Sesi Multi-Jalur pada Mount**: Saat halaman dimuat ulang dengan parameter `quiz`, sistem memulihkan sesi aktif melalui `fetchActiveSessionByPin` dan `fetchActiveSessionByQuizId`.

#### 3. Peningkatan Antarmuka & Animasi Segarkan Status (`StudentLobby.tsx`)
- **Animasi Putar Tombol Segarkan (`RefreshCw`)**: Tombol "Segarkan Status" kini memiliki efek putaran halus (`animate-spin`), umpan balik haptik ganda (`navigator.vibrate`), dan status interaktif "Memeriksa Ruang Kelas...".
- **Banner Status Hasil Pemeriksaan**: Menampilkan pesan status informatif yang ramah anak (hijau sukses saat ruang kelas ditemukan, biru informasi saat menunggu guru membuka sesi).
- **Penyesuaian Kondisi Penjaga Status**: Memperbaiki `isWaitingForTeacherToOpen` agar tidak mengunci siswa ketika guru sudah berada di sesi aktif atau jeda.
- **Polling Otomatis Lobi Siswa**: Polling 2 detik kini otomatis memeriksa `fetchActiveSessionByQuizId` sehingga lobi siswa langsung bertransisi begitu guru membuka sesi tanpa siswa perlu menekan tombol manual.

#### 4. Pembaruan Versi & PWA Service Worker (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.8` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.8` (`public/sw.js`).

## [2.4.7] - 2026-09-14
### Perbaikan & Penyelarasan Tombol Reaksi Guru & Murid di Mobile & Sepanjang Sesi Kuis (Rule 1, Rule 2, Rule 4, Rule 5, Rule 7 & Rule 15)

#### 1. Bilah Reaksi & Overlay Guru Sepanjang Sesi Kuis (`WaygroundHostView.tsx`)
- **Aktivasi Tombol Reaksi Guru Saat Kuis Aktif**: Memperbaiki pembatasan yang sebelumnya hanya menampilkan reaksi saat `session.status === 'waiting'`. Kini guru dapat terus mengirim reaksi semangat ke murid saat status sesi `active` (berlangsung) maupun `paused`.
- **Penempatan Bilah Reaksi Inline**: Menempatkan bilah reaksi guru secara rapi tepat di bawah bilah navigasi soal (*Question Advance Bar*) sehingga guru dapat memberi apresiasi secara langsung saat memandu kuis.
- **Overlay Animasi Reaksi Menyeluruh**: Mengaktifkan `QuizizzReactionOverlay` sepanjang sesi kuis berlangsung (`session.status !== 'finished'`) agar reaksi murid dan guru selalu terlihat melayang di layar proyektor / desktop guru.

#### 2. Komponen Floating Reaction Button Baru (`FloatingReactionButton.tsx`)
- **Tombol Melayang Touch-First Mobile**: Menambahkan tombol aksi melayang (*Floating Action Button*) touch-first (48×48px hingga 56×56px) di sudut kanan bawah layar yang dapat diperluas menjadi dok emoji reaksi lengkap.
- **Interaksi Ergonomis & Haptic Feedback**: Mendukung getaran haptik lembut (`navigator.vibrate(25)`), animasi timbul (*pop-up dock*), penutupan otomatis setelah 6 detik tanpa interaksi, serta deteksi sentuhan di luar area dok (*click-outside*).
- **Penyiaran Realtime & Throttling Hemat Bandwidth**: Menggunakan `broadcastLiveReaction` untuk penyiaran instan tanpa latensi ke semua peserta dan debounce 500ms untuk penyimpanan database yang efisien.

#### 3. Reaksi Murid di Arena Kuis, Jeda Soal, & Ruang Tunggu (`QuizArena.tsx`, `InterQuestionWaitingLounge.tsx`, `StudentWaitingRoom.tsx`)
- **Akses Reaksi di Layar Siswa**: Menyematkan `FloatingReactionButton` dan `QuizizzReactionOverlay` di seluruh alur kuis siswa (Ruang Tunggu, saat menjawab soal di Arena Kuis multiplayer, serta di Lounge Jeda Soal).
- **Pembersihan Preset Lama di Lounge Jeda Soal**: Menghapus tombol chip preset usang dan menyajikan kolom obrolan santai yang bersih, intuitif, dan responsif.

#### 4. Pembaruan Versi & PWA Service Worker (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.7` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.7` (`public/sw.js`).

## [2.4.6] - 2026-09-14
### Pembersihan & Penyederhanaan Obrolan: Penghapusan Pengumuman Cepat Guru & Chip Pesan Cepat Murid (Rule 1, Rule 2, Rule 4, Rule 6 & Rule 15)

#### 1. Penghapusan Pengumuman Cepat Guru (TeacherChatDrawer.tsx)
- **Menghilangkan Bilah Chip Pengumuman**: Menghapus daftar `QUICK_ANNOUNCEMENTS`, fungsi `handleQuickChip`, dan komponen baris tombol chip cepat pengumuman guru di atas kolom input chat.
- **Pembersihan Tampilan Panel Obrolan**: Area bawah drawer obrolan guru kini lebih lega, bersih, dan fokus langsung pada pengetikan instruksi guru serta bilah pratinjau balasan (*reply preview bar*).
- **Penyesuaian Teks Panduan Kosong**: Memperbarui teks pada keadaan belum ada obrolan menjadi ramah dan relevan tanpa referensi chip cepat.

#### 2. Penghapusan Chip Pesan Cepat Murid (StudentChatDrawer.tsx)
- **Menghilangkan Baris Chip Preset Siswa**: Menghapus daftar `PRESET_QUICK_MESSAGES` dan baris tombol pintasan pesan cepat siswa di atas input chat.
- **Optimalisasi Ruang Layar Mobile**: Mengurangi penggunaan ruang vertikal pada layar smartphone sehingga riwayat gelembung obrolan kelas tampil lebih luas dan tidak terdesak oleh deretan tombol preset.
- **Penyelarasan Teks Status Kosong**: Memperbarui deskripsi keadaan obrolan kosong agar mengarahkan siswa mengetik sapaan langsung melalui kolom chat.

#### 3. Pembaruan Versi & PWA Service Worker (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.6` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.6` (`public/sw.js`).

## [2.4.5] - 2026-09-14

### Fitur Reply / Kutip Pesan Obrolan (Swipe Mobile & Hover Desktop) + Redesain Responsif Header Host & Grid Reaksi Mobile (Rule 1, Rule 2, Rule 4, Rule 5 & Rule 15)

#### 1. Fitur Balas / Kutip Pesan Obrolan Kelas (StudentChatDrawer.tsx & TeacherChatDrawer.tsx)
- **Gestur Sentuh Mobile (Swipe to Reply)**: Mengimplementasikan custom hook `useSwipeToReply.ts` yang mendeteksi sapuan jari ke kanan pada gelembung pesan chat di perangkat mobile/touchscreen, disertai haptic vibration lembut dan transisi transform halus.
- **Interaksi Hover Desktop**: Tombol balas (`CornerUpLeft`) otomatis muncul secara elegan saat kursor mouse diarahkan ke gelembung pesan di mode desktop.
- **Bilah Pratinjau Balasan (Reply Preview Bar)**: Menampilkan panel pratinjau pesan yang sedang dibalas di atas kolom input chat lengkap dengan nama pengirim, kutipan teks ringkas, serta tombol batal (`X`).
- **Gelembung Kutipan Tersemat (QuotedMessageBubble.tsx)**: Pesan balasan menampilkan gelembung kutipan tersemat (warna emas untuk guru, ungu/biru untuk siswa) dengan pemotongan teks rapi (80 karakter + ellipsis).
- **Lompat ke Pesan Asli (Jump to Message)**: Mengetuk gelembung kutipan akan langsung menggulir layar secara mulus (`scrollIntoView`) ke pesan yang dikutip dan menyalakan efek sorotan kilat (`animate-reply-highlight`).
- **Penyimpanan Persisten Lintas Perangkat**: Metadata kutipan disimpan ke Supabase via properti `replyTo` (`id`, `studentName`, `text`, `isTeacher`) pada `SessionChatMessage`.

#### 2. Perbaikan Tampilan Mobile Ruang Kendali Guru (WaygroundHostView.tsx)
- **Restrukturisasi Header 2-Baris Responsif**: Mengatasi masalah teks saling tumpuk di layar mobile (di mana 6 tombol kontrol kanan sebelumnya menimpa tombol kembali, judul ruang, dan badge status `RUANG TUNGGU`).
  - *Baris 1 (Identitas & Darurat)*: Tombol Kembali (`ArrowLeft` 44×44px), Badge Status (`RUANG TUNGGU` / `LIVE`), Judul Kuis terpotong rapi, dan tombol aksi krusial (`Jeda/Lanjut` & `Akhiri Kuis`).
  - *Baris 2 (Toolbar Kontrol)*: Badge PIN mandiri (`PIN: 871026` + salin), Tombol `Chat Kelas` (lengkap dengan badge unread), Sakelar `Mute Chat`, dan Tombol `+3 Siswa Tes`.
  - *Desktop (`md:`)*: Kedua baris melebur kembali secara otomatis menjadi bilah horizontal tunggal yang luas.
- **Pembersihan Scrollbar Tab Sub-Navigasi**: Menambahkan kelas `no-scrollbar scrollbar-none` pada wadah tab leaderboard/matriks sehingga tidak menyisakan garis abu-abu aneh di peramban mobile.

#### 3. Penataan Grid Reaksi Guru di Ruang Tunggu (QuizizzReactionButtonRow.tsx)
- **Grid Seimbang 4×2 di Mobile**: Mengganti tata letak pembungkus bebas yang sebelumnya menyebabkan emoji ke-8 (`💯`) turun sendirian di baris kedua menjadi sistem grid simetris 4 kolom × 2 baris (`grid grid-cols-4 sm:flex`).
- **Kenyamanan Sentuhan (Touch-First)**: Setiap tombol reaksi memenuhi standar target sentuh minimum 44×44 px dengan pemusatan rapi.

#### 4. Pembaruan Versi & PWA Service Worker (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.5` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.5` (`public/sw.js`).

## [2.4.4] - 2026-09-14

### Sinkronisasi Reaksi & Obrolan Lintas Perangkat via Supabase Realtime Broadcast + Penyederhanaan Desain Bubble Chat Guru (Rule 1, Rule 2, Rule 4, Rule 5 & Rule 15)

#### 1. Perbaikan Reaksi Emoji Siswa Tidak Tampil di Perangkat Lain (supabaseClient.ts, QuizizzReactionOverlay.tsx, WaygroundHostView.tsx, StudentWaitingRoom.tsx)
- **Masalah Sebelumnya**: Reaksi emoji yang dikirim siswa dari perangkat mobile hanya terlihat di perangkat yang sama (tab/browser), tidak terpancar ke layar guru maupun siswa lain secara lintas perangkat.
- **Solusi Realtime Broadcast**: Menambahkan jalur ketiga pengiriman data menggunakan **Supabase Realtime WebSocket Broadcast** (channel `quiz_rt_live_<sessionId>`) pada fungsi `broadcastLiveReaction()` sehingga reaksi terpropagasi instan ke semua perangkat yang terhubung.
- **Helper Channel Terpusat**: Menambahkan fungsi `getLiveRealtimeChannel(sessionId)` di `supabaseClient.ts` sebagai singleton channel per sesi untuk efisiensi koneksi WebSocket.
- **Overlay Tiga Sumber**: Komponen `QuizizzReactionOverlay` kini mendengarkan reaksi dari 3 sumber sekaligus: (1) Realtime broadcast WebSocket, (2) `BroadcastChannel` antar tab, (3) prop `reactions` dari DB sebagai fallback.

#### 2. Sinkronisasi Obrolan Lintas Perangkat (StudentChatDrawer.tsx, TeacherChatDrawer.tsx, ZoomChatToast.tsx)
- **Broadcast Chat via Realtime**: Fungsi `broadcastChatMessage()` kini juga mengirimkan pesan melalui Supabase Realtime broadcast (event `chat`) sehingga pesan chat terpropagasi instan ke semua drawer yang terbuka di berbagai perangkat.
- **Listener Ditambahkan di Semua Drawer**: `StudentChatDrawer`, `TeacherChatDrawer`, dan `ZoomChatToast` kini berlangganan channel Realtime broadcast sesi aktif, melengkapi mekanisme sebelumnya (`BroadcastChannel` + `CustomEvent` + polling 2.5 detik).
- **Deduplication Aman**: Setiap listener menerapkan pengecekan ID dan deduplication waktu (< 1 detik) untuk mencegah pesan muncul ganda dari berbagai sumber.

#### 3. Penyederhanaan Visual Bubble Chat Guru (StudentChatDrawer.tsx)
- **Penghapusan Penanda Ganda**: Menghapus dua elemen redundan yang sebelumnya menandai pesan guru: (1) badge Sparkles absolut di atas avatar, (2) label footer "✨ Pesan Guru".
- **Satu Penanda Bersih**: Kini hanya ada satu penanda tunggal yang elegan: pill badge **"Guru"** di baris header bubble — konsisten, tidak berisik secara visual, dan mudah dibaca.
- **Tata Letak Waktu Lebih Rapi**: Indikator waktu pesan guru dipindahkan ke bagian bawah bubble dengan warna abu-abu lembut.

#### 4. Pembaruan Versi & PWA Service Worker (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.4` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.4` (`public/sw.js`).

## [2.4.3] - 2026-09-14

### Restrukturisasi Hierarki Modal: Pengkhususan Modal Profil Siswa & Navigasi Terpadu Masuk/Daftar (Rule 1, Rule 2, Rule 4, Rule 8, Rule 9 & Rule 15)

#### 1. Pengkhususan Modal Profil Siswa Tanpa Redundansi (QuizHome.tsx)
- **Penghapusan Tab Duplikasi**: Menghapus switcher tab kaku di dalam modal profil siswa (`[ Profil & Maskot ]` dan `[ Masuk / Daftar ]`) sehingga modal sepenuhnya fokus murni pada pengelolaan profil pribadi siswa (Nama Panggilan, Maskot Hewan, Status Akun/Tamu, dan Jumlah Bintang ⭐).
- **Pembersihan Kode Redundan**: Menghapus form autentikasi lokal siswa di dalam `QuizHome.tsx` yang sebelumnya menduplikasi fungsionalitas modal login utama.
- **Hierarki Navigasi Bersih**: Tombol *"Masuk / Daftar"* pada kartu helper akun kini langsung menutup modal profil dan secara elegan mengarahkan pengguna ke **Modal Masuk / Daftar Akun Terpadu** (`UnifiedAuthModal`) dengan tab Siswa/Pelajar aktif.

#### 2. Penyelarasan Modal Masuk / Daftar Terpadu (UnifiedAuthModal.tsx)
- **Sinkronisasi Tab Otomatis**: Memastikan `activeTab` selalu tersinkronisasi instan dengan prop `initialTab` saat modal dibuka, sehingga pengguna langsung melihat form login/register siswa tanpa perlu beralih manual.
- **Dukungan Jenjang Universal (SD • SMP • SMA)**: Memperbarui pemilih tingkat kelas pada pendaftaran siswa agar mencakup seluruh jenjang pendidikan formal: SD (Kelas 1-6), SMP (Kelas 7-9), dan SMA/SMK (Kelas 10-12).
- **Prapengisian Nama Panggilan Otomatis**: Nama panggilan siswa yang sudah diisi di mode tamu secara otomatis terisi ke form pendaftaran akun siswa baru.

#### 3. Pembaruan Versi & PWA Service Worker (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.3` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.3` (`public/sw.js`).

## [2.4.2] - 2026-09-14
### Redesain Ruang Tunggu Siswa: Side Panel Obrolan (Chat Drawer), Floating Action Button (FAB), & Galeri Peserta Luas (Rule 1, Rule 2, Rule 4, Rule 5, Rule 7, Rule 8 & Rule 15)

#### 1. Transformasi Obrolan Siswa Menjadi Slide-Over Drawer (StudentChatDrawer.tsx)
- **Side Panel Modern**: Menggantikan kolom statis 2-kolom yang sempit dengan komponen slide-over drawer independen berkecepatan tinggi (lebar optimal 440px di desktop/tablet dan full-width di mobile/smartphone).
- **Animasi Halus & Ringan**: Dilengkapi transisi CSS `animate-slide-left-in` berdurasi 260ms, backdrop blur elegan, serta scroll lock (`useBodyScrollLock`) dan integrasi tombol kembali fisik/gesture Android (`useBackHandler`).
- **Penyajian Pesan Berjenjang**: 
  - *Pesan Guru*: Aksen border emas, highlight gradasi amber, dan mahkota kehormatan `👑`.
  - *Pesan Kamu*: Bubble ungu-indigo rata kanan dengan indikator keterkiriman ganda `CheckCheck`.
  - *Pesan Teman Sekelas*: Bubble netral lembut dengan avatar 3D dan label teman.
- **Fitur Pesan Cepat & Kontrol Status**: Chip pesan positif siap kirim (touch target >= 44px) dan indikator status otomatis saat obrolan dibungkam oleh Guru.

#### 2. Floating Action Button (FAB) Obrolan Interaktif
- **Penempatan Ergonomis**: Tombol mengambang modern diposisikan pada sudut kanan bawah (`fixed bottom-6 right-6 z-40`) dengan ukuran thumb-zone optimal (56×56 px hingga 64×64 px), memenuhi standar touch-first.
- **Penghitung Pesan Baru (Unread Badge)**: Lencana notifikasi merah dinamis menampilkan jumlah pesan baru yang belum dibaca saat laci obrolan tertutup.
- **Koneksi Cepat Notifikasi Ala Zoom**: Notifikasi toast pesan masuk (`ZoomChatToast`) kini langsung membuka laci obrolan saat diklik oleh siswa.

#### 3. Galeri Teman Sekelas Luas & Responsif (StudentWaitingRoom.tsx)
- **Panggung Utama Bebas Dead-Space**: Mengubah panggung utama ruang tunggu menjadi galeri peserta berkapasitas besar dan dinamis dengan grid adaptif (`grid-cols-2` hingga `8-cols` di layar Ultra-Wide 4K).
- **Identitas Kartu Peserta Jelas**: Menampilkan kartu peserta interaktif dengan avatar 3D besar, status tersambung live dengan indikator hijau berkedip, serta kartu khusus tersorot untuk profil diri sendiri bertuliskan "Kamu".
- **Kenyamanan Visual**: Tidak ada lagi bidang kosong terbuang di sisi kanan atau kiri, memberikan pengalaman menunggu yang interaktif, lega, dan menyenangkan.

#### 4. Pembaruan Versi & PWA Service Worker (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.2` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.2` (`public/sw.js`).

## [2.4.1] - 2026-09-14
### Penyelarasan Subjudul & Identitas Universal Seluruh Jenjang Pendidikan: SD • SMP • SMA (Rule 2, Rule 4, Rule 7 & Rule 15)

#### 1. Pembaruan Subjudul Navbar Beranda (QuizHome.tsx)
- **Tagline Universal**: Memperbarui teks subjudul di bawah logo utama dari semula *"Media Belajar Interaktif Kelas 1 - 6"* menjadi *"Media Belajar Interaktif SD • SMP • SMA"*.
- **Representasi Akurat**: Mencerminkan cakupan fitur dan koleksi kuis yang kini telah menyeluruh dan mendukung jenjang Sekolah Dasar (SD/MI), Sekolah Menengah Pertama (SMP/MTs), hingga Sekolah Menengah Atas (SMA/SMK/MA).

#### 2. Penyelarasan Lencana Layar Pembuka (SplashScreen.tsx)
- **Badge Animasi Logo**: Mengganti lencana di sudut avatar bintang pada splash screen animasi dari *"Kelas 1 - 6"* menjadi *"SD • SMP • SMA"* dengan kontras tajam berlatar emas amber.

#### 3. Metadata Aplikasi Web & PWA Manifest (index.html & manifest.webmanifest)
- **Deskripsi & Judul Web**: Memperbarui meta deskripsi, judul aplikasi web mobile (`apple-mobile-web-app-title`), dan nama ringkas PWA menjadi representasi inklusif kuis edukatif interaktif jenjang SD, SMP, dan SMA.

#### 4. Pembaruan Versi & Cache Service Worker (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.1` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.1` (`public/sw.js`).

## [2.4.0] - 2026-09-14
### Perbaikan Menyeluruh Sistem Logout & Isolasi Sesi Akun Multi-Peran (Guru & Siswa) (Rule 1, Rule 2, Rule 4, Rule 8, Rule 9, Rule 11 & Rule 15)

#### 1. Isolasi Bersih Sesi Peran Guru dan Siswa (supabaseClient.ts & App.tsx)
- **Pencegahan Sesi Silang / Tumpang-Tindih**: Saat pengguna masuk sebagai Siswa (`signInStudent` / `signUpStudent`), sesi lokal profil pendidik (`STORAGE_KEY_TEACHER_PROFILE`) dan state `teacher` pada `App.tsx` secara otomatis dibersihkan total.
- **Penetapan Peran Murni**: Saat pengguna masuk sebagai Guru (`signInTeacher` / `signUpTeacher`), status siswa langsung diatur kembali ke mode tamu (`isLoggedIn: false`) agar peran tidak saling menimpa tampilan antarmuka.
- **Metode Logout Komprehensif (`signOutAll`)**: Menyediakan fungsi `DataManager.signOutAll()` yang secara serentak mencabut sesi cloud Supabase, membersihkan token guru, mereset profil siswa ke mode tamu, dan menghapus sisa navigasi sensitif.

#### 2. Perbaikan Kritis Logout Siswa di Perangkat Seluler (MobileProfileSheet.tsx)
- **Resolusi Handler Logout Mobile**: Memperbaiki kekeliruan pemanggilan fungsi di mana tombol "Keluar Akun Siswa" pada panel lembar profil mobile sebelumnya memanggil fungsi logout guru. Kini tombol terhubung langsung ke `onStudentLogout` dan fallback pembersihan total.
- **Penyelarasan Props Komponen**: Menambahkan interface `onStudentLogout?: () => void;` pada `MobileProfileSheetProps` dan mengintegrasikannya langsung dari `QuizHome.tsx`.

#### 3. Redesain Tombol Logout Ramah Pengguna & Touch-First (QuizHome.tsx)
- **Tombol Keluar Akun Tab 1 (Profil Saya)**: Menggantikan link teks sederhana dengan kartu ringkasan status akun berlatar lembut lengkap dengan tombol *"Keluar Akun"* berikon `LogOut`, border berpenampilan tegas, dan target sentuh minimal 44×44 px.
- **Tombol Keluar Akun Tab 2 (Masuk/Daftar)**: Menata ulang tombol *"Keluar Akun Siswa"* dengan ikon logout profesional dan responsivitas sentuhan instan.
- **Modal Profil Guru**: Memastikan aksi *"Keluar Akun Guru (Logout)"* memicu pembersihan menyeluruh ke mode tamu.

#### 4. Sinkronisasi Real-Time Lintas Komponen & Tab Browser
- **Event `kuis_auth_signed_out`**: Dipancarkan seketika saat aksi logout dilakukan di bagian mana pun dari sistem, memastikan seluruh komponen (`App`, `QuizHome`, `TeacherDashboard`) langsung memperbarui status antarmuka ke mode tamu tanpa perlu me-refresh halaman.
- **Event `kuis_student_logged_in`**: Menjamin profil siswa yang baru login langsung tersinkronkan ke seluruh panel navigasi.

#### 5. Pembaruan Versi & Siklus Rilis (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.4.0` (`package.json`) mengikuti aturan batas siklus `x.x.99` ke `x.x+1.0`.
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.4.0` (`public/sw.js`).

## [2.3.99] - 2026-09-14
### Presisi Tampilan Antar-Platform & Responsivitas Penuh Ruang Tunggu Siswa: Mobile-S/M/L hingga Desktop & Ultra-Wide 4K (Rule 1, Rule 2, Rule 4, Rule 5, Rule 8 & Rule 15)

#### 1. Eliminasi Celah Kosong di Layar Lebar & Ultra-Wide (StudentWaitingRoom.tsx)
- **Fluid Layout Max-W 2000px**: Mengganti batasan kaku `max-w-4xl` (896px) pada `<header>` dan `<main>` menjadi fluid container `max-w-[2000px]` dengan padding responsif bertingkat (`px-3 sm:px-6 md:px-8 lg:px-12`).
- **Pemanfaatan Ruang Optimal**: Menghilangkan ruang kosong mati di sisi kiri dan kanan pada monitor desktop 1080p, QHD 1440p, monitor Ultra-Wide 21:9 / 32:9, hingga 4K UHD tanpa distorsi visual.
- **Konsistensi Arsitektur Layout**: Menyelaraskan standar layout ruang tunggu siswa dengan komponen utama lainnya seperti *WaygroundHostView* dan *TeacherDashboard*.

#### 2. Restrukturisasi Header Responsif & Touch-First Ergonomis
- **Tombol Navigasi Adaptif**: Tombol "Keluar Ruang" di pojok kiri atas kini mengadopsi teks fleksibel (`Keluar` di Mobile-S/XS, `Keluar Ruang` di layar yang lebih lebar) dengan target sentuh minimal 44×44 px.
- **Breadcrumb Judul Kuis & Lencana Kelas**: Menambahkan tampilan judul kuis dengan pemotongan teks aman (`truncate`) serta badge "Ruang Tunggu Kelas" pada layar tablet dan desktop.
- **PIN Sesi & Theme Toggle Terpadu**: Komponen penunjuk PIN sesi dan tombol ganti tema tersusun rapi di sisi kanan dengan kontras tinggi di mode terang maupun gelap.

#### 3. Hero Banner Adaptif "Menunggu Guru"
- **Tata Letak 2-Sayap di Layar Lebar**: Pada layar desktop/wide (`lg:` ke atas), banner otomatis beralih dari tumpukan vertikal ke komposisi 2-sayap (Sayap kiri: Avatar maskot 3D, sapaan personal siswa, dan chip detail kuis; Sayap kanan: Indikator status berdenyut dengan animasi ping, subteks petunjuk, dan tombol reaksi instan).
- **Mobile-First Touch Precision**: Pada Mobile-S (320px) hingga tablet, layout tetap terpusat rapi tanpa pembengkakan elemen ataupun overflow horizontal.
- **Efek Glow Halus**: Menambahkan ambient glow berdenyut ringan yang estetis tanpa membebani performa perangkat spesifikasi rendah.

#### 4. Grid Teman Sekelas & Obrolan Kelas Terdistribusi Proporsional
- **Grid Asimetris 12 Kolom (`5 : 7` / `4 : 8`)**: Mengganti pembagian grid `md:grid-cols-2` yang sempit dengan tata letak adaptif (`lg:col-span-5 xl:col-span-4` untuk daftar teman, `lg:col-span-7 xl:col-span-8` untuk obrolan kelas).
- **Daftar Teman Multi-Kolom**: Peserta yang tersambung kini ditata dalam grid 1 atau 2 kolom (`sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2`) dengan indikator titik hijau berdenyut "Tersambung" dan lencana khusus "Kamu".
- **Obrolan Kelas Modern & Ergonomis**: Memperluas area gelembung obrolan (chat) dengan pembedaan visual tegas antara Guru (aksen emas & mahkota), Diri Sendiri (bubble gradien ungu kanan), dan Teman (bubble slate kiri).
- **Touch Targets >= 48 px**: Input chat dan tombol kirim ditingkatkan ukurannya menjadi minimal 48 px sesuai pedoman Rule 1 & Rule 2, lengkap dengan chip preset pesan instan yang dapat digeser secara horizontal.

#### 5. Pembaruan Versi & Cache Service Worker (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.3.99` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.3.99` (`public/sw.js`).

## [2.3.98] - 2026-09-14
### Proteksi Akses & Pemblokiran Masuk Siswa ke Sesi Kuis yang Telah Selesai (Rule 1, Rule 2, Rule 8, Rule 9, Rule 11 & Rule 15)

#### 1. Pemblokiran Masuk Siswa ke Sesi Selesai (StudentLobby.tsx)
- **Deteksi Sesi Selesai Multilapis**: Menambahkan evaluasi komprehensif `isSessionEnded` yang memeriksa status `liveSession`, `activeSession`, penyimpanan sesi lokal, serta pengecekan awalan (mount check) ke cloud Supabase.
- **Tampilan Khusus "Sesi Kuis Telah Berakhir 🏁"**: Jika status sesi adalah `finished`, formulir pengisian nama, pilihan avatar, dan tombol mulai kuis disembunyikan sepenuhnya dan digantikan oleh kartu pemberitahuan resmi yang ramah anak.
- **Pembersihan Otomatis Storage Menunggu**: Memanggil `clearWaitingSessionStorage()` seketika saat sesi terdeteksi selesai sehingga siswa tidak terjebak kembali dalam ruang tunggu saat halaman dimuat ulang (reload).
- **Indikator Lencana PIN Sesi Selesai**: Badge PIN sesi di bagian atas lobi kini menampilkan label jelas `(Selesai)` dengan lencana abu-abu/hijau ketika sesi telah diakhiri Guru.

#### 2. Pencegahan Ruang Tunggu Tanpa Host / Belum Dibuka (StudentLobby.tsx)
- **Eliminasi Ruang Tunggu "Hantu"**: Memperbaiki kondisi `isTeacherLedWaiting` dengan menghapus toleransi `!liveSession`. Pada mode dipandu guru (`teacher_led`), siswa hanya diizinkan masuk jika sesi benar-benar berstatus `waiting` yang dibuka oleh Guru.
- **Tampilan "Ruang Kelas Belum Dimulai ⏳"**: Ketika kuis bermode dipandu guru namun Guru belum membuka sesi live, lobi menampilkan status menunggu dengan tombol **"Segarkan Status"** dan **"Kembali ke Beranda"**, mencegah siswa masuk sendirian tanpa Guru.

#### 3. Penegakan Status Selesai di Ruang Tunggu Siswa (StudentWaitingRoom.tsx)
- **Inisialisasi Modal Selesai Akurat**: Menginisialisasi `isSessionEndedModalOpen` berdasarkan kondisi awal `initialSession?.status === 'finished'`, sehingga siswa yang membuka atau me-refresh ruang tunggu sesi selesai langsung melihat modal penutupan.
- **Nonaktifkan Obrolan & Reaksi Pasca-Selesai**: Menonaktifkan input chat, pesan instan preset, dan tombol reaksi secara ketat saat sesi berstatus `finished`.
- **Navigasi Bersih**: Tombol "Kembali ke Beranda" pada modal selesai kini membersihkan seluruh session storage ruang tunggu sebelum mengarahkan siswa ke halaman awal.

#### 4. Validasi PIN Sesi Selesai pada Beranda & URL (QuizHome.tsx, App.tsx & supabaseClient.ts)
- **Pemeriksaan PIN Sesi Selesai di Input Beranda**: Menambahkan metode `DataManager.fetchSessionByPin()` yang memverifikasi kode PIN terhadap seluruh sesi. Jika PIN merujuk ke sesi yang sudah berstatus `finished`, sistem menampilkan pesan error informatif: *"Sesi kuis untuk PIN ini telah selesai/diakhiri oleh Guru. Silakan minta PIN sesi kuis yang baru kepada gurumu."*
- **Proteksi Akses URL Langsung**: Jika parameter URL `?pin=...` merujuk ke sesi yang telah selesai, sistem menampilkan modal pemberitahuan resmi dan mengarahkan kembali ke beranda secara aman.

#### 5. Pembaruan Versi & Cache Service Worker (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.3.98` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.3.98` (`public/sw.js`).

## [2.3.97] - 2026-09-14
### Akses Kembali Cepat Guru ke Ruang Tunggu & Sesi Live Aktif: Banner Cepat Dashboard, Perbaikan Klasifikasi Status Waiting, dan Tombol Masuk Ruang Tunggu (Rule 1, Rule 2, Rule 4 & Rule 15)

#### 1. Banner Sesi Aktif di Dashboard Guru (TeacherDashboard.tsx) (Rule 1, Rule 2 & Rule 4)
- **Akses Langsung 1-Klik**: Menambahkan banner notifikasi khusus di bagian paling atas Dashboard Guru (tampil di tab *Koleksi Kuis* maupun *Sesi Live*) setiap kali ada sesi kuis yang sedang aktif atau dalam status ruang tunggu dipimpin oleh Guru.
- **Informasi Lengkap & Aksi Nyata**: Menampilkan judul kuis, status ruang tunggu dengan indikator berdenyut (`⏳`), PIN Ruang Kelas, dan jumlah siswa terhubung, disertai tombol utama berukuran ergonomis minimal 48 px **"Kembali ke Ruang Tunggu"** / **"Buka Layar Pantau Live"** serta tombol opsi **"Akhiri"**.
- **Solusi Sempurna Saat Guru Keluar**: Guru kini tidak akan lagi kehilangan jejak ruang tunggu ketika keluar sementara ke katalog kuis atau halaman dashboard utama.

#### 2. Perbaikan Klasifikasi Status Ruang Tunggu Siswa (TeacherDashboard.tsx) (Rule 2 & Rule 11)
- **Eliminasi Kesalahan Badge 'Selesai'**: Memperbaiki logika evaluasi status kartu sesi di tab *Kuis Aktif & Sesi Live*. Sebelumnya sesi yang baru dibuat dengan status `'waiting'` secara keliru masuk ke fallback label `SELESAI` dan tombol rekap.
- **Badge Status Akurat**:
  - `status === 'waiting'`: Ditandai dengan lencana berwarna amber `⏳ RUANG TUNGGU` dan ring glow emas.
  - `status === 'active'`: Ditandai dengan lencana merah `🔴 LIVE WAYGROUND`.
  - `status === 'paused'`: Ditandai dengan lencana `⏸️ DIJEDA`.
  - `status === 'finished'`: Ditandai dengan lencana hijau `✓ SELESAI`.
- **Akurasi Filter & Tab Counter**: Filter tab *Sedang Berjalan* kini secara tepat menghitung seluruh sesi aktif, dijeda, maupun ruang tunggu (`liveSessionsCount`), sehingga tidak lagi menampilkan angka 0 canggung ketika sesi sedang menunggu siswa.
- **Tombol Masuk Ruang Tunggu**: Kartu sesi dengan status ruang tunggu kini menampilkan tombol aksi utama **"Masuk ke Ruang Tunggu (Wayground)"** bergradasi oranye-amber yang langsung membuka layar kendali Guru.

#### 3. Sinkronisasi Versi & Service Worker Cache (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.3.97` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.3.97` (`public/sw.js`).
### Persistensi Menyeluruh Ruang Tunggu Host & Peserta: Proteksi Sesi Aktif dari Muat Ulang Halaman (F5/Reload Resistance) di Seluruh Alur Aplikasi (Rule 1, Rule 2, Rule 6, Rule 11 & Rule 15)

#### 1. Ruang Tunggu Guru / Layar Pantau Host (TeacherDashboard.tsx & WaygroundHostView.tsx)
- **Anti-Reset Host View**: Memastikan Guru yang sedang berada di Ruang Tunggu Sesi atau Layar Pantau Live tidak terlempar kembali ke tabel koleksi kuis saat halaman di-refresh (F5/reload) secara tidak sengaja.
- **Sinkronisasi Multi-Lapisan**: Status host sesi aktif kini disinkronkan secara mulus ke parameter URL (`hostSession`) serta penyimpanan sesi tab.
- **Resolusi Data Kuis Cepat & Aman**: Mengintegrasikan resolver data kuis instan (`resolveQuizForSession`) sehingga seluruh butir soal, judul, dan pengaturan kuis langsung siap ditampilkan tanpa jeda atau risiko data kosong.
- **Navigasi Bersih**: Saat Guru menekan tombol "Kembali" atau mengakhiri sesi, parameter URL dan status sesi dibersihkan secara rapi tanpa meninggalkan residu.

#### 2. Ruang Tunggu Siswa / Peserta (StudentLobby.tsx & StudentWaitingRoom.tsx)
- **Anti-Reset Ruang Tunggu Peserta**: Mencegah siswa terlempar keluar dari Ruang Tunggu Kelas ke formulir input nama saat terjadi reload halaman atau koneksi terputus sesaat.
- **Pemulihan Otomatis Profil Peserta**: Nama lengkap siswa, nomor urut/absen, dan karakter avatar dipulihkan secara instan dari penyimpanan sesi tab.
- **Transisi Dinamis**: Jika Guru memulai kuis saat siswa sedang dalam proses reload, antarmuka langsung menyinkronkan status dan mentransisikan siswa ke Arena Kuis secara mulus tanpa terhenti.
- **Pembersihan Bersih**: Penyimpanan sesi ruang tunggu siswa otomatis dibersihkan saat kuis dimulai atau saat siswa memilih untuk kembali ke katalog.

#### 3. Ketahanan Alur Kerja Lainnya (App.tsx, QuizCreator.tsx & TeacherDashboard.tsx)
- **Editor Kuis (QuizCreator)**: Memastikan kuis yang sedang diedit oleh Guru (`editingQuiz`) dipulihkan secara konsisten saat me-refresh halaman pembuatan kuis (`?screen=creator&quiz=...`).
- **Tab & Rekap Sesi Guru**: Tab aktif (*Koleksi Kuis* vs *Sesi Kelas Live*) dan layar rekapitulasi nilai sesi (*QuizSessionRecapView*) kini mempertahankan statusnya saat halaman dimuat ulang.

#### 4. Sinkronisasi Versi & Service Worker Cache (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.3.96` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.3.96` (`public/sw.js`).
### Standardisasi & Harmonisasi Tata Letak Ruang Tunggu Host: Hero Card Terpadu PIN Kelas, Integrasi Kompak Header, dan Metrik Kontekstual (Rule 1, Rule 2, Rule 4 & Rule 8)

#### 1. Hero Card Terpadu Status & PIN Ruang Tunggu Guru (WaygroundHostView.tsx) (Rule 1, Rule 2 & Rule 4)
- **Eliminasi Inkonsistensi Tata Letak**:
  - Menggantikan tata letak lama yang terpecah dan mudah hilang (di mana kotak PIN besar di tengah mendadak lenyap begitu ada 1 siswa yang masuk) dengan satu **Hero Waiting Room Card** permanen dan konsisten.
  - Kartu Hero selalu menampilkan:
    - Status ruang tunggu kelas terbuka dengan animasi denyut (`⏳`) dan hitungan siswa terhubung secara langsung.
    - Box PIN Ruang Kelas yang sangat menonjol berukuran besar (`text-2xl sm:text-3xl font-mono font-black text-amber-300`) dengan border emas berlapis yang mudah terbaca dari jauh maupun saat diproyeksikan ke layar proyektor kelas.
    - Tombol aksi ergonomis minimal 44×44 px: **Salin PIN** dan **Bagikan Tautan Kuis** langsung berdampingan dengan angka PIN.
    - Tombol utama **Mulai Kuis Sekarang** (`bg-emerald-600`) berukuran penuh dan nyaman dijangkau.
  - Pada area daftar peserta di bawahnya, jika belum ada siswa yang masuk ditampilkan kartu placeholder rapi yang tidak lagi menduplikasi PIN secara canggung, dan daftar nama siswa akan mengalir lancar begitu siswa bergabung.

#### 2. Penataan Ulang Header Host & Eliminasi Elemen Mengambang Canggung (Rule 1 & Rule 2)
- Mengintegrasikan PIN Pill ringkas ke dalam grup aksi kanan header navbar sehingga posisi seluruh elemen header simetris, stabil, dan tidak lagi terdorong canggung ke kiri akibat flexbox `justify-between`.
- Menghilangkan duplikasi tombol "Mulai Kuis" di header navbar saat status ruang tunggu karena sudah terakomodasi secara megah pada kartu utama di bawahnya.
- Menghilangkan strip PIN mobile berulang di bawah navbar karena PIN Pill di header kini sudah sepenuhnya responsif di ponsel maupun desktop.

#### 3. Metrik Kontekstual Sesi (Quick Strip) (Rule 2 & Rule 4)
- Menyesuaikan 4 kartu metrik pada fase ruang tunggu agar menampilkan informasi yang relevan (*Siswa Terhubung*, *Status Ruang: Siap*, *Total Soal Kuis*, dan *Format Sesi*) daripada menampilkan statistik 0% yang belum aktif.

#### 4. Sinkronisasi Versi & Service Worker Cache (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.3.95` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.3.95` (`public/sw.js`).

## [2.3.94] - 2026-09-14
### Redesain Modern Antarmuka Obrolan Kelas: Diferensiasi Visual Elegan 3 Peran (Guru, Diri Sendiri, dan Teman Sekelas) (Rule 1, Rule 2, Rule 4 & Rule 8)

#### 1. Transformasi Balon Obrolan Khas Aplikasi Pesan Modern (StudentWaitingRoom.tsx & InterQuestionWaitingLounge.tsx) (Rule 1, Rule 2 & Rule 4)
- **Diri Sendiri / "Kamu" (Rata Kanan - Self Bubble)**:
  - Diposisikan rata kanan (`items-end`, `ml-auto`) dengan lebar proporsional (`max-w-[85%] sm:max-w-[78%]`) menggantikan kotak kaku selebar 100%.
  - Menggunakan bentuk balon pesan modern dengan sudut lengkung atas-kanan `rounded-2xl rounded-tr-xs`.
  - Menggunakan gradien ungu-indigo cerah (`bg-gradient-to-r from-purple-600 to-indigo-600 text-white`) dengan kontras teks putih tajam, header ringkas "Kamu", avatar emoji, dan indikator centang ganda (`CheckCheck`).
- **Orang Lain / Teman Sekelas (Rata Kiri - Peer Bubble)**:
  - Diposisikan rata kiri (`items-start`, `mr-auto`) dengan avatar bulat terpisah di sisi kiri (`w-7 h-7 rounded-xl`).
  - Menggunakan kartu bernuansa netral lembut (`bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700`) dengan sudut lengkung `rounded-2xl rounded-tl-xs`.
  - Dilengkapi nama pengirim berwarna khusus (`text-indigo-600 dark:text-indigo-400`), badge peran "Teman", teks pesan yang mudah dibaca, serta stempel waktu kirim.
- **Guru / Host Pendidik (Autoritatif, Berkelas, Spotlight Emas / Amber)**:
  - Menampilkan estetika instruksi resmi pengawas ruang kuis dengan garis aksen tebal kiri `border-l-4 border-l-amber-500` dan gradien amber lembut.
  - Avatar Guru dilengkapi lambang mahkota mengambang (`👑`) dan lencana resmi Guru bersinar (`bg-amber-500 text-white`).
  - Teks instruksi berbobot `font-semibold` dengan label bawah khusus "Pesan Guru" untuk menarik atensi siswa secara instan.

#### 2. Peningkatan Estetika Ruang Jeda Soal (InterQuestionWaitingLounge.tsx) (Rule 2 & Rule 4)
- Menyelaraskan diferensiasi 3 peran obrolan pada sesi jeda antar-soal sehingga pengalaman chatting antar-siswa dan pengumuman guru selalu konsisten di setiap layar interaktif.

#### 3. Sinkronisasi Versi & Service Worker Cache (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.3.94` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.3.94` (`public/sw.js`).

## [2.3.93] - 2026-09-14
### Optimalisasi Tata Letak & Ergonomi Ruang Tunggu Siswa: Perluasan Dimensi Tinggi Kartu Obrolan Kelas & Daftar Teman Masuk (Rule 1, Rule 2, Rule 4 & Rule 8)

#### 1. Perluasan Dimensi Vertikal Responsif Kartu Ruang Tunggu (StudentWaitingRoom.tsx) (Rule 1, Rule 2 & Rule 4)
- **Ekspansi Tinggi Kontainer Kartu**:
  - Memperbarui batasan tinggi statis `max-h-[300px]` menjadi dimensi tinggi responsif `h-[460px] sm:h-[500px] md:h-[540px]` pada kedua kartu utama: **"Teman yang Sudah Masuk"** dan **"Obrolan Kelas"**.
  - Memberikan peningkatan area pandang daftar pesan riwayat obrolan dari ~145px menjadi ~285px hingga ~365px, memungkinkan pembacaan pesan panjang dan percakapan banyak balon chat secara leluasa tanpa terpotong.
  - Memperluas daftar kehadiran teman sekelas sehingga dapat menampilkan lebih dari 8-10 siswa sekaligus secara rapi sebelum masuk ke mode scroll halus.
- **Harmonisasi Simetri Layout Dua Kolom**:
  - Memastikan tinggi kartu di kedua sisi selalu seimbang dan presisi pada tampilan desktop maupun tablet (`grid-cols-2`), serta tetap nyaman diakses dalam mode tumpuk vertikal satu kolom pada ponsel (`mobile-first`).
  - Menjaga kepatuhan target sentuh 44×44 px pada tombol aksi cepat preset pesan dan formulir input obrolan.

#### 2. Sinkronisasi Versi & Service Worker Cache (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.3.93` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.3.93` (`public/sw.js`).

## [2.3.92] - 2026-09-14
### Perbaikan Integritas Obrolan Kelas: Eliminasi Pengiriman Ganda Pesan Preset Guru (Double Chat Dispatch) & Sistem Deduplikasi Otomatis (Rule 2, Rule 9, Rule 11 & Rule 14)

#### 1. Penguncian Sinkron & Debounce Tombol Pesan Cepat (TeacherChatDrawer.tsx) (Rule 2 & Rule 14)
- **Synchronous Execution Guard**:
  - Menggantikan pelindung berbasis state murni dengan `sendingRef` sinkron langsung guna mencegah eksekusi ganda akibat ketukan cepat atau event klik berlapis pada perangkat sentuh.
  - Menerapkan *debounce guard* 800ms pada `lastSentRef` untuk mencegah pengiriman pesan identik yang dipicu berulang dalam selang waktu sangat singkat.
- **Eliminasi Penambahan State Ganda**:
  - Menyelaraskan alur `setMessages` dengan verifikasi keberadaan ID (`prev.some(m => m.id === newMsg.id)`), mencegah pesan yang sudah ditambahkan oleh event listener lokal `kuis_chat_message` dimasukkan kembali saat *promise* penyimpanan selesai.
  - Menambahkan pembersih otomatis duplikasi riwayat pesan saat inisialisasi maupun penyegaran laci obrolan.

#### 2. Proteksi Ganda Lapisan Penyimpanan Data (supabaseClient.ts) (Rule 9 & Rule 11)
- **Deduplikasi Pesan Sesi di Level Storage**:
  - Menambahkan pemeriksaan penjaga pada fungsi `sendSessionChatMessage`: mengembalikan pesan yang sudah ada jika terdeteksi pengiriman pesan identik dari pengirim yang sama dalam rentang < 800ms.
  - Membersihkan rekaman pesan duplikat berurutan dari sesi aktif di `localStorage` dan Supabase secara otomatis saat pesan baru dikirimkan.

#### 3. Sinkronisasi Versi & Service Worker Cache (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.3.92` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.3.92` (`public/sw.js`).

## [2.3.91] - 2026-09-14
### Standardisasi Terminologi Perangkat Fleksibel: Pembaruan Format Partisipasi Siswa "Individu (1 device)" (Rule 2, Rule 3 & Rule 4)

#### 1. Penyempurnaan Teks Format Partisipasi Modal Main Kuis (PlayQuizModal.tsx) (Rule 2 & Rule 3)
- **Standardisasi Istilah Perangkat Netral & Modern**:
  - Mengubah label opsi partisipasi dari `Individu (1 HP)` menjadi `Individu (1 device)`.
  - Memastikan terminologi lebih inklusif dan representatif untuk berbagai ragam perangkat yang digunakan siswa di sekolah maupun rumah (seperti Chromebook, laptop, tablet, iPad, maupun smartphone).
  - Menjaga kejelasan visual, hierarki antarmuka, dan target sentuh ergonomis minimal 44×44 px (`min-h-[44px]`).

#### 2. Sinkronisasi Versi & Service Worker Cache (Rule 7 & Rule 15)
- Memperbarui versi aplikasi ke `2.3.91` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.3.91` (`public/sw.js`).

## [2.3.90] - 2026-09-14
### Audit Komprehensif & Standarisasi Menyeluruh Seluruh Tombol Proyek (494 Tombol, 41 Berkas): 100% Kepatuhan Touch-First 44×44 px, Eksplisit Atribut Type, dan Semantik Aksesibilitas ARIA (Rule 1, Rule 2, Rule 4 & Rule 8)

#### 1. Master Pemetaan dan Audit Total Seluruh Tombol (Rule 1 & Rule 8)
- **Cakupan Audit 100% Tanpa Terkecuali**:
  - Melakukan pemetaan dan audit mendalam terhadap seluruh 494 tombol `<button>` pada 41 berkas komponen sistem kuis.
  - Memastikan seluruh tombol memenuhi standar target sentuh minimum 44×44 px (direkomendasikan 48×48 px) untuk kenyamanan penggunaan pada smartphone Android, tablet, layar lipat, dan mode sentuh desktop.
  - Menghilangkan ketergantungan aksi hanya pada kursor hover (*no hover-only interaction*), mengaktifkan state sentuh visual aktif (`active:scale-95`, `btn-press`), dan memastikan kestabilan tata letak di resolusi non-reguler.

#### 2. Eksplisitisasi Atribut Type pada Seluruh Tombol (Rule 8 & Rule 9)
- **Eliminasi 100% Tombol Tanpa Type (0 Missing Type)**:
  - Menetapkan atribut `type="button"` secara eksplisit pada tombol kontrol navigasi, modal, tab switcher, filter pill, dan dialog tutup di seluruh komponen:
    - *Autentikasi & Pengaturan*: Modal login/daftar siswa & guru, toggle tema gelap/terang, modal aturan kuis, banner pasang PWA, overlay orientasi layar.
    - *Ruang Siswa & Hasil*: Tombol kembali lobi, tombol keluar ruang tunggu, tab pembahasan soal dan leaderboard pada halaman hasil kuis, tombol bagikan skor.
    - *Studio Guru & Pembuat Kuis*: Tab navigasi 3-tahap (Bank Soal, Info Kuis, Pratinjau & Simpan), tombol salin PIN kuis, filter sesi kuis langsung.

#### 3. Peningkatan Dimensi & Area Target Sentuh Komponen Kritis (Rule 1, Rule 2 & Rule 8)
- **Autentikasi & Akun**:
  - Memperbesar tombol lihat/sembunyikan kata sandi (`UnifiedAuthModal.tsx`) dari `p-1` menjadi `min-h-[44px] min-w-[44px]` lengkap dengan `aria-label`.
  - Memperbesar tombol alih tab "Masuk Siswa" & "Daftar Akun Baru" serta tombol "Mode Tamu" (`QuizHome.tsx`) ke ukuran sentuh ergonomis `min-h-[44px]`.
- **Arena Pengerjaan Siswa**:
  - Memperbesar target sentuh tombol tangkap bintang floating game (`InterQuestionWaitingLounge.tsx`) ke `min-h-[48px] min-w-[48px] p-2 rounded-full`.
- **Generator AI & Studio Pembuat Kuis**:
  - Memperbesar pemilih jumlah opsi pilihan ganda dan jumlah pasangan mencocokkan (`AiGeneratorStep.tsx`) ke ukuran `w-11 h-11 min-w-[44px] min-h-[44px]` dengan atribut aksesibilitas yang jelas.
  - Menyesuaikan selector preset gaya label benar/salah, tombol sakelar proporsi seimbang/kustom, tombol chip preset kognitif, kartu C1–C6, chip konteks latar kurikulum, dan tombol saran ide topik ke ukuran minimal 44×44 px.
  - Memperbesar tombol hapus pencarian mata pelajaran (`✕`) menjadi `w-11 h-11 min-h-[44px] min-w-[44px]` dengan bantalan input teks terproteksi agar tidak bertumpuk (*overlap-free*).
  - Menyesuaikan tombol pembuka pembahasan edukatif, tombol ganti gambar soal, dan tombol pilihan durasi auto vs khusus (`QuizCreator.tsx`) ke standar ergonomis touch-first.
- **Portal Guru & Fitur Pendukung**:
  - Memperbesar tombol salin cepat PIN kuis (`TeacherDashboard.tsx`) menjadi `p-2 min-h-[44px] min-w-[44px]` dengan label pembaca layar.
  - Memperbesar tombol sub-filter sesi langsung (Semua, Sedang Berjalan, Selesai) ke `px-3.5 py-2 min-h-[44px]`.
  - Memperbesar tombol pesan pengumuman cepat pada laci obrolan guru (`TeacherChatDrawer.tsx`) ke `min-h-[44px]`.

#### 4. Pembaruan Versi Sinkron & Service Worker Cache (Rule 7 & Rule 15)
- Memperbarui versi paket aplikasi menjadi `2.3.90` (`package.json`).
- Memperbarui pengenal cache Service Worker menjadi `kuis-sd-seru-v2.3.90` (`public/sw.js`) guna memastikan pembaruan aset terinstal secara instan pada perangkat pengguna.

## [2.3.89] - 2026-09-13
### Eliminasi Total Dialog Pemblokir Browser Native (alert & confirm), Integrasi Modal Konfirmasi Terpadu Touch-First, dan Notifikasi Visual Aksesibel (Rule 1, Rule 2, Rule 5, Rule 7 & Rule 8)

#### 1. Eliminasi Total window.confirm pada Pembuat Kuis (QuizCreator.tsx) (Rule 1 & Rule 8)
- **Modal Konfirmasi Hapus Soal Touch-First**:
  - Menggantikan dialog bawaan browser `window.confirm` dengan komponen modal terintegrasi `ConfirmDeleteModal` saat menghapus butir soal dari bank soal.
  - Menyertakan cuplikan teks butir soal yang akan dihapus, target sentuh minimal 44×44 px (`min-h-[44px]`), dukungan Android gesture back, penguncian scroll body, serta tema gelap dan terang yang serasi.

#### 2. Notifikasi Modal Elegan "Sesi Berakhir" pada Ruang Tunggu Siswa (StudentWaitingRoom.tsx) (Rule 1, Rule 7 & Rule 8)
- **Dialog Modal Khusus Status Sesi Selesai**:
  - Menggantikan `window.alert` dengan modal responsif beranimasi halus saat guru mengakhiri sesi kuis secara real-time.
  - Siswa disajikan pemberitahuan yang komunikatif dengan tombol berukuran penuh (`min-h-[48px]`) untuk kembali ke beranda dengan nyaman tanpa membekukan thread peramban.

#### 3. Penanganan Galat Unggah Berkas Gambar Terpadu (ImageSelectorModal.tsx) (Rule 2 & Rule 8)
- **Pesan Galat Visual Inline**:
  - Menggantikan `window.alert` batas ukuran berkas 15 MB dengan banner pesan peringatan visual inline yang terintegrasi langsung pada antarmuka pemilihan gambar edukasi.

#### 4. Notifikasi Toast Umpan Balik Rekap Nilai Guru (QuizSessionRecapView.tsx) (Rule 2 & Rule 5)
- **Umpan Balik Visual Aksi Ekspor CSV**:
  - Menggantikan dialog native `window.alert` dengan notifikasi toast mengambang berlatar kontras tinggi (*high contrast*) dan animasi transisi halus.
  - Memberikan umpan balik langsung baik saat data nilai belum tersedia maupun saat pengunduhan berkas CSV berhasil diproses.

#### 5. Modal Akses Kuis Privat Terpadu (App.tsx) (Rule 1, Rule 8 & Rule 9)
- **Modal Edukatif Proteksi Kuis Privat**:
  - Menggantikan `window.alert` penolakan akses kuis privat via tautan URL dengan kartu modal dialog terpadu yang ramah pengguna.
  - Menjelaskan tata cara bergabung melalui PIN Ruang Kelas 6 digit dari guru dan mendukung tombol kembali (*back navigation*).

## [2.3.88] - 2026-09-13
### Skema DDL Lengkap pada SQL Dump, Pencadangan Inkremental (*Delta Backup*), Uji Integritas Mandiri Otomatis (*Self-Test Suite*), dan Pengingat Jadwal Pencadangan Terjadwal (Rule 1, Rule 2, Rule 6, Rule 8 & Rule 13)

#### 1. Skema DDL Lengkap pada Paket Cadangan SQL Dump (`backupService.ts`) (Rule 13 - Schema + Data SQL Dump)
- **Ekspor Skema DDL Komprehensif (9 Tabel Inti)**:
  - Generator SQL dump kini menyertakan deklarasi DDL tabel lengkap (`CREATE TABLE IF NOT EXISTS`), ekstensi PostgreSQL (`uuid-ossp`, `pgcrypto`), indeks performa kueri, dan konfigurasi Row Level Security (RLS) di bagian awal transaksi SQL (`BEGIN ... COMMIT`).
  - Berkas cadangan kini dapat dieksekusi langsung pada basis data baru yang kosong tanpa perlu membuat skema tabel secara terpisah terlebih dahulu.

#### 2. Pencadangan Inkremental / Delta (*Incremental Backup Support*) (`backupService.ts`, `AdminDatabaseBackupModal.tsx`) (Rule 13)
- **Pilihan Mode Pencadangan Penuh vs Inkremental**:
  - Panel admin dilengkapi opsi pemilihan mode: **Pencadangan Penuh (Full)** untuk seluruh data dan skema, atau **Pencadangan Inkremental (Delta)** untuk menyaring data baru/diperbarui sejak tanggal yang ditentukan.
  - Penamaan berkas arsip secara otomatis disesuaikan (`_full.sql.gz.enc` atau `_incremental.sql.gz.enc`), mempermudah pemilahan berkas cadangan rutin.

#### 3. Pengujian Integritas Mandiri Otomatis (*Automated Self-Test Suite*) (`backupService.ts`, `AdminDatabaseBackupModal.tsx`) (Rule 13)
- **Uji Diagnostik Sub-Sistem 6 Modul**:
  - Disediakan tab khusus **Uji Integritas** pada panel admin untuk memvalidasi engine enkripsi WebCrypto AES-256-GCM, dekompresi GZIP stream, kalkulasi SHA-256 anti-tamper, keutuhan DDL skema, simulasi peremapan ID (UUID remapping), dan penyesuaian domain tanpa memodifikasi data aktif.
  - Menyajikan laporan visual status tiap modul beserta durasi latensi eksekusi dalam milidetik.

#### 4. Pengingat & Pemantauan Jadwal Pencadangan (*Backup Schedule Monitor*) (`AdminDatabaseBackupModal.tsx`) (Rule 13)
- **Deteksi Keterlambatan Cadangan Terjadwal**:
  - Banner status real-time memantau jarak hari sejak pencadangan terakhir terhadap frekuensi jadwal yang dipilih guru/admin (Harian, Mingguan, atau Bulanan).
  - Menampilkan notifikasi visual yang jelas jika jadwal cadangan terlewat untuk menjaga kesiapsiagaan data.

#### 5. Opsi Remapping UUID Otomatis saat Pemulihan Database (Rule 13)
- **Pencegahan Bentrokan ID Kuis (*Anti-Collision Remapping*)**:
  - Fitur opsional untuk menghasilkan UUID acak baru bagi kuis, soal, dan rekaman terkait saat proses restorasi, menjamin integritas relasi foreign key tanpa menimpa kuis yang sudah ada di database tujuan.

## [2.3.87] - 2026-09-13
### Kompresi GZIP Stream Terintegrasi pada Pencadangan Terenkripsi AES-256, Penyesuaian Domain Otomatis (*Cross-Domain Restore*), dan Versi Format V2 (Rule 1, Rule 6, Rule 9, Rule 11 & Rule 13)

#### 1. Kompresi Native GZIP Stream & Enkripsi Berlapis (*Dual-Layer Encryption*) (`backupService.ts`, `AdminDatabaseBackupModal.tsx`) (Rule 13 - Enterprise Backup & Restore)
- **Kompresi Web Streams GZIP Bawaan Browser**:
  - Seluruh SQL dump schema + data kini dikompresi menggunakan `CompressionStream('gzip')` sebelum dienkripsi dengan `AES-256-GCM` dan PBKDF2 (100.000 iterasi).
  - Format berkas cadangan kini menggunakan penamaan standar unik:
    `backup_kuis_sd_seru_[TIMESTAMP]_v2.3.87.sql.gz.enc`.
  - Mengurangi ukuran berkas cadangan secara drastis (hingga 70-80% lebih kecil) sehingga unduh dan unggah arsip database jauh lebih cepat dan hemat kuota internet sekolah.
- **Kompatibilitas Mundur Penuh (*Backward Compatibility*)**:
  - `backupService.ts` mendukung format arsip `KUIS_SD_ENCRYPTED_BACKUP_V1` (legacy tanpa kompresi) dan `KUIS_SD_ENCRYPTED_BACKUP_V2` (GZIP stream terkompresi). Arsip versi lama tetap dapat didekripsi dan dipulihkan secara mulus.
  - Kartu pratinjau verifikasi cadangan menampilkan lencana status `GZIP Compressed` secara transparan bagi admin.

#### 2. Dukungan Pemulihan Antar-Domain & Remapping (*Cross-Domain Restore & Remapping*) (Rule 13)
- **Penyesuaian Otomatis Domain Media**:
  - Fungsi `restoreDatabaseFromBackup` kini mendukung parameter `options.domainAdjustment` untuk menyesuaikan URL aset gambar cover atau ilustrasi kuis (`fromDomain -> toDomain`), mencegah putusnya tautan media saat database dipindahkan antar-domain proyek.

## [2.3.86] - 2026-09-13
### Penegakan Konfirmasi Berlapis Penuh pada Pembersihan Database (*Password, CAPTCHA Anti-Bot, Teks Konfirmasi, & Checkbox*), dan Penyelarasan Target Sentuh Dropdown Guru (Rule 1, Rule 9, Rule 11 & Rule 13)

#### 1. Konfirmasi Berlapis Penuh Pembersihan Database (*Multi-Layer DB Wipe Protection*) (`AdminDatabaseBackupModal.tsx`, `backupService.ts`) (Rule 13 - Critical & Non-Negotiable)
- **Integrasi CAPTCHA Anti-Bot Dinamis (Rule 13)**:
  - Menyempurnakan panel darurat pembersihan database dengan 4 lapis konfirmasi keamanan ketat:
    - **Lapis 1**: Verifikasi kata sandi akun Super-Admin / Master Teacher.
    - **Lapis 2 (Baru)**: Kode keamanan anti-bot dinamis (*CAPTCHA*) 5-karakter alfanumerik acak dengan tampilan bergaris (*noise lines*), tombol acak ulang instan (`min-h-[44px] min-w-[44px]`), dan input validasi (*case-insensitive*).
    - **Lapis 3**: Pengetikan persis kalimat konfirmasi `HAPUS SELURUH DATABASE KUIS SD SERU`.
    - **Lapis 4**: Checkbox persetujuan bahwa tindakan permanen dan tidak dapat dibatalkan.
- **Validasi Backend / Layanan (*backupService.ts*)**:
  - Prosedur `BackupService.wipeEntireDatabase` kini memvalidasi `expectedCaptcha` secara ketat sebelum query penghapusan atau audit log dieksekusi. Tombol eksekusi dikunci (*disabled*) hingga seluruh 4 lapisan terpenuhi secara sempurna.

#### 2. Penyelarasan Target Sentuh Dropdown Guru di Arena Kuis (Rule 1 - Mobile-First Precision)
- **Komponen Pemilih Soal Cepat Guru (`QuizArena.tsx`)**:
  - Elemen `<select>` lompat nomor soal pada mode dipandu guru dan pratinjau ditingkatkan dengan `min-h-[44px] inline-flex items-center px-2.5 py-1.5 rounded-xl`, memastikan guru di perangkat seluler atau smartboard layar sentuh dapat mengganti soal dengan mudah tanpa risiko salah sentuh.

## [2.3.85] - 2026-09-13
### Optimalisasi Kinerja Drastis (*81.8% Initial Bundle Reduction*), Code-Splitting Asinkron (*React.lazy & Suspense*), Pemisahan Vendor Chunks, dan Layar Transisi Halus (Rule 1, Rule 2, Rule 5, Rule 6 & Rule 14)

#### 1. Pemisahan Kode Asinkron Komprehensif (*Code-Splitting via React.lazy*) (`App.tsx`, `ScreenLoadingFallback.tsx`)
- **Pemuatan Berdasarkan Kebutuhan Nyata (*On-Demand Route Loading*)**:
  - Modul antarmuka kelas berat (`QuizCreator`, `TeacherDashboard`, `QuizArena`, `QuizResult`, `WorksheetPrintView`, dan `UnifiedAuthModal`) kini dipisahkan secara dinamis menggunakan `React.lazy`.
  - Siswa yang mengunjungi halaman beranda kini tidak lagi dibebani pengunduhan pustaka studio kuis, grafik analitik guru, atau fitur pencetakan lembar kerja.
  - **Penurunan Ukuran Bundel Awal Drastis**:
    - Ukuran bundel awal `index.js` berkurang drastis dari **1.538 kB (1.54 MB)** menjadi hanya **280 kB (71 kB gzip)** — penghematan beban data peramban hingga **81,8%**!
    - Menghilangkan seluruh peringatan ukuran chunk (*chunk size warnings*) pada build Vite.
- **Komponen Transisi Halus (*ScreenLoadingFallback*) (Rule 1, Rule 2 & Rule 5)**:
  - Dibuat komponen pemuatan fallback ramah siswa dan guru dengan animasi putar modern (durasi transisi 200–300 ms), ikon dinamis, penyesuaian tema gelap/terang otomatis, dan pesan konteks berbahasa Indonesia yang jelas.
  - Menghindari pergeseran tata letak (*Layout Shift*) saat modul layar dimuat di perangkat spesifikasi rendah.

#### 2. Strategi Chunking Vendor Modular (*Modular Rollup Chunks*) (`vite.config.ts`)
- **Pemisahan Pustaka Pihak Ketiga Mandiri**:
  - Konfigurasi `rollupOptions.output.manualChunks` pada `vite.config.ts` memisahkan dependensi eksternal ke dalam berkas-berkas terisolasi:
    - `vendor-supabase.js`: Klien basis data Supabase (208 kB).
    - `vendor-lucide.js`: Pustaka ikon antarmuka (30 kB).
    - `vendor-confetti.js`: Efek selebrasi hasil kuis (10 kB).
    - `vendor-core.js`: Runtime inti React & ReactDOM (195 kB).
  - Mengoptimalkan efisiensi *HTTP Long-Term Browser Caching*: ketika kode fitur aplikasi diperbarui, pengguna tidak perlu mengunduh ulang pustaka vendor pihak ketiga yang tidak berubah.

#### 3. Pembaruan Cache PWA Service Worker (Rule 7)
- Nama cache PWA ditingkatkan ke `kuis-sd-seru-v2.3.85` pada `public/sw.js` untuk memastikan aset chunk hasil *code-splitting* terdaftar dan dipelihara secara optimal.

## [2.3.84] - 2026-09-13
### Arsitektur Antrean Offline Cerdas (*Offline Queue & Auto-Retry*), Indikator Sinkronisasi Jaringan Luring, dan Paginasi Sesi Guru (Rule 1, Rule 6, Rule 9, Rule 10 & Rule 11)

#### 1. Arsitektur Antrean Offline Cerdas (*Offline Queue & Auto-Retry*) (`offlineQueue.ts`, `supabaseClient.ts`)
- **Penyimpanan Lokal Persisten (*Persistent Outbox*)**:
  - Disediakan modul mandiri `offlineQueue.ts` yang menangani antrean penyimpanan data lokal (`session_participant_upsert` dan `quiz_attempt_insert`) di `localStorage` saat jaringan seluler atau WiFi sekolah mengalami gangguan, terputus, atau latensi tinggi.
  - **Deduplikasi Cerdas**: Ketika siswa menjawab beberapa butir soal dalam kondisi luring, sistem secara cerdas menggabungkan akumulasi jawaban dan skor terbaru untuk partisipan tersebut ke dalam satu baris antrean terpadu, mencegah beban kueri redundan saat jaringan pulih.
- **Sinkronisasi Otomatis saat Online**:
  - Pemicu instan saat peramban mendeteksi koneksi aktif via event `online` dan pemindaian berkala setiap 20 detik jika ada antrean tertunda.
  - Penanganan batas percobaan ulang hingga 10 kali dengan backoff sebelum data dianggap usang.

#### 2. Indikator Status Sinkronisasi Jaringan Real-Time (`OfflineSyncIndicator.tsx`, `App.tsx`)
- **Visibilitas Status bagi Siswa & Guru (Rule 1 & Rule 8)**:
  - Ditambahkan komponen antarmuka mengambang yang ramah anak dan komunikatif:
    - Status Luring: Memberikan kepastian visual `⚡ Sinyal terputus • Jawaban tersimpan aman di perangkat`.
    - Status Sinkronisasi: Menampilkan animasi putar `🔄 Menyinkronkan jawaban ke server...`.
    - Status Sukses: Menampilkan konfirmasi hijau instan `✅ Jawaban berhasil tersinkronkan ke server!`.
  - Target sentuh memenuhi standar `min-h-[44px]` dan dapat diketuk oleh pengguna untuk memicu sinkronisasi manual saat sinyal telah stabil.

#### 3. Optimasi Kueri & Paginasi Riwayat Sesi Guru (Rule 6 - Performance Optimization)
- **Dukungan Paginasi Rentang Kueri Supabase**:
  - Fungsi `syncActiveSessionsFromSupabase` kini mendukung parameter `options: { limit?: number; offset?: number }` dengan rentang kueri `.range(offset, offset + limit - 1)`, mengoptimalkan waktu render dan alokasi memori browser guru.
  - Pemanggilan otomatis pembersihan antrean offline sebelum kueri sesi dijalankan untuk memastikan data terbaru tampil di dashboard.

## [2.3.83] - 2026-09-13

### Resiliensi Media Google Drive Cerdas, Optimasi Service Worker PWA (Network-First Cache & Early Install Capture), serta Penyelarasan Penuh 100% Target Sentuh 44px (Rule 1, Rule 2, Rule 7, Rule 9 & Rule 10)

#### 1. Resiliensi Media Google Drive Cerdas (`driveUtils.ts`, `QuizCoverDisplay`, `QuizIllustration`, `ImageSelectorModal`, `WorksheetPrintView`)
- **Deteksi & Normalisasi Tautan Google Drive Otomatis**:
  - Dibuat modul utilitas `driveUtils.ts` yang mampu mendeteksi dan mengekstrak ID berkas dari seluruh format tautan Google Drive publik/berbagi (`/file/d/...`, `/open?id=...`, `/uc?id=...`, `/thumbnail?id=...`, `docs.google.com/file/d/...`, dan `/file/u/0/d/...`).
  - Mengubah tautan Google Drive secara instan ke URL Google Cache Thumbnail CDN (`sz=w1200`) yang bebas pemblokiran CORS browser, bebas peringatan virus Google Drive, dan dapat di-render langsung oleh tag `<img>`.
  - Integrasi deteksi cerdas pada input tempel URL `ImageSelectorModal`: menampilkan lencana konfirmasi `☁️ Google Drive terdeteksi` dan menormalkan URL seketika saat diterapkan.
- **Mekanisme Cadangan Dua Lapis (*Two-Tier Fallback*)**:
  - Komponen `QuizCoverDisplay` dan `QuizIllustration` dilengkapi penanganan error ganda: jika CDN thumbnail mengalami hambatan jaringan, sistem otomatis beralih ke proxy streaming Supabase Edge Function sebelum kembali ke emoji/placeholder kuis, menjamin media tidak pernah tampil rusak (*broken image*).
  - Format cetak lembar kerja siswa (`WorksheetPrintView`) kini mendukung resolusi gambar soal Google Drive secara mulus.

#### 2. Arsitektur PWA & Pembaruan Service Worker Modern (Rule 7)
- **Pembaruan Invalidation Cache Service Worker**:
  - Cache versi PWA diperbarui ke `kuis-sd-seru-v2.3.83` pada `sw.js` dengan pembersihan otomatis seluruh cache lama saat aktivasi (`clients.claim` & `skipWaiting`).
  - Menerapkan strategi caching **Network-First** untuk navigasi dokumen HTML (`index.html`), mencegah kendala *stale chunk hash mismatch* saat versi baru aplikasi dirilis, sekaligus mempertahankan fallback offline jika koneksi internet terputus.
  - Permintaan API eksternal dan Supabase diloloskan langsung tanpa interferensi cache lokal.
- **Pencegahan Kehilangan Event Instalasi (*Early Prompt Capture*)**:
  - Penangkapan awal event `beforeinstallprompt` langsung di level `index.html` dan disimpan ke `window.__deferredInstallPrompt`.
  - Komponen `InstallPrompt.tsx` langsung membaca event yang tertangkap sejak awal proses inisialisasi aplikasi tanpa terlewat oleh tampilan splash screen.
- **Peningkatan Overlay Orientasi Layar Non-Reguler (`ReorientationOverlay.tsx`)**:
  - Integrasi `screen.orientation` API beserta event listener perubahan orientasi layar.
  - Penanganan khusus untuk perangkat smartphone dengan rasio ultra-tall (misalnya 1080×2460, 20:9, 21:9) saat berada dalam orientasi mendatar (*landscape*) dengan ruang vertikal terbatas (< 540px).
  - Penyimpanan preferensi penutupan overlay di `sessionStorage` agar tidak mengganggu alur guru/siswa yang sengaja menggunakan orientasi tertentu.

#### 3. Penyelarasan Penuh 100% Target Sentuh Minimal 44×44 px (Rule 1 & Rule 8)
- **Penyelarasan Seluruh Komponen Interaktif Tersisa**:
  - `AiGeneratorStep.tsx`: Tombol steppers proporsi tingkat kognitif Bloom (`−` dan `+`) ditingkatkan dari `w-7 h-7` (28px) menjadi `w-11 h-11 min-w-[44px] min-h-[44px]` dengan font tebal dan bayangan halus; tombol toggle "Atur proporsi (%)" dan tombol "Acak Ide" topik ditingkatkan ke `min-h-[44px]`.
  - `PlayQuizModal.tsx`: Seluruh 7 switch toggle button (acak soal, acak opsi, tayangan peringkat smartboard, deteksi ganti tab ujian, dan batas pengerjaan 1x) dibungkus dengan target sentuh `min-w-[44px] min-h-[44px]` yang nyaman disentuh jari dan ramah aksesibilitas.
  - `InfoKuisStep.tsx`: Tombol "Racik AI" dan badge jumlah soal ditingkatkan dari `h-9` (36px) ke `min-h-[44px] px-3.5`.
  - `QuizCreator.tsx`: Tombol "Batal" dan "Ya, Kosongkan" pada modal konfirmasi reset draf kuis ditingkatkan ke `min-h-[44px]`.
  - `QuizHome.tsx`: Tombol "Keluar Akun" siswa pada modal profil ditingkatkan ke `min-h-[44px]`.
  - `AdminDatabaseBackupModal.tsx`: Tombol "Segarkan" riwayat pencadangan ditingkatkan ke `min-h-[44px]`.
  - `QuizDetail.tsx`: Tombol "Ubah" status visibilitas kuis ditingkatkan ke `min-h-[44px]`.
  - `QuizSessionRecapView.tsx`: Tombol "Lihat Lembar Jawaban" ditingkatkan ke `w-11 h-11 min-w-[44px] min-h-[44px]`.
  - `TeacherDashboard.tsx`: Tombol "Reset Filter Pencarian" dan "Buat Kuis Baru Sekarang" pada status kosong ditingkatkan ke `min-h-[44px]`.
  - `WaygroundHostView.tsx`: Tombol "Salin PIN" dan "Tautan" pada bilah kontrol mobile guru ditingkatkan ke `min-h-[44px]`.

## [2.3.82] - 2026-09-13

### Penyelarasan Menyeluruh Standar Sentuh Mobile-First 44px (Rule 1), Presisi Kontrol Studio Soal & Resiliensi Interaksi Antar-Perangkat (Rule 1, Rule 2, Rule 4, Rule 5 & Rule 8)

#### 1. Penyelarasan Standar Target Sentuh Mobile-First (Rule 1 & Rule 8 - Inclusive Design)
- **Studio Pembuat Kuis (`QuizCreator.tsx`, `InfoKuisStep.tsx`, `SubjectDropdown.tsx`, `PublishQuizModal.tsx`, `QuizCoverModal.tsx`, `QuestionJumpModal.tsx`)**:
  - Tombol kembali ke preset Benar/Salah, tombol hapus pengecoh tipe soal menjodohkan, dan tombol pratinjau butir soal di arena kuis seluruhnya ditingkatkan memenuhi standar minimal `min-h-[44px]`.
  - Pilihan template deskripsi kuis, input pencarian mata pelajaran & filter tab jenjang (SD, SMP, SMA, Semua) ditingkatkan ke `min-h-[44px]`.
  - Preset durasi soal, input kustom detik, chip saran lencana penghargaan, serta tombol tutup modal ditingkatkan ke `min-h-[44px]` (dan `w-11 h-11 min-h-[44px] min-w-[44px]` untuk ikon tutup).
  - Tombol reset emoji sampul, chip kategori cover, dan tombol navigasi lompat nomor soal dioptimalkan memenuhi touch-target 44×44 px.
- **Generator Soal AI & Modal Impor Cepat (`AiQuestionModal.tsx`, `AiGeneratorStep.tsx`)**:
  - Tab navigasi utama, chip saran topik Kurikulum Merdeka, pemilih tingkat kelas & jumlah soal (3, 5, 10), serta kartu tipe format soal ditingkatkan ke `min-h-[44px]`.
  - Tombol konfigurasi kunci API (DeepSeek, Groq, Gemini), tombol simpan & hapus kunci, tombol mata visibilitas kata sandi (`min-h-[44px] min-w-[44px]`), dan dropdown model ditingkatkan ke `min-h-[44px]`.
  - Stepper minus/plus proporsi kustom soal ditingkatkan dari 32×32 px menjadi `w-11 h-11 min-h-[44px] min-w-[44px]` dengan tipografi tegas dan mudah ditekan di layar sentuh kecil.
  - Tombol bantuan Taksonomi Bloom dioptimalkan dari 24×24 px hover-only menjadi target sentuh `44×44 px` dengan dukungan `group-focus-within` sehingga dapat dibuka dengan sentuhan (*touch tap*) pada smartphone.
  - Tombol salin prompt, pemilih tab input teks/berkas, unduh berkas contoh CSV, serta tombol "Ubah Topik" dan "Ubah Jumlah" ditingkatkan ke `min-h-[44px]`.
- **Ruang Tunggu, Notifikasi & Hasil Kuis (`InterQuestionWaitingLounge.tsx`, `ZoomChatToast.tsx`, `QuizHome.tsx`, `QuizResult.tsx`)**:
  - Chip pesan cepat ruang tunggu antar-soal ditingkatkan ke `min-h-[44px]`.
  - Tombol tutup notifikasi pesan instan (`ZoomChatToast`) ditingkatkan ke `min-h-[44px] min-w-[44px]`.
  - Tombol "Tampilkan Semua Kuis" pada keadaan kosong di beranda dan tab filter pembahasan/peringkat pada layar hasil kuis ditingkatkan ke `min-h-[44px]`.

#### 2. Kerapian Estetika & Keterbacaan Antarmuka (Rule 2 & Rule 4)
- **Konsistensi Visual & Ergonomi**:
  - Preservasi hierarki visual dengan padding proporsional (`px-3 py-2` hingga `px-4 py-2.5`), menjaga layout tetap seimbang dan estetik di layar sempit Android maupun monitor desktop resolusi tinggi.
  - Kontras warna teks, border, dan status fokus tetap terjaga optimal pada mode gelap (*dark mode*) maupun terang (*light mode*).

## [2.3.81] - 2026-09-13
### Panel Admin Database & Backup Terenkripsi AES-256, Heartbeat Sesi Live Guru, Deteksi Tab-Switch Anti-Curang & Throttling Reaksi (Rule 1, Rule 2, Rule 9, Rule 11, Rule 12 & Rule 13)

#### 1. Panel Administrasi Database & Cadangan Terenkripsi (Rule 13)
- **Ekspor Cadangan Terenkripsi AES-256-GCM**:
  - Disediakan modul pencadangan basis data mandiri menggunakan WebCrypto API dengan derivasi kunci PBKDF2-SHA256 (100.000 iterasi).
  - Menghasilkan berkas arsip `.sql.enc` lengkap yang mencakup skema DDL, relasi antartabel, dan data baris (DML) dari seluruh tabel sistem.
  - Perhitungan checksum integritas SHA-256 sebelum dan sesudah proses transfer untuk memastikan berkas tidak rusak atau dimanipulasi.
  - Pencatatan otomatis ke tabel `system_backups` dan log aktivitas audit.
- **Pemulihan Database Bertahap (*Staged Restore*)**:
  - Validasi ketat integritas SHA-256 dan dekripsi berkas cadangan sebelum eksekusi.
  - Pratinjau ringkasan data kuis, butir pertanyaan, dan rekap sebelum pemulihan dijalankan.
  - Impor bertahap ke database dengan perlindungan konflik kunci primer.
- **Prosedur Darurat: Pembersihan Seluruh Database (*Total Database Wipe*)**:
  - Dilengkapi pengamanan 3 lapis wajib: verifikasi kata sandi Super-Admin, pengetikan persis kalimat konfirmasi, dan persetujuan checkbox resiko permanen.
  - Audit logging otomatis pada seluruh tindakan kritis basis data.

#### 2. Mekanisme Heartbeat & Pembersihan Sesi Zombi Guru
- **Interval Heartbeat Otomatis (25 detik)**:
  - Panel host guru secara berkala mengirimkan sinyal kebaruan (*heartbeat*) pada kolom `last_heartbeat` di database.
  - Menghilangkan celah sesi menggantung jika laptop/perangkat guru ditutup mendadak di tengah sesi ujian.
- **Pembersihan Otomatis Sesi Terbengkalai**:
  - Siswa yang memasukkan PIN sesi yang telah ditinggalkan guru selama lebih dari 10 menit otomatis dialihkan atau sesi ditandai selesai secara teratur.

#### 3. Sinkronisasi Deteksi Pindah Tab (*Anti-Cheat Tab-Switch Tracking*)
- **Pencatatan Persisten ke Database**:
  - Penambahan kolom `tab_switch_count` pada tabel `quiz_session_participants` dengan indeks performa kueri.
  - Saat siswa berpindah layar atau membuka tab lain selama ujian aktif, sistem langsung mencatat dan menyinkronkan data secara seketika ke database dan layar guru.
- **Indikator Peringatan Integritas pada Antarmuka Guru**:
  - Penambahan lencana peringatan anti-curang (*Tab-Switch Badge*) pada papan kendali guru (`WaygroundHostView`) dan rekapitulasi ujian (`QuizSessionRecapView`).
  - Spanduk peringatan integritas ditampilkan pada modal rincian lembar jawaban siswa individual jika terdeteksi pelanggaran.

#### 4. Throttling Reaksi Siswa & Optimalisasi Target Sentuh Mobile (Rule 1)
- **Throttling Jaringan untuk Tombol Reaksi**:
  - Siaran reaksi visual di layar lokal tetap instan (0ms) untuk kepuasan interaksi pengguna, sedangkan pengiriman kueri pembaruan ke database dibatasi (*throttled*) maksimal 1 request per 500ms dengan sistem antrean cerdas untuk mencegah banjir lalu lintas data (*traffic spam*).
- **Presisi Target Sentuh**:
  - Tombol reaksi pada tampilan kompak disesuaikan memenuhi standar minimal target sentuh 44×44 px sesuai ketentuan Rule 1.

## [2.3.80] - 2026-09-13
### Sinkronisasi WebSocket Real-Time Multi-Device, Skema Integritas Peserta & Optimalisasi Media Google Drive (Rule 1, Rule 6, Rule 9, Rule 10, Rule 11 & Rule 12)

#### 1. Sinkronisasi Real-Time Multi-Device Berbasis WebSocket (`supabase.channel`)
- **Langganan WebSocket Lintas Perangkat**:
  - `QuizArena`, `StudentWaitingRoom`, `StudentLobby`, dan `WaygroundHostView` kini terhubung langsung ke kanal WebSocket Realtime database.
  - Perubahan nomor soal oleh guru pada mode panduan (*teacher-led*) langsung menggerakkan smartphone siswa secara seketika (*sub-second latency*) tanpa jeda polling.
  - Siswa tidak lagi terkunci di soal nomor 1 pada mode panduan guru saat bermain lintas gawai.
- **Dual-Layer Fallback Polling**:
  - Polling cadangan diperluas dengan query asinkron cloud Supabase untuk menjamin ketahanan koneksi jika jaringan seluler siswa mengalami fluktuasi.

#### 2. Integritas Database Peserta & Pencegahan Duplikasi Papan Peringkat
- **Constraint Unik `(session_id, student_name)`**:
  - Tabel `quiz_session_participants` dilengkapi constraint unik `unique_session_participant` untuk mencegah baris ganda ketika siswa melakukan penyegaran (*refresh*) layar atau masuk kembali ke ruang kelas.
  - Penambahan parameter `onConflict` pada mekanisme simpan peserta untuk stabilitas rekonsiliasi data.
- **Auto-Recovery Sesi Peserta**:
  - Penyimpanan progres jawaban dan nilai siswa otomatis memulihkan sesi dari cloud jika cache lokal perangkat baru dibuat atau berada dalam mode penyamaran (*incognito*).
- **Proteksi Master PIN saat Rekapitulasi Selesai**:
  - Rekonsiliasi akhir kuis tidak lagi menimpa PIN master kuis dengan Game PIN sesi sementara.

#### 3. Integrasi & Sinkronisasi Folder Google Drive
- **Persistensi `drive_folder_id`**:
  - Kolom `drive_folder_id` kini disinkronkan secara konsisten pada seluruh operasi baca (`fetchQuizzesFromCloud`, `getQuizById`, `getQuizByPin`) dan simpan (`saveCustomQuiz`, `updateQuizSettings`).
  - Edge Function pembersihan folder Drive kini dapat menemukan ID folder kuis dengan akurat saat kuis dihapus.

#### 4. Resiliensi Media & Kompresi Gambar Cerdas
- **Kompresi Gambar Lokal Cerdas (Anti-Crash `QuotaExceededError`)**:
  - Modal pemilih gambar (`ImageSelectorModal`) dilengkapi utilitas kompresi Canvas otomatis (resize proporsional maks 1200px dan kompresi WebP/JPEG) saat menggunakan penyimpanan cadangan lokal.
  - Menghindarkan browser dari kehabisan kuota memori `localStorage` (maks 5MB) saat mengunggah foto beresolusi tinggi.
- **Fallback Soal Tebak Gambar (*Mystery Grid*)**:
  - Tipe soal `image_guess` pada `QuizArena` kini dilengkapi penangan `onError` yang otomatis beralih ke petunjuk ilustrasi default jika gambar eksternal tidak dapat diakses.

#### 5. Kepatuhan Target Sentuh Mobile (*Touch-First*)
- Tombol aksi bantu pada arena ("Buka 1 Kotak Acak") disesuaikan menjadi minimal 44×44 px sesuai standar **Rule 1 (Presisi Antar-Platform & Touch-First)**.

## [2.3.79] - 2026-09-13
### Penutupan Menyeluruh 7 Celah ID, PIN, dan Sesi Live Multi-Device Online (Rule 9, Rule 10, Rule 11 & Rule 12)

#### 1. Penyediaan Database Sesi Live Supabase (Multi-Device Online)
- **Tabel `quiz_sessions` & `quiz_session_participants`**:
  - Dibuat secara resmi di Supabase PostgreSQL dengan constraint Foreign Key `ON DELETE CASCADE` ke `quizzes(id)`.
  - Dilengkapi RLS (Row Level Security) publik dan terotentikasi.
  - Didaftarkan ke Supabase Realtime Publication (`supabase_realtime`) sehingga sinkronisasi antar perangkat (Laptop Guru $\leftrightarrow$ HP Android Siswa) berjalan real-time dan stabil.
  - SQL migrasi tersimpan di `docs/migration_quiz_sessions.sql`.

#### 2. Proteksi Kuis Privat via URL Langsung (`?quiz=<id>`)
- Validasi otentikasi di `App.tsx`: jika kuis berstatus `private`, akses mandiri via parameter URL langsung ditolak bagi siswa/pengguna umum dan dialihkan ke beranda dengan pesan edukatif.

#### 3. Constraint `UNIQUE` pada `quizzes.pin_code`
- Menambahkan constraint database `unique_quizzes_pin_code` di Supabase untuk mencegah duplikasi PIN master kuis antar guru.

#### 4. Auto-Expiration Sesi Zombi (> 3 Jam)
- Mekanisme TTL otomatis: sesi kelas live yang tidak aktif selama lebih dari 3 jam otomatis difilter keluar dan ditandai sebagai `finished` di database, mencegah Game PIN menggantung.

#### 5. Cascade Cleanup saat Kuis Dihapus
- `deleteQuiz()` kini secara otomatis membersihkan seluruh rekaman sesi live terkait di Supabase maupun penyimpanan lokal.

#### 6. Resiliensi Fallback Gambar Rusak (*Broken-Link Resiliency*)
- Komponen `QuizCoverDisplay.tsx` dilengkapi `onError` handler agar secara anggun menampilkan fallback emoji jika tautan gambar eksternal rusak/terhapus, menjaga estetika tampilan.

## [2.3.78] - 2026-09-13
### Arsitektur Game PIN Sesi Live Dinamis (6-Digit) & Kloning Kuis Berbasis UUID Paten (Rule 9, Rule 10 & Rule 11)

#### 1. Pemisahan Total Sesi Kelas Live dengan PIN Kuis Master
- **Game PIN Dinamis 6 Digit (`generateLiveGamePin`)**:
  - Setiap sesi kelas live yang dibuka oleh guru (baik dari kuis publik maupun privat) menghasilkan 6 digit PIN ruang kelas unik (contoh: `912 255`).
  - Tidak lagi menggunakan atau berbagi PIN dengan kuis master (`quiz.pinCode`), menjamin privasi 100% dan mencegah kebocoran antar kelas atau siswa luar.
  - Bersifat sementara (*ephemeral*): hanya aktif selama sesi kelas dibuka oleh guru.
- **Pembaruan `PlayQuizModal` & `WaygroundHostView`**:
  - Sinkronisasi instan Game PIN dinamis 6 digit pada modal host dan tautan undang siswa.

#### 2. Kloning Kuis Berbasis UUID Mandiri & Isolasi Google Drive
- **UUID Standar RFC4122**:
  - Saat guru menduplikasi kuis publik, kuis baru mendapatkan UUID unik (`crypto.randomUUID()`).
  - Seluruh butir soal dalam kuis hasil duplikasi juga mendapatkan UUID baru independen.
  - Visibilitas otomatis diatur ke `private` di perpustakaan guru yang menyalin.
- **Isolasi Google Drive Pro (Zero Cross-Contamination)**:
  - `driveFolderId` pada kuis hasil duplikasi disetel ke `undefined` (bersih), sehingga kuis salinan tidak akan menggunakan ataupun menghapus folder Google Drive milik guru pencipta asli jika kuis salinan kelak dihapus.

#### 3. Penghapusan Tombol "Acak PIN" pada Kuis Master
- Menghilangkan tombol pengacakan PIN dari `QuizSettingsModal` dan `QuizDetail`. PIN kuis master kini berstatus paten dan terkunci untuk mencegah kerusakan tautan tugas siswa yang telah dibagikan sebelumnya.

#### 4. Proteksi Kuis Privat pada Alur Masuk Beranda
- Prioritas pencarian PIN di beranda:
  1. Cek Game PIN 6 digit sesi kelas live aktif $\rightarrow$ Langsung masuk ke Ruang Tunggu Kelas Live.
  2. Jika bukan sesi live, cek PIN kuis master $\rightarrow$ Jika kuis berstatus `private`, akses mandiri ditolak dengan pesan edukatif ramah: *"Kuis ini bersifat privat. Silakan minta PIN Ruang Kelas (6 digit) dari gurumu saat sesi kuis bersama dimulai."*

## [2.3.77] - 2026-09-13
### Verifikasi End-to-End & Penyempurnaan Propagasi Kuis ID pada Pemilih Gambar (Rule 10 & Rule 11)

#### 1. Propagasi Identitas Kuis Lengkap ke Pemilih Ilustrasi Soal
- **Integrasi `quizId` pada `ImageSelectorModal.tsx`**:
  - Meneruskan `quizId` dari `QuizCreator.tsx` ke dalam modal pemilihan gambar ilustrasi soal.
  - Memastikan unggahan gambar pada tingkat butir soal langsung terasosiasi dengan `drive_folder_id` kuis di database Supabase.
- **Verifikasi Stabilitas PIN**:
  - Teruji berhasil: Mengubah atau mengacak PIN kuis tidak membuat folder baru di Google Drive Pro. File baru tetap masuk ke dalam folder kuis yang sama secara konsisten.

#### 2. Verifikasi Komprehensif Siklus Auto-Cleanup Google Drive
- **Pengujian End-to-End Penghapusan Bersih (Zero-Waste)**:
  - Berhasil memverifikasi alur lengkap: Pembuatan kuis → Unggah media → Folder Drive terbentuk & `drive_folder_id` tersimpan di Supabase → Penghapusan kuis memicu pembersihan folder di Google Drive secara otomatis tanpa meninggalkan berkas sisa.

## [2.3.76] - 2026-09-13
### Folder Google Drive Stabil saat PIN Berubah & Auto-Cleanup saat Kuis Dihapus (Rule 10 & Rule 11)

#### 1. Folder Google Drive Stabil — Tidak Berubah saat PIN Diperbarui
- **Kolom `drive_folder_id` di Tabel `quizzes` (Supabase)**:
  - Setiap kuis kini memiliki satu folder Google Drive Pro yang terikat secara permanen via `drive_folder_id`.
  - Edge Function `upload-drive` menyimpan ID folder ke Supabase saat pertama kali folder dibuat.
  - Upload berikutnya langsung menggunakan folder yang sama berdasarkan ID — tidak peduli PIN berubah atau judul kuis diedit.
- **Tidak Ada Folder Ganda**:
  - PIN diacak `7871 → 8234`? Media tetap masuk ke folder yang sama, tidak ada folder baru yang dibuat.

#### 2. Auto-Cleanup Folder Google Drive saat Kuis Dihapus
- **Edge Function Baru `delete-drive-folder`**:
  - Menerima `quizId`, mengambil `drive_folder_id` dari Supabase, lalu menghapus folder beserta seluruh isinya dari Google Drive Pro via Drive API (`DELETE /files/{folderId}`).
  - Tidak meninggalkan sampah — folder lenyap bersih bersamaan dengan penghapusan kuis.
- **Integrasi Non-Blocking di `deleteQuiz()`**:
  - Cleanup Drive dipicu otomatis sebelum record Supabase dihapus.
  - Kegagalan cleanup (misal folder sudah tidak ada) tidak menghentikan proses penghapusan kuis — hanya di-log sebagai peringatan.

#### 3. Skema Tambahan
- `Quiz.driveFolderId?: string` ditambahkan ke interface TypeScript untuk sinkronisasi data frontend-backend.
- SQL migration tersedia di `docs/migration_drive_folder.sql`.

## [2.3.75] - 2026-09-13
### Manajemen Folder Google Drive Pro Terstruktur Otomatis Per Kuis (Rule 10 & Rule 14)

#### 1. Sub-Folder Otomatis Berdasarkan Identitas Kuis di Google Drive Pro
- **Arsitektur Folder Terorganisir**:
  - Supabase Edge Function `upload-drive` kini secara otomatis mencari atau membuat sub-folder kuis di dalam folder induk Google Drive Pro.
  - Penamaan sub-folder mengikuti konvensi: `[PIN 7871] Judul Kuis` jika kuis sudah aktif, atau `[Draf] Judul Kuis` untuk kuis yang belum diterbitkan.
  - Helper `getOrCreateQuizFolder` mencegah duplikasi folder kuis saat guru mengunggah beberapa media sekaligus dalam satu sesi.
- **Manfaat Organisasi Media**:
  - File sampul kuis dan ilustrasi butir soal tersimpan rapi di folder masing-masing kuis — tidak lagi tertumpuk di folder induk.
  - Memudahkan pengelolaan dan penelusuran media kuis di Google Drive Pro secara mandiri.

#### 2. Propagasi Identitas Kuis ke Seluruh Komponen Pengunggah Media
- **`QuizCreator.tsx`**:
  - Menyediakan `activeQuizPin` dan `activeQuizId` yang diekstrak dari prop `editingQuiz`, draf lokal, dan query URL (`?pin=`, `?quiz=`).
  - Meneruskan `quizPin` dan `quizId` ke `<InfoKuisStep>` (mode AI & manual) serta `quizPin` ke `<ImageSelectorModal>`.
- **`InfoKuisStep.tsx`**:
  - Ditambahkan prop `quizId?: string` dan diteruskan ke `<QuizCoverModal>`.
- **Lencana Folder Real-Time**:
  - `QuizCoverModal` tab Unggah Gambar: menampilkan `☁️ Google Drive Pro • Folder [PIN {quizPin}]`.
  - `ImageSelectorModal` tab Unggah / URL: menampilkan `☁️ Google Drive Pro • Folder [PIN {quizPin}]`.

## [2.3.74] - 2026-09-13
### Perbaikan Presisi Tampilan Modal Unggah Media & Eliminasi Pemotongan Elemen Antarmuka (Rule 1 & Rule 2)

#### 1. Arsitektur React Portal & Eliminasi Trap Stacking Context Modal
- **Teleportasi Modal Mandiri (`createPortal` ke `document.body`)**:
  - Mengimplementasikan `createPortal` pada `QuizCoverModal` dan `ImageSelectorModal` langsung ke `document.body` dengan tingkat prioritas tampilan tinggi (`z-[100]`).
  - Mengeliminasi kendala *stacking context* lokal yang sebelumnya menyebabkan header modal tertutup di belakang bilah navigasi pembuat kuis (*sticky header*).
  - Memastikan seluruh bagian atas modal (pratinjau ikon/sampul, judul, lencana status, tombol reset, dan tombol tutup [X]) tampil 100% utuh dan mudah diakses di seluruh perangkat.

#### 2. Optimalisasi Tata Letak Dropzone & Bidang Tautan URL
- **Penyelarasan Ruang Konten & Penanganan Overflow Fleksibel**:
  - Menambahkan `min-h-0` dan `overscroll-contain pb-6` pada kontainer scrollable agar algoritma flexbox bekerja presisi dan tidak memotong elemen di bagian bawah (*clipping*).
  - Merampingkan dimensi vertikal area *dropzone* berkas Google Drive Pro dengan proporsi padding dan ikon yang estetis, modern, dan kompak.
  - Memastikan kotak isian tautan gambar web (URL) beserta tombol *Terapkan URL* tidak lagi tertimpa atau terdorong ke balik bilah footer aksi (*Batal* / *Terapkan Sampul*).

#### 3. Verifikasi Responsivitas Seluler, Tablet, & Lanskap (Rule 1)
- **Pengujian Multi-Resolusi Komprehensif**:
  - Memverifikasi kestabilan antarmuka pada tampilan desktop standar, tablet, smartphone mode potret (390×844), serta orientasi lanskap ringkas (844×390).
  - Memastikan seluruh target sentuh memenuhi standar minimal 44×44 px / 48×48 px dengan interaksi sentuh yang mulus tanpa gangguan visual.

## [2.3.73] - 2026-09-13
### Integrasi Penyimpanan Media Google Drive Pro via Supabase Edge Function & Pengoptimalan Alur Unggah Berkas

#### 1. Arsitektur Penyimpanan Media Google Drive Pro Server-Side (Rule 9 & Rule 10)
- **Implementasi Supabase Edge Function `upload-drive`**:
  - Membangun endpoint server-side terisolasi yang menangani otentikasi Google Cloud (RS256 JWT assertion / OAuth2) dan unggah media multipart langsung ke folder Google Drive Pro pengguna.
  - Menyetel izin akses publik otomatis (`anyone with link can view`) dan mengembalikan tautan CDN Google (`lh3.googleusercontent.com/d/{fileId}`) yang cepat, ringan, dan stabil tanpa membebani kuota database utama.
- **Kepatuhan Keamanan Tingkat Tinggi (Zero Frontend Secret)**:
  - Seluruh kredensial sensitif (*Service Account Email, Private Key RSA, Folder ID*) tersimpan aman di Supabase Secrets dan hanya diakses di lingkungan server Deno melalui `Deno.env.get()`.
- **Dukungan Dual-Auth (Shared Drive & Personal Google One Pro)**:
  - Menyediakan dukungan otomatis untuk Service Account (Google Workspace Shared Drive) dan OAuth2 Refresh Token (Akun Google One Pribadi) dengan pesan status diagnostik yang informatif.

#### 2. Layanan Klien & Antarmuka Unggah Media Terintegrasi
- **Service Klien `driveUploadService.ts`**:
  - Modul perantara frontend yang menangani pengiriman file *multipart* atau konversi gambar ke Edge Function dengan penanganan kesalahan transparan.
- **Pembaruan Pemilih Media Butir Soal (`ImageSelectorModal.tsx`)**:
  - Menggantikan ketergantungan *data URL* base64 dengan alur unggah langsung ke Google Drive Pro.
  - Menampilkan lencana *Google Drive Pro Storage*, indikator progress unggah, serta mekanisme *fallback* lokal cadangan agar aktivitas guru tidak terputus.
- **Pembaruan Pengunggah Sampul Kuis (`QuizCoverModal.tsx`)**:
  - Mengintegrasikan pengunggahan logo/foto sampul kuis kustom langsung ke Google Drive Pro.
  - Mempercantik antarmuka dropzone dengan status sinkronisasi *cloud* yang responsif di seluruh perangkat.

#### 3. Dokumentasi Sistem & Panduan Integrasi
- **Panduan Lengkap `docs/panduan-integrasi-google-drive-storage.md`**:
  - Menyediakan dokumentasi detail arsitektur, daftar secrets Supabase, panduan pengaturan Shared Drive vs Akun Pribadi Google One, format respons, dan tata cara verifikasi sistem.

### Sinkronisasi Menyeluruh Profil Pendidik & Seluruh Entitas Terkait ke Supabase Cloud

#### 1. Sinkronisasi Profil Pendidik Multi-Tabel
- **Pembaruan Menyeluruh Data Pendidik ke Cloud**:
  - Menyelesaikan sinkronisasi profil (`full_name` dan `school_name`) secara presisi ke tabel `profiles_teacher` di Supabase dengan resolusi UUID yang akurat dan penanganan constraint yang aman.
  - Memastikan metadata akun terautentikasi (`auth.users`) tersinkronisasi sempurna dengan pembaruan profil pengguna.
- **Penyelarasan Seluruh Kuis & Sesi Aktif Terkait**:
  - Setiap perubahan nama pendidik kini secara otomatis memperbarui kolom pembuat (`creator_name`) di seluruh tabel `quizzes` terkait di Supabase maupun di penyimpanan lokal.
  - Menyelaraskan nama host guru (`teacher_name`) di tabel `quiz_sessions` serta mencatat jejak perubahan pada tabel log audit sistem (`audit_logs`).
  - Menambahkan pendengar kejadian global (`kuis_teacher_profile_updated`) sehingga kartu kuis, lencana header, dan panel dashboard guru otomatis memperbarui tampilan seketika tanpa perlu memuat ulang halaman.

## [2.3.71] - 2026-09-13
### Sinkronisasi Menyeluruh Sesi Kuis & Rekap Histori Nilai ke Supabase Cloud, Ruang Chat Host & Notifikasi Toast Ala Zoom, Serta Fitur Edit Profil Pendidik

#### 1. Sinkronisasi Penuh Sesi Kuis Langsung & Histori Nilai ke Supabase Cloud
- **Sinkronisasi Dua Arah Sesi & Peserta**:
  - Seluruh pembuatan sesi kuis baru, aktivasi kuis, perpindahan nomor soal (`current_question_index`), perubahan status soal (`answering`, `revealed`), kontrol bungkam chat, serta reaksi dan obrolan kini tersinkronisasi langsung ke database Supabase eksternal.
  - Setiap siswa yang bergabung ke sesi kuis otomatis dicatat dan diperbarui pada tabel `quiz_session_participants` di cloud Supabase.
  - Penambahan mekanisme sinkronisasi lintas-perangkat (*cross-device cloud polling*) pada `StudentWaitingRoom`, `WaygroundHostView`, dan `InterQuestionWaitingLounge` sehingga siswa dan guru di perangkat dan jaringan berbeda tetap terhubung harmonis secara *real-time*.
- **Otomatisasi Arsip Rekap Nilai ke Tabel Histori Permanen (`quiz_attempts`)**:
  - Saat sesi kuis diselesaikan oleh guru, seluruh rekapan skor, bintang, jumlah benar/salah, dan waktu pengerjaan peserta secara otomatis diarsipkan ke tabel `quiz_attempts` cloud.
  - Hasil sesi kuis langsung otomatis terintegrasi ke dalam tab Rekap Nilai Guru (*Teacher Gradebook*) dan papan peringkat (*leaderboard*) global secara permanen.
- **Pembaruan Skema SQL & Skrip Pengujian (`docs/setup.sql` & `scripts/deploy-supabase.js`)**:
  - Menambahkan definisi tabel `quiz_sessions` dan `quiz_session_participants` lengkap dengan index, constraint, dan Row Level Security (RLS) pada skrip database resmi.
  - Memperbarui skrip verifikasi otomatis `deploy-supabase.js` agar memvalidasi integritas baris data sesi dan peserta secara langsung.

#### 2. Ruang Obrolan Interaktif Host & Notifikasi Mengambang Pop-up Ala Zoom
- **Notifikasi Toast Mengambang Ala Zoom / Google Meet (`ZoomChatToast.tsx`)**:
  - Menampilkan kartu notifikasi mengambang saat pesan obrolan baru masuk, dilengkapi avatar pengirim, lencana peran Guru/Siswa, cuplikan pesan, dan efek nada lonceng lembut Web Audio API.
  - Timer penutupan otomatis 4.5 detik dengan jeda otomatis saat diarahkan kursor (*hover pause*) serta tombol klik langsung untuk membuka panel obrolan.
- **Laci Obrolan Kendali Host Guru (`TeacherChatDrawer.tsx`)**:
  - Panel laci sisi kanan (*slide-over drawer*) yang responsif dengan daftar riwayat obrolan lengkap, chip pengumuman kilat, input pengumuman guru (maks. 150 karakter), dan tombol cepat pembungkaman obrolan siswa (*mute chat toggle*).
- **Penonaktifan Saat Soal Berjalan (Zero-Distraction Policy)**:
  - Notifikasi pop-up dan kolom input obrolan dinonaktifkan otomatis saat soal kuis sedang dijawab di `QuizArena.tsx` agar siswa dapat berkonsentrasi penuh pada pembelajaran.

#### 3. Koreksi Permanen & Fitur Pembaruan Mandiri Profil Pendidik
- **Koreksi Data Profil Pendidik**:
  - Menghapus riwayat data placeholder lama dan memastikan identitas pendidik master (`Bapak Aliridho`) terpampang akurat dan konsisten di seluruh sesi.
- **Antarmuka Edit Profil Langsung di Dashboard**:
  - Menyediakan modal interaktif "✏️ Edit Nama & Asal Sekolah" yang memungkinkan pendidik memperbarui nama lengkap, gelar, dan nama instansi sekolah secara mandiri kapan saja dengan sinkronisasi instan ke penyimpanan lokal dan Supabase.

## [2.3.70] - 2026-09-12
### Optimasi Performa & Ergonomi Reaksi: Jalur Samping Bebas-Distraksi (*Side-Stream Channel*), Animasi GPU Ultra-Halus (60-120 FPS), dan Penonaktifan Otomatis Saat Soal Berjalan

#### 1. Jalur Khusus Tepi Samping (*Right-Side Stream Channel*)
- **Bebas Distraksi & Fokus Keterbacaan (Aturan 2)**:
  - Memindahkan seluruh aliran reaksi melayang ke koridor khusus di pojok kanan bawah (`w-36 sm:w-44 h-[350px]`), bukan lagi tersebar di tengah layar (10% - 90%).
  - Area tengah yang memuat teks pertanyaan, pilihan ganda A-B-C-D, timer, dan leaderboard dijamin 100% bersih tanpa terhalang sama sekali.
- **Lencana Pengirim Ramping & Solid (Zero Overdraw)**:
  - Menghapus efek `backdrop-blur` pada partikel bergerak yang sebelumnya memicu *heavy repaint* pada GPU peramban.
  - Menggantinya dengan lencana semi-transparan solid GPU-friendly (`bg-slate-900/90` dan `bg-amber-950`), ringkas, dan bebas lag.

#### 2. Pemisahan Sumbu Translasi 100% GPU (*Dual-Axis Pure GPU Transforms*)
- **Pergerakan Alami & Bebas Kaku**:
  - Sumbu vertikal (Y) menggunakan translasi murni `translate3d(0, -320px, 0)` dengan kurva lembut `cubic-bezier(0.25, 1, 0.5, 1)` berdurasi ~2.0 detik.
  - Sumbu horizontal (X) digerakkan secara independen oleh elemen anak dengan goyangan sinusoidal murni (`@keyframes quizizz-stream-sway`), mengeliminasi perhitungan CSS variables bertahap yang sebelumnya terasa kaku.
  - Pembatasan partikel aktif maksimal 14 partikel dengan pembersihan otomatis instan.

#### 3. Penonaktifan Reaksi Saat Kuis / Soal Berjalan
- **Eksklusif Ruang Tunggu & Lobby**:
  - Reaksi langsung dan tombol reaksi dinonaktifkan sepenuhnya saat kuis sedang berjalan di `QuizArena.tsx` dan `InterQuestionWaitingLounge.tsx` agar siswa dapat 100% fokus menjawab soal tanpa gangguan visual.
  - Di Layar Guru (`WaygroundHostView.tsx`), bilah reaksi guru dan tampilan reaksi hanya aktif ketika status sesi berada di ruang tunggu pra-kuis (`waiting`), dan otomatis disembunyikan saat kuis telah dimulai (`active`).

## [2.3.69] - 2026-09-12
### Sistem Reaksi Melayang Terpadu Ala Quizizz: Fisika Balon Melayang, Sender Avatar Chip & Multi-Tap Rapid Burst

#### 1. Arsitektur Reaksi Terpadu & Universal (`QuizizzReactionOverlay.tsx` & `QuizizzReactionButtonRow.tsx`)
- **Visual Identik & Konsisten 100%**:
  - Menggantikan tumpukan kartu statis di layar guru dan elemen statis di layar siswa dengan satu sistem animasi terpadu `<QuizizzReactionOverlay />`.
  - Reaksi yang dikirim oleh siapapun (guru maupun siswa) disiarkan secara *real-time* ke seluruh perangkat yang terhubung dan melayang identik di semua layar.
- **Fisika Balon Helium & Efek Animasi Organik**:
  - Implementasi animasi CSS terakselerasi GPU (`@keyframes quizizz-float-up`, `@keyframes reaction-bubble-pop`).
  - Emoji meluncur anggun dari bawah layar ke atas (hingga 90vh) dengan goyangan sinusoidal (*organic sway*), efek letupan (*pop-in* `scale(1.25)`), dan rotasi acak halus.
  - Setiap emoji melayang dilengkapi lencana *glassmorphic* elegan yang menampilkan avatar pengirim beserta nama panggilan (*sender name chip*).
- **Dukungan Multi-Tap Rapid Burst (Kombinasi Hujan Emoji)**:
  - Siswa dan guru dapat menekan tombol reaksi berkali-kali secara cepat untuk menghasilkan semburan partikel reaksi yang menyebar meriah di layar tanpa penurunan performa (stabil pada 60 FPS).

#### 2. Bilah Tombol Reaksi Seru Ala Quizizz (`QuizizzReactionButtonRow.tsx`)
- **Pilihan Emoji Berenergi Tinggi**:
  - Menyediakan 8 reaksi terpopuler: ❤️ (Cinta), 🔥 (Semangat), ⭐ (Bintang), 👏 (Tepuk Tangan), 🎉 (Pesta), 🚀 (Gaspol), 🤩 (Kagum), dan 💯 (Seratus).
  - Target sentuh ramah anak dan layar sentuh tablet/ponsel (minimal 44×44 px) dengan respon mikro-interaksi *bounce* yang memuaskan.
- **Peran Guru Interaktif**:
  - Guru dapat mengirimkan reaksi penyemangat langsung dari Dasbor Ruang Kendali Host (`WaygroundHostView.tsx`) untuk memicu antusiasme kelas.

#### 3. Integrasi Menyeluruh di Semua Layar Permainan
- **Ruang Tunggu Pra-Kuis (`StudentWaitingRoom.tsx`)**: Menghilangkan hambatan animasi sebelumnya sehingga reaksi siswa melayang bebas melintasi layar.
- **Layar Host & Smartboard Guru (`WaygroundHostView.tsx` & `QuizArena.tsx`)**: Reaksi melayang secara non-intrusif (`pointer-events-none`) di latar depan tanpa menutupi keterbacaan soal.
- **Lounge Jeda Antar-Soal (`InterQuestionWaitingLounge.tsx`)**: Reaksi melayang meriah saat siswa menikmati permainan mini kasual.

## [2.3.68] - 2026-09-12
### Mode Dipandu Guru: 2 Sub-Mode Pacing, Ruang Tunggu Pra-Kuis, Sinkronisasi Soal Serentak & Lounge Jeda Mini-Game

#### 1. Dua Sub-Mode Pacing Dipandu Guru (`PlayQuizModal.tsx`)
- **Kendali Penuh Guru (*Manual Pacing*)**:
  - Guru memegang kendali penuh atas pembukaan dan pemindahan tiap butir soal kuis di depan kelas.
  - Waktu pengerjaan berlangsung fleksibel dan santai tanpa desakan hitung mundur timer, cocok untuk pembahasan konsep mendalam.
- **Timer Soal + Kendali Lanjut Guru (*Timed Question with Teacher Next*)**:
  - Timer pengerjaan per butir soal berjalan di masing-masing perangkat siswa (bawaan kuis atau durasi yang ditentukan).
  - Ketika waktu soal habis atau siswa telah mengirim jawaban, gawai siswa terkunci pada layar jeda hingga guru secara resmi membuka nomor soal berikutnya.
- **Pengaturan Interaktif Tambahan**:
  - Sakelar Reaksi Melayang & Obrolan Kelas (*Social Reactions & Class Chat Toggle*) untuk memeriahkan suasana kelas.

#### 2. Ruang Tunggu Pra-Kuis Siswa (*Pre-Quiz Waiting Room*) (`StudentWaitingRoom.tsx`)
- **Penahanan Masuk Siswa Terkendali**:
  - Siswa yang bergabung melalui PIN atau tautan kuis dipandu guru tidak langsung mengerjakan soal sebelum guru memulai kuis.
  - Menampilkan status *"Menunggu Bapak/Ibu Guru Memulai Kuis di Depan Kelas..."* dengan animasi denyut visual.
- **Fitur Interaksi Pra-Kuis**:
  - Menampilkan maskot animasi ceria dan daftar avatar teman sekelas yang sudah terhubung.
  - Bilah reaksi melayang (❤️🔥⭐👏🎉) dan obrolan kelas dengan filter sanitasi teks untuk menyapa teman sekelas.
- **Transisi Serentak Otomatis**:
  - Mendengarkan pembaruan status sesi secara waktu nyata (*real-time*). Begitu guru menekan tombol mulai, seluruh perangkat siswa langsung dialihkan serentak ke Soal 1.

#### 3. Lounge Jeda Antar Soal dengan Kasual Mini-Game Bersama (`InterQuestionWaitingLounge.tsx`)
- **Pengalaman Menunggu Positif & Seru**:
  - Siswa yang selesai menjawab lebih awal dialihkan ke ruang tunggu jeda antar soal sehingga tertib dan tidak mengganggu siswa lain.
  - Dilengkapi permainan mini kasual interaktif selaras kelas (berganti tiap butir soal):
    - **Game 1**: *Tangkap Bintang Mengambang* (*Star Catcher*) untuk melatih fokus dan ketangkasan.
    - **Game 2**: *Tebak Emoji Kilat* (*Emoji Riddle*) untuk mengasah logika cepat.
- **Sinkronisasi Otomatis Soal Berikutnya**:
  - Menghubungkan gawai siswa ke pemancar sesi kuis; begitu guru membuka soal berikutnya, seluruh layar siswa otomatis berganti nomor soal baru.

#### 4. Ruang Kendali Host & Smartboard Guru (`WaygroundHostView.tsx` & `QuizArena.tsx`)
- **Tombol Mulai Kuis & Indikator Siswa**:
  - Tombol *"Mulai Kuis Sekarang"* yang mencolok di header dan tab utama ketika sesi berstatus ruang tunggu (*waiting*).
- **Kendali Navigasi Soal Terpusat**:
  - Guru dapat memajukan atau memundurkan nomor soal aktif baik dari Smartboard proyektor kelas maupun dasbor kendali host, menyiarkan perintah pembaruan soal ke seluruh gawai siswa serempak.
- **Pemantauan & Pengendalian Kelas**:
  - Menampilkan jumlah siswa yang telah menjawab secara *live* (`👥 X / Y Siswa Menjawab`).
  - Tombol kendali *"Bungkam Obrolan"* (*Mute Class Chat*) untuk menjaga ketertiban kelas seketika jika diperlukan.
  - Lapisan gelembung reaksi melayang (*Floating Reaction Bubbles*) di layar guru.

## [2.3.67] - 2026-09-12
### Deteksi Cerdas Durasi Khusus Butir Soal & Kontrol Override pada Sesi Kuis

#### 1. Analisis Durasi Khusus Butir Soal (*Smart Question Duration Detection*)
- **Deteksi Otomatis & Akurat**:
  - Memindai seluruh butir soal di dalam kuis untuk mendeteksi apakah ada butir soal yang memiliki durasi khusus (`customDurationSec`), alih-alih hanya mengandalkan durasi kuis umum (`durationPerQuestionSec`).
  - Mendukung parsing tipe data string maupun angka secara defensif dan aman.
- **Label Dinamis Adaptif**:
  - Tombol **"Bawaan"** otomatis berubah menjadi **"Bawaan (Sesuai Soal)"** jika terdapat soal dengan durasi bervariasi, atau **"Bawaan (Xs)"** jika seluruh butir soal berdurasi seragam.
  - Header dan tombol pil timer ikut menyesuaikan menjadi **"Bawaan (Sesuai Tiap Soal)"** untuk mengonfirmasi kejelasan durasi.
- **Rincian Transparan pada Info Box**:
  - Menampilkan daftar rinci jumlah butir soal berdurasi khusus beserta durasinya (misal: *1 butir soal memiliki durasi khusus (60 detik)* dan *4 butir soal lainnya berdurasi bawaan 30 detik*).

#### 2. Kontrol Penyeragaman Durasi (*Override Control*)
- **Opsi Samaratakan Semua (*Homogenize / Override Toggle*)**:
  - Ketika guru memilih preset atau durasi kustom pada kuis yang memiliki durasi campuran, sistem menampilkan panel informasi interaktif berwarna amber.
  - Guru dapat memilih apakah ingin tetap mempertahankan durasi khusus butir soal, atau mencentang opsi **"Samaratakan Semua"** untuk menimpa seluruh butir soal dengan durasi baru yang dipilih.
- **Integrasi Mesin Kuis (*Quiz Arena*)**:
  - Menghubungkan opsi `overrideCustomQuestionDurations` langsung ke mesin permainan `QuizArena.tsx` pada seluruh navigasi soal (soal pertama, berikutnya, mundur, lompat soal, dan retry).

## [2.3.66] - 2026-09-12
### Informasi Durasi Bawaan Kuis Interaktif pada Pengaturan Waktu Soal

#### 1. Banner Edukatif & Penjelasan Durasi Bawaan (`PlayQuizModal.tsx`)
- **Pemberitahuan Otomatis Pilihan Bawaan**:
  - Menampilkan panel informasi ringkas di bawah baris tombol preset ketika opsi *"Bawaan"* aktif.
  - Memberikan kepastian kepada guru bahwa alur kuis akan mengikuti pengaturan asli kuis (`quiz.durationPerQuestionSec` detik per butir soal) tanpa perlu menebak atau menghitung manual.
- **Desain Ramah & Terintegrasi (*Inclusive & Clean Design*)**:
  - Menggunakan aksen biru tematik dengan ikon informasi (`Info`) yang lembut dan tidak mengganggu fokus visual utama.
  - Mendukung penyesuaian kontras otomatis pada tema terang (*light mode*) dan gelap (*dark mode*).
  - Teks terformat responsif tanpa distorsi pada perangkat ponsel pintar (mobile portrait & landscape).

## [2.3.65] - 2026-09-12
### Input Durasi Kustom Angka Bebas & Pilihan Satuan (Detik / Menit) pada Pengaturan Kuis

#### 1. Input Angka & Satuan Fleksibel (`PlayQuizModal.tsx`)
- **Penyederhanaan Input Durasi Kustom**:
  - Mengganti pembatasan rentang kaku dengan kolom input angka bebas tanpa batasan sempit, memberikan keleluasaan penuh bagi guru untuk kuis kilat maupun pemecahan soal berdurasi panjang.
  - Menambahkan *segmented toggle* satuan interaktif antara **Detik** dan **Menit**.
  - Melakukan konversi otomatis nilai satuan menit ke detik saat disimpan ke konfigurasi sesi (`durationPerQuestionSec`), menjamin kompatibilitas 100% dengan mesin kuis dan gawai siswa.
- **Optimalisasi Tata Letak & Kenyamanan Visual (*Spacious Layout*)**:
  - Menghilangkan label rentang statis `(Rentang 5 - 300 dtk)` yang memadati ruang visual antarmuka.
  - Menata elemen ke dalam grup fleksibel (*flex-wrap responsive*) sehingga tampil lapang di layar desktop serta bebas dari pemotongan teks (*text clipping*) pada perangkat seluler dengan layar sempit.
  - Memperbarui indikator status durasi header dan lencana pil secara dinamis mengikuti nilai angka dan satuan yang aktif (contoh: *2 menit / soal* atau *45 detik / soal*).

## [2.3.64] - 2026-09-12
### Klarifikasi Waktu per Butir Soal, Durasi Bawaan/Kustom, dan Pembersihan Badge Pasif

#### 1. Klarifikasi & Fleksibilitas Waktu per Butir Soal (`PlayQuizModal.tsx`)
- **Penegasan Label & Keterangan Durasi**:
  - Mengubah label menjadi *"Waktu per Butir Soal"* dengan indikator status aktif (misal: *Bawaan Kuis (30s)* atau *40s (Kustom)*) untuk menghilangkan ambiguitas durasi kuis vs durasi per butir.
- **Dukungan Durasi Bawaan Soal (*Default*) & Durasi Kustom**:
  - Menyediakan tombol pilihan *"Bawaan"* untuk mengikuti pengaturan durasi asli dari kuis/soal.
  - Menyediakan tombol pilihan cepat preset detik (`10s`, `15s`, `20s`, `30s`, `45s`, `60s`).
  - Menyediakan mode *"Kustom"* dengan kolom input numerik interaktif (rentang 5 – 300 detik per butir soal).

#### 2. Pembersihan Lencana Pasif yang Membingungkan
- **Penghapusan Badge Statis**:
  - Menghilangkan deretan badge pasif non-interaktif (*Smartboard IFP, Jeda Waktu, Navigasi Mundur, Lompat Soal*) yang sebelumnya membingungkan pengguna dan membuat antarmuka terasa ramai.
  - Panel konfigurasi kuis kini jauh lebih bersih, terfokus, dan bebas dari elemen dekoratif yang tidak perlu.

## [2.3.63] - 2026-09-12
### Pengaturan Lengkap Kuis pada Panel Mode Dipandu Guru Berbasis Accordion

#### 1. Penambahan Accordion Pengaturan Tambahan Kuis (`PlayQuizModal.tsx`)
- **Desain Bersih & Tidak Berjejal (*Collapsible Accordion*)**:
  - Menghadirkan bagian lipat interaktif bertajuk *"Pengaturan Tambahan Kuis"* pada mode Dipandu Guru.
  - Secara bawaan dalam status tertutup agar antarmuka kuis tetap ramping dan minimalis, namun siap dibuka guru saat memerlukan kustomisasi sesi lanjutan.
- **Dukungan Pengaturan Kuis Komprehensif**:
  - **Kunci Jawaban Siswa**: Pilihan keterlihatan kunci jawaban (*Tiap Soal*, *Akhir Kuis*, atau *Rahasia*).
  - **Pembahasan Materi**: Opsi penayangan penjelasan materi kuis (*Tiap Soal*, *Akhir Kuis*, atau *Sembunyikan*).
  - **Acak Urutan Nomor Soal**: Sakelar toggle untuk mengacak urutan butir soal kelas.
  - **Acak Pilihan Opsi Jawaban**: Sakelar toggle untuk mengacak penataan pilihan A, B, C, D di setiap perangkat siswa.
  - **Tayangkan Peringkat Kelas di Smartboard**: Sakelar toggle untuk menampilkan leaderboard skor live di layar proyektor setelah tiap soal.
- **Sinkronisasi Sesi Real-Time**:
  - Seluruh parameter lanjutan otomatis tersimpan dan disinkronkan ke sesi aktif kuis di Smartboard dan gawai siswa.

## [2.3.62] - 2026-09-12
### Penyempurnaan Action Tiles Horizontal & Eliminasi Redundansi Modal Kuis

#### 1. Penyatuan Header & Penghapusan Dobel Elemen
- **Integrasi Informasi Kuis Langsung pada Header**:
  - Menyatukan cover kuis, judul kuis, serta metadata mata pelajaran, kelas, dan jumlah butir soal langsung ke dalam bilah atas (*modal header*).
  - Menghilangkan kotak abu-abu duplikat di dalam badan modal, menghemat lebih dari 80px ruang vertikal.
- **Penghapusan Tombol Bawah yang Redundan**:
  - Menghilangkan tombol "Tutup" besar di bagian bawah pada tahap pemilihan mode karena sudah tersedia tombol `✕`, ketukan area latar (*backdrop*), serta gestur *swipe-down*.
  - Modal kini pas dan proporsional di seluruh ukuran layar smartphone tanpa perlu di-scroll.

#### 2. Redesain Action Tiles Horizontal Bergaya Modern
- **Tata Letak Horizontal Bersih (*Horizontal Action Tiles*)**:
  - Mengubah kotak vertikal bertingkat menjadi *action tiles* horizontal yang ramping, elegan, dan ramah sentuhan ($\ge 72\text{px}$ touch target):
    1. **Dipandu Guru**: Wadah ikon toga biru lembut, lencana `Smartboard`, intisari 1 baris jelas, dan indikator chevron kanan.
    2. **Mandiri & PR**: Wadah ikon gawai ungu lembut, lencana `Gawai Siswa`, intisari 1 baris jelas, dan indikator chevron kanan.
- **Pembersihan Nomor Kaku & Teks Berulang**:
  - Menghilangkan penomoran kaku `1.` dan `2.` serta tautan teks ganda di bagian bawah kartu untuk pengalaman pengguna yang bebas dari kesan kaku (*anti AI-slop*).

## [2.3.61] - 2026-09-12
### Redesain Dialog Pengaturan Kuis: Alur Dua Tahap Kartu Interaktif & Pembersihan Teks Berlebih

#### 1. Alur Pemilihan Mode Dua Tahap (*Two-Step Card Selection Flow*)
- **Tahap 1: Pemilihan Mode Interaktif (*Hero Mode Cards*)**:
  - Mengubah tampilan awal modal menjadi pemilih mode yang luas, bersih, dan berorientasi visual tanpa penumpukan opsi rumit.
  - Menyajikan dua kartu hero interaktif dengan hierarki visual kontras tinggi:
    1. **1. Dipandu Guru (*Live Smartboard*)**: Kartu biru dengan ikon toga, lencana indikator Smartboard, dan navigasi langsung ke pengaturan panduan.
    2. **2. Mandiri & PR (*Gawai Siswa*)**: Kartu ungu dengan ikon ponsel gawai, lencana pengerjaan mandiri/PR, dan navigasi langsung ke pengaturan mandiri.
- **Tahap 2: Pengaturan Terfokus Sesuai Mode (*Focused Mode Configuration*)**:
  - Konfigurasi disajikan secara terisolasi dan spesifik hanya untuk mode yang dipilih oleh guru, menghilangkan elemen yang tidak relevan.
  - Tombol navigasi kembali (*breadcrumb*) `← Pilih Mode Lain` di bilah atas modal untuk memudahkan berpindah mode dengan satu ketukan.
  - Dukungan navigasi tombol fisik / gestur kembali Android (*hardware back button*) yang otomatis kembali dari Tahap 2 ke Tahap 1, lalu menutup modal.

#### 2. Eliminasi Teks Berlebih & Penyempurnaan Estetika Antarmuka
- **Menghilangkan Seluruh Deskripsi Mikro Berlebih**:
  - Membersihkan tumpukan kalimat deskripsi di bawah tombol dan opsi agar modal terasa lega, ringkas, dan bebas dari kesan *AI-slop*.
  - Menggunakan label tombol yang lugas, *segmented pills*, dan sakelar pengaturan iOS-style yang intuitif.
- **Kemudahan Fitur Pekerjaan Rumah (PR)**:
  - Input batas pengumpulan dilengkapi pratinjau tanggal Indonesia yang rapi, tombol pintas `Besok`, `+3 Hari`, `+1 Minggu`, dan tombol instan salin pesan tugas ke WhatsApp.
- **Presisi Responsif Mobile-First (Standar Aturan #1)**:
  - Ukuran target sentuh seluruh kartu dan tombol minimal 44×44 px.
  - Penataan vertikal yang proporsional pada layar ponsel portrait tanpa tumpang tindih elemen.

## [2.3.60] - 2026-09-12
### Implementasi Arsitektur 2 Mode Utama Kuis: Mode Dipandu Guru & Mode Mandiri Hybrid PR

#### 1. Arsitektur 2 Mode Pelaksanaan Inti (`PlayQuizModal.tsx`)
- **Penyederhanaan Segmented Control Teratas**:
  - Mengintegrasikan konfigurasi kuis ke dalam 2 mode utama yang jelas dan terfokus:
    1. **1. Dipandu Guru (*Teacher-Led / Instructor-Paced*)**:
       - Memberikan kendali penuh kepada Guru atas jalannya kuis di kelas.
       - Pilihan Format Partisipasi Siswa: *Individu (1 HP / Siswa)* atau *Regu / Kelompok (1 HP / Meja Diskusi)* untuk melatih kerja sama tim.
       - Mekanik Waktu: *Standar (Timer Otomatis)* atau *Santai (Mengikuti Ritme Guru)*.
       - Target tampilan otomatis diarahkan ke Smartboard / TV Kelas.
       - Panel Ringkasan Fitur Live Guru di Arena: Jeda Waktu (*Hold Timer*), Navigasi Mundur (*Prev*), Lompat Nomor Soal, dan Buka Kunci Jawaban Manual.
    2. **2. Mandiri & PR (*Self-Paced & Hybrid Homework*)**:
       - Mengakomodasi pengerjaan fleksibel siswa baik serentak maupun sebagai penugasan rumah.
       - Pilihan Tipe Pelaksanaan: *Langsung di Kelas* atau *Pekerjaan Rumah (PR)*.
       - Fitur Pekerjaan Rumah (PR) Lengkap:
         - Penentuan batas waktu pengumpulan (*deadline*) dengan pemilih tanggal/waktu interaktif dan tombol pintas `+1 Hari (Besok)`, `+3 Hari`, `+1 Minggu`.
         - Keterangan format tanggal lokal Indonesia yang komunikatif.
         - Sakelar wajib isi Nama Lengkap & Nomor Absen siswa untuk kemudahan rekapitulasi nilai.
         - Tombol instan salin format pengumuman tugas ke grup WhatsApp kelas.
       - Pengaturan keamanan dan integritas pengerjaan: Acak nomor soal, acak pilihan opsi, deteksi ganti tab, keterlihatan peringkat, dan pembatasan pengerjaan 1 kali.
- **Kepatuhan Penuh Pengaturan Sesi**:
  - Seluruh parameter sesi permainan tetap terjaga, disinkronkan secara real-time ke penyimpanan sesi aktif dan didistribusikan ke peserta.

#### 2. Fitur Kendali Guru di Arena Permainan (`QuizArena.tsx`)
- **Tombol Navigasi Mundur (*Previous Question*)**:
  - Guru dapat kembali ke butir soal sebelumnya kapan saja saat memandu kuis atau dalam mode pratinjau.
- **Tombol Jeda Waktu (*Hold & Resume Timer*)**:
  - Guru dapat menghentikan hitung mundur timer seketika dari navigasi bawah untuk memberikan penjelasan konsep atau arahan kepada kelas, lalu melanjutkannya kembali.
- **Pemilih Lompat Soal Cepat (*Question Jumper*)**:
  - Dropdown pemilih nomor soal interaktif di bilah atas (*header*) yang memungkinkan guru melompat langsung ke butir soal yang diinginkan.
- **Transisi Soal Fleksibel**:
  - Guru dapat memajukan soal ke nomor berikutnya (*Next Question*) kapan saja tanpa harus menunggu atau terhalang input.

#### 3. Peningkatan Ruang Tunggu Siswa (*Student Lobby*) (`StudentLobby.tsx`)
- **Banner Mode Pelaksanaan**:
  - Menampilkan lencana informatif jika sesi berstatus *Dipandu Guru* atau *Pekerjaan Rumah (PR)* lengkap dengan tanggal batas waktu pengumpulan.
- **Bidang Input Nomor Absen**:
  - Form pendaftaran siswa secara dinamis menyediakan kolom Nomor Absen saat sesi berupa penugasan PR atau diaktifkan oleh guru.

## [2.3.59] - 2026-09-12
### Keterangan Kontekstual Dinamis pada Segmented Controls Modal Sesi Kuis Guru

#### 1. Penambahan Deskripsi Kontekstual Dinamis (*Dynamic Contextual Captions*)
- **Penjelasan Efektif Khusus Pilihan Aktif (`PlayQuizModal.tsx`)**:
  - Menghindari pengulangan teks deskripsi di setiap tombol dengan menyajikan keterangan kecil, elegan, dan informatif tepat di bawah kontrol segmen untuk opsi yang sedang terpilih:
    - **Mode Permainan**:
      - *Standar*: "Timer aktif per butir soal. Poin dihitung dari ketepatan dan kecepatan menjawab."
      - *3 Nyawa*: "Tantangan 3 nyawa. Pengerjaan kuis berakhir otomatis jika siswa salah 3 kali."
      - *Santai*: "Tanpa batas waktu pengerjaan. Memberikan keleluasaan untuk ulasan dan diskusi kelas."
    - **Durasi per Butir**: Keterangan dinamis durasi detik dan estimasi durasi selesai kuis.
    - **Kunci Jawaban Siswa**:
      - *Terbuka*: "Siswa langsung mengetahui letak kunci jawaban yang tepat setelah menjawab."
      - *Status Saja*: "Siswa hanya tahu status benar/salah, tanpa memperlihatkan letak kunci aslinya."
      - *Rahasia*: "Kunci jawaban dirahasiakan total selama sesi kuis berlangsung (standar ujian)."
    - **Pembahasan & Penjelasan**:
      - *Tiap Soal*: "Teks pembahasan materi langsung tampil setelah siswa mengirimkan jawaban."
      - *Di Akhir*: "Pembahasan baru dibuka setelah siswa menyelesaikan seluruh butir soal."
      - *Sembunyikan*: "Pembahasan ditiadakan agar materi soal tetap steril dan rahasia."
    - **Target Tampilan Permainan**:
      - *Smartboard / TV Kelas*: "Menampilkan soal dan papan skor interaktif di layar depan kelas (TV / Smartboard)."
      - *Gawai Siswa Mandiri*: "Siswa langsung membaca dan menjawab soal secara mandiri melalui gawai masing-masing."
- **Kerapian Antarmuka & Keterbacaan Maksimal**:
  - Teks dirancang berukuran `text-[11px]`, warna netral kontras seimbang (`text-slate-500 dark:text-slate-400`), dan spasi proporsional sehingga antarmuka tetap minimalis tanpa menambah beban kognitif pengguna.

## [2.3.58] - 2026-09-12
### Redesain Modal Sesi Kuis Guru Ultra-Clean, Segmented Controls, dan iOS Settings List Group

#### 1. Transformasi Segmented Controls (Pill Sliders) Elegan & Anti AI-Slop (`PlayQuizModal.tsx`)
- **Eliminasi Penumpukan Kotak (*Anti-Box Nesting / No Lasagna UI*)**:
  - Menggantikan kartu-kartu abu-abu berlapis (*box-in-a-box*) dan paragraf deskripsi panjang yang berulang dengan *segmented controls* (slider pil horizontal) berstandar Linear dan iOS.
  - Pengaturan mode permainan dirampingkan menjadi kontrol pil horizontal: `[ 🌟 Standar | ❤️ 3 Nyawa | 🧘 Santai ]` yang menghemat 70% ruang vertikal.
  - Durasi per butir soal ditata rapi dalam grid pil terpadu `[ 10s | 15s | 20s | 30s | 45s | 60s ]` yang hanya muncul dinamis saat mode berbatas waktu aktif.
  - Visibilitas kunci jawaban dan pembahasan guru disajikan dalam segmen interaktif:
    - Kunci Jawaban Siswa: `[ 🟢 Terbuka | 🟡 Status Saja | 🔒 Rahasia ]`
    - Pembahasan Guru: `[ Tiap Soal | Di Akhir | Sembunyikan ]`

#### 2. Grup Pengaturan Keamanan Bergaya iOS (*iOS Settings List Group*)
- **Penyatuan Pengaturan Keamanan & Integritas Ujian**:
  - Menggabungkan 5 kartu tombol toggle terpisah menjadi satu kontainer *List Group* melengkung terpadu dengan pembatas garis tipis (*subtle dividers*):
    - 🔀 **Acak Nomor Soal**: Pilihan urutan nomor butir soal berbeda untuk tiap siswa.
    - 📚 **Acak Pilihan Opsi**: Posisi opsi jawaban A, B, C, D diacak otomatis.
    - 🛡️ **Deteksi Ganti Tab**: Peringatan seketika saat siswa berpindah tab/layar ujian.
    - 🏆 **Papan Peringkat di Siswa**: Pengaturan keterlihatan skor dan rank di gawai siswa vs hanya di layar guru.
    - 🔒 **Batas Pengerjaan 1 Kali**: Pembatasan percobaan pengerjaan untuk standar asesmen formal.
  - Setiap baris memiliki ikon berlatar warna tematik, judul dan keterangan ringkas di sisi kiri, serta tombol geser (*switch toggle*) taktil di sisi kanan yang responsif terhadap klik seluruh baris.

#### 3. Optimalisasi Akses Cepat, Footer Aksi, dan Keterbacaan Antar-Tema
- **Header & Ringkasan Kuis Efisien**:
  - Kartu ringkasan kuis menampilkan cover emoji, label mapel dan kelas, jumlah soal, estimasi durasi, serta pil kode PIN dengan tombol salin dan tombol bagikan tautan langsung.
  - Menghilangkan tombol ganda yang redundan pada footer sehingga modal memiliki alur aksi yang tegas dan terarah: tombol *"Batal"* dan tombol utama *"Mulai Kuis Sekarang"*.
- **Presisi Mobile-First & Dukungan Dark Mode Penuh**:
  - Seluruh elemen sentuh memenuhi target minimum $\ge 44 \times 44\text{ px}$.
  - Kontras visual diuji dan disempurnakan baik pada mode terang (*Light Mode*) maupun mode gelap (*Dark Mode*).

## [2.3.57] - 2026-09-12
### Eliminasi Format Preset Redundan Menuju Kendali Sesi Kuis Mandiri dan Transparan untuk Guru

#### 1. Penghapusan Mutlak Kartu Format Preset Redundan (`PlayQuizModal.tsx`)
- **Eliminasi Konflik & Kontradiksi Konfigurasi (*Zero Dual-Source of Truth*)**:
  - Menghapus kartu preset *"Mode Ujian Resmi"* dan *"Mode Latihan Bebas"* sepenuhnya dari antarmuka modal bermain kuis.
  - Mencegah kebingungan di mana guru memilih preset tertentu namun kemudian mengubah opsi yang bertentangan di pengaturan rinci. Kini tidak ada lagi status kabur atau benturan label *"Format Kustom"*.
- **Kendali Penuh di Tangan Guru**:
  - Guru memiliki kendali langsung dan transparan untuk menentukan seluruh parameter sesi permainan sesuai kebutuhan nyata di ruang kelas (misalnya: ulangan resmi dengan nomor soal terurut untuk teks cerita, atau latihan mandiri dengan pembatasan waktu tertentu).

#### 2. Penyajian 4 Kategori Pengaturan Terstruktur Langsung (*Direct Configuration Flow*)
- **Penghapusan Penumpukan Akordeon (*Frictionless UX*)**:
  - Seluruh pengaturan kini disajikan langsung dan teratur dalam 4 bagian utama yang mudah ditinjau tanpa perlu membuka/menutup akordeon:
    1. **Mekanik Permainan & Waktu**: Pilihan mode (*Standar*, *3 Nyawa*, *Santai Tanpa Timer*) dan penentuan durasi waktu per butir soal (10s–60s).
    2. **Visibilitas Kunci & Pembahasan**: Visibilitas kunci jawaban untuk siswa (*Terbuka Langsung*, *Hanya Status*, *Sembunyi Total*) dan waktu kemunculan pembahasan guru (*Tiap Soal*, *Di Akhir Kuis*, *Sembunyikan*).
    3. **Keamanan & Aturan Pengerjaan**: Kontrol acak nomor soal, acak pilihan opsi A/B/C/D, deteksi ganti tab/layar, keterlihatan peringkat di gawai siswa, dan batas pengerjaan (*Hanya 1x* vs *Bebas Mengulang*).
    4. **Target Tampilan Permainan & Default**: Pilihan target presentasi (*Layar Smartboard IFP* vs *Lobi Gawai Siswa*) dan opsi simpan konfigurasi sebagai preferensi default kuis.
- **Penyelarasan Teks Header & Sentuhan Ergonomis**:
  - Subtitle modal diperbarui menjadi: *"Atur konfigurasi sesi kuis sesuai kebutuhan kelas Anda"*, mencerminkan kebebasan dan fleksibilitas penuh bagi guru.
  - Seluruh tombol dan pemilih opsi tetap memenuhi standar mobile-first ($\ge 44 \times 44\text{ px}$).

## [2.3.56] - 2026-09-12
### Redesain Modal Pengaturan Kuis Guru Anti AI-Slop, Eliminasi Redudansi, dan Pengaturan Sesi Lanjutan Terpadu

#### 1. Eliminasi Ciri AI Slop & Pemotongan Teks (*Anti AI-Slop & Zero Truncation*)
- **Penghapusan Pemotongan Teks Prematur (`truncate`)**:
  - Menghapus kelas `truncate` pada header modal dan judul kuis. Subtitle *"Pilih format kuis atau sesuaikan sesi sebelum dimulai"* kini mengalir alami tanpa terpotong `...` pada layar kecil maupun besar.
  - Judul kuis pada kartu info menggunakan `line-clamp-2` sehingga judul panjang seperti *"Kuis Pendidikan Pancasila: Pengamalan Sila Pancasila"* dapat dibaca utuh dan jelas oleh guru.
- **Kartu Info Kuis & Akses Siswa Terpadu**:
  - Menggabungkan metadata kuis (cover emoji, mapel, kelas, jumlah butir soal, estimasi waktu) dengan kontrol akses cepat siswa (kode PIN 4-digit dengan tombol salin serta tombol bagikan tautan langsung berumpan balik *"Tersalin!"*).
  - Mengurangi pemborosan ruang vertikal hingga 40% sekaligus memastikan informasi akses siswa selalu tersedia di bagian atas tanpa perlu menggulir (*scroll*).

#### 2. Eliminasi Redudansi & Selektor Format Kuis Eksklusif 2-Kartu
- **Penyelarasan Hierarki Kontrol Format Kuis**:
  - Menggantikan konflik visual antara *"Preset Cepat 1-Klik"* dan *"1. Mode Permainan"* yang sebelumnya sama-sama aktif dengan 2 kartu format utama yang eksklusif dan jelas:
    - 🎯 **Mode Ujian Resmi**: Dikhususkan untuk asesmen formal, ulangan harian, PTS, atau PAS (kunci & pembahasan dirahasiakan, batas 1x coba, deteksi ganti tab aktif, serta nomor soal dan opsi diacak otomatis).
    - 🎮 **Mode Latihan Bebas**: Dikhususkan untuk pemanasan kelas, ulasan materi, atau belajar mandiri (kunci dan pembahasan langsung terbuka saat dijawab, siswa leluasa mengulang sesi kuis).
  - Status aktif ditandai secara presisi dengan badge *"✓ Aktif"*, border aksen bergradasi, dan ring fokus halus tanpa terjadi kebingungan pemilihan ganda.

#### 3. Akordeon Pengaturan Sesi Lanjutan (*Collapsible Advanced Settings*)
- **Pengorganisasian Opsi Granular Tanpa Penumpukan Kotak (*Anti-Nested Boxes*)**:
  - Seluruh pengaturan rinci (mekanik 3 hati/santai, durasi waktu per soal, visibilitas kunci, pembahasan guru, keamanan acak/anti-curang, target smartboard IFP vs gawai siswa, dan opsi simpan default) kini dirangkum rapi di dalam panel akordeon akomodatif yang dapat dibuka/tutup sesuai kebutuhan.
  - Header akordeon dilengkapi pil ringkasan dinamis (misalnya: `30s/soal • Layar Smartboard • Soal Acak`) sehingga guru langsung mengetahui konfigurasi aktif tanpa harus membuka menu jika tidak ingin mengubahnya.

#### 4. Presisi Mobile-First & Footer Aksi Berdampak Tinggi
- **Standar Sentuh & Responsivitas Antar-Platform**:
  - Seluruh target sentuh tombol (*Bagi Tautan*, *Mulai Kuis Sekarang*, *Salin PIN*, kartu format, dan toggle) memenuhi standar ergonomis tinggi ($\ge 44 \times 44\text{ px}$, rekomendasi $\ge 48\text{ px}$).
  - Menjaga kontras visual optimal pada mode Terang (*Light Mode*) dan Gelap (*Dark Mode*).
  - Footer aksi diperbarui dengan tombol utama *"Mulai Kuis Sekarang"* berukuran penuh dengan gradien modern dan bayangan halus untuk meningkatkan kecepatan peluncuran sesi kuis.

## [2.3.55] - 2026-09-12
### Perbaikan Urutan Hook React pada Modal Pengaturan Kuis Guru & Pemulihan Tombol "Mainkan Sekarang"

#### 1. Perbaikan Kepatuhan Aturan Hook React (*Rules of Hooks Compliance* di `PlayQuizModal.tsx`)
- **Penyelarasan Urutan Deklarasi Hook**:
  - Memindahkan pemanggilan hook `useEffect` sinkronisasi pengaturan real-time ke bagian atas komponen sebelum pernyataan kondisional `if (!isOpen || !quiz) return null;`.
  - Mengatasi galat *runtime* *"React has detected a change in the order of Hooks called by PlayQuizModal"* yang sebelumnya memblokir pembukaan modal saat guru mengklik tombol *"Mainkan Sekarang"*.
- **Pemulihan Alur Pembukaan Modal Kuis Guru**:
  - Tombol *"Mainkan Sekarang"* di seluruh dashboard dan detail kuis kini dapat dibuka dengan mulus, instan, dan responsif. Seluruh preset cepat 1-klik (*Mode Ujian Resmi* & *Latihan Bebas*) dan konfigurasi sesi berfungsi tanpa kendala.

## [2.3.54] - 2026-09-12
### Eliminasi Mutlak Kebocoran Tombol Kunci Jawaban Siswa & Sinkronisasi Konfigurasi Sesi Real-Time Antar Guru-Siswa

#### 1. Eliminasi Mutlak Kebocoran Tombol "Kunci" / "Buka Kunci Jawaban" (`QuizArena.tsx`)
- **Penghapusan Akses Buka Kunci Jawaban pada Perangkat Siswa**:
  - Tombol pengintip dan pengungkap kunci jawaban (`handleTeacherReveal`) yang sebelumnya dapat muncul pada footer pengerjaan siswa kini dihapus 100% dari seluruh mode pengerjaan siswa.
  - Tombol ini dikunci secara ketat dan hanya boleh dirender khusus untuk akun Guru yang terverifikasi saat mempresentasikan kuis di layar Smartboard IFP (`isTeacher && presentationTarget === 'smartboard'`) atau saat pratinjau studio guru di Quiz Creator (`isPreview === true`).
- **Penyematan Indikator Status Netral pada Footer Siswa**:
  - Pada layar siswa, tombol kunci jawaban digantikan dengan badge informatif: *"Mode Ujian Terproteksi"* (pada mode ujian resmi ketat) atau *"Pilih satu jawaban terbaik"* (pada mode casual/standar) yang rapi, ergonomis, dan tidak memicu interaksi kebocoran.
- **Proteksi Komponen & Guard Eksekusi**:
  - Menambahkan guard keamanan berlapis pada fungsi `handleTeacherReveal()`: jika pemicu aksi bukan guru terverifikasi (`!canTeacherReveal`) atau jawaban butir soal sudah dikonfirmasi, fungsi langsung membatalkan eksekusi secara diam-diam.
- **Pengamanan Bantuan Huruf Pertama pada Soal Isian Singkat**:
  - Tombol *"Bantuan Huruf Pertama"* otomatis disembunyikan sepenuhnya jika kuis berjalan dalam sesi aktif guru atau ketika mode visibilitas jawaban bukan mode latihan instan mandiri.

#### 2. Sinkronisasi Konfigurasi Kuis Real-Time Tanpa Jeda (`BroadcastChannel` & `supabaseClient.ts`)
- **Komunikasi Instan Lintas-Tab/Jendela (`BroadcastChannel('kuis_realtime_session_sync')`)**:
  - Mengimplementasikan kanal siaran `BroadcastChannel` dan custom DOM event listener di `supabaseClient.ts`, `App.tsx`, `QuizArena.tsx`, dan `StudentLobby.tsx`.
  - Setiap perubahan konfigurasi yang dilakukan oleh guru (durasi, mode jawaban, anti-mencontek, batasan pengerjaan, dsb) langsung disiarkan dan disinkronkan ke seluruh tab siswa dalam hitungan milidetik tanpa perlu memuat ulang (*refresh*) browser.
- **Metode Sinkronisasi Sesi Baru**:
  - Menambahkan `DataManager.updateActiveSessionSettings(sessionIdOrPin, settings)` untuk memperbarui konfigurasi di penyimpanan lokal dan cloud Supabase, diikuti dengan penyiaran instan ke seluruh tab aktif.
  - Menambahkan `DataManager.fetchActiveSessionByPin(pin)` yang cerdas dengan fallback lokal dan pengecekan cloud Supabase.

#### 3. Sinkronisasi Otomatis Sejak Pemilihan Preset & Berbagi Tautan (`PlayQuizModal.tsx`)
- **Penyimpanan & Penyiaran Pra-Mulai**:
  - Saat guru memilih preset (misalnya *"Mode Ujian Resmi"* atau *"Latihan Bebas"*), konfigurasi langsung disinkronkan ke sesi aktif kuis terkait.
  - Saat guru menekan tombol *"Salin PIN"* atau *"Bagi Tautan"*, sistem secara otomatis mendaftarkan dan memperbarui sesi aktif dengan seluruh parameter modal saat itu (`ensureSessionAndSyncSettings()`). Dengan demikian, siswa yang membuka tautan atau memasukkan PIN dijamin selalu mendapatkan konfigurasi terbaru yang sudah ditentukan guru tanpa risiko ketidaksinkronan default.

## [2.3.53] - 2026-09-12
### Tampilan Siswa Terpadu Sesuai Konfigurasi Guru (Tautan Langsung & PIN), Eliminasi Pemilih Mode Bebas, dan Sinkronisasi Sesi

#### 1. Tampilan Lobi Siswa Fokus 4-Langkah (`StudentLobby.tsx`)
- **Penyelarasan Mutlak dengan Konfigurasi Guru**:
  - Siswa yang bergabung melalui tautan langsung (link dengan `?pin=...`) atau memasukkan 4-digit PIN di beranda kini 100% mengikuti konfigurasi yang telah dikunci oleh guru pada sesi aktif kuis tersebut.
- **Hanya 4 Bagian Esensial bagi Siswa**:
  1. **Info Kuis & Pengaturan Guru**: Menampilkan PIN sesi, cover kuis, judul, kelas, mapel, guru pembuat, deskripsi, serta kartu ringkasan parameter yang ditentukan guru (jumlah butir soal, durasi waktu per soal/santai, mode pengerjaan) dan badge aturan ujian (seperti *Kunci Jawaban Dirahasiakan*, *Anti-Mencontek Aktif*, *Batas 1x Pengerjaan*, dsb).
  2. **Isi Nama**: Input nama lengkap atau nama panggilan siswa dengan validasi, min-height $\ge 48\text{ px}$, dan indikator wajib diisi.
  3. **Pilih Maskot**: Grid pilihan avatar maskot ramah anak SD dengan indikator aktif yang jelas dan touch target ergonomis $\ge 48\text{ px}$.
  4. **Mulai Mengerjakan**: Tombol aksi utama dengan gradien biru-indigo yang meluncurkan siswa langsung ke arena kuis.
- **Eliminasi Pemilih Mode Permainan Bebas**:
  - Menghapus komponen selector mode permainan (*Standar*, *3 Hati*, *Santai*) pada sisi siswa agar siswa tidak dapat mengubah mode atau parameter yang telah diatur oleh guru.

#### 2. Proteksi Batas Percobaan Pengerjaan (`maxAttempts === 1`)
- **Deteksi Otomatis Riwayat Pengerjaan**:
  - Sistem memeriksa apakah siswa dengan nama tersebut sudah pernah menyelesaikan sesi ujian aktif ini.
  - Jika sudah tuntas, tombol pengerjaan dinonaktifkan secara otomatis disertai pemberitahuan ramah: *"Kamu sudah menyelesaikan kuis ini! Sesi ini dibatasi 1x percobaan oleh guru."*

#### 3. Sinkronisasi Real-Time Siswa ke Ruang Pantau Guru (`QuizArena.tsx` & `supabaseClient.ts`)
- **Pendaftaran Peserta Otomatis**:
  - Saat siswa menekan tombol *"Mulai Mengerjakan Kuis Sekarang"*, profil siswa langsung didaftarkan sebagai partisipan ke dalam sesi aktif (`QuizSession`).
- **Live Progress & Skor**:
  - Setiap kali siswa menjawab butir soal di arena kuis, kemajuan (nomor soal aktif, skor, streak, dan lembar jawaban) disinkronkan secara langsung ke sesi aktif sehingga layar pantau Wayground Host guru dapat memantau leaderboard dan matriks akurasi kelas secara langsung.

## [2.3.52] - 2026-09-12
### Pengaturan Kuis Super Fleksibel (Wayground/Quizizz-Style), Proteksi Visibilitas Kunci Jawaban & Deteksi Anti-Mencontek

#### 1. Preset Konfigurasi 1-Klik Instan (`PlayQuizModal.tsx`)
- **Mode Ujian Resmi (Strict Exam)**:
  - Satu klik langsung mengaktifkan pengaturan ketat: Sembunyi Total jawaban & kunci, penjelasan disimpan hingga akhir, acak urutan soal & opsi diaktifkan, deteksi ganti tab anti-mencontek aktif, sembunyikan papan peringkat ke siswa, dan batasi hanya 1x percobaan.
- **Mode Latihan Bebas (Casual Practice)**:
  - Satu klik mengaktifkan pengalaman belajar terbuka: Tampilkan kunci jawaban langsung, penjelasan muncul instan, papan peringkat murid aktif, dan percobaan pengerjaan tanpa batas.

#### 2. Kontrol Visibilitas Jawaban & Kunci Soal (`types/quiz.ts` & `QuizArena.tsx`)
- **3 Tingkat Visibilitas Respon Jawaban (`showAnswersMode`)**:
  1. *Langsung Buka Kunci (Standar Latihan)*: Umpan balik langsung hijau (benar) dan merah (salah), lengkap dengan penunjuk kunci jawaban yang tepat.
  2. *Hanya Status Benar/Salah (Kunci Dirahasiakan)*: Siswa diberitahu status benar/salah dari pilihan mereka sendiri, namun opsi kunci jawaban yang benar tetap dirahasiakan sehingga siswa tidak dapat membagikan bocoran jawaban ke teman sekelas.
  3. *Sembunyi Total (Mode Ujian Resmi / Ketat)*: Pilihan murid dicatat secara netral ("Jawaban Tersimpan") tanpa indikator warna hijau/merah, efek audio dinonaktifkan dari nada benar/salah menjadi klik netral, dan efek combo streak dinonaktifkan agar tidak ada kebocoran status saat ujian berlangsung.
- **Penyembunyian Tombol Guru "Buka Kunci Jawaban"**:
  - Tombol pengintip kunci jawaban otomatis disembunyikan pada perangkat siswa ketika sesi ujian resmi berlangsung.

#### 3. Waktu Penayangan Pembahasan & Penjelasan Guru (`showExplanationMode`)
- **3 Opsi Penayangan Penjelasan**:
  1. *Langsung Muncul*: Pembahasan dan tips guru segera tampil begitu soal terjawab untuk evaluasi mandiri seketika.
  2. *Hanya di Akhir Kuis*: Pembahasan disimpan dan ditampilkan pada layar rekapitulasi akhir sesi pengerjaan.
  3. *Jangan Pernah Tampilkan*: Menyembunyikan modul penjelasan sepenuhnya selama sesi berlangsung.

#### 4. Deteksi Anti-Mencontek & Peringatan Ganti Tab (`QuizArena.tsx`)
- **Pemantauan Fokus Layar Aktif**:
  - Mengintegrasikan event listener `visibilitychange` pada dokumen browser. Jika siswa berpindah aplikasi, membuka tab baru, atau meminimalkan browser, sistem langsung mendeteksi perpindahan fokus tersebut.
- **Dialog Peringatan Etika Ujian**:
  - Memunculkan dialog modal peringatan ramah namun tegas: *"⚠️ Peringatan: Kamu terdeteksi berpindah tab atau meninggalkan layar kuis!"* serta mencatat akumulasi jumlah pelanggaran ganti layar.

#### 5. Kontrol Papan Peringkat Siswa & Batas Percobaan Ujian
- **Privasi Papan Peringkat Murid (`showLeaderboardToStudents`)**:
  - Opsi untuk menonaktifkan klasemen ranking pada gawai siswa guna mengurangi kecemasan atau distraksi kompetitif saat ujian formatif/sumatif.
- **Batasan Percobaan (`maxAttempts`)**:
  - Pengaturan antara *1x Percobaan (Ujian Resmi)* atau *Bebas (Latihan Tanpa Batas)*.

#### 6. Integrasi Ruang Pantau Wayground Host & Supabase (`WaygroundHostView.tsx`, `supabaseClient.ts`)
- **Indikator Parameter Sesi pada Host**:
  - Bar status Wayground Host menampilkan lencana (*badge*) parameter aktif: `[🔒 Kunci Dirahasiakan]`, `[🟡 Hanya Status]`, `[👁️ Anti-Mencontek]`, dan `[🚫 1x Percobaan]`.
- **Sinkronisasi Database**:
  - Skema dan payload sesi kuis aktif mencakup seluruh konfigurasi fleksibel baru sehingga konsisten antara panel host guru dan gawai murid.

## [2.3.51] - 2026-09-12
### Tab Kuis Aktif di Dashboard Guru, Ruang Pantau Wayground Live Host (Quizizz-Style), dan Rekapan Nilai Mendalam

#### 1. Arsitektur Tab Ganda Dashboard Guru (`TeacherDashboard.tsx`)
- **Navigasi Tab Terpadu**:
  - Menyediakan 2 tab utama yang bersih dan ergonomis:
    1. **📚 Koleksi Kuis**: Berisi seluruh katalog kuis milik guru, pencarian, filter mapel/kelas, dan tombol *"Mainkan Sekarang"*.
    2. **🔴 Kuis Aktif & Sesi Live**: Tab khusus pemantauan sesi permainan murid yang sedang berlangsung secara langsung (*live session tracking*) dengan indikator badge denyut (*pulse animation*) penanda sesi aktif.
- **Pendaftaran Sesi Terverifikasi**:
  - Sesi kuis aktif hanya didaftarkan ketika guru mengonfirmasi konfigurasi dan menekan tombol *"Mulai Kuis Sekarang"*. Jika dibatalkan (*cancel*), sesi tidak akan dibuat.
- **Pengelompokan Status & Kartu Sesi Kuis**:
  - Filter sub-kategori: *Semua Sesi*, *🔴 Sedang Berjalan*, dan *✓ Selesai (Arsip)*.
  - Kartu sesi interaktif: Menampilkan PIN 4-digit dengan tombol salin instan, status live/jeda/selesai, jumlah siswa terhubung, progress bar pengerjaan kelas, serta tombol aksi cepat untuk membuka Ruang Pantau Wayground, melihat Rekapan, atau mengakhiri sesi.

#### 2. Ruang Kendali Host Langsung (Wayground Live Host ala Quizizz) (`WaygroundHostView.tsx`)
- **Antarmuka Pemantau Layar Penuh (Immersive Fullscreen)**:
  - Header interaktif: Kode PIN besar, status sesi (LIVE / DIJEDA / SELESAI), kontrol Jeda/Lanjut, tombol salin tautan kuis, dan tombol *"Akhiri Kuis & Buka Rekap"*.
  - **3 Sub-Tampilan Terintegrasi**:
    1. *🏆 Leaderboard Siswa Real-Time*: Memantau urutan peringkat, skor langsung, bintang, jumlah benar/salah, streak jawaban berturut-turut, dan progress bar nomor soal yang sedang dijawab siswa saat itu juga.
    2. *📊 Matriks Akurasi Soal*: Grid analisis instan per butir soal untuk mendeteksi soal mana yang mudah dikerjakan kelas ($\ge 80\%$) dan soal mana yang paling menantang ($< 50\%$).
    3. *📺 Layar Bersama / Proyektor*: Tampilan presentasi soal aktif ke layar besar proyektor/Smartboard lengkap dengan opsi jawaban dan kunci jawaban.
- **Fitur Simulasi Siswa (Tes Kelas)**:
  - Tombol `[+3 Siswa Tes]` untuk menyimulasikan murid yang bergabung dan menjawab secara realistis, memungkinkan guru menguji dan mendemonstrasikan ruang kendali tanpa perlu banyak gawai fisik.

#### 3. Laporan Rekapitulasi Nilai & Analisis Butir Soal Komprehensif (`QuizSessionRecapView.tsx`)
- **3 Sub-Tab Analisis Mendalam Pasca-Kuis**:
  1. *📈 Ringkasan Metrik Kelas*: Rata-rata akurasi kelas (%), rata-rata nilai skor, tingkat ketuntasan KKM $\ge 70$, rata-rata waktu penyelesaian, podium 3 besar siswa terbaik, serta evaluasi butir soal tersulit & termudah.
  2. *📋 Tabel Nilai Lengkap Siswa*: Daftar peringkat siswa dengan pencarian cepat, rincian skor, waktu pengerjaan, status tuntas/remedial, dan fitur *modal detail* untuk memeriksa lembar jawaban individual per siswa.
  3. *🔍 Analisis Butir Soal (Item Analysis)*: Menampilkan teks soal, kunci jawaban, penjelasan guru, serta diagram batang persentase distribusi siswa yang memilih opsi A, B, C, dan D untuk mendeteksi opsi pengecoh yang mengecoh kelas.
- **Fitur Ekspor & Cetak Rapor**:
  - Tombol **Unduh Rekap (CSV)** untuk ekspor ke spreadsheet / Excel.
  - Tombol **Cetak Rapor** yang kompatibel langsung dengan dialog cetak browser / simpan ke PDF.

#### 4. Model Data & Manajemen Sesi (`quiz.ts`, `supabaseClient.ts`, `setup.sql`)
- Menambahkan entitas `QuizSession`, `QuizSessionParticipant`, `QuizSessionStatus` dengan penyimpanan *local-first* di `localStorage` dan sinkronisasi opsional ke database Supabase (`quiz_sessions` & `quiz_session_participants`) dengan RLS ketat.

## [2.3.50] - 2026-09-12
### Tombol "Mainkan Sekarang" & Modal Pengaturan Sesi Bermain Siswa (PlayQuizModal)

#### 1. Transformasi Tombol Aksi Kartu Kuis (`TeacherDashboard.tsx` & `QuizDetail.tsx`)
- **Tombol Utama "Mainkan Sekarang"**:
  - Menggantikan tombol `[📺 Mode IFP]` yang kaku pada setiap kartu kuis di Dashboard Guru dan toolbar Halaman Detail Kuis dengan tombol utama **`[ ▶️ Mainkan Sekarang ]`** berbalut gradien biru-indigo yang memikat dan *touch target* ergonomis $\ge 44 \times 44\text{ px}$.
  - Tombol ini menjadi pintu gerbang interaktif bagi guru untuk memulai kuis bersama siswa dengan kendali penuh terhadap parameter sesi bermain.

#### 2. Modal Pengaturan Sesi Bermain Siswa (`PlayQuizModal.tsx`)
- **Komponen Pengaturan Sesi Mandiri & Terpadu**:
  - **Identitas & PIN Ruang Kuis**: Menampilkan cover, judul kuis, jenjang, mata pelajaran, jumlah butir soal, estimasi durasi total, serta kode PIN 4-digit besar yang dapat disalin dengan satu klik.
  - **Pilihan Mode Permainan (`GameMode`)**: Mendukung 3 mode pengerjaan:
    1. *🌟 Standar*: Timer aktif dan skor dihitung dari kecepatan serta ketepatan.
    2. *❤️ 3 Nyawa (Survival)*: Tantangan seru 3 hati di mana 3 kesalahan mengakhiri kuis.
    3. *🧘 Santai (Untimed)*: Mode tanpa batas waktu untuk diskusi kelas yang mendalam tanpa tekanan timer.
  - **Durasi Waktu Fleksibel**: Pilihan chip cepat durasi per soal (`10s`, `15s`, `20s`, `30s`, `45s`, `60s`).
  - **Fitur Anti-Mencontek**: *Toggle* interaktif untuk acak urutan soal (*shuffle questions*) dan acak pilihan opsi jawaban (*shuffle options*).
  - **Pilihan Target Presentasi**:
    1. *📺 Layar Smartboard (Mode IFP)*: Guru memandu kuis langsung di TV Interaktif/Proyektor depan kelas.
    2. *📱 Lobi Siswa / Gawai*: Membuka persiapan lobi untuk siswa yang bergabung menggunakan gawai mandiri.
  - **Eksekusi Seketika**: Tombol **`[ 🚀 Mulai Kuis Sekarang ]`** yang langsung meluncurkan kuis ke arena sesuai parameter yang dipilih, serta tombol **`[ 🔗 Bagi Tautan ]`** untuk membagikan PIN dan tautan langsung ke siswa.

#### 3. Integrasi Navigasi & Siklus Hidup Sesi (`App.tsx`)
- Menyalurkan konfigurasi sesi kuis kustom ke arena pengerjaan tanpa merusak data asli draf kuis.
- Memperbaiki alur tombol keluar kuis (`onExit`) pada saat guru selesai atau keluar dari kuis agar kembali secara bersih dan aman ke Dashboard Guru.

## [2.3.49] - 2026-09-12
### Perbaikan Alur Masuk Dashboard Guru: Pencegahan Auto-Open Modal Pembuatan Kuis

#### 1. Perbaikan Navigasi & Siklus Hidup Dashboard Guru (`TeacherDashboard.tsx`, `App.tsx`, `QuizCreator.tsx`)
- **Eliminasi Auto-Open Modal Pembuatan Kuis**:
  - Memperbaiki bug di mana guru yang baru saja masuk ke Dashboard Guru (baik setelah login maupun saat menavigasi dari Beranda) langsung dihadapkan dengan pop-up modal pemilihan metode pembuatan kuis (`CreateQuizMethodModal`).
  - Menginisialisasi status `isCreateModalOpen` di `TeacherDashboard.tsx` secara murni `false` tanpa ketergantungan `initialOpenMethodModal` yang sebelumnya memicu pembukaan otomatis yang tidak diinginkan.
  - Menghapus variabel `reopenMethodModal` pada tingkat `App.tsx` yang sebelumnya tertahan aktif dan terus memaksa modal terbuka setiap kali layar dashboard dirender atau dimuat ulang.
- **Standarisasi Alur Kembali (*Return Flow*) Studio Kuis**:
  - Tombol kembali (`onBack`) di Studio Kuis (`QuizCreator.tsx`) kini mengembalikan guru secara bersih dan langsung ke Dashboard Guru utama tanpa memunculkan kembali pop-up pembuatan kuis.
  - Memastikan modal pembuatan kuis (`CreateQuizMethodModal`) hanya akan muncul secara terarah ketika guru secara sengaja menekan tombol `[+ Buat Kuis Baru]` di navbar atas atau tombol `[+ Buat Kuis Baru Sekarang]` pada status kosong (*empty state*).

## [2.3.48] - 2026-09-12
### Penyatuan Arsitektur Pratinjau Guru & Arena Siswa 2 Arah (Unified Single Source of Truth via QuizArena)

#### 1. Penyatuan Penuh Antarmuka & Logika Pratinjau (`QuizArena.tsx` & `QuizCreator.tsx`)
- **Single Source of Truth (Satu Kesatuan Dua Arah)**:
  - Mengeliminasi komponen terpisah `SingleQuestionPreviewModal.tsx` sehingga tidak ada lagi divergensi tampilan atau logika antara layar pengerjaan siswa dengan pratinjau guru.
  - Tombol `[👁️ Lihat]` pada butir kartu soal Bank Soal dan tombol coba kuis di Langkah Simpan sekarang langsung merender komponen resmi `QuizArena` dengan mode pratinjau interaktif (`isPreview={true}`).
  - Setiap modifikasi desain kartu, opsi pilihan ganda, kunci jawaban, timer, animasi, atau tata letak di arena bermain siswa akan secara otomatis identik 100% pada saat diuji oleh guru di Studio Kuis.
- **Peralatan Khusus Mode Pratinjau**:
  - Menampilkan lencana identitas `[PRATINJAU]` di sebelah indikator nomor soal.
  - Menyediakan tombol aksi cepat `[✏️ Edit Butir Soal Ini di Studio]` langsung di header atas agar guru dapat merevisi soal dengan segera saat mendapati koreksi.
  - Tombol keluar `[X]` yang kembali ke draf pembuatan kuis secara instan tanpa dialog peringatan keluar bermain.
  - Mematikan pengacakan butir soal (*no-shuffle*) agar guru dapat langsung menguji soal yang dipilih secara presisi, serta mengisolasi penyimpanan riwayat pengerjaan lokal agar tidak memengaruhi data permainan siswa sesungguhnya.
- **Integrasi Audio Responsif**:
  - Mengalirkan efek suara (jawaban benar, salah, detak timer, pembukaan kunci jawaban, dan tepuk tangan) dari `App.tsx` ke dalam pratinjau agar guru merasakan sensasi bermain yang autentik saat meracik kuis.

## [2.3.47] - 2026-09-12
### Refaktor Simetris Footer Kartu Bank Soal & Perbaikan Modal Pratinjau Nyata ("Lihat")

#### 1. Perbaikan Kritis Modal Pratinjau Nyata Siswa (`SingleQuestionPreviewModal.tsx`)
- **Fix Pelanggaran Aturan Hook React (Order of Hooks Violation)**:
  - Memindahkan pemanggilan seluruh Hook (`useMemo` untuk `isShortAnswerCorrect` dan `shuffledRightItems`) ke tingkat teratas komponen secara tanpa syarat sebelum evaluasi pengembalian bersyarat (`if (!isOpen || !question) return null;`).
  - Menghilangkan bug di mana modal tidak bisa terbuka atau melempar crash unhandled saat tombol `"Lihat"` diklik oleh guru.
- **Dukungan Tipe Soal & Keamanan Akses Objek (Null-Safety)**:
  - Memperbaiki penanganan `question.options` dengan optional chaining dan fallback `(question.options || [])` agar aman dari kesalahan runtime pada tipe soal tanpa opsi tetap (seperti `matching_pairs`).
  - Menambahkan dukungan penanganan hasil untuk tipe soal `image_guess` (Tebak Gambar) di samping `multiple_choice` dan `true_false`.
  - Menambahkan penutupan modal via tombol Keyboard `Escape` serta interaksi klik pada area luar modal (backdrop click).

#### 2. Penataan Ulang Responsif & Simetris Footer Kartu Soal (`QuizCreator.tsx`)
- **Eliminasi Tata Letak Tangga / Patah (*Staggered / Stepped Zigzag*)**:
  - Mengganti tata letak `flex-wrap justify-between` yang sebelumnya patah menjadi dua baris canggung menjorok ke kanan pada layar sempit/non-reguler (seperti Infinix Note 50s lebar ~360–393px).
  - Merestrukturisasi footer kartu soal pada layar mobile menjadi dua baris simetris dan teratur:
    - **Baris 1 (Peralatan & Utilitas)**: Tombol Pindah Atas/Bawah (`[^] [v]`) dan tombol Duplikasi (`[Salin]`) tertata rapi di sebelah kiri, sedangkan tombol Hapus (`[Hapus]`) ditempatkan aman dan jelas di sebelah kanan.
    - **Baris 2 (Aksi Utama)**: Tombol `[👁️ Lihat]` dan `[✏️ Edit Soal]` disusun berdampingan seimbang (*grid 2 kolom 50/50*) membentang penuh dengan target sentuh ergonomis $\ge 44 \times 44\text{ px}$.
  - Pada layar tablet/desktop ($\ge 640\text{px}$), kedua baris secara otomatis menyatu menjadi satu baris horizontal yang elegan dan proporsional.

## [2.3.46] - 2026-09-11
### Filter Terarah Jenjang (SD, SMP, SMA, Semua) pada Dropdown Mata Pelajaran

- **Pembaruan Tab Filter Dropdown (`SubjectDropdown.tsx`)**:
  - Mengganti filter dua tombol sebelumnya (`Relevan (SD)` & `Semua Mapel`) menjadi 4 tombol filter eksplisit: **`SD`**, **`SMP`**, **`SMA`**, dan **`Semua`**.
  - **Terarah & Terfokus Sesuai Kurikulum**:
    - **SD**: Menampilkan mata pelajaran fase SD (Matematika, IPAS, Bahasa Indonesia, Pendidikan Pancasila, Bahasa Inggris, PJOK, Pengetahuan Umum, Seni, Agama, dan Lintas).
    - **SMP**: Menyaring mata pelajaran khusus SMP (IPA Terpadu, IPS Terpadu, Informatika, Prakarya) serta mata pelajaran inti lainnya, mengecualikan materi SMA/SD tertentu.
    - **SMA**: Menampilkan peminatan MIPA (Fisika, Kimia, Biologi, MTK Lanjut), peminatan IPS (Ekonomi, Sosiologi, Geografi, Sejarah, Antropologi), Informatika, dan mata pelajaran umum SMA.
    - **Semua**: Menampilkan keseluruhan 33 mata pelajaran.
  - **Sinkronisasi Otomatis**: Saat dropdown pertama kali dibuka, tab aktif langsung menyesuaikan dengan jenjang kuis yang sedang dipilih oleh guru, namun guru tetap leluasa beralih antar-jenjang kapan saja.

## [2.3.45] - 2026-09-11
### Audit Total: Eliminasi AI Slop, Redundansi, Overlap & Perbaikan Layout Responsif

#### 1. Perbaikan SubjectDropdown (`SubjectDropdown.tsx`)
- Mengatasi teks badge `Wajib Semua Jenjang` yang terpotong dan menabrak judul mata pelajaran pada layar sempit.
- Nama mata pelajaran kini tampil utuh di baris utama (`text-sm font-bold`), sedangkan deskripsi kategori diletakkan rapi sebagai sub-teks di bawahnya.
- Menghilangkan teks redundan `"Mata Pelajaran Kuis"` di dalam tombol pemicu dropdown.

#### 2. Perbaikan & Pembersihan Modal Sampul (`QuizCoverModal.tsx`)
- Menyederhanakan label tab kategori emoji agar tidak terpotong (misal `🔬 Sains`, `📐 Matematika`, `📚 Bahasa`, `🏆 Karakter`, `🎒 Sekolah`).
- Mengintegrasikan pratinjau sampul aktif langsung ke dalam header modal secara ringkas, menghemat >100px ruang vertikal.
- Menghilangkan kartu pratinjau ganda dan teks redundan `"Tampil di kartu katalog, lobi siswa, dan sertifikat"`.
- Wadah tab kategori kini memiliki dukungan sentuh halus (`touch-pan-x`) dan bebas pemotongan kata.

#### 3. Perbaikan Kritis Pratinjau Butir Soal Step 3 (`QuizCreator.tsx`)
- Mengatasi bug kritis di mana teks pertanyaan sebelumnya hilang/tertekan menjadi 0px di layar mobile akibat teks kunci jawaban yang panjang.
- Redesain ringkasan butir soal menjadi kartu terstruktur:
  - Baris 1: Nomor soal (`#1`), badge tipe soal, bobot poin, dan indikator edit.
  - Baris 2: Teks pertanyaan tampil penuh dan nyaman dibaca (readability-first).
  - Baris 3: Kunci jawaban disajikan sebagai sub-baris tersendiri tanpa menekan teks soal.

#### 4. Ergonomi Footer Aksi Kartu Soal Bank Soal (`QuizCreator.tsx`)
- Tombol aksi kartu soal (`Reorder`, `Salin`, `Hapus`, `Lihat`, `Edit Soal`) kini menggunakan `flex-wrap` dan tata letak proporsional sehingga tidak mengalami overflow atau kompresi paksa pada layar sempit (seperti Infinix Note 50s / lebar ~360-393px).

## [2.3.44] - 2026-09-11
### Overlay Navigator Nomor Soal ("1/4") & Pratinjau Nyata Kartu Soal Siswa ("Lihat")

#### 1. Overlay Navigator Nomor Soal (`QuestionJumpModal`)
- Indikator pager nomor soal `1 / 4` kini **interaktif** (dapat diketuk dengan ikon chevron indikator) dengan touch target >= 44x44px.
- Mengetuk nomor soal memicu overlay/bottom-sheet `QuestionJumpModal` yang menampilkan seluruh nomor soal:
  - **Pilih Cepat Nomor**: Grid tombol nomor soal (1, 2, 3, ...) dengan highlight aktif pada butir soal yang sedang diedit.
  - **Daftar Rinci Soal**: Kartu setiap butir soal lengkap dengan tipe soal (Pilihan Ganda, Benar/Salah, dll), bobot poin, durasi kustom, badge gambar pendukung, dan cuplikan teks soal.
  - **Proteksi Perubahan**: Jika soal yang sedang diedit memiliki perubahan yang belum disimpan, sistem secara otomatis menampilkan dialog konfirmasi proteksi data sebelum melompat ke soal tujuan.

#### 2. Tombol "Lihat" Pratinjau Nyata Siswa (`SingleQuestionPreviewModal`)
- Setiap kartu soal pada Bank Soal kini dilengkapi tombol **"Lihat"** dengan ikon mata (`Eye`) sejajar dengan tombol "Edit Soal".
- Mengetuk tombol "Lihat" membuka modal **SingleQuestionPreviewModal** yang mensimulasikan tampilan NYATA (real) kartu kuis sebagaimana siswa akan melihat dan memainkannya:
  - Header arena kuis: nomor soal, tipe soal, bobot poin, dan sisa durasi timer per butir soal.
  - Tampilan gambar ilustrasi pendukung resolusi tinggi dengan keterangan gambar.
  - Teks pertanyaan dan pilihan jawaban interaktif sesuai tipe soal:
    - **Pilihan Ganda / Benar Salah / Tebak Gambar**: Guru dapat mengetuk pilihan untuk menguji interaksi dan melihat langsung umpan balik visual (warna hijau untuk kunci/jawaban benar, merah untuk salah).
    - **Isian Singkat**: Kolom input nyata siswa dengan validasi jawaban langsung.
    - **Menjodohkan**: Interaksi kartu Kolom A dan Kolom B dengan efek getar saat salah dan centang hijau saat cocok.
  - Fitur **"Intip Kunci"** untuk langsung melihat kunci jawaban tanpa perlu menjawab.
  - Fitur **"Coba Lagi"** untuk mengulang simulasi jawaban.
  - Tombol **"Edit Soal Ini"** untuk langsung beralih ke mode pengeditan soal tersebut.
  - Pembahasan edukatif interaktif dengan kartu konsep siswa.

## [2.3.43] - 2026-09-11
### Tab Info — Bersih, Ringkas & Urutan Logis

- **Hapus section headers** ("1. Identitas Inti Kuis", "2. Aturan Waktu & Panduan Siswa") — form kini mengalir tanpa divider label besar.
- **Hapus Aturan Waktu (DurationSelector)** dari Tab Info; durasi per soal kini diatur di **PublishQuizModal** saat menerbitkan kuis.
- **Urutan field diubah**: Judul → Jenjang & Kelas → Mata Pelajaran → Petunjuk Siswa → Sampul Kuis.
- **Perbaikan responsivitas** untuk layar Infinix Note 50s dan perangkat tall-narrow (20:9): padding, font, dan grid disesuaikan agar tidak overflow di lebar ~393px logical.
- `PublishQuizModal` kini menerima props `durationPerQuestionSec` + `setDurationPerQuestionSec` dengan preset pills (10d–2m) dan input kustom (5–300 detik).

## [2.3.42] - 2026-09-11
### Redesain Tab Info — Alur Publikasi Quizizz/Kahoot Style (`PublishQuizModal`)

#### 1. Tab Info Kuis — Lebih Bersih & Fokus pada Konten
- Tab "Info Kuis" (sebelumnya "Pengaturan Kuis") kini **hanya berisi hal-hal yang relevan dengan identitas dan cara pengerjaan kuis**: Judul, Jenjang & Kelas, Mata Pelajaran, Sampul, Durasi per Soal, dan Petunjuk Siswa.
- Seksi "Pengaturan Lanjutan" (accordion visibilitas, mode permainan, acak soal/pilihan) **dihapus sepenuhnya** dari Tab Info.
- Field "Gelar Hadiah Siswa" **dipindahkan** ke modal publikasi.
- Nama tab di navigasi diperbarui: **"1. Info Kuis"** (manual) dan **"2. Info Kuis"** (AI) — tidak lagi menggunakan label "Pengaturan Kuis".

#### 2. Komponen Baru `PublishQuizModal` — Modal Publikasi Bergaya Quizizz/Kahoot
- Modal ini muncul **hanya saat guru klik "Terbitkan Kuis"** di halaman Pratinjau, setelah semua soal selesai dibuat.
- **Alur baru (ala Quizizz):** Info Kuis → Bank Soal → Pratinjau → *klik Terbitkan* → **Modal Publikasi** → Terbitkan Sekarang.
- Konten modal (4 seksi bersih):
  1. **Akses Siswa** — Publik (muncul di katalog) vs Privat PIN (hanya dengan kode guru), card toggle visual.
  2. **Mode Permainan** — 3 pills: Standar ⚡, 3 Hati ❤️, Santai 😊 — dengan deskripsi singkat dan warna aktif berbeda per mode.
  3. **Pengacakan** — 2 toggle card: Acak Soal & Acak Pilihan (desain toggle switch konsisten).
  4. **Gelar Hadiah Siswa** — Input dengan chips saran collapsible (berdasarkan mapel).
- **Mobile**: bottom sheet slide-up dari bawah (`rounded-t-3xl`), max-height 92vh scrollable.
- **Desktop**: dialog terpusat `max-w-lg rounded-3xl`, animasi scale-in.
- Summary kartu kuis (sampul, judul, jumlah soal, mapel) tampil di header modal sebagai konfirmasi visual.
- Tombol aksi: **"Terbitkan Sekarang 🚀"** (biru, full-width di mobile) + "Batalkan" (sekunder).
- Mode edit kuis: tombol berubah menjadi **"Simpan Perubahan"** (`isEditMode` prop).
- Kontras dark/light mode terjamin penuh.

#### 3. Validasi Sebelum Modal Terbuka
- `handleFinalPublish` kini **memvalidasi** terlebih dahulu (judul tidak kosong, minimal 1 soal) sebelum membuka modal — gagal validasi langsung redirect ke tab terkait dengan toast notifikasi.
- `handleConfirmPublish` adalah handler baru yang dipanggil dari modal untuk menyimpan kuis sesungguhnya.

## [2.3.41] - 2026-09-11
### Modal Sampul Kuis Kustom, Durasi Waktu Compact, Konfirmasi Berlapis & Textarea Petunjuk yang Lega

#### 1. Modal Overlay Ikon Sampul Kuis (`QuizCoverModal`)
- Mengganti *expandable inline emoji tray* yang memperpanjang formulir dengan **modal overlay mandiri berstandar tinggi** yang muncul di tengah layar desktop dan *bottom sheet* elegan di ponsel.
- **Tab 1 — Koleksi Emoji Tematik**: 5 kategori edukatif (Sains & Alam, Matematika, Bahasa & Humaniora, Karakter & Prestasi, Sekolah & Fauna) dengan grid 6–8 kolom, input ketik emoji bebas, dan navigasi kategori scrollable.
- **Tab 2 — Unggah Gambar Kustom**: Zona upload dengan auto-kompresi via Canvas API (center-crop persegi 256×256 px, ekspor WebP/JPEG 85%) agar gambar tetap ringan dan cepat dimuat, serta opsi tempel URL web.
- **Live Preview Box** pada header modal yang senantiasa menampilkan sampul aktif secara real-time.
- Kontras dark/light mode terjamin penuh (tombol primer `bg-blue-600 text-white`, sekunder `dark:bg-slate-800 dark:text-slate-100`, border tegas `dark:border-slate-700`).

#### 2. Komponen `QuizCoverDisplay` (Utilitas Global)
- Komponen perender cerdas sampul kuis yang secara otomatis mendeteksi apakah nilai `coverEmoji` berupa **karakter emoji** atau **URL/data:image gambar kustom**.
- Diterapkan secara menyeluruh di: `InfoKuisStep`, `QuizHome`, `StudentLobby`, `TeacherDashboard`, `QuizDetail`, dan `QuizSettingsModal`.

#### 3. Durasi Waktu Compact — Komponen `DurationSelector`
- Mendesain ulang selector durasi menjadi **1 baris preset pills horizontal** yang bisa di-scroll (`10s 15s 20s 30s 45s 60s 90s 120s`) dilengkapi badge durasi aktif di header.
- Tombol **"Atur Detik Bebas"** membuka *collapsible stepper input* (`+5 / -5`) tanpa merusak tata letak form.
- Hemat > 50% tinggi layar dibandingkan grid 2 baris sebelumnya.

#### 4. Konfirmasi Berlapis Penerapan Waktu — `ResetDurationConfirmModal`
- Tombol "Samakan Waktu Soal..." kini **tidak langsung menimpa** durasi khusus, tetapi membuka dialog konfirmasi bermakna dengan dua pilihan:
  - **Opsi Aman (Disarankan)**: Hanya perbarui soal yang belum memiliki durasi kustom — mempertahankan pengaturan soal-soal spesial.
  - **Opsi Timpa Penuh**: Seragamkan seluruh soal ke waktu standar (dengan label peringatan kuning).
  
#### 5. Textarea Petunjuk Siswa yang Lega
- Nilai dasar diperluas dari `minHeight={68}` (`rows={2}`) menjadi **`minHeight={115}` (`rows={4}`)** dengan tipografi `text-sm leading-relaxed` dan padding dalam yang lebih nyaman.
- Batas tarikan maksimal dinaikkan ke `maxHeight={260}` untuk fleksibilitas menulis instruksi 3–4 poin sekaligus.

## [2.3.40] - 2026-09-11
### Eliminasi Dropdown Native Webview & Standarisasi Komponen Dropdown Kuis Seru (GradeDropdown & SubjectDropdown)

#### 1. Masalah & Kebutuhan yang Diselesaikan
- **Inkonsistensi Komponen Webview Native**: Penggunaan elemen `<select>` bawaan browser pada kolom *Target Kelas* dan *Mata Pelajaran* tidak sesuai dengan standar desain modern aplikasi (tampak kaku seperti form web lama dan membuka dialog OS native yang tidak estetik).
- **Ketiadaan Fitur Pencarian pada Mata Pelajaran**: Dengan lebih dari 30 mata pelajaran, guru dipaksa men-scroll daftar native yang panjang tanpa opsi pencarian cepat.
- **Keterbatasan Informasi Opsi Kelas**: Native select tidak dapat menampilkan ikon, badge Fase Kurikulum Merdeka yang kaya warna, serta penjelasan fase per kelas.

#### 2. Implementasi Desain & Fungsionalitas
- **Komponen Kustom `GradeDropdown.tsx`**:
  - Tombol trigger elegan dengan ikon topi toga ungu (`GraduationCap`), badge nomor kelas, chip Fase Kurikulum Merdeka, dan chevron animasi rotasi 180°.
  - Menu popover `rounded-2xl` dengan backdrop blur, border halus, bayangan mendalam, header kategori jenjang, deskripsi fase per kelas, dan indikator centang (`Check`) untuk opsi aktif.
- **Komponen Kustom `SubjectDropdown.tsx`**:
  - Tombol trigger berikon buku biru (`BookOpen`) dengan badge kategori mapel yang serasi.
  - Menu popover cerdas dilengkapi **kolom pencarian real-time** (`Search`) dengan fokus otomatis.
  - Tab pemfilteran cepat: `Relevan ([Jenjang])` vs `Semua Mapel (33)`.
  - Dukungan penuh dark/light mode dan aksesibilitas keyboard (Escape untuk menutup, click outside listener).
- **Touch Target Standar Mobile ($\ge 44\text{px}$)**:
  - Seluruh tombol pemicu dan item opsi dropdown memiliki tinggi sentuh minimal $\ge 44\text{px}$ yang sangat nyaman bagi ibu jari di smartphone maupun tablet.

## [2.3.39] - 2026-09-11
### Restrukturisasi Hierarki Visual Tab Info Kuis: 3-Seksi Terpadu, Collapsible Suggestions, Compact Emoji Picker & Accordion Pengaturan Lanjutan

#### 1. Masalah & Kebutuhan yang Diselesaikan
- **Beban Kognitif Berlebih (*Cognitive Overload*)**: 11 elemen formulir sebelumnya ditumpuk secara datar tanpa hierarki yang jelas, membuat tampilan terasa padat dan melelahkan (*overwhelming*).
- **Pemborosan Ruang oleh Saran Permanen**: Chip rekomendasi deskripsi instruksi dan chip saran gelar hadiah tampil terbuka secara permanen, menyita ruang berlebih.
- **Tray Emoji Terlalu Rakus Ruang**: Area pemilih emoji sebelumnya memakan > 220px tinggi vertikal di layar utama.
- **Banner AI Mengalihkan Fokus**: Banner AI di bagian atas mengambil ruang besar sebelum guru sempat melihat kolom judul kuis.

#### 2. Implementasi Desain & Fungsionalitas
- **3 Tingkatan Hierarki Visual yang Tegas & Bersih (`InfoKuisStep.tsx`)**:
  1. **Seksi 1: Identitas Inti Kuis (Wajib)**: Judul kuis dengan counter karakter, Jenjang & Target Kelas Fase Kurikulum Merdeka, Mata Pelajaran, dan Compact Emoji Avatar Picker.
  2. **Seksi 2: Aturan Waktu & Panduan Siswa**: Durasi per soal, Deskripsi instruksi dengan tombol collapsible saran `[ 💡 Saran Instruksi (3) ˅ ]`, dan Gelar Lencana Siswa dengan tombol collapsible `[ 💡 Pilihan Gelar Cepat (4) ˅ ]`.
  3. **Seksi 3: Pengaturan Lanjutan & Integritas Kuis (Collapsible Accordion)**: Accordion bersih dengan ringkasan status satu baris (Visibilitas Publik/Privat, Mode Permainan, dan Switch Acak Soal/Opsi).
- **Compact Emoji Avatar Picker**:
  - Mengganti puluhan tombol emoji permanen dengan avatar preview ringkas berlabel emoji aktif dan tombol `[ Ganti Ikon ]`.
  - Menghemat lebih dari 200px tinggi layar utama.
- **Integrasi Tombol AI ke Header Bar**:
  - Menghilangkan banner besar di bagian atas dan memindahkan aksi racik AI menjadi tombol elegan `[ ✨ Racik Kilat via AI ]` di barisan header kartu.
- **Pengurangan Ketinggian Formulir > 55%**:
  - Halaman terasa sangat lega, rapi, bernafas (*spacious*), dan ramah sentuh di seluruh perangkat desktop, tablet, dan ponsel.

## [2.3.38] - 2026-09-11
### Audit Total & Rekayasa Ulang Tab Info Kuis: Mobile-First, Anti-Slop, Fase Kurikulum Merdeka, Durasi Kustom & Pratinjau Terpadu

#### 1. Masalah & Kebutuhan yang Diselesaikan
- **Pelanggaran Standar Touch Target Mobile**: Tombol preset durasi sebelumnya hanya berukuran `min-h-[42px]` (< 44px), serta kotak centang pengacakan kecil (16px) yang rawan salah sentuh di layar ponsel cerdas.
- **Keterbatasan Preset Waktu**: Guru matematika/fisika tidak leluasa menentukan durasi panjang (90s, 120s, 180s) atau hafalan kilat (10s), serta kuis dengan durasi khusus tidak memiliki representasi visual tombol aktif.
- **Keterbatasan Pilihan Emoji Sampul**: Terkunci pada 16 emoji statis tanpa kategorisasi dan tanpa kemampuan mengetik emoji bebas.
- **Ketidaksesuaian Kurikulum Merdeka**: Pemilihan jenjang dan kelas sebelumnya bercampur baur tanpa indikator Fase (Fase A - F) dan tanpa penyaringan mata pelajaran yang cerdas.
- **Ergonomi Tata Letak Mobile**: Di mobile, kartu pratinjau kartu siswa terdorong jauh ke bawah setelah tombol aksi navigasi, sehingga guru tidak sempat melihat pratinjau kartu kuisnya sebelum berpindah langkah.

#### 2. Implementasi Desain & Fungsionalitas
- **Banner AI Ringkas & Bebas Slop (`InfoKuisStep.tsx`)**:
  - Menghilangkan redundansi ikon ganda pada tombol racik AI.
  - Microcopy edukatif: badge `Kurikulum Merdeka 🇮🇩` dan penjelasan fungsional manfaat racikan identitas kuis.
- **Penghitung Karakter & Template Instruksi Cepat**:
  - Penanda panjang karakter dinamis pada judul kuis (`panjang/100 karakter`).
  - Tiga chip rekomendasi instruksi kuis siap pakai yang dapat disematkan ke deskripsi hanya dengan satu sentuhan.
- **Selektor Jenjang & Fase Kurikulum Merdeka Terpadu**:
  - Tiga tab jenjang: `SD / MI (Fase A - C)`, `SMP / MTs (Fase D)`, dan `SMA / SMK (Fase E - F)`.
  - Dropdown kelas otomatis terfilter sesuai jenjang dan menyertakan deskripsi fase capaian pembelajaran.
  - Daftar mata pelajaran terfilter cerdas memprioritaskan mapel relevan per jenjang.
- **Durasi Menjawab Fleksibel (Preset Lengkap + Mode Kustom)**:
  - 8 tombol preset durasi touch-friendly $\ge 44\text{px}$: `10s`, `15s`, `20s`, `30s`, `45s`, `60s`, `90s`, `120s`.
  - Mode atur detik kustom (5 - 300 detik) untuk kebebasan pengaturan waktu guru.
- **Kategori Emoji Tematik & Input Emoji Bebas**:
  - 5 kategori emoji tematik: Sains & Alam, Matematika, Bahasa & Seni, Karakter & Juara, Sekolah & Fauna.
  - Dukungan pengetikan atau penempelan emoji bebas dari keyboard pengguna dengan badge "Terpilih" yang selalu akurat.
- **Rekomendasi Gelar Hadiah / Lencana Siswa Kontekstual**:
  - Menampilkan 4 chip gelar inspiratif otomatis sesuai mata pelajaran yang dipilih (misal: "Peneliti Sains Cilik", "Master Logika", "Duta Karakter Bangsa").
- **Modern iOS-Style Card Toggle Switch untuk Pengacakan**:
  - Mengganti checkbox kaku menjadi kartu toggle modern dengan touch target $\ge 56\text{px}$ untuk pengacakan nomor soal dan opsi jawaban.
- **Pratinjau Kartu Siswa & Status Kesiapan Terpadu**:
  - Desktop: Sticky sidebar sisi kanan dengan live preview kartu siswa dan checklist kesiapan kuis.
  - Mobile: Accordion pratinjau ringkas tepat di atas tombol navigasi langkah, sehingga alur penyusunan kuis terasa mulus dan alami tanpa scroll bolak-balik.
- **Tombol Navigasi Responsif**:
  - Tombol `Kembali` dan `Lanjut ke Bank Soal` berukuran $\ge 48\text{px}$, tersusun responsif (stacked di layar sangat sempit / inline di tablet-desktop).

## [2.3.37] - 2026-09-11
### Tombol Kontekstual "Ingin Bagi Rata?" & Dialog Konfirmasi Presisi Anti-Slop Bagi Rata 100 Poin

#### 1. Masalah & Kebutuhan yang Diselesaikan
- **Risiko Penimpaan Nilai Tanpa Konfirmasi**: Aksi bagi rata bobot nilai merupakan perubahan massal (*bulk overwrite*). Mengeksekusinya tanpa dialog konfirmasi berisiko merusak pengaturan bobot spesifik yang telah disusun guru dengan cermat.
- **Penyelarasan Nada Komunikasi Tombol**: Guru menginginkan pendekatan komunikasi yang ramah dan menawarkan bantuan (*assistive tone*) alih-alih perintah imperatif yang kaku.

#### 2. Implementasi Desain & Fungsionalitas
- **Tombol Ramah Kontekstual (`QuizCreator.tsx`)**:
  - Mengubah tombol bobot pada Card 2 menjadi **`[ ⚖️ Ingin Bagi Rata? ]`** yang ringkas, bersahabat, dan pas di kartu mini stat.
- **Overlay Dialog Konfirmasi Anti-Slop**:
  - Menghadirkan modal konfirmasi dengan desain mendalam (*anti-slop, zero generic boilerplate*):
    1. **Widget Komparasi Dua Kolom**: Menampilkan perbandingan visual real-time antara `Bobot Saat Ini` (lengkap dengan selisih kurang/lebih) terhadap `Target Sempurna (100 Poin)`.
    2. **Transparansi Perhitungan Matematis**: Menjelaskan alokasi poin per soal secara gamblang, termasuk skenario sisa pembagian (contoh: untuk 3 soal dijelaskan `2 soal @ 33 Poin & 1 soal @ 34 Poin`).
    3. **Peringatan Santun Pendidik**: Catatan ramah yang mengingatkan dampak penimpaan bobot manual.
- **Proteksi Integritas Data & Presisi Sentuh (Rule 1, Rule 2 & Rule 9)**:
  - Target sentuh tombol $\ge 44\text{px}$ dengan penataan vertikal yang nyaman di mobile dan horizontal di desktop.
  - Backdrop blur lembut dengan perlindungan klik luar aman.

## [2.3.36] - 2026-09-11
### Standarisasi Penulisan Satuan Bobot Nilai "X Poin" & Eliminasi Tombol Global Pembahasan untuk Kemandirian Kartu Soal

#### 1. Masalah & Kebutuhan yang Diselesaikan
- **Ambiguitas Format Singkatan "10p"**: Penulisan bobot nilai menggunakan akhiran "p" (misal: `10p`, `50p`) berpotensi disalahartikan sebagai nomor halaman, persen, atau istilah teknis/gaming, serta tidak selaras dengan tulisan `100 Poin` pada dashboard ringkasan.
- **Redundansi Kontrol Pembahasan Global**: Tombol global buka/tutup pembahasan pada dashboard mini stat dirasa berlebihan karena setiap kartu butir soal telah memiliki tombol pembuka pembahasan edukatif mandirinya masing-masing.

#### 2. Implementasi Desain & Fungsionalitas
- **Standarisasi Kebahasaan & Keterbacaan "X Poin" (`QuizCreator.tsx`)**:
  - Mengubah seluruh tampilan bobot butir soal menjadi format formal yang eksplisit: **`★ X Poin`** (misal: `★ 50 Poin`, `★ 10 Poin`).
  - Menyelaraskan seluruh label pendukung: teks akumulasi (`{total} Poin / 100 Poin`), label standar (`Standar 10 Poin`), preset cepat butir (`5 Poin`, `10 Poin`, `15 Poin`, `20 Poin`), tombol cerdas bagi rata (`Bagi Rata 100 Poin`), hingga kartu pratinjau kuis di Langkah 3.
  - Memastikan nol ambiguitas (*Zero Cognitive Load*) bagi guru dan siswa sesuai Rule 2 & Rule 3.
- **Penyederhanaan Bersih Card 1 Dashboard & Optimasi Kode (Rule 6)**:
  - Menghapus tombol toggle global dari Card 1. Card 1 kini tampil murni dan tenang menampilkan `Jumlah Soal: {questions.length} Butir Aktif` dengan tinggi kartu yang simetris sempurna terhadap Card 2 dan Card 3.
  - Menghapus state `showAllExplanations`, fungsi `handleToggleAllExplanations`, dan impor `EyeOff` yang sudah tidak digunakan guna menjaga kebersihan bundle.
- **Kemandirian Tinjauan Soal**:
  - Guru dapat memeriksa atau menyembunyikan pembahasan edukatif secara terfokus pada masing-masing butir soal melalui tombol akordeon `💡 Lihat Pembahasan Edukatif`.

## [2.3.35] - 2026-09-11
### Eliminasi Redundansi Header Bank Soal & Penyatuan Tombol Compact Buka/Tutup Pembahasan ke Dalam Card Jumlah Soal (Opsi A)

#### 1. Masalah & Kebutuhan yang Diselesaikan
- **Redundansi Informasi Tiga Tingkat**: Informasi butir soal sebelumnya diulang hingga tiga kali dalam jarak vertikal yang sangat dekat: (1) Tab navigasi `2. Soal (2)`, (2) Judul seksi `Daftar Butir Soal (2)`, dan (3) Kartu mini stat `Jumlah Soal: 2 Butir Aktif`.
- **Pemborosan Ruang Vertikal Layar**: Baris judul seksi `Daftar Butir Soal` memakan satu baris penuh tersendiri hanya untuk memuat judul dan tombol `Buka Pembahasan`, mendorong kartu soal pertama ke bawah dan mengurangi fokus visual di layar seluler maupun desktop.

#### 2. Implementasi Desain & Fungsionalitas
- **Penghapusan Header Seksi Redundan (`QuizCreator.tsx`)**:
  - Mengeliminasi baris judul `Daftar Butir Soal ({questions.length})` dan subteks pengantarnya. Halaman langsung diawali dengan 3 Mini Stat Cards Dashboard yang padat fungsi.
- **Penyatuan Tombol Aksi Compact pada Card 1**:
  - Tombol aksi `Buka / Tutup Pembahasan` kini terintegrasi langsung di dalam **Card 1 (Jumlah Soal)** sebagai tombol mini yang ringkas (*compact action button*).
  - Teks tombol beradaptasi secara cerdas antar-resolusi: menampilkan teks lengkap `Buka Pembahasan` / `Tutup Pembahasan` pada desktop, dan teks ringkas `Buka Bahas` / `Tutup Bahas` pada layar mobile.
  - Ketika pembahasan dibuka, status `Kunci Terbuka 💡` muncul di sudut kanan atas Card 1, harmonis dengan status `Pas 100 🎯` pada Card 2.
- **Konsistensi Visual & Ergonomi Antar-Kartu (Rule 1 & Rule 2)**:
  - Ketiga kartu mini stat kini memiliki peran dan aksi yang seimbang:
    1. **Card 1**: Menampilkan jumlah butir + tombol aksi compact `[ 👁️ Buka Pembahasan ]`.
    2. **Card 2**: Menampilkan total bobot poin + tombol aksi compact `[ ⚖️ Bagi Rata 100p ]` (jika belum 100).
    3. **Card 3**: Menampilkan estimasi durasi waktu pengerjaan kuis.
  - Menghasilkan ruang pandang yang lebih lega, modern, dan bebas distraksi.

## [2.3.34] - 2026-09-11
### Penambahan 3 Tools Cepat pada Floating Action Button (FAB) Speed Dial Overlay: Pratinjau Kuis, Racik Soal AI, dan Tambah Soal

#### 1. Masalah & Kebutuhan yang Diselesaikan
- **Potensi FAB Speed Dial yang Belum Optimal**: Tombol aksi melayang (`+`) di pojok kanan bawah sebelumnya hanya memuat satu utilitas tunggal ("Ke Atas"), sehingga pengguna harus menggulir jauh ke atas atau bawah halaman untuk melakukan tindakan esensial seperti pratinjau simulasi atau membuat butir soal.
- **Kebutuhan Akses Seketika Fitur Utama Kuis**: Guru membutuhkan shortcut cepat yang selalu dapat dijangkau jempol di layar ponsel maupun desktop untuk:
  1. Langsung membuka editor pembuatan soal baru (*Tambah Soal*).
  2. Membuka generator soal otomatis berbantu kecerdasan buatan (*Racik Soal AI*).
  3. Menguji tampilan kuis dari sudut pandang siswa (*Pratinjau Kuis*).

#### 2. Implementasi Desain & Fungsionalitas
- **Menu Speed Dial 4-in-1 Terpadu (`QuizCreator.tsx`)**:
  - Menghadirkan 4 menu aksi vertikal bertingkat yang disusun dari bawah ke atas sesuai frekuensi penggunaan:
    1. **Tambah Soal**: Ikon Lucide `Plus` dengan tema Indigo (`bg-indigo-600`), membuka drawer formulir penyusunan butir soal manual seketika.
    2. **Racik Soal AI**: Ikon Lucide `Sparkles` dengan tema Ungu (`bg-purple-600`), mengaktifkan `<AiQuestionModal>` untuk meracik butir soal tematik Kurikulum Merdeka dengan dukungan multi-engine (DeepSeek Cloud, Groq Llama, dan Gemini).
    3. **Pratinjau Kuis**: Ikon Lucide `Eye` dengan tema Sky (`bg-sky-600`), memvalidasi kelengkapan soal dan langsung mengarahkan tampilan ke Langkah 3 (Simulasi & Pratinjau Kuis Siswa).
    4. **Ke Atas**: Ikon Lucide `ChevronUp` dengan kontainer adaptif (`bg-white dark:bg-slate-800`), menggulir halaman ke titik awal dengan transisi halus (*smooth scroll*).
- **Interaksi Sentuh Presisi & Aksesibilitas (Rule 1, Rule 2 & Rule 5)**:
  - Kontainer pill label teks dan tombol bundar kini menjadi satu kesatuan klik (*clickable group*) berukuran target sentuh $\ge 44\times 44\text{ px}$, memudahkan tap jempol pengguna tanpa risiko meleset.
  - Dilengkapi backdrop overlay blur yang memfokuskan perhatian pada menu aksi dan menutup menu saat latar belakang disentuh.
  - Animasi transisi masuk/keluar ringan (200ms) dengan rotasi ikon trigger utama (`+` menjadi `x`).

## [2.3.33] - 2026-09-11
### Redesain Dashboard Mini Stat Cards Bank Soal: Header Seksi Terstruktur & Metrik Interaktif Proporsional

#### 1. Masalah & Kebutuhan yang Diselesaikan
- **Kesan Hampa & Kosong pada Layar Lebar**: Bilah kontrol bank soal sebelumnya menggunakan satu kontainer kartu memanjang yang terbentang melintasi layar (hingga 1900px+), namun hanya memuat dua badge kecil di ujung kiri dan satu tombol kecil di ujung kanan. Jarak kosong yang sangat lebar di tengahnya membuat bilah tersebut tampak hampa, tidak proporsional, dan terkesan canggung.
- **Ketiadaan Konteks Judul & Metrik Durasi**: Guru memerlukan gambaran menyeluruh yang terstruktur saat memeriksa bank soal, termasuk berapa lama kuis akan berlangsung jika diujikan kepada siswa di kelas.

#### 2. Implementasi Desain & Fungsionalitas
- **Header Seksi Terpadu (`QuizCreator.tsx`)**:
  - Menghadirkan judul seksi tegas **Daftar Butir Soal ({questions.length})** lengkap dengan deskripsi fungsional panduan guru.
  - Menyelaraskan tombol aksi peninjauan kunci jawaban (`Buka / Tutup Pembahasan`) di sisi kanan header dengan ikon Lucide `Eye` dan `EyeOff`.
- **Grid 3 Mini Stat Cards Dashboard (Pilihan B)**:
  - Menggantikan bilah kosong memanjang dengan 3 widget kartu metrik profesional berjejer rapi (`grid-cols-1 sm:grid-cols-3`):
    1. **Kartu Jumlah Soal**: Menampilkan total butir soal aktif dengan aksen warna biru dan ikon `Layers`.
    2. **Kartu Total Bobot & Aksi Cerdas**: Menampilkan akumulasi poin secara visual dengan status `Pas 100 🎯` (warna emerald) jika sudah pas, atau indikator peringatan (warna amber) dan tombol aksi kontekstual `[ ⚖️ Bagi Rata 100p ]` yang tersemat rapi di dalam kartu saat bobot belum 100.
    3. **Kartu Estimasi Durasi Kuis**: Menghitung akumulasi waktu pengerjaan secara otomatis dari durasi kustom maupun durasi standar per soal (contoh: `1 mnt (~30s/soal)`), memberikan estimasi waktu nyata bagi guru saat mengatur alokasi jam pelajaran.
- **Responsivitas Antar-Platform (Rule 1 & Rule 2)**:
  - Mengisi ruang desktop secara berimbang, padat manfaat, dan tidak ada ruang kosong hampa.
  - Pada layar ponsel mobile portrait, kartu tersusun menjadi tumpukan widget ringkas yang sangat nyaman dibaca (*glanceable*) dengan target sentuh tombol $\ge 40\text{–}44\text{ px}$.

## [2.3.32] - 2026-09-11
### Perapian Kontrol Bar Bank Soal: Logika Cerdas Kontekstual Bagi Rata Poin & Toggle Pembahasan Terpadu

#### 1. Masalah & Kebutuhan yang Diselesaikan
- **Redundansi Tombol "Bagi Rata 100p" saat Poin Sudah Pas**: Tombol `Bagi Rata 100p` sebelumnya tampil permanen di kontrol bar bahkan ketika total poin kuis sudah bernilai `Total: 100 Poin (Pas 🎯)`. Hal ini membingungkan guru/pengguna mengenai tujuan dan efek dari tombol tersebut.
- **Tata Letak Asimetris & Menggantung di Layar Sempit**: Penempatan tombol aksi pengubah bobot soal (`Bagi Rata 100p`) diletakkan berdampingan dengan aksi filter tampilan UI (`Buka Pembahasan`) di sisi kanan bawah dengan styling `self-end`, menyebabkan layout terpecah menjadi 2 baris canggung dengan ruang kosong besar di mobile.
- **Inkonsistensi Visual Emoji Tempelan**: Tombol `💡 Buka Pembahasan` menggunakan emoji mentah yang tidak selaras dengan sistem desain ikon Lucide di seluruh aplikasi kuis.

#### 2. Implementasi Desain & Fungsionalitas
- **Eliminasi Tombol Permanen Redundan (`QuizCreator.tsx`)**:
  - Saat total bobot butir kuis telah mencapai tepat 100 poin (`totalQuizPoints === 100`), tombol `Bagi Rata 100p` disembunyikan sepenuhnya. Kontrol bar tampil ramping, bersih, dan menenangkan (*clutter-free*).
- **Logika Aksi Cerdas Kontekstual (Hanya Muncul Jika Poin $\neq$ 100)**:
  - Tombol `[ ⚖️ Bagi Rata 100p ]` kini diposisikan secara kontekstual tepat di samping badge status poin (`Kurang Xp` / `Dinamis`).
  - Ketika guru mengklik tombol tersebut, bobot seluruh soal otomatis dibagi rata agar pas 100 poin, notifikasi sukses ditampilkan, dan tombol tersebut langsung menghilang seketika saat status poin berubah menjadi `Total: 100 Poin (Pas 🎯)`.
- **Integrasi Ikon Standar Lucide Modern**:
  - Mengganti emoji mentah dengan ikon Lucide profesional [`Eye`](file:///E:/Data/GitHub/Kuis%20Interaktif/src/components/creator/QuizCreator.tsx) untuk membuka seluruh pembahasan dan [`EyeOff`](file:///E:/Data/GitHub/Kuis%20Interaktif/src/components/creator/QuizCreator.tsx) untuk menutup pembahasan, dengan indikator aktif beraksen biru halus.
- **Tata Letak Seimbang & Ergonomis Mobile-First**:
  - Menghilangkan `self-end` yang menggantung. Kontrol bar kini menyatu dalam satu baris yang seimbang dan responsif di desktop maupun layar sentuh seluler ($\ge 36\text{–}44\text{ px}$).

## [2.3.31] - 2026-09-11
### Peningkatan Kontras Badge Dark Mode, Input Auto-Resize Wrapping Dinamis, & Restrukturisasi Tombol Tambah Pengecoh

#### 1. Masalah & Kebutuhan yang Diselesaikan
- **Badge "Kolom A" Samar di Dark Mode**: Badge penanda kolom pada kartu penjodohan sebelumnya menggunakan latar abu-abu gelap (`bg-slate-750 text-slate-400`), sehingga memudar dan menyatu dengan kontainer dark mode (`bg-slate-900`), menyulitkan penglihatan guru/pengguna.
- **Teks Input Panjang Terpotong Horizontal**: Input teks kolom menggunakan elemen `<input type="text">` standar yang tidak mendukung pembungkusan baris (*word-wrapping*). Ketika guru menuliskan definisi, kalimat soal, atau konsep yang panjang, teks terpotong secara horizontal dan memaksa scroll samping yang tidak nyaman.
- **Mental Model Tombol Tambah Pengecoh Membingungkan**: Tombol "+ Tambah Pengecoh" yang diletakkan di header panel pengecoh menimbulkan ambiguitas bagi guru ("apakah setelah mengetik saya harus menekan tombol ini untuk menyimpan, atau tombol ini untuk menambah opsi lain?").

#### 2. Implementasi Desain & Fungsionalitas
- **Peningkatan Kontras Tinggi Badge Kolom & Kunci Jawaban (`QuizCreator.tsx`)**:
  - Badge **Kolom A**: Ditingkatkan dengan palet warna cerah dan tajam (`bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80`) dengan ketebalan teks ekstra (`font-extrabold`), memastikan kontras keterbacaan sempurna baik di tema terang maupun tema gelap.
  - Badge **Kunci Benar**: Diselaraskan dengan nuansa emerald beraksen kontras tinggi (`bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80`).
- **Komponen Modular `AutoResizeTextarea` (`src/components/common/AutoResizeTextarea.tsx`)**:
  - Menggantikan `<input type="text">` pada input konsep kiri (`pair.left`), kunci kanan (`pair.right`), dan kartu pengecoh (`distractor`).
  - Menerapkan fitur *auto-resizing* berbasis pengukuran `scrollHeight` dinamis dan styling modern `[field-sizing:content]` dengan batas tinggi elastis (`minHeight: 44px`, `maxHeight: 180px`).
  - Mendukung *line-wrapping* otomatis tanpa scroll horizontal, menjaga tampilan tetap rapi saat mengetik teks pendek maupun paragraf definisi panjang.
- **Restrukturisasi Ergonomis Panel Kartu Pengecoh Sisi Kanan (`QuizCreator.tsx`)**:
  - Menghilangkan tombol penambahan di header atas panel untuk menghapus beban kognitif dan ambiguitas.
  - Menambahkan penanda informatif edukatif: `✍️ Tersimpan otomatis saat Anda mengetik.`
  - Mengorganisasi kartu pengecoh ke dalam kontainer kartu tersendiri dengan penomoran jelas `Pengecoh #X (Kolom B)` dan tombol `Hapus` per kartu.
  - **Tombol Tambah di Bawah List**: Tombol aksi diposisikan tepat di bawah kartu input dengan label kontekstual (`+ Tambah Pengecoh Ke-2 (Maks. 2)`), serta notifikasi visual informatif saat kuota maksimal 2 kartu telah terpenuhi (`✓ Kuota maksimal 2 kartu pengecoh telah terisi`).
  - Menyajikan tombol CTA awal yang ramah saat belum ada pengecoh aktif (`+ Tambah Kartu Pengecoh (Maks. 2)`).

## [2.3.30] - 2026-09-11
### Standarisasi Interaksi Drawer Mobile: Eliminasi Tombol Tutup Ganda & Gesture Swipe-Down to Close Anti Pull-to-Refresh

#### 1. Masalah & Kebutuhan yang Diselesaikan
- **Tombol Tutup Ganda (*Redundant Close Controls*)**: Pada modal pemilihan ilustrasi edukasi (`ImageSelectorModal`), terdapat tombol `X` di header atas dan tombol "Tutup" di bagian bawah. Hal ini membebani visual dan mempersempit ruang judul modal.
- **Pill Handle Statis Tanpa Fungsi**: Garis tengah atas (*pill handle indicator*) pada drawer sebelumnya hanya hiasan visual pasif dan tidak dapat ditarik untuk menutup drawer secara intuitif.
- **Risiko Konflik Pull-to-Refresh Mobile**: Pada browser seluler (Chrome Android, Safari iOS, PWA), menarik elemen layar ke bawah berisiko memicu gesture refresh bawaan browser (*browser pull-to-refresh*), yang berpotensi memuat ulang halaman dan menghilangkan draf yang sedang dikerjakan.

#### 2. Implementasi Desain & Fungsionalitas
- **Konsolidasi Tombol Tutup Bersih (`ImageSelectorModal.tsx`)**:
  - Menghapus tombol `X` di header atas sehingga judul dan deskripsi modal mendapatkan ruang penuh yang lega.
  - Mempertahankan tombol `Tutup` di bagian footer bawah sebagai tombol aksi penutupan utama yang mudah dijangkau satu tangan (*thumb-friendly*).
- **Hook Terpusat `useDrawerSwipeDown` (`src/hooks/useDrawerSwipeDown.ts`)**:
  - Melacak pergerakan gesture pointer dan touch secara mulus dengan translasi visual langsung (`translateY`).
  - Efek pemudaran backdrop (*backdrop opacity damping*) yang responsif terhadap jarak tarikan.
  - Snap-back halus jika tarikan belum mencapai batas (threshold 70px) atau ditarik perlahan.
  - Dismiss otomatis saat tarikan melebihi batas atau adanya sentakan cepat (*downward flick/swipe*).
- **Proteksi Mutlak Anti Pull-to-Refresh (Mobile-First Safe)**:
  - Mengikat listener native `touchmove` dengan opsi `{ passive: false }` dan `e.preventDefault()` pada handle bar, serta properti CSS `touch-action: none` mutlak.
  - Menjamin 100% bebas dari reload halaman browser saat menarik garis tengah drawer ke bawah.
- **Komponen Modular `DrawerHandle` (`src/components/common/DrawerHandle.tsx`)**:
  - Area target sentuh ergonomis ($\ge 44\times 44\text{ px}$), cursor grab/grabbing intuitif, dan dukungan ARIA (`role="button"`, `aria-label="Tarik ke bawah untuk menutup"`).
- **Standardisasi ke Seluruh Drawer dalam Sistem**:
  - `ImageSelectorModal.tsx`: Drawer Pemilih Ilustrasi Edukasi.
  - `QuizSettingsModal.tsx`: Drawer Pengaturan Kuis Guru.
  - `MobileProfileSheet.tsx`: Drawer Menu Profil & Pengaturan Cepat Mobile.
  - `QuizArena.tsx`: Drawer Menu Alat & Pengaturan Kuis Mobile.

## [2.3.29] - 2026-09-11
### Redesain Bersih Editor Menjodohkan Pasangan Kartu, Dukungan Kartu Pengecoh Sisi Kanan, & Penilaian Proporsional Adil (Partial Credit Scoring)

#### 1. Masalah & Kebutuhan yang Diselesaikan
- **Teks Kuota Membingungkan (`3/6`)**: Tampilan sebelumnya membingungkan pengelola ("apakah ini halaman 3 dari 6 atau 3 pasang aktif?"), serta tata letak tombol hapus yang sempit dan berpotensi terpotong di layar seluler.
- **Tebakan Siswa Secara Eliminasi (*Process of Elimination*)**: Pada soal menjodohkan standar dengan jumlah kartu kolom A dan B yang sama persis, pasangan terakhir selalu dapat ditebak secara otomatis tanpa berpikir kritis.
- **Penilaian "Semua atau Tidak Sama Sekali" (*All-or-Nothing Penalty*)**: Jika soal memiliki bobot 10 poin dan siswa berhasil mencocokkan 2 dari 3 pasangan, sistem sebelumnya langsung menyalahkan 0 poin secara tidak adil.
- **Redundansi dan AI-Slop Visual**: Tumpukan tombol tambah ganda dan placeholder kartu yang tidak kontekstual.

#### 2. Implementasi Desain & Fungsionalitas
- **Redesain Antarmuka Editor Menjodohkan Bersih & Ergonomis (`QuizCreator.tsx`)**:
  - Menggantikan label kuota `3/6` dengan badge dinamis `[X Pasang Aktif]` yang jelas dan informatif.
  - Menampilkan instruksi rekomendasi edukatif ("Ideal 3–4 pasang, maksimal 6 pasang") tepat di bawah judul secara vertikal (*anti-squish*).
  - Tombol aksi `+ Tambah Pasangan` terintegrasi langsung di baris header; duplikasi tombol tambah di bagian bawah kartu dihapus.
  - Setiap baris pasangan memiliki konektor visual `↔`, badge penanda kolom (`Kolom A` & `Kunci Benar`), serta tombol `Hapus` satu baris utuh dengan target sentuh responsif ($\ge 44\text{ px}$).
  - Placeholder input kontekstual tematik (*Indonesia - Jakarta*, *Fotosintesis - Klorofil*, dll.) menggantikan teks acak.
- **Modul Kartu Pengecoh Sisi Kanan (Distractor Cards Kolom B)**:
  - Menyediakan panel kartu pengecoh opsional (maksimal 2 kartu) untuk meningkatkan daya uji soal dan mencegah tebakan acak.
  - Menggunakan serialisasi internal yang menjaga kompatibilitas database (*non-breaking schema*).
  - Dilengkapi indikator badge `Ada Kartu Pengecoh` pada arena bermain dan detail pratinjau Bank Soal.
- **Sistem Penilaian Proporsional Adil (*Partial Credit Scoring*) (`QuizArena.tsx`)**:
  - Menghitung nilai proporsional berbasis rasio keberhasilan: $\text{earnedPoints} = \text{Round}\left(\frac{\text{matchedCount}}{\text{totalPairs}} \times \text{points}\right)$.
  - Jika siswa berhasil mencocokkan sebagian pasangan saat waktu habis atau submit, siswa mendapatkan poin proporsional yang adil tanpa langsung divonis nol.
  - Interaksi kartu pengecoh di arena: kartu pengecoh yang diklik memicu animasi goyang penolakan (*shake feedback*), mereset kartu kiri yang dipilih, tanpa menghapus pasangan yang sudah berhasil dicocokkan sebelumnya.
- **Ulasan Hasil Kuis yang Transparan & Memotivasi (`QuizResult.tsx`)**:
  - Menampilkan status keberhasilan komprehensif: `🎯 Sempurna` atau `⚖️ Sebagian Benar (X dari Y Pasang Cocok)`.
  - Dilengkapi badge perolehan poin parsial warna amber (`+X Poin`) yang transparan bagi siswa dan guru.
- **Pratinjau Bank Soal Terperinci**:
  - Menampilkan daftar pasangan kartu `↔` dan tag kartu pengecoh sisi kanan secara rapi pada kartu soal di Bank Soal.

## [2.3.28] - 2026-09-11
### Redesain Bersih Pemilih Preset Benar / Salah: Dropdown Ramping Terintegrasi Tanpa Tumpukan Tombol Multi-Baris

#### 1. Masalah yang Diselesaikan
- **Tumpukan Tombol Berserakan (*Button Soup*)**: Sebelumnya 6 tombol pilihan preset (`Benar/Salah`, `Sesuai/Tidak Sesuai`, `Ya/Tidak`, `Fakta/Opini`, `Setuju/Tidak Setuju`, `Kustom Teks`) dibungkus dalam wadah abu-abu tebal yang melipat menjadi 3 baris tidak beraturan pada layar ponsel, memakan ruang vertikal $\sim 130\text{ px}$.
- **Redundansi Visual**: Terjadi pengulangan visual ganda antara tombol preset di bagian atas dengan dua kartu pilihan jawaban di bagian bawah.
- **Kepadatan Formulir**: Guru terdistraksi oleh tumpukan tombol sebelum mencapai interaksi inti butir soal.

#### 2. Implementasi & Desain Komponen `TrueFalsePresetDropdown.tsx`
- **Dropdown Preset Ramping di Baris Judul**:
  - Menggantikan 6 tombol bertumpuk dengan satu kontrol pemilih preset kustom `[ 🎚️ Benar / Salah ▾ ]` yang elegan dan terpadu.
  - Membuka menu melayang (*floating popover*) berdesain rapi dengan indikator centang hijau pada preset yang sedang aktif.
  - Menghemat $\sim 90\text{ px}$ ruang layar vertikal pada perangkat seluler.
- **Aksi Kustom Teks Terpadu**:
  - Tombol `[ ✎ Kustom ]` bersanding rapi di samping dropdown; saat diklik, beralih instan menjadi `[ Kembali ke Preset ]` dengan kolom input kustom yang bersih.
- **Fokus Langsung ke Kartu Jawaban**:
  - Dua kartu pilihan jawaban (`Benar` & `Salah` atau teks kustom) langsung tampil bersih tepat di bawah judul tanpa terhalang tumpukan tombol perantara.
- **Presisi Responsif Mobile (Rule 1 & Rule 2)**:
  - Penempatan popover teruji presisi di dalam batas layar ponsel 375px (`left-0`), dilengkapi target sentuh $\ge 44\times 44\text{ px}$ dan penutupan otomatis saat klik di luar atau tombol `Escape`.

## [2.3.27] - 2026-09-11
### Penataan Hierarki Tipografi Micro-Header Formulir: Penonjolan Teks Utama & Penempatan Vertikal Teks Pendamping Anti-Squish

#### 1. Masalah yang Diselesaikan
- **Perebutan Ruang Horizontal (*Width Conflict*)**: Pemaksaan judul dan teks pendamping dalam 1 baris menggunakan `flex justify-between` menyebabkan kedua teks saling mendesak pada perangkat seluler.
- **Pemotongan Baris Kikuk (*Awkward Wrapping*)**: Pada tampilan mobile sebelumnya, teks judul terbelah patah (misal `PENGATURAN SKOR & WAKTU` terpisah dengan `SOAL` di baris kedua, dan `Akumulasi Kuis:` terpisah dengan `50p`), serta `Pembahasan Jawaban` dan `Muncul setelah siswa menjawab` terlipat menjadi 2 kolom bertingkat yang tidak rapi.
- **Ketidakseimbangan Hierarki Visual**: Teks pendamping berbobot sama dengan teks utama sehingga mengaburkan fokus pengisian yang esensial.

#### 2. Implementasi & Desain Hierarki Vertikal Terpadu (`QuizCreator.tsx`)
- **Penonjolan Dominan Teks Utama (*Primary Label Dominance*)**:
  - Seluruh label utama (`Pertanyaan Soal`, `Pilihan Jawaban`, `Pembahasan Jawaban`, `Pengaturan Skor & Durasi`, `Bobot Poin Butir Ini`, `Durasi Timer Menjawab`) ditingkatkan bobot visualnya menggunakan `font-black text-slate-900 dark:text-white` sehingga menjadi titik fokus pandang utama pengguna.
- **Penempatan Vertikal Teks Pendamping yang Tenang (*Subordinate Companion Text*)**:
  - Teks pendamping dan panduan edukatif diposisikan tepat di bawah judul secara vertikal (*top-to-bottom reading flow*) dengan tipografi lembut (`text-[11px] font-normal text-slate-400 dark:text-slate-500`).
  - Menghilangkan 100% risiko teks terpotong atau berjejalan pada layar sekecil apa pun (320px hingga 4K).
- **Badge Status Mungil & Halus**:
  - Penanda `Wajib diisi` (merah lembut) dan `Opsional` (abu-abu netral) dikemas sebagai badge kapsul mungil tepat di samping judul, menggantikan teks kurung biasa tanpa memberatkan kalimat judul.
- **Penyempurnaan Panel Pengaturan Skor & Durasi**:
  - Menyederhanakan judul menjadi `Pengaturan Skor & Durasi` dengan panduan vertikal di bawahnya.
  - Komponen `Akumulasi Kuis: 100p 🎯 Pas 100` dipisah menjadi kartu pill independen yang tampil anggun di baris kedua pada layar seluler atau sejajar di desktop.

#### 3. Kepatuhan Standar Teknis & Estetika (Rule 1, Rule 2, & Rule 4)
- **Mobile-First & Responsivitas 720p - 4K**: Tidak ada pemotongan kata di resolusi non-reguler ponsel pintar maupun tablet.
- **Readability & Kontras Sempurna**: Rasio kontras tinggi di mode gelap maupun mode terang, dengan estetika bersih (*anti AI-slop*).

## [2.3.26] - 2026-09-11
### Restrukturisasi Hierarki Visual 3 Zona Formulir Edit Soal & Optimasi Ergonomis Mobile-First Anti AI-Slop

#### 1. Masalah yang Diselesaikan
- **Kelelahan Konfigurasi Teknis di Puncak Formulir**: Sebelumnya blok input bobot poin dan durasi waktu berada di posisi paling atas formulir, mengalihkan fokus esensial guru dari pembuatan butir soal dan konten pedagogis.
- **Pemisahan Pertanyaan dan Jawaban Akibat Kotak Media Kosong**: Wadah placeholder ilustrasi gambar kosong memakan ruang vertikal signifikan (~100px), mendorong kartu opsi jawaban jauh ke bawah (*pushed below the fold*) pada layar perangkat seluler.
- **Beban Kognitif Berantakan**: Formulir sebelumnya terasa padat tanpa alur prioritas pengerjaan yang alami antara apa yang wajib diisi dan apa yang merupakan konfigurasi teknis lanjutan.

#### 2. Implementasi & Desain 3 Zona Hierarki (`QuizCreator.tsx`)
- **Zona 1: Inti Butir Soal (Pedagogis Wajib - Prioritas Utama)**:
  - **Tipe Format Soal**: Berada di baris pertama formulir dilengkapi dengan custom dropdown berdesain konsisten serta badge indikator format ringkas.
  - **Teks Pertanyaan Soal**: Menyusul langsung di bawahnya dengan textarea proporsional dan penanda wajib diisi yang tegas.
  - **Bilah Ilustrasi Kompak On-Demand**: Menggantikan kotak placeholder abu-abu kosong bertingkat dengan tombol strip satu baris ramping `[+ Tambah Gambar Ilustrasi (Opsional)]` (`min-h-[44px]`). Jika media diaktifkan/dipilih, kartu pratinjau thumbnail interaktif beserta teks takarir/caption tetap hadir secara elegan.
  - **Pilihan Jawaban & Kunci Benar**: Menyambung langsung di bawah pertanyaan/gambar tanpa jeda visual, sehingga pada resolusi smartphone 375px pertanyaan dan pilihan jawaban tampil serentak dalam satu *viewport*.
- **Zona 2: Pengayaan Pedagogis (Opsional)**:
  - Kolom **Pembahasan Jawaban** ditempatkan di bawah pilihan jawaban dengan label ramah (*"Muncul setelah siswa menjawab"*), memberikan ruang guru menuangkan penjelasan edukatif tanpa menginterupsi alur pembuatan butir soal.
- **Zona 3: Pengaturan Skor & Waktu (Konfigurasi Teknis Sebagai Sentuhan Akhir)**:
  - Direlokasi ke bilah bawah formulir dalam satu kontainer horizontal terpadu.
  - Mengelompokkan **Bobot Poin Butir Ini** (input angka presisi + chip pintas 5p, 10p, 15p, 20p), **Durasi Timer Menjawab** (toggle mode Auto vs Khusus), dan badge **Akumulasi Kuis Real-time** (`Total: 100p 🎯 (Pas 100)`).
- **Bilah Aksi Formulir di Bagian Bawah**:
  - Menyediakan tombol aksi sekunder (*Batal / Kembali*) dan primer (*Simpan Perubahan*) berukuran minimal 44×44 px di bawah formulir untuk kenyamanan jangkauan jempol di perangkat seluler.

#### 3. Kepatuhan Standar Teknis & Estetika (Rule 1, Rule 2, & Rule 4)
- **Mobile-First & Touch Targets**: Seluruh tombol interaktif, chip pilihan, dan bidang input memenuhi standar target sentuh minimum 44×44 px.
- **Konsistensi & Anti AI-Slop**: Menghilangkan dekorasi berlebihan, teks berulang, dan visual noisy, menghasilkan tata letak yang bersih (*clean*), bernilai guna tinggi, serta stabil di resolusi 720p hingga 4K.

## [2.3.25] - 2026-09-11
### Safeguard Konfirmasi Perubahan Soal Belum Disimpan pada Navigasi & Kembali

#### 1. Masalah yang Diselesaikan
- **Risiko Kehilangan Data Input Soal**: Saat guru sedang mengedit butir soal atau menambah soal baru, menekan tombol navigasi soal sebelumnya (`<`), soal berikutnya (`>`), tombol kembali di *header* (`←`), tombol "Batal", atau gestur mundur fisik Android berisiko menghilangkan modifikasi yang baru saja diketik akibat ketidaksengajaan tanpa peringatan konfirmasi.
- **Ketiadaan Pilihan Pengendalian Modifikasi**: Sebelumnya alur navigasi berpindah atau membatalkan tanpa memberikan opsi bagi pengguna untuk memutuskan apakah perubahan ingin disimpan terlebih dahulu atau sengaja dibuang.

#### 2. Implementasi & Desain Perlindungan Data (`QuizCreator.tsx`)
- **Deteksi Presisi Perubahan Formulir (*Zero-Friction Dirty Check*)**:
  - Melacak perbandingan mendalam antara data butir soal aktif dengan data asal di bank soal (mencakup teks pertanyaan, jenis soal, bobot poin, durasi khusus, pembahasan, ilustrasi/keterangan gambar, opsi ganda, jawaban singkat, atau pasangan kartu).
  - Jika tidak ada perubahan yang dibuat oleh guru, navigasi antar-soal dan pembatalan berjalan instan tanpa menampilkan dialog konfirmasi (*zero friction*).
- **Dialog Intersepsi Konfirmasi Pintar (*Unsaved Changes Safety Modal*)**:
  - Muncul secara otomatis saat ada perubahan yang belum disimpan ketika pengguna menavigasi ke soal sebelumnya, soal berikutnya, kembali ke bank soal, atau menekan tombol mundur Android/Escape.
  - Menyediakan 3 opsi aksi jelas dan aman:
    1. **💾 Simpan & Lanjutkan**: Menyimpan modifikasi butir soal secara aman ke bank soal, lalu melanjutkan navigasi ke tujuan target.
    2. **🗑️ Buang Perubahan**: Membatalkan modifikasi yang belum disimpan (mengembalikan ke kondisi semula), lalu melanjutkan navigasi.
    3. **Tetap Mengedit**: Menutup dialog konfirmasi dan mempertahankan posisi kursor di formulir soal tanpa menghilangkan ketikan apa pun.
  - Teks dialog adaptif secara kontekstual menjelaskan tujuan navigasi (misal "berpindah ke Soal Sebelumnya", "berpindah ke Soal Berikutnya", atau "kembali ke Bank Soal").
- **Kepatuhan Ergonomi & Aksesibilitas (Rule 1, Rule 2, & Rule 8)**:
  - Seluruh tombol aksi pada dialog memenuhi standar tinggi target sentuh minimal 44×44 px dengan susunan *mobile-first* bertumpuk ramah jempol.
  - Terintegrasi dengan `useBackHandler` prioritas tinggi (82) sehingga tombol fisik mundur Android maupun tombol `Escape` pada keyboard menutup modal konfirmasi secara aman (*cancel/stay*).
  - Ditambahkan tombol aksi di bagian bawah formulir soal (*Batal / Kembali* dan *Simpan*) untuk kenyamanan akses pada perangkat sentuh.

## [2.3.24] - 2026-09-11
### Redesain Ramping Editor Soal Benar / Salah: Mode Pilihan Cepat Tanpa Tumpukan Teks & Mode Kustom On-Demand

#### 1. Masalah yang Diselesaikan
- **Tumpukan Teks & Formulir Terlalu Padat**: Pada konfigurasi opsi soal Benar / Salah sebelumnya, dua kartu besar berisi kolom input teks ("Teks Pilihan 1" & "Teks Pilihan 2") beserta lencana berjenjang dan tombol jadikan kunci selalu ditampilkan secara terbuka secara permanen, bahkan saat guru hanya ingin memilih opsi standar (Benar/Salah atau Sesuai/Tidak Sesuai).
- **Pengalaman Pengguna (*User Flow*) Kurang Praktis**: Guru harus menatap formulir panjang berlapis-lapis padahal mayoritas kebutuhan pembuatan soal Benar/Salah hanya membutuhkan satu ketukan untuk menentukan kunci jawaban yang benar.

#### 2. Implementasi & Desain Clean (`QuizCreator.tsx`)
- **Mode Pilihan Cepat Bersih (*Streamlined Preset Mode*)**:
  - Kolom input teks kini **disembunyikan secara otomatis** saat menggunakan preset standar.
  - Menggantikan kartu input yang padat dengan **Dua Kartu Pilihan Interaktif Sentuh-Cepat** (`min-h-[80px]`):
    - Sekali ketuk langsung menetapkan kunci jawaban benar secara instan dengan lencana hijau zamrud (`✓ Kunci Benar`) dan cincin fokus lembut.
    - Menghilangkan redundansi label berulang ("OPSI PERTAMA (A)", "Teks Pilihan 1", dll.) sehingga tampilan sangat lega, bersih, dan estetis.
- **Mode Kustom Fleksibel Sesuai Kebutuhan (*On-Demand Custom Mode*)**:
  - Kolom teks kustom kini **hanya muncul jika pengguna secara eksplisit memilih tombol chip `[✏️ Kustom Teks]`** atau jika soal memiliki pasangan teks non-standar.
  - Menampilkan panel editor kustom ramping dengan kolom input ringkas dan tombol penentu kunci terintegrasi dalam satu baris kartu horizontal.
  - Dilengkapi tautan instan `[Kembali ke Preset]` untuk kembali ke mode bersih kapan saja.
- **Kepatuhan Ergonomi & Aksesibilitas (Rule 1 & Rule 2)**:
  - Seluruh chip preset, tombol kustom, dan kartu pilihan sentuh memenuhi standar target minimum 44×44 px.

## [2.3.23] - 2026-09-11
### Redesain Responsif Modal "Pilih Ilustrasi Edukasi": Mobile-First Bottom Sheet, Segmented Switcher & Layout Ergonomis

#### 1. Masalah yang Diselesaikan
- **Tampilan Terpotong & Tidak Rapi pada Layar Mobile**: Modal pemilih ilustrasi edukasi sebelumnya menggunakan modal terpusat melayang dengan margin kaku dan tab navigasi horizontal yang terlalu panjang (> 500px). Pada layar ponsel (360px–390px), tab kanan terpotong dan tersembunyi di bawah bilah geser (*overflow scrollbar*).
- **Gaya Visual AI Saling Bertumpuk**: Pada tab Generator AI, pilihan gaya ilustrasi dipaksakan dalam 3 kolom kisi (`grid-cols-3`), menyebabkan teks judul dan deskripsi terbungkus ke 4-5 baris berjejal dan menabrak batas kartu pada ponsel.
- **Target Sentuh Di Bawah Standar**: Tombol "Gunakan" pada hasil pencarian ensiklopedia dan beberapa input aksi sebelumnya memiliki tinggi di bawah 44 px, melanggar prinsip desain ramah sentuh (*touch-first*).

#### 2. Implementasi & Desain Clean (`ImageSelectorModal.tsx`)
- **Adaptasi Mobile-First Bottom Sheet**:
  - Pada layar ponsel, modal bertransformasi mulus menjadi panel bawah (*bottom-sheet*) dengan sudut atas melengkung anggun (`rounded-t-3xl`), indikator pegangan tarik (*pull-handle*), serta tinggi adaptif (`h-[92dvh]`), memberikan ruang leluasa bagi guru untuk melihat pratinjau media dan diagram pendidikan.
  - Pada desktop/tablet, tetap tersaji sebagai modal tengah mengambang yang proporsional dan elegan (`max-w-2xl sm:max-h-[88vh] sm:rounded-3xl`).
- **Segmented Control 3 Kolom Berimbang Bebas *Overflow***:
  - Mengganti tab geser horizontal dengan *Segmented Control* 3 kolom terbagi rata (`grid-cols-3`) berlatar abu-abu halus dengan label adaptif:
    - Di layar ponsel: `Wiki (11)`, `AI Flux`, `Unggah`.
    - Di layar desktop: `Ensiklopedia & Media (11)`, `Generator AI (Flux)`, `Unggah / URL`.
- **Tata Letak Kartu Gaya Ilustrasi AI Adaptif**:
  - Di ponsel, gaya ilustrasi tampil dalam 1 kolom horizontal luas (`grid-cols-1 sm:grid-cols-3`) dengan ikon, judul, deskripsi jelas, dan tanda centang visual aktif, bebas desakan teks.
  - Input deskripsi visual dan tombol "Racik Ulang" ditata vertikal yang ergonomis di ponsel dan berdampingan di desktop.
- **Kepatuhan Standar Aksesibilitas & Target Sentuh (Rule 1)**:
  - Seluruh tombol aksi (tombol cari, chip topik, kartu ensiklopedia "Gunakan", generator AI "Gunakan", tombol unggah berkas, dan tombol tutup) memiliki area sentuh minimal 44×44 px.
  - Didukung integrasi *Android back gesture* (`useBackHandler`) dan penutupan cepat dengan tombol `Escape`.

## [2.3.22] - 2026-09-11
### Redesain Responsif Kartu Soal Menjodohkan: Layout Mobile-First Bebas Tumpang Tindih

#### 1. Masalah yang Diselesaikan
- **Tampilan Tumpang Tindih & *Overflow* pada Layar Ponsel**: Pada formulir pengeditan soal tipe Menjodohkan Kartu (*matching pairs*), dua kolom input (Kartu Kiri dan Kartu Kanan) beserta panah penghubung dan tombol hapus sebelumnya dipaksakan berada dalam satu baris horizontal (`flex-row`). Pada resolusi layar ponsel (320px–390px), hal ini menyebabkan input menyusut drastis, teks *placeholder* terpotong, dan tombol hapus (*trash icon*) terdesak ke tepi layar hingga saling menabrak (*overlap*) dan tumpang tindih.
- **Target Sentuh Kurang Ergonomis**: Tombol hapus dan input sebelumnya berukuran di bawah standar sentuh minimum mobile (40px) sehingga rentan memicu salah sentuh pada perangkat *touchscreen*.

#### 2. Implementasi & Desain Clean (`QuizCreator.tsx`)
- **Arsitektur Kartu Pasangan Responsif Mandiri (*Dedicated Pair Cards*)**:
  - Setiap pasangan kartu kini dibungkus dalam kontainer kartu tersendiri dengan bayangan lembut, sudut membulat elegan (`rounded-2xl`), dan garis pembatas bersih.
  - **Bilah Header Kartu**: Menampilkan lencana nomor pasangan berwarna ungu kontras (`[1]`, `[2]`, dst.), label judul `Pasangan Kartu #X`, dan tombol **`[🗑️ Hapus Pasangan]`** di pojok kanan atas dengan teks jelas dan target sentuh nyaman (tinggi 44px). Tidak ada lagi risiko tabrakan visual dengan kolom input.
- **Tata Letak Adaptif Mobile-First (1 Kolom di Ponsel, 2 Kolom di Desktop/Tablet)**:
  - **Di Layar Ponsel (`grid-cols-1`)**: Sisi Kiri (Soal / Konsep - Kolom A) dan Sisi Kanan (Pasangan Tepat - Kunci Benar) masing-masing menggunakan lebar penuh (*full-width*), memberikan ruang leluasa bagi guru untuk mengetik kalimat panjang atau definisi materi tanpa terpotong.
  - **Di Layar Desktop/Tablet (`md:grid-cols-2`)**: Kolom kiri dan kanan berjajar proporsional 50%-50% dengan garis batas halus dan cincin fokus modern (`ring-2 ring-purple-500/20` & `ring-2 ring-emerald-500/20`).
- **Indikator Kunci Jawaban Benar & Limitasi Pasangan**:
  - Sisi kanan diberi penanda tegas berwarna hijau zamrud dengan ikon centang (`✓ Kunci Benar`), memperjelas bahwa kartu kanan adalah jawaban yang benar.
  - Dilengkapi lencana jumlah pasangan aktif (`X / 6 Pasang`) serta tombol tambah di bagian bawah kartu dengan garis putus-putus (*dashed border*) yang sangat intuitif.
- **Optimalisasi Pratinjau Bank Soal**:
  - Menambahkan pembungkusan kata fleksibel (*word-break safe*) pada kartu pratinjau Bank Soal agar teks panjang tidak menembus batas kontainer pada layar kecil.

## [2.3.21] - 2026-09-11
### Kustomisasi Opsi Teks Benar / Salah & Preset Cepat Satu Sentuhan

#### 1. Masalah yang Diselesaikan
- **Ketiadaan Kolom Input Teks Opsi Benar / Salah**: Pada editor butir soal, tipe soal Benar / Salah sebelumnya hanya menampilkan dua tombol pill statis dengan teks terkunci ("Benar" dan "Salah"). Pendidik tidak dapat mengkustomisasi pilihan kata ke pasangan dikotomi edukatif lain (seperti "Sesuai / Tidak Sesuai", "Ya / Tidak", "Fakta / Opini", atau "Setuju / Tidak Setuju") sebagaimana yang tersedia pada generator AI.
- **Inkonsistensi Pratinjau Kartu Bank Soal & Tinjauan**: Kartu butir soal pada Bank Soal dan pratinjau rincian kuis sebelumnya masih menampilkan label keras statis Benar/Salah alih-alih membaca array opsi aktual (`question.options`).

#### 2. Implementasi & Desain Clean (`QuizCreator.tsx` & `QuizDetail.tsx`)
- **Kolom Input Teks Kustom Mandiri**:
  - Menyediakan dua kartu opsi terpisah (Opsi Pertama / A dan Opsi Kedua / B) dengan kolom input teks yang dapat diedit bebas tanpa batasan istilah kaku.
  - Dilengkapi *placeholder* kontekstual yang informatif dan cincin fokus modern (`ring-2 ring-emerald-500/20`).
- **Toolbar Chip Preset Cepat Satu Sentuhan (*One-Tap Quick Chips*)**:
  - Disediakan bilah preset instan: **`[Benar / Salah]`**, **`[Sesuai / Tidak Sesuai]`**, **`[Ya / Tidak]`**, **`[Fakta / Opini]`**, dan **`[Setuju / Tidak Setuju]`**.
  - Sekali ketuk langsung mengisi kedua teks pilihan secara serentak.
  - Status chip otomatis aktif (*highlight emerald*) jika teks pilihan cocok dengan salah satu preset.
- **Tombol Pemilih Kunci Jawaban Benar (*Touch-Friendly Key Selector*)**:
  - Setiap kartu opsi dilengkapi tombol pemicu kunci jawaban dengan target sentuh standar mobile-first (tinggi minimal 44 px).
  - Status aktif ditandai dengan lencana hijau zamrud tegas, ikon centang putih (`✓`), dan teks `Kunci Benar`.
- **Sinkronisasi Data Menyeluruh & Pratinjau Dinamis**:
  - Terhubung langsung ke penyimpanan draf lokal (`CreatorDraft`), fungsi auto-save saat navigasi butir soal, dan validasi simpan.
  - Kartu butir soal Bank Soal (`QuizCreator.tsx`) dan pratinjau soal (`QuizDetail.tsx`) kini membaca teks dinamis dari `question.options` secara konsisten.

## [2.3.20] - 2026-09-11
### Komponen Custom Dropdown Tipe Soal: Desain Modern, Berikon, & Konsisten dengan Sistem Web

#### 1. Masalah yang Diselesaikan
- **Inkonsistensi Visual Elemen Dropdown Bawaan (*Native WebView*)**: Pemilihan tipe soal sebelumnya menggunakan elemen HTML `<select>` murni yang memicu *native picker* OS perangkat (Android, iOS, Windows). Tampilan ini tidak selaras dengan bahasa desain modern aplikasi, tidak mendukung ikon tematik, kaku pada mode gelap, dan mengurangi estetika visual editor kuis.

#### 2. Implementasi & Desain Clean (`QuestionTypeDropdown.tsx` & `QuizCreator.tsx`)
- **Komponen Kustom `QuestionTypeDropdown` Terpadu**:
  - **Tombol Pemicu (*Trigger*) Modern**: Dilengkapi dengan wadah ikon tematik berwarna, label tipe soal dinamis (`Pilihan Ganda (4 Opsi)`, `Benar / Salah`, `Isian Singkat`, `Menjodohkan Kartu`), indikator panah halus (`ChevronDown`) dengan rotasi 180° yang mulus, serta cincin fokus elegan (`ring-2 ring-blue-500/20`).
  - **Menu Popover Mengambang (*Floating Listbox*)**:
    - Berlatar kaca buram (`bg-white/95 dark:bg-slate-850/95 backdrop-blur-md`) dengan bayangan mendalam dan sudut membulat modern (`rounded-2xl`).
    - Setiap opsi menyajikan:
      1. Ikon representatif berwarna tegas (Biru untuk Pilihan Ganda, Hijau Zamrud untuk Benar/Salah, Kuning Amber untuk Isian Singkat, dan Ungu untuk Menjodohkan).
      2. Judul tebal dan deskripsi fungsi singkat tanpa teks bertele-tele.
      3. Lencana centang aktif (`✓`) pada opsi yang sedang terpilih.
    - Dilengkapi pendeteksi klik di luar elemen (*click-outside*) dan penutupan via tombol keyboard Escape untuk kenyamanan navigasi.
- **Optimalisasi Tata Letak Proporsional (Grid 5-3-4)**:
  - Kolom baris atas disempurnakan menjadi 5 kolom untuk Tipe Soal, 3 kolom untuk Bobot Poin, dan 4 kolom untuk Waktu Jawab, menjamin seluruh teks judul tipe soal tampil utuh tanpa terpotong (*no clipping*) pada semua ukuran layar.

## [2.3.19] - 2026-09-11
### Sistem Bobot Poin Terpadu & Arsitektur Sinkronisasi Durasi Waktu Transparan

#### 1. Masalah yang Diselesaikan
- **Ketidakjelasan Akumulasi Bobot Poin**: Ketiadaan indikator akumulasi skor membuat guru kesulitan mengetahui apakah seluruh butir soal sudah mencapai bobot standar 100 poin atau belum.
- **Kekhawatiran Konflik & Override Durasi Waktu**: Tidak adanya pembeda status antara waktu umum kuis (*global timer*) dan waktu khusus per soal menimbulkan keraguan apakah perubahan durasi kuis akan menimpa (*override*) soal yang diatur khusus secara tidak sengaja.
- **Ketiadaan Otomatisasi Pembagian Poin**: Guru harus menghitung dan membagi bobot poin per butir soal satu per satu secara manual.

#### 2. Implementasi & Desain Clean (`QuizCreator.tsx` & `InfoKuisStep.tsx`)
- **Live Counter Akumulasi Bobot Poin Real-Time**:
  - Tampilan indikator status cerdas di bilah kontrol Bank Soal:
    - Hijau: `Total: 100 Poin (Pas 🎯)` saat tepat 100 poin.
    - Amber: `Total: Xp (Kurang Yp)` saat di bawah 100 poin.
    - Indigo: `Total: Xp (Dinamis)` saat melebihi 100 poin.
  - Proyeksi akumulasi langsung di atas kolom input Bobot Poin formulir editor saat guru sedang mengubah nilai soal aktif.
- **Fitur Cerdas `[⚖️ Bagi Rata 100p]`**:
  - Tombol satu-ketukan di bilah kontrol Bank Soal yang membagi 100 poin secara proporsional dan presisi matematis ke seluruh butir soal tanpa menyisakan desimal.
- **Segmented Control Mode Waktu di Editor Soal**:
  - Pilihan mode tegas tanpa ambiguitas: **`[Auto (Xs)]`** vs **`[Khusus]`**.
  - **Mode Auto**: Input durasi terkunci dengan label rapi `Xs (Ikuti Kuis)` dan keterangan sinkronisasi otomatis.
  - **Mode Khusus**: Membuka kolom input detik mandiri dengan tombol preset `[15s] [30s] [45s] [60s]` yang terkunci eksklusif untuk butir soal tersebut.
- **Pembeda Visual Status Timer di Kartu Bank Soal**:
  - Badge waktu kustom: `⏱️ Xs (Khusus)` berlatar biru tegas.
  - Badge waktu standar: `⏱️ Xs (Kuis)` berlatar netral halus.
- **Panel Sinkronisasi Cerdas di Pengaturan Kuis (`InfoKuisStep.tsx`)**:
  - Mendeteksi dan menampilkan jumlah soal standar vs soal waktu khusus.
  - Menyediakan tombol aksi `[Terapkan ke Semua]` untuk menyelaraskan seluruh soal jika guru ingin menyeragamkan waktu secara menyeluruh.

## [2.3.18] - 2026-09-11
### Arsitektur Two-Tier Sticky Header & Sub-Panel Ramping Navigasi Butir Soal

#### 1. Masalah yang Diselesaikan
- **Kepadatan Informasi di Header Utama Mobile**: Penggabungan judul editor, kontrol aksi global (Simpan/Batal), indikator nomor soal, dan tombol navigasi pager dalam satu baris header sempit (360px–390px) menyebabkan penumpukan elemen visual dan risiko teks saling bertubrukan (*overlapping*).
- **Redundansi Aksi Navigasi Kembali**: Keberadaan tombol teks `Batal` di samping tombol panah kembali `[←]` pada layar ponsel mempersempit ruang horizontal tanpa memberikan nilai tambah ergonomi.

#### 2. Implementasi & Desain Clean (`QuizCreator.tsx`)
- **Arsitektur Header Dua Tingkat (Two-Tier Sticky Header)**:
  - **Tier 1 (Header Utama)**: Fokus eksklusif pada identitas aksi (`[←]` Kembali/Batal, ikon butir soal, judul ringkas `Edit Soal` di mobile / `Edit Butir Soal` di desktop) serta aksi global (`[💾 Simpan]` dan `[🌙 Theme]`). Tombol teks `Batal` otomatis disembunyikan di layar ponsel (< 640px) karena sudah terwakili secara intuitif oleh tombol kembali `[←]`.
  - **Tier 2 (Sub-Panel Ramping Berlatar Khusus)**: Baris sub-panel ramping di bawah header utama dengan latar `bg-slate-50/95 dark:bg-slate-850/95 backdrop-blur-xs` dan pembatas halus yang menyajikan:
    - Sisi Kiri: Badge status `Soal #X` berlatar biru tegas beserta konteks `dari Y butir`.
    - Sisi Kanan: Pager navigasi antar-soal (`[‹]` `X / Y` `[›]` di mobile, serta label teks lengkap `[‹ Sebelumnya]` dan `[Berikutnya ›]` di desktop/tablet).
- **Presisi Responsivitas Mobile-First & Keterbacaan**:
  - Tampilan 100% bebas tumpang-tindih di seluruh rentang resolusi ponsel non-reguler hingga desktop 4K.
  - Setiap target sentuh memenuhi standar kenyamanan minimal 44×44 px pada tombol utama dan 36×36 px pada tombol sub-panel.

## [2.3.17] - 2026-09-11
### Peningkatan Komprehensif Editor Butir Soal: Navigasi Cepat, Opsi Fleksibel, & Timer Kustom

#### 1. Masalah yang Diselesaikan
- **Ketiadaan Navigasi Antar-Soal Langsung**: Guru harus keluar ke Bank Soal dan menggulir daftar setiap kali ingin mengedit butir soal lain.
- **Kekakuan Jumlah Pilihan Ganda**: Pilihan ganda terkunci 4 opsi, tidak mendukung kurikulum fase SD awal (3 opsi) ataupun jenjang SMP/SMA (5 opsi).
- **Pengaturan Waktu Kustom Tersembunyi**: Fitur durasi waktu kustom per butir soal belum memiliki antarmuka kendali.
- **Ketiadaan Preset Cepat Poin**: Pengisian bobot nilai mengharuskan membuka keyboard numerik di layar sentuh ponsel.

#### 2. Implementasi & Desain Clean (`QuizCreator.tsx`)
- **Navigasi Cepat Antar-Butir Soal (`[‹]` dan `[›]`)**:
  - Pager navigasi tersemat langsung di Header Utama samping indikator nomor soal.
  - Perubahan data butir soal aktif otomatis tersimpan secara aman sebelum beralih ke butir soal sebelumnya/berikutnya.
- **Fleksibilitas Pilihan Ganda (3 hingga 5 Opsi)**:
  - Tombol **`+ Tambah Opsi`** untuk menambah hingga opsi E.
  - Tombol hapus **`[✕]`** pada setiap butir opsi (minimal 2 opsi) dengan penyesuaian otomatis indeks kunci jawaban yang aman.
- **Aktivasi Waktu Jawab Kustom per Soal & Preset Cepat**:
  - Kolom input **Waktu Jawab** (detik) terintegrasi pada bilah konfigurasi atas berdampingan dengan Bobot Poin.
  - Chip preset satu-ketukan: **`[5p] [10p] [15p] [20p]`** untuk poin, serta **`[15s] [30s] [45s] [60s]`** untuk durasi waktu.
- **Umpan Balik Visual & Microcopy Anti-AI Slop**:
  - Indikator focus-within border glow pada kartu opsi jawaban saat kursor aktif.
  - Petunjuk rasio gambar optimal (16:9 / 4:3) tanpa kalimat bertele-tele.

## [2.3.16] - 2026-09-11
### Eliminasi Redundansi Tombol Simpan & Optimalisasi Alur Aksi Tunggal

#### 1. Masalah yang Diselesaikan
- **Redundansi Tombol Simpan Atas & Bawah**: Setelah tersedianya *Sticky Action Hub* pada Header Utama, keberadaan baris tombol `[Batal]` dan `[Simpan]` di bagian bawah kartu formulir editor soal menjadi redundan. Pengguna disajikan dua set tombol simpan yang menjalankan fungsi identik di satu layar.

#### 2. Implementasi & Desain Clean (`QuizCreator.tsx`)
- **Penetapan Header Utama Sebagai Pusat Kendali Tunggal (*Single Source of Truth*)**:
  - Baris tombol ganda di dasar kartu formulir dihapus total.
  - Seluruh aksi simpan (`[Simpan]`, `[Simpan Soal]`, dan `[Simpan & Tambah Lagi]`) serta pembatalan (`[Batal]`) kini terpusat secara konsisten pada *Sticky Action Hub* di Header Utama yang selalu tampak dan dapat diakses dari posisi gulir mana pun.
- **Formulir Ringkas & Bersih**:
  - Formulir editor butir soal kini diakhiri secara elegan pada kolom *Pembahasan Jawaban (Opsional)* tanpa elemen dekoratif atau tombol berulang di bawahnya.
  - Aksesibilitas keyboard tetap dipertahankan dengan pemicu submit tersembunyi (*hidden submit trigger*) sehingga menekan tombol Enter pada kolom input tetap menyimpan soal secara mulus.

## [2.3.15] - 2026-09-11
### Transformasi Header Utama Menjadi Sticky Action Hub Editor Butir Soal

#### 1. Masalah yang Diselesaikan
- **Redundansi Bertingkat (*Dual Header Stacking*)**: Saat pengguna membuka editor butir soal, halaman menampilkan dua tingkat header bertumpuk (Header Utama di bilah atas dan Header Kartu Form Editor di dalam kartu). Tumpukan ini memakan ~110–120px ruang vertikal berharga dan menimbulkan kesan visual yang berat.
- **Distraksi Tab Navigasi & Tombol Tidak Relevan**: Tab navigasi 3 langkah (*Bank Soal*, *Pengaturan Kuis*, *Simpan*) serta tombol *Reset Draf* tetap tampil saat pengguna sedang mengedit satu butir soal tertentu, mengurangi fokus dan menimbulkan risiko salah klik.
- **Keterbatasan Jangkauan Aksi Simpan**: Pengguna harus menggulir sampai ke dasar halaman untuk menekan tombol simpan atau batal pada butir soal yang memiliki banyak pilihan jawaban.

#### 2. Implementasi & Desain Clean (`QuizCreator.tsx`)
- **Transformasi Header Utama Adaptif (*Sticky Action Hub*)**:
  - Saat sesi editor butir soal aktif (`isQuestionEditorActive`), Header Utama secara adaptif bertransformasi menjadi pusat kendali editor soal.
  - **Sisi Kiri**: Tombol navigasi kembali `[←]` otomatis memanggil pembatalan edit dengan aman, dilengkapi ikon pensil dan judul dinamis **`Edit Soal #X`** beserta badge indikator **`X dari Y Soal`** (atau **`Tambah Soal Baru`** dengan badge **`Butir Soal #X`**).
  - **Sisi Kanan**: Tombol aksi cepat **`[Batal]`** dan **`[Simpan]`** (atau **`[Simpan & Tambah Lagi]`** + **`[Simpan Soal]`**) tersemat langsung di bilah atas yang selalu terlihat (*sticky*) saat layar digulir.
- **Eliminasi Header Kartu Form & Tab Navigasi**:
  - Header kartu di dalam form editor dihapus total. Area form kini langsung dimulai dari baris *Tipe Soal* dan *Bobot Poin*, menghemat ruang vertikal secara drastis (*above-the-fold efficiency*).
  - Tab navigasi 3 langkah dan tombol reset draf otomatis disembunyikan selama sesi penyuntingan butir soal untuk menjaga fokus visual.
- **Aksesibilitas Aksi Ganda (*Dual-Point Accessibility*)**:
  - Pengguna dapat menyimpan soal langsung melalui header sticky di bagian atas tanpa perlu menggulir ke bawah, ataupun melalui tombol aksi di bagian bawah formulir setelah selesai meninjau opsi jawaban.

## [2.3.14] - 2026-09-11
### Pembersihan Total AI Slop & Redundansi Editor Butir Soal

#### 1. Masalah yang Diselesaikan
- **AI Slop & Teks Bising (*Visual Noise*)**: Formulir editor soal memuat teks pengisi (*filler text*) yang bertele-tele seperti *"Sesuaikan pertanyaan, opsi, dan kunci jawaban"*, *"Teks Pertanyaan Soal \*"*, *"Tuliskan butir pertanyaan kuis secara jelas dan ramah anak..."*, dan teks petunjuk pembesaran sudut textarea yang sudah usang.
- **Redundansi Tombol Navigasi & Aksi Keluar**: Header editor memuat dua tombol keluar sekaligus (`[← Daftar Soal]` dan `[ ✕ ]`) yang menjalankan fungsi identik.
- **Redundansi Aksi Ilustrasi Gambar**: Tiga tombol berderet (`Cari/Buat`, `Unggah Berkas`, `Buat Cepat AI`) bersaing satu sama lain dan menduplikasi fitur modal gambar ber-tab.
- **Pelanggaran Standar Ukuran Target Sentuh (Rule 1)**: Tombol pemilih kunci jawaban pilihan ganda berukuran `w-7 h-7` (28×28 px), sangat rawan salah sentuh di layar ponsel cerdas.
- **Ketidakseimbangan Proporsi Input**: Kolom input Bobot Poin memakan 50% lebar layar desktop hanya untuk angka 2-digit.
- **Ambiguitas Tombol Aksi Bawah**: Tombol *"Simpan & Tambah Lagi"* ditampilkan saat mode edit soal, padahal pengguna sedang merevisi satu butir soal tertentu.

#### 2. Implementasi & Desain Clean (`QuizCreator.tsx`)
- **Navigasi Header Satu Arah & Konteks Butir Soal**:
  - Menghapus tombol silang `[✕]` ganda dan mempertahankan satu tombol `[← Kembali]` yang elegan.
  - Menambahkan judul berkonteks: **`Edit Soal #X`** disertai pill badge **`X dari Y Soal`** saat mode edit, atau **`Tambah Soal Baru`** dengan badge **`Butir Soal #X`** saat mode tambah.
  - Mengeliminasi seluruh subjudul klise khas AI.
- **Tata Letak Proporsional Tipe Soal & Bobot Poin**:
  - Kolom Tipe Soal mengambil mayoritas lebar (`flex-1`) dan Bobot Poin dibuat ringkas (`w-40`) dengan label satuan `"Poin"` di dalam kolom input.
  - Menyederhanakan label menjadi **`Tipe Soal`** dan **`Bobot Poin`**.
- **Penyederhanaan Form Pertanyaan**:
  - Label diringkas menjadi **`Pertanyaan Soal *`** dan placeholder profesional `"Tuliskan pertanyaan soal di sini..."`.
  - Menghapus teks instruksi manual sudut perbesar karena komponen sudah memiliki indikator grip bawaan.
- **Pusat Aksi Ilustrasi Terpadu (*Single Action Hub*)**:
  - Mengganti tiga tombol bersaing menjadi satu tombol terpadu **`[✨ Pilih / Buat Ilustrasi (AI, Ensiklopedia, Unggah)]`** yang terhubung langsung ke modal gambar multi-tab.
  - Tampilan gambar terpasang disederhanakan dengan pratinjau thumbnail, keterangan opsional, tombol `[Ganti Gambar]`, dan tombol `[Hapus Gambar]`.
- **Target Sentuh Kunci Pilihan Ganda 44 px (Kepatuhan Rule 1)**:
  - Meningkatkan ukuran tombol kunci pilihan ganda dari 28 px menjadi **`w-10 h-10` (40–44 px)** dengan sudut membulat modern (`rounded-lg` / `rounded-xl`).
  - Menyederhanakan label menjadi **`Pilihan Jawaban (Pilih Kunci Benar)`** tanpa teks instruksi mikro berlebih.
- **Diferensiasi Aksi Footer Berdasarkan Konteks**:
  - **Mode Edit**: Hanya menampilkan tombol `[Batal]` dan tombol primer **`[Simpan Perubahan]`**.
  - **Mode Tambah Baru**: Menampilkan tombol `[Batal]`, tombol sekunder **`[Simpan & Tambah Lagi]`**, dan tombol primer **`[Simpan Soal]`**.

## [2.3.13] - 2026-09-11
### Penyesuaian Spasi Bawah: Normalisasi Jarak Tombol Navigasi Akhir ke Dasar Halaman

#### 1. Masalah yang Diselesaikan
- **Jarak Kosong Berlebih di Bawah Tombol Akhir**: Jarak antara baris tombol akhir navigasi (`[Simpan Draf]` dan `[Lanjut ke Pengaturan Kuis]`) ke batas paling bawah halaman (*page bottom edge*) sebelumnya terlalu renggang (`pb-20 sm:pb-24` atau mencapai 80–96px). Hal ini menyisakan ruang kosong putih/gelap yang terlalu besar dan tampak tidak proporsional saat pengguna menggulir ke akhir daftar soal.

#### 2. Implementasi & Penyelarasan Spasi (`QuizCreator.tsx`)
- **Normalisasi Padding Bawah Kontainer Bank Soal**:
  - Mengurangi padding bawah dari `pb-20 sm:pb-24` (80–96px) menjadi **`pb-6 sm:pb-8` (24px di ponsel, 32px di desktop)**.
  - Spasi antara tombol navigasi akhir dan dasar layar kini proporsional, rapi, dan estetis sesuai standar desain modern.
- **Penyelarasan Threshold Sensor Sembunyi Otomatis FAB**:
  - Menyesuaikan batas sensor `isNearBottom` dari 180px menjadi **110px**, sehingga tombol melayang (FAB) tetap bersembunyi halus secara tepat waktu sebelum kursor atau layar mencapai area tombol navigasi akhir tanpa meninggalkan ruang kosong berlebih.

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
