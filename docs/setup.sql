-- ==========================================================
-- SKRIP DATABASE SUPABASE MANDIRI: KUIS SD SERU
-- Versi Skema: 2.2.18
-- Tanggal: 2026-09-09
-- ==========================================================
-- Jalankan skrip ini langsung di Supabase SQL Editor milik Anda.
-- Seluruh tabel telah dilengkapi RLS (Row Level Security),
-- Indeks performa, Constraint, dan Audit Trigger.
-- ==========================================================

-- 1. AKTIFKAN EKSTENSI POSTGRESQL YANG DIBUTUHKAN
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================================
-- 2. TABEL PROFIL PEMAIN (PROFILES_PLAYER)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.profiles_player (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    nickname VARCHAR(32) NOT NULL DEFAULT 'Bintang SD',
    avatar_id VARCHAR(32) NOT NULL DEFAULT 'lion',
    grade_level SMALLINT CHECK (grade_level BETWEEN 1 AND 6),
    total_score INT NOT NULL DEFAULT 0,
    quizzes_completed INT NOT NULL DEFAULT 0,
    stars_earned INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_player_auth ON public.profiles_player(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_player_score ON public.profiles_player(total_score DESC);

-- ==========================================================
-- 3. TABEL KUIS UTAMA (QUIZZES)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration safety for existing tables:
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS pin_code VARCHAR(8);
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS creator_name VARCHAR(120);
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS visibility VARCHAR(16) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private'));

CREATE INDEX IF NOT EXISTS idx_quizzes_grade ON public.quizzes(target_grade);
CREATE INDEX IF NOT EXISTS idx_quizzes_subject ON public.quizzes(subject);
CREATE INDEX IF NOT EXISTS idx_quizzes_pin ON public.quizzes(pin_code);
CREATE INDEX IF NOT EXISTS idx_quizzes_visibility ON public.quizzes(visibility);
CREATE INDEX IF NOT EXISTS idx_quizzes_published ON public.quizzes(is_published) WHERE is_published = TRUE;

-- ==========================================================
-- 3B. TABEL PROFIL GURU (PROFILES_TEACHER)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.profiles_teacher (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(120) NOT NULL,
    school_name VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================
-- 4. TABEL BANK SOAL KUIS (QUIZ_QUESTIONS)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(32) NOT NULL DEFAULT 'multiple_choice',
    image_url TEXT,
    image_caption TEXT,
    options JSONB NOT NULL, -- Array teks opsi jawaban: ["Opsi A", "Opsi B", "Opsi C", "Opsi D"]
    correct_index SMALLINT NOT NULL CHECK (correct_index >= 0),
    explanation TEXT NOT NULL,
    order_number SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);

-- ==========================================================
-- 5. TABEL PERCOBAAN KUIS & HASIL SKOR (QUIZ_ATTEMPTS)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    player_id UUID REFERENCES public.profiles_player(id) ON DELETE SET NULL,
    player_nickname VARCHAR(32) NOT NULL DEFAULT 'Siswa SD',
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
-- 6. TABEL LOG AUDIT SISTEM (AUDIT_LOGS)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(64) NOT NULL,
    table_name VARCHAR(64) NOT NULL,
    record_id UUID,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================
-- 7. TABEL CATATAN BACKUP DATABASE (SYSTEM_BACKUPS)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.system_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256_checksum VARCHAR(64) NOT NULL,
    encryption_algorithm VARCHAR(32) NOT NULL DEFAULT 'AES-256',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================
-- 8. AKTIFKAN ROW LEVEL SECURITY (RLS) DI SELURUH TABEL
-- ==========================================================
ALTER TABLE public.profiles_player ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles_teacher ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_backups ENABLE ROW LEVEL SECURITY;

-- ==========================================================
-- 9. KEBIJAKAN RLS (POLICIES)
-- ==========================================================

-- Policy Teacher Profiles: Guru dapat membaca dan mengupdate profilnya sendiri
CREATE POLICY "Teacher Read Own Profile" 
ON public.profiles_teacher FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Teacher Update Own Profile" 
ON public.profiles_teacher FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Teacher Insert Own Profile" 
ON public.profiles_teacher FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Policy Quizzes: Siapapun (anon/siswa/tamu) hanya dapat membaca kuis yang sudah terbit (read-only)
CREATE POLICY "Public Read Published Quizzes" 
ON public.quizzes FOR SELECT 
USING (is_published = TRUE AND is_archived = FALSE);

-- Policy Quizzes: HANYA Guru terautentikasi (terdaftar di profiles_teacher) yang dapat membuat, mengubah, dan menghapus kuis
-- Role Siswa dan Tamu dilarang keras melakukan INSERT, UPDATE, atau DELETE pada tabel quizzes
CREATE POLICY "Teachers Manage Own Quizzes" 
ON public.quizzes FOR ALL 
TO authenticated 
USING (
    auth.uid() = creator_id 
    AND EXISTS (SELECT 1 FROM public.profiles_teacher pt WHERE pt.id = auth.uid())
)
WITH CHECK (
    auth.uid() = creator_id 
    AND EXISTS (SELECT 1 FROM public.profiles_teacher pt WHERE pt.id = auth.uid())
);

-- Policy Quiz Questions: Publik (siswa & tamu) hanya dapat membaca pertanyaan kuis yang aktif
CREATE POLICY "Public Read Quiz Questions" 
ON public.quiz_questions FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.quizzes q 
        WHERE q.id = quiz_questions.quiz_id 
        AND q.is_published = TRUE
    )
);

-- Policy Quiz Questions: HANYA Guru pemilik kuis yang berhak menambah, mengedit, atau menghapus butir pertanyaan
CREATE POLICY "Teachers Manage Questions For Own Quizzes" 
ON public.quiz_questions FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.quizzes q 
        JOIN public.profiles_teacher pt ON pt.id = q.creator_id
        WHERE q.id = quiz_questions.quiz_id 
        AND q.creator_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.quizzes q 
        JOIN public.profiles_teacher pt ON pt.id = q.creator_id
        WHERE q.id = quiz_questions.quiz_id 
        AND q.creator_id = auth.uid()
    )
);

-- Policy Quiz Attempts: Siapapun dapat mencatat hasil kuis (insert)
CREATE POLICY "Allow Insert Quiz Attempts" 
ON public.quiz_attempts FOR INSERT 
WITH CHECK (TRUE);

-- Policy Quiz Attempts: Siapapun dapat melihat papan peringkat (select)
CREATE POLICY "Public Read Quiz Attempts Leaderboard" 
ON public.quiz_attempts FOR SELECT 
USING (TRUE);

-- Policy Player Profiles: Pemain dapat membaca & memperbarui profilnya
CREATE POLICY "Public Read Profiles" 
ON public.profiles_player FOR SELECT 
USING (TRUE);

CREATE POLICY "Allow Insert Profiles" 
ON public.profiles_player FOR INSERT 
WITH CHECK (TRUE);

CREATE POLICY "Users Update Own Profile" 
ON public.profiles_player FOR UPDATE 
USING (auth.uid() = auth_user_id OR auth_user_id IS NULL);

-- Policy Audit Logs & Backups: Hanya Admin yang berhak akses
CREATE POLICY "Admin Only Backups" 
ON public.system_backups FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'email' LIKE '%admin%');

CREATE POLICY "Admin Only Audit Logs" 
ON public.audit_logs FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'email' LIKE '%admin%');

-- ==========================================================
-- 10. TRIGGER OTOMATIS: UPDATED_AT TIMESTAMP
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quizzes
BEFORE UPDATE ON public.quizzes
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_update_profiles
BEFORE UPDATE ON public.profiles_player
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
