import React, { useState, useEffect } from 'react';
import type { Quiz } from '../../types/quiz';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../lib/navigationHistory';
import { generateRandomPin } from '../../lib/supabaseClient';
import { 
  X, 
  Globe, 
  Lock, 
  KeyRound, 
  RefreshCw, 
  Copy, 
  Check, 
  Printer, 
  Trash2, 
  CopyPlus,
  BarChart3,
  Loader2,
  ChevronRight
} from 'lucide-react';

export interface QuizSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz | null;
  onDuplicate: (quiz: Quiz) => Promise<void> | void;
  onViewSubmissions?: (quiz: Quiz) => void;
  onPrintWorksheet: (quiz: Quiz) => void;
  onSaveSettings: (quizId: string, updates: Partial<Quiz>) => Promise<void>;
  onRequestDelete?: (quiz: Quiz) => void;
  canDelete?: boolean;
  playClick: () => void;
}

export const QuizSettingsModal: React.FC<QuizSettingsModalProps> = ({
  isOpen,
  onClose,
  quiz,
  onDuplicate,
  onViewSubmissions,
  onPrintWorksheet,
  onSaveSettings,
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
  const [pin, setPin] = useState<string>('1001');
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [isRandomizingPin, setIsRandomizingPin] = useState(false);
  const [isCopiedPin, setIsCopiedPin] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sinkronisasi state lokal dengan data kuis saat modal terbuka
  useEffect(() => {
    if (quiz) {
      setVisibility(quiz.visibility || 'public');
      setPin(quiz.pinCode || '1001');
      setIsDuplicating(false);
      setIsUpdatingVisibility(false);
      setIsRandomizingPin(false);
      setToastMessage(null);
    }
  }, [quiz]);

  if (!isOpen || !quiz) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // 1. Duplikat Kuis
  const handleDuplicate = async () => {
    playClick();
    setIsDuplicating(true);
    try {
      await onDuplicate(quiz);
      showToast('Kuis berhasil diduplikasi!');
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      console.error('Gagal menduplikasi kuis:', err);
      showToast('Gagal menduplikasi kuis.');
    } finally {
      setIsDuplicating(false);
    }
  };

  // 2. Lihat Rekap Nilai
  const handleViewSubmissions = () => {
    playClick();
    onClose();
    if (onViewSubmissions) {
      onViewSubmissions(quiz);
    }
  };

  // 3. Cetak LKS
  const handlePrint = () => {
    playClick();
    onClose();
    onPrintWorksheet(quiz);
  };

  // 4. Status Visibilitas
  const handleToggleVisibility = async () => {
    const nextVisibility = visibility === 'public' ? 'private' : 'public';
    playClick();
    setVisibility(nextVisibility);
    setIsUpdatingVisibility(true);
    try {
      await onSaveSettings(quiz.id, { visibility: nextVisibility });
      showToast(nextVisibility === 'public' ? 'Visibilitas: Publik' : 'Visibilitas: Privat');
    } catch (err) {
      console.error('Gagal mengubah visibilitas:', err);
      setVisibility(quiz.visibility || 'public');
      showToast('Gagal mengubah visibilitas.');
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  // 5. Konfig PIN: Acak
  const handleRandomizePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRandomizingPin) return;
    playClick();
    setIsRandomizingPin(true);
    const newPin = generateRandomPin();
    setPin(newPin);
    try {
      await onSaveSettings(quiz.id, { pinCode: newPin });
      showToast(`PIN baru: ${newPin}`);
    } catch (err) {
      console.error('Gagal memperbarui PIN:', err);
      setPin(quiz.pinCode || '1001');
      showToast('Gagal memperbarui PIN.');
    } finally {
      setIsRandomizingPin(false);
    }
  };

  // 5. Konfig PIN: Salin
  const handleCopyPin = (e: React.MouseEvent) => {
    e.stopPropagation();
    playClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pin);
      setIsCopiedPin(true);
      showToast('PIN tersalin!');
      setTimeout(() => setIsCopiedPin(false), 2000);
    }
  };

  // 6. Hapus Kuis
  const handleDelete = () => {
    playClick();
    onClose();
    if (onRequestDelete) {
      onRequestDelete(quiz);
    }
  };

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
          if (!isDuplicating && !isUpdatingVisibility) {
            playClick();
            onClose();
          }
        }}
        aria-hidden="true"
      />

      {/* Action Sheet / Settings Modal */}
      <div 
        className="relative z-10 w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl p-4 sm:p-5 pt-3 animate-slide-up max-h-[85vh] overflow-y-auto overscroll-contain pb-[max(env(safe-area-inset-bottom),1.25rem)] space-y-3 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Pill */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto sm:hidden mb-1" />

        {/* Minimalist Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <span className="text-xl p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0">
              {quiz.coverEmoji}
            </span>
            <div className="min-w-0">
              <h3 id="quiz-settings-title" className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {quiz.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Kelas {quiz.grade} • {quiz.questions.length} Soal
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            disabled={isDuplicating || isUpdatingVisibility}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="py-1.5 px-3 bg-blue-600 text-white text-xs font-semibold rounded-xl text-center shadow-md animate-fade-in">
            {toastMessage}
          </div>
        )}

        {/* Settings Action List */}
        <div className="bg-slate-50/70 dark:bg-slate-850/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-200/60 dark:divide-slate-800 overflow-hidden">
          
          {/* 1. Duplikat */}
          <button
            type="button"
            onClick={handleDuplicate}
            disabled={isDuplicating}
            className="w-full px-3.5 py-3 flex items-center justify-between hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors text-left min-h-[48px] btn-press"
          >
            <div className="flex items-center gap-3">
              <CopyPlus className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                Duplikat
              </span>
            </div>
            {isDuplicating ? (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* 2. Lihat Rekap */}
          <button
            type="button"
            onClick={handleViewSubmissions}
            className="w-full px-3.5 py-3 flex items-center justify-between hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors text-left min-h-[48px] btn-press"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                Lihat Rekap
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* 3. Cetak LKS */}
          <button
            type="button"
            onClick={handlePrint}
            className="w-full px-3.5 py-3 flex items-center justify-between hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors text-left min-h-[48px] btn-press"
          >
            <div className="flex items-center gap-3">
              <Printer className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                Cetak LKS
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* 4. Status Visibilitas */}
          <button
            type="button"
            onClick={handleToggleVisibility}
            disabled={isUpdatingVisibility}
            className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors text-left min-h-[48px] btn-press"
          >
            <div className="flex items-center gap-3">
              {visibility === 'public' ? (
                <Globe className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <Lock className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400 shrink-0" />
              )}
              <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                Status Visibilitas
              </span>
            </div>
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                visibility === 'public'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${visibility === 'public' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{visibility === 'public' ? 'Publik' : 'Privat'}</span>
            </span>
          </button>

          {/* 5. Konfig PIN */}
          <div className="px-3.5 py-2 flex items-center justify-between min-h-[48px] gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <KeyRound className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 shrink-0">
                PIN:
              </span>
              <span className="font-mono font-bold text-sm px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 tracking-wider">
                {pin}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleRandomizePin}
                disabled={isRandomizingPin}
                className="px-2.5 py-1.5 rounded-xl font-semibold text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 min-h-[44px] transition-colors btn-press"
                title="Acak PIN"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRandomizingPin ? 'animate-spin' : ''}`} />
                <span>Acak</span>
              </button>

              <button
                type="button"
                onClick={handleCopyPin}
                className="px-2.5 py-1.5 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 flex items-center gap-1 min-h-[44px] transition-colors btn-press"
                title="Salin PIN"
              >
                {isCopiedPin ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{isCopiedPin ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* 6. Hapus Kuis (Destructive Action Row) */}
        {canDelete && (
          <div className="pt-1">
            <button
              type="button"
              onClick={handleDelete}
              className="w-full px-3.5 py-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200/80 dark:border-rose-900/60 flex items-center justify-between text-rose-600 dark:text-rose-400 transition-colors min-h-[48px] btn-press"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                <span className="font-semibold text-xs sm:text-sm text-rose-700 dark:text-rose-300">
                  Hapus Kuis
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400/60" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
