# 🎓 Kuis Interaktif Siswa SD — Kurikulum Merdeka

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployment%20Active-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://kuis-interaktif-plum.vercel.app)
[![Production](https://img.shields.io/badge/Production-Live-success?style=for-the-badge&logo=googlechrome&logoColor=white)](https://kuis-interaktif-plum.vercel.app)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://kuis-interaktif-plum.vercel.app)
[![Version](https://img.shields.io/badge/Version-v2.4.59-blue?style=for-the-badge)](CHANGELOG.md)

Platform aplikasi kuis interaktif modern berbasis web dan Progressive Web App (PWA) yang dirancang khusus untuk siswa Sekolah Dasar (SD) dalam ekosistem Kurikulum Merdeka. Terintegrasi penuh dengan Supabase Cloud untuk sinkronisasi realtime, manajemen soal, autentikasi guru & siswa, serta rekap penilaian komprehensif.

🌐 **Production URL**: [https://kuis-interaktif-plum.vercel.app](https://kuis-interaktif-plum.vercel.app)  
📦 **Repository**: [https://github.com/Zy0x/Kuis-Interaktif](https://github.com/Zy0x/Kuis-Interaktif)

---

## ✨ Fitur Unggulan

- 📋 **Analisis Jawaban Siswa & Jam Input (v2.4.57)**:
  - Guru dapat memeriksa lembar jawaban terperinci tiap siswa di ruang kendali live host maupun rekap sesi kuis.
  - Menampilkan waktu pengisian riil (jam input siswa dalam format WIB/WITA/WIT berakurasi detik) dan durasi pengerjaan.
  - Filter interaktif: *Semua Soal*, *❌ Jawaban Salah (Remedial)*, *✅ Jawaban Benar*, serta *⚪ Belum Dijawab*.
  - Dilengkapi accordion pembahasan materi dan penanda integritas perpindahan layar.

- 🎮 **Mode Permainan Fleksibel**:
  - **Mode Santai (Bebas Waktu)**: Siswa dapat mengerjakan soal tanpa tekanan hitung mundur timer.
  - **Mode Ujian Rahasia (`exam_strict`)**: Kunci jawaban dirahasiakan selama kuis berlangsung, hasil dinilai transparan di akhir kuis.
  - **Navigasi & Pemilihan Ulang Jawaban**: Khusus mode santai rahasia, siswa dapat mengubah pilihan jawaban, menekan tombol *Sebelumnya*, dan membuka *Peta Kisi Soal* untuk melompat ke nomor tertentu tanpa risiko salah klik.
  - **Mode Berwaktu (Standar, Cepat, dsb.)**: Timer per soal dengan kunci jawaban instan atau proteksi ujian ketat.
- 📱 **Mobile-First & Touch-First Design**:
  - Dirancang presisi untuk semua ukuran layar (Mobile S/M/L, Tablet, Desktop) dengan target sentuh minimal 44×44 px.
  - Dukungan reorientasi otomatis (Portrait/Landscape) dan animasi interaktif yang ringan dan responsif.
- 📶 **Progressive Web App (PWA) & Dukungan Offline**:
  - Dapat di-install langsung di Android, iOS, Windows, dan macOS.
  - Caching aset statis cerdas via Service Worker.
- 🔒 **Keamanan & Backend Eksklusif Supabase**:
  - Row Level Security (RLS) ketat pada seluruh tabel.
  - Autentikasi guru & siswa terisolasi, enkripsi data sensitif, dan tanpa penyimpanan token rahasia di client-side.
- 📊 **Dashboard Guru & Analitik Siswa**:
  - Pembuat kuis interaktif (Pilihan Ganda, Benar/Salah, Tebak Gambar, Isian Singkat, dsb.).
  - Rekap skor, ekspor cetak lembar kerja kuis (*Worksheet Print View*), dan manajemen bank soal.

---

## 🚀 Deployment

Aplikasi ini dideploy secara live di **Vercel**:
- **Live URL**: [https://kuis-interaktif-plum.vercel.app](https://kuis-interaktif-plum.vercel.app)
- **Deployment Status**: Terintegrasi langsung dengan GitHub Actions di bawah menu **Deployments: Production**.

### Perintah Build & Deploy Manual
```bash
# Instalasi dependensi
npm install

# Build lokal & uji TypeScript
npm run build

# Deploy ke Vercel Production
npx vercel --prod --yes
```

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Icons & UI**: Lucide Icons, Canvas Confetti
- **Backend & Database**: Supabase Cloud (PostgreSQL, Auth, Realtime, Storage)
- **Deployment & Hosting**: Vercel (Edge Network)
- **PWA**: Custom Service Worker, Web App Manifest

---

## 📄 Lisensi & Riwayat Rilis

Riwayat pembaruan dan rilis versi tercatat lengkap pada [CHANGELOG.md](CHANGELOG.md).
