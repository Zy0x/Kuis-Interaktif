import React, { useState } from 'react';
import {
  Calculator,
  X,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Users
} from 'lucide-react';
import { triggerHaptic } from '../../lib/mobileUtils';

interface RecalculateScoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  quizTitle: string;
  pinCode: string;
  participantCount: number;
}

export const RecalculateScoresModal: React.FC<RecalculateScoresModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  quizTitle,
  pinCode,
  participantCount,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExecute = async () => {
    triggerHaptic('medium');
    setIsLoading(true);
    try {
      await onConfirm();
      setIsSuccess(true);
      triggerHaptic('success');
      setTimeout(() => {
        setIsSuccess(false);
        setIsLoading(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Gagal menghitung ulang skor:', err);
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recalc-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 id="recalc-modal-title" className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Hitung Ulang Nilai Sesi
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Sinkronisasi Kunci Jawaban & Skor
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-3.5">
          {/* Info Card */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Kuis:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                {quizTitle}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">PIN Sesi:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                {pinCode}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Jumlah Siswa:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                {participantCount} siswa
              </span>
            </div>
          </div>

          {/* Explanation Box */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-950 dark:text-blue-200 leading-relaxed">
              <span className="font-bold block mb-0.5">Jawaban Siswa Tetap Utuh:</span>
              Sistem akan menghitung ulang skor dan jumlah jawaban benar seluruh siswa berdasarkan butir soal dan kunci jawaban yang berlaku saat ini. Tidak ada data pengerjaan siswa yang terhapus.
            </div>
          </div>

          {isSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>Nilai seluruh siswa berhasil dihitung ulang dan disinkronkan!</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 min-h-[44px] transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleExecute}
            disabled={isLoading || isSuccess}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 min-h-[44px] flex items-center gap-1.5 shadow-sm btn-press transition-colors"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Menghitung Ulang...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Selesai!</span>
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4" />
                <span>Mulai Hitung Ulang</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
