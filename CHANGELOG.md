# Catatan Perubahan (Changelog)
Seluruh riwayat rilis dan pembaruan sistem **Kuis SD Seru** dicatat pada dokumen ini sesuai dengan standar penomoran versi berlanjut.

---

## [2.1.3] - 2026-09-09
### Rilis Fitur Fase 2: Studio Penyusun Kuis Guru (Quiz Creator Studio)

#### Fitur Baru (Added)
- **Studio Penyusun Kuis Mandiri Guru (`QuizCreator.tsx`):**
  - Wizard penyusunan bertahap 3 langkah: Identitas Kuis -> Bank Soal & Gambar -> Pratinjau Mobile & Publikasi.
  - Penyesuaian parameter kuis: Judul, deskripsi, tingkat kelas (1–6 SD), mata pelajaran, durasi waktu per soal (15–60 detik), ikon emoji sampul, dan gelar lencana prestasi.
  - Editor bank soal interaktif: Pilihan Ganda (2–4 opsi) dan Benar/Salah (*True/False*).
  - Penentuan kunci jawaban satu-klik berbingkai hijau yang intuitif dan bebas kesalahan.
  - Kolom catatan pembahasan edukatif untuk membantu pemahaman konsep belajar anak.
- **Fitur Sisipkan Gambar & Ilustrasi Soal:**
  - Pemilih cepat stiker ilustrasi edukatif populer (pecahan pizza, geometri segitiga/persegi, organ tubuh, lambang Garuda, katak amfibi, dsb.).
  - Unggah foto/ilustrasi kustom langsung dari galeri HP atau komputer dengan pratinjau instan.
- **Pratinjau Mobile & Integrasi Katalog Beranda:**
  - Pratinjau langsung simulasi kartu kuis dan format tampilan sebelum kuis diterbitkan.
  - Kuis buatan guru otomatis muncul di Beranda dengan lencana khusus *"Karya Guru 🧑‍🏫"*.
  - Opsi hapus kuis buatan guru secara mandiri dengan konfirmasi perlindungan.
- **Penyimpanan Ganda Cerdas (*Dual Storage Sync*):**
  - Otomatis tersimpan ke LocalStorage responsif dan langsung tersinkron ke tabel `quizzes` serta `quiz_questions` Supabase jika variabel environment terkonfigurasi.

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
