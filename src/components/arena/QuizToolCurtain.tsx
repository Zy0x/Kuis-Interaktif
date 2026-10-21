import React from 'react';
import {
  Volume2,
  Edit3,
  Type,
  Flag,
  Sparkles,
  X,
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
  onOpenSettings?: () => void;
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
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-16 px-3 sm:px-6 overscroll-contain"
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {/* Backdrop (Sentuh di luar untuk menutup tirai) */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-fade-in touch-none cursor-pointer"
        onClick={() => {
          triggerHaptic('light');
          onClose();
        }}
        aria-hidden="true"
      />

      {/* Floating Curtain Drawer / Tray */}
      <div 
        className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-200 dark:border-slate-800 animate-modal-card-in space-y-3.5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Tirai */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Alat Bantu Siswa
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Alat interaktif pendukung pengerjaan soal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
            title="Tutup tirai alat bantu"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Tombol Alat Bantu Interaktif dengan Kontras Tinggi */}
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
          {/* Alat 1: Bacakan Soal (TTS) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onToggleSpeech();
            }}
            className={`p-3 rounded-2xl border flex flex-col justify-between text-left transition-all min-h-[70px] btn-press ${
              isSpeaking
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/30'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-emerald-600 animate-pulse' : 'text-slate-500 dark:text-slate-400'}`} />
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                isSpeaking ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {isSpeaking ? 'Membaca...' : 'Suara'}
              </span>
            </div>
            <div>
              <div className="text-xs font-bold leading-tight">
                {isSpeaking ? 'Hentikan Suara' : 'Bacakan Soal'}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500">Bahasa Indonesia</div>
            </div>
          </button>

          {/* Alat 2: Kertas Buram (Kanvas Coretan) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
              onOpenScratchpad();
            }}
            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 flex flex-col justify-between text-left transition-all min-h-[70px] btn-press"
          >
            <div className="flex items-center justify-between w-full">
              <Edit3 className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                Kanvas
              </span>
            </div>
            <div>
              <div className="text-xs font-bold leading-tight">Kertas Buram</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500">Cakar dengan jari</div>
            </div>
          </button>

          {/* Alat 3: Tandai Ragu */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onToggleFlag();
            }}
            className={`p-3 rounded-2xl border flex flex-col justify-between text-left transition-all min-h-[70px] btn-press ${
              isFlagged
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-700 text-amber-800 dark:text-amber-200 ring-2 ring-amber-500/30'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Flag className={`w-4 h-4 ${isFlagged ? 'text-amber-500 fill-amber-500' : 'text-slate-500 dark:text-slate-400'}`} />
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                isFlagged ? 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {isFlagged ? 'Ditandai' : 'Ragu'}
              </span>
            </div>
            <div>
              <div className="text-xs font-bold leading-tight">{isFlagged ? 'Ditandai Ragu' : 'Tandai Ragu'}</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500">Cek ulang nanti</div>
            </div>
          </button>

          {/* Alat 4: Ukuran Huruf */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onCycleTextScale();
            }}
            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 flex flex-col justify-between text-left transition-all min-h-[70px] btn-press"
          >
            <div className="flex items-center justify-between w-full">
              <Type className="w-4 h-4 text-indigo-500" />
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono">
                {scaleLabel}
              </span>
            </div>
            <div>
              <div className="text-xs font-bold leading-tight">Ukuran Huruf</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500">
                {textScale === 'xlarge' ? 'Ekstra Besar' : textScale === 'large' ? 'Besar' : 'Normal'}
              </div>
            </div>
          </button>
        </div>

        {/* Akses ke Pengaturan Kuis (Tema, SFX, BGM) */}
        {onOpenSettings && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
                onOpenSettings();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-between transition-colors min-h-[44px] btn-press"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Pengaturan Kuis (Tema & Audio)</span>
              </div>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">Buka →</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
