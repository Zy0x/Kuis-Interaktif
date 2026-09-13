import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { Subject, EducationLevel } from '../../types/quiz';
import { generateAiQuizMetadata } from '../../lib/geminiApi';
import {
  BookOpen,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
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
import { GradeDropdown } from './GradeDropdown';
import { SubjectDropdown } from './SubjectDropdown';

const DESCRIPTION_TEMPLATES = [
  'Pilihlah satu jawaban yang paling tepat pada setiap butir soal.',
  'Kerjakan dengan teliti dan mandiri. Perhatikan durasi timer di layar!',
  'Baca setiap petunjuk soal dengan cermat dan raih lencana prestasi terbaik.',
];

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
  coverEmoji: string;
  setCoverEmoji: (v: string) => void;
  questionsCount: number;
  isAiMode: boolean;
  quizPin?: string;
  quizId?: string;
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
  coverEmoji,
  setCoverEmoji,
  questionsCount,
  isAiMode,
  quizPin,
  quizId,
  onNext,
  onBack,
  playClick,
}) => {
  const isTitleFilled = Boolean(title.trim());
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [isGeneratingAiInfo, setIsGeneratingAiInfo] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showDescriptionSuggestions, setShowDescriptionSuggestions] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  const currentEducationLevel: EducationLevel = useMemo(() => {
    if (educationLevel) return educationLevel;
    if (grade >= 10) return 'SMA';
    if (grade >= 7) return 'SMP';
    return 'SD';
  }, [educationLevel, grade]);

  const currentFaseInfo = useMemo(() => {
    return GRADE_FASE_MAP[grade] || { fase: 'Fase A-C', level: 'SD', levelLabel: 'SD / MI' };
  }, [grade]);

  useEffect(() => {
    if (titleTextareaRef.current) {
      titleTextareaRef.current.style.height = 'auto';
      titleTextareaRef.current.style.height = `${Math.max(46, titleTextareaRef.current.scrollHeight)}px`;
    }
  }, [title]);

  const handleLevelChange = (lvl: EducationLevel) => {
    playClick();
    if (setEducationLevel) setEducationLevel(lvl);
    if (lvl === 'SD' && (grade < 1 || grade > 6)) setGrade(4);
    else if (lvl === 'SMP' && (grade < 7 || grade > 9)) setGrade(7);
    else if (lvl === 'SMA' && grade < 10) setGrade(10);
  };

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
        },
      });
      setTitle(meta.title);
      setDescription(meta.description);
      setCoverEmoji(meta.coverEmoji);
    } catch (e) {
      console.warn('Auto-generate info kuis fallback handled:', e);
    } finally {
      setIsGeneratingAiInfo(false);
    }
  };

  const renderStudentCardPreview = () => (
    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 space-y-3">
      <div className="flex items-start gap-3">
        <QuizCoverDisplay
          cover={coverEmoji}
          className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-2xl shrink-0 shadow-xs border border-slate-200/80 dark:border-slate-700/80 overflow-hidden"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1 mb-1.5">
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
              Kls {grade} {currentFaseInfo.levelLabel}
            </span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60 truncate max-w-[120px]">
              {subject}
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/50 whitespace-nowrap">
              {currentFaseInfo.fase}
            </span>
          </div>
          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2">
            {title.trim() || 'Judul Kuis Interaktif'}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {description.trim() || 'Petunjuk pengerjaan kuis untuk siswa.'}
          </p>
        </div>
      </div>
      <div className="pt-2 border-t border-slate-200/70 dark:border-slate-750/70 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
        <span>{questionsCount} soal</span>
        <span className="text-slate-300 dark:text-slate-600">·</span>
        <span className="truncate">{subject || 'Mata Pelajaran'}</span>
      </div>
    </div>
  );

  const renderReadinessChecklist = () => (
    <div className="space-y-2 text-xs">
      <div className="flex items-center gap-2.5">
        <CheckCircle2 className={`w-4 h-4 shrink-0 ${isTitleFilled ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
        <span className={isTitleFilled ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-slate-400'}>
          Judul kuis ({title.length}/100)
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
        <span className="text-slate-800 dark:text-slate-200 font-semibold">
          {subject} · Kls {grade} · {currentFaseInfo.fase}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <CheckCircle2 className={`w-4 h-4 shrink-0 ${questionsCount > 0 ? 'text-emerald-500' : 'text-amber-500'}`} />
        <span className={questionsCount > 0 ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-amber-600 dark:text-amber-400 font-semibold'}>
          {questionsCount > 0 ? `${questionsCount} butir soal` : 'Belum ada soal'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-[2000px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-10 py-3 sm:py-5 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* KOLOM KIRI: FORM */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-card space-y-4">

          {/* Header dengan AI & badge soal */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight truncate">
                Info Kuis
              </h2>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleAutoGenerateInfo}
                disabled={isGeneratingAiInfo}
                className="min-h-[44px] px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 btn-press disabled:opacity-50 whitespace-nowrap"
              >
                {isGeneratingAiInfo
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>AI...</span></>
                  : <><Sparkles className="w-3.5 h-3.5" /><span>Racik AI</span></>
                }
              </button>
              <span className="text-xs font-black min-h-[44px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center whitespace-nowrap">
                {questionsCount} Soal
              </span>
            </div>

          </div>

          {/* ── Judul ── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Judul Kuis <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[11px] font-bold shrink-0 ${title.length > 90 ? 'text-amber-500' : 'text-slate-400'}`}>
                {title.length}/100
              </span>
            </div>
            <textarea
              ref={titleTextareaRef}
              rows={1}
              maxLength={100}
              spellCheck={false}
              value={title}
              onChange={(e) => setTitle(e.target.value.replace(/\r?\n/g, ' '))}
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
              placeholder="Contoh: Kuis IPAS — Sistem Pencernaan & Nutrisi Tubuh"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 focus:outline-none min-h-[46px] resize-none overflow-hidden leading-relaxed transition-all"
              required
            />
          </div>

          {/* ── Jenjang & Kelas ── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Jenjang & Kelas <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/50 shrink-0">
                {currentFaseInfo.fase}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mb-1.5">
              {([
                { level: 'SD' as EducationLevel, label: 'SD / MI' },
                { level: 'SMP' as EducationLevel, label: 'SMP / MTs' },
                { level: 'SMA' as EducationLevel, label: 'SMA / SMK' },
              ]).map((item) => (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => handleLevelChange(item.level)}
                  className={`py-2 px-1 rounded-xl border text-center min-h-[44px] flex items-center justify-center text-[11px] font-bold btn-press transition-all leading-tight ${
                    currentEducationLevel === item.level
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-1 ring-blue-400/40'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
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

          {/* ── Mata Pelajaran ── */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
              Mata Pelajaran <span className="text-rose-500">*</span>
            </label>
            <SubjectDropdown
              subject={subject}
              setSubject={setSubject}
              educationLevel={currentEducationLevel}
              playClick={playClick}
            />
          </div>

          {/* ── Petunjuk / Deskripsi ── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Petunjuk untuk Siswa <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <button
                type="button"
                onClick={() => { playClick(); setShowDescriptionSuggestions((p) => !p); }}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0"
              >
                <span>💡 {showDescriptionSuggestions ? 'Tutup' : 'Saran'}</span>
                {showDescriptionSuggestions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
            <ResizableTextarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Arahan singkat, tips, atau tata tertib untuk siswa sebelum memulai kuis..."
              minHeight={88}
              maxHeight={200}
              className="min-h-[88px] rounded-xl p-3.5 text-sm leading-relaxed"
            />
            {showDescriptionSuggestions && (
              <div className="flex flex-col gap-1.5 animate-fade-in">
                {DESCRIPTION_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { playClick(); setDescription(tmpl); setShowDescriptionSuggestions(false); }}
                    className="text-left text-[11px] font-medium px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 transition-colors btn-press min-h-[44px] flex items-center leading-relaxed"
                  >
                    {tmpl}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Sampul Kuis ── */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 min-w-0">
              <QuizCoverDisplay
                cover={coverEmoji}
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-2xl shrink-0 shadow-xs border border-slate-200 dark:border-slate-700 overflow-hidden"
              />
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                  <span>Sampul Kuis</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0">
                    {isImageCover(coverEmoji) ? 'Gambar Kustom' : (coverEmoji || '📝')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Tampil di katalog & lobi siswa</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { playClick(); setShowCoverModal(true); }}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-extrabold transition-all min-h-[44px] flex items-center gap-1.5 btn-press shadow-2xs shrink-0"
            >
              <Palette className="w-4 h-4 text-blue-500" />
              <span>Ubah</span>
            </button>
          </div>

          {/* MOBILE: Pratinjau collapsible */}
          <div className="lg:hidden pt-1 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button
              type="button"
              onClick={() => { playClick(); setShowMobilePreview((p) => !p); }}
              className="w-full py-2.5 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-extrabold flex items-center justify-between min-h-[44px] transition-colors btn-press"
            >
              <span className="flex items-center gap-2">
                <span>👁️ Pratinjau & Status Kesiapan</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">{questionsCount} Soal</span>
              </span>
              {showMobilePreview ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
            </button>
            {showMobilePreview && (
              <div className="space-y-3 animate-fade-in">
                {renderStudentCardPreview()}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
                  <h5 className="font-extrabold text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Status Kesiapan</span>
                  </h5>
                  {renderReadinessChecklist()}
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigasi */}
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => { playClick(); onBack(); }}
              className="w-full xs:w-auto px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 min-h-[48px] flex items-center justify-center gap-2 transition-colors btn-press order-2 xs:order-1"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>Kembali</span>
            </button>
            <button
              type="button"
              onClick={() => { playClick(); onNext(); }}
              disabled={!isTitleFilled}
              className="w-full xs:flex-1 px-6 py-3 rounded-2xl font-extrabold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm min-h-[48px] flex items-center justify-center gap-2 btn-press transition-all disabled:opacity-50 disabled:cursor-not-allowed order-1 xs:order-2"
            >
              <span>{isAiMode ? 'Lanjut ke Pratinjau' : 'Lanjut ke Bank Soal'}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>

        </div>

        {/* KOLOM KANAN: DESKTOP SIDEBAR */}
        <div className="hidden lg:block lg:col-span-4 space-y-4 lg:sticky lg:top-20">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">👁️ Pratinjau</span>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">Live</span>
            </div>
            {renderStudentCardPreview()}
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-card space-y-3">
            <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Status Kesiapan</span>
            </h4>
            {renderReadinessChecklist()}
          </div>
        </div>

      </div>

      <QuizCoverModal
        isOpen={showCoverModal}
        onClose={() => setShowCoverModal(false)}
        currentCover={coverEmoji}
        onSelectCover={(c) => setCoverEmoji(c)}
        subject={subject}
        quizPin={quizPin}
        quizTitle={title}
        quizId={quizId}
        playClick={playClick}
      />
    </div>
  );
};
