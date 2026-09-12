import React, { useState, useEffect } from 'react';
import type { 
  Quiz, 
  GameMode, 
  AnswerVisibilityMode, 
  ExplanationVisibilityMode 
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
  Tv, 
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
  Heart
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
}

export interface PlayQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz | null;
  onStartQuiz: (quiz: Quiz, options: PlayQuizSessionOptions) => void;
  playClick: () => void;
}

const DURATION_PRESETS = [10, 15, 20, 30, 45, 60];

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

  // Sync state whenever quiz changes
  useEffect(() => {
    if (quiz) {
      const def = quiz.defaultSettings || {};
      setSelectedMode(quiz.defaultGameMode || 'standard');
      setSelectedDuration(quiz.durationPerQuestionSec || 30);
      setShuffleQuestions(Boolean(quiz.shuffleQuestions));
      setShuffleOptions(Boolean(quiz.shuffleOptions));
      setPresentationTarget('smartboard');
      setSaveAsDefault(false);
      setIsCopiedPin(false);
      setIsCopiedLink(false);

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
                Konfigurasi aturan dan mekanik permainan kuis
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
          </div>

          {/* Section: Mode Permainan & Durasi */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Mode Permainan
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {selectedMode === 'standard' ? 'Timer Aktif & Poin Cepat' : selectedMode === 'survival_3hearts' ? 'Tantangan 3 Nyawa' : 'Bebas Tanpa Timer'}
              </span>
            </div>

            {/* Segmented Control Mode */}
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

            {/* Durasi per Butir (Kondisional jika bukan untimed) */}
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

          {/* Section: Visibilitas Kunci & Pembahasan */}
          <div className="space-y-3">
            {/* Kunci Jawaban Siswa */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Kunci Jawaban Siswa
                </span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {showAnswersMode === 'immediate' ? 'Kunci Terbuka' : showAnswersMode === 'status_only' ? 'Hanya Benar / Salah' : 'Dirahasiakan'}
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
                  <span>Rahasia</span>
                </button>
              </div>
            </div>

            {/* Pembahasan Soal */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Pembahasan & Penjelasan
                </span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {showExplanationMode === 'immediate' ? 'Tiap Butir Soal' : showExplanationMode === 'end_only' ? 'Di Akhir Kuis' : 'Tidak Ditampilkan'}
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
                className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Shuffle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">Acak Nomor Soal</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">Urutan nomor soal berbeda tiap siswa</p>
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
                className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
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
                className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">Deteksi Ganti Tab</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">Peringatan saat siswa meninggalkan layar ujian</p>
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

              {/* Row 4: Papan Peringkat di Siswa */}
              <div 
                onClick={() => {
                  playClick();
                  setShowLeaderboardToStudents((prev) => !prev);
                }}
                className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
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
                className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">Batas Pengerjaan 1 Kali</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      {maxAttempts === 1 ? 'Siswa dilarang mengulang pengerjaan' : 'Siswa bebas mengulang latihan'}
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

          {/* Section: Target Tampilan Permainan */}
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Target Tampilan Permainan
            </span>

            <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setPresentationTarget('smartboard');
                }}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-2 min-h-[44px] btn-press ${
                  presentationTarget === 'smartboard'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Tv className="w-4 h-4 shrink-0" />
                <span>Smartboard / TV Kelas</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClick();
                  setPresentationTarget('student-lobby');
                }}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-2 min-h-[44px] btn-press ${
                  presentationTarget === 'student-lobby'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-4 h-4 shrink-0" />
                <span>Gawai Siswa Mandiri</span>
              </button>
            </div>

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
              <span>Simpan konfigurasi ini sebagai default untuk kuis ini</span>
            </label>
          </div>

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
            className="flex-1 py-3 px-5 rounded-xl text-xs sm:text-sm font-black text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md hover:shadow-lg flex items-center justify-center gap-2 min-h-[48px] transition-all btn-press tracking-wide"
          >
            <Play className="w-4 h-4 fill-white text-white" />
            <span>Mulai Kuis Sekarang</span>
          </button>
        </div>

      </div>
    </div>
  );
};
