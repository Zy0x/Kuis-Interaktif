-- ==========================================================
-- SKRIP MIGRASI SUPABASE: CONSTRAINT UNIK PESERTA & REALTIME v2.3.80
-- ==========================================================

-- 1. Bersihkan rekaman duplikat peserta jika pernah terjadi sebelumnya
DELETE FROM public.quiz_session_participants a
USING public.quiz_session_participants b
WHERE a.ctid < b.ctid 
  AND a.session_id = b.session_id 
  AND LOWER(TRIM(a.student_name)) = LOWER(TRIM(b.student_name));

-- 2. Tambahkan constraint unik (session_id, student_name)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_session_participant'
    ) THEN
        ALTER TABLE public.quiz_session_participants 
        ADD CONSTRAINT unique_session_participant UNIQUE (session_id, student_name);
    END IF;
END $$;

-- 3. Optimasi Realtime Replica Identity agar event UPDATE mengirimkan data lengkap
ALTER TABLE public.quiz_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.quiz_session_participants REPLICA IDENTITY FULL;

-- 4. Verifikasi Realtime Publication
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_sessions;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_session_participants;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;
