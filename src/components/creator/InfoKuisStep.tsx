import React, { useRef, useEffect, useState } from 'react';
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
  Loader2
} from 'lucide-react';
import { ResizableTextarea } from '../common/ResizableTextarea';

const EMOJI_OPTIONS = ['🍎', '📐', '🐸', '🌱', '🫀', '🦅', '🚀', '📚', '🎨', '🔬', '⚽', '🦁', '🐯', '🐼', '💡', '🧩'];

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
  isAiMode,
  onNext,
  onBack,
  playClick,
}) => {
  const isTitleFilled = Boolean(title.trim());
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [isGeneratingAiInfo, setIsGeneratingAiInfo] = useState(false);

  // Otomatis sesuaikan tinggi textarea judul kuis agar teks panjang selalu wrap ke bawah dan terbaca utuh
  useEffect(() => {
    if (titleTextareaRef.current) {
      titleTextareaRef.current.style.height = 'auto';
      titleTextareaRef.current.style.height = `${Math.max(46, titleTextareaRef.current.scrollHeight)}px`;
    }
  }, [title]);

  const handleAutoGenerateInfo = async () => {
    playClick();
    setIsGeneratingAiInfo(true);
    try {
      const topicForAi = title.trim() || `Materi ${subject} Kelas ${grade}`;
      const meta = await generateAiQuizMetadata({
        subject,
        grade,
        topic: topicForAi,
        educationLevel,
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

  return (
    <div className="w-full max-w-[2000px] mx-auto px-3 xs:px-4 sm:px-8 lg:px-12 py-4 sm:py-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Kolom Kiri: Formulir Utama (8 kolom di layar besar) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-card space-y-6">
          
          {/* Header Kartu */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  Informasi Dasar Kuis
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isAiMode ? 'Sesuaikan judul dan preferensi kuis yang dibuat AI' : 'Lengkapi detail identitas kuis sebelum menyusun butir soal'}
                </p>
              </div>
            </div>

            <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {questionsCount} Butir Soal
            </span>
          </div>

          {/* Formulir Utama */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            
            {/* Quick Action: Racik / Segarkan Identitas Kuis dengan AI */}
            <div className="sm:col-span-2 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-purple-50/90 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 border border-blue-200/80 dark:border-blue-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  {isGeneratingAiInfo ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                    <span>Racik Identitas Kuis Otomatis via AI</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                      Pedagogis & Inspiratif
                    </span>
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Buat judul memotivasi, deskripsi pengantar, emoji topik, dan lencana prestasi Kurikulum Merdeka secara instan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAutoGenerateInfo}
                disabled={isGeneratingAiInfo}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 min-h-[44px]"
              >
                {isGeneratingAiInfo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Meracik Identitas...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>✨ {title.trim() ? 'Segarkan via AI' : 'Buat via AI'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Judul Kuis */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Judul Kuis <span className="text-rose-500">*</span>
              </label>
              <textarea
                ref={titleTextareaRef}
                rows={1}
                spellCheck={false}
                value={title}
                onChange={(e) => setTitle(e.target.value.replace(/\r?\n/g, ' '))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                placeholder="Contoh: Kuis IPAS: Sistem Pencernaan Manusia"
                className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm sm:text-base focus:border-blue-500 focus:outline-none min-h-[46px] resize-none overflow-hidden leading-relaxed transition-[height] duration-75"
                required
              />
            </div>

            {/* Deskripsi */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Deskripsi / Petunjuk untuk Siswa <span className="text-slate-400 font-normal text-xs">(Opsional)</span>
              </label>
              <ResizableTextarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Berikan arahan singkat kepada siswa sebelum mereka memulai kuis..."
                minHeight={72}
                maxHeight={280}
                className="min-h-[72px]"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 px-0.5">
                <span>Instruksi awal yang akan dibaca siswa saat membuka kuis.</span>
                <span className="hidden sm:inline text-[10px] text-slate-400/80">Tarik sudut kanan bawah untuk perbesar</span>
              </div>
            </div>

            {/* Target Kelas */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Kelas <span className="text-rose-500">*</span>
              </label>
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-sm focus:border-blue-500 focus:outline-none min-h-[44px]"
              >
                <optgroup label="Sekolah Dasar (SD / MI)">
                  {[1, 2, 3, 4, 5, 6].map((g) => (
                    <option key={g} value={g}>Kelas {g} SD</option>
                  ))}
                </optgroup>
                <optgroup label="Sekolah Menengah Pertama (SMP / MTs)">
                  {[7, 8, 9].map((g) => (
                    <option key={g} value={g}>Kelas {g} SMP</option>
                  ))}
                </optgroup>
                <optgroup label="Sekolah Menengah Atas / Kejuruan (SMA / SMK)">
                  {[10, 11, 12].map((g) => (
                    <option key={g} value={g}>Kelas {g} SMA / SMK</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Mata Pelajaran */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Mata Pelajaran <span className="text-rose-500">*</span>
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-sm focus:border-blue-500 focus:outline-none min-h-[44px]"
              >
                <optgroup label="Mata Pelajaran Umum & SD">
                  <option value="Matematika">Matematika</option>
                  <option value="IPAS">IPAS (Ilmu Pengetahuan Alam dan Sosial)</option>
                  <option value="IPA">IPA (Sains)</option>
                  <option value="IPS">IPS (Sosial)</option>
                  <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                  <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                  <option value="Bahasa Inggris">Bahasa Inggris</option>
                  <option value="PJOK">PJOK (Olahraga & Kesehatan)</option>
                  <option value="Pengetahuan Umum">Pengetahuan Umum</option>
                </optgroup>
                <optgroup label="Mata Pelajaran Terpadu (SMP)">
                  <option value="IPA Terpadu">IPA Terpadu</option>
                  <option value="IPS Terpadu">IPS Terpadu</option>
                  <option value="Informatika">Informatika / Komputer</option>
                  <option value="Prakarya">Prakarya & Kewirausahaan</option>
                </optgroup>
                <optgroup label="Peminatan MIPA (SMA / SMK)">
                  <option value="Fisika">Fisika</option>
                  <option value="Kimia">Kimia</option>
                  <option value="Biologi">Biologi</option>
                  <option value="Matematika Tingkat Lanjut">Matematika Tingkat Lanjut</option>
                </optgroup>
                <optgroup label="Peminatan IPS & Humaniora (SMA / SMK)">
                  <option value="Ekonomi">Ekonomi</option>
                  <option value="Sosiologi">Sosiologi</option>
                  <option value="Geografi">Geografi</option>
                  <option value="Sejarah">Sejarah</option>
                  <option value="Antropologi">Antropologi</option>
                </optgroup>
                <optgroup label="Seni & Bahasa">
                  <option value="Seni Rupa">Seni Rupa</option>
                  <option value="Seni Musik">Seni Musik</option>
                  <option value="Seni Tari">Seni Tari</option>
                  <option value="Seni Teater">Seni Teater</option>
                  <option value="Bahasa Daerah">Bahasa Daerah / Mulok</option>
                </optgroup>
                <optgroup label="Pendidikan Agama & Budi Pekerti">
                  <option value="Pendidikan Agama Islam">Pendidikan Agama Islam (PAI)</option>
                  <option value="Pendidikan Agama Kristen">Pendidikan Agama Kristen</option>
                  <option value="Pendidikan Agama Katolik">Pendidikan Agama Katolik</option>
                  <option value="Pendidikan Agama Hindu">Pendidikan Agama Hindu</option>
                  <option value="Pendidikan Agama Buddha">Pendidikan Agama Buddha</option>
                  <option value="Pendidikan Agama Konghucu">Pendidikan Agama Konghucu</option>
                </optgroup>
              </select>
            </div>

            {/* Durasi Waktu Menjawab */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Waktu Menjawab Per Soal
              </label>
              <div className="flex items-center gap-1.5">
                {[15, 20, 30, 45, 60].map((dur) => (
                  <button
                    type="button"
                    key={dur}
                    onClick={() => {
                      playClick();
                      setDurationPerQuestionSec(dur);
                    }}
                    className={`flex-1 py-2 rounded-xl font-bold text-xs min-h-[42px] transition-all ${
                      durationPerQuestionSec === dur
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                    }`}
                  >
                    {dur}s
                  </button>
                ))}
              </div>
            </div>

            {/* Gelar Hadiah Kuis */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Gelar Hadiah Kuis (Lencana Siswa)
              </label>
              <input
                type="text"
                value={badgeTitle}
                onChange={(e) => setBadgeTitle(e.target.value)}
                placeholder="Contoh: Juara Pancasila, Ahli Sains Cilik"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-sm focus:border-blue-500 focus:outline-none min-h-[44px]"
              />
            </div>

            {/* Pilihan Ikon Sampul */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Pilih Ikon Sampul Kuis
              </label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((em) => (
                  <button
                    type="button"
                    key={em}
                    onClick={() => {
                      playClick();
                      setCoverEmoji(em);
                    }}
                    className={`w-11 h-11 rounded-2xl text-2xl flex items-center justify-center border transition-all min-h-[44px] min-w-[44px] btn-press ${
                      coverEmoji === em
                        ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-500 ring-2 ring-blue-400 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* Visibilitas & Akses Kuis */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Visibilitas & Akses Kuis <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    visibility === 'public'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-400'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 hover:bg-slate-100/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={visibility === 'public'}
                    onChange={() => setVisibility('public')}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-600" /> Publik di Katalog Siswa
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Kuis langsung muncul di katalog beranda siswa dan dapat diakses semua orang.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    visibility === 'private'
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 ring-1 ring-amber-400'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 hover:bg-slate-100/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={visibility === 'private'}
                    onChange={() => setVisibility('private')}
                    className="mt-1 text-amber-600 focus:ring-amber-500"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-600" /> Privat (Hanya Lewat PIN)
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Kuis disembunyikan dari katalog umum, hanya siswa yang memiliki PIN yang dapat masuk.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Mode Permainan Bawaan */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Mode Permainan Bawaan
                </label>
                <span className="text-[11px] text-slate-400">
                  Dapat diubah siswa saat lobi kuis
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setDefaultGameMode('standard');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    defaultGameMode === 'standard'
                      ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 ring-1 ring-blue-400'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 hover:bg-slate-100/50'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Standar ⏱️
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Timer per soal dengan tantangan skor kecepatan.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setDefaultGameMode('survival_3hearts');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    defaultGameMode === 'survival_3hearts'
                      ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 ring-1 ring-rose-400'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 hover:bg-slate-100/50'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    3 Hati (Survival) ❤️
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    3 nyawa. Salah atau waktu habis berkurang 1 hati.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setDefaultGameMode('untimed');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    defaultGameMode === 'untimed'
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-1 ring-emerald-400'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 hover:bg-slate-100/50'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Santai (Tanpa Timer) 🧘
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Waktu bebas tanpa batas, fokus pemahaman materi.
                  </span>
                </button>
              </div>
            </div>

            {/* Opsi Pengacakan */}
            <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    🔀 Acak Urutan Soal untuk Tiap Siswa
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shuffleOptions}
                    onChange={(e) => setShuffleOptions(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    🎲 Acak Pilihan Opsi Jawaban (A/B/C/D)
                  </span>
                </label>
              </div>
            </div>

          </div>

          {/* Footer Navigasi Langkah */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                playClick();
                onBack();
              }}
              className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 min-h-[44px] flex items-center gap-1.5 transition-colors btn-press"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>

            <button
              type="button"
              onClick={handleNextClick}
              disabled={!isTitleFilled}
              className="px-6 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm min-h-[44px] flex items-center gap-2 btn-press transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isAiMode ? 'Lanjut ke Pratinjau' : 'Lanjut ke Bank Soal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Kolom Kanan: Pratinjau Kartu Siswa Real-Time & Checklist Fungsional (4 kolom di layar besar) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Card 1: Pratinjau Tampilan Kartu Kuis Real-Time */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span>👁️ Pratinjau Kartu Siswa</span>
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
                Live Preview
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0 shadow-xs border border-slate-200 dark:border-slate-700">
                  {coverEmoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Kelas {grade} {educationLevel ? (educationLevel === 'SMA' ? 'SMA / SMK' : educationLevel === 'SMP' ? 'SMP' : 'SD') : (grade >= 10 ? 'SMA / SMK' : grade >= 7 ? 'SMP' : 'SD')}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                      {subject}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2">
                    {title || 'Judul Kuis Anda'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {description || 'Deskripsi kuis interaktif pembelajaran Kurikulum Merdeka.'}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> {durationPerQuestionSec}s / soal
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-500" /> {badgeTitle || 'Lencana'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Checklist Kesiapan Kuis Fungsional */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-card space-y-3">
            <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Status Kesiapan Kuis</span>
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 ${isTitleFilled ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
                <span className={isTitleFilled ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-slate-400'}>
                  Judul kuis telah diisi
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-slate-800 dark:text-slate-200 font-semibold">
                  Mata pelajaran & kelas ditentukan ({subject}, Kls {grade})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-slate-800 dark:text-slate-200 font-semibold">
                  Durasi timer ({durationPerQuestionSec} detik / soal)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 ${questionsCount > 0 ? 'text-emerald-500' : 'text-amber-500'}`} />
                <span className={questionsCount > 0 ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-amber-600 dark:text-amber-400 font-semibold'}>
                  {questionsCount > 0 ? `${questionsCount} butir soal tersedia` : 'Belum ada butir soal'}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
