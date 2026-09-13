import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Edit3, SlidersHorizontal } from 'lucide-react';

export interface TrueFalsePreset {
  label: string;
  opt0: string;
  opt1: string;
}

export const TRUE_FALSE_PRESETS: TrueFalsePreset[] = [
  { label: 'Benar / Salah', opt0: 'Benar', opt1: 'Salah' },
  { label: 'Sesuai / Tidak Sesuai', opt0: 'Sesuai', opt1: 'Tidak Sesuai' },
  { label: 'Ya / Tidak', opt0: 'Ya', opt1: 'Tidak' },
  { label: 'Fakta / Opini', opt0: 'Fakta', opt1: 'Opini' },
  { label: 'Setuju / Tidak Setuju', opt0: 'Setuju', opt1: 'Tidak Setuju' },
];

interface TrueFalsePresetDropdownProps {
  currentOptions: string[];
  isCustom: boolean;
  onSelectPreset: (preset: TrueFalsePreset) => void;
  onSelectCustom: () => void;
  playClick?: () => void;
  disabled?: boolean;
}

export const TrueFalsePresetDropdown: React.FC<TrueFalsePresetDropdownProps> = ({
  currentOptions,
  isCustom,
  onSelectPreset,
  onSelectCustom,
  playClick,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cari preset yang aktif berdasarkan teks opsi
  const activePreset = !isCustom
    ? TRUE_FALSE_PRESETS.find(
        (p) =>
          (currentOptions[0] || '').trim().toLowerCase() === p.opt0.toLowerCase() &&
          (currentOptions[1] || '').trim().toLowerCase() === p.opt1.toLowerCase()
      ) || TRUE_FALSE_PRESETS[0]
    : null;

  const currentLabel = isCustom ? 'Kustom Teks' : activePreset?.label || 'Benar / Salah';

  // Tutup dropdown saat klik di luar elemen atau tombol Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    if (playClick) playClick();
    setIsOpen((prev) => !prev);
  };

  const handleChoosePreset = (preset: TrueFalsePreset) => {
    if (playClick) playClick();
    onSelectPreset(preset);
    setIsOpen(false);
  };

  const handleChooseCustom = () => {
    if (playClick) playClick();
    onSelectCustom();
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Tombol Utama Dropdown (Trigger) */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Pilih Preset Pasangan Benar / Salah"
        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] flex items-center gap-2 border shadow-2xs btn-press ${
          isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
            : isCustom
            ? 'bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/80 hover:bg-blue-100/70'
            : 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
        <span className="font-black truncate max-w-[140px] xs:max-w-[170px]">
          {currentLabel}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
          }`}
        />
      </button>

      {/* Floating Menu Popover */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 mt-1.5 w-56 sm:w-60 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
            Preset Pilihan Cepat
          </div>

          <div className="space-y-0.5">
            {TRUE_FALSE_PRESETS.map((preset) => {
              const isSelected = !isCustom && activePreset?.label === preset.label;
              return (
                <button
                  key={preset.label}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleChoosePreset(preset)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-between min-h-[44px] ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-black'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{preset.label}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Opsi Kustom Teks */}
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              role="option"
              aria-selected={isCustom}
              onClick={handleChooseCustom}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-between min-h-[44px] ${
                isCustom
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Edit3 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Kustom Teks Sendiri...</span>
              </div>
              {isCustom && (
                <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-2" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
