import React, { useState, useMemo, useEffect } from 'react';
import type { Quiz, QuizSession, QuizSessionSettings } from '../../types/quiz';
import { AVATAR_LIST } from '../../data/seedQuizzes';
import { DataManager } from '../../lib/supabaseClient';
import { ThemeToggle } from '../common/ThemeToggle';
import { QuizCoverDisplay } from '../common/QuizCoverDisplay';
import { StudentWaitingRoom } from './StudentWaitingRoom';
import { 
  Play, 
  Sparkles, 
  Clock, 
  HelpCircle, 
  ArrowLeft, 
  User,
  Users,
  Lock,
  Eye,
  Shuffle,
  AlertCircle,
  Gamepad2,
  CheckCircle2,
  Info,
  Calendar,
  GraduationCap,
  FileText
} from 'lucide-react';

export interface StudentLobbyProps {
  quiz: Quiz;
  sessionSettings?: QuizSessionSettings;
  activeSession?: QuizSession | null;
  onStartQuiz: () => void;
  onBackToHome: () => void;
  playClick: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const StudentLobby: React.FC<StudentLobbyProps> = ({
  quiz,
  sessionSettings,
  activeSession,
  onStartQuiz,
  onBackToHome,
  playClick,
  isDark = false,
  onToggleTheme = () => {},
}) => {
  const profile = DataManager.getPlayerProfile();
  const isCustom = Boolean(
    profile.nickname &&
    profile.nickname.trim().toLowerCase() !== 'saya' &&
    profile.nickname.trim().toLowerCase() !== 'bintang sd' &&
    profile.nickname.trim().toLowerCase() !== 'bintang pintar'
  );
  const [nickname, setNickname] = useState(isCustom ? profile.nickname : '');
  const [rollNumber, setRollNumber] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatarId || 'lion');
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
  const [savedFinalName, setSavedFinalName] = useState('');

  const formatIndonesianDeadline = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return (
        d.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) + ' WIB'
      );
    } catch {
      return isoString;
    }
  };

  // Real-time live session & settings state
  const [liveSession, setLiveSession] = useState<QuizSession | null>(() => {
    if (activeSession) return activeSession;
    if (quiz.pinCode) return DataManager.getActiveSessionByPin(quiz.pinCode);
    return DataManager.getActiveSessionByQuizId(quiz.id);
  });
  const [liveSettings, setLiveSettings] = useState<QuizSessionSettings | undefined>(sessionSettings);

  useEffect(() => {
    if (activeSession) {
      setLiveSession(activeSession);
    } else {
      const found = (quiz.pinCode ? DataManager.getActiveSessionByPin(quiz.pinCode) : null) || DataManager.getActiveSessionByQuizId(quiz.id);
      if (found) setLiveSession(found);
    }
  }, [activeSession, quiz.id, quiz.pinCode]);

  useEffect(() => {
    if (sessionSettings) setLiveSettings(sessionSettings);
  }, [sessionSettings]);

  useEffect(() => {
    const handleSync = (session: QuizSession) => {
      if (
        (quiz.pinCode && session.pinCode === quiz.pinCode) ||
        session.quizId === quiz.id ||
        (liveSession && session.id === liveSession.id)
      ) {
        setLiveSession(session);
        setLiveSettings(session.settings);
      }
    };

    let channel: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel('kuis_realtime_session_sync');
        channel.onmessage = (event) => {
          if (event.data?.type === 'SESSION_UPDATED' && event.data.session) {
            handleSync(event.data.session);
          }
        };
      }
    } catch {}

    const handleCustom = (e: Event) => {
      const evt = e as CustomEvent;
      if (evt.detail?.session) {
        handleSync(evt.detail.session);
      }
    };
    window.addEventListener('kuis_session_updated', handleCustom);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('kuis_session_updated', handleCustom);
    };
  }, [quiz.id, quiz.pinCode, liveSession]);

  // Konfigurasi aktif yang ditetapkan oleh Guru (Real-Time)
  const effectiveSettings: QuizSessionSettings = useMemo(() => {
    const defaults: QuizSessionSettings = {
      executionMode: 'self_paced',
      mode: quiz.defaultGameMode || 'standard',
      durationPerQuestionSec: quiz.durationPerQuestionSec || 30,
      shuffleQuestions: quiz.shuffleQuestions ?? true,
      shuffleOptions: quiz.shuffleOptions ?? true,
      presentationTarget: 'student-lobby',
      showAnswersMode: 'immediate',
      showExplanationMode: 'immediate',
      showLeaderboardToStudents: true,
      maxAttempts: 0,
      tabSwitchDetection: false,
    };

    return {
      ...defaults,
      ...(quiz.defaultSettings || {}),
      ...(sessionSettings || {}),
      ...(liveSettings || {}),
      ...(liveSession?.settings || {}),
    };
  }, [liveSettings, liveSession?.settings, sessionSettings, quiz.defaultSettings, quiz.defaultGameMode, quiz.durationPerQuestionSec, quiz.shuffleQuestions, quiz.shuffleOptions]);

  const effectiveMode = effectiveSettings.mode || quiz.defaultGameMode || 'standard';
  const effectiveDuration = effectiveSettings.durationPerQuestionSec || quiz.durationPerQuestionSec || 30;

  // Nama mode permainan ramah anak
  const modeLabel = useMemo(() => {
    if (effectiveSettings.showAnswersMode === 'exam_strict') {
      return {
        title: 'Mode Ujian Resmi',
        icon: '🎯',
        desc: 'Jawaban tersimpan aman tanpa bocoran kunci',
      };
    }
    if (effectiveMode === 'survival_3hearts') {
      return {
        title: 'Tantangan 3 Hati',
        icon: '❤️',
        desc: 'Mode bertahan 3 kesempatan',
      };
    }
    if (effectiveMode === 'untimed') {
      return {
        title: 'Mode Santai',
        icon: '🧘',
        desc: 'Tanpa batas waktu per soal',
      };
    }
    return {
      title: 'Mode Standar',
      icon: '⏱️',
      desc: 'Timer per soal aktif',
    };
  }, [effectiveMode, effectiveSettings.showAnswersMode]);

  // Cek apakah siswa sudah pernah mengerjakan sesi ini ketika batas pengerjaan = 1x
  const isAttemptLimitReached = useMemo(() => {
    if (effectiveSettings.maxAttempts !== 1) return false;
    const cleanNick = nickname.trim().toLowerCase();
    if (!cleanNick) return false;
    if (!liveSession?.participants) return false;

    return liveSession.participants.some(
      (p) => p.name.trim().toLowerCase() === cleanNick && p.finished
    );
  }, [effectiveSettings.maxAttempts, nickname, liveSession?.participants]);

  // Cek apakah mode dipandu guru dan sesi masih berstatus waiting
  const isTeacherLedWaiting = effectiveSettings.executionMode === 'teacher_led' && (!liveSession || liveSession.status === 'waiting');

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAttemptLimitReached) return;
    playClick();
    const cleanNick = nickname.trim() || (isCustom ? profile.nickname : 'Siswa Pintar');
    const finalName = rollNumber.trim() ? `${rollNumber.trim()}. ${cleanNick}` : cleanNick;
    setSavedFinalName(finalName);
    DataManager.savePlayerProfile({
      nickname: finalName,
      avatarId: selectedAvatar,
    });

    if (liveSession) {
      try {
        await DataManager.addOrUpdateSessionParticipant(liveSession.id, {
          name: finalName,
          avatarId: selectedAvatar,
        });
      } catch (err) {
        console.warn('Failed to add participant in lobby:', err);
      }
    }

    if (isTeacherLedWaiting) {
      setIsInWaitingRoom(true);
    } else {
      onStartQuiz();
    }
  };

  const pinDisplay = activeSession?.pinCode || quiz.pinCode || '1001';
  const teacherName = activeSession?.teacherName || quiz.creatorName || 'Bapak/Ibu Guru';

  if (isInWaitingRoom && liveSession) {
    return (
      <StudentWaitingRoom
        quiz={quiz}
        session={liveSession}
        studentName={savedFinalName || nickname || 'Siswa Pintar'}
        avatarId={selectedAvatar}
        onStartQuiz={onStartQuiz}
        onBackToHome={() => setIsInWaitingRoom(false)}
        playClick={playClick}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between select-none">
      {/* Top Header */}
      <header className="w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-8 lg:px-12 pt-[max(env(safe-area-inset-top),0.625rem)] pb-2.5 sm:pb-3 sticky top-0 z-20 shadow-sm">
        <div className="w-full max-w-[2000px] mx-auto flex items-center justify-between gap-2">
          <button
            onClick={() => {
              playClick();
              onBackToHome();
            }}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 px-2.5 sm:px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Katalog Kuis</span>
            <span className="xs:hidden">Katalog</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
            <div className="hidden xs:flex items-center gap-1.5">
              <span className="text-lg sm:text-xl">⭐</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Ruang Kuis</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Lobby Room */}
      <main className="flex-1 max-w-xl 2xl:max-w-2xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center my-auto">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-pop space-y-6 animate-fade-in">
          
          {/* ======================================================== */}
          {/* 1. INFO KUIS (Sesuai Konfigurasi yang Ditetapkan Guru)   */}
          {/* ======================================================== */}
          <div className="text-center space-y-2">
            {/* PIN Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>PIN Sesi: <strong className="font-mono text-sm tracking-wider text-blue-900 dark:text-blue-100">{pinDisplay}</strong></span>
            </div>

            {/* Quiz Cover */}
            <QuizCoverDisplay
              cover={quiz.coverEmoji}
              className="w-16 h-16 sm:w-20 sm:h-20 mx-auto my-2 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl select-none overflow-hidden shadow-xs"
            />

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
              {quiz.title}
            </h1>

            {/* Meta tags */}
            <div className="flex items-center justify-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Kelas {quiz.grade}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300">
                {quiz.subject}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Oleh: {teacherName}
              </span>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto pt-1">
              {quiz.description || 'Kuis interaktif untuk menguji pemahaman dan mengumpulkan Bintang Prestasi!'}
            </p>
          </div>

          {/* Mode Execution Banner */}
          {effectiveSettings.executionMode === 'teacher_led' && (
            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-100 flex items-center gap-3 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-300 block">
                  Mode Dipandu Guru
                </span>
                <p className="text-xs font-bold leading-tight mt-0.5">
                  Laju soal & pembahasan kuis dikendalikan oleh Guru di depan kelas.
                </p>
              </div>
            </div>
          )}

          {effectiveSettings.pacingType === 'homework' && (
            <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900/60 text-purple-900 dark:text-purple-100 flex items-center gap-3 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-300 block">
                  Penugasan Pekerjaan Rumah (PR)
                </span>
                <p className="text-xs font-bold leading-tight mt-0.5">
                  {effectiveSettings.deadlineAt
                    ? `Batas waktu pengumpulan: ${formatIndonesianDeadline(effectiveSettings.deadlineAt)}`
                    : 'Kerjakan tugas ini secara teliti dari rumah.'}
                </p>
              </div>
            </div>
          )}

          {/* Konfigurasi Sesi dari Guru (Metadata Cards) */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 px-0.5">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              <span>Pengaturan Pengerjaan dari Guru</span>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* Jumlah Soal */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-center">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-500" /> Soal
                </span>
                <span className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-100 block mt-0.5">
                  {quiz.questions.length} Butir
                </span>
              </div>

              {/* Durasi / Soal */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-center">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> Waktu
                </span>
                <span className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-100 block mt-0.5">
                  {effectiveMode === 'untimed' ? 'Santai' : `${effectiveDuration}d / soal`}
                </span>
              </div>

              {/* Mode Pengerjaan */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-center">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-1">
                  <Gamepad2 className="w-3.5 h-3.5 text-purple-500" /> Mode
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 block mt-0.5 truncate" title={modeLabel.title}>
                  {modeLabel.icon} {modeLabel.title.replace('Mode ', '')}
                </span>
              </div>
            </div>

            {/* Aturan & Proteksi yang Ditetapkan Guru (Badge List) */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {effectiveSettings.showAnswersMode === 'exam_strict' && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold">
                  <Lock className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                  <span>Kunci jawaban dirahasiakan selama ujian</span>
                </div>
              )}

              {effectiveSettings.showAnswersMode === 'status_only' && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-[11px] font-semibold">
                  <Lock className="w-3 h-3 text-blue-500 flex-shrink-0" />
                  <span>Hanya status benar/salah, kunci dirahasiakan</span>
                </div>
              )}

              {effectiveSettings.tabSwitchDetection && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-[11px] font-semibold">
                  <Eye className="w-3 h-3 text-rose-500 flex-shrink-0" />
                  <span>Anti-Mencontek: Dilarang berpindah tab</span>
                </div>
              )}

              {effectiveSettings.maxAttempts === 1 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-[11px] font-semibold">
                  <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                  <span>Batas pengerjaan 1x kesempatan</span>
                </div>
              )}

              {(effectiveSettings.shuffleQuestions || effectiveSettings.shuffleOptions) && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                  <Shuffle className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  <span>Soal & opsi diacak</span>
                </div>
              )}
            </div>
          </div>

          {/* Form Pendaftaran Siswa */}
          <form onSubmit={handleStart} className="space-y-5 pt-3 border-t border-slate-200/80 dark:border-slate-800">
            
            {/* ======================================================== */}
            {/* 2. ISI NAMA                                              */}
            {/* ======================================================== */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Nama / Nama Panggilan Siswa:</span>
                </span>
                <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">Wajib diisi</span>
              </label>
              <input
                type="text"
                maxLength={20}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ketik namamu di sini..."
                required
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/40 focus:outline-none font-bold text-sm sm:text-base text-slate-900 dark:text-white min-h-[48px] transition-all shadow-xs"
              />
            </div>

            {/* Nomor Absen (Jika Mode PR atau Diaktifkan Guru) */}
            {(effectiveSettings.requireStudentInfo || effectiveSettings.pacingType === 'homework') && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Nomor Absen Siswa:</span>
                  </span>
                  <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">Wajib untuk rekap tugas</span>
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="Contoh: 15"
                  required={Boolean(effectiveSettings.requireStudentInfo)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/40 focus:outline-none font-bold text-sm sm:text-base text-slate-900 dark:text-white min-h-[48px] transition-all shadow-xs"
                />
              </div>
            )}

            {/* ======================================================== */}
            {/* 3. PILIH MASKOT                                          */}
            {/* ======================================================== */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                <span>Pilih Maskot Favorit:</span>
                <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">Karakter belajarmu</span>
              </label>
              <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                {AVATAR_LIST.map((avatar) => {
                  const isSelected = selectedAvatar === avatar.id;
                  return (
                    <button
                      type="button"
                      key={avatar.id}
                      onClick={() => {
                        playClick();
                        setSelectedAvatar(avatar.id);
                      }}
                      className={`p-2.5 rounded-2xl flex flex-col items-center justify-center border transition-all min-h-[58px] ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-500 ring-2 ring-blue-400 shadow-sm'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                      }`}
                    >
                      <span className="text-2xl sm:text-3xl select-none leading-none">{avatar.emoji}</span>
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 mt-1 truncate max-w-full">
                        {avatar.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Peringatan jika batas pengerjaan 1x sudah selesai */}
            {isAttemptLimitReached && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-amber-900 dark:text-amber-200 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Kamu sudah menyelesaikan kuis ini!</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
                    Sesi ini dibatasi 1x percobaan oleh guru. Lembar jawabanmu telah tersimpan dengan aman pada rekapan nilai kelas.
                  </p>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 4. MULAI / MASUK                                         */}
            {/* ======================================================== */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isAttemptLimitReached}
                className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 min-h-[52px] transition-all ${
                  isAttemptLimitReached
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                    : 'text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 btn-press'
                }`}
              >
                {isAttemptLimitReached ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-slate-400" />
                    <span>Ujian Sudah Selesai Dikerjakan</span>
                  </>
                ) : isTeacherLedWaiting ? (
                  <>
                    <Users className="w-5 h-5 text-white" />
                    <span>Masuk ke Ruang Tunggu Kuis</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-white text-white" />
                    <span>Mulai Mengerjakan Kuis Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-3 text-center text-xs text-slate-400 dark:text-slate-500">
        Kuis Interaktif Seru • Platform Belajar Terpadu
      </footer>
    </div>
  );
};
