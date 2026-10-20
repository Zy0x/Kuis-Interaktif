import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2,
  Edit3,
  Type,
  Flag,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { triggerHaptic } from '../../lib/mobileUtils';

export type QuestionTextScale = 'normal' | 'large' | 'xlarge';

interface QuizToolDockProps {
  // TTS
  isSpeaking: boolean;
  onToggleSpeech: () => void;
  // Scratchpad
  onOpenScratchpad: () => void;
  // Font Size
  textScale: QuestionTextScale;
  onCycleTextScale: () => void;
  // Flag Question
  isFlagged: boolean;
  onToggleFlag: () => void;
  // Styling
  isDark?: boolean;
}

export const QuizToolDock: React.FC<QuizToolDockProps> = ({
  isSpeaking,
  onToggleSpeech,
  onOpenScratchpad,
  textScale,
  onCycleTextScale,
  isFlagged,
  onToggleFlag,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dockRef = useRef<HTMLDivElement | null>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const scaleLabel = textScale === 'xlarge' ? 'A++' : textScale === 'large' ? 'A+' : 'A';

  return (
    <div ref={dockRef} className="relative z-30 inline-block">
      {/* Tombol Utama Compact FAB Dock */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic('light');
          setIsOpen((prev) => !prev);
        }}
        className={`h-9 px-2.5 sm:px-3 rounded-xl flex items-center gap-1.5 transition-all text-xs font-bold border shadow-xs min-h-[44px] btn-press ${
          isOpen || isSpeaking || isFlagged
            ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20'
            : 'bg-white/90 dark:bg-slate-850/90 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title="Alat Bantu Pengerjaan Kuis"
        aria-label="Buka Menu Alat Bantu Kuis"
        aria-expanded={isOpen}
      >
        {isSpeaking ? (
          <Volume2 className="w-4 h-4 text-white animate-pulse" />
        ) : isFlagged ? (
          <Flag className="w-4 h-4 text-amber-300 fill-amber-300" />
        ) : (
          <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
        )}
        <span className="hidden xs:inline">Alat</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Tray Alat Bantu — Compact, Minimalis, Floating */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-2 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-1 animate-fade-in origin-top-right">
          
          <div className="px-2.5 py-1 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
            Alat Bantu Siswa
          </div>

          {/* 1. Suara Bacakan Soal (TTS) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onToggleSpeech();
            }}
            className={`w-full p-2 rounded-xl flex items-center justify-between text-xs font-bold transition-colors min-h-[40px] btn-press ${
              isSpeaking
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSpeaking ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                {isSpeaking ? <Volume2 className="w-4 h-4 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
              </div>
              <div className="text-left">
                <div className="leading-tight">{isSpeaking ? 'Hentikan Suara' : 'Bacakan Soal'}</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                  {isSpeaking ? 'Sedang membacakan...' : 'Suara Bahasa Indonesia'}
                </div>
              </div>
            </div>
          </button>

          {/* 2. Kertas Buram Digital (Scratchpad Canvas) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setIsOpen(false);
              onOpenScratchpad();
            }}
            className="w-full p-2 rounded-xl flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[40px] btn-press"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Edit3 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="leading-tight">Kertas Buram</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Cakar hitungan dengan jari</div>
              </div>
            </div>
          </button>

          {/* 3. Pengatur Ukuran Huruf (A / A+ / A++) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onCycleTextScale();
            }}
            className="w-full p-2 rounded-xl flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[40px] btn-press"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Type className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="leading-tight">Ukuran Teks</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                  {textScale === 'xlarge' ? 'Ekstra Besar' : textScale === 'large' ? 'Besar' : 'Normal'}
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-extrabold text-[11px]">
              {scaleLabel}
            </span>
          </button>

          {/* 4. Tandai Ragu-Ragu */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onToggleFlag();
            }}
            className={`w-full p-2 rounded-xl flex items-center justify-between text-xs font-bold transition-colors min-h-[40px] btn-press ${
              isFlagged
                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isFlagged ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                <Flag className={`w-4 h-4 ${isFlagged ? 'fill-white' : ''}`} />
              </div>
              <div className="text-left">
                <div className="leading-tight">{isFlagged ? 'Ditandai Ragu' : 'Tandai Ragu-Ragu'}</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Periksa lagi nanti</div>
              </div>
            </div>
            {isFlagged && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>

        </div>
      )}
    </div>
  );
};
