import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { Subject, GameMode, EducationLevel } from '../../types/quiz';
import { generateAiQuizMetadata } from '../../lib/geminiApi';
import { 
  BookOpen, 
  ArrowLeft, 
  ArrowRight, 
  Globe, 
  Lock,
  CheckCircle2, 
  Clock, 
  Award, 
  Sliders, 
  Sparkles, 
  Loader2,
  Shuffle,
  Dice5,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ResizableTextarea } from '../common/ResizableTextarea';

// Kategori Emoji Edukatif
const EMOJI_CATEGORIES = [
  {
    id: 'sains',
    label: '🔬 Sains & Alam',
    emojis: ['🌱', '🐸', '🔬', '🪐', '🫀', '🌋', '⚡', '🦅', '🌊', '☀️', '🌸', '🍄'],
  },
  {
    id: 'matematika',
    label: '📐 Matematika',
    emojis: ['📐', '📊', '🧮', '🧩', '💡', '🎯', '⚙️', '🔍', '🎲', '🧠'],
  },
  {
    id: 'literasi',
    label: '📚 Bahasa & Seni',
    emojis: ['📚', '📖', '🎨', '🎭', '✍️', '🌍', '🏛️', '🎵', '📜', '🎙️'],
  },
  {
    id: 'prestasi',
    label: '🇮🇩 Karakter & Juara',
    emojis: ['⭐', '🏆', '🥇', '👑', '🚀', '🇮🇩', '🤝', '🛡️', '🌟', '🏅'],
  },
  {
    id: 'sekolah',
    label: '🎒 Sekolah & Fauna',
    emojis: ['🍎', '🦁', '🐯', '🐼', '🦉', '🎒', '⚽', '🎓', '🐬', '🐝'],
  },
];

// Template Deskripsi Cepat untuk Guru
const DESCRIPTION_TEMPLATES = [
  'Pilihlah satu jawaban yang paling tepat pada setiap butir soal.',
  'Kerjakan dengan teliti dan mandiri. Perhatikan durasi timer di layar!',
  'Baca setiap petunjuk soal dengan cermat dan raih lencana prestasi terbaik.',
];

// Durasi Standar Populer
const DURATION_PRESETS = [10, 15, 20, 30, 45, 60, 90, 120];

// Pemetaan Jenjang & Fase Kurikulum Merdeka
const GRADE_FASE_MAP: Record<number, { fase: string; level: EducationLevel; levelLabel: string }> = {
  1: { fase: 'Fase A', level: 'SD', levelLabel: 'SD / MI' },
  2: { fase: 'Fase A', level: 'SD', levelLabel: 'SD / MI' },
  3: { fase: 'Fase B', level: 'SD', levelLabel: 'SD / MI' },
  4: { fase: 'Fase B', level: 'SD', levelLabel: 'SD / MI' },
  5: { fase: 'Fase C', level: 'SD', levelLabel: 'SD / MI' },
  6: { fase: 'Fase C', level: 'SD', levelLabel: 'SD / MI' },
  7: { fase: 'Fase D', level: 'SMP', levelLabel: 'SMP / MTs' },
  8: { fase: 'Fase D', level: 'SMP', levelLabel: 'SMP / MTs' },
  9: { fase: 'Fase D', level: 'SMP', levelLabel: 'SMP / MTs' },
  10: { fase: 'Fase E', level: 'SMA', levelLabel: 'SMA / SMK' },
  11: { fase: 'Fase F', level: 'SMA', levelLabel: 'SMA / SMK' },
  12: { fase: 'Fase F', level: 'SMA', levelLabel: 'SMA / SMK' },
};

// Rekomendasi Gelar Hadiah / Lencana Siswa berdasarkan Mapel
const getBadgeSuggestions = (subj: Subject): string[] => {
  if (subj === 'Matematika' || subj === 'Matematika Tingkat Lanjut') {
    return ['Master Logika', 'Pakar Berhitung', 'Juara Aljabar', 'Bintang Angka'];
  }
  if (['IPA', 'IPAS', 'IPA Terpadu', 'Biologi', 'Fisika', 'Kimia'].includes(subj)) {
    return ['Peneliti Sains Cilik', 'Ahli Ekosistem', 'Saintis Muda', 'Penjelajah Alam'];
  }
  if (['Bahasa Indonesia', 'Bahasa Daerah'].includes(subj)) {
    return ['Pujangga Muda', 'Penutur Hebat', 'Kampiun Literasi', 'Bintang Bahasa'];
  }
  if (subj === 'Bahasa Inggris') {
    return ['Vocabulary Champion', 'English Explorer', 'Global Communicator', 'Master Linguis'];
  }
  if (['Pendidikan Pancasila', 'IPS', 'IPS Terpadu', 'Sejarah', 'Sosiologi', 'Geografi', 'Antropologi'].includes(subj)) {
    return ['Duta Karakter Bangsa', 'Sahabat Pancasila', 'Penjelajah Nusantara', 'Warga Teladan'];
  }
  if (subj.startsWith('Pendidikan Agama')) {
    return ['Bintang Akhlak Mulia', 'Teladan Kebaikan', 'Anak Berbudi Luhur'];
  }
  if (subj === 'PJOK') {
    return ['Atlet Tangguh', 'Juara Bugar', 'Sportif Sejati'];
  }
  if (['Seni Musik', 'Seni Rupa', 'Seni Tari', 'Seni Teater', 'Prakarya'].includes(subj)) {
    return ['Seniman Berbakat', 'Maestro Karya', 'Kreator Inspiratif'];
  }
  if (subj === 'Informatika') {
    return ['Programmer Cilik', 'Master Digital', 'Cyber Explorer'];
  }
  return ['Bintang Pintar', 'Juara Kelas', 'Pakar Pengetahuan', 'Pembelajar Hebat'];
};

interface InfoKuisStepProps {
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  grade: number;
  setGrade: (v: number) => void;
  educationLevel?: EducationLevel;
  setEducationLevel?: (v: EducationLevel) => void;
  subject: Subject;
  setSubject: (v: Subject) => void;
  durationPerQuestionSec: number;
  setDurationPerQuestionSec: (v: number) => void;
  badgeTitle: string;
  setBadgeTitle: (v: string) => void;
  coverEmoji: string;
  setCoverEmoji: (v: string) => void;
  visibility: 'public' | 'private';
  setVisibility: (v: 'public' | 'private') => void;
  defaultGameMode: GameMode;
  setDefaultGameMode: (v: GameMode) => void;
  shuffleQuestions: boolean;
  setShuffleQuestions: (v: boolean) => void;
  shuffleOptions: boolean;
  setShuffleOptions: (v: boolean) => void;
  questionsCount: number;
  customDurationCount?: number;
  onResetAllCustomDuration?: () => void;
  isAiMode: boolean;
  onNext: () => void;
  onBack: () => void;
  playClick: () => void;
}

export const InfoKuisStep: React.FC<InfoKuisStepProps> = ({
  title,
  setTitle,
  description,
  setDescription,
  grade,
  setGrade,
  educationLevel,
  setEducationLevel,
  subject,
  setSubject,
  durationPerQuestionSec,
  setDurationPerQuestionSec,
  badgeTitle,
  setBadgeTitle,
  coverEmoji,
  setCoverEmoji,
  visibility,
  setVisibility,
  defaultGameMode,
  setDefaultGameMode,
  shuffleQuestions,
  setShuffleQuestions,
  shuffleOptions,
  setShuffleOptions,
  questionsCount,
  customDurationCount,
  onResetAllCustomDuration,
  isAiMode,
  onNext,
  onBack,
  playClick,
}) => {
  const isTitleFilled = Boolean(title.trim());
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [isGeneratingAiInfo, setIsGeneratingAiInfo] = useState(false);
  
  // Tab Kategori Emoji & Custom Input Emoji
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('sains');
  const [customEmojiInput, setCustomEmojiInput] = useState('');
  const [showCustomDurationInput, setShowCustomDurationInput] = useState(
    !DURATION_PRESETS.includes(durationPerQuestionSec)
  );

  // Toggle Pratinjau di Mobile
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Jenjang Terpilih
  const currentEducationLevel: EducationLevel = useMemo(() => {
    if (educationLevel) return educationLevel;
    if (grade >= 10) return 'SMA';
    if (grade >= 7) return 'SMP';
    return 'SD';
  }, [educationLevel, grade]);

  // Fase Kurikulum Merdeka saat ini
  const currentFaseInfo = useMemo(() => {
    return GRADE_FASE_MAP[grade] || { fase: 'Fase A-C', level: 'SD', levelLabel: 'SD / MI' };
  }, [grade]);

  // Saran Gelar / Lencana
  const badgeSuggestions = useMemo(() => {
    return getBadgeSuggestions(subject);
  }, [subject]);

  // Otomatis sesuaikan tinggi textarea judul kuis
  useEffect(() => {
    if (titleTextareaRef.current) {
      titleTextareaRef.current.style.height = 'auto';
      titleTextareaRef.current.style.height = `${Math.max(46, titleTextareaRef.current.scrollHeight)}px`;
    }
  }, [title]);

  // Sinkronisasi tombol custom duration saat duration berubah di luar preset
  useEffect(() => {
    if (!DURATION_PRESETS.includes(durationPerQuestionSec)) {
      setShowCustomDurationInput(true);
    }
  }, [durationPerQuestionSec]);

  // Handler Ganti Jenjang
  const handleLevelChange = (lvl: EducationLevel) => {
    playClick();
    if (setEducationLevel) setEducationLevel(lvl);
    if (lvl === 'SD' && (grade < 1 || grade > 6)) {
      setGrade(4); // Default SD kelas 4
    } else if (lvl === 'SMP' && (grade < 7 || grade > 9)) {
      setGrade(7); // Default SMP kelas 7
    } else if (lvl === 'SMA' && grade < 10) {
      setGrade(10); // Default SMA kelas 10
    }
  };

  // Handler Auto-Generate Info via AI
  const handleAutoGenerateInfo = async () => {
    playClick();
    setIsGeneratingAiInfo(true);
    try {
      const topicForAi = title.trim() || `Materi ${subject} Kelas ${grade}`;
      const meta = await generateAiQuizMetadata({
        subject,
        grade,
        topic: topicForAi,
        educationLevel: currentEducationLevel,
        existingMetadata: {
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          coverEmoji: coverEmoji || undefined,
          badgeTitle: badgeTitle || undefined,
          durationPerQuestionSec: durationPerQuestionSec || undefined,
        },
      });

      setTitle(meta.title);
      setDescription(meta.description);
      setCoverEmoji(meta.coverEmoji);
      setBadgeTitle(meta.badgeTitle);
      setDurationPerQuestionSec(meta.durationPerQuestionSec);
    } catch (e) {
      console.warn('Auto-generate info kuis fallback handled:', e);
    } finally {
      setIsGeneratingAiInfo(false);
    }
  };

  const handleNextClick = () => {
    playClick();
    onNext();
  };

  // Handler Custom Emoji
  const handleApplyCustomEmoji = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customEmojiInput.trim();
    if (trimmed) {
      playClick();
      setCoverEmoji(trimmed);
      setCustomEmojiInput('');
    }
  };

  // Komponen Pratinjau Kartu Siswa (Digunakan di Desktop Sidebar & Mobile Collapsible)
  const renderStudentCardPreview = () => (
    <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 shadow-xs space-y-3.5 transition-all">
      <div className="flex items-start gap-3.5">
        <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-3xl shrink-0 shadow-xs border border-slate-200/80 dark:border-slate-700/80">
          {coverEmoji || '📝'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
              Kelas {grade} {currentFaseInfo.levelLabel}
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60 shadow-2xs">
              {subject}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/50">
              {currentFaseInfo.fase}
            </span>
          </div>
          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-snug line-clamp-2">
            {title.trim() || 'Judul Kuis Interaktif'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {description.trim() || 'Deskripsi panduan dan tujuan pembelajaran untuk siswa sebelum memulai latihan.'}
          </p>
        </div>
      </div>

      <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-750/70 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-semibold">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span>{durationPerQuestionSec} dtk / soal</span>
        </span>
        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
          <Award className="w-3.5 h-3.5" />
          <span className="truncate max-w-[140px]">{badgeTitle.trim() || 'Bintang Pintar'}</span>
        </span>
      </div>
    </div>
  );

  // Komponen Status Kesiapan
  const renderReadinessChecklist = () => {
    const isSubjectReady = Boolean(subject);
    const isDurationReady = durationPerQuestionSec > 0;
    const isQuestionsReady = questionsCount > 0;

    return (
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className={`w-4 h-4 shrink-0 ${isTitleFilled ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
          <span className={isTitleFilled ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-slate-400'}>
            Judul kuis telah diisi ({title.length}/100 karakter)
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className={`w-4 h-4 shrink-0 ${isSubjectReady ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
          <span className="text-slate-800 dark:text-slate-200 font-semibold">
            {subject} (Kelas {grade} {currentFaseInfo.levelLabel} • {currentFaseInfo.fase})
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className={`w-4 h-4 shrink-0 ${isDurationReady ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
          <span className="text-slate-800 dark:text-slate-200 font-semibold">
            Durasi {durationPerQuestionSec} detik / soal
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className={`w-4 h-4 shrink-0 ${isQuestionsReady ? 'text-emerald-500' : 'text-amber-500'}`} />
          <span className={isQuestionsReady ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-amber-600 dark:text-amber-400 font-semibold'}>
            {isQuestionsReady ? `${questionsCount} butir soal tersedia` : 'Belum ada butir soal di Bank Soal'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-[2000px] mx-auto px-3 xs:px-4 sm:px-8 lg:px-12 py-3 sm:py-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= KOLOM KIRI: FORMULIR UTAMA (8 KOLOM DESKTOP) ================= */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-card space-y-6">
          
          {/* Header Kartu Info */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-xs shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                  Informasi Dasar Kuis
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {isAiMode ? 'Sesuaikan identitas pedagogis dan preferensi kuis' : 'Lengkapi detail identitas kuis sebelum menyusun butir soal'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                {questionsCount} Soal
              </span>
            </div>
          </div>

          {/* Quick Action: Racik Identitas via AI (Desain Ringkas & Bebas Slop) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-purple-50/90 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 border border-blue-200/70 dark:border-blue-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 shadow-xs">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                {isGeneratingAiInfo ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Racik Identitas Kuis via AI
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    Kurikulum Merdeka 🇮🇩
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Hasilkan judul kontekstual, deskripsi instruksional, emoji tema, dan gelar prestasi siswa secara instan.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAutoGenerateInfo}
              disabled={isGeneratingAiInfo}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 min-h-[44px] btn-press"
            >
              {isGeneratingAiInfo ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Meracik Identitas...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{title.trim() ? 'Segarkan via AI' : 'Buat Otomatis'}</span>
                </>
              )}
            </button>
          </div>

          {/* Grid Formulir */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            
            {/* 1. Judul Kuis */}
            <div className="sm:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Judul Kuis <span className="text-rose-500">*</span>
                </label>
                <span className={`text-[11px] font-bold ${title.length > 90 ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}`}>
                  {title.length}/100 karakter
                </span>
              </div>
              <textarea
                ref={titleTextareaRef}
                rows={1}
                maxLength={100}
                spellCheck={false}
                value={title}
                onChange={(e) => setTitle(e.target.value.replace(/\r?\n/g, ' '))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                placeholder="Contoh: Kuis IPAS: Sistem Pencernaan & Nutrisi Tubuh"
                className="w-full px-4 py-2.5 sm:py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 focus:outline-none min-h-[46px] resize-none overflow-hidden leading-relaxed transition-all"
                required
              />
            </div>

            {/* 2. Deskripsi & Petunjuk Siswa */}
            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Deskripsi / Petunjuk untuk Siswa <span className="text-slate-400 font-normal text-xs">(Opsional)</span>
                </label>
              </div>

              <ResizableTextarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Berikan arahan atau motivasi singkat kepada siswa sebelum mereka memulai kuis..."
                minHeight={72}
                maxHeight={240}
                className="min-h-[72px] rounded-2xl"
              />

              {/* Template Cepat Deskripsi */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  💡 Rekomendasi Instruksi Cepat:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {DESCRIPTION_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        playClick();
                        setDescription(tmpl);
                      }}
                      className="text-left text-[11px] font-medium px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 transition-colors btn-press min-h-[32px] flex items-center"
                    >
                      {tmpl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Jenjang Pendidikan & Target Kelas (Fase Kurikulum Merdeka) */}
            <div className="sm:col-span-2 space-y-2">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Jenjang & Target Kelas <span className="text-rose-500">*</span>
              </label>

              {/* Tab Pemilih Jenjang */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { level: 'SD' as EducationLevel, label: 'SD / MI', fase: 'Fase A - C' },
                  { level: 'SMP' as EducationLevel, label: 'SMP / MTs', fase: 'Fase D' },
                  { level: 'SMA' as EducationLevel, label: 'SMA / SMK', fase: 'Fase E - F' },
                ].map((item) => (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => handleLevelChange(item.level)}
                    className={`p-2.5 rounded-2xl border text-center transition-all min-h-[48px] flex flex-col items-center justify-center btn-press ${
                      currentEducationLevel === item.level
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-extrabold ring-2 ring-blue-400/50 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-extrabold">{item.label}</span>
                    <span className="text-[10px] font-semibold opacity-75">{item.fase}</span>
                  </button>
                ))}
              </div>

              {/* Dropdown Kelas Terfilter */}
              <div className="pt-1">
                <select
                  value={grade}
                  onChange={(e) => {
                    const g = Number(e.target.value);
                    setGrade(g);
                    if (setEducationLevel) {
                      if (g >= 10) setEducationLevel('SMA');
                      else if (g >= 7) setEducationLevel('SMP');
                      else setEducationLevel('SD');
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:border-blue-500 focus:outline-none min-h-[44px]"
                >
                  {currentEducationLevel === 'SD' && (
                    <optgroup label="Sekolah Dasar (SD / MI)">
                      <option value={1}>Kelas 1 SD (Fase A - Awal Membaca & Berhitung)</option>
                      <option value={2}>Kelas 2 SD (Fase A - Penguatan Literasi & Numerasi)</option>
                      <option value={3}>Kelas 3 SD (Fase B - Pemahaman Konsep)</option>
                      <option value={4}>Kelas 4 SD (Fase B - Eksplorasi IPAS & Kritis)</option>
                      <option value={5}>Kelas 5 SD (Fase C - Analisis Konseptual)</option>
                      <option value={6}>Kelas 6 SD (Fase C - Pemantapan Kelulusan)</option>
                    </optgroup>
                  )}

                  {currentEducationLevel === 'SMP' && (
                    <optgroup label="Sekolah Menengah Pertama (SMP / MTs)">
                      <option value={7}>Kelas 7 SMP (Fase D - Transisi Menengah)</option>
                      <option value={8}>Kelas 8 SMP (Fase D - Pendalaman Materi)</option>
                      <option value={9}>Kelas 9 SMP (Fase D - Pemantapan Asesmen Akhir)</option>
                    </optgroup>
                  )}

                  {currentEducationLevel === 'SMA' && (
                    <optgroup label="Sekolah Menengah Atas / Kejuruan (SMA / SMK)">
                      <option value={10}>Kelas 10 SMA / SMK (Fase E - Pengenalan Peminatan)</option>
                      <option value={11}>Kelas 11 SMA / SMK (Fase F - Pendalaman Bidang Keahlian)</option>
                      <option value={12}>Kelas 12 SMA / SMK (Fase F - Persiapan Ujian & Karir)</option>
                    </optgroup>
                  )}
                </select>
              </div>
            </div>

            {/* 4. Mata Pelajaran */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Mata Pelajaran <span className="text-rose-500">*</span>
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:border-blue-500 focus:outline-none min-h-[44px]"
              >
                {/* Mapel Utama Berdasarkan Jenjang */}
                {currentEducationLevel === 'SD' && (
                  <optgroup label="Mata Pelajaran Utama SD / MI">
                    <option value="Matematika">Matematika</option>
                    <option value="IPAS">IPAS (Ilmu Pengetahuan Alam dan Sosial)</option>
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                    <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                    <option value="Bahasa Inggris">Bahasa Inggris</option>
                    <option value="PJOK">PJOK (Pendidikan Jasmani & Olahraga)</option>
                    <option value="Pengetahuan Umum">Pengetahuan Umum</option>
                  </optgroup>
                )}

                {currentEducationLevel === 'SMP' && (
                  <optgroup label="Mata Pelajaran Utama SMP / MTs">
                    <option value="Matematika">Matematika</option>
                    <option value="IPA Terpadu">IPA Terpadu</option>
                    <option value="IPS Terpadu">IPS Terpadu</option>
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                    <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                    <option value="Bahasa Inggris">Bahasa Inggris</option>
                    <option value="Informatika">Informatika / Komputer</option>
                    <option value="Prakarya">Prakarya & Kewirausahaan</option>
                    <option value="PJOK">PJOK</option>
                  </optgroup>
                )}

                {currentEducationLevel === 'SMA' && (
                  <>
                    <optgroup label="Peminatan MIPA (SMA / SMK)">
                      <option value="Fisika">Fisika</option>
                      <option value="Kimia">Kimia</option>
                      <option value="Biologi">Biologi</option>
                      <option value="Matematika Tingkat Lanjut">Matematika Tingkat Lanjut</option>
                      <option value="Informatika">Informatika / Pemrograman</option>
                    </optgroup>
                    <optgroup label="Peminatan IPS & Humaniora (SMA / SMK)">
                      <option value="Ekonomi">Ekonomi</option>
                      <option value="Sosiologi">Sosiologi</option>
                      <option value="Geografi">Geografi</option>
                      <option value="Sejarah">Sejarah</option>
                      <option value="Antropologi">Antropologi</option>
                    </optgroup>
                    <optgroup label="Mata Pelajaran Wajib Umum (SMA / SMK)">
                      <option value="Matematika">Matematika (Wajib)</option>
                      <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                      <option value="Bahasa Inggris">Bahasa Inggris</option>
                      <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                      <option value="PJOK">PJOK</option>
                    </optgroup>
                  </>
                )}

                {/* Seni & Bahasa */}
                <optgroup label="Seni & Bahasa Daerah">
                  <option value="Seni Rupa">Seni Rupa</option>
                  <option value="Seni Musik">Seni Musik</option>
                  <option value="Seni Tari">Seni Tari</option>
                  <option value="Seni Teater">Seni Teater</option>
                  <option value="Bahasa Daerah">Bahasa Daerah / Mulok</option>
                </optgroup>

                {/* Pendidikan Agama */}
                <optgroup label="Pendidikan Agama & Budi Pekerti">
                  <option value="Pendidikan Agama Islam">Pendidikan Agama Islam (PAI)</option>
                  <option value="Pendidikan Agama Kristen">Pendidikan Agama Kristen</option>
                  <option value="Pendidikan Agama Katolik">Pendidikan Agama Katolik</option>
                  <option value="Pendidikan Agama Hindu">Pendidikan Agama Hindu</option>
                  <option value="Pendidikan Agama Buddha">Pendidikan Agama Buddha</option>
                  <option value="Pendidikan Agama Konghucu">Pendidikan Agama Konghucu</option>
                </optgroup>

                {/* Mapel Lintas Lainnya */}
                <optgroup label="Pilihan Mapel Lainnya">
                  <option value="IPA">IPA (Sains)</option>
                  <option value="IPS">IPS (Sosial)</option>
                  <option value="Pengetahuan Umum">Pengetahuan Umum</option>
                </optgroup>
              </select>
            </div>

            {/* 5. Waktu Menjawab Per Soal (Waktu Standar) */}
            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Waktu Menjawab Standar Per Soal <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomDurationInput((prev) => !prev)}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{showCustomDurationInput ? 'Sembunyikan Kustom' : 'Atur Detik Kustom'}</span>
                </button>
              </div>

              {/* Preset Tombol Waktu (min-h-[44px] Wajib Standar Sentuh Mobile) */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 sm:gap-2">
                {DURATION_PRESETS.map((dur) => (
                  <button
                    type="button"
                    key={dur}
                    onClick={() => {
                      playClick();
                      setDurationPerQuestionSec(dur);
                    }}
                    className={`py-2 rounded-xl font-extrabold text-xs min-h-[44px] transition-all flex items-center justify-center btn-press ${
                      durationPerQuestionSec === dur
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/50'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                    }`}
                  >
                    {dur}s
                  </button>
                ))}
              </div>

              {/* Input Detik Kustom */}
              {showCustomDurationInput && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3 animate-fade-in">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                    Durasi Khusus:
                  </div>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={durationPerQuestionSec}
                    onChange={(e) => {
                      const val = Math.max(5, Math.min(300, Number(e.target.value) || 30));
                      setDurationPerQuestionSec(val);
                    }}
                    className="w-24 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold text-xs focus:border-blue-500 focus:outline-none min-h-[38px]"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    detik per butir soal (rentang 5 - 300 dtk)
                  </span>
                </div>
              )}

              {/* Status Soal Durasi Khusus & Opsi Samakan */}
              {Boolean(customDurationCount && customDurationCount > 0) && (
                <div className="p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 text-xs">
                  <div className="text-slate-600 dark:text-slate-300">
                    <span className="font-extrabold text-blue-600 dark:text-blue-400">💡 Waktu Khusus: </span>
                    <span>{customDurationCount} dari {questionsCount} soal menggunakan durasi berbeda.</span>
                  </div>
                  {onResetAllCustomDuration && (
                    <button
                      type="button"
                      onClick={onResetAllCustomDuration}
                      className="px-3 py-2 rounded-xl font-bold text-xs text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors shrink-0 min-h-[44px] flex items-center justify-center btn-press shadow-2xs"
                      title="Samakan seluruh durasi butir soal mengikuti waktu standar kuis"
                    >
                      Terapkan {durationPerQuestionSec}s ke Semua Soal
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 6. Gelar Hadiah Kuis (Lencana Prestasi Siswa) */}
            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Gelar Hadiah Kuis (Lencana Siswa)
                </label>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  Dianugerahkan saat siswa tuntas
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={badgeTitle}
                  onChange={(e) => setBadgeTitle(e.target.value)}
                  placeholder="Contoh: Juara Pancasila, Peneliti Cilik, Master Logika"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:border-blue-500 focus:outline-none min-h-[44px]"
                />
                <Award className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Chips Rekomendasi Gelar Kontekstual Sesuai Mapel */}
              <div className="space-y-1 pt-0.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  Pilihan Gelar Cepat ({subject}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {badgeSuggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        playClick();
                        setBadgeTitle(sug);
                      }}
                      className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition-all min-h-[36px] flex items-center gap-1 btn-press ${
                        badgeTitle === sug
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Award className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>{sug}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 7. Pilihan Ikon Sampul Kuis (Kategori Tematik + Input Kustom Bebas) */}
            <div className="sm:col-span-2 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Ikon Sampul Kuis <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span>Terpilih:</span>
                  <span className="text-base leading-none">{coverEmoji || '📝'}</span>
                </span>
              </div>

              {/* Tab Kategori Emoji */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {EMOJI_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      playClick();
                      setActiveEmojiCategory(cat.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all min-h-[38px] flex items-center ${
                      activeEmojiCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Grid Emoji Terpilih */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap gap-2">
                  {EMOJI_CATEGORIES.find((c) => c.id === activeEmojiCategory)?.emojis.map((em) => (
                    <button
                      type="button"
                      key={em}
                      onClick={() => {
                        playClick();
                        setCoverEmoji(em);
                      }}
                      className={`w-11 h-11 rounded-2xl text-2xl flex items-center justify-center border transition-all min-h-[44px] min-w-[44px] btn-press ${
                        coverEmoji === em
                          ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-500 ring-2 ring-blue-400 shadow-sm scale-105'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>

                {/* Input Emoji Kustom Bebas */}
                <form onSubmit={handleApplyCustomEmoji} className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-755/80 flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={customEmojiInput}
                    onChange={(e) => setCustomEmojiInput(e.target.value)}
                    placeholder="Ketik emoji sendiri..."
                    className="flex-1 max-w-[200px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:border-blue-500 focus:outline-none min-h-[38px]"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-blue-600 hover:text-white dark:bg-slate-750 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors min-h-[38px] btn-press"
                  >
                    Gunakan
                  </button>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden xs:inline">
                    (Mendukung seluruh emoji keyboard)
                  </span>
                </form>
              </div>
            </div>

            {/* 8. Visibilitas & Akses Kuis */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Visibilitas & Akses Kuis <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all min-h-[64px] ${
                    visibility === 'public'
                      ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 ring-2 ring-blue-400/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={visibility === 'public'}
                    onChange={() => {
                      playClick();
                      setVisibility('public');
                    }}
                    className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Publik di Beranda Siswa</span>
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Kuis otomatis tampil di katalog siswa dan dapat dimainkan langsung tanpa perlu memasukkan PIN.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all min-h-[64px] ${
                    visibility === 'private'
                      ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 ring-2 ring-amber-400/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={visibility === 'private'}
                    onChange={() => {
                      playClick();
                      setVisibility('private');
                    }}
                    className="mt-1 w-4 h-4 text-amber-600 focus:ring-amber-500"
                  />
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Privat (Khusus Ruang PIN)</span>
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Disembunyikan dari katalog umum, hanya siswa yang menerima PIN dari guru yang dapat bergabung.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* 9. Mode Permainan Bawaan */}
            <div className="sm:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Mode Permainan Bawaan
                </label>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  Dapat diganti siswa saat berada di lobi kuis
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setDefaultGameMode('standard');
                  }}
                  className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all min-h-[72px] btn-press ${
                    defaultGameMode === 'standard'
                      ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 ring-2 ring-blue-400/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/60'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white block">
                    Standar ⏱️
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 leading-snug">
                    Timer tiap soal dengan tantangan skor kecepatan & akurasi.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setDefaultGameMode('survival_3hearts');
                  }}
                  className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all min-h-[72px] btn-press ${
                    defaultGameMode === 'survival_3hearts'
                      ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 ring-2 ring-rose-400/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/60'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white block">
                    3 Hati (Survival) ❤️
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 leading-snug">
                    3 kesempatan. Jawaban salah atau waktu habis memotong 1 hati.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setDefaultGameMode('untimed');
                  }}
                  className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all min-h-[72px] btn-press ${
                    defaultGameMode === 'untimed'
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-400/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/60'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white block">
                    Santai (Tanpa Timer) 🧘
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 leading-snug">
                    Waktu bebas tanpa tekanan waktu, optimal untuk pemahaman mendalam.
                  </span>
                </button>
              </div>
            </div>

            {/* 10. Opsi Pengacakan Modern (Card Toggle Switch Mobile-First) */}
            <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Integritas Asesmen & Pengacakan
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Switch 1: Acak Urutan Soal */}
                <div
                  onClick={() => {
                    playClick();
                    setShuffleQuestions(!shuffleQuestions);
                  }}
                  role="switch"
                  aria-checked={shuffleQuestions}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 min-h-[56px] btn-press ${
                    shuffleQuestions
                      ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-400/50'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      shuffleQuestions 
                        ? 'bg-blue-600 text-white shadow-2xs' 
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      <Shuffle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Acak Urutan Butir Soal
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">
                        Tiap siswa menerima urutan nomor berbeda
                      </span>
                    </div>
                  </div>

                  {/* iOS Style Toggle */}
                  <div className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                    shuffleQuestions ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-750'
                  }`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                      shuffleQuestions ? 'translate-x-5.5' : 'translate-x-0.5'
                    }`} />
                  </div>
                </div>

                {/* Switch 2: Acak Opsi Jawaban */}
                <div
                  onClick={() => {
                    playClick();
                    setShuffleOptions(!shuffleOptions);
                  }}
                  role="switch"
                  aria-checked={shuffleOptions}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 min-h-[56px] btn-press ${
                    shuffleOptions
                      ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-400/50'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      shuffleOptions 
                        ? 'bg-blue-600 text-white shadow-2xs' 
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      <Dice5 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Acak Pilihan Opsi Jawaban
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">
                        Posisi opsi A, B, C, D diacak otomatis
                      </span>
                    </div>
                  </div>

                  {/* iOS Style Toggle */}
                  <div className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                    shuffleOptions ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-750'
                  }`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                      shuffleOptions ? 'translate-x-5.5' : 'translate-x-0.5'
                    }`} />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ================= KHUSUS MOBILE: PRATINJAU KARTU SISWA & STATUS KESIAPAN ================= */}
          <div className="lg:hidden pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <button
              type="button"
              onClick={() => setShowMobilePreview((prev) => !prev)}
              className="w-full py-2.5 px-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-extrabold flex items-center justify-between min-h-[44px] transition-colors btn-press"
            >
              <span className="flex items-center gap-2">
                <span>👁️ Pratinjau Kartu Siswa & Status</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                  {questionsCount} Soal
                </span>
              </span>
              {showMobilePreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showMobilePreview && (
              <div className="space-y-3.5 animate-fade-in">
                {renderStudentCardPreview()}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
                  <h5 className="font-extrabold text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Status Kesiapan</span>
                  </h5>
                  {renderReadinessChecklist()}
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigasi Langkah (Touch Target >= 48px, Responsive Stack di Layar Sangat Sempit) */}
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                playClick();
                onBack();
              }}
              className="w-full xs:w-auto px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 min-h-[48px] flex items-center justify-center gap-2 transition-colors btn-press order-2 xs:order-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>

            <button
              type="button"
              onClick={handleNextClick}
              disabled={!isTitleFilled}
              className="w-full xs:w-auto px-6 py-3 rounded-2xl font-extrabold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm min-h-[48px] flex items-center justify-center gap-2 btn-press transition-all disabled:opacity-50 disabled:cursor-not-allowed order-1 xs:order-2"
            >
              <span>{isAiMode ? 'Lanjut ke Pratinjau' : 'Lanjut ke Bank Soal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* ================= KOLOM KANAN: PRATINJAU KARTU SISWA & STATUS KESIAPAN (DESKTOP STICKY) ================= */}
        <div className="hidden lg:block lg:col-span-4 space-y-4 lg:sticky lg:top-20">
          
          {/* Card 1: Pratinjau Tampilan Kartu Kuis Real-Time */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span>👁️ Pratinjau Kartu Siswa</span>
              </span>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
                Live Preview
              </span>
            </div>

            {renderStudentCardPreview()}
          </div>

          {/* Card 2: Checklist Kesiapan Kuis Fungsional */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-card space-y-3">
            <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Status Kesiapan Kuis</span>
            </h4>
            {renderReadinessChecklist()}
          </div>

        </div>

      </div>
    </div>
  );
};
