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
  Share2, 
  Printer, 
  Trash2, 
  SlidersHorizontal,
  CopyPlus,
  BarChart3,
  Loader2
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
  const [copiedType, setCopiedType] = useState<'pin' | 'link' | null>(null);
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

  // 4. Status Visibilitas (Publik / Privat)
  const handleToggleVisibility = async (newVisibility: 'public' | 'private') => {
    if (newVisibility === visibility || isUpdatingVisibility) return;
    playClick();
    setVisibility(newVisibility);
    setIsUpdatingVisibility(true);
    try {
      await onSaveSettings(quiz.id, { visibility: newVisibility });
      showToast(newVisibility === 'public' ? 'Visibilitas: Kuis kini Publik' : 'Visibilitas: Kuis kini Privat');
    } catch (err) {
      console.error('Gagal memperbarui visibilitas kuis:', err);
      setVisibility(quiz.visibility || 'public');
      showToast('Gagal mengubah visibilitas.');
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  // 5. Konfigurasi PIN (Acak PIN Baru)
  const handleRandomizePin = async () => {
    if (isRandomizingPin) return;
    playClick();
    setIsRandomizingPin(true);
    const newPin = generateRandomPin();
    setPin(newPin);
    try {
      await onSaveSettings(quiz.id, { pinCode: newPin });
      showToast(`PIN kuis diperbarui ke ${newPin}`);
    } catch (err) {
      console.error('Gagal memperbarui PIN:', err);
      setPin(quiz.pinCode || '1001');
      showToast('Gagal memperbarui PIN.');
    } finally {
      setIsRandomizingPin(false);
    }
  };

  const handleCopyPin = () => {
    playClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pin);
      setCopiedType('pin');
      showToast('PIN tersalin ke papan klip!');
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  const handleCopyLink = () => {
    playClick();
    const url = `${window.location.origin}${window.location.pathname}?pin=${pin}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedType('link');
      showToast('Tautan kuis tersalin!');
      setTimeout(() => setCopiedType(null), 2000);
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

      {/* Bottom Sheet on Mobile / Modal Dialog on Desktop */}
      <div 
        className="relative z-10 w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl p-4 sm:p-6 pt-3 animate-slide-up max-h-[90vh] overflow-y-auto overscroll-contain pb-[max(env(safe-area-inset-bottom),1.25rem)] space-y-4 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Pill */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto sm:hidden mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 id="quiz-settings-title" className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Menu & Pengaturan Kuis
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pusat tindakan dan opsi kuis interaktif
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            disabled={isDuplicating || isUpdatingVisibility}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            aria-label="Tutup Pengaturan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Floating Mini Toast Feedback */}
        {toastMessage && (
          <div className="p-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl text-center shadow-md animate-fade-in">
            {toastMessage}
          </div>
        )}

        {/* Quiz Info Summary Pill */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-750 flex items-center gap-3">
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

        {/* 6 ACTIONS IN TITIK TIGA (SESUAI SPESIFIKASI) */}
        <div className="space-y-3 pt-1">
          
          {/* 1. DUPLIKAT KUIS */}
          <div className="p-3 bg-slate-50/80 dark:bg-slate-850/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                <CopyPlus className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                  1. Duplikat Kuis
                </h4>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                  Gandakan soal kuis ini dengan PIN baru
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDuplicate}
              disabled={isDuplicating}
              className="px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 min-h-[44px] flex items-center justify-center gap-1.5 transition-colors btn-press flex-shrink-0 shadow-xs whitespace-nowrap"
              title="Gandakan kuis ini"
            >
              {isDuplicating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CopyPlus className="w-4 h-4" />
              )}
              <span>Duplikat</span>
            </button>
          </div>

          {/* 2. LIHAT REKAP NILAI */}
          <div className="p-3 bg-slate-50/80 dark:bg-slate-850/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                  2. Lihat Rekap Nilai
                </h4>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                  Pantau nilai dan analisis jawaban siswa
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleViewSubmissions}
              className="px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 min-h-[44px] flex items-center justify-center gap-1.5 transition-colors btn-press flex-shrink-0 whitespace-nowrap"
              title="Buka laporan rekap nilai kuis ini"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Buka Rekap</span>
            </button>
          </div>

          {/* 3. CETAK LKS */}
          <div className="p-3 bg-slate-50/80 dark:bg-slate-850/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
                <Printer className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                  3. Cetak Lembar LKS
                </h4>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                  Format cetak kertas & kunci PDF
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 min-h-[44px] flex items-center justify-center gap-1.5 transition-colors btn-press flex-shrink-0 whitespace-nowrap"
              title="Cetak lembar kerja siswa untuk kuis ini"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak LKS</span>
            </button>
          </div>

          {/* 4. STATUS VISIBILITAS */}
          <div className="space-y-2 p-3 bg-slate-50/80 dark:bg-slate-850/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span>4. Status Visibilitas</span>
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                visibility === 'public'
                  ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50'
                  : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50'
              }`}>
                {visibility === 'public' ? 'Aktif: Publik' : 'Aktif: Privat'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Pilihan Publik */}
              <button
                type="button"
                onClick={() => handleToggleVisibility('public')}
                disabled={isUpdatingVisibility}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[64px] ${
                  visibility === 'public'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-600 ring-2 ring-emerald-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-750 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Publik
                  </span>
                  {visibility === 'public' && (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Tampil di katalog beranda
                </p>
              </button>

              {/* Pilihan Privat */}
              <button
                type="button"
                onClick={() => handleToggleVisibility('private')}
                disabled={isUpdatingVisibility}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[64px] ${
                  visibility === 'private'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 dark:border-amber-600 ring-2 ring-amber-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-750 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Privat
                  </span>
                  {visibility === 'private' && (
                    <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Hanya via PIN & tautan
                </p>
              </button>
            </div>
          </div>

          {/* 5. KONFIGURASI PIN */}
          <div className="space-y-2 p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-200/80 dark:border-blue-900/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>5. Konfigurasi PIN Siswa</span>
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">
                Akses Langsung
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-blue-200/60 dark:border-blue-800/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    #
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold leading-none">PIN Kuis:</span>
                    <span className="font-mono font-black text-lg text-slate-900 dark:text-white tracking-widest leading-tight">
                      {pin}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                  4 Digit Unik
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={handleRandomizePin}
                  disabled={isRandomizingPin}
                  className="py-2 px-1.5 rounded-xl font-semibold text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center gap-1 min-h-[44px] transition-colors btn-press"
                  title="Acak PIN 4 Digit Baru"
                >
                  <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isRandomizingPin ? 'animate-spin' : ''}`} />
                  <span className="truncate">Acak</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyPin}
                  className="py-2 px-1.5 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1 min-h-[44px] transition-colors btn-press"
                  title="Salin PIN ke Papan Klip"
                >
                  {copiedType === 'pin' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="truncate">{copiedType === 'pin' ? 'Tersalin' : 'Salin PIN'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-2 px-1.5 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1 min-h-[44px] transition-colors btn-press"
                  title="Salin Tautan Siswa"
                >
                  {copiedType === 'link' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="truncate">{copiedType === 'link' ? 'Tersalin' : 'Tautan'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 6. HAPUS KUIS */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canDelete}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 min-h-[44px] border transition-all ${
                canDelete
                  ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/50 btn-press'
                  : 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
              title={canDelete ? 'Hapus kuis ini dari bank soal' : 'Anda tidak memiliki wewenang menghapus kuis ini'}
            >
              <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>6. Hapus Kuis Ini dari Bank Soal</span>
            </button>
          </div>
        </div>

        {/* Footer Close Button */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors min-h-[44px] flex items-center justify-center"
          >
            Tutup Menu
          </button>
        </div>
      </div>
    </div>
  );
};
