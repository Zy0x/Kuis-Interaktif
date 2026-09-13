import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { Subject, EducationLevel } from '../../types/quiz';
import { ChevronDown, Check, Search, BookOpen } from 'lucide-react';

interface SubjectOption {
  subject: Subject;
  category: 'utama_sd' | 'utama_smp' | 'mipa_sma' | 'ips_sma' | 'umum_sma' | 'seni_bahasa' | 'agama' | 'lintas';
  categoryLabel: string;
  badgeClass: string;
}

const ALL_SUBJECT_OPTIONS: SubjectOption[] = [
  // SD / MI
  { subject: 'Matematika', category: 'utama_sd', categoryLabel: 'SD / SMP / SMA', badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' },
  { subject: 'IPAS', category: 'utama_sd', categoryLabel: 'SD (Fase B-C)', badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
  { subject: 'Bahasa Indonesia', category: 'utama_sd', categoryLabel: 'Wajib Semua Jenjang', badgeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' },
  { subject: 'Pendidikan Pancasila', category: 'utama_sd', categoryLabel: 'Wajib Semua Jenjang', badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' },
  { subject: 'Bahasa Inggris', category: 'utama_sd', categoryLabel: 'SD / SMP / SMA', badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
  { subject: 'PJOK', category: 'utama_sd', categoryLabel: 'Olahraga & Kesehatan', badgeClass: 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300' },
  { subject: 'Pengetahuan Umum', category: 'utama_sd', categoryLabel: 'Wawasan Umum', badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },

  // SMP
  { subject: 'IPA Terpadu', category: 'utama_smp', categoryLabel: 'SMP (Fase D)', badgeClass: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300' },
  { subject: 'IPS Terpadu', category: 'utama_smp', categoryLabel: 'SMP (Fase D)', badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
  { subject: 'Informatika', category: 'utama_smp', categoryLabel: 'SMP & SMA', badgeClass: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300' },
  { subject: 'Prakarya', category: 'utama_smp', categoryLabel: 'SMP & SMA', badgeClass: 'bg-lime-50 text-lime-700 dark:bg-lime-950/60 dark:text-lime-300' },

  // SMA MIPA
  { subject: 'Fisika', category: 'mipa_sma', categoryLabel: 'Peminatan MIPA SMA', badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' },
  { subject: 'Kimia', category: 'mipa_sma', categoryLabel: 'Peminatan MIPA SMA', badgeClass: 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300' },
  { subject: 'Biologi', category: 'mipa_sma', categoryLabel: 'Peminatan MIPA SMA', badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
  { subject: 'Matematika Tingkat Lanjut', category: 'mipa_sma', categoryLabel: 'Peminatan MIPA SMA', badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' },

  // SMA IPS
  { subject: 'Ekonomi', category: 'ips_sma', categoryLabel: 'Peminatan IPS SMA', badgeClass: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300' },
  { subject: 'Sosiologi', category: 'ips_sma', categoryLabel: 'Peminatan IPS SMA', badgeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' },
  { subject: 'Geografi', category: 'ips_sma', categoryLabel: 'Peminatan IPS SMA', badgeClass: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300' },
  { subject: 'Sejarah', category: 'ips_sma', categoryLabel: 'Peminatan IPS SMA', badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
  { subject: 'Antropologi', category: 'ips_sma', categoryLabel: 'Peminatan IPS SMA', badgeClass: 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300' },

  // Seni & Bahasa
  { subject: 'Seni Rupa', category: 'seni_bahasa', categoryLabel: 'Seni & Budaya', badgeClass: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300' },
  { subject: 'Seni Musik', category: 'seni_bahasa', categoryLabel: 'Seni & Budaya', badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' },
  { subject: 'Seni Tari', category: 'seni_bahasa', categoryLabel: 'Seni & Budaya', badgeClass: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-300' },
  { subject: 'Seni Teater', category: 'seni_bahasa', categoryLabel: 'Seni & Budaya', badgeClass: 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300' },
  { subject: 'Bahasa Daerah', category: 'seni_bahasa', categoryLabel: 'Muatan Lokal', badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },

  // Agama
  { subject: 'Pendidikan Agama Islam', category: 'agama', categoryLabel: 'PAI & Budi Pekerti', badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
  { subject: 'Pendidikan Agama Kristen', category: 'agama', categoryLabel: 'PAK & Budi Pekerti', badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' },
  { subject: 'Pendidikan Agama Katolik', category: 'agama', categoryLabel: 'Agama Katolik', badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
  { subject: 'Pendidikan Agama Hindu', category: 'agama', categoryLabel: 'Agama Hindu', badgeClass: 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300' },
  { subject: 'Pendidikan Agama Buddha', category: 'agama', categoryLabel: 'Agama Buddha', badgeClass: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300' },
  { subject: 'Pendidikan Agama Konghucu', category: 'agama', categoryLabel: 'Agama Konghucu', badgeClass: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300' },

  // Lintas
  { subject: 'IPA', category: 'lintas', categoryLabel: 'Sains Umum', badgeClass: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300' },
  { subject: 'IPS', category: 'lintas', categoryLabel: 'Sosial Umum', badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
];

interface SubjectDropdownProps {
  subject: Subject;
  setSubject: (subject: Subject) => void;
  educationLevel: EducationLevel;
  playClick?: () => void;
  disabled?: boolean;
}

export const SubjectDropdown: React.FC<SubjectDropdownProps> = ({
  subject,
  setSubject,
  educationLevel,
  playClick,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'SD' | 'SMP' | 'SMA' | 'semua'>(educationLevel || 'SD');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sinkronkan tab aktif saat dropdown dibuka atau educationLevel berubah
  useEffect(() => {
    if (educationLevel) {
      setActiveTab(educationLevel);
    }
  }, [educationLevel, isOpen]);

  // Cari opsi aktif saat ini
  const currentOption = ALL_SUBJECT_OPTIONS.find((s) => s.subject === subject) || ALL_SUBJECT_OPTIONS[0];

  // Filter daftar mapel berdasarkan query pencarian dan tab jenjang aktif
  const filteredSubjects = useMemo(() => {
    let list = ALL_SUBJECT_OPTIONS;

    // Filter tab jenjang terarah jika tidak ada pencarian kata kunci
    if (!searchQuery.trim()) {
      if (activeTab === 'SD') {
        list = list.filter((s) => ['utama_sd', 'seni_bahasa', 'agama', 'lintas'].includes(s.category));
      } else if (activeTab === 'SMP') {
        list = list.filter(
          (s) =>
            s.subject !== 'IPAS' &&
            ['utama_smp', 'utama_sd', 'seni_bahasa', 'agama', 'lintas'].includes(s.category)
        );
      } else if (activeTab === 'SMA') {
        list = list.filter(
          (s) =>
            !['IPAS', 'IPA Terpadu', 'IPS Terpadu'].includes(s.subject) &&
            ['mipa_sma', 'ips_sma', 'utama_smp', 'utama_sd', 'seni_bahasa', 'agama'].includes(s.category)
        );
      }
      // Jika 'semua', tampilkan seluruh 33 mata pelajaran
    } else {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.subject.toLowerCase().includes(q) ||
          s.categoryLabel.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeTab, searchQuery]);

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
      // Auto-focus ke input pencarian
      setTimeout(() => searchInputRef.current?.focus(), 50);
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
    setSearchQuery('');
  };

  const handleSelectSubject = (s: Subject) => {
    if (playClick) playClick();
    setSubject(s);
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
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold shrink-0 border border-blue-200/60 dark:border-blue-900/50">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">
              {currentOption.subject}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {currentOption.categoryLabel}
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
          className="absolute left-0 top-full w-full mt-1.5 z-50 p-2 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl dark:shadow-slate-950/70 backdrop-blur-md space-y-2 animate-scale-up max-h-[360px] flex flex-col"
        >
          {/* Kolom Pencarian Cepat */}
          <div className="relative shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mata pelajaran..."
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:border-blue-500 focus:outline-none min-h-[44px]"
            />
          </div>

          {/* Filter Tab Jenjang: SD, SMP, SMA, Semua */}
          {!searchQuery.trim() && (
            <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-750 pb-2 shrink-0 overflow-x-auto scrollbar-none">
              {(['SD', 'SMP', 'SMA', 'semua'] as const).map((tab) => {
                const isActive = activeTab === tab;
                const label = tab === 'semua' ? 'Semua' : tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      if (playClick) playClick();
                      setActiveTab(tab);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all min-h-[44px] btn-press flex items-center justify-center ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* List Scrollable Options */}
          <div className="overflow-y-auto space-y-1 no-scrollbar flex-1 pr-0.5">
            {filteredSubjects.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
                Mata pelajaran "{searchQuery}" tidak ditemukan.
              </div>
            ) : (
              filteredSubjects.map((opt) => {
                const isSelected = opt.subject === subject;
                return (
                  <button
                    key={opt.subject}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectSubject(opt.subject)}
                    className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between gap-2 min-h-[44px] btn-press ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold border border-blue-200/70 dark:border-blue-900/60 shadow-2xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{opt.subject}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                        {opt.categoryLabel}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
