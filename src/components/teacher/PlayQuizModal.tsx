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
  Lock,
  Sparkles,
  Heart,
  GraduationCap,
  Users,
  User,
  Calendar,
  MessageCircle,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  FileText,
  Info
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

  // Step state: 'select_mode' (Hero Cards) or 'configure' (Focused Minimal Settings)
  const [currentStep, setCurrentStep] = useState<'select_mode' | 'configure'>('select_mode');

  // Back handler: if configure -> back to select_mode; if select_mode -> close modal
  useBackHandler(
    'play-quiz-modal',
    95,
    () => {
      if (!isOpen) return false;
      if (currentStep === 'configure') {
        setCurrentStep('select_mode');
        return true;
      }
      onClose();
      return true;
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
  const [durationSelectionType, setDurationSelectionType] = useState<'default' | 'preset' | 'custom'>('default');
  const [customDurationValue, setCustomDurationValue] = useState<number>(30);
  const [customDurationUnit, setCustomDurationUnit] = useState<'seconds' | 'minutes'>('seconds');
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

  // Accordion state for teacher-led additional settings
  const [isTeacherAdvancedOpen, setIsTeacherAdvancedOpen] = useState(false);

  // Copy feedback states
  const [isCopiedPin, setIsCopiedPin] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isCopiedWa, setIsCopiedWa] = useState(false);

  // Reset or initialize state whenever quiz opens/changes
  useEffect(() => {
    if (quiz && isOpen) {
      const def = quiz.defaultSettings || {};
      setCurrentStep('select_mode'); // Always start with clean card picker
      setIsTeacherAdvancedOpen(false);
      setSelectedMode(quiz.defaultGameMode || 'standard');
      const initDur = quiz.durationPerQuestionSec || 30;
      setSelectedDuration(initDur);
      setDurationSelectionType('default');
      if (initDur >= 60 && initDur % 60 === 0) {
        setCustomDurationValue(initDur / 60);
        setCustomDurationUnit('minutes');
      } else {
        setCustomDurationValue(initDur);
        setCustomDurationUnit('seconds');
      }
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

      setShowAnswersMode(def.showAnswersMode || 'immediate');
      setShowExplanationMode(def.showExplanationMode || 'immediate');
      setShowLeaderboardToStudents(def.showLeaderboardToStudents ?? true);
      setMaxAttempts(def.maxAttempts ?? 0);
      setTabSwitchDetection(def.tabSwitchDetection ?? false);
    }
  }, [quiz, isOpen]);

  const handleClose = () => {
    playClick();
    onClose();
  };

  const { handleRef, drawerStyle, backdropStyle } = useDrawerSwipeDown({
    onClose: handleClose,
    enabled: isOpen,
  });

  // Step 1: Card Selection Action
  const handleSelectModeCard = (mode: ExecutionMode) => {
    playClick();
    setExecutionMode(mode);
    if (mode === 'teacher_led') {
      setPresentationTarget('smartboard');
    } else {
      setPresentationTarget('student-lobby');
    }
    setCurrentStep('configure');
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

  // Sinkronisasi otomatis ke sesi aktif
  useEffect(() => {
    if (isOpen && quiz && currentStep === 'configure') {
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
    currentStep,
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

  // Helper sync
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

        {/* ======================================================== */}
        {/* MODAL HEADER (Dynamic: Step 1 vs Step 2)                 */}
        {/* ======================================================== */}
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 flex-shrink-0 bg-slate-50/70 dark:bg-slate-850/70">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {currentStep === 'configure' ? (
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setCurrentStep('select_mode');
                  }}
                  className="py-1.5 px-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center gap-1.5 text-xs font-bold transition-colors min-h-[44px]"
                  title="Kembali ke Pemilihan Mode"
                  aria-label="Kembali ke Pemilihan Mode"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Pilih Mode Lain</span>
                </button>
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block" />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate hidden sm:inline">
                  {executionMode === 'teacher_led' ? 'Mode Dipandu Guru' : 'Mode Mandiri & PR'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 min-w-0">
                <QuizCoverDisplay 
                  cover={quiz.coverEmoji}
                  alt={quiz.title}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl shrink-0 shadow-2xs"
                />
                <div className="min-w-0">
                  <h2
                    id="play-quiz-modal-title"
                    className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug truncate"
                  >
                    {quiz.title}
                  </h2>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                    {quiz.subject} • Kelas {quiz.grade} • {totalQuestions} Soal
                  </p>
                </div>
              </div>
            )}
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

        {/* ======================================================== */}
        {/* MODAL BODY (STEP 1: CARD SELECTION)                      */}
        {/* ======================================================== */}
        {currentStep === 'select_mode' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-3 custom-scrollbar overscroll-contain animate-fade-in">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Pilih Cara Bermain
              </span>
            </div>

            {/* ACTION TILES: DIPANDU GURU vs MANDIRI & PR */}
            <div className="space-y-3">
              {/* TILE 1: DIPANDU GURU */}
              <button
                type="button"
                onClick={() => handleSelectModeCard('teacher_led')}
                className="w-full group p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-slate-850/80 hover:bg-blue-50/40 dark:hover:bg-blue-950/25 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 sm:gap-4 btn-press text-left min-h-[72px]"
                aria-label="Pilih Mode Dipandu Guru"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0 border border-blue-100 dark:border-blue-900/50 shadow-2xs">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Dipandu Guru
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60">
                        Smartboard
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Kontrol penuh guru di layar utama Smartboard & kelas.
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-600 group-hover:text-white text-slate-400 dark:text-slate-500 flex items-center justify-center flex-shrink-0 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>

              {/* TILE 2: MANDIRI & PR */}
              <button
                type="button"
                onClick={() => handleSelectModeCard('self_paced')}
                className="w-full group p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-slate-850/80 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/25 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 sm:gap-4 btn-press text-left min-h-[72px]"
                aria-label="Pilih Mode Mandiri & PR"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0 border border-indigo-100 dark:border-indigo-900/50 shadow-2xs">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        Mandiri & PR
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/60">
                        Gawai Siswa
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Siswa menjawab mandiri lewat HP masing-masing di kelas atau tugas rumah.
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white text-slate-400 dark:text-slate-500 flex items-center justify-center flex-shrink-0 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL BODY (STEP 2: FOCUSED MINIMAL CONFIGURATION)       */}
        {/* ======================================================== */}
        {currentStep === 'configure' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 custom-scrollbar overscroll-contain animate-fade-in">
            
            {/* Quick PIN & Share row (Minimalist) */}
            <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-850/70 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
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
                  {isCopiedPin ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className="py-1.5 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 shadow-2xs flex items-center gap-1.5 min-h-[36px] transition-colors btn-press"
              >
                {isCopiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Salin Tautan Siswa</span>
                  </>
                )}
              </button>
            </div>

            {/* ---------------------------------------------------- */}
            {/* SUB-PANEL 1: DIPANDU GURU                            */}
            {/* ---------------------------------------------------- */}
            {executionMode === 'teacher_led' && (
              <div className="space-y-4">
                {/* Format Partisipasi */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Format Partisipasi
                  </label>
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
                      <User className="w-3.5 h-3.5" />
                      <span>Individu (1 HP)</span>
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
                      <Users className="w-3.5 h-3.5" />
                      <span>Regu / Kelompok</span>
                    </button>
                  </div>
                </div>

                {/* Waktu per Butir Soal */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      Waktu per Butir Soal
                    </label>
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                      {selectedMode === 'untimed'
                        ? 'Bebas Waktu (Tanpa Timer)'
                        : durationSelectionType === 'default'
                        ? `Bawaan Kuis (${quiz.durationPerQuestionSec || 30}s)`
                        : durationSelectionType === 'custom'
                        ? `${customDurationValue} ${customDurationUnit === 'minutes' ? 'menit' : 'detik'} / soal`
                        : `${selectedDuration} detik / soal`}
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
                      <span>
                        Timer ({durationSelectionType === 'custom' ? `${customDurationValue} ${customDurationUnit === 'minutes' ? 'mnt' : 'dtk'}` : `${selectedDuration}s`} / soal)
                      </span>
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
                      <span>🧘 Santai (Tanpa Batas)</span>
                    </button>
                  </div>

                  {selectedMode === 'standard' && (
                    <div className="space-y-2 pt-0.5">
                      {/* Baris Pilihan Waktu: Bawaan Soal, Presets, dan Kustom */}
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex-wrap">
                        {/* Tombol Bawaan Soal */}
                        <button
                          type="button"
                          onClick={() => {
                            playClick();
                            setDurationSelectionType('default');
                            setSelectedDuration(quiz.durationPerQuestionSec || 30);
                          }}
                          className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all min-h-[38px] flex items-center justify-center gap-1 flex-1 sm:flex-initial btn-press ${
                            durationSelectionType === 'default'
                              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                          title="Mengikuti durasi bawaan kuis/soal"
                        >
                          <span>Bawaan</span>
                          <span className="text-[10px] opacity-75">({quiz.durationPerQuestionSec || 30}s)</span>
                        </button>

                        {/* Preset Buttons */}
                        {DURATION_PRESETS.map((dur) => (
                          <button
                            key={dur}
                            type="button"
                            onClick={() => {
                              playClick();
                              setDurationSelectionType('preset');
                              setSelectedDuration(dur);
                              setCustomDurationValue(dur);
                              setCustomDurationUnit('seconds');
                            }}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all min-h-[38px] flex items-center justify-center flex-1 sm:flex-initial btn-press ${
                              durationSelectionType === 'preset' && selectedDuration === dur
                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            {dur}s
                          </button>
                        ))}

                        {/* Tombol Kustom */}
                        <button
                          type="button"
                          onClick={() => {
                            playClick();
                            setDurationSelectionType('custom');
                            setSelectedDuration(customDurationUnit === 'minutes' ? customDurationValue * 60 : customDurationValue);
                          }}
                          className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all min-h-[38px] flex items-center justify-center flex-1 sm:flex-initial btn-press ${
                            durationSelectionType === 'custom'
                              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          Kustom
                        </button>
                      </div>

                      {/* Info kecil saat mode Bawaan aktif */}
                      {durationSelectionType === 'default' && (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 animate-fade-in text-xs">
                          <Info className="w-3.5 h-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
                          <span className="font-medium leading-relaxed">
                            Mengikuti pengaturan kuis untuk waktu pengerjaan tiap soalnya ({quiz.durationPerQuestionSec || 30} detik).
                          </span>
                        </div>
                      )}

                      {/* Input Kustom: Angka Bebas + Satuan Detik/Menit (Tanpa Batas Rentang) */}
                      {durationSelectionType === 'custom' && (
                        <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 animate-fade-in">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-900 dark:text-blue-200 whitespace-nowrap">
                              Atur Durasi:
                            </span>
                            {/* Kolom Angka (Bebas tanpa batasan rentang) */}
                            <div className="flex items-center bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-blue-200 dark:border-blue-800 shadow-2xs">
                              <input
                                type="number"
                                min={1}
                                value={customDurationValue || ''}
                                onChange={(e) => {
                                  const parsed = parseInt(e.target.value);
                                  const cleanVal = isNaN(parsed) || parsed < 1 ? 1 : parsed;
                                  setCustomDurationValue(cleanVal);
                                  setSelectedDuration(customDurationUnit === 'minutes' ? cleanVal * 60 : cleanVal);
                                }}
                                className="w-14 bg-transparent text-center font-black text-sm text-blue-600 dark:text-blue-400 focus:outline-none"
                                placeholder="30"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Pilihan Satuan (Detik vs Menit) */}
                            <div className="bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-xl flex items-center shadow-2xs">
                              <button
                                type="button"
                                onClick={() => {
                                  playClick();
                                  setCustomDurationUnit('seconds');
                                  setSelectedDuration(customDurationValue);
                                }}
                                className={`py-1 px-3 rounded-lg text-xs font-bold transition-all min-h-[32px] btn-press ${
                                  customDurationUnit === 'seconds'
                                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                              >
                                Detik
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  playClick();
                                  setCustomDurationUnit('minutes');
                                  setSelectedDuration(customDurationValue * 60);
                                }}
                                className={`py-1 px-3 rounded-lg text-xs font-bold transition-all min-h-[32px] btn-press ${
                                  customDurationUnit === 'minutes'
                                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                              >
                                Menit
                              </button>
                            </div>

                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              / soal
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Accordion: Pengaturan Tambahan Kuis */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setIsTeacherAdvancedOpen(!isTeacherAdvancedOpen);
                    }}
                    className="w-full flex items-center justify-between py-2 px-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-h-[44px] select-none"
                    aria-expanded={isTeacherAdvancedOpen}
                  >
                    <span className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-blue-500" />
                      <span>Pengaturan Tambahan Kuis</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isTeacherAdvancedOpen ? 'rotate-180 text-blue-500' : ''}`} />
                  </button>

                  {isTeacherAdvancedOpen && (
                    <div className="pt-2 pb-1 space-y-3.5 animate-fade-in">
                      {/* Kunci Jawaban Siswa */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                          Kunci Jawaban Siswa
                        </label>
                        <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center gap-1">
                          {[
                            { id: 'immediate', label: 'Tiap Soal' },
                            { id: 'post-game', label: 'Akhir Kuis' },
                            { id: 'hidden', label: 'Rahasia' }
                          ].map(opt => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                playClick();
                                setShowAnswersMode(opt.id as AnswerVisibilityMode);
                              }}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all min-h-[38px] flex items-center justify-center btn-press ${
                                showAnswersMode === opt.id
                                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Pembahasan Materi */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                          Pembahasan Materi
                        </label>
                        <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center gap-1">
                          {[
                            { id: 'immediate', label: 'Tiap Soal' },
                            { id: 'post-game', label: 'Akhir Kuis' },
                            { id: 'hidden', label: 'Sembunyikan' }
                          ].map(opt => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                playClick();
                                setShowExplanationMode(opt.id as ExplanationVisibilityMode);
                              }}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all min-h-[38px] flex items-center justify-center btn-press ${
                                showExplanationMode === opt.id
                                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Daftar Sakelar Opsi: Acak Soal, Acak Opsi, Leaderboard */}
                      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850 divide-y divide-slate-100 dark:divide-slate-800/80 shadow-2xs overflow-hidden">
                        {/* Acak Urutan Nomor Soal */}
                        <div 
                          onClick={() => {
                            playClick();
                            setShuffleQuestions(!shuffleQuestions);
                          }}
                          className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 text-xs font-bold text-slate-900 dark:text-white">
                            <Shuffle className="w-4 h-4 text-blue-500" />
                            <span>Acak Urutan Nomor Soal</span>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={shuffleQuestions}
                            aria-label="Acak Urutan Nomor Soal"
                            className={`w-10 h-5 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 focus:outline-none ${
                              shuffleQuestions ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform ${
                              shuffleQuestions ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>

                        {/* Acak Pilihan Opsi */}
                        <div 
                          onClick={() => {
                            playClick();
                            setShuffleOptions(!shuffleOptions);
                          }}
                          className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 text-xs font-bold text-slate-900 dark:text-white">
                            <Layers className="w-4 h-4 text-indigo-500" />
                            <span>Acak Pilihan Opsi (A, B, C, D)</span>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={shuffleOptions}
                            aria-label="Acak Pilihan Opsi"
                            className={`w-10 h-5 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 focus:outline-none ${
                              shuffleOptions ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform ${
                              shuffleOptions ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>

                        {/* Tayangkan Papan Peringkat / Leaderboard di Smartboard */}
                        <div 
                          onClick={() => {
                            playClick();
                            setShowLeaderboardToStudents(!showLeaderboardToStudents);
                          }}
                          className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 text-xs font-bold text-slate-900 dark:text-white">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span>Tayangkan Peringkat Kelas di Smartboard</span>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={showLeaderboardToStudents}
                            aria-label="Tayangkan Peringkat Kelas di Smartboard"
                            className={`w-10 h-5 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 focus:outline-none ${
                              showLeaderboardToStudents ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform ${
                              showLeaderboardToStudents ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* SUB-PANEL 2: MANDIRI & PR                            */}
            {/* ---------------------------------------------------- */}
            {executionMode === 'self_paced' && (
              <div className="space-y-4">
                {/* Tipe Pelaksanaan */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Tipe Pelaksanaan
                  </label>
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
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Di Kelas</span>
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
                      <FileText className="w-3.5 h-3.5" />
                      <span>Tugas Rumah (PR)</span>
                    </button>
                  </div>
                </div>

                {/* Sub-panel Khusus Pekerjaan Rumah */}
                {pacingType === 'homework' && (
                  <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-200">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span>Batas Pengumpulan</span>
                        </span>
                        <span className="text-[11px] font-semibold">{formatIndonesianDeadline(deadlineAt)}</span>
                      </div>
                      <input
                        type="datetime-local"
                        value={deadlineAt}
                        min={new Date().toISOString().slice(0, 16)}
                        onChange={(e) => setDeadlineAt(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none min-h-[42px]"
                      />
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleSetQuickDeadline(1)}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-[11px] font-bold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-850 btn-press"
                        >
                          Besok
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetQuickDeadline(3)}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-[11px] font-bold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-850 btn-press"
                        >
                          +3 Hari
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetQuickDeadline(7)}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-[11px] font-bold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-850 btn-press"
                        >
                          +1 Minggu
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleShareWhatsApp}
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center gap-2 min-h-[40px] transition-colors btn-press"
                    >
                      {isCopiedWa ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Pesan Tugas Disalin ke Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Salin Format Tugas ke WhatsApp</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Mode Pengerjaan */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Mode Permainan
                  </label>
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
                      <span>Standar ({selectedDuration}s)</span>
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
                </div>

                {/* Keamanan & Integritas (Ultra-Clean Single List Group) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Opsi Keamanan & Integritas
                  </label>
                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850 divide-y divide-slate-100 dark:divide-slate-800/80 shadow-2xs overflow-hidden">
                    {/* Acak Nomor Soal */}
                    <div 
                      onClick={() => {
                        playClick();
                        setShuffleQuestions(!shuffleQuestions);
                      }}
                      className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 text-xs font-bold text-slate-900 dark:text-white">
                        <Shuffle className="w-4 h-4 text-indigo-500" />
                        <span>Acak Urutan Nomor Soal</span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={shuffleQuestions}
                        aria-label="Acak Urutan Nomor Soal"
                        className={`w-10 h-5 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 focus:outline-none ${
                          shuffleQuestions ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform ${
                          shuffleQuestions ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Acak Opsi Pilihan */}
                    <div 
                      onClick={() => {
                        playClick();
                        setShuffleOptions(!shuffleOptions);
                      }}
                      className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 text-xs font-bold text-slate-900 dark:text-white">
                        <Layers className="w-4 h-4 text-blue-500" />
                        <span>Acak Pilihan Opsi (A, B, C, D)</span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={shuffleOptions}
                        aria-label="Acak Pilihan Opsi"
                        className={`w-10 h-5 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 focus:outline-none ${
                          shuffleOptions ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform ${
                          shuffleOptions ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Deteksi Ganti Tab */}
                    <div 
                      onClick={() => {
                        playClick();
                        setTabSwitchDetection(!tabSwitchDetection);
                      }}
                      className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 text-xs font-bold text-slate-900 dark:text-white">
                        <ShieldAlert className="w-4 h-4 text-amber-500" />
                        <span>Deteksi Ganti Tab (Anti-Mencontek)</span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={tabSwitchDetection}
                        aria-label="Deteksi Ganti Tab"
                        className={`w-10 h-5 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 focus:outline-none ${
                          tabSwitchDetection ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform ${
                          tabSwitchDetection ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Batas Pengerjaan 1x */}
                    <div 
                      onClick={() => {
                        playClick();
                        setMaxAttempts(maxAttempts === 1 ? 0 : 1);
                      }}
                      className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 text-xs font-bold text-slate-900 dark:text-white">
                        <Lock className="w-4 h-4 text-rose-500" />
                        <span>Batas Pengerjaan 1 Kali (Ujian)</span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={maxAttempts === 1}
                        aria-label="Batas Pengerjaan 1 Kali"
                        className={`w-10 h-5 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 focus:outline-none ${
                          maxAttempts === 1 ? 'bg-rose-600' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform ${
                          maxAttempts === 1 ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Simpan Preferensi Default */}
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-500 dark:text-slate-400 select-none pt-1">
              <input
                type="checkbox"
                checked={saveAsDefault}
                onChange={(e) => {
                  playClick();
                  setSaveAsDefault(e.target.checked);
                }}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <span>Simpan sebagai setelan bawaan kuis ini</span>
            </label>

          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL FOOTER (Only for Step 2 Configuration)             */}
        {/* ======================================================== */}
        {currentStep === 'configure' && (
          <div className="p-4 sm:p-5 border-t border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                playClick();
                setCurrentStep('select_mode');
              }}
              className="py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 min-h-[48px] transition-colors btn-press"
            >
              Ganti Mode
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
                  ? 'Mulai Pandu di Smartboard'
                  : pacingType === 'homework'
                  ? 'Buka Akses Tugas Rumah'
                  : 'Mulai Sesi Mandiri'}
              </span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
