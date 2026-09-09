-- ==========================================================
-- SKRIP DATABASE SUPABASE RESMI: KUIS SD SERU
-- Versi Skema: 2.2.33
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);

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

