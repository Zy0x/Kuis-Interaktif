import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { Subject, EducationLevel } from '../../types/quiz';
import { generateAiQuizMetadata } from '../../lib/geminiApi';
import { 
  BookOpen, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Sliders, 
  Sparkles, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Palette,
} from 'lucide-react';
import { ResizableTextarea } from '../common/ResizableTextarea';
import { QuizCoverDisplay, isImageCover } from '../common/QuizCoverDisplay';
import { QuizCoverModal } from './QuizCoverModal';
import { DurationSelector } from './DurationSelector';
import { ResetDurationConfirmModal } from './ResetDurationConfirmModal';
import { GradeDropdown } from './GradeDropdown';
import { SubjectDropdown } from './SubjectDropdown';

// Template Deskripsi Cepat untuk Guru
const DESCRIPTION_TEMPLATES = [
  'Pilihlah satu jawaban yang paling tepat pada setiap butir soal.',
  'Kerjakan dengan teliti dan mandiri. Perhatikan durasi timer di layar!',
  'Baca setiap petunjuk soal dengan cermat dan raih lencana prestasi terbaik.',
];

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
  coverEmoji: string;
  setCoverEmoji: (v: string) => void;
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
  coverEmoji,
  setCoverEmoji,
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
  
  // State Modal & Collapsible untuk Kebersihan Tampilan
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showResetDurationConfirm, setShowResetDurationConfirm] = useState(false);
  const [showDescriptionSuggestions, setShowDescriptionSuggestions] = useState(false);

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

  // Otomatis sesuaikan tinggi textarea judul kuis
  useEffect(() => {
    if (titleTextareaRef.current) {
      titleTextareaRef.current.style.height = 'auto';
      titleTextareaRef.current.style.height = `${Math.max(46, titleTextareaRef.current.scrollHeight)}px`;
    }
  }, [title]);

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
          durationPerQuestionSec: durationPerQuestionSec || undefined,
        },
      });

      setTitle(meta.title);
      setDescription(meta.description);
      setCoverEmoji(meta.coverEmoji);
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

  // Komponen Pratinjau Kartu Siswa (Digunakan di Desktop Sidebar & Mobile Collapsible)
  const renderStudentCardPreview = () => (
    <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 shadow-xs space-y-3.5 transition-all">
      <div className="flex items-start gap-3.5">
        <QuizCoverDisplay
          cover={coverEmoji}
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-3xl shrink-0 shadow-xs border border-slate-200/80 dark:border-slate-700/80 overflow-hidden"
        />
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

      <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-750/70 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-semibold">
        <Clock className="w-3.5 h-3.5 text-blue-500" />
        <span>{durationPerQuestionSec} dtk / soal</span>
        <span className="text-slate-300 dark:text-slate-600 mx-1">·</span>
        <span>{questionsCount} soal</span>
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
            Judul kuis telah diisi ({title.length}/100)
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className={`w-4 h-4 shrink-0 ${isSubjectReady ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
          <span className="text-slate-800 dark:text-slate-200 font-semibold">
            {subject} (Kls {grade} • {currentFaseInfo.fase})
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className={`w-4 h-4 shrink-0 ${isDurationReady ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
          <span className="text-slate-800 dark:text-slate-200 font-semibold">
            Durasi {durationPerQuestionSec}s / soal
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className={`w-4 h-4 shrink-0 ${isQuestionsReady ? 'text-emerald-500' : 'text-amber-500'}`} />
          <span className={isQuestionsReady ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-amber-600 dark:text-amber-400 font-semibold'}>
            {isQuestionsReady ? `${questionsCount} butir soal tersedia` : 'Belum ada butir soal'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-[2000px] mx-auto px-3 xs:px-4 sm:px-8 lg:px-12 py-3 sm:py-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= KOLOM KIRI: FORMULIR UTAMA (8 KOLOM DESKTOP) ================= */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-card space-y-5">
          
          {/* Header Kartu Info dengan Quick Action AI Ringkas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-xs shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  Informasi Dasar Kuis
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Lengkapi identitas utama dan preferensi kuis Kurikulum Merdeka
                </p>
              </div>
            </div>

            {/* Quick Action AI & Badge Soal */}
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handleAutoGenerateInfo}
                disabled={isGeneratingAiInfo}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 min-h-[40px] btn-press disabled:opacity-50"
                title="Hasilkan judul, deskripsi, emoji tema, dan gelar otomatis via AI"
              >
                {isGeneratingAiInfo ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Meracik AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{title.trim() ? 'Segarkan via AI' : 'Racik Kilat via AI'}</span>
                  </>
                )}
              </button>
              <span className="text-xs font-black px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 min-h-[40px] flex items-center">
                {questionsCount} Soal
              </span>
            </div>
          </div>

          {/* ================= SEKSI 1: IDENTITAS INTI KUIS (WAJIB) ================= */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
              <span>1. Identitas Inti Kuis</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Judul Kuis */}
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

              {/* Jenjang & Target Kelas (Fase Kurikulum Merdeka) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    Jenjang & Kelas <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/50">
                    {currentFaseInfo.fase}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                  {[
                    { level: 'SD' as EducationLevel, label: 'SD / MI' },
                    { level: 'SMP' as EducationLevel, label: 'SMP / MTs' },
                    { level: 'SMA' as EducationLevel, label: 'SMA / SMK' },
                  ].map((item) => (
                    <button
                      key={item.level}
                      type="button"
                      onClick={() => handleLevelChange(item.level)}
                      className={`py-1.5 px-1 rounded-xl border text-center transition-all min-h-[38px] flex items-center justify-center btn-press ${
                        currentEducationLevel === item.level
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-extrabold ring-1 ring-blue-400/50 shadow-2xs text-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <GradeDropdown
                  grade={grade}
                  setGrade={setGrade}
                  educationLevel={currentEducationLevel}
                  setEducationLevel={setEducationLevel}
                  playClick={playClick}
                />
              </div>

              {/* Mata Pelajaran */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <div className="pt-0.5 sm:pt-[44px]">
                  <SubjectDropdown
                    subject={subject}
                    setSubject={setSubject}
                    educationLevel={currentEducationLevel}
                    playClick={playClick}
                  />
                </div>
              </div>

              {/* Sampul Kuis: Modal Trigger (Anti-Slop & Bersih) */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <QuizCoverDisplay
                      cover={coverEmoji}
                      className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-3xl shadow-xs border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden"
                    />
                    <div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Ikon Sampul Kuis</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                          {isImageCover(coverEmoji) ? 'Gambar Kustom' : (coverEmoji || '📝')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Tampil di kartu katalog, lobi siswa, dan sertifikat
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setShowCoverModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-extrabold transition-all min-h-[40px] flex items-center gap-1.5 btn-press shadow-2xs"
                  >
                    <Palette className="w-4 h-4 text-blue-500" />
                    <span>Ubah Sampul</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* ================= SEKSI 2: ATURAN WAKTU & PANDUAN SISWA ================= */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              <span>2. Aturan Waktu & Panduan Siswa</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Waktu Menjawab Per Soal: Compact Duration Selector */}
              <div className="sm:col-span-2">
                <DurationSelector
                  durationSec={durationPerQuestionSec}
                  setDurationSec={setDurationPerQuestionSec}
                  customDurationCount={customDurationCount}
                  questionsCount={questionsCount}
                  onRequestResetDuration={() => setShowResetDurationConfirm(true)}
                  playClick={playClick}
                />
              </div>

              {/* Deskripsi / Petunjuk untuk Siswa (Lega & Nyaman) */}
              <div className="sm:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    Petunjuk / Deskripsi untuk Siswa <span className="text-slate-400 font-normal text-xs">(Opsional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setShowDescriptionSuggestions((prev) => !prev);
                    }}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>💡 {showDescriptionSuggestions ? 'Tutup Saran' : 'Saran Instruksi (3)'}</span>
                    {showDescriptionSuggestions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                <ResizableTextarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Berikan arahan singkat, tips, atau tata tertib bagi siswa sebelum mereka memulai kuis..."
                  minHeight={115}
                  maxHeight={260}
                  className="min-h-[115px] rounded-2xl p-3.5 sm:p-4 text-sm leading-relaxed"
                />

                {/* Collapsible Saran Deskripsi */}
                {showDescriptionSuggestions && (
                  <div className="flex flex-wrap gap-1.5 pt-1 animate-fade-in">
                    {DESCRIPTION_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          playClick();
                          setDescription(tmpl);
                        }}
                        className="text-left text-[11px] font-medium px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 transition-colors btn-press min-h-[34px] flex items-center"
                      >
                        {tmpl}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ================= KHUSUS MOBILE: PRATINJAU KARTU SISWA & STATUS KESIAPAN ================= */}
          <div className="lg:hidden pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <button
              type="button"
              onClick={() => {
                playClick();
                setShowMobilePreview((prev) => !prev);
              }}
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

      {/* Modal Sampul Kuis Baru (Tab Emoji & Upload Gambar) */}
      <QuizCoverModal
        isOpen={showCoverModal}
        onClose={() => setShowCoverModal(false)}
        currentCover={coverEmoji}
        onSelectCover={(c) => setCoverEmoji(c)}
        subject={subject}
        playClick={playClick}
      />

      {/* Modal Konfirmasi Penerapan Waktu Standar Soal */}
      <ResetDurationConfirmModal
        isOpen={showResetDurationConfirm}
        onClose={() => setShowResetDurationConfirm(false)}
        durationSec={durationPerQuestionSec}
        customCount={customDurationCount || 0}
        totalQuestions={questionsCount}
        onConfirm={(mode) => {
          if (mode === 'all') {
            onResetAllCustomDuration?.();
          }
        }}
        playClick={playClick}
      />
    </div>
  );
};
