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
  Clock, 
  Copy, 
  Check, 
  Share2, 
  CheckCircle, 
  ShieldAlert, 
  Eye 
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

  // New flexible settings
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
    // Pastikan sesi kuis sudah terdaftar dengan konfigurasi terbaru guru sebelum PIN disalin
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
    // Pastikan sesi kuis sudah terdaftar dengan konfigurasi terbaru guru sebelum tautan disalin
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
        <div className="px-4 sm:px-6 pt-3 sm:pt-5 pb-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 flex-shrink-0 bg-slate-50/70 dark:bg-slate-850/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <Play className="w-5 h-5 fill-white text-white ml-0.5" />
            </div>
            <div className="min-w-0">
              <h2
                id="play-quiz-modal-title"
                className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight flex items-center gap-1.5"
              >
                <span>Mainkan Kuis Bersama Siswa</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Atur konfigurasi sesi kuis sesuai kebutuhan kelas Anda
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
          
          {/* Card Terpadu: Info Kuis & Akses Siswa (PIN + Bagikan Tautan) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-850 dark:to-slate-850 border border-slate-200/80 dark:border-slate-750 space-y-3.5">
            {/* Info Kuis */}
            <div className="flex items-start gap-3.5">
              <QuizCoverDisplay 
                cover={quiz.coverEmoji}
                alt={quiz.title}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-2xl sm:text-3xl shadow-xs shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                    {quiz.subject} • Kelas {quiz.grade}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {totalQuestions} Soal • {estimatedTotalMinutes}
                  </span>
                </div>
                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white mt-1 leading-snug line-clamp-2">
                  {quiz.title}
                </h3>
              </div>
            </div>

            {/* Bar Akses Siswa (PIN & Tautan) */}
            <div className="pt-2 border-t border-slate-200/70 dark:border-slate-750/70 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
              {/* PIN Code Box */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                <div className="text-left">
                  <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase leading-none">PIN Kuis</p>
                  <p className="font-black text-base sm:text-lg tracking-widest text-blue-600 dark:text-blue-400 font-mono leading-none mt-0.5">
                    {pin}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPin}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[38px] min-w-[38px] flex items-center justify-center transition-colors"
                  title="Salin PIN Kuis"
                  aria-label="Salin PIN Kuis"
                >
                  {isCopiedPin ? (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Tombol Bagikan Tautan Langsung */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 sm:flex-initial py-2 px-3.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 shadow-2xs flex items-center justify-center gap-2 min-h-[38px] transition-colors btn-press"
              >
                {isCopiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Tautan Berhasil Disalin!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Salin Tautan Siswa</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 1. Mekanik & Waktu Permainan */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 dark:text-white tracking-wide uppercase flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>1. Mekanik Permainan & Waktu</span>
              </label>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                {selectedMode === 'untimed' ? 'Santai (Tanpa Timer)' : `${selectedDuration}s per butir`}
              </span>
            </div>

            {/* Mode Pilihan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setSelectedMode('standard');
                }}
                className={`p-3 rounded-xl border text-left transition-all btn-press flex flex-col justify-between min-h-[48px] ${
                  selectedMode === 'standard'
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">🌟 Standar</span>
                  {selectedMode === 'standard' && <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Timer aktif, skor dari ketepatan & kecepatan.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClick();
                  setSelectedMode('survival_3hearts');
                }}
                className={`p-3 rounded-xl border text-left transition-all btn-press flex flex-col justify-between min-h-[48px] ${
                  selectedMode === 'survival_3hearts'
                    ? 'border-rose-600 dark:border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 shadow-xs ring-2 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">❤️ 3 Nyawa</span>
                  {selectedMode === 'survival_3hearts' && <CheckCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Salah 3x pengerjaan kuis berakhir.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClick();
                  setSelectedMode('untimed');
                }}
                className={`p-3 rounded-xl border text-left transition-all btn-press flex flex-col justify-between min-h-[48px] ${
                  selectedMode === 'untimed'
                    ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">🧘 Santai</span>
                  {selectedMode === 'untimed' && <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Tanpa timer, leluasa untuk diskusi kelas.
                </p>
              </button>
            </div>

            {/* Durasi Waktu (Jika bukan untimed) */}
            {selectedMode !== 'untimed' && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-750/60">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Durasi Per Butir Soal</span>
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400">{selectedDuration} detik</span>
                </div>
                <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                  {DURATION_PRESETS.map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => {
                        playClick();
                        setSelectedDuration(dur);
                      }}
                      className={`py-2 px-1 rounded-xl text-center font-bold text-xs sm:text-sm transition-all min-h-[42px] flex items-center justify-center btn-press ${
                        selectedDuration === dur
                          ? 'bg-blue-600 text-white shadow-xs font-black'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      {dur}s
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Visibilitas Kunci Jawaban & Pembahasan */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 dark:text-white tracking-wide uppercase flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                <span>2. Visibilitas Kunci & Pembahasan</span>
              </label>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                {showAnswersMode === 'immediate' ? 'Kunci Terbuka' : showAnswersMode === 'status_only' ? 'Hanya Status' : 'Sembunyi Total'}
              </span>
            </div>

            {/* Opsi Visibilitas Kunci */}
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Kunci Jawaban untuk Siswa:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setShowAnswersMode('immediate');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all btn-press flex flex-col justify-between min-h-[48px] ${
                    showAnswersMode === 'immediate'
                      ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">🟢 Terbuka Langsung</span>
                    {showAnswersMode === 'immediate' && <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Siswa langsung tahu letak kunci yang tepat.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setShowAnswersMode('status_only');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all btn-press flex flex-col justify-between min-h-[48px] ${
                    showAnswersMode === 'status_only'
                      ? 'border-amber-600 dark:border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 shadow-xs ring-2 ring-amber-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">🟡 Hanya Status</span>
                    {showAnswersMode === 'status_only' && <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Tahu benar/salah, kunci asli tidak dibocorkan.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setShowAnswersMode('exam_strict');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all btn-press flex flex-col justify-between min-h-[48px] ${
                    showAnswersMode === 'exam_strict'
                      ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 shadow-xs ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">🔒 Sembunyi Total</span>
                    {showAnswersMode === 'exam_strict' && <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Dirahasiakan penuh (standar ujian resmi).
                  </p>
                </button>
              </div>
            </div>

            {/* Opsi Pembahasan */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-750/60">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Pembahasan & Penjelasan Guru:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setShowExplanationMode('immediate');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all btn-press ${
                    showExplanationMode === 'immediate'
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 shadow-xs ring-1 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850'
                  }`}
                >
                  <p className="font-bold text-xs text-slate-900 dark:text-white">Langsung Tiap Soal</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Cocok belajar mandiri</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setShowExplanationMode('end_only');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all btn-press ${
                    showExplanationMode === 'end_only'
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 shadow-xs ring-1 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850'
                  }`}
                >
                  <p className="font-bold text-xs text-slate-900 dark:text-white">Di Akhir Kuis</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Saat ulasan rekapan</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setShowExplanationMode('never');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all btn-press ${
                    showExplanationMode === 'never'
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 shadow-xs ring-1 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850'
                  }`}
                >
                  <p className="font-bold text-xs text-slate-900 dark:text-white">Sembunyikan</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Tanpa ulasan</p>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Keamanan & Aturan Pengerjaan */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <label className="text-xs font-black text-slate-900 dark:text-white tracking-wide uppercase flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-500" />
              <span>3. Keamanan & Aturan Pengerjaan</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Toggle Acak Urutan Soal */}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setShuffleQuestions((prev) => !prev);
                }}
                className={`p-3 rounded-xl border text-left transition-all btn-press flex items-center justify-between min-h-[46px] ${
                  shuffleQuestions
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850'
                }`}
              >
                <div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white">Acak Nomor Soal</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Urutan nomor soal diacak tiap siswa</p>
                </div>
                <div className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
                  shuffleQuestions ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    shuffleQuestions ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </div>
              </button>

              {/* Toggle Acak Pilihan Opsi */}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setShuffleOptions((prev) => !prev);
                }}
                className={`p-3 rounded-xl border text-left transition-all btn-press flex items-center justify-between min-h-[46px] ${
                  shuffleOptions
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850'
                }`}
              >
                <div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white">Acak Opsi Pilihan</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Posisi opsi A, B, C, D diacak</p>
                </div>
                <div className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
                  shuffleOptions ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    shuffleOptions ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </div>
              </button>

              {/* Toggle Deteksi Ganti Tab */}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setTabSwitchDetection((prev) => !prev);
                }}
                className={`p-3 rounded-xl border text-left transition-all btn-press flex items-center justify-between min-h-[46px] ${
                  tabSwitchDetection
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850'
                }`}
              >
                <div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white">Deteksi Ganti Tab</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Beri peringatan saat siswa pindah layar</p>
                </div>
                <div className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
                  tabSwitchDetection ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    tabSwitchDetection ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </div>
              </button>

              {/* Toggle Papan Peringkat di Siswa */}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setShowLeaderboardToStudents((prev) => !prev);
                }}
                className={`p-3 rounded-xl border text-left transition-all btn-press flex items-center justify-between min-h-[46px] ${
                  showLeaderboardToStudents
                    ? 'border-amber-600 dark:border-amber-500 bg-amber-50/70 dark:bg-amber-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850'
                }`}
              >
                <div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white">Peringkat di Gawai Siswa</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{showLeaderboardToStudents ? 'Siswa melihat rank & poin real-time' : 'Hanya guru yang melihat di layar host'}</p>
                </div>
                <div className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
                  showLeaderboardToStudents ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    showLeaderboardToStudents ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </div>
              </button>

              {/* Batas Percobaan (1x vs Bebas) */}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setMaxAttempts((prev) => (prev === 1 ? 0 : 1));
                }}
                className={`p-3 rounded-xl border text-left transition-all btn-press flex items-center justify-between min-h-[46px] sm:col-span-2 ${
                  maxAttempts === 1
                    ? 'border-rose-600 dark:border-rose-500 bg-rose-50/70 dark:bg-rose-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850'
                }`}
              >
                <div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white">
                    Batas Pengerjaan: {maxAttempts === 1 ? 'Hanya 1 Kali (Standar Ujian)' : 'Bebas Mengulang (Latihan Mandiri)'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {maxAttempts === 1 ? 'Siswa dilarang mengulang kembali sesi kuis ini' : 'Siswa leluasa mengulang sesi pengerjaan'}
                  </p>
                </div>
                <div className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
                  maxAttempts === 1 ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    maxAttempts === 1 ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </div>
              </button>
            </div>
          </div>

          {/* 4. Target Tampilan Permainan */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <label className="text-xs font-black text-slate-900 dark:text-white tracking-wide uppercase flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5 text-blue-500" />
              <span>4. Target Tampilan Permainan</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setPresentationTarget('smartboard');
                }}
                className={`p-3 rounded-xl border text-left transition-all btn-press flex items-center gap-3 min-h-[48px] ${
                  presentationTarget === 'smartboard'
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${
                  presentationTarget === 'smartboard' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  <Tv className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Layar Smartboard (IFP)</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Pandu kuis di depan kelas via TV / Proyektor</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClick();
                  setPresentationTarget('student-lobby');
                }}
                className={`p-3 rounded-xl border text-left transition-all btn-press flex items-center gap-3 min-h-[48px] ${
                  presentationTarget === 'student-lobby'
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${
                  presentationTarget === 'student-lobby' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Lobi / Gawai Siswa</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Buka lobi mandiri siswa</p>
                </div>
              </button>
            </div>

            {/* Simpan Pengaturan Default */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-750/60">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 select-none">
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

        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-850/90 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-center gap-2 min-h-[48px] transition-colors btn-press flex-shrink-0"
            title="Salin Tautan Siswa"
          >
            {isCopiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Tersalin!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden xs:inline">Bagi Tautan</span>
                <span className="xs:hidden">Bagikan</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleLaunch}
            className="flex-1 py-3 px-5 rounded-2xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 min-h-[48px] transition-all btn-press tracking-wide"
          >
            <Play className="w-4 h-4 fill-white text-white" />
            <span>Mulai Kuis Sekarang</span>
          </button>
        </div>

      </div>
    </div>
  );
};
