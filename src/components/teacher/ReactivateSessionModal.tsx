import React, { useState, useEffect } from 'react';
import type { QuizSession } from '../../types/quiz';
import { RotateCcw, Calendar, Clock, X, CheckCircle2, Sparkles } from 'lucide-react';
import { formatIndonesianFullDeadline } from '../../lib/deadlineUtils';

interface ReactivateSessionModalProps {
  session: QuizSession | null;
  isOpen: boolean;
  onClose: () => void;
  onReactivate: (sessionId: string, newDeadlineIso: string | null) => Promise<void>;
  playClick?: () => void;
}

export const ReactivateSessionModal: React.FC<ReactivateSessionModalProps> = ({
  session,
  isOpen,
  onClose,
  onReactivate,
  playClick = () => {},
}) => {
  if (!isOpen || !session) return null;

  const isSelfPaced = session.settings?.executionMode === 'self_paced';

  // Helper untuk mendapatkan string input datetime-local (YYYY-MM-DDTHH:mm)
  const computeInitialDate = (daysAhead: number = 2) => {
    const target = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    target.setHours(23, 59, 0, 0);
    const tzOffset = target.getTimezoneOffset() * 60000;
    return new Date(target.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [deadlineMode, setDeadlineMode] = useState<'preset' | 'custom' | 'unlimited'>('preset');
  const [selectedPresetDays, setSelectedPresetDays] = useState<number>(2);
  const [customDateTime, setCustomDateTime] = useState<string>(() => computeInitialDate(2));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSelectedPresetDays(2);
    setDeadlineMode('preset');
    setCustomDateTime(computeInitialDate(2));
  }, [session.id]);

  const handlePresetSelect = (days: number) => {
    playClick();
    setSelectedPresetDays(days);
    setDeadlineMode('preset');
    setCustomDateTime(computeInitialDate(days));
  };

  const handleUnlimitedSelect = () => {
    playClick();
    setDeadlineMode('unlimited');
  };

  const handleCustomDateChange = (val: string) => {
    setCustomDateTime(val);
    setDeadlineMode('custom');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    setIsSubmitting(true);

    try {
      let resolvedDeadlineIso: string | null = null;

      if (isSelfPaced) {
        if (deadlineMode === 'preset') {
          const target = new Date(Date.now() + selectedPresetDays * 24 * 60 * 60 * 1000);
          target.setHours(23, 59, 59, 999);
          resolvedDeadlineIso = target.toISOString();
        } else if (deadlineMode === 'custom' && customDateTime) {
          resolvedDeadlineIso = new Date(customDateTime).toISOString();
        } else if (deadlineMode === 'unlimited') {
          resolvedDeadlineIso = null;
        }
      }

      await onReactivate(session.id, resolvedDeadlineIso);
      onClose();
    } catch (err) {
      console.error('Failed to reactivate session:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reactivate-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-300/90 dark:border-slate-800 p-5 sm:p-7 space-y-5 animate-scale-up">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center shadow-xs flex-shrink-0">
              <RotateCcw className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-0.5 border border-emerald-300/70 dark:border-emerald-800">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span>Buka Kembali Kuis</span>
              </div>
              <h3 id="reactivate-modal-title" className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                Aktifkan Kembali Sesi Kuis
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            disabled={isSubmitting}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ringkasan Sesi Kuis */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-300/80 dark:border-slate-700/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="font-black text-sm text-slate-900 dark:text-white truncate max-w-[280px]">
              {session.quizTitle}
            </div>
            <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
              PIN {session.pinCode}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <span>Mode: <strong className="text-slate-700 dark:text-slate-200">{isSelfPaced ? 'Mandiri / PR' : 'Dipandu Guru'}</strong></span>
            <span>•</span>
            <span>Data Siswa: <strong className="text-emerald-600 dark:text-emerald-400">{session.participants?.length || 0} Siswa</strong></span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1.5 border-t border-slate-200/90 dark:border-slate-700/60">
            Siswa dapat kembali memasukkan PIN <strong>{session.pinCode}</strong> untuk bergabung atau mengulang pengerjaan kuis. Rekapitulasi pengerjaan sebelumnya tetap tersimpan secara aman.
          </p>
        </div>

        {/* Pilihan Durasi & Batas Waktu Baru (Khusus Mode Mandiri / PR) */}
        {isSelfPaced && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Pilih Masa Aktif Kuis Baru:</span>
                </span>
                <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                  {deadlineMode === 'unlimited' ? 'Tanpa batas waktu' : 'Batas pengerjaan'}
                </span>
              </label>

              {/* Preset Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handlePresetSelect(2)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center min-h-[48px] shadow-2xs ${
                    deadlineMode === 'preset' && selectedPresetDays === 2
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-950/20'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300/80 dark:border-slate-700 hover:border-emerald-500/50'
                  }`}
                >
                  <span className="text-xs">2 Hari</span>
                  <span className="text-[9px] opacity-80">(Rekomendasi)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetSelect(1)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center min-h-[48px] shadow-2xs ${
                    deadlineMode === 'preset' && selectedPresetDays === 1
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-950/20'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300/80 dark:border-slate-700 hover:border-emerald-500/50'
                  }`}
                >
                  <span className="text-xs">1 Hari</span>
                  <span className="text-[9px] opacity-80">24 Jam</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetSelect(3)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center min-h-[48px] shadow-2xs ${
                    deadlineMode === 'preset' && selectedPresetDays === 3
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-950/20'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300/80 dark:border-slate-700 hover:border-emerald-500/50'
                  }`}
                >
                  <span className="text-xs">3 Hari</span>
                  <span className="text-[9px] opacity-80">72 Jam</span>
                </button>

                <button
                  type="button"
                  onClick={handleUnlimitedSelect}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center min-h-[48px] shadow-2xs ${
                    deadlineMode === 'unlimited'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-950/20'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300/80 dark:border-slate-700 hover:border-emerald-500/50'
                  }`}
                >
                  <span className="text-xs">Bebas</span>
                  <span className="text-[9px] opacity-80">Tanpa Batas</span>
                </button>
              </div>
            </div>

            {/* Custom Date Input */}
            {deadlineMode !== 'unlimited' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Waktu Berakhir Spesifik:</span>
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    {formatIndonesianFullDeadline(customDateTime ? new Date(customDateTime).toISOString() : undefined)}
                  </span>
                </label>
                <input
                  type="datetime-local"
                  value={customDateTime}
                  onChange={(e) => handleCustomDateChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 min-h-[44px] shadow-2xs"
                />
              </div>
            )}

            {/* Tombol Aksi */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  onClose();
                }}
                disabled={isSubmitting}
                className="py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs min-h-[44px] transition-colors border border-slate-300/80 dark:border-slate-700 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs min-h-[44px] shadow-md shadow-emerald-950/30 flex items-center justify-center gap-2 transition-all btn-press disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Mengaktifkan...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aktifkan Sesi Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Jika mode dipandu guru (teacher_led) */}
        {!isSelfPaced && (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300/80 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs flex items-center gap-2.5 shadow-2xs">
              <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span>Sesi ini berada dalam mode interaktif langsung di kelas. Sesi akan dibuka kembali ke ruang tunggu murid.</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  onClose();
                }}
                disabled={isSubmitting}
                className="py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs min-h-[44px] transition-colors border border-slate-300/80 dark:border-slate-700 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs min-h-[44px] shadow-md shadow-emerald-950/30 flex items-center justify-center gap-2 transition-all btn-press disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Mengaktifkan...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aktifkan Sesi Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
