import React, { useState, useEffect } from 'react';
import type { Quiz, GameMode } from '../../types/quiz';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../lib/navigationHistory';
import { useDrawerSwipeDown } from '../../hooks/useDrawerSwipeDown';
import { DrawerHandle } from '../common/DrawerHandle';
import { QuizCoverDisplay } from '../common/QuizCoverDisplay';
import { copyTextToClipboard } from '../../lib/aiQuestionParser';
import { 
  X, 
  Play, 
  Tv, 
  Smartphone, 
  Clock, 
  Shuffle, 
  Copy, 
  Check, 
  Settings2, 
  Share2,
  CheckCircle,
  Zap
} from 'lucide-react';

export interface PlayQuizSessionOptions {
  mode: GameMode;
  durationPerQuestionSec: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  presentationTarget: 'smartboard' | 'student-lobby';
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

  // Copy feedback states
  const [isCopiedPin, setIsCopiedPin] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);

  // Sync state whenever quiz changes
  useEffect(() => {
    if (quiz) {
      setSelectedMode(quiz.defaultGameMode || 'standard');
      setSelectedDuration(quiz.durationPerQuestionSec || 30);
      setShuffleQuestions(Boolean(quiz.shuffleQuestions));
      setShuffleOptions(Boolean(quiz.shuffleOptions));
      setPresentationTarget('smartboard');
      setSaveAsDefault(false);
      setIsCopiedPin(false);
      setIsCopiedLink(false);
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

  if (!isOpen || !quiz) return null;

  const pin = quiz.pinCode || '1001';
  const totalQuestions = quiz.questions?.length || 0;
  const estimatedTotalMinutes = selectedMode === 'untimed' 
    ? 'Fleksibel' 
    : `${Math.ceil((totalQuestions * selectedDuration) / 60)} mnt`;

  const handleCopyPin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    playClick();
    const success = await copyTextToClipboard(pin);
    if (success) {
      setIsCopiedPin(true);
      setTimeout(() => setIsCopiedPin(false), 2000);
    }
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    playClick();
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
                className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight truncate flex items-center gap-1.5"
              >
                <span>Mainkan Kuis Bersama Siswa</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Sesuaikan pengaturan sesi sebelum kuis dimulai
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
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar overscroll-contain">
          
          {/* Card Info Kuis & PIN Kelas */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-750 flex flex-col xs:flex-row xs:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <QuizCoverDisplay 
                cover={quiz.coverEmoji}
                alt={quiz.title}
                className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-2xl shadow-xs shrink-0"
              />
              <div className="min-w-0">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                  {quiz.subject} • Kelas {quiz.grade}
                </span>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate mt-1 leading-snug">
                  {quiz.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <span>{totalQuestions} Butir Soal</span>
                  <span>•</span>
                  <span>Est. {estimatedTotalMinutes}</span>
                </div>
              </div>
            </div>

            {/* Quick PIN Pill */}
            <div className="flex-shrink-0 flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="text-left">
                <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">PIN Kuis</p>
                <p className="font-black text-base sm:text-lg tracking-widest text-blue-600 dark:text-blue-400 font-mono leading-none">
                  {pin}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyPin}
                className="p-2 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
                title="Salin PIN Kelas"
                aria-label="Salin PIN Kelas"
              >
                {isCopiedPin ? (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Pengaturan 1: Mode Permainan (Game Mode) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 dark:text-slate-100 tracking-wide flex items-center gap-1.5 uppercase">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>1. Mode Permainan</span>
              </label>
              <span className="text-[11px] font-semibold text-slate-400">
                {selectedMode === 'standard' ? 'Poin & Waktu' : selectedMode === 'survival_3hearts' ? 'Tantangan Ketelitian' : 'Santai & Diskusi'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
              {/* Mode Standar */}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setSelectedMode('standard');
                }}
                className={`p-3 rounded-2xl border text-left transition-all btn-press flex flex-col justify-between min-h-[48px] ${
                  selectedMode === 'standard'
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🌟</span>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Standar</span>
                  </div>
                  {selectedMode === 'standard' && (
                    <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Timer aktif per butir soal, skor dihitung dari ketepatan & kecepatan.
                </p>
              </button>

              {/* Mode Bertahan Hidup (3 Nyawa) */}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setSelectedMode('survival_3hearts');
                }}
                className={`p-3 rounded-2xl border text-left transition-all btn-press flex flex-col justify-between min-h-[48px] ${
                  selectedMode === 'survival_3hearts'
                    ? 'border-rose-600 dark:border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 shadow-xs ring-2 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">❤️</span>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">3 Nyawa</span>
                  </div>
                  {selectedMode === 'survival_3hearts' && (
                    <CheckCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Siswa memiliki 3 hati. Salah 3 kali pengerjaan kuis berakhir.
                </p>
              </button>

              {/* Mode Santai (Tanpa Timer) */}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setSelectedMode('untimed');
                }}
                className={`p-3 rounded-2xl border text-left transition-all btn-press flex flex-col justify-between min-h-[48px] ${
                  selectedMode === 'untimed'
                    ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🧘</span>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Santai</span>
                  </div>
                  {selectedMode === 'untimed' && (
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Tanpa countdown waktu. Bebas berpikir & berdiskusi bersama guru.
                </p>
              </button>
            </div>
          </div>

          {/* Pengaturan 2: Batas Waktu Per Soal (Hanya jika bukan Untimed) */}
          {selectedMode !== 'untimed' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-900 dark:text-slate-100 tracking-wide flex items-center gap-1.5 uppercase">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>2. Waktu Tiap Soal</span>
                </label>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {selectedDuration} detik / butir
                </span>
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
                    className={`py-2 px-1 rounded-xl text-center font-bold text-xs sm:text-sm transition-all min-h-[44px] flex items-center justify-center btn-press ${
                      selectedDuration === dur
                        ? 'bg-blue-600 text-white shadow-xs font-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                    }`}
                  >
                    {dur}s
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pengaturan 3: Anti-Mencontek & Pengacakan */}
          <div className="space-y-2.5">
            <label className="text-xs font-black text-slate-900 dark:text-slate-100 tracking-wide flex items-center gap-1.5 uppercase">
              <Shuffle className="w-3.5 h-3.5 text-indigo-500" />
              <span>3. Keamanan & Pengacakan Soal</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
              {/* Toggle Acak Urutan Soal */}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setShuffleQuestions((prev) => !prev);
                }}
                className={`p-3 rounded-2xl border text-left transition-all btn-press flex items-center justify-between min-h-[48px] ${
                  shuffleQuestions
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850'
                }`}
              >
                <div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white">
                    Acak Urutan Soal
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Nomor soal diacak tiap sesi
                  </p>
                </div>
                <div
                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
                    shuffleQuestions ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      shuffleQuestions ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </button>

              {/* Toggle Acak Opsi Jawaban */}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setShuffleOptions((prev) => !prev);
                }}
                className={`p-3 rounded-2xl border text-left transition-all btn-press flex items-center justify-between min-h-[48px] ${
                  shuffleOptions
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850'
                }`}
              >
                <div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white">
                    Acak Pilihan Opsi
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Posisi opsi A, B, C, D diacak
                  </p>
                </div>
                <div
                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
                    shuffleOptions ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      shuffleOptions ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>

          {/* Pengaturan 4: Mode Tampilan / Cara Memulai */}
          <div className="space-y-2.5">
            <label className="text-xs font-black text-slate-900 dark:text-slate-100 tracking-wide flex items-center gap-1.5 uppercase">
              <Settings2 className="w-3.5 h-3.5 text-blue-500" />
              <span>4. Target Tampilan Permainan</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
              {/* Smartboard / Layar Kelas (Mode IFP) */}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setPresentationTarget('smartboard');
                }}
                className={`p-3 rounded-2xl border text-left transition-all btn-press flex items-center gap-3 min-h-[50px] ${
                  presentationTarget === 'smartboard'
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850'
                }`}
              >
                <div className={`p-2 rounded-xl flex-shrink-0 ${
                  presentationTarget === 'smartboard' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  <Tv className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                    Layar Smartboard (IFP)
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Pandu kuis di depan kelas via TV / Proyektor
                  </p>
                </div>
              </button>

              {/* Lobi / Gawai Siswa Mandiri */}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setPresentationTarget('student-lobby');
                }}
                className={`p-3 rounded-2xl border text-left transition-all btn-press flex items-center gap-3 min-h-[50px] ${
                  presentationTarget === 'student-lobby'
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850'
                }`}
              >
                <div className={`p-2 rounded-xl flex-shrink-0 ${
                  presentationTarget === 'student-lobby' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                    Lobi Siswa / Gawai
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Buka lobi siswa untuk persiapan gawai
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Opsi Simpan Pengaturan sebagai Default Kuis */}
          <div className="pt-1">
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
              <span>Simpan pilihan ini sebagai pengaturan standar kuis ini</span>
            </label>
          </div>

        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 flex items-center justify-between gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-center gap-2 min-h-[46px] transition-colors btn-press flex-shrink-0"
            title="Salin Tautan & PIN Siswa"
          >
            {isCopiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Tautan Tersalin</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="hidden xs:inline">Bagi Tautan</span>
                <span className="xs:hidden">Bagikan</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleLaunch}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-700 hover:to-indigo-700 shadow-md flex items-center justify-center gap-2 min-h-[46px] transition-all btn-press tracking-wide"
          >
            <Play className="w-4 h-4 fill-white text-white" />
            <span>Mulai Kuis Sekarang</span>
          </button>
        </div>

      </div>
    </div>
  );
};
