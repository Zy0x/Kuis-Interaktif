import React, { useState, useEffect } from 'react';
import type { 
  Quiz, 
  GameMode, 
  AnswerVisibilityMode, 
  ExplanationVisibilityMode,
  ExecutionMode,
  ParticipantMode,
  PacingType
} from '../../types/quiz';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../lib/navigationHistory';
import { useDrawerSwipeDown } from '../../hooks/useDrawerSwipeDown';
import { DrawerHandle } from '../common/DrawerHandle';
import { QuizCoverDisplay } from '../common/QuizCoverDisplay';
import { copyTextToClipboard } from '../../lib/aiQuestionParser';
import { DataManager } from '../../lib/supabaseClient';
import { 
  X, 
  Play, 
  Smartphone, 
  Copy, 
  Check, 
  Share2, 
  ShieldAlert, 
  Shuffle, 
  Layers, 
  Trophy, 
  Lock,
  Sparkles,
  Heart,
  GraduationCap,
  Users,
  User,
  Calendar,
  MessageCircle,
  Pause,
  ArrowRight,
  ArrowLeft,
  Eye,
  CheckCircle2,
  FileText
} from 'lucide-react';

export interface PlayQuizSessionOptions {
  mode: GameMode;
  durationPerQuestionSec: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  presentationTarget: 'smartboard' | 'student-lobby';
  showAnswersMode: AnswerVisibilityMode;
  showExplanationMode: ExplanationVisibilityMode;
  showLeaderboardToStudents: boolean;
  maxAttempts: number; // 0 = unlimited, 1 = 1x
  tabSwitchDetection: boolean;
  saveAsDefault?: boolean;
  executionMode: ExecutionMode;
  participantMode: ParticipantMode;
  pacingType: PacingType;
  deadlineAt?: string;
  requireStudentInfo?: boolean;
  selectedQuestionIds?: string[];
}

export interface PlayQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz | null;
  onStartQuiz: (quiz: Quiz, options: PlayQuizSessionOptions) => void;
  playClick: () => void;
}

const DURATION_PRESETS = [10, 15, 20, 30, 45, 60];

const getDefaultDeadline = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(23, 59, 0, 0);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
};

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

export const PlayQuizModal: React.FC<PlayQuizModalProps> = ({
  isOpen,
  onClose,
  quiz,
  onStartQuiz,
  playClick,
}) => {
  useBodyScrollLock(isOpen);
  useBackHandler(
    'play-quiz-modal',
    95,
    () => {
      if (isOpen) {
        onClose();
        return true;
      }
      return false;
    },
    isOpen
  );

  // Core 2-Modes Architecture
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('teacher_led');
  const [participantMode, setParticipantMode] = useState<ParticipantMode>('individual');
  const [pacingType, setPacingType] = useState<PacingType>('in_class');
  const [deadlineAt, setDeadlineAt] = useState<string>(getDefaultDeadline());
  const [requireStudentInfo, setRequireStudentInfo] = useState<boolean>(true);

  // Session state settings
  const [selectedMode, setSelectedMode] = useState<GameMode>('standard');
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(false);
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(false);
  const [presentationTarget, setPresentationTarget] = useState<'smartboard' | 'student-lobby'>('smartboard');
  const [saveAsDefault, setSaveAsDefault] = useState<boolean>(false);

  // Flexible settings
  const [showAnswersMode, setShowAnswersMode] = useState<AnswerVisibilityMode>('immediate');
  const [showExplanationMode, setShowExplanationMode] = useState<ExplanationVisibilityMode>('immediate');
  const [showLeaderboardToStudents, setShowLeaderboardToStudents] = useState<boolean>(true);
  const [maxAttempts, setMaxAttempts] = useState<number>(0);
  const [tabSwitchDetection, setTabSwitchDetection] = useState<boolean>(false);

  // Copy feedback states
  const [isCopiedPin, setIsCopiedPin] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isCopiedWa, setIsCopiedWa] = useState(false);

  // Sync state whenever quiz changes
  useEffect(() => {
    if (quiz) {
      const def = quiz.defaultSettings || {};
      setSelectedMode(quiz.defaultGameMode || 'standard');
      setSelectedDuration(quiz.durationPerQuestionSec || 30);
      setShuffleQuestions(Boolean(quiz.shuffleQuestions));
      setShuffleOptions(Boolean(quiz.shuffleOptions));
      setSaveAsDefault(false);
      setIsCopiedPin(false);
      setIsCopiedLink(false);
      setIsCopiedWa(false);

      const execMode: ExecutionMode = def.executionMode || 'teacher_led';
      setExecutionMode(execMode);
      setParticipantMode(def.participantMode || 'individual');
      setPacingType(def.pacingType || 'in_class');
      setDeadlineAt(def.deadlineAt || getDefaultDeadline());
      setRequireStudentInfo(def.requireStudentInfo ?? true);

      if (execMode === 'teacher_led') {
        setPresentationTarget('smartboard');
      } else {
        setPresentationTarget(def.presentationTarget || 'student-lobby');
      }

      // Load saved flexible settings or defaults
      setShowAnswersMode(def.showAnswersMode || 'immediate');
      setShowExplanationMode(def.showExplanationMode || 'immediate');
      setShowLeaderboardToStudents(def.showLeaderboardToStudents ?? true);
      setMaxAttempts(def.maxAttempts ?? 0);
      setTabSwitchDetection(def.tabSwitchDetection ?? false);
    }
  }, [quiz]);

  const handleClose = () => {
    playClick();
    onClose();
  };

  const { handleRef, drawerStyle, backdropStyle } = useDrawerSwipeDown({
    onClose: handleClose,
    enabled: isOpen,
  });

  // Switch execution mode with proper target presentation default
  const handleSelectExecutionMode = (mode: ExecutionMode) => {
    playClick();
    setExecutionMode(mode);
    if (mode === 'teacher_led') {
      setPresentationTarget('smartboard');
    } else {
      setPresentationTarget('student-lobby');
    }
  };

  // Quick preset deadline
  const handleSetQuickDeadline = (days: number) => {
    playClick();
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(23, 59, 0, 0);
    const tzOffset = d.getTimezoneOffset() * 60000;
    setDeadlineAt(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
  };

  // Sinkronisasi otomatis ke siswa jika guru mengubah opsi saat sesi sudah aktif
  useEffect(() => {
    if (isOpen && quiz) {
      const existing = DataManager.getActiveSessionByQuizId(quiz.id) || DataManager.getActiveSessionByPin(quiz.pinCode || '');
      if (existing) {
        DataManager.updateActiveSessionSettings(existing.id, {
          mode: selectedMode,
          durationPerQuestionSec: selectedDuration,
          shuffleQuestions,
          shuffleOptions,
          presentationTarget,
          showAnswersMode,
          showExplanationMode,
          showLeaderboardToStudents,
          maxAttempts,
          tabSwitchDetection,
          executionMode,
          participantMode,
          pacingType,
          deadlineAt: pacingType === 'homework' ? deadlineAt : undefined,
          requireStudentInfo: pacingType === 'homework' ? requireStudentInfo : false,
        });
      }
    }
  }, [
    isOpen,
    quiz?.id,
    selectedMode,
    selectedDuration,
    shuffleQuestions,
    shuffleOptions,
    presentationTarget,
    showAnswersMode,
    showExplanationMode,
    showLeaderboardToStudents,
    maxAttempts,
    tabSwitchDetection,
    executionMode,
    participantMode,
    pacingType,
    deadlineAt,
    requireStudentInfo,
  ]);

  if (!isOpen || !quiz) return null;

  const pin = quiz.pinCode || '1001';
  const totalQuestions = quiz.questions?.length || 0;
  const estimatedTotalMinutes = selectedMode === 'untimed' 
    ? 'Fleksibel' 
    : `${Math.ceil((totalQuestions * selectedDuration) / 60)} mnt`;

  // Helper untuk memastikan sesi aktif terdaftar dan menyinkronkan seluruh pengaturan real-time
  const ensureSessionAndSyncSettings = async (overrides?: Partial<PlayQuizSessionOptions>) => {
    const opts: PlayQuizSessionOptions = {
      mode: overrides?.mode ?? selectedMode,
      durationPerQuestionSec: overrides?.durationPerQuestionSec ?? selectedDuration,
      shuffleQuestions: overrides?.shuffleQuestions ?? shuffleQuestions,
      shuffleOptions: overrides?.shuffleOptions ?? shuffleOptions,
      presentationTarget: overrides?.presentationTarget ?? presentationTarget,
      showAnswersMode: overrides?.showAnswersMode ?? showAnswersMode,
      showExplanationMode: overrides?.showExplanationMode ?? showExplanationMode,
      showLeaderboardToStudents: overrides?.showLeaderboardToStudents ?? showLeaderboardToStudents,
      maxAttempts: overrides?.maxAttempts ?? maxAttempts,
      tabSwitchDetection: overrides?.tabSwitchDetection ?? tabSwitchDetection,
      executionMode: overrides?.executionMode ?? executionMode,
      participantMode: overrides?.participantMode ?? participantMode,
      pacingType: overrides?.pacingType ?? pacingType,
      deadlineAt: overrides?.deadlineAt ?? (pacingType === 'homework' ? deadlineAt : undefined),
      requireStudentInfo: overrides?.requireStudentInfo ?? (pacingType === 'homework' ? requireStudentInfo : false),
    };

    let existing = DataManager.getActiveSessionByQuizId(quiz.id) || DataManager.getActiveSessionByPin(quiz.pinCode || '');
    if (existing) {
      await DataManager.updateActiveSessionSettings(existing.id, opts);
    } else {
      existing = await DataManager.createActiveSession(quiz, opts, DataManager.getTeacherProfile() || undefined);
    }
    return existing;
  };

  const handleCopyPin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    playClick();
    await ensureSessionAndSyncSettings();
    const success = await copyTextToClipboard(pin);
    if (success) {
      setIsCopiedPin(true);
      setTimeout(() => setIsCopiedPin(false), 2000);
    }
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    playClick();
    await ensureSessionAndSyncSettings();
    const url = `${window.location.origin}${window.location.pathname}?pin=${pin}`;
    const success = await copyTextToClipboard(url);
    if (success) {
      setIsCopiedLink(true);
      setTimeout(() => setIsCopiedLink(false), 2000);
    }
  };

  const handleShareWhatsApp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    playClick();
    await ensureSessionAndSyncSettings();
    const studentUrl = `${window.location.origin}${window.location.pathname}?pin=${pin}`;
    const deadlineStr = pacingType === 'homework' && deadlineAt ? `⏰ Batas Pengumpulan: ${formatIndonesianDeadline(deadlineAt)}\n` : '';
    const message = `Halo anak-anak dan Ayah/Bunda! 📚\nBerikut tugas kuis interaktif kita:\n\n*${quiz.title}*\n📖 Mata Pelajaran: ${quiz.subject} (Kelas ${quiz.grade})\n${deadlineStr}🔑 PIN Kuis: *${pin}*\n🔗 Tautan Langsung: ${studentUrl}\n\nKerjakan dengan teliti dan raih bintang terbaik! 🌟`;

    const success = await copyTextToClipboard(message);
    if (success) {
      setIsCopiedWa(true);
      setTimeout(() => setIsCopiedWa(false), 2000);
    }
  };

  const handleLaunch = () => {
    playClick();
    onStartQuiz(quiz, {
      mode: selectedMode,
      durationPerQuestionSec: selectedDuration,
      shuffleQuestions,
      shuffleOptions,
      presentationTarget,
      showAnswersMode,
      showExplanationMode,
      showLeaderboardToStudents,
      maxAttempts,
      tabSwitchDetection,
      saveAsDefault,
      executionMode,
      participantMode,
      pacingType,
      deadlineAt: pacingType === 'homework' ? deadlineAt : undefined,
      requireStudentInfo: pacingType === 'homework' ? requireStudentInfo : false,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-wrapper overscroll-contain select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="play-quiz-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300"
        style={backdropStyle}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal / Bottom Sheet Card */}
      <div
        style={drawerStyle}
        className="relative bg-white dark:bg-slate-900 w-full sm:max-w-xl md:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-slate-200/90 dark:border-slate-800 z-10 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-spring-up"
      >
        {/* Mobile Swipe Handle */}
        <div ref={handleRef} className="pt-2 sm:hidden cursor-grab active:cursor-grabbing">
          <DrawerHandle />
        </div>

        {/* Modal Header */}
        <div className="px-4 sm:px-6 pt-3 sm:pt-4 pb-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 flex-shrink-0 bg-slate-50/70 dark:bg-slate-850/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <Play className="w-5 h-5 fill-white text-white ml-0.5" />
            </div>
            <div className="min-w-0">
              <h2
                id="play-quiz-modal-title"
                className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight"
              >
                Atur Sesi Kuis
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pilih mode pengerjaan kuis dan sesuaikan parameter sesi
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Tutup jendela pengaturan kuis"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 custom-scrollbar overscroll-contain">
          
          {/* Card Terpadu: Ringkasan Kuis & Akses Siswa (PIN + Tautan) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-850/70 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              <QuizCoverDisplay 
                cover={quiz.coverEmoji}
                alt={quiz.title}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-2xl shadow-2xs shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60">
                    {quiz.subject} • Kelas {quiz.grade}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500">•</span>
                  <span className="text-slate-600 dark:text-slate-400">
                    {totalQuestions} Soal
                  </span>
                  <span className="text-slate-400 dark:text-slate-500">•</span>
                  <span className="text-slate-600 dark:text-slate-400">
                    {estimatedTotalMinutes}
                  </span>
                </div>
                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white mt-1 leading-snug truncate">
                  {quiz.title}
                </h3>
              </div>
            </div>

            {/* Quick PIN & Share row */}
            <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-750 shadow-2xs">
                <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">PIN</span>
                <span className="font-black text-base text-blue-600 dark:text-blue-400 font-mono tracking-widest leading-none">
                  {pin}
                </span>
                <button
                  type="button"
                  onClick={handleCopyPin}
                  className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[32px] min-w-[32px] flex items-center justify-center transition-colors"
                  title="Salin PIN"
                  aria-label="Salin PIN Kuis"
                >
                  {isCopiedPin ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-1.5 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 shadow-2xs flex items-center gap-1.5 min-h-[36px] transition-colors btn-press"
                  title="Salin tautan langsung untuk siswa"
                >
                  {isCopiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span className="hidden xs:inline">Salin Tautan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* ARSITEKTUR 2 MODE UTAMA (SEGMENTED CONTROL TOP LEVEL)    */}
          {/* ======================================================== */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Pilih Mode Pelaksanaan Sesi
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {executionMode === 'teacher_led' ? 'Kendali Penuh Guru' : 'Pengerjaan Fleksibel Siswa'}
              </span>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl flex items-center gap-1.5 border border-slate-200/60 dark:border-slate-750">
              {/* Option 1: Dipandu Guru */}
              <button
                type="button"
                onClick={() => handleSelectExecutionMode('teacher_led')}
                className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all text-center flex items-center justify-center gap-2 min-h-[48px] btn-press ${
                  executionMode === 'teacher_led'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-black ring-1 ring-blue-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span>1. Dipandu Guru</span>
              </button>

              {/* Option 2: Mandiri & PR */}
              <button
                type="button"
                onClick={() => handleSelectExecutionMode('self_paced')}
                className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all text-center flex items-center justify-center gap-2 min-h-[48px] btn-press ${
                  executionMode === 'self_paced'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-black ring-1 ring-indigo-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span>2. Mandiri & PR</span>
              </button>
            </div>

            {/* Penjelasan Ringkas & Komunikatif Mode Terpilih */}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed px-1">
              {executionMode === 'teacher_led'
                ? '🎯 Guru memegang kendali penuh atas navigasi soal (Next / Prev / Hold Timer), pembukaan kunci jawaban, dan penayangan interaktif di Smartboard/TV.'
                : '📱 Siswa menjawab secara mandiri melalui gawai masing-masing, baik serentak di kelas maupun sebagai penugasan pekerjaan rumah (PR) dengan batas waktu.'}
            </p>
          </div>

          {/* ======================================================== */}
          {/* PANEL MODE 1: DIPANDU GURU (TEACHER-LED)                 */}
          {/* ======================================================== */}
          {executionMode === 'teacher_led' && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Format Partisipasi: Individu vs Regu */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Format Partisipasi Siswa
                  </span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {participantMode === 'individual' ? 'Individu (1 HP / Siswa)' : 'Regu (1 HP / Kelompok)'}
                  </span>
                </div>

                <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setParticipantMode('individual');
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 min-h-[42px] btn-press ${
                      participantMode === 'individual'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span>Individu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setParticipantMode('team');
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 min-h-[42px] btn-press ${
                      participantMode === 'team'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>Regu / Kelompok</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed px-0.5">
                  {participantMode === 'individual'
                    ? 'Setiap siswa memasukkan PIN dan menjawab dari gawai masing-masing.'
                    : 'Satu gawai per meja/kelompok diskusi untuk melatih kerja sama dan komunikasi tim.'}
                </p>
              </div>

              {/* Mekanik Waktu Soal Guru */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Ritme & Mekanik Waktu
                  </span>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    {selectedMode === 'standard' ? 'Timer Otomatis per Butir' : 'Bebas Tanpa Batas Waktu'}
                  </span>
                </div>

                <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setSelectedMode('standard');
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 min-h-[42px] btn-press ${
                      selectedMode === 'standard'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Standar (Timer)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setSelectedMode('untimed');
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 min-h-[42px] btn-press ${
                      selectedMode === 'untimed'
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>🧘 Santai (Ritme Guru)</span>
                  </button>
                </div>

                {selectedMode === 'standard' && (
                  <div className="pt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">Durasi Per Butir</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{selectedDuration} Detik</span>
                    </div>
                    <div className="grid grid-cols-6 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                      {DURATION_PRESETS.map((dur) => (
                        <button
                          key={dur}
                          type="button"
                          onClick={() => {
                            playClick();
                            setSelectedDuration(dur);
                          }}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all min-h-[38px] flex items-center justify-center btn-press ${
                            selectedDuration === dur
                              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          {dur}s
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Fitur Live Teacher Controls Summary Card */}
              <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Fitur Kendali Penuh Guru Aktif di Arena:</span>
                </span>
                
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-start gap-2 bg-white/80 dark:bg-slate-900/60 p-2 rounded-xl border border-blue-100 dark:border-blue-900/40">
                    <Pause className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <strong className="block text-slate-900 dark:text-white">Hold / Jeda Waktu</strong>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Hentikan timer kapan saja untuk memberi arahan</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-white/80 dark:bg-slate-900/60 p-2 rounded-xl border border-blue-100 dark:border-blue-900/40">
                    <ArrowLeft className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <strong className="block text-slate-900 dark:text-white">Navigasi Mundur (Prev)</strong>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Guru bebas kembali ke soal sebelumnya</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-white/80 dark:bg-slate-900/60 p-2 rounded-xl border border-blue-100 dark:border-blue-900/40">
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                    <div>
                      <strong className="block text-slate-900 dark:text-white">Lompat Nomor Soal</strong>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Pilih butir soal spesifik via menu arena</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-white/80 dark:bg-slate-900/60 p-2 rounded-xl border border-blue-100 dark:border-blue-900/40">
                    <Eye className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <strong className="block text-slate-900 dark:text-white">Buka Kunci Manual</strong>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Buka kunci hanya saat guru menghendaki</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* PANEL MODE 2: MANDIRI & PR (SELF-PACED & HOMEWORK)       */}
          {/* ======================================================== */}
          {executionMode === 'self_paced' && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Tipe Pelaksanaan: Di Kelas vs Pekerjaan Rumah (PR) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Tipe Pelaksanaan Siswa
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {pacingType === 'in_class' ? 'Langsung di Kelas' : 'Pekerjaan Rumah (PR)'}
                  </span>
                </div>

                <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setPacingType('in_class');
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 min-h-[42px] btn-press ${
                      pacingType === 'in_class'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5 shrink-0" />
                    <span>Langsung di Kelas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setPacingType('homework');
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 min-h-[42px] btn-press ${
                      pacingType === 'homework'
                        ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span>Pekerjaan Rumah (PR)</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed px-0.5">
                  {pacingType === 'in_class'
                    ? 'Siswa mengerjakan secara mandiri serentak di kelas melalui gawai masing-masing.'
                    : 'Siswa mengerjakan dari rumah secara asinkron dengan tenggat batas waktu pengumpulan.'}
                </p>
              </div>

              {/* Sub-Panel Khusus Pekerjaan Rumah (PR): Deadline, Wajib Nama, Share WA */}
              {pacingType === 'homework' && (
                <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Batas Waktu Pengumpulan (Deadline)</span>
                    </span>
                  </div>

                  {/* Input Date Time Local */}
                  <div className="space-y-1.5">
                    <input
                      type="datetime-local"
                      value={deadlineAt}
                      min={new Date().toISOString().slice(0, 16)}
                      onChange={(e) => setDeadlineAt(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[44px]"
                    />

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleSetQuickDeadline(1)}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-purple-100 text-[11px] font-bold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-850 transition-colors btn-press"
                      >
                        +1 Hari (Besok)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetQuickDeadline(3)}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-purple-100 text-[11px] font-bold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-850 transition-colors btn-press"
                      >
                        +3 Hari
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetQuickDeadline(7)}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-purple-100 text-[11px] font-bold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-850 transition-colors btn-press"
                      >
                        +1 Minggu
                      </button>
                    </div>

                    <p className="text-[11px] text-purple-900 dark:text-purple-200 font-semibold px-0.5">
                      🗓️ Tenggat: {formatIndonesianDeadline(deadlineAt)}
                    </p>
                  </div>

                  {/* Toggle: Wajib Nama Lengkap & Nomor Absen */}
                  <div
                    onClick={() => {
                      playClick();
                      setRequireStudentInfo(!requireStudentInfo);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-purple-100 dark:border-purple-900/40 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Wajib Nama & No. Absen</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">Siswa wajib mengisi identitas jelas untuk buku nilai</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={requireStudentInfo}
                      className={`w-10 h-5 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 focus:outline-none ${
                        requireStudentInfo ? 'bg-purple-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform ${
                        requireStudentInfo ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Tombol Bagikan Format Penugasan ke WhatsApp */}
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 shadow-2xs flex items-center justify-center gap-2 min-h-[42px] transition-colors btn-press"
                  >
                    {isCopiedWa ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Pesan Tugas Disalin! Siap Ditempel di WhatsApp</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Salin Format Tugas untuk Grup WhatsApp Kelas</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Mode Permainan: Standar vs 3 Nyawa vs Santai */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Mekanik Pengerjaan
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedMode === 'standard' ? 'Timer Aktif' : selectedMode === 'survival_3hearts' ? '3 Nyawa' : 'Santai'}
                  </span>
                </div>

                <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setSelectedMode('standard');
                    }}
                    className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 min-h-[42px] btn-press ${
                      selectedMode === 'standard'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Standar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setSelectedMode('survival_3hearts');
                    }}
                    className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 min-h-[42px] btn-press ${
                      selectedMode === 'survival_3hearts'
                        ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>3 Nyawa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setSelectedMode('untimed');
                    }}
                    className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 min-h-[42px] btn-press ${
                      selectedMode === 'untimed'
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>🧘 Santai</span>
                  </button>
                </div>

                {selectedMode !== 'untimed' && (
                  <div className="pt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">Durasi Per Butir</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{selectedDuration} Detik</span>
                    </div>
                    <div className="grid grid-cols-6 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                      {DURATION_PRESETS.map((dur) => (
                        <button
                          key={dur}
                          type="button"
                          onClick={() => {
                            playClick();
                            setSelectedDuration(dur);
                          }}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all min-h-[38px] flex items-center justify-center btn-press ${
                            selectedDuration === dur
                              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          {dur}s
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Visibilitas Kunci Jawaban & Pembahasan */}
              <div className="space-y-3">
                {/* Kunci Jawaban */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Kunci Jawaban Siswa
                    </span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {showAnswersMode === 'immediate' ? 'Kunci Terbuka' : showAnswersMode === 'status_only' ? 'Hanya Status' : 'Dirahasiakan'}
                    </span>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setShowAnswersMode('immediate');
                      }}
                      className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 min-h-[42px] btn-press ${
                        showAnswersMode === 'immediate'
                          ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-black'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span>Terbuka</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setShowAnswersMode('status_only');
                      }}
                      className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 min-h-[42px] btn-press ${
                        showAnswersMode === 'status_only'
                          ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs font-black'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span>Status Saja</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setShowAnswersMode('exam_strict');
                      }}
                      className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 min-h-[42px] btn-press ${
                        showAnswersMode === 'exam_strict'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>Rahasia (Ujian)</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed px-0.5">
                    {showAnswersMode === 'immediate' && 'Siswa langsung mengetahui letak jawaban benar setelah menjawab.'}
                    {showAnswersMode === 'status_only' && 'Siswa hanya tahu status benar/salah, tanpa memperlihatkan kunci.'}
                    {showAnswersMode === 'exam_strict' && 'Kunci jawaban dirahasiakan total selama pengerjaan kuis.'}
                  </p>
                </div>

                {/* Pembahasan Soal */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Pembahasan & Penjelasan
                    </span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {showExplanationMode === 'immediate' ? 'Tiap Butir' : showExplanationMode === 'end_only' ? 'Di Akhir' : 'Sembunyi'}
                    </span>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setShowExplanationMode('immediate');
                      }}
                      className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 min-h-[42px] btn-press ${
                        showExplanationMode === 'immediate'
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <span>Tiap Soal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setShowExplanationMode('end_only');
                      }}
                      className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 min-h-[42px] btn-press ${
                        showExplanationMode === 'end_only'
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <span>Di Akhir</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setShowExplanationMode('never');
                      }}
                      className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 min-h-[42px] btn-press ${
                        showExplanationMode === 'never'
                          ? 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-xs font-black'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <span>Sembunyikan</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed px-0.5">
                    {showExplanationMode === 'immediate' && 'Teks penjelasan materi langsung tampil setelah siswa menjawab.'}
                    {showExplanationMode === 'end_only' && 'Pembahasan baru dibuka setelah siswa menyelesaikan seluruh kuis.'}
                    {showExplanationMode === 'never' && 'Pembahasan ditiadakan agar materi kuis tetap steril.'}
                  </p>
                </div>
              </div>

              {/* Section: Keamanan & Integritas (iOS Settings Group) */}
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Keamanan & Integritas
                </span>

                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850 divide-y divide-slate-100 dark:divide-slate-800/80 shadow-2xs overflow-hidden">
                  {/* Row 1: Acak Nomor Soal */}
                  <div 
                    onClick={() => {
                      playClick();
                      setShuffleQuestions((prev) => !prev);
                    }}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Shuffle className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">Acak Nomor Soal</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">Urutan butir soal berbeda tiap siswa</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={shuffleQuestions}
                      aria-label="Acak Nomor Soal"
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 focus:outline-none ${
                        shuffleQuestions ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                        shuffleQuestions ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Row 2: Acak Opsi Pilihan */}
                  <div 
                    onClick={() => {
                      playClick();
                      setShuffleOptions((prev) => !prev);
                    }}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">Acak Pilihan Opsi</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">Posisi pilihan A, B, C, D diacak</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={shuffleOptions}
                      aria-label="Acak Pilihan Opsi"
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 focus:outline-none ${
                        shuffleOptions ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                        shuffleOptions ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Row 3: Deteksi Ganti Tab */}
                  <div 
                    onClick={() => {
                      playClick();
                      setTabSwitchDetection((prev) => !prev);
                    }}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">Deteksi Ganti Tab</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">Peringatan saat siswa membuka tab lain</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={tabSwitchDetection}
                      aria-label="Deteksi Ganti Tab"
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 focus:outline-none ${
                        tabSwitchDetection ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                        tabSwitchDetection ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Row 4: Peringkat di Siswa */}
                  <div 
                    onClick={() => {
                      playClick();
                      setShowLeaderboardToStudents((prev) => !prev);
                    }}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">Peringkat di Gawai Siswa</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">Tampilkan peringkat & poin langsung ke siswa</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={showLeaderboardToStudents}
                      aria-label="Peringkat di Gawai Siswa"
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 focus:outline-none ${
                        showLeaderboardToStudents ? 'bg-amber-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                        showLeaderboardToStudents ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Row 5: Batasi Pengerjaan 1x */}
                  <div 
                    onClick={() => {
                      playClick();
                      setMaxAttempts((prev) => (prev === 1 ? 0 : 1));
                    }}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">Batas Pengerjaan 1 Kali</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                          {maxAttempts === 1 ? 'Siswa hanya punya 1x kesempatan (Ujian)' : 'Siswa bebas mengulang latihan'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={maxAttempts === 1}
                      aria-label="Batas Pengerjaan 1 Kali"
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 focus:outline-none ${
                        maxAttempts === 1 ? 'bg-rose-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                        maxAttempts === 1 ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Simpan Pengaturan Default */}
          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 select-none pt-1">
            <input
              type="checkbox"
              checked={saveAsDefault}
              onChange={(e) => {
                playClick();
                setSaveAsDefault(e.target.checked);
              }}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <span>Simpan preferensi ini sebagai bawaan untuk kuis ini</span>
          </label>

        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 min-h-[48px] transition-colors btn-press"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleLaunch}
            className={`flex-1 py-3 px-5 rounded-xl text-xs sm:text-sm font-black text-white shadow-md hover:shadow-lg flex items-center justify-center gap-2 min-h-[48px] transition-all btn-press tracking-wide ${
              executionMode === 'teacher_led'
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                : pacingType === 'homework'
                ? 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800'
                : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
            }`}
          >
            <Play className="w-4 h-4 fill-white text-white" />
            <span>
              {executionMode === 'teacher_led'
                ? 'Mulai Pandu Kuis di Smartboard'
                : pacingType === 'homework'
                ? 'Buka Akses Penugasan PR'
                : 'Mulai Sesi Mandiri Siswa'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
