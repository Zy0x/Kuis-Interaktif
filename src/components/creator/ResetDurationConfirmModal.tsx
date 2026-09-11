import React, { useEffect } from 'react';
import { Clock, ShieldCheck, AlertTriangle, X } from 'lucide-react';

interface ResetDurationConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: 'all' | 'keep_custom') => void;
  durationSec: number;
  customCount: number;
  totalQuestions: number;
  playClick: () => void;
}

export const ResetDurationConfirmModal: React.FC<ResetDurationConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  durationSec,
  customCount,
  totalQuestions,
  playClick,
}) => {
  // Handle keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs overscroll-contain animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-scale-up overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                Penerapan Durasi Soal
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Terdapat durasi waktu khusus pada beberapa soal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-colors btn-press min-h-[44px] min-w-[44px]"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 space-y-3.5">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Terdeteksi <strong className="text-blue-600 dark:text-blue-400">{customCount}</strong> dari{' '}
            <strong>{totalQuestions}</strong> soal saat ini memiliki durasi kustom tersendiri. Pilih bagaimana Anda ingin menerapkan durasi standar (<strong>{durationSec} detik</strong>):
          </p>

          <div className="space-y-2.5">
            {/* Opsi 1: Aman / Parsial */}
            <button
              type="button"
              onClick={() => {
                playClick();
                onConfirm('keep_custom');
                onClose();
              }}
              className="w-full text-left p-3.5 rounded-2xl border-2 border-blue-500/60 hover:border-blue-600 bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 transition-all btn-press group"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                    <span>Hanya Perbarui Soal Durasi Standar</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded">
                      Disarankan
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                    Mempertahankan durasi khusus pada {customCount} butir soal, dan hanya mengatur {durationSec} detik untuk soal-soal sisanya.
                  </div>
                </div>
              </div>
            </button>

            {/* Opsi 2: Timpa Penuh */}
            <button
              type="button"
              onClick={() => {
                playClick();
                onConfirm('all');
                onClose();
              }}
              className="w-full text-left p-3.5 rounded-2xl border border-slate-200 hover:border-amber-400 dark:border-slate-700 dark:hover:border-amber-500/70 bg-white hover:bg-amber-50/40 dark:bg-slate-800 dark:hover:bg-slate-750 transition-all btn-press group"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    Samakan Seluruh {totalQuestions} Soal ({durationSec}s)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    Menghapus seluruh durasi khusus dan menyeragamkan waktu pengerjaan semua soal menjadi {durationSec} detik.
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-xs transition-colors min-h-[44px] btn-press"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};
