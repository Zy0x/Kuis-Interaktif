import React from 'react';
import {
  Volume2,
  Edit3,
  Type,
  Flag,
  Settings
} from 'lucide-react';
import { triggerHaptic } from '../../lib/mobileUtils';

export type QuestionTextScale = 'normal' | 'large' | 'xlarge';

interface QuizToolCurtainProps {
  isSpeaking: boolean;
  onToggleSpeech: () => void;
  onOpenScratchpad: () => void;
  textScale: QuestionTextScale;
  onCycleTextScale: () => void;
  isFlagged: boolean;
  onToggleFlag: () => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const QuizToolCurtain: React.FC<QuizToolCurtainProps> = ({
  isSpeaking,
  onToggleSpeech,
  onOpenScratchpad,
  textScale,
  onCycleTextScale,
  isFlagged,
  onToggleFlag,
  isOpen,
  onClose,
  onOpenSettings,
}) => {
  if (!isOpen) return null;

  const scaleLabel = textScale === 'xlarge' ? 'A++' : textScale === 'large' ? 'A+' : 'A';

  return (
    <div className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm z-30 transition-all duration-200 animate-slide-down">
      <div className="max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto px-2 sm:px-4 py-1.5">
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {/* 1. Suara Bacakan Soal (TTS) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onToggleSpeech();
            }}
            className={`py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 min-h-[46px] border transition-all btn-press ${
              isSpeaking
                ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-400/40'
                : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
            }`}
            title={isSpeaking ? 'Hentikan pembacaan suara' : 'Bacakan soal (Bahasa Indonesia)'}
            aria-label="Bacakan Soal"
          >
            <Volume2 className={`w-4 h-4 shrink-0 ${isSpeaking ? 'text-emerald-600 dark:text-emerald-400 animate-pulse' : 'text-slate-500 dark:text-slate-400'}`} />
            <span className="text-[10px] sm:text-[11px] font-bold leading-none truncate max-w-full">
              {isSpeaking ? 'Membaca' : 'Suara'}
            </span>
          </button>

          {/* 2. Kertas Buram (Kanvas) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
              onOpenScratchpad();
            }}
            className="py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 min-h-[46px] border border-slate-200/90 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 hover:text-blue-600 dark:hover:text-blue-400 transition-all btn-press"
            title="Buka kertas buram kanvas untuk mencakar hitungan"
            aria-label="Kertas Buram"
          >
            <Edit3 className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-bold leading-none truncate max-w-full">
              Buram
            </span>
          </button>

          {/* 3. Tandai Ragu-Ragu */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onToggleFlag();
            }}
            className={`py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 min-h-[46px] border transition-all btn-press ${
              isFlagged
                ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 ring-1 ring-amber-400/40'
                : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
            }`}
            title={isFlagged ? 'Hapus tanda ragu' : 'Tandai soal untuk diperiksa ulang'}
            aria-label="Tandai Ragu"
          >
            <Flag className={`w-4 h-4 shrink-0 ${isFlagged ? 'text-amber-500 fill-amber-500' : 'text-slate-500 dark:text-slate-400'}`} />
            <span className="text-[10px] sm:text-[11px] font-bold leading-none truncate max-w-full">
              {isFlagged ? 'Ditandai' : 'Ragu'}
            </span>
          </button>

          {/* 4. Ukuran Huruf (A / A+ / A++) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onCycleTextScale();
            }}
            className="py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 min-h-[46px] border border-slate-200/90 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all btn-press"
            title="Ubah ukuran teks pertanyaan (Normal, Besar, Ekstra Besar)"
            aria-label="Ukuran Teks"
          >
            <div className="flex items-center gap-0.5">
              <Type className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {scaleLabel}
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold leading-none truncate max-w-full">
              Huruf
            </span>
          </button>

          {/* 5. Pengaturan (Settings Bottom Sheet) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
              onOpenSettings();
            }}
            className="py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 min-h-[46px] border border-slate-200/90 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 hover:text-purple-600 dark:hover:text-purple-400 transition-all btn-press"
            title="Buka pengaturan tema, suara, musik & layar penuh"
            aria-label="Pengaturan Kuis"
          >
            <Settings className="w-4 h-4 text-purple-500 dark:text-purple-400 shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-bold leading-none truncate max-w-full">
              Pengaturan
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
