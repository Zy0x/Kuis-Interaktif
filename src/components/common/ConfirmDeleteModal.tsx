import React from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { useBackHandler } from '../../lib/navigationHistory';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  quizTitle?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title = 'Hapus Kuis Ini?',
  quizTitle,
  description,
  confirmLabel = 'Ya, Hapus Kuis',
  cancelLabel = 'Batal',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  // Kunci scroll body saat modal terbuka
  useBodyScrollLock(isOpen);

  // Tangani tombol kembali (Android gesture back / history back)
  useBackHandler(
    'confirm-delete-modal',
    110,
    () => {
      if (isOpen && !isLoading) {
        onCancel();
        return true;
      }
      return false;
    },
    isOpen && !isLoading
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 modal-wrapper overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-backdrop-fade touch-none"
        onClick={() => {
          if (!isLoading) onCancel();
        }}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
        aria-hidden="true"
      />

      {/* Card Content */}
      <div
        className="relative z-10 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-pop border border-slate-200 dark:border-slate-800 text-center space-y-3.5 animate-modal-card-in overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon Badge */}
        <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-xs">
          <Trash2 className="w-6 h-6" />
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h4
            id="confirm-delete-title"
            className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight"
          >
            {title}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed px-1">
            {description ? (
              description
            ) : quizTitle ? (
              <>
                Kuis <strong className="text-slate-900 dark:text-white font-bold">&quot;{quizTitle}&quot;</strong> akan dihapus permanen dari daftar kuis dan bank soal. Tindakan ini tidak dapat dibatalkan.
              </>
            ) : (
              'Kuis ini akan dihapus permanen dari daftar kuis. Tindakan ini tidak dapat dibatalkan.'
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-1.5">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[44px] transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 min-h-[44px] transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
