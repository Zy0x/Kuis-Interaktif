import React from 'react';
import {
  Volume2,
  Edit3,
  Type,
  Flag,
  ChevronDown,
  ChevronUp,
  Sparkles
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
  onToggleOpen: () => void;
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
  onToggleOpen,
}) => {
  const scaleLabel = textScale === 'xlarge' ? 'A++' : textScale === 'large' ? 'A+' : 'A';

  return (
    <div className="w-full select-none transition-all duration-300">
      {/* 1. Baris Pull-Tab Handle (Saat Tirai Tertutup / Minimalis) */}
      {!isOpen ? (
        <div className="flex items-center justify-between pb-1">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onToggleOpen();
            }}
            className={`group inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all btn-press shadow-2xs ${
              isSpeaking
                ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-400/40'
                : isFlagged
                ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 ring-1 ring-amber-400/40'
                : 'bg-slate-100/90 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
            }`}
            title="Tarik untuk membuka alat bantu belajar siswa"
            aria-label="Buka Tirai Alat Bantu"
            aria-expanded={false}
          >
            {isSpeaking ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            ) : isFlagged ? (
              <Flag className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-12 transition-transform" />
            )}
            <span className="text-[11px] font-bold">
              {isSpeaking ? 'Suara Aktif' : isFlagged ? 'Soal Ditandai' : 'Alat Bantu Siswa'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 group-hover:translate-y-0.5 transition-transform" />
          </button>

          {/* Quick Indicator Badges saat tirai tertutup */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
            {textScale !== 'normal' && (
              <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-mono text-[10px]">
                {scaleLabel}
              </span>
            )}
          </div>
        </div>
      ) : (
        /* 2. Strip Tirai Terbuka (Slide Down Micro-Dock) */
        <div className="rounded-2xl bg-slate-50/95 dark:bg-slate-800/95 border border-slate-200/90 dark:border-slate-750 p-2 sm:p-2.5 shadow-xs backdrop-blur-sm space-y-2 animate-fade-in mb-2">
          {/* Header Tirai dengan Judul & Tombol Tutup */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Tirai Alat Bantu Belajar</span>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onToggleOpen();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 text-xs font-bold transition-colors min-h-[36px] btn-press"
              title="Tutup tirai alat bantu"
              aria-label="Tutup Tirai Alat Bantu"
              aria-expanded={true}
            >
              <span>Tutup</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Grid 4 Alat Bantu Siswa 1-Sentuh */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
            {/* Alat 1: Bacakan Soal (TTS) */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onToggleSpeech();
              }}
              className={`p-2 rounded-xl border flex items-center gap-2 transition-all min-h-[46px] btn-press ${
                isSpeaking
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 shadow-2xs ring-1 ring-emerald-400/40'
                  : 'bg-white dark:bg-slate-750 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title={isSpeaking ? 'Hentikan pembacaan suara' : 'Bacakan soal dalam Bahasa Indonesia'}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isSpeaking ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
              </div>
              <div className="text-left min-w-0 flex-1">
                <div className="text-xs font-bold leading-tight truncate">
                  {isSpeaking ? 'Hentikan' : 'Bacakan'}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal truncate">
                  {isSpeaking ? 'Membaca...' : 'Suara Soal'}
                </div>
              </div>
            </button>

            {/* Alat 2: Kertas Buram (Kanvas Coretan) */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onOpenScratchpad();
              }}
              className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-750 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-all min-h-[46px] btn-press"
              title="Buka kertas buram untuk corat-coret hitungan rumus"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Edit3 className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <div className="text-xs font-bold leading-tight truncate">Kertas Buram</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal truncate">Cakar jari</div>
              </div>
            </button>

            {/* Alat 3: Tandai Ragu-Ragu */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onToggleFlag();
              }}
              className={`p-2 rounded-xl border flex items-center gap-2 transition-all min-h-[46px] btn-press ${
                isFlagged
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 shadow-2xs ring-1 ring-amber-400/40'
                  : 'bg-white dark:bg-slate-750 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title={isFlagged ? 'Hapus tanda ragu' : 'Tandai soal ini untuk dicek ulang'}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isFlagged ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                <Flag className={`w-4 h-4 ${isFlagged ? 'fill-white' : ''}`} />
              </div>
              <div className="text-left min-w-0 flex-1">
                <div className="text-xs font-bold leading-tight truncate">
                  {isFlagged ? 'Ditandai' : 'Tandai Ragu'}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal truncate">
                  {isFlagged ? 'Periksa lagi' : 'Cek nanti'}
                </div>
              </div>
            </button>

            {/* Alat 4: Ukuran Huruf (A / A+ / A++) */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onCycleTextScale();
              }}
              className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-750 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-all min-h-[46px] btn-press"
              title="Ubah ukuran huruf pertanyaan (Normal, Besar, Ekstra Besar)"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Type className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <div className="text-xs font-bold leading-tight truncate">Ukuran Teks</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal truncate">
                  {scaleLabel}
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-black text-[10px] font-mono shrink-0">
                {scaleLabel}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
