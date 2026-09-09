import React, { useState, useEffect } from 'react';
import type { Quiz } from '../../types/quiz';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../lib/navigationHistory';
import { generateRandomPin } from '../../lib/supabaseClient';
import { 
  X, 
  Globe, 
  Lock, 
  Clock, 
  KeyRound, 
  RefreshCw, 
  Copy, 
  Check, 
  Share2, 
  Tv, 
  Printer, 
  Trash2, 
  Save, 
  SlidersHorizontal,
  CheckCircle2,
  Loader2
} from 'lucide-react';

export interface QuizSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz | null;
  onSaveSettings: (quizId: string, updates: Partial<Quiz>) => Promise<void>;
  onLaunchSmartboard?: (quiz: Quiz) => void;
  onPrintWorksheet?: (quiz: Quiz) => void;
  onRequestDelete?: (quiz: Quiz) => void;
  canDelete?: boolean;
  playClick: () => void;
}

const TIMER_OPTIONS = [15, 20, 25, 30, 45, 60];

export const QuizSettingsModal: React.FC<QuizSettingsModalProps> = ({
  isOpen,
  onClose,
  quiz,
  onSaveSettings,
  onLaunchSmartboard,
  onPrintWorksheet,
  onRequestDelete,
  canDelete = false,
  playClick,
}) => {
  useBodyScrollLock(isOpen);
  useBackHandler(
    'quiz-settings-modal',
    90,
    () => {
      if (isOpen) {
        onClose();
        return true;
      }
      return false;
    },
    isOpen
  );

  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [duration, setDuration] = useState<number>(25);
  const [pin, setPin] = useState<string>('1001');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [copiedType, setCopiedType] = useState<'pin' | 'link' | null>(null);

  // Sync internal state with quiz when opened
  useEffect(() => {
    if (quiz) {
      setVisibility(quiz.visibility || 'public');
      setDuration(quiz.durationPerQuestionSec || 25);
      setPin(quiz.pinCode || '1001');
      setIsSavedSuccess(false);
    }
  }, [quiz]);

  if (!isOpen || !quiz) return null;

  const handleRandomizePin = () => {
    playClick();
    const newPin = generateRandomPin();
    setPin(newPin);
  };

  const handleCopyPin = () => {
    playClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pin);
      setCopiedType('pin');
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  const handleCopyLink = () => {
    playClick();
    const url = `${window.location.origin}${window.location.pathname}?pin=${pin}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedType('link');
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  const handleSave = async () => {
    playClick();
    setIsSaving(true);
    try {
      await onSaveSettings(quiz.id, {
        visibility,
        durationPerQuestionSec: duration,
        pinCode: pin,
      });
      setIsSavedSuccess(true);
      setTimeout(() => {
        setIsSavedSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Error saving quiz settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = 
    visibility !== (quiz.visibility || 'public') ||
    duration !== (quiz.durationPerQuestionSec || 25) ||
    pin !== (quiz.pinCode || '1001');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-wrapper overscroll-contain select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-settings-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-backdrop-fade touch-none"
        onClick={() => {
          if (!isSaving) {
            playClick();
            onClose();
          }
        }}
        aria-hidden="true"
      />

      {/* Bottom Sheet / Modal Dialog */}
      <div 
        className="relative z-10 w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl p-4 sm:p-6 pt-3 animate-slide-up max-h-[90vh] overflow-y-auto overscroll-contain pb-[max(env(safe-area-inset-bottom),1.25rem)] space-y-5 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Pill */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 id="quiz-settings-title" className="text-base font-bold text-slate-900 dark:text-white">
                Pengaturan Kuis
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Konfigurasi visibilitas, waktu, dan kode ruangan
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            disabled={isSaving}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            aria-label="Tutup Pengaturan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quiz Info Summary Pill */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-2xl flex-shrink-0 shadow-xs">
            {quiz.coverEmoji}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
              {quiz.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>{quiz.subject}</span>
              <span>•</span>
              <span>Kelas {quiz.grade}</span>
              <span>•</span>
              <span>{quiz.questions.length} Soal</span>
            </div>
          </div>
        </div>

        {/* SECTION 1: VISIBILITAS KUIS (PUBLIK VS PRIVAT) */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Visibilitas Kuis di Aplikasi
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Opsi Publik */}
            <button
              type="button"
              onClick={() => {
                playClick();
                setVisibility('public');
              }}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all min-h-[88px] ${
                visibility === 'public'
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <Globe className={`w-4 h-4 ${visibility === 'public' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Kuis Publik</span>
                </div>
                {visibility === 'public' && (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Tampil di katalog beranda dan bisa dimainkan langsung oleh seluruh siswa.
              </p>
            </button>

            {/* Opsi Privat */}
            <button
              type="button"
              onClick={() => {
                playClick();
                setVisibility('private');
              }}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all min-h-[88px] ${
                visibility === 'private'
                  ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 dark:border-amber-600 ring-2 ring-amber-500/20 shadow-xs'
                  : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <Lock className={`w-4 h-4 ${visibility === 'private' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Kuis Privat</span>
                </div>
                {visibility === 'private' && (
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Disembunyikan dari beranda. Hanya dapat dibuka via PIN atau tautan khusus.
              </p>
            </button>
          </div>
        </div>

        {/* SECTION 2: WAKTU TIMER PER SOAL */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>Alokasi Waktu per Soal</span>
            </label>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
              {duration} detik
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {TIMER_OPTIONS.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => {
                  playClick();
                  setDuration(sec);
                }}
                className={`py-2 px-2.5 rounded-xl font-bold text-xs transition-all min-h-[44px] flex items-center justify-center border ${
                  duration === sec
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-500/20'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 3: KODE PIN RUANG KUIS */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Kode PIN Ruang Ujian
          </label>

          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 block">
                  PIN Siswa:
                </span>
                <span className="font-mono font-black text-lg text-blue-950 dark:text-blue-100 tracking-wider">
                  {pin}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={handleRandomizePin}
                className="flex-1 sm:flex-initial py-2 px-2.5 rounded-xl font-semibold text-xs text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-750 border border-blue-200 dark:border-blue-800 flex items-center justify-center gap-1 min-h-[40px] transition-colors"
                title="Acak PIN Baru"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Acak PIN</span>
              </button>

              <button
                type="button"
                onClick={handleCopyPin}
                className="flex-1 sm:flex-initial py-2 px-2.5 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1 min-h-[40px] transition-colors"
                title="Salin PIN"
              >
                {copiedType === 'pin' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 sm:flex-initial py-2 px-2.5 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1 min-h-[40px] transition-colors"
                title="Salin Tautan Langsung"
              >
                {copiedType === 'link' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Tautan Tersalin</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Tautan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 4: PINTASAN AKSI KHUSUS */}
        <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Aksi Kuis
          </label>

          <div className="grid grid-cols-2 gap-2">
            {onLaunchSmartboard && (
              <button
                type="button"
                onClick={() => {
                  playClick();
                  onClose();
                  onLaunchSmartboard(quiz);
                }}
                className="py-2.5 px-3 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 flex items-center justify-center gap-1.5 min-h-[44px] transition-colors"
              >
                <Tv className="w-4 h-4 text-indigo-500" />
                <span>Smartboard (IFP)</span>
              </button>
            )}

            {onPrintWorksheet && (
              <button
                type="button"
                onClick={() => {
                  playClick();
                  onClose();
                  onPrintWorksheet(quiz);
                }}
                className="py-2.5 px-3 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 flex items-center justify-center gap-1.5 min-h-[44px] transition-colors"
              >
                <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span>Cetak Lembar LKS</span>
              </button>
            )}
          </div>

          {canDelete && onRequestDelete && (
            <button
              type="button"
              onClick={() => {
                playClick();
                onClose();
                onRequestDelete(quiz);
              }}
              className="w-full py-2.5 px-3 rounded-xl font-semibold text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center gap-1.5 min-h-[44px] transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Kuis Ini dari Bank Soal</span>
            </button>
          )}
        </div>

        {/* MODAL FOOTER: SIMPAN KONFIGURASI */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            disabled={isSaving}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 min-h-[48px] flex items-center justify-center transition-colors"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`flex-2 py-3 px-5 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 min-h-[48px] shadow-sm transition-all btn-press ${
              isSavedSuccess
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : isSavedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Tersimpan!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{hasChanges ? 'Simpan Perubahan' : 'Selesai'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
