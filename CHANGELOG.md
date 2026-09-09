# Catatan Perubahan (Changelog)
Seluruh riwayat rilis dan pembaruan sistem **Kuis SD Seru** dicatat pada dokumen ini sesuai dengan standar penomoran versi berlanjut.

---

## [2.1.2] - 2026-09-09
### Pondasi Arsitektur & Rilis Fitur Fase 1 (Core Gameplay & PWA)

#### Fitur Baru (Added)
- **Beranda Kuis Ramah Anak:**
  - Penjelajah kuis dengan filter jenjang Kelas 1 hingga 6 SD serta filter mata pelajaran (Matematika, IPA, dan Pendidikan Pancasila).
  - Mulai sekali ketuk (*1-Tap Play*) tanpa registrasi rumit yang membebani siswa.
  - Modal Aturan Singkat visual berilustrasi ceria sebelum kuis dimulai.
- **Arena Kuis Interaktif:**
  - Desain sentuh nyaman (*touch-first*) dengan target sentuh minimal 48×48 px.
  - Ragam model soal: Pilihan Ganda ceria, Benar/Salah (*True/False*), dan Tebak Gambar.
  - Timer visual progresif ramah anak dengan animasi peringatan lembut saat waktu tersisa 5 detik.
  - Feedback instan beranimasi (150–300 ms) saat jawaban dipilih.
  - Kotak pembahasan singkat otomatis untuk membantu anak memahami konsep secara langsung.
- **Hasil Kuis & Gamifikasi:**
  - Kartu rekap nilai edukatif dengan perolehan 1 hingga 3 Bintang Emas.
  - Efek selebrasi konfeti interaktif saat kuis selesai.
  - Tab pembahasan lengkap yang menampilkan jawaban siswa, jawaban benar, dan alasan edukatif.
  - Tab Papan Peringkat (*Leaderboard*) ramah anak berbasis nama panggilan dan avatar kartun.
  - Tombol main ulang instan dengan pengacakan urutan soal (*shuffle*).
- **Progressive Web App (PWA):**
  - Web App Manifest lengkap dengan dukungan tema warna cerah.
  - Service Worker untuk *offline caching* dan pemuatan instan.
  - Layar pembuka (*Splash Screen*) beranimasi logo ceria maskot bintang SD (1.5 detik).
  - Dialog pasang aplikasi (*Add to Home Screen*) cepat.
  - Komponen bantuan reorientasi layar mobile responsif.
- **Efek Suara Berbasis Web Audio API:**
  - Synthesizer melodi nada denting ceria instan tanpa file media eksternal besar.
  - Kontrol matikan/nyalakan suara (*mute toggle*) yang tersimpan otomatis.
- **Basis Data & Dokumentasi Supabase Eksternal:**
  - Skrip DDL lengkap `docs/setup.sql` dengan 6 tabel ber-RLS ketat dan trigger timestamp.
  - Panduan administrasi pencadangan terenkripsi AES-256 dan pemulihan `docs/backup-restore-guide.md`.
  - Panduan arsitektur data dan konfigurasi `docs/database-architecture.md`.

#### Peningkatan Kualitas (Improved)
- Antarmuka responsif stabil pada resolusi standar maupun non-reguler (1080×2460, 1080×2380, rentang 720p hingga 4K).
- Tipografi menggunakan font keterbacaan tinggi (*Quicksand* dan *Nunito*) dengan kontras warna memenuhi standar WCAG AA.
- Tidak ada ketergantungan interaksi *hover-only*.

---

## [2.1.1] - 2026-09-09
### Rilis Perencanaan & Dokumen Kebutuhan Produk (PRD)
- Penyusunan dokumen PRD komprehensif berdasarkan peta fitur Fase 1, Fase 2, dan Fase 3.
- Penetapan standar mobile-first, arsitektur database Supabase, dan protokol backup admin.
