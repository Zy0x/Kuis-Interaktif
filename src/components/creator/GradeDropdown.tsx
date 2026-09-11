import React, { useState, useRef, useEffect } from 'react';
import type { EducationLevel } from '../../types/quiz';
import { ChevronDown, Check, GraduationCap } from 'lucide-react';

export interface GradeOption {
  grade: number;
  level: EducationLevel;
  levelLabel: string;
  fase: string;
  faseDescription: string;
}

export const ALL_GRADE_OPTIONS: GradeOption[] = [
  { grade: 1, level: 'SD', levelLabel: 'SD / MI', fase: 'Fase A', faseDescription: 'Awal Membaca, Menulis & Berhitung' },
  { grade: 2, level: 'SD', levelLabel: 'SD / MI', fase: 'Fase A', faseDescription: 'Penguatan Literasi & Numerasi Dasar' },
  { grade: 3, level: 'SD', levelLabel: 'SD / MI', fase: 'Fase B', faseDescription: 'Pemahaman Konsep & Eksplorasi Lingkungan' },
  { grade: 4, level: 'SD', levelLabel: 'SD / MI', fase: 'Fase B', faseDescription: 'Eksplorasi IPAS & Bernalar Kritis' },
  { grade: 5, level: 'SD', levelLabel: 'SD / MI', fase: 'Fase C', faseDescription: 'Analisis Konseptual & Aplikasi Masalah' },
  { grade: 6, level: 'SD', levelLabel: 'SD / MI', fase: 'Fase C', faseDescription: 'Pemantapan Asesmen & Kelulusan' },
  { grade: 7, level: 'SMP', levelLabel: 'SMP / MTs', fase: 'Fase D', faseDescription: 'Transisi Menengah & Penyelarasan Konsep' },
  { grade: 8, level: 'SMP', levelLabel: 'SMP / MTs', fase: 'Fase D', faseDescription: 'Pendalaman Materi & Analisis Kritis' },
  { grade: 9, level: 'SMP', levelLabel: 'SMP / MTs', fase: 'Fase D', faseDescription: 'Pemantapan Asesmen Akhir Jenjang' },
  { grade: 10, level: 'SMA', levelLabel: 'SMA / SMK', fase: 'Fase E', faseDescription: 'Pengenalan Peminatan & Eksplorasi' },
  { grade: 11, level: 'SMA', levelLabel: 'SMA / SMK', fase: 'Fase F', faseDescription: 'Pendalaman Bidang Keahlian' },
  { grade: 12, level: 'SMA', levelLabel: 'SMA / SMK', fase: 'Fase F', faseDescription: 'Persiapan Ujian & Karir / Kuliah' },
];

interface GradeDropdownProps {
  grade: number;
  setGrade: (grade: number) => void;
  educationLevel: EducationLevel;
  setEducationLevel?: (level: EducationLevel) => void;
  playClick?: () => void;
  disabled?: boolean;
}

export const GradeDropdown: React.FC<GradeDropdownProps> = ({
  grade,
  setGrade,
  educationLevel,
  setEducationLevel,
  playClick,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cari opsi aktif saat ini
  const currentOption = ALL_GRADE_OPTIONS.find((g) => g.grade === grade) || ALL_GRADE_OPTIONS[3];

  // Filter opsi sesuai jenjang aktif
  const filteredOptions = ALL_GRADE_OPTIONS.filter((g) => g.level === educationLevel);

  // Tutup dropdown saat klik di luar elemen atau tombol Escape
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

  const handleToggle = () => {
    if (disabled) return;
    if (playClick) playClick();
    setIsOpen((prev) => !prev);
  };

  const handleSelectGrade = (opt: GradeOption) => {
    if (playClick) playClick();
    setGrade(opt.grade);
    if (setEducationLevel && opt.level !== educationLevel) {
      setEducationLevel(opt.level);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button Custom App-Standard */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-between gap-2.5 transition-all min-h-[44px] text-left btn-press shadow-2xs ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20 dark:border-blue-400'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold shrink-0 border border-purple-200/60 dark:border-purple-900/50">
            <GraduationCap className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black truncate flex items-center gap-1.5">
              <span>Kelas {currentOption.grade} {currentOption.levelLabel}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300">
                {currentOption.fase}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {currentOption.faseDescription}
            </div>
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
          }`}
        />
      </button>

      {/* Popover Menu Custom Standar Aplikasi */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 top-full w-full mt-1.5 z-50 p-1.5 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl dark:shadow-slate-950/70 backdrop-blur-md space-y-1 animate-scale-up max-h-[300px] overflow-y-auto no-scrollbar"
        >
          <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-750">
            Pilihan Kelas {currentOption.levelLabel} (Kurikulum Merdeka)
          </div>

          {filteredOptions.map((opt) => {
            const isSelected = opt.grade === grade;
            return (
              <button
                key={opt.grade}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelectGrade(opt)}
                className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between gap-2 min-h-[44px] btn-press ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold border border-blue-200/70 dark:border-blue-900/60 shadow-2xs'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span>Kelas {opt.grade} {opt.levelLabel}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      isSelected 
                        ? 'bg-blue-200/80 dark:bg-blue-900 text-blue-800 dark:text-blue-200' 
                        : 'bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-400'
                    }`}>
                      {opt.fase}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {opt.faseDescription}
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
