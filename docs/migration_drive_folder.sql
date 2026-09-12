-- ============================================================
-- Migration: Tambah kolom drive_folder_id ke tabel quizzes
-- Digunakan untuk melacak folder Google Drive per kuis secara stabil
-- (tidak berubah meski PIN kuis diperbarui)
-- Jalankan di: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Tambah kolom drive_folder_id
ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS drive_folder_id TEXT DEFAULT NULL;

-- 2. Tambah index untuk lookup cepat
CREATE INDEX IF NOT EXISTS idx_quizzes_drive_folder_id
  ON quizzes(drive_folder_id)
  WHERE drive_folder_id IS NOT NULL;

-- 3. Komentar kolom (dokumentasi skema)
COMMENT ON COLUMN quizzes.drive_folder_id IS
  'ID folder Google Drive Pro yang terkait dengan kuis ini. Digunakan agar folder tetap stabil meski PIN berubah, dan untuk keperluan auto-cleanup saat kuis dihapus.';
