import React, { useState, useRef, useEffect } from 'react';
import type { QuestionType } from '../../types/quiz';
import { 
  CheckCircle2, 
  CheckCheck, 
  Type, 
  ArrowLeftRight, 
  ChevronDown, 
  Check 
} from 'lucide-react';

interface QuestionTypeOption {
  type: QuestionType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  badgeClass: string;
}

const QUESTION_TYPE_OPTIONS: QuestionTypeOption[] = [
  {
    type: 'multiple_choice',
    label: 'Pilihan Ganda',
    description: 'Pilihan opsi A, B, C, D (fleksibel)',
    icon: CheckCircle2,
    colorClass: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60',
    badgeClass: 'border-blue-200 dark:border-blue-800/60',
  },
  {
    type: 'true_false',
    label: 'Benar / Salah',
    description: 'Dua pilihan evaluasi pernyataan',
    icon: CheckCheck,
    colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
    badgeClass: 'border-emerald-200 dark:border-emerald-800/60',
  },
  {
    type: 'short_answer',
    label: 'Isian Singkat',
    description: 'Jawaban teks atau angka mandiri',
    icon: Type,
    colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60',
    badgeClass: 'border-amber-200 dark:border-amber-800/60',
  },
  {
    type: 'matching_pairs',
    label: 'Menjodohkan Kartu',
    description: 'Pasangkan kartu sisi kiri dan kanan',
    icon: ArrowLeftRight,
    colorClass: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60',
    badgeClass: 'border-purple-200 dark:border-purple-800/60',
  },
];

interface QuestionTypeDropdownProps {
  value: QuestionType;
  onChange: (type: QuestionType) => void;
  optionsCount?: number;
  disabled?: boolean;
}

export const QuestionTypeDropdown: React.FC<QuestionTypeDropdownProps> = ({
  value,
  onChange,
  optionsCount = 4,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOption = QUESTION_TYPE_OPTIONS.find((opt) => opt.type === value) || QUESTION_TYPE_OPTIONS[0];
  const CurrentIcon = currentOption.icon;

  // Tutup dropdown saat klik di luar elemen atau tombol escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
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

  const handleSelect = (type: QuestionType) => {
    onChange(type);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button yang Estetis & Konsisten */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-between gap-2 transition-all min-h-[44px] text-left btn-press shadow-2xs ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20 dark:border-blue-400'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${currentOption.colorClass} ${currentOption.badgeClass}`}>
            <CurrentIcon className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold truncate">
            {currentOption.label}
            {value === 'multiple_choice' && ` (${optionsCount} Opsi)`}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
          }`}
        />
      </button>

      {/* Popover Menu Pilihan Tipe Soal */}
      {isOpen && (
        <div 
          role="listbox"
          className="absolute left-0 top-full w-full sm:min-w-[320px] mt-1.5 z-50 p-1.5 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xl dark:shadow-slate-950/60 backdrop-blur-md space-y-1 animate-fade-in"
        >
          {QUESTION_TYPE_OPTIONS.map((option) => {
            const isSelected = option.type === value;
            const IconComponent = option.icon;

            return (
              <button
                key={option.type}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.type)}
                className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 text-left transition-all min-h-[44px] group ${
                  isSelected
                    ? 'bg-blue-50/90 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200/80 dark:border-blue-800/60 shadow-2xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${option.colorClass} ${option.badgeClass}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold leading-tight">
                      {option.label}
                      {option.type === 'multiple_choice' && isSelected && ` (${optionsCount} Opsi)`}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
