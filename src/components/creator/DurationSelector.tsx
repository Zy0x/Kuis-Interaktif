import React, { useState } from 'react';
import { Clock, Sliders, ChevronDown, ChevronUp, AlertCircle, Minus, Plus } from 'lucide-react';

interface DurationSelectorProps {
  durationSec: number;
  setDurationSec: (sec: number) => void;
  customDurationCount?: number;
  questionsCount: number;
  onRequestResetDuration?: () => void;
  playClick: () => void;
}

const COMMON_PRESETS = [10, 15, 20, 30, 45, 60, 90, 120];

export const DurationSelector: React.FC<DurationSelectorProps> = ({
  durationSec,
  setDurationSec,
  customDurationCount = 0,
  questionsCount,
  onRequestResetDuration,
  playClick,
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handlePresetClick = (val: number) => {
    playClick();
    setDurationSec(val);
  };

  const handleStep = (delta: number) => {
    playClick();
    const next = Math.max(5, Math.min(300, durationSec + delta));
    setDurationSec(next);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (!isNaN(val)) {
      setDurationSec(Math.max(5, Math.min(300, val)));
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Baris Header Kontrol */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
            Durasi Standar Per Soal <span className="text-rose-500">*</span>
          </label>
          <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
            {durationSec}s
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            playClick();
            setShowCustomInput((prev) => !prev);
          }}
          className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 min-h-[44px] py-1 px-1.5"
        >
          <Sliders className="w-3 h-3" />
          <span>{showCustomInput ? 'Tutup Kustom' : 'Atur Detik Bebas'}</span>
          {showCustomInput ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Preset Pills (1 Baris Rapi & Touch Friendly) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {COMMON_PRESETS.map((dur) => {
          const isActive = durationSec === dur;
          return (
            <button
              type="button"
              key={dur}
              onClick={() => handlePresetClick(dur)}
              className={`px-3 py-2 rounded-xl font-black text-xs min-h-[44px] shrink-0 transition-all flex items-center justify-center btn-press ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400/50'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700'
              }`}
            >
              {dur}s
            </button>
          );
        })}
      </div>

      {/* Input Detik Bebas (Collapsible Stepper) */}
      {showCustomInput && (
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 animate-fade-in">
          <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
            Kustom (5 - 300 dtk):
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleStep(-5)}
              disabled={durationSec <= 5}
              className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 disabled:opacity-40 transition-colors btn-press min-h-[44px] min-w-[44px]"
              aria-label="Kurang 5 detik"
            >
              <Minus className="w-4 h-4" />
            </button>

            <input
              type="number"
              min={5}
              max={300}
              value={durationSec}
              onChange={handleInputChange}
              className="w-20 text-center px-2 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black text-xs focus:border-blue-500 focus:outline-none min-h-[44px]"
            />

            <button
              type="button"
              onClick={() => handleStep(5)}
              disabled={durationSec >= 300}
              className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 disabled:opacity-40 transition-colors btn-press min-h-[44px] min-w-[44px]"
              aria-label="Tambah 5 detik"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Banner Waktu Khusus jika ada soal kustom */}
      {customDurationCount > 0 && (
        <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 flex flex-col xs:flex-row xs:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong className="text-amber-700 dark:text-amber-300">{customDurationCount}</strong> dari {questionsCount} soal memiliki durasi khusus.
            </span>
          </div>

          {onRequestResetDuration && (
            <button
              type="button"
              onClick={onRequestResetDuration}
              className="px-3 py-2 rounded-xl font-bold text-xs text-amber-800 dark:text-amber-200 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/60 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors shrink-0 min-h-[44px] flex items-center justify-center btn-press shadow-2xs"
            >
              Samakan Waktu Soal...
            </button>
          )}
        </div>
      )}
    </div>
  );
};
