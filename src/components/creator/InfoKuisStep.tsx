import React from 'react';
import type { Subject, GameMode } from '../../types/quiz';
import { 
  BookOpen, 
  ArrowLeft, 
  ArrowRight, 
  Globe, 
  Lock, 
  CheckCircle2
} from 'lucide-react';

const EMOJI_OPTIONS = ['🍎', '📐', '🐸', '🌱', '🫀', '🦅', '🚀', '📚', '🎨', '🔬', '⚽', '🦁', '🐯', '🐼', '💡', '🧩'];

interface InfoKuisStepProps {
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  grade: number;
  setGrade: (v: number) => void;
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
  const isTitleFilled = title.trim().length > 0;

  const handleNextClick = () => {
    playClick();
    if (!isTitleFilled) {
      alert('Mohon isi judul kuis terlebih dahulu.');
      return;
    }
    onNext();
  };

  return (
    <div className="max-w-6xl 2xl:max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 animate-fade-in space-y-6">
      
      {/* 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Kolom Kiri: Formulir Utama (8 kolom di layar besar) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-card space-y-6">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  Informasi Dasar Kuis
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isAiMode ? 'Sesuaikan judul dan preferensi kuis yang dibuat AI' : 'Lengkapi detail identitas kuis sebelum menyusun soal'}
                </p>
              </div>
            </div>

            <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {questionsCount} Butir Soal
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            
            {/* Judul Kuis */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Judul Kuis <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Kuis IPAS: Sistem Pencernaan Manusia"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm sm:text-base focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[46px]"
                required
              />
            </div>

            {/* Deskripsi */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Deskripsi / Petunjuk untuk Siswa
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Berikan arahan singkat kepada siswa sebelum mereka memulai kuis..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Target Kelas */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Kelas <span className="text-rose-500">*</span>
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-sm focus:border-blue-500 focus:outline-none min-h-[44px]"
              >
                {[1, 2, 3, 4, 5, 6].map((g) => (
                  <option key={g} value={g}>Kelas {g} SD</option>
                ))}
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
                <option value="Matematika">Matematika</option>
                <option value="IPA">IPA (Sains)</option>
                <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                <option value="Pengetahuan Umum">Pengetahuan Umum</option>
              </select>
            </div>

            {/* Waktu Menjawab */}
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

            {/* Mode Permainan Bawaan */}
            <div className="sm:col-span-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                <span>Mode Permainan Bawaan</span>
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">Dapat diubah siswa saat lobi kuis</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'standard' as GameMode, title: 'Standar ⏱️', sub: 'Timer per soal dengan tantangan skor kecepatan.' },
                  { id: 'survival_3hearts' as GameMode, title: '3 Hati (Survival) ❤️', sub: '3 nyawa. Salah atau waktu habis berkurang 1 hati.' },
                  { id: 'untimed' as GameMode, title: 'Santai (Tanpa Timer) 🧘', sub: 'Waktu bebas tanpa batas, fokus pemahaman materi.' }
                ].map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => { playClick(); setDefaultGameMode(m.id); }}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between min-h-[64px] transition-all btn-press ${
                      defaultGameMode === m.id
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-2 ring-blue-400/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-bold text-xs sm:text-sm">{m.title}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{m.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Visibilitas & Akses Kuis */}
            <div className="sm:col-span-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Visibilitas & Akses Kuis <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setVisibility('public');
                  }}
                  className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all min-h-[48px] btn-press ${
                    visibility === 'public'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-400'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-xs sm:text-sm block">Publik di Katalog</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Muncul di beranda siswa dan bisa dicari semua anak</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setVisibility('private');
                  }}
                  className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all min-h-[48px] btn-press ${
                    visibility === 'private'
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100 ring-2 ring-amber-400'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-xs sm:text-sm block">Khusus PIN Kelas (Privat)</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Hanya siswa yang memasukkan 4 digit PIN yang dapat masuk</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Opsi Pengacakan Soal & Jawaban */}
            <div className="sm:col-span-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Opsi Mode & Pengacakan Siswa
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Acak Urutan Soal</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Urutan soal berbeda untuk setiap siswa</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shuffleOptions}
                    onChange={(e) => setShuffleOptions(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Acak Opsi Pilihan Ganda</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Letak opsi A, B, C, D diacak di tiap anak</span>
                  </div>
                </label>
              </div>
            </div>

          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800 gap-3">
            <button
              type="button"
              onClick={() => {
                playClick();
                onBack();
              }}
              className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 min-h-[44px] flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isAiMode ? 'Kembali ke Bank Soal' : 'Kembali'}</span>
            </button>

            <button
              type="button"
              onClick={handleNextClick}
              className="px-6 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm min-h-[44px] flex items-center gap-2 btn-press transition-all"
            >
              <span>{isAiMode ? 'Lanjut ke Pratinjau' : 'Lanjut ke Bank Soal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Kolom Kanan: Pratinjau Kartu & Checklist Kesiapan (4 kolom di layar besar) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Card 1: Pratinjau Tampilan Kartu Kuis */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pratinjau Kartu Kuis
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                Live Preview
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0 shadow-xs border border-slate-200 dark:border-slate-700">
                  {coverEmoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Kelas {grade} SD
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                      {subject}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2">
                    {title || 'Judul Kuis Anda'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {description || 'Deskripsi kuis interaktif pembelajaran SD.'}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                <span>⏱️ {durationPerQuestionSec}s / soal</span>
                <span>🏆 {badgeTitle || 'Lencana'}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Checklist Kesiapan */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
              Checklist Kesiapan Kuis:
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
                  Mata pelajaran & kelas ditentukan
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-slate-800 dark:text-slate-200 font-semibold">
                  Durasi timer ({durationPerQuestionSec}s) dipilih
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
