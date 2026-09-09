# Panduan Administrasi: Backup & Restore Terenkripsi
**Aplikasi:** Kuis SD Seru  
**Versi Standar:** 2.1.2  
**Tingkat Keamanan:** Standar Enterprise (AES-256, GZIP, SHA-256 Checksum)

Dokumen ini menjelaskan prosedur pencadangan (*backup*) dan pemulihan (*restore*) database Supabase mandiri secara aman dan terstandarisasi.

---

## 1. Spesifikasi Standar File Cadangan

Setiap arsip backup wajib memenuhi spesifikasi berikut:
- **Enkripsi:** AES-256 (CBC atau GCM)
- **Kompresi:** GZIP tingkat 9
- **Format Penamaan:** `backup_kuis_sd_seru_YYYYMMDD_HHMMSS_v2.1.2.sql.gz.enc`
- **Integritas:** Checksum SHA-256 dihitung sebelum dan sesudah proses transfer untuk memastikan file tidak korup atau dimanipulasi.

---

## 2. Alur Pencadangan (Backup Flow)

```
Database Supabase -> [pg_dump] -> Berkas .sql -> [GZIP] -> Berkas .sql.gz -> [AES-256 Encrypt] -> Berkas .enc + SHA-256 -> Storage Tertutup
```

### Skrip Backup Otomatis (Contoh Node.js / Deno)

```typescript
import { createCipheriv, createHash, randomBytes } from 'crypto';
import { createGzip } from 'zlib';
import { createReadStream, createWriteStream } from 'fs';

// Kunci enkripsi diambil dari environment variable rahasia (Deno.env.get / process.env)
const ENCRYPTION_KEY = Buffer.from(process.env.BACKUP_AES_KEY!, 'hex'); // 32 bytes untuk AES-256
const IV = randomBytes(16);

export function encryptBackupFile(inputSqlPath: string, outputPath: string) {
  const cipher = createCipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
  const gzip = createGzip({ level: 9 });

  const input = createReadStream(inputSqlPath);
  const output = createWriteStream(outputPath);

  // Tulis IV di awal berkas terenkripsi
  output.write(IV);

  input.pipe(gzip).pipe(cipher).pipe(output);

  output.on('finish', () => {
    console.log('Pencadangan terenkripsi AES-256 selesai.');
  });
}
```

---

## 3. Alur Pemulihan (Restore Flow)

1. **Validasi File:**
   - Cocokkan nilai SHA-256 berkas dengan rekaman pada tabel `system_backups`.
   - Tolak pemulihan jika terjadi ketidaksesuaian checksum.
2. **Dekripsi & Dekompresi:**
   - Ambil 16 byte pertama sebagai Initialization Vector (IV).
   - Jalankan dekripsi AES-256-CBC -> Decompress Gunzip.
3. **Eksekusi Transaksional (*Staged Import*):**
   - Jalankan impor SQL dalam satu blok `BEGIN; ... COMMIT;`.
   - Jika terdapat kegagalan struktur tabel atau benturan relasi, sistem otomatis melakukan `ROLLBACK;`.

---

## 4. Prosedur Darurat: Hapus Seluruh Database (*Total Database Wipe*)

Fitur ini hanya dapat diakses melalui antarmuka Super-Admin dengan **perlindungan 3 lapis wajib**:

1. **Lapis 1 - Sandi Super-Admin:** Memasukkan kata sandi akun admin aktif.
2. **Lapis 2 - Verifikasi Kalimat:** Mengetik tepat teks konfirmasi: `"HAPUS SELURUH DATABASE KUIS SD SERU"`.
3. **Lapis 3 - Konfirmasi Resiko Permanen:** Mencentang persetujuan bahwa penghapusan bersifat permanen dan tidak dapat dibatalkan.

Setiap tindakan penghapusan otomatis dicatat ke tabel `public.audit_logs` sebelum transaksi penutupan dimulai.
