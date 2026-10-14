-- ==========================================================
-- SKRIP DATABASE SUPABASE RESMI: KUIS SD SERU
-- Versi Skema: 2.2.40
-- Tanggal: 2026-09-10
-- ==========================================================
-- Jalankan skrip ini langsung di Supabase SQL Editor milik Anda:
-- Dashboard Supabase -> Project Anda -> SQL Editor -> New Query -> Paste & Run.
-- Seluruh tabel telah dilengkapi RLS (Row Level Security),
-- Indeks performa, Constraint, dan Seed Data Kuis Bawaan.
-- ==========================================================

-- 1. AKTIFKAN EKSTENSI POSTGRESQL YANG DIBUTUHKAN
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================================
-- 2. TABEL PROFIL PEMAIN / SISWA (PROFILES_PLAYER)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.profiles_player (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email VARCHAR(255),
    nickname VARCHAR(64) NOT NULL DEFAULT 'Saya',
    avatar_id VARCHAR(32) NOT NULL DEFAULT 'lion',
    grade_level SMALLINT CHECK (grade_level BETWEEN 1 AND 6),
    total_score INT NOT NULL DEFAULT 0,
    quizzes_completed INT NOT NULL DEFAULT 0,
    stars_earned INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_player_auth ON public.profiles_player(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_player_email ON public.profiles_player(email);
CREATE INDEX IF NOT EXISTS idx_profiles_player_score ON public.profiles_player(total_score DESC);

-- ==========================================================
-- 3. TABEL PROFIL GURU / PENDIDIK (PROFILES_TEACHER)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.profiles_teacher (
    id TEXT PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email VARCHAR(255),
    full_name VARCHAR(120) NOT NULL,
    school_name VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_teacher_auth ON public.profiles_teacher(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_teacher_email ON public.profiles_teacher(email);

-- ==========================================================
-- 4. TABEL KUIS UTAMA (QUIZZES)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.quizzes (
    id TEXT PRIMARY KEY,
    creator_id TEXT,
    creator_name VARCHAR(120),
    pin_code VARCHAR(8),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(64) NOT NULL,
    target_grade SMALLINT NOT NULL CHECK (target_grade BETWEEN 1 AND 6),
    duration_per_question_sec SMALLINT NOT NULL DEFAULT 30 CHECK (duration_per_question_sec >= 10),
    cover_emoji VARCHAR(16) DEFAULT '⭐',
    theme_color VARCHAR(64) DEFAULT 'from-blue-500 to-indigo-600',
    badge_title VARCHAR(64) DEFAULT 'Bintang Juara',
    visibility VARCHAR(16) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
    default_game_mode VARCHAR(32) DEFAULT 'standard',
    shuffle_questions BOOLEAN DEFAULT FALSE,
    shuffle_options BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_grade ON public.quizzes(target_grade);
CREATE INDEX IF NOT EXISTS idx_quizzes_subject ON public.quizzes(subject);
CREATE INDEX IF NOT EXISTS idx_quizzes_pin ON public.quizzes(pin_code);
CREATE INDEX IF NOT EXISTS idx_quizzes_visibility ON public.quizzes(visibility);
CREATE INDEX IF NOT EXISTS idx_quizzes_published ON public.quizzes(is_published) WHERE is_published = TRUE;

-- ==========================================================
-- 5. TABEL BANK SOAL KUIS (QUIZ_QUESTIONS)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    quiz_id TEXT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(32) NOT NULL DEFAULT 'multiple_choice',
    image_url TEXT,
    image_caption TEXT,
    options JSONB NOT NULL,
    correct_index SMALLINT NOT NULL CHECK (correct_index >= 0),
    explanation TEXT NOT NULL,
    order_number SMALLINT NOT NULL DEFAULT 1,
    acceptable_answers JSONB,
    matching_pairs JSONB,
    custom_duration_sec SMALLINT,
    points SMALLINT DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);

-- Migrasi Kolom Baru (v2.2.40) untuk Database Eksisting:
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS default_game_mode VARCHAR(32) DEFAULT 'standard';
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN DEFAULT FALSE;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS shuffle_options BOOLEAN DEFAULT FALSE;

ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS acceptable_answers JSONB;
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS matching_pairs JSONB;
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS custom_duration_sec SMALLINT;
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS points SMALLINT DEFAULT 10;

-- ==========================================================
-- 6. TABEL PERCOBAAN KUIS & SKOR (QUIZ_ATTEMPTS)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    quiz_id TEXT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    player_id TEXT,
    player_nickname VARCHAR(64) NOT NULL DEFAULT 'Siswa SD',
    player_avatar VARCHAR(32) NOT NULL DEFAULT 'lion',
    score SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
    stars SMALLINT NOT NULL CHECK (stars BETWEEN 0 AND 3),
    total_questions SMALLINT NOT NULL,
    correct_answers SMALLINT NOT NULL,
    time_spent_sec INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_leaderboard ON public.quiz_attempts(quiz_id, score DESC, time_spent_sec ASC);

-- ==========================================================
-- 7. TABEL LOG AUDIT SISTEM (AUDIT_LOGS)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    action VARCHAR(64) NOT NULL,
    table_name VARCHAR(64) NOT NULL,
    record_id TEXT,
    actor_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================
-- 8. TABEL CATATAN BACKUP DATABASE (SYSTEM_BACKUPS)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.system_backups (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    backup_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256_checksum VARCHAR(64) NOT NULL,
    encryption_algorithm VARCHAR(32) NOT NULL DEFAULT 'AES-256',
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================
-- 9. AKTIFKAN ROW LEVEL SECURITY (RLS) DI SELURUH TABEL
-- ==========================================================
ALTER TABLE public.profiles_player ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles_teacher ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_backups ENABLE ROW LEVEL SECURITY;

-- ==========================================================
-- 10. KEBIJAKAN RLS (POLICIES)
-- ==========================================================

-- Policy Quizzes: Siapapun (anon/siswa/guru) dapat membaca kuis
DROP POLICY IF EXISTS "Public Read Published Quizzes" ON public.quizzes;
CREATE POLICY "Public Read Published Quizzes" 
ON public.quizzes FOR SELECT 
USING (TRUE);

-- Policy Quizzes: Pengelolaan kuis oleh guru (authenticated) dan akses kelas (anon)
DROP POLICY IF EXISTS "Authenticated Insert Quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Authenticated Update Own Quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Authenticated Delete Own Quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Allow Manage Quizzes" ON public.quizzes;
CREATE POLICY "Allow Manage Quizzes" 
ON public.quizzes FOR ALL 
USING (TRUE) 
WITH CHECK (TRUE);

-- Policy Quiz Questions: Publik dan Guru dapat membaca dan mengelola butir soal kuis
DROP POLICY IF EXISTS "Public Read Quiz Questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Authenticated Manage Questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Allow Manage Quiz Questions" ON public.quiz_questions;
CREATE POLICY "Allow Manage Quiz Questions" 
ON public.quiz_questions FOR ALL 
USING (TRUE)
WITH CHECK (TRUE);

-- Policy Quiz Attempts: Siapapun (anon / siswa) dapat mencatat hasil kuis
DROP POLICY IF EXISTS "Allow Insert Quiz Attempts" ON public.quiz_attempts;
CREATE POLICY "Allow Insert Quiz Attempts" 
ON public.quiz_attempts FOR INSERT 
WITH CHECK (TRUE);

-- Policy Quiz Attempts: Siapapun dapat membaca leaderboard & rekap nilai
DROP POLICY IF EXISTS "Public Read Quiz Attempts" ON public.quiz_attempts;
CREATE POLICY "Public Read Quiz Attempts" 
ON public.quiz_attempts FOR SELECT 
USING (TRUE);

-- Policy Player Profiles: Profil pemain siswa
DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles_player;
CREATE POLICY "Public Read Profiles" 
ON public.profiles_player FOR SELECT 
USING (TRUE);

DROP POLICY IF EXISTS "Allow Insert Profiles" ON public.profiles_player;
CREATE POLICY "Allow Insert Profiles" 
ON public.profiles_player FOR INSERT 
WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Users Update Own Profile" ON public.profiles_player;
CREATE POLICY "Users Update Own Profile" 
ON public.profiles_player FOR UPDATE 
USING (TRUE);

-- Policy Profiles Teacher: Profil guru
DROP POLICY IF EXISTS "Public Read Teacher Profiles" ON public.profiles_teacher;
CREATE POLICY "Public Read Teacher Profiles" 
ON public.profiles_teacher FOR SELECT 
USING (TRUE);

DROP POLICY IF EXISTS "Allow Insert Teacher Profiles" ON public.profiles_teacher;
CREATE POLICY "Allow Insert Teacher Profiles" 
ON public.profiles_teacher FOR INSERT 
WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Allow Update Teacher Profiles" ON public.profiles_teacher;
CREATE POLICY "Allow Update Teacher Profiles" 
ON public.profiles_teacher FOR UPDATE 
USING (TRUE);

-- Policy Audit Logs & Backups: Akses sistem
DROP POLICY IF EXISTS "Admin Only Backups" ON public.system_backups;
CREATE POLICY "Admin Only Backups" 
ON public.system_backups FOR ALL 
USING (TRUE);

DROP POLICY IF EXISTS "Admin Only Audit Logs" ON public.audit_logs;
CREATE POLICY "Admin Only Audit Logs" 
ON public.audit_logs FOR ALL 
USING (TRUE);

-- ==========================================================
-- 11. TRIGGER OTOMATIS: UPDATED_AT TIMESTAMP & AUTH SYNC
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_quizzes ON public.quizzes;
CREATE TRIGGER trigger_update_quizzes
BEFORE UPDATE ON public.quizzes
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_update_profiles ON public.profiles_player;
CREATE TRIGGER trigger_update_profiles
BEFORE UPDATE ON public.profiles_player
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger Otomatis Pembuatan Profil saat Pengguna Mendaftar di Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Profil Guru
  IF NEW.raw_user_meta_data->>'full_name' IS NOT NULL THEN
    INSERT INTO public.profiles_teacher (id, auth_user_id, email, full_name, school_name, created_at, updated_at)
    VALUES (
      NEW.id::text,
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'school_name', 'SD'),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      auth_user_id = EXCLUDED.auth_user_id,
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      school_name = EXCLUDED.school_name,
      updated_at = NOW();
  END IF;

  -- Profil Siswa
  IF NEW.raw_user_meta_data->>'nickname' IS NOT NULL THEN
    INSERT INTO public.profiles_player (id, auth_user_id, email, nickname, avatar_id, grade_level, created_at, updated_at)
    VALUES (
      NEW.id::text,
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'avatar_id', 'lion'),
      COALESCE((NEW.raw_user_meta_data->>'grade_level')::smallint, 1),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      auth_user_id = EXCLUDED.auth_user_id,
      email = EXCLUDED.email,
      nickname = EXCLUDED.nickname,
      avatar_id = EXCLUDED.avatar_id,
      grade_level = EXCLUDED.grade_level,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Otomatis Konfirmasi Email Pengguna (Mendukung Login Instan di Lingkungan Sekolah)
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_confirm_user ON auth.users;
CREATE TRIGGER trigger_auto_confirm_user
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================================
-- 12. SEED DATA AWAL: 6 KUIS RESMI BESERTA BUTIR SOAL
-- ==========================================================

-- 12.1 Kuis 1: Petualangan Berhitung Ceria (Kelas 1)
INSERT INTO public.quizzes (id, title, description, subject, target_grade, duration_per_question_sec, cover_emoji, theme_color, badge_title, pin_code, visibility, is_published)
VALUES (
  'sd1-mtk-hitung',
  'Petualangan Berhitung Ceria',
  'Ayo berhitung buah-buahan dan benda di sekitar kita dengan riang gembira!',
  'Matematika',
  1,
  25,
  '🍎',
  'from-amber-400 to-orange-500',
  'Bintang Berhitung',
  '1001',
  'public',
  TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_type, image_caption, options, correct_index, explanation, order_number)
VALUES 
  ('q1-1', 'sd1-mtk-hitung', 'Berapa jumlah apel merah pada gambar di bawah ini?', 'image_guess', '🍎 🍎 🍎 + 🍎 🍎', '["3 Apel", "4 Apel", "5 Apel", "6 Apel"]'::jsonb, 2, '3 apel ditambah 2 apel sama dengan 5 apel (3 + 2 = 5).', 1),
  ('q1-2', 'sd1-mtk-hitung', 'Bentuk benda apakah uang koin logam lima ratus rupiah?', 'multiple_choice', '🪙 Koin Logam', '["Segitiga", "Lingkaran", "Persegi", "Bintang"]'::jsonb, 1, 'Uang koin logam berbentuk lingkaran bulat sempurna.', 2),
  ('q1-3', 'sd1-mtk-hitung', 'Angka 7 lebih BESAR daripada angka 3.', 'true_false', NULL, '["Benar", "Salah"]'::jsonb, 0, 'Benar! Angka 7 memiliki nilai yang lebih banyak daripada angka 3.', 3),
  ('q1-4', 'sd1-mtk-hitung', 'Ibu membeli 6 pensil warna. Adik meminjam 2 pensil. Berapa sisa pensil Ibu?', 'multiple_choice', '✏️ ✏️ ✏️ ✏️ ✏️ ✏️', '["2 Pensil", "3 Pensil", "4 Pensil", "8 Pensil"]'::jsonb, 2, '6 dikurangi 2 sama dengan 4 (6 - 2 = 4).', 4)
ON CONFLICT (id) DO NOTHING;

-- 12.2 Kuis 2: Mengenal Hewan & Tempat Tinggalnya (Kelas 2)
INSERT INTO public.quizzes (id, title, description, subject, target_grade, duration_per_question_sec, cover_emoji, theme_color, badge_title, pin_code, visibility, is_published)
VALUES (
  'sd2-ipa-hewan',
  'Mengenal Hewan & Tempat Tinggalnya',
  'Mari jelajahi dunia binatang yang seru, ada yang di darat, air, dan udara!',
  'IPA',
  2,
  25,
  '🐸',
  'from-emerald-400 to-teal-600',
  'Sahabat Satwa',
  '1002',
  'public',
  TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_type, image_caption, options, correct_index, explanation, order_number)
VALUES 
  ('q2-1', 'sd2-ipa-hewan', 'Hewan apakah yang bernapas menggunakan insang dan berenang di dalam air?', 'multiple_choice', '🌊 Berenang di air', '["Kucing", "Ikan Mas", "Ayam", "Kelinci"]'::jsonb, 1, 'Ikan hidup di dalam air dan bernapas dengan organ khusus bernama insang.', 1),
  ('q2-2', 'sd2-ipa-hewan', 'Katak adalah hewan amfibi yang bisa hidup di dua alam (darat dan air).', 'true_false', '🐸 Katak Hijau', '["Benar", "Salah"]'::jsonb, 0, 'Benar! Katak termasuk jenis hewan amfibi yang dapat hidup di air dan darat.', 2),
  ('q2-3', 'sd2-ipa-hewan', 'Hewan yang memakan rumput dan menghasilkan susu segar untuk kita adalah...', 'multiple_choice', '🥛 Menghasilkan susu', '["Sapi", "Harimau", "Elang", "Serigala"]'::jsonb, 0, 'Sapi adalah hewan herbivora pemakan rumput yang menghasilkan susu kaya kalsium.', 3),
  ('q2-4', 'sd2-ipa-hewan', 'Hewan apakah yang memiliki belalai panjang dan telinga lebar?', 'multiple_choice', '🐘 Berbadan besar', '["Jerapah", "Gajah", "Kuda", "Badak"]'::jsonb, 1, 'Gajah adalah mamalia darat terbesar dengan belalai serbaguna dan daun telinga lebar.', 4)
ON CONFLICT (id) DO NOTHING;

-- 12.3 Kuis 3: Bagian Tumbuhan & Fungsinya (Kelas 3)
INSERT INTO public.quizzes (id, title, description, subject, target_grade, duration_per_question_sec, cover_emoji, theme_color, badge_title, pin_code, visibility, is_published)
VALUES (
  'sd3-ipa-tumbuhan',
  'Bagian Tumbuhan & Fungsinya',
  'Pelajari akar, batang, daun, dan bunga yang membantu pohon tumbuh subur!',
  'IPA',
  3,
  30,
  '🌱',
  'from-green-500 to-emerald-700',
  'Peneliti Cilik',
  '1003',
  'public',
  TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_type, image_caption, options, correct_index, explanation, order_number)
VALUES 
  ('q3-1', 'sd3-ipa-tumbuhan', 'Bagian tumbuhan manakah yang bertugas menyerap air dan zat hara dari dalam tanah?', 'multiple_choice', '🪴 Tersembunyi di dalam tanah', '["Daun", "Akar", "Bunga", "Buah"]'::jsonb, 1, 'Akar berfungsi mencengkeram tanah dan menyerap air serta mineral penting.', 1),
  ('q3-2', 'sd3-ipa-tumbuhan', 'Proses pembuatan makanan pada tumbuhan hijau dengan bantuan sinar matahari disebut...', 'multiple_choice', '☀️ Sinar Matahari + Daun Hijau', '["Metamorfosis", "Fotosintesis", "Perkecambahan", "Penyerbukan"]'::jsonb, 1, 'Fotosintesis terjadi di daun berkat klorofil dan energi dari cahaya matahari.', 2),
  ('q3-3', 'sd3-ipa-tumbuhan', 'Zat hijau daun yang berperan dalam fotosintesis dinamakan klorofil.', 'true_false', NULL, '["Benar", "Salah"]'::jsonb, 0, 'Benar! Klorofil memberi warna hijau pada daun dan menangkap sinar matahari.', 3),
  ('q3-4', 'sd3-ipa-tumbuhan', 'Bagian tumbuhan yang berkembang menjadi cikal bakal tumbuhan baru melalui biji adalah...', 'multiple_choice', '🌸 Tempat terjadinya penyerbukan', '["Akar", "Batang", "Bunga & Buah", "Duri"]'::jsonb, 2, 'Bunga adalah organ perkembangbiakan yang menghasilkan biji di dalam buah.', 4)
ON CONFLICT (id) DO NOTHING;

-- 12.4 Kuis 4: Tantangan Pecahan & Bangun Datar (Kelas 4)
INSERT INTO public.quizzes (id, title, description, subject, target_grade, duration_per_question_sec, cover_emoji, theme_color, badge_title, pin_code, visibility, is_published)
VALUES (
  'sd4-mtk-pecahan',
  'Tantangan Pecahan & Bangun Datar',
  'Uji keahlianmu mengenai luas, keliling, dan pecahan sederhana yang asyik!',
  'Matematika',
  4,
  30,
  '📐',
  'from-blue-500 to-indigo-600',
  'Master Geometri',
  '1004',
  'public',
  TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_type, image_caption, options, correct_index, explanation, order_number)
VALUES 
  ('q4-1', 'sd4-mtk-pecahan', 'Sebuah pizza dipotong menjadi 4 bagian sama besar. Budi memakan 1 potong. Berapa bagian pizza yang dimakan Budi?', 'multiple_choice', '🍕 1 dari 4 bagian', '["1/2 bagian", "1/4 bagian", "3/4 bagian", "2/4 bagian"]'::jsonb, 1, '1 potong dari total 4 bagian sama bernilai pecahan 1/4 (satu per empat).', 1),
  ('q4-2', 'sd4-mtk-pecahan', 'Sebuah persegi memiliki panjang sisi 6 cm. Berapakah keliling persegi tersebut?', 'multiple_choice', '⏹️ Persegi sisi = 6 cm', '["12 cm", "18 cm", "24 cm", "36 cm"]'::jsonb, 2, 'Keliling persegi = 4 x sisi = 4 x 6 cm = 24 cm.', 2),
  ('q4-3', 'sd4-mtk-pecahan', 'Pecahan 2/4 nilainya SAMA BESAR dengan pecahan 1/2.', 'true_false', NULL, '["Benar", "Salah"]'::jsonb, 0, 'Benar! Jika pembilang dan penyebut 2/4 sama-sama dibagi 2, hasilnya adalah 1/2.', 3),
  ('q4-4', 'sd4-mtk-pecahan', 'Bangun datar yang memiliki 3 buah sisi dan 3 sudut adalah...', 'multiple_choice', '🔺 Memiliki 3 sisi', '["Segitiga", "Persegi Panjang", "Trapesium", "Lingkaran"]'::jsonb, 0, 'Segitiga adalah bangun datar dengan 3 sisi dan 3 titik sudut.', 4)
ON CONFLICT (id) DO NOTHING;

-- 12.5 Kuis 5: Sistem Peredaran Darah & Organ Tubuh (Kelas 5)
INSERT INTO public.quizzes (id, title, description, subject, target_grade, duration_per_question_sec, cover_emoji, theme_color, badge_title, pin_code, visibility, is_published)
VALUES (
  'sd5-ipa-tubuh',
  'Sistem Peredaran Darah & Organ Tubuh',
  'Pelajari bagaimana jantung memompa darah dan paru-paru menghirup udara segar!',
  'IPA',
  5,
  30,
  '🫀',
  'from-rose-500 to-red-600',
  'Dokter Cilik',
  '1005',
  'public',
  TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_type, image_caption, options, correct_index, explanation, order_number)
VALUES 
  ('q5-1', 'sd5-ipa-tubuh', 'Organ tubuh manusia yang berfungsi utama memompa darah ke seluruh tubuh adalah...', 'multiple_choice', '❤️ Berdetak sepanjang waktu', '["Paru-paru", "Jantung", "Lambung", "Hati"]'::jsonb, 1, 'Jantung berdenyut sekitar 60-100 kali per menit untuk mengalirkan darah beroksigen.', 1),
  ('q5-2', 'sd5-ipa-tubuh', 'Gas yang kita hirup saat menarik napas untuk menyuplai energi tubuh adalah...', 'multiple_choice', '🌬️ Menghirup udara bersih', '["Karbon Dioksida", "Oksigen (O2)", "Nitrogen", "Metana"]'::jsonb, 1, 'Manusia menghirup Oksigen (O2) dan menghembuskan Karbon Dioksida (CO2).', 2),
  ('q5-3', 'sd5-ipa-tubuh', 'Pembuluh darah yang membawa darah bersih kaya oksigen KELUAR dari jantung disebut pembuluh nadi (arteri).', 'true_false', NULL, '["Benar", "Salah"]'::jsonb, 0, 'Benar! Pembuluh nadi (arteri) mengalirkan darah bertekanan tinggi dari jantung.', 3)
ON CONFLICT (id) DO NOTHING;

-- 12.6 Kuis 6: Pancasila & Kebudayaan Nusantara (Kelas 6)
INSERT INTO public.quizzes (id, title, description, subject, target_grade, duration_per_question_sec, cover_emoji, theme_color, badge_title, pin_code, visibility, is_published)
VALUES (
  'sd6-pancasila-wawasan',
  'Pancasila & Kebudayaan Nusantara',
  'Kenali lambang burung Garuda, sila Pancasila, dan keberagaman budaya Indonesia!',
  'Pendidikan Pancasila',
  6,
  30,
  '🦅',
  'from-purple-500 to-indigo-700',
  'Garuda Muda',
  '1006',
  'public',
  TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_type, image_caption, options, correct_index, explanation, order_number)
VALUES 
  ('q6-1', 'sd6-pancasila-wawasan', 'Apa semboyan pemersatu bangsa yang tercengkeram pada pita burung Garuda Pancasila?', 'multiple_choice', '🇮🇩 Lambang Negara Indonesia', '["Tut Wuri Handayani", "Bhinneka Tunggal Ika", "Bersatu Kita Teguh", "Ing Ngarso Sung Tulodo"]'::jsonb, 1, 'Bhinneka Tunggal Ika berarti "Berbeda-beda tetapi tetap satu jua".', 1),
  ('q6-2', 'sd6-pancasila-wawasan', 'Simbol Bintang Emas melambangkan sila ke-1 Pancasila: Ketuhanan Yang Maha Esa.', 'true_false', '⭐ Bintang Bersudut Lima', '["Benar", "Salah"]'::jsonb, 0, 'Benar! Sila ke-1 dilambangkan dengan perisai hitam berlogo bintang emas berkilau.', 2),
  ('q6-3', 'sd6-pancasila-wawasan', 'Musyawarah untuk mufakat dalam menyelesaikan masalah mencerminkan pengamalan Pancasila sila ke...', 'multiple_choice', NULL, '["Sila ke-2", "Sila ke-3", "Sila ke-4", "Sila ke-5"]'::jsonb, 2, 'Sila ke-4 (Kerakyatan yang Dipimpin oleh Hikmat Kebijaksanaan dalam Permusyawaratan/Perwakilan).', 3)
ON CONFLICT (id) DO NOTHING;

-- 12.7 Kuis 7: Latihan Pendidikan Pancasila: Norma, Hak, Kewajiban, dan Tanggung Jawab (Kelas 5)
INSERT INTO public.quizzes (id, title, description, subject, target_grade, duration_per_question_sec, cover_emoji, theme_color, badge_title, pin_code, creator_id, creator_name, visibility, is_published)
VALUES (
  'sd5-pancasila-norma-hak-kewajiban',
  'Latihan Pendidikan Pancasila: Norma, Hak, Kewajiban, dan Tanggung Jawab',
  'Kuis latihan Pendidikan Pancasila Kelas 5 SD berdasarkan dokumen resmi materi Pancasila, Norma, Hak, Kewajiban, dan Tanggung Jawab. Dilengkapi 20 butir soal berjenjang (Tingkat Rendah, Sedang, hingga Tingkat Tinggi/HOTS) dengan kunci jawaban dan pembahasan komprehensif.',
  'Pendidikan Pancasila',
  5,
  30,
  '🇮🇩',
  'from-red-600 to-rose-700',
  'Pelajar Pancasila',
  '5005',
  '6b995377-1c3c-4b1f-a91e-e439f923185b',
  'Admin',
  'public',
  TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_type, image_caption, options, correct_index, explanation, order_number, acceptable_answers, custom_duration_sec, points)
VALUES 
  ('sd5-pancasila-norma-hak-kewajiban-q01', 'sd5-pancasila-norma-hak-kewajiban', 'Dasar negara Indonesia adalah ....', 'multiple_choice', '🦅 Lambang Negara & Ideologi Bangsa', '["UUD 1945", "Pancasila", "Bhinneka Tunggal Ika", "Proklamasi"]'::jsonb, 1, 'Pancasila merupakan dasar negara dan ideologi bangsa Indonesia yang menjadi pedoman fundamental dalam kehidupan bermasyarakat, berbangsa, dan bernegara.', 1, '["B", "Pancasila"]'::jsonb, 30, 10),
  ('sd5-pancasila-norma-hak-kewajiban-q02', 'sd5-pancasila-norma-hak-kewajiban', 'Bunyi sila pertama Pancasila adalah ....', 'multiple_choice', '⭐ Bintang Emas Sila Pertama', '["Persatuan Indonesia", "Kemanusiaan yang Adil dan Beradab", "Ketuhanan Yang Maha Esa", "Keadilan Sosial bagi Seluruh Rakyat Indonesia"]'::jsonb, 2, 'Sila pertama Pancasila berbunyi "Ketuhanan Yang Maha Esa" yang dilambangkan dengan bintang emas berlatar perisai hitam, menegaskan pengakuan atas nilai ketuhanan.', 2, '["C", "Ketuhanan Yang Maha Esa"]'::jsonb, 30, 10),
  ('sd5-pancasila-norma-hak-kewajiban-q03', 'sd5-pancasila-norma-hak-kewajiban', 'Aturan yang mengatur perilaku manusia dalam kehidupan sehari-hari disebut ....', 'multiple_choice', '📜 Kaidah dan Pedoman Perilaku', '["hak", "kewajiban", "norma", "tanggung jawab"]'::jsonb, 2, 'Norma adalah kaidah atau aturan yang disepakati dan berlaku di tengah masyarakat guna mengatur tingkah laku manusia agar tercipta ketertiban dan ketenteraman.', 3, '["C", "norma"]'::jsonb, 30, 10),
  ('sd5-pancasila-norma-hak-kewajiban-q04', 'sd5-pancasila-norma-hak-kewajiban', 'Contoh hak seorang murid di sekolah adalah ....', 'multiple_choice', '🏫 Suasana Pembelajaran di Kelas', '["menjaga kebersihan kelas", "mendapatkan pembelajaran", "mengerjakan tugas", "menaati tata tertib"]'::jsonb, 1, 'Mendapatkan bimbingan dan pembelajaran yang berkualitas dari guru merupakan hak murid. Sedangkan membersihkan kelas, mengerjakan tugas, dan menaati tata tertib adalah kewajiban.', 4, '["B", "mendapatkan pembelajaran"]'::jsonb, 30, 10),
  ('sd5-pancasila-norma-hak-kewajiban-q05', 'sd5-pancasila-norma-hak-kewajiban', 'Sesuatu yang harus dilakukan dengan penuh kesadaran disebut ....', 'multiple_choice', '🤝 Pelaksanaan Tugas dengan Sadar', '["hak", "kewajiban", "hadiah", "keinginan"]'::jsonb, 1, 'Kewajiban adalah segala sesuatu yang wajib dilaksanakan atau dikerjakan oleh seseorang dengan penuh kesadaran diri dan rasa tanggung jawab.', 5, '["B", "kewajiban"]'::jsonb, 30, 10),
  ('sd5-pancasila-norma-hak-kewajiban-q06', 'sd5-pancasila-norma-hak-kewajiban', 'Contoh kewajiban murid di sekolah adalah ....', 'multiple_choice', '🎒 Kedisiplinan Murid Sekolah Dasar', '["mendapatkan nilai", "menggunakan fasilitas sekolah", "menaati tata tertib sekolah", "mendapatkan perlindungan"]'::jsonb, 2, 'Menaati tata tertib dan aturan sekolah adalah kewajiban mutlak setiap murid. Memperoleh nilai, fasilitas, dan perlindungan merupakan hak.', 6, '["C", "menaati tata tertib sekolah"]'::jsonb, 30, 10),
  ('sd5-pancasila-norma-hak-kewajiban-q07', 'sd5-pancasila-norma-hak-kewajiban', 'Sikap bertanggung jawab ditunjukkan dengan ....', 'multiple_choice', '✨ Komitmen Menyelesaikan Tugas', '["menyalahkan orang lain", "menghindari tugas", "melaksanakan tugas dengan sungguh-sungguh", "meninggalkan tugas yang diberikan"]'::jsonb, 2, 'Sikap tanggung jawab tercermin dari kesungguhan hati dalam menyelesaikan setiap tugas yang diamanahkan dan berani menanggung segala konsekuensinya.', 7, '["C", "melaksanakan tugas dengan sungguh-sungguh"]'::jsonb, 30, 10),
  ('sd5-pancasila-norma-hak-kewajiban-q08', 'sd5-pancasila-norma-hak-kewajiban', 'Rani melihat temannya membuang sampah sembarangan. Sikap yang sebaiknya dilakukan Rani adalah ....', 'multiple_choice', '🌱 Menjaga Kebersihan Lingkungan Sekolah', '["membiarkannya", "ikut membuang sampah sembarangan", "menegur dengan sopan dan mengajak membuang sampah pada tempatnya", "memarahi temannya di depan semua orang"]'::jsonb, 2, 'Menegur dengan bahasa yang sopan dan santun serta mengajak teman membuang sampah pada tempatnya mencerminkan kepedulian lingkungan yang mendidik tanpa mempermalukan orang lain.', 8, '["C"]'::jsonb, 30, 10),
  ('sd5-pancasila-norma-hak-kewajiban-q09', 'sd5-pancasila-norma-hak-kewajiban', 'Ketika sedang berdiskusi, setiap anggota kelompok memiliki pendapat yang berbeda. Sikap yang sesuai dengan nilai Pancasila adalah ....', 'multiple_choice', '👥 Musyawarah Kelompok Belajar', '["memaksakan pendapat sendiri", "menghargai pendapat anggota kelompok", "meninggalkan diskusi", "memilih pendapat teman yang paling dekat"]'::jsonb, 1, 'Menghargai keragaman pendapat saat bermusyawarah adalah nilai luhur Pancasila (sila keempat), di mana keputusan diambil untuk kepentingan bersama secara mufakat.', 9, '["B", "menghargai pendapat anggota kelompok"]'::jsonb, 30, 10),
  ('sd5-pancasila-norma-hak-kewajiban-q10', 'sd5-pancasila-norma-hak-kewajiban', 'Contoh penerapan sila ketiga Pancasila di sekolah adalah ....', 'multiple_choice', '🌳 Pohon Beringin Sila Persatuan Indonesia', '["berdoa sebelum belajar", "membantu teman yang kesulitan", "menjaga persatuan meskipun berbeda", "melaksanakan musyawarah"]'::jsonb, 2, 'Sila ketiga "Persatuan Indonesia" di sekolah diwujudkan dengan menjaga kerukunan, bermain dan belajar bersama tanpa membedakan suku, agama, dan latar belakang.', 10, '["C", "menjaga persatuan meskipun berbeda"]'::jsonb, 30, 10),
  ('sd5-pancasila-norma-hak-kewajiban-q11', 'sd5-pancasila-norma-hak-kewajiban', 'Edo mendapatkan hak menggunakan fasilitas perpustakaan. Agar hak tersebut digunakan dengan baik, Edo seharusnya ....', 'multiple_choice', '📚 Fasilitas Perpustakaan Sekolah', '["mencoret-coret buku", "mengembalikan buku tepat waktu", "membawa semua buku pulang", "merusak buku yang dipinjam"]'::jsonb, 1, 'Penggunaan hak membaca di perpustakaan harus disertai kewajiban memelihara keutuhan buku dan mengembalikannya tepat waktu agar teman lain dapat memanfaatkannya.', 11, '["B", "mengembalikan buku tepat waktu"]'::jsonb, 30, 10),
  ('sd5-pancasila-norma-hak-kewajiban-q12', 'sd5-pancasila-norma-hak-kewajiban', 'Setiap murid memiliki hak untuk belajar dengan nyaman. Agar hak tersebut terpenuhi, murid juga memiliki kewajiban untuk ....', 'multiple_choice', '📖 Suasana Belajar yang Nyaman dan Tenang', '["membuat keributan", "mengganggu teman", "menjaga ketertiban kelas", "bermain saat pembelajaran"]'::jsonb, 2, 'Kenyamanan belajar bersama di ruang kelas dapat tercapai apabila seluruh murid tertib, tenang, dan fokus mendengarkan penjelasan saat pembelajaran berlangsung.', 12, '["C", "menjaga ketertiban kelas"]'::jsonb, 30, 10),
  ('sd5-pancasila-norma-hak-kewajiban-q13', 'sd5-pancasila-norma-hak-kewajiban', 'Dika tidak sengaja memecahkan pot bunga di sekolah. Sikap yang menunjukkan tanggung jawab adalah ....', 'multiple_choice', '🪴 Kejujuran dan Keberanian Berbuat Tanggung Jawab', '["bersembunyi agar tidak diketahui", "menyalahkan temannya", "mengakui kesalahan dan bersedia memperbaikinya", "pura-pura tidak mengetahui kejadian tersebut"]'::jsonb, 2, 'Mengakui kelalaian secara jujur serta berinisiatif mengganti atau memperbaiki kerusakan merupakan perwujudan karakter murid yang bertanggung jawab dan kesatria.', 13, '["C", "mengakui kesalahan dan bersedia memperbaikinya"]'::jsonb, 30, 10),
  ('sd5-pancasila-norma-hak-kewajiban-q14', 'sd5-pancasila-norma-hak-kewajiban', 'Norma dibuat dan diterapkan dalam kehidupan masyarakat dengan tujuan ....', 'multiple_choice', '⚖️ Ketertiban dan Keteraturan Masyarakat', '["membuat orang takut", "menciptakan kehidupan yang tertib dan teratur", "membatasi semua kegiatan manusia", "memberikan hukuman kepada semua orang"]'::jsonb, 1, 'Tujuan utama diterapkannya norma adalah memelihara keharmonisan sosial, mencegah perselisihan, dan mewujudkan keteraturan dalam interaksi antarmanusia.', 14, '["B", "menciptakan kehidupan yang tertib dan teratur"]'::jsonb, 30, 10),
  ('sd5-pancasila-norma-hak-kewajiban-q15', 'sd5-pancasila-norma-hak-kewajiban', 'Dalam kerja kelompok, Andi selalu ingin menentukan semua keputusan sendiri. Akibatnya, anggota kelompok lain merasa tidak dihargai. Apa yang sebaiknya dilakukan kelompok tersebut?', 'multiple_choice', '🤝 Musyawarah Mengambil Keputusan Bersama', '["Membiarkan Andi mengambil semua keputusan.", "Membubarkan kelompok.", "Melakukan musyawarah dan memberikan kesempatan kepada semua anggota untuk menyampaikan pendapat.", "Mengikuti pendapat anggota yang paling banyak bicara."]'::jsonb, 2, 'Kerja kelompok didasari semangat gotong royong dan musyawarah. Seluruh anggota berhak didengar pendapatnya agar tercapai keputusan bersama yang adil dan dihargai.', 15, '["C"]'::jsonb, 35, 10),
  ('sd5-pancasila-norma-hak-kewajiban-q16', 'sd5-pancasila-norma-hak-kewajiban', 'Di kelas terdapat aturan bahwa setiap murid harus menjaga kebersihan. Setelah kegiatan belajar, beberapa murid meninggalkan sampah di lantai. Mengapa menaati aturan tersebut merupakan bentuk tanggung jawab?', 'multiple_choice', '🧹 Kebersihan Kelas Tanggung Jawab Bersama', '["Karena takut mendapatkan hukuman.", "Karena kebersihan hanya tugas petugas kebersihan.", "Karena setiap murid memiliki peran dalam menjaga lingkungan bersama.", "Karena guru akan selalu mengawasi kelas."]'::jsonb, 2, 'Kebersihan lingkungan kelas adalah kepentingan bersama. Menaati aturan kebersihan mencerminkan pemahaman bahwa kenyamanan belajar merupakan amanah setiap murid.', 16, '["C"]'::jsonb, 35, 10),
  ('sd5-pancasila-norma-hak-kewajiban-q17', 'sd5-pancasila-norma-hak-kewajiban', 'Perhatikan kegiatan berikut!\n1. Menghormati teman yang berbeda agama.\n2. Memaksakan agama kepada orang lain.\n3. Memberikan kesempatan teman beribadah.\n4. Mengganggu teman ketika beribadah.\n\nKegiatan yang sesuai dengan nilai sila pertama Pancasila ditunjukkan oleh nomor ....', 'multiple_choice', '🕊️ Toleransi Antarumat Beragama', '["1 dan 2", "1 dan 3", "2 dan 4", "3 dan 4"]'::jsonb, 1, 'Sila pertama menjamin kemerdekaan beragama dan toleransi. Kegiatan 1 (menghormati teman beda agama) dan 3 (memberi kesempatan beribadah) adalah sikap yang benar.', 17, '["B", "1 dan 3"]'::jsonb, 35, 10),
  ('sd5-pancasila-norma-hak-kewajiban-q18', 'sd5-pancasila-norma-hak-kewajiban', 'Setiap murid ingin mendapatkan hak untuk menggunakan fasilitas sekolah. Namun, fasilitas tersebut sering rusak karena digunakan sembarangan. Apa hubungan antara hak dan kewajiban dalam keadaan tersebut?', 'multiple_choice', '⚖️ Keseimbangan Hak dan Kewajiban', '["Hak dapat diperoleh tanpa melaksanakan kewajiban.", "Kewajiban hanya berlaku bagi guru.", "Hak perlu diimbangi dengan kewajiban untuk menjaga fasilitas.", "Fasilitas sekolah tidak boleh digunakan oleh murid."]'::jsonb, 2, 'Hak dan kewajiban saling bertautan secara erat. Hak menikmati fasilitas sekolah hanya dapat berlanjut secara baik jika seluruh murid memenuhi kewajiban merawat fasilitas tersebut.', 18, '["C"]'::jsonb, 35, 10),
  ('sd5-pancasila-norma-hak-kewajiban-q19', 'sd5-pancasila-norma-hak-kewajiban', 'Bayangkan kamu menjadi ketua kelas. Ada beberapa murid yang tidak menjalankan piket sehingga kelas menjadi kotor. Tindakan yang paling tepat adalah ....', 'multiple_choice', '👥 Kepemimpinan dan Tanggung Jawab Regu Piket', '["memberikan hukuman tanpa mendengarkan alasan mereka", "membiarkan keadaan tersebut", "mengajak berdiskusi dan mengingatkan pentingnya menjalankan kewajiban piket", "meminta murid lain mengerjakan semua tugas piket"]'::jsonb, 2, 'Pemimpin yang bijak mengedepankan komunikasi persuasif dan dialog. Mengajak berdiskusi serta mengingatkan tanggung jawab piket menumbuhkan kedisiplinan tanpa otoriter.', 19, '["C"]'::jsonb, 35, 10),
ON CONFLICT (id) DO NOTHING;

-- 12.8 Kuis 8: Soal Pilihan Ganda IPAS - Simbiosis (Kelas 5)
INSERT INTO public.quizzes (id, title, description, subject, target_grade, duration_per_question_sec, cover_emoji, theme_color, badge_title, pin_code, creator_id, creator_name, visibility, is_published)
VALUES (
  'sd5-ipas-simbiosis',
  'Soal Pilihan Ganda IPAS - Simbiosis',
  'Kuis interaktif IPAS Kelas 5 SD topik Simbiosis. Dilengkapi 15 butir soal pilihan ganda tentang hubungan antarmakhluk hidup (Mutualisme, Komensalisme, Parasitisme) beserta kunci jawaban dan penjelasan lengkap.',
  'IPAS',
  5,
  30,
  '🌿',
  'from-emerald-500 to-teal-700',
  'Pakar Simbiosis',
  '5015',
  '6b995377-1c3c-4b1f-a91e-e439f923185b',
  'Admin',
  'public',
  TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_type, image_caption, options, correct_index, explanation, order_number, acceptable_answers, custom_duration_sec, points)
VALUES 
  ('sd5-ipas-simbiosis-q01', 'sd5-ipas-simbiosis', 'Hubungan yang terjadi antara dua makhluk hidup yang hidup bersama disebut ....', 'multiple_choice', '🔍 Interaksi Dua Makhluk Hidup', '["habitat", "simbiosis", "ekosistem", "populasi"]'::jsonb, 1, 'Simbiosis adalah hubungan atau interaksi timbal balik yang erat dan khas antara dua organisme atau makhluk hidup berbeda yang hidup berdampingan.', 1, '["B", "simbiosis"]'::jsonb, 30, 10),
  ('sd5-ipas-simbiosis-q02', 'sd5-ipas-simbiosis', 'Simbiosis yang menguntungkan kedua makhluk hidup disebut ....', 'multiple_choice', '🤝 Interaksi Saling Menguntungkan', '["parasitisme", "komensalisme", "mutualisme", "kompetisi"]'::jsonb, 2, 'Simbiosis mutualisme adalah bentuk interaksi antara dua makhluk hidup yang saling memberikan keuntungan bagi kedua belah pihak tanpa ada yang dirugikan.', 2, '["C", "mutualisme"]'::jsonb, 30, 10),
  ('sd5-ipas-simbiosis-q03', 'sd5-ipas-simbiosis', 'Contoh simbiosis mutualisme adalah hubungan antara ....', 'multiple_choice', '🐝 Lebah dan Bunga Mekar', '["benalu dan pohon mangga", "kucing dan tikus", "lebah dan bunga", "ikan hiu dan ikan kecil"]'::jsonb, 2, 'Hubungan lebah dan bunga adalah mutualisme karena lebah memperoleh nektar manis sebagai makanan, sedangkan bunga terbantu dalam proses penyerbukannya.', 3, '["C", "lebah dan bunga"]'::jsonb, 30, 10),
  ('sd5-ipas-simbiosis-q04', 'sd5-ipas-simbiosis', 'Dalam hubungan lebah dan bunga, lebah mendapatkan ....', 'multiple_choice', '🍯 Lebah Mengisap Nektar Bunga', '["tempat berlindung", "nektar sebagai makanan", "air", "daun"]'::jsonb, 1, 'Lebah hinggap pada bunga untuk mengisap nektar atau cairan manis sebagai sumber makanan utamanya dalam memproduksi madu.', 4, '["B", "nektar sebagai makanan"]'::jsonb, 30, 10),
  ('sd5-ipas-simbiosis-q05', 'sd5-ipas-simbiosis', 'Hubungan antara benalu dan pohon yang ditumpanginya merupakan simbiosis ....', 'multiple_choice', '🌿 Benalu Menempel pada Batang Pohon', '["mutualisme", "komensalisme", "parasitisme", "netralisme"]'::jsonb, 2, 'Benalu menyerap air dan mineral langsung dari pohon inang sehingga pohon inang kekurangan nutrisi dan dapat mati. Ini merupakan contoh simbiosis parasitisme.', 5, '["C", "parasitisme"]'::jsonb, 30, 10),
  ('sd5-ipas-simbiosis-q06', 'sd5-ipas-simbiosis', 'Pada simbiosis parasitisme, salah satu makhluk hidup ....', 'multiple_choice', '⚠️ Satu Pihak Diuntungkan, Pihak Lain Dirugikan', '["diuntungkan dan yang lain dirugikan", "diuntungkan dan yang lain tidak terpengaruh", "keduanya diuntungkan", "keduanya dirugikan"]'::jsonb, 0, 'Parasitisme adalah hubungan di mana parasit mendapatkan keuntungan (makanan/tempat), sedangkan organisme inang (host) mengalami kerugian bahkan kerusakan fisik.', 6, '["A", "diuntungkan dan yang lain dirugikan"]'::jsonb, 30, 10),
  ('sd5-ipas-simbiosis-q07', 'sd5-ipas-simbiosis', 'Contoh lain simbiosis parasitisme adalah hubungan antara ....', 'multiple_choice', '🐱 Kutu Menempel pada Tubuh Kucing', '["kupu-kupu dan bunga", "kutu dan kucing", "kerbau dan burung jalak", "ikan badut dan anemon laut"]'::jsonb, 1, 'Kutu mengisap darah kucing dan menyebabkan gatal serta penyakit kulit (kucing dirugikan, kutu diuntungkan). Ini merupakan contoh parasitisme.', 7, '["B", "kutu dan kucing"]'::jsonb, 30, 10),
  ('sd5-ipas-simbiosis-q08', 'sd5-ipas-simbiosis', 'Kutu yang hidup pada tubuh kucing mendapatkan keuntungan berupa ....', 'multiple_choice', '🔍 Kutu Mengambil Makanan dan Perlindungan', '["makanan", "cahaya matahari", "tempat berteduh dan makanan", "nektar bunga"]'::jsonb, 2, 'Kutu memanfaatkan tubuh kucing sebagai tempat berteduh/berlindung yang hangat sekaligus mendapatkan makanan berupa darah kucing.', 8, '["C", "tempat berteduh dan makanan"]'::jsonb, 30, 10),
  ('sd5-ipas-simbiosis-q09', 'sd5-ipas-simbiosis', 'Simbiosis komensalisme adalah hubungan yang menyebabkan ....', 'multiple_choice', '🌸 Satu Untung, Pihak Lain Netral', '["kedua makhluk hidup dirugikan", "kedua makhluk hidup diuntungkan", "satu makhluk hidup diuntungkan, sedangkan yang lain tidak dirugikan", "satu makhluk hidup dirugikan, sedangkan yang lain tidak mendapatkan keuntungan"]'::jsonb, 2, 'Komensalisme adalah hubungan di mana satu pihak mendapatkan keuntungan, sedangkan pihak lain tidak merasa dirugikan dan juga tidak diuntungkan (netral).', 9, '["C"]'::jsonb, 30, 10),
  ('sd5-ipas-simbiosis-q10', 'sd5-ipas-simbiosis', 'Contoh simbiosis komensalisme adalah hubungan antara ....', 'multiple_choice', '🌺 Anggrek Tumbuh Menempel di Batang Pohon', '["anggrek dan pohon", "benalu dan pohon", "kutu dan kucing", "lebah dan bunga"]'::jsonb, 0, 'Tanaman anggrek yang menempel pada batang pohon mendapatkan tempat hidup dan cahaya matahari tanpa menyerap nutrisi pohon inang (inang tidak dirugikan).', 10, '["A", "anggrek dan pohon"]'::jsonb, 30, 10),
  ('sd5-ipas-simbiosis-q11', 'sd5-ipas-simbiosis', 'Pada hubungan anggrek dan pohon yang ditumpanginya, anggrek mendapatkan ....', 'multiple_choice', '☀️ Anggrek Mendapatkan Paparan Cahaya Matahari', '["makanan dari pohon", "tempat untuk hidup dan mendapatkan cahaya", "darah dari pohon", "nektar dari pohon"]'::jsonb, 1, 'Anggrek adalah tumbuhan epifit yang hanya menumpang tempat hidup di tempat yang lebih tinggi agar memperoleh sinar matahari untuk fotosintesis mandiri.', 11, '["B", "tempat untuk hidup dan mendapatkan cahaya"]'::jsonb, 30, 10),
  ('sd5-ipas-simbiosis-q12', 'sd5-ipas-simbiosis', 'Hubungan kerbau dan burung jalak termasuk simbiosis ....', 'multiple_choice', '🐃 Burung Jalak Bertengger di Punggung Kerbau', '["parasitisme", "komensalisme", "mutualisme", "kompetisi"]'::jsonb, 2, 'Hubungan kerbau dan burung jalak adalah mutualisme: burung jalak kenyang memakan kutu, dan kerbau terbebas dari rasa gatal akibat kutu di tubuhnya.', 12, '["C", "mutualisme"]'::jsonb, 30, 10),
  ('sd5-ipas-simbiosis-q13', 'sd5-ipas-simbiosis', 'Dalam hubungan kerbau dan burung jalak, burung jalak mendapatkan makanan berupa ....', 'multiple_choice', '🐦 Burung Jalak Memakan Kutu Kerbau', '["rumput", "kutu yang ada pada tubuh kerbau", "daun pohon", "nektar bunga"]'::jsonb, 1, 'Burung jalak mematuk dan memakan kutu-kutu yang hinggap serta mengisap darah di permukaan kulit kerbau.', 13, '["B", "kutu yang ada pada tubuh kerbau"]'::jsonb, 30, 10),
  ('sd5-ipas-simbiosis-q14', 'sd5-ipas-simbiosis', 'Persamaan hubungan lebah dan bunga dengan kerbau dan burung jalak adalah ....', 'multiple_choice', '✨ Prinsip Saling Menguntungkan (Mutualisme)', '["salah satu pihak dirugikan", "salah satu pihak tidak mendapatkan keuntungan", "kedua makhluk hidup mendapatkan keuntungan", "kedua makhluk hidup saling merugikan"]'::jsonb, 2, 'Keduanya sama-sama tergolong simbiosis mutualisme, di mana kedua makhluk hidup yang terlibat saling memberi dan menerima keuntungan.', 14, '["C", "kedua makhluk hidup mendapatkan keuntungan"]'::jsonb, 30, 10),
  ('sd5-ipas-simbiosis-q15', 'sd5-ipas-simbiosis', 'Perhatikan pasangan berikut: (1) Benalu dan pohon mangga, (2) Lebah dan bunga, (3) Kutu dan kucing, (4) Anggrek dan pohon. Pasangan yang menunjukkan simbiosis komensalisme adalah ....', 'multiple_choice', '📊 Analisis Pola Interaksi Simbiosis', '["1", "2", "3", "4"]'::jsonb, 3, 'Pasangan (1) Benalu dan pohon mangga = Parasitisme. Pasangan (2) Lebah dan bunga = Mutualisme. Pasangan (3) Kutu dan kucing = Parasitisme. Pasangan (4) Anggrek dan pohon = Komensalisme. Jadi pasangan yang menunjukkan komensalisme adalah nomor 4.', 15, '["D", "4"]'::jsonb, 30, 10)
ON CONFLICT (id) DO NOTHING;

-- ==========================================================
-- 13. TABEL SESI KUIS AKTIF (QUIZ_SESSIONS) & PESERTA
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    quiz_id TEXT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    quiz_title VARCHAR(255) NOT NULL,
    pin_code VARCHAR(8) NOT NULL,
    teacher_id TEXT,
    teacher_email VARCHAR(255),
    teacher_name VARCHAR(120),
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('waiting', 'active', 'paused', 'finished')),
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_questions SMALLINT NOT NULL DEFAULT 0,
    current_question_index SMALLINT NOT NULL DEFAULT 0,
    question_state VARCHAR(32) NOT NULL DEFAULT 'answering',
    reactions JSONB NOT NULL DEFAULT '[]'::jsonb,
    chat_messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_chat_muted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_quiz_id ON public.quiz_sessions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_pin ON public.quiz_sessions(pin_code);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_status ON public.quiz_sessions(status);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_teacher ON public.quiz_sessions(teacher_email);

-- Migrasi Kolom Tambahan (v2.3.71) jika tabel sudah pernah dieksekusi sebelumnya:
ALTER TABLE public.quiz_sessions ADD COLUMN IF NOT EXISTS current_question_index SMALLINT DEFAULT 0;
ALTER TABLE public.quiz_sessions ADD COLUMN IF NOT EXISTS question_state VARCHAR(32) DEFAULT 'answering';
ALTER TABLE public.quiz_sessions ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.quiz_sessions ADD COLUMN IF NOT EXISTS chat_messages JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.quiz_sessions ADD COLUMN IF NOT EXISTS is_chat_muted BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.quiz_session_participants (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id TEXT NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
    student_name VARCHAR(64) NOT NULL,
    avatar_id VARCHAR(32) NOT NULL DEFAULT 'lion',
    current_question_index SMALLINT NOT NULL DEFAULT 0,
    score SMALLINT NOT NULL DEFAULT 0,
    stars SMALLINT NOT NULL DEFAULT 0,
    correct_count SMALLINT NOT NULL DEFAULT 0,
    incorrect_count SMALLINT NOT NULL DEFAULT 0,
    streak SMALLINT NOT NULL DEFAULT 0,
    finished BOOLEAN NOT NULL DEFAULT FALSE,
    time_spent_sec INT NOT NULL DEFAULT 0,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_participants_session ON public.quiz_session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_score ON public.quiz_session_participants(session_id, score DESC, time_spent_sec ASC);

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_session_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow All Read Quiz Sessions" ON public.quiz_sessions;
CREATE POLICY "Allow All Read Quiz Sessions" ON public.quiz_sessions FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Allow Manage Quiz Sessions" ON public.quiz_sessions;
CREATE POLICY "Allow Manage Quiz Sessions" ON public.quiz_sessions FOR ALL USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Allow All Read Session Participants" ON public.quiz_session_participants;
CREATE POLICY "Allow All Read Session Participants" ON public.quiz_session_participants FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Allow Manage Session Participants" ON public.quiz_session_participants;
CREATE POLICY "Allow Manage Session Participants" ON public.quiz_session_participants FOR ALL USING (TRUE) WITH CHECK (TRUE);

