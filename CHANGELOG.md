# Catatan Perubahan (Changelog)
Seluruh riwayat rilis dan pembaruan sistem **Kuis SD Seru** dicatat pada dokumen ini sesuai dengan standar penomoran versi berlanjut.

---

## [2.1.4] - 2026-09-09
### Optimasi Presisi Mobile-First (Mobile-S, Mobile-M, Mobile-L) & Verifikasi E2E

#### Peningkatan Kualitas & Presisi Tampilan (Improved)
- **Dukungan Layar Mobile Ekstrem (Mobile-S 320px, Mobile-M 375px, Mobile-L 425px):**
  - Penyempurnaan bilah navigasi atas (*Header Navbar*) agar tidak tumpang tindih pada layar 320 px (iPhone SE generasi awal, ponsel lipat, dan ponsel Android hemat daya).
  - Target sentuh terverifikasi minimal 44×44 px hingga 48×55 px pada seluruh tombol navigasi, opsi pilihan ganda, tombol audio, dan avatar profil.
  - Kartu kuis di Beranda otomatis menyesuaikan lebar (1 kolom pada Mobile-S/M/L, 2 kolom pada Tablet, 3 kolom pada Desktop/4K).
  - Penyesuaian tipografi dinamis: teks pertanyaan berukuran 16–20 px dengan kontras warna tinggi memenuhi standar WCAG AA.
- **Verifikasi End-to-End (E2E) Teruji Nyata:**
  - Pengujian pembuatan kuis oleh guru dengan penyisipan stiker ilustrasi edukatif.
  - Verifikasi otomatis masuknya kuis baru ke katalog Beranda dengan lencana *"Karya Guru"*.
  - Pengujian permainan di Arena Kuis, pemilihan jawaban, penerimaan umpan balik audio, hingga perolehan skor 100 dan 3 Bintang Emas.
  - Verifikasi tab Pembahasan Soal dan Papan Peringkat pada resolusi 320px, 375px, dan 425px.

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
- Penetapan standar mobile-first, arsitektur database Supabase, dan protokol backup admin.\n