# Panduan Integrasi Google OAuth dengan Supabase

Dokumen ini menjelaskan langkah demi langkah untuk mengonfigurasi autentikasi Google (*Google OAuth 2.0*) pada platform Kuis Interaktif berbasis Supabase Auth.

---

## 1. Konfigurasi di Google Cloud Console

1. **Masuk ke Google Cloud Console**:
   * Kunjungi [https://console.cloud.google.com/](https://console.cloud.google.com/) menggunakan akun Google Anda.
   * Buat project baru (contoh: `Kuis Interaktif SD`) atau pilih project yang sudah ada.

2. **Konfigurasi Layar Persetujuan OAuth (*OAuth Consent Screen*)**:
   * Pada menu bilah samping, pilih **APIs & Services** > **OAuth consent screen**.
   * Pilih tipe pengguna: **External**, lalu klik **Create**.
   * Lengkapi formulir aplikasi:
     * **App name**: `Kuis Interaktif SD` (atau nama aplikasi Anda)
     * **User support email**: Masukkan email dukungan Anda
     * **Developer contact information**: Masukkan alamat email Anda
   * Klik **Save and Continue**.
   * Pada langkah **Scopes**, biarkan default (`email`, `profile`, `openid`), lalu klik **Save and Continue**.
   * Pada bagian **Test users** (jika masih status Testing), Anda dapat menambahkan email akun penguji Anda, atau ubah status ke **Publishing App** untuk akses publik.

3. **Membuat Kredensial OAuth Client ID**:
   * Pada menu samping, pilih **APIs & Services** > **Credentials**.
   * Klik **+ CREATE CREDENTIALS** > pilih **OAuth client ID**.
   * **Application type**: Pilih **Web application**.
   * **Name**: Berikan nama (contoh: `Kuis Interaktif Web Client`).
   * **Authorized JavaScript origins**:
     * `http://localhost:5173` *(pengembangan lokal Vite)*
     * `http://localhost:3000` *(opsional)*
     * Domain produksi Anda, misalnya: `https://kuis-interaktif.vercel.app`
   * **Authorized redirect URIs** (Sangat Kritis):
     * Masukkan URL callback dari project Supabase Anda:  
       `https://<YOUR-PROJECT-ID>.supabase.co/auth/v1/callback`
       *(Ganti `<YOUR-PROJECT-ID>` dengan ID project Supabase Anda yang tertera di file `.env`)*
   * Klik tombol **CREATE**.
   * Simpan **Client ID** dan **Client Secret** yang ditampilkan.

---

## 2. Konfigurasi di Supabase Dashboard

1. **Buka Dashboard Supabase**:
   * Kunjungi [https://supabase.com/dashboard](https://supabase.com/dashboard) dan pilih project Anda.

2. **Aktifkan Google Provider**:
   * Di menu navigasi samping, klik **Authentication** > **Providers**.
   * Gulir ke bawah dan klik **Google**.
   * Aktifkan toggle **Enable Google provider**.
   * Masukkan nilai:
     * **Client ID**: Tempelkan Client ID dari Google Cloud Console.
     * **Client Secret**: Tempelkan Client Secret dari Google Cloud Console.
   * Klik tombol **Save**.

3. **Konfigurasi Redirect URLs**:
   * Di menu navigasi samping, klik **Authentication** > **URL Configuration**.
   * **Site URL**: Masukkan alamat situs utama Anda (contoh: `http://localhost:5173` untuk lokal atau domain produksi Anda).
   * **Redirect URLs**: Tambahkan pola URL berikut:
     * `http://localhost:5173/**`
     * `http://localhost:3000/**`
     * `https://*.vercel.app/**` (atau domain kustom Anda)
   * Klik tombol **Save**.

---

## 3. Alur Kerja di Aplikasi Web

1. **Masuk / Daftar Guru**:
   * Guru memilih Tab Pendidik / Guru pada modal autentikasi, lalu menekan **Masuk Guru dengan Akun Google** atau **Daftar Guru dengan Akun Google**.
   * Sistem mengarahkan guru ke akun Google, memvalidasi persetujuan, dan mengembalikan sesi ke URL web.
   * Data akun otomatis tersinkronisasi ke tabel `public.profiles_teacher`.

2. **Masuk / Daftar Siswa**:
   * Siswa memilih Tab Siswa / Pelajar pada modal autentikasi, lalu menekan **Masuk Siswa dengan Akun Google** atau **Daftar Siswa dengan Akun Google**.
   * Setelah diverifikasi Google, profil siswa otomatis disinkronkan ke tabel `public.profiles_player` beserta bintang dan statistik lokalnya.

3. **Pembersihan URL Parameter**:
   * Token dan parameter pengalihan (`oauth_callback`, `code`) dibersihkan secara transparan melalui `window.history.replaceState` untuk menjaga estetika dan kenyamanan pengguna.
