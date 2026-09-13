-- ==========================================================
-- SKRIP MIGRASI SUPABASE: TAB SWITCH TRACKING & BACKUP LOGS
-- Versi: 2.3.81
-- ==========================================================

-- 1. Tambah kolom tab_switch_count pada tabel quiz_session_participants
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'quiz_session_participants' 
          AND column_name = 'tab_switch_count'
    ) THEN
        ALTER TABLE public.quiz_session_participants ADD COLUMN tab_switch_count INT DEFAULT 0;
    END IF;
END $$;

-- 2. Tambah indeks untuk performa query anti-curang
CREATE INDEX IF NOT EXISTS idx_session_participants_tab_switch 
ON public.quiz_session_participants(session_id, tab_switch_count);

-- 3. Pastikan kolom last_heartbeat pada quiz_sessions memiliki default NOW()
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'quiz_sessions' 
          AND column_name = 'last_heartbeat'
    ) THEN
        ALTER TABLE public.quiz_sessions ADD COLUMN last_heartbeat TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_heartbeat 
ON public.quiz_sessions(status, last_heartbeat);
