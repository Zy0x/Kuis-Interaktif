import React from 'react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../lib/navigationHistory';
import { 
  X, 
  Sparkles, 
  Pencil, 
  Zap, 
  ArrowRight
} from 'lucide-react';

interface CreateQuizMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAi: () => void;
  onSelectManual: () => void;
  playClick: () => void;
}

export const CreateQuizMethodModal: React.FC<CreateQuizMethodModalProps> = ({
  isOpen,
  onClose,
  onSelectAi,
  onSelectManual,
  playClick,
}) => {
  useBodyScrollLock(isOpen);
  useBackHandler(
    'create-quiz-method-modal',
    80,
    () => {
      if (isOpen) {
        onClose();
        return true;
      }
      return false;
    },
    isOpen
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0 bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                Pilih Metode Pembuatan Kuis
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Gunakan asisten pintar atau rancang kuis secara manual
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Tutup Jendela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Method Cards */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Option 1: Generator Kilat AI */}
          <button
            type="button"
            onClick={() => {
              playClick();
              onSelectAi();
            }}
            className="w-full text-left p-5 rounded-2xl border-2 border-blue-500/80 dark:border-blue-500/60 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 dark:from-blue-950/30 dark:via-slate-900 dark:to-indigo-950/20 hover:border-blue-600 dark:hover:border-blue-400 shadow-xs hover:shadow-md transition-all group btn-press cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                <Zap className="w-6 h-6 text-amber-300 fill-amber-300" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    ⚡ Generator Kilat AI
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-600 text-white">
                    Rekomendasi
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  Cukup tulis topik materi atau tempel dokumen. Soal kuis langsung diracik otomatis oleh AI di Studio Kuis dan siap Anda tinjau di Bank Soal.
                </p>

                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:gap-2.5 transition-all">
                  <span>Mulai dengan Asisten AI</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </button>

          {/* Option 2: Buat Kuis Manual */}
          <button
            type="button"
            onClick={() => {
              playClick();
              onSelectManual();
            }}
            className="w-full text-left p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md transition-all group btn-press cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Pencil className="w-6 h-6" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    ✏️ Buat Kuis Manual
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    Dari Nol
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  Tulis pertanyaan, opsi jawaban, skor, dan kunci jawaban secara mandiri langkah demi langkah melalui formulir kuis interaktif.
                </p>

                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:gap-2.5 transition-all">
                  <span>Buka Editor Kosong</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-850/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            Kuis tersimpan aman di akun guru
          </span>
          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
          >
            Batal
          </button>
        </div>

      </div>
    </div>
  );
};
