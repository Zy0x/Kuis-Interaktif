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

3. **Konfigurasi Redirect URLs (Sangat Penting untuk Akses Lokal & HP)**:
   * Di menu navigasi samping, klik **Authentication** > **URL Configuration**.
   * **Site URL**: Masukkan alamat situs utama Anda (contoh: `http://localhost:5173` untuk lokal atau domain produksi Anda).
   * **Redirect URLs**: Tambahkan pola URL berikut ke dalam daftar putih (*whitelist*):
     * `http://localhost:5173/**`
     * `http://127.0.0.1:5173/**`
     * `http://192.168.1.9:5173/**` *(sesuaikan dengan IP komputer Anda)*
     * `http://192.168.1.*:5173/**` *(wildcard subnet 192.168.1.x)*
     * `http://192.168.*.*:5173/**` *(wildcard seluruh jaringan lokal Wi-Fi)*
     * `http://localhost:3000/**`
     * `https://*.vercel.app/**` (atau domain kustom produksi Anda)
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

---

## 4. Troubleshooting Pengujian di Jaringan Lokal & Smartphone (IP LAN `192.168.x.x:5173`)

### Pertanyaan: Mengapa saat login Google dari HP (`http://192.168.1.9:5173`) gagal diarahkan kembali ke web?
**Penyebab:**
1. **Supabase Whitelist**: Ketika tombol Login Google ditekan pada perangkat HP di alamat `http://192.168.1.9:5173`, aplikasi meminta Supabase untuk mengarahkan kembali ke `http://192.168.1.9:5173/?oauth_callback=1...`.
2. Jika alamat `http://192.168.1.9:5173/**` belum didaftarkan di **Supabase Dashboard > Authentication > URL Configuration > Redirect URLs**, Supabase demi alasan keamanan **menolak** pengalihan tersebut.
3. Supabase kemudian mengalihkan browser ke **Site URL** bawaan (`http://localhost:5173/`).
4. Pada smartphone/HP Anda, `localhost` mengacu pada perangkat smartphone itu sendiri (bukan komputer host Vite), sehingga peramban HP memunculkan pesan kesalahan: *"ERR_CONNECTION_REFUSED"* atau *"Situs ini tidak dapat dijangkau"*.

### Apakah IP `192.168.1.9` perlu dimasukkan ke Google Cloud Console?
**Jawabannya: TIDAK.**
* Google Cloud Console secara sistem **menolak** alamat IP mentah (*Raw IP Addresses*) pada kolom *Authorized JavaScript Origins*.
* Dalam arsitektur Supabase Auth, Google **hanya** berkomunikasi dengan domain Supabase:
  `Authorized redirect URIs`: `https://<YOUR-PROJECT-ID>.supabase.co/auth/v1/callback`
* Google mengembalikan data autentikasi ke Supabase Cloud, kemudian Supabase Cloud yang bertugas mengarahkan kembali ke HP/laptop Anda.
* Oleh karena itu, **Anda hanya perlu menambahkan URL IP lokal di Dashboard Supabase**, bukan di Google Cloud Console!

### Solusi Cepat (3 Langkah):
1. Buka [Dashboard Supabase](https://supabase.com/dashboard) > Masuk ke project Anda.
2. Buka menu **Authentication** > **URL Configuration**.
3. Di bagian **Redirect URLs**, klik **Add URL** dan masukkan:
   * `http://192.168.1.9:5173/**`
   * `http://192.168.1.*:5173/**`
   * `http://192.168.*.*:5173/**`
4. Klik **Save**.
5. Coba kembali login Google dari smartphone atau browser di jaringan yang sama — pengalihan kini akan kembali mulus ke `http://192.168.1.9:5173/`!

