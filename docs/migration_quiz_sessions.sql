-- ==========================================================
-- SKRIP MIGRASI SUPABASE: TABEL SESI KELAS LIVE & KEAMANAN PIN
-- Versi: 2.3.79
-- ==========================================================

-- 1. Pastikan kolom pin_code di tabel quizzes bersifat unik (Anti-Bentrok)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_quizzes_pin_code'
    ) THEN
        ALTER TABLE public.quizzes ADD CONSTRAINT unique_quizzes_pin_code UNIQUE (pin_code);
    END IF;
END $$;

-- 2. TABEL SESI KUIS LIVE (QUIZ_SESSIONS)
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    quiz_title VARCHAR(255) NOT NULL,
    quiz_cover VARCHAR(32) DEFAULT '⭐',
    subject VARCHAR(64) DEFAULT 'Umum',
    grade VARCHAR(32) DEFAULT 'Semua Kelas',
    pin_code VARCHAR(16) NOT NULL,
    teacher_id TEXT,
    teacher_email VARCHAR(255),
    teacher_name VARCHAR(120),
    status VARCHAR(32) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'paused', 'finished')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{}'::jsonb,
    total_questions SMALLINT NOT NULL DEFAULT 0,
    current_question_index SMALLINT NOT NULL DEFAULT 0,
    question_state VARCHAR(32) DEFAULT 'answering',
    reactions JSONB DEFAULT '[]'::jsonb,
    chat_messages JSONB DEFAULT '[]'::jsonb,
    is_chat_muted BOOLEAN DEFAULT FALSE,
    last_heartbeat TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks Performa Sesi Live
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_pin_code ON public.quiz_sessions(pin_code);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_status ON public.quiz_sessions(status);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_quiz_id ON public.quiz_sessions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_teacher ON public.quiz_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_created ON public.quiz_sessions(created_at DESC);

-- 3. TABEL PESERTA SESI KELAS LIVE (QUIZ_SESSION_PARTICIPANTS)
CREATE TABLE IF NOT EXISTS public.quiz_session_participants (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id TEXT NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
    student_name VARCHAR(64) NOT NULL,
    avatar_id VARCHAR(32) NOT NULL DEFAULT 'lion',
    current_question_index SMALLINT DEFAULT 0,
    score INT DEFAULT 0,
    stars SMALLINT DEFAULT 0,
    correct_count SMALLINT DEFAULT 0,
    incorrect_count SMALLINT DEFAULT 0,
    streak SMALLINT DEFAULT 0,
    finished BOOLEAN DEFAULT FALSE,
    time_spent_sec INT DEFAULT 0,
    answers JSONB DEFAULT '{}'::jsonb,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_participants_session ON public.quiz_session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_score ON public.quiz_session_participants(session_id, score DESC);

-- 4. AKTIFKAN ROW LEVEL SECURITY (RLS)
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_session_participants ENABLE ROW LEVEL SECURITY;

-- 5. KEBIJAKAN AKSES (POLICIES)
DROP POLICY IF EXISTS "Public Read Active Quiz Sessions" ON public.quiz_sessions;
CREATE POLICY "Public Read Active Quiz Sessions" 
ON public.quiz_sessions FOR SELECT 
USING (TRUE);

DROP POLICY IF EXISTS "Allow Manage Quiz Sessions" ON public.quiz_sessions;
CREATE POLICY "Allow Manage Quiz Sessions" 
ON public.quiz_sessions FOR ALL 
USING (TRUE) 
WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Public Read Session Participants" ON public.quiz_session_participants;
CREATE POLICY "Public Read Session Participants" 
ON public.quiz_session_participants FOR SELECT 
USING (TRUE);

DROP POLICY IF EXISTS "Allow Manage Session Participants" ON public.quiz_session_participants;
CREATE POLICY "Allow Manage Session Participants" 
ON public.quiz_session_participants FOR ALL 
USING (TRUE) 
WITH CHECK (TRUE);

-- 6. AKTIFKAN REALTIME PUBLICATION UNTUK SESI LIVE
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_sessions;
    EXCEPTION WHEN duplicate_object THEN
        -- table already in publication
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_session_participants;
    EXCEPTION WHEN duplicate_object THEN
        -- table already in publication
    END;
END $$;
