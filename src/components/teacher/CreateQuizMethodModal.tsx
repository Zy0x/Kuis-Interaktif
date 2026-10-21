import React from 'react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../lib/navigationHistory';
import { 
  X, 
  Sparkles, 
  Pencil, 
  Zap, 
  ChevronRight,
  CheckCircle2,
  Clock,
  FileText,
  Sliders
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-5 bg-slate-950/65 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playClick();
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-create-quiz-title"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden transition-all duration-200">
        
        {/* Header Bersih & Ramah Pendidik */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0 bg-slate-50/70 dark:bg-slate-850/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <Sparkles className="w-5 h-5 text-blue-100" />
            </div>

            <div className="min-w-0">
              <h2 
                id="modal-create-quiz-title" 
                className="text-base font-extrabold text-slate-900 dark:text-white leading-tight truncate"
              >
                Pilih Cara Membuat Kuis
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                Pilih metode yang paling nyaman untuk Anda hari ini
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            className="w-10 h-10 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px] flex-shrink-0 cursor-pointer"
            aria-label="Tutup Jendela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Kartu Pilihan Ergonomis & Anti-Slop */}
        <div className="p-4 sm:p-5 space-y-3 sm:space-y-3.5">
          
          {/* Opsi 1: Asisten AI (Praktis & Cepat) */}
          <button
            type="button"
            onClick={() => {
              playClick();
              onSelectAi();
            }}
            className="w-full text-left p-4 sm:p-4.5 rounded-2xl border-2 border-blue-200/90 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/20 dark:from-blue-950/25 dark:via-slate-900 dark:to-indigo-950/15 hover:border-blue-500 dark:hover:border-blue-500 shadow-xs hover:shadow-md transition-all group btn-press cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center gap-3.5 sm:gap-4">
              {/* Icon Squircle */}
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs flex-shrink-0 group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 fill-amber-300" />
              </div>

              {/* Konten Utama */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Buat dengan Bantuan AI
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 whitespace-nowrap flex-shrink-0">
                    Praktis & Kilat
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2.5">
                  Ketik topik materi atau tempel bahan ajar. AI menyusun pertanyaan, pilihan jawaban, dan kunci secara instan.
                </p>

                {/* Micro-Chips Manfaat */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/80 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
                    <Clock className="w-3 h-3 text-blue-500" />
                    <span>~15 Detik</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/80 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
                    <FileText className="w-3 h-3 text-indigo-500" />
                    <span>Topik / Dokumen Bebas</span>
                  </span>
                </div>
              </div>

              {/* Panah Aksi Kanan */}
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all flex-shrink-0 hidden xs:flex sm:flex">
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>

          {/* Opsi 2: Buat Manual dari Awal (Kendali Penuh) */}
          <button
            type="button"
            onClick={() => {
              playClick();
              onSelectManual();
            }}
            className="w-full text-left p-4 sm:p-4.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md transition-all group btn-press cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center gap-3.5 sm:gap-4">
              {/* Icon Squircle */}
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Pencil className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>

              {/* Konten Utama */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Tulis Kuis Manual
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap flex-shrink-0">
                    Kendali Penuh
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2.5">
                  Tulis pertanyaan, tentukan opsi jawaban, skor, dan waktu secara leluasa langkah demi langkah di formulir editor.
                </p>

                {/* Micro-Chips Manfaat */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
                    <Sliders className="w-3 h-3 text-slate-500" />
                    <span>Fleksibel & Mandiri</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
                    <FileText className="w-3 h-3 text-slate-500" />
                    <span>Editor Interaktif</span>
                  </span>
                </div>
              </div>

              {/* Panah Aksi Kanan */}
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-700 group-hover:text-white dark:group-hover:bg-slate-200 dark:group-hover:text-slate-900 flex items-center justify-center transition-all flex-shrink-0 hidden xs:flex sm:flex">
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>
        </div>

        {/* Footer Tenang & Menenangkan Psikologis Pendidik */}
        <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-850/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
            <span className="truncate">Soal selalu dapat ditinjau & diedit kembali</span>
          </div>

          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors min-h-[44px] flex-shrink-0 cursor-pointer"
          >
            Batal
          </button>
        </div>

      </div>
    </div>
  );
};
