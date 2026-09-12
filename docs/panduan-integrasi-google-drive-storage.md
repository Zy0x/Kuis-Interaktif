# Panduan Integrasi Penyimpanan Media Google Drive Pro (Supabase Edge Function)

Dokumen ini menjelaskan arsitektur, konfigurasi rahasia (*secrets*), dan operasional penyimpanan media aplikasi Kuis Interaktif menggunakan Google Drive Pro pribadi milik pengguna melalui Supabase Edge Function `upload-drive`.

---

## 1. Prinsip Keamanan & Arsitektur (Rule 9 & Rule 10)

1. **Zero Secret on Frontend**: Kunci privat RSA (*Private Key*), *Client Secret*, maupun token sensitif Google sama sekali **tidak diekspos di kode sisi klien (frontend)**.
2. **Server-Side Edge Function**: Semua proses tanda tangan JWT (RS256 assertion), pertukaran token Google OAuth2, unggah berkas multipart, dan penyetelan izin akses publik dieksekusi secara terisolasi di Supabase Edge Function `upload-drive`.
3. **Penyimpanan Permanen Google CDN**: Berkas yang diunggah dikembalikan dalam bentuk URL gambar CDN Google berkecepatan tinggi:
   - Gambar Beresolusi Tinggi: `https://lh3.googleusercontent.com/d/{fileId}=s1600`
   - Thumbnail Cepat: `https://lh3.googleusercontent.com/d/{fileId}=s400`
   - Tautan Web Drive: `https://drive.google.com/file/d/{fileId}/view?usp=drivesdk`

---

## 2. Rahasia Supabase (*Supabase Secrets*)

Kredensial disimpan di Supabase Vault / Secrets:

| Nama Secret | Deskripsi | Contoh Nilai |
| :--- | :--- | :--- |
| `GDRIVE_CLIENT_EMAIL` | Email Service Account Google Cloud | `kuis-drive-uploader@kuis-interaktif-508417.iam.gserviceaccount.com` |
| `GDRIVE_PRIVATE_KEY` | Kunci Privat RSA PKCS#8 Service Account | `-----BEGIN PRIVATE KEY-----\nMIIEvg...` |
| `GDRIVE_FOLDER_ID` | ID Folder Google Drive target penyimpanan | `1piF6GTYClcAP3duiwub3F1UB35Fb9IO-` (Storage Kuis) |
| `GDRIVE_PROJECT_ID` | Project ID Google Cloud Platform | `kuis-interaktif-508417` |

> [!NOTE]
> Perintah CLI Supabase untuk memperbarui secrets:
> ```bash
> npx supabase secrets set GDRIVE_FOLDER_ID="ID_FOLDER_BARU" --project-ref colpcgesngntiztjeprg
> ```

---

## 3. Ketentuan Google Drive: Shared Drive vs Akun Pribadi Google One

Kebijakan Google Drive API memberlakukan aturan kuota:
- **Service Account** memiliki kuota individu 0 byte pada folder Drive pribadi biasa (*storageQuotaExceeded*).
- Untuk memanfaatkan kuota Google Pro pengguna, tersedia dua opsi implementasi resmi:

### Opsi A: Google Workspace (Drive Bersama / Shared Drive) — Paling Direkomendasikan jika memiliki Workspace
1. Buka [Google Drive](https://drive.google.com).
2. Pada menu kiri, klik **Drive Bersama** (*Shared Drives*) -> **Baru** (+).
3. Beri nama, misalnya: `Kuis Interaktif Media`.
4. Klik **Kelola Anggota** (*Manage Members*) -> Tambahkan email:
   `kuis-drive-uploader@kuis-interaktif-508417.iam.gserviceaccount.com`
   Pilih peran: **Pengelola Konten** (*Content Manager*).
5. Salin ID folder atau ID Drive Bersama dari URL browser (setelah `/folders/`).
6. Perbarui secret `GDRIVE_FOLDER_ID` di Supabase:
   ```bash
   npx supabase secrets set GDRIVE_FOLDER_ID="ID_SHARED_DRIVE_ANDA" --project-ref colpcgesngntiztjeprg
   ```

### Opsi B: Akun Pribadi Google One (@gmail.com) via OAuth2 Refresh Token
Jika akun Google Anda adalah akun personal `@gmail.com` dengan langganan Google One Pro (100 GB / 2 TB):
1. Buat **OAuth 2.0 Client ID** (tipe Web Application atau Desktop App) di Google Cloud Console project `kuis-interaktif-508417`.
2. Dapatkan `GDRIVE_REFRESH_TOKEN` satu kali melalui OAuth Playground atau Google auth flow.
3. Daftarkan secret tambahan di Supabase:
   - `GDRIVE_CLIENT_ID`
   - `GDRIVE_CLIENT_SECRET`
   - `GDRIVE_REFRESH_TOKEN`
4. Edge Function `upload-drive` secara otomatis beralih ke mode `refresh_token`, mengunggah berkas atas nama akun Google pribadi Anda, dan langsung menggunakan kuota Google One Pro Anda.

---

## 4. Endpoint Edge Function `upload-drive`

- **URL**: `https://colpcgesngntiztjeprg.supabase.co/functions/v1/upload-drive`
- **Method**: `POST`
- **Headers**:
  ```http
  Authorization: Bearer <SUPABASE_ANON_KEY>
  Content-Type: multipart/form-data  (atau application/json)
  ```

### Contoh Request Form Data (Unggah Berkas)
```javascript
const formData = new FormData();
formData.append('file', fileObject);
formData.append('fileName', 'soal_ipa_ekosistem.png');

const { data, error } = await supabase.functions.invoke('upload-drive', {
  body: formData
});
```

### Format Response Sukses
```json
{
  "success": true,
  "fileId": "1a2b3c4d5e...",
  "name": "soal_ipa_ekosistem.png",
  "mimeType": "image/png",
  "directUrl": "https://lh3.googleusercontent.com/d/1a2b3c4d5e...=s1600",
  "thumbnailUrl": "https://lh3.googleusercontent.com/d/1a2b3c4d5e...=s400",
  "webViewLink": "https://drive.google.com/file/d/1a2b3c4d5e.../view?usp=drivesdk"
}
```

---

## 5. Komponen Frontend Terintegrasi

1. **`src/lib/driveUploadService.ts`**: Service klien perantara pemanggil Edge Function Supabase.
2. **`src/components/creator/ImageSelectorModal.tsx`**: Pemilih dan pengunggah gambar butir soal guru.
3. **`src/components/creator/QuizCoverModal.tsx`**: Pengunggah dan pengatur gambar sampul kuis interaktif.
4. **Fallback Aman**: Jika terjadi gangguan jaringan atau kendala kuota, sistem menyediakan fallback kompresi lokal transparan agar aktivitas guru tidak terhenti.
