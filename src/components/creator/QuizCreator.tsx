import React, { useState } from 'react';
import type { Quiz, QuizQuestion, Subject } from '../../types/quiz';
import { useBackHandler } from '../../lib/navigationHistory';
import { ThemeToggle } from '../common/ThemeToggle';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Save, 
  HelpCircle, 
  BookOpen, 
  Eye, 
  Layers, 
  Upload,
  Globe,
  Lock
} from 'lucide-react';

interface QuizCreatorProps {
  onBack: () => void;
  onSaveQuiz: (newQuiz: Quiz) => void;
  playClick: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

const EMOJI_OPTIONS = ['🍎', '📐', '🐸', '🌱', '🫀', '🦅', '🚀', '📚', '🎨', '🔬', '⚽', '🦁', '🐯', '🐼', '💡', '🧩'];

const PRESET_STICKERS = [
  '🍎 🍎 🍎 + 🍎 🍎',
  '🍕 1 dari 4 Bagian',
  '⏹️ Bangun Persegi Sisi 6 cm',
  '🔺 Segitiga Tiga Sisi',
  '🐸 Katak Amfibi',
  '🐟 Ikan Berenang',
  '🌱 Bagian Daun & Akar',
  '☀️ Cahaya Matahari',
  '🐘 Gajah Berbelalai',
  '❤️ Jantung Berdetak',
  '🇮🇩 Burung Garuda Pancasila',
  '🪙 Koin Logam Lingkaran'
];

export const QuizCreator: React.FC<QuizCreatorProps> = ({
  onBack,
  onSaveQuiz,
  playClick,
  isDark = false,
  onToggleTheme = () => {},
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // General Quiz State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState<Subject>('Matematika');
  const [grade, setGrade] = useState<number>(3);
  const [durationPerQuestionSec, setDurationPerQuestionSec] = useState<number>(30);
  const [coverEmoji, setCoverEmoji] = useState('🍎');
  const [badgeTitle, setBadgeTitle] = useState('Bintang Pintar');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  // Questions State
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  // Active Question Form State
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState<'multiple_choice' | 'true_false'>('multiple_choice');
  const [qImageCaption, setQImageCaption] = useState('');
  const [qImageUrl, setQImageUrl] = useState<string | undefined>(undefined);
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrectIndex, setQCorrectIndex] = useState<number>(0);
  const [qExplanation, setQExplanation] = useState('');
  const [isAddingQuestion, setIsAddingQuestion] = useState(true);

  // 1. Level 2 (Prioritas 50): Mundur dari Langkah 3 (Pratinjau) ke Langkah 2 (Soal)
  useBackHandler('creator-step-3', 50, () => {
    if (currentStep === 3) {
      setCurrentStep(2);
      return true;
    }
    return false;
  }, currentStep === 3);

  // 2. Level 2 (Prioritas 50): Mundur dari Langkah 2 ke Langkah 1, atau tutup form tambah soal
  useBackHandler('creator-step-2', 50, () => {
    if (currentStep === 2) {
      if (isAddingQuestion && questions.length > 0) {
        setIsAddingQuestion(false);
        return true;
      }
      setCurrentStep(1);
      return true;
    }
    return false;
  }, currentStep === 2);

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...qOptions];
    updated[index] = value;
    setQOptions(updated);
  };

  const handleTypeChange = (type: 'multiple_choice' | 'true_false') => {
    setQType(type);
    if (type === 'true_false') {
      setQOptions(['Benar', 'Salah']);
      setQCorrectIndex(0);
    } else {
      setQOptions(['', '', '', '']);
      setQCorrectIndex(0);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setQImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();

    if (!qText.trim()) {
      alert('Teks pertanyaan wajib diisi.');
      return;
    }

    const validOptions = qOptions.filter((opt) => opt.trim() !== '');
    if (validOptions.length < 2) {
      alert('Minimal harus ada 2 pilihan jawaban.');
      return;
    }

    const newQuestion: QuizQuestion = {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      text: qText.trim(),
      type: qType,
      imageCaption: qImageCaption.trim() || undefined,
      imageUrl: qImageUrl,
      options: validOptions,
      correctIndex: Math.min(qCorrectIndex, validOptions.length - 1),
      explanation: qExplanation.trim() || 'Jawaban ini benar sesuai dengan konsep materi terkait.',
    };

    setQuestions([...questions, newQuestion]);

    setQText('');
    setQImageCaption('');
    setQImageUrl(undefined);
    setQExplanation('');
    if (qType === 'true_false') {
      setQOptions(['Benar', 'Salah']);
    } else {
      setQOptions(['', '', '', '']);
    }
    setQCorrectIndex(0);
    setIsAddingQuestion(false);
  };

  const handleDeleteQuestion = (id: string) => {
    playClick();
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleFinalPublish = () => {
    playClick();
    if (!title.trim()) {
      alert('Judul kuis tidak boleh kosong.');
      setCurrentStep(1);
      return;
    }
    if (questions.length === 0) {
      alert('Kuis minimal harus memiliki 1 soal.');
      setCurrentStep(2);
      return;
    }

    const finalQuiz: Quiz = {
      id: 'custom_' + Date.now(),
      title: title.trim(),
      description: description.trim() || `Kuis interaktif buatan Guru untuk Kelas ${grade} SD.`,
      subject,
      grade,
      durationPerQuestionSec,
      coverEmoji,
      themeColor: 'from-blue-600 to-indigo-600',
      badgeTitle: badgeTitle.trim() || 'Bintang Juara',
      visibility,
      questions,
    };

    onSaveQuiz(finalQuiz);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 select-none flex flex-col">
      
      {/* Top Header */}
      <header className="w-full sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 py-3 shadow-sm">
        <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => {
              playClick();
              onBack();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm min-h-[42px] btn-press transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>

          <div className="text-center">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
              Studio Penyusun Kuis Guru 🧑‍🏫
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Langkah {currentStep} dari 3: {currentStep === 1 ? 'Informasi Kuis' : currentStep === 2 ? 'Bank Soal' : 'Pratinjau'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
            <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-lg">
              {questions.length} Soal
            </span>
          </div>
        </div>

        {/* Step Tabs */}
        <div className="w-full max-w-5xl mx-auto mt-2.5 grid grid-cols-3 gap-2">
          <button
            onClick={() => {
              playClick();
              setCurrentStep(1);
            }}
            className={`py-2 rounded-lg font-bold text-xs sm:text-sm transition-all min-h-[40px] ${
              currentStep === 1
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            1. Info Kuis
          </button>
          <button
            onClick={() => {
              playClick();
              setCurrentStep(2);
            }}
            className={`py-2 rounded-lg font-bold text-xs sm:text-sm transition-all min-h-[40px] ${
              currentStep === 2
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            2. Bank Soal ({questions.length})
          </button>
          <button
            onClick={() => {
              playClick();
              setCurrentStep(3);
            }}
            className={`py-2 rounded-lg font-bold text-xs sm:text-sm transition-all min-h-[40px] ${
              currentStep === 3
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            3. Pratinjau
          </button>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-8 pt-5 flex-1">

        {/* ================= STEP 1: GENERAL INFO ================= */}
        {currentStep === 1 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-card space-y-5 animate-fade-in">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Informasi Dasar Kuis</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Judul Kuis <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none font-semibold text-sm min-h-[44px]"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Deskripsi / Petunjuk untuk Siswa
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Kelas SD <span className="text-rose-500">*</span>
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:outline-none font-semibold text-sm min-h-[44px] bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {[1, 2, 3, 4, 5, 6].map((g) => (
                    <option key={g} value={g}>Kelas {g} SD</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as Subject)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:outline-none font-semibold text-sm min-h-[44px] bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Matematika">Matematika</option>
                  <option value="IPA">IPA (Sains)</option>
                  <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                  <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                  <option value="Pengetahuan Umum">Pengetahuan Umum</option>
                </select>
              </div>

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
                      className={`flex-1 py-2 rounded-lg font-bold text-xs min-h-[40px] ${
                        durationPerQuestionSec === dur
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {dur}s
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Gelar Hadiah Kuis
                </label>
                <input
                  type="text"
                  value={badgeTitle}
                  onChange={(e) => setBadgeTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none font-semibold text-sm min-h-[44px]"
                />
              </div>

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
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition-all ${
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

              {/* Visibility Selector */}
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
                    className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all min-h-[48px] btn-press ${
                      visibility === 'public'
                        ? 'bg-blue-50/80 border-blue-500 text-blue-950 dark:bg-blue-950/40 dark:border-blue-500 dark:text-blue-100 ring-2 ring-blue-400/30 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                    }`}
                  >
                    <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                        <span>🌐 Publik (Katalog Siswa)</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        Tampil di beranda siswa dan katalog publik. Semua siswa dapat langsung melihat dan memainkannya.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setVisibility('private');
                    }}
                    className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all min-h-[48px] btn-press ${
                      visibility === 'private'
                        ? 'bg-amber-50/80 border-amber-500 text-amber-950 dark:bg-amber-950/40 dark:border-amber-500 dark:text-amber-100 ring-2 ring-amber-400/30 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                    }`}
                  >
                    <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                        <span>🔒 Privat (Hanya Lewat PIN)</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        Tersembunyi dari katalog publik siswa. Hanya siswa dengan PIN 4 digit atau tautan langsung yang dapat mengakses.
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  if (!title.trim()) {
                    alert('Silakan isi judul kuis terlebih dahulu.');
                    return;
                  }
                  setCurrentStep(2);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm flex items-center gap-2 min-h-[44px] btn-press text-sm"
              >
                <span>Lanjut ke Bank Soal</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: BANK SOAL ================= */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              
              {/* Question Bank List */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Bank Soal ({questions.length})
                  </h3>
                  {!isAddingQuestion && (
                    <button
                      onClick={() => {
                        playClick();
                        setIsAddingQuestion(true);
                      }}
                      className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 font-bold text-xs flex items-center gap-1 min-h-[36px]"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Soal
                    </button>
                  )}
                </div>

                {questions.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Belum ada soal. Tulis soal pertamamu di formulir sebelah kanan.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    {questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 flex items-start justify-between gap-2.5"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                              {q.type === 'multiple_choice' ? 'Pilgan' : 'Benar/Salah'}
                            </span>
                          </div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-xs line-clamp-2 break-words">{q.text}</p>
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold truncate">
                            ✓ Kunci: {q.options[q.correctIndex]}
                          </p>
                        </div>

                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center flex-shrink-0"
                          title="Hapus Soal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Input Soal */}
              <div className="lg:col-span-7">
                {isAddingQuestion ? (
                  <form
                    onSubmit={handleSaveQuestion}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-card space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Tambah Soal #{questions.length + 1}
                      </h3>

                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => handleTypeChange('multiple_choice')}
                          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all min-h-[34px] ${
                            qType === 'multiple_choice'
                              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          Pilihan Ganda
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTypeChange('true_false')}
                          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all min-h-[34px] ${
                            qType === 'true_false'
                              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          Benar / Salah
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Teks Pertanyaan <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        value={qText}
                        onChange={(e) => setQText(e.target.value)}
                        rows={2}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none font-semibold text-sm min-h-[44px]"
                        required
                      />
                    </div>

                    {/* Sisipkan Ilustrasi */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Sisipkan Gambar / Ilustrasi (Opsional)
                      </label>

                      <div className="flex flex-wrap gap-1">
                        {PRESET_STICKERS.map((stk) => (
                          <button
                            type="button"
                            key={stk}
                            onClick={() => {
                              playClick();
                              setQImageCaption(stk);
                            }}
                            className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors min-h-[32px] ${
                              qImageCaption === stk
                                ? 'bg-blue-600 text-white border-blue-600 font-bold'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            {stk}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <input
                          type="text"
                          value={qImageCaption}
                          onChange={(e) => setQImageCaption(e.target.value)}
                          aria-label="Deskripsi ilustrasi"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                        />

                        <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer min-h-[36px]">
                          <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
                            {qImageUrl ? '✓ Foto Terpilih' : 'Unggah Foto'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Pilihan Jawaban */}
                    <div className="space-y-2 pt-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Opsi Jawaban & Kunci Benar (Klik Lingkaran untuk Menandai Kunci)
                      </label>

                      {qOptions.map((opt, idx) => {
                        const isCorrect = qCorrectIndex === idx;
                        const letters = ['A', 'B', 'C', 'D'];
                        return (
                          <div
                            key={idx}
                            className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all ${
                              isCorrect
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 dark:border-emerald-600 shadow-sm'
                                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                playClick();
                                setQCorrectIndex(idx);
                              }}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all flex-shrink-0 ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                              }`}
                              title="Tandai Kunci Jawaban Benar"
                            >
                              {isCorrect ? '✓' : letters[idx]}
                            </button>

                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleOptionChange(idx, e.target.value)}
                              aria-label={`Pilihan ${letters[idx]}`}
                              disabled={qType === 'true_false'}
                              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-500 min-h-[38px]"
                              required
                            />

                            {isCorrect && (
                              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-md whitespace-nowrap">
                                Kunci Benar
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Catatan Penjelasan */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Penjelasan Pembahasan
                      </label>
                      <input
                        type="text"
                        value={qExplanation}
                        onChange={(e) => setQExplanation(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none font-medium text-xs sm:text-sm min-h-[40px]"
                      />
                    </div>

                    <div className="pt-2 flex gap-2">
                      {questions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsAddingQuestion(false)}
                          className="px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[42px]"
                        >
                          Tutup Form
                        </button>
                      )}
                      <button
                        type="submit"
                        className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-1.5 min-h-[42px] btn-press text-xs sm:text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Simpan Soal ke Bank Soal</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-2.5">
                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">Formulir soal sedang ditutup.</p>
                    <button
                      onClick={() => {
                        playClick();
                        setIsAddingQuestion(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs inline-flex items-center gap-1.5 min-h-[40px]"
                    >
                      <Plus className="w-4 h-4" /> Tambah Soal Baru
                    </button>
                  </div>
                )}
              </div>

            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setCurrentStep(1);
                }}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 min-h-[42px] hover:bg-slate-50 dark:hover:bg-slate-750"
              >
                ← Kembali ke Info
              </button>

              <button
                type="button"
                onClick={() => {
                  playClick();
                  if (questions.length === 0) {
                    alert('Tambahkan minimal 1 soal terlebih dahulu.');
                    return;
                  }
                  setCurrentStep(3);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-sm flex items-center gap-1.5 min-h-[42px] btn-press text-xs sm:text-sm"
              >
                <span>Lihat Pratinjau ({questions.length} Soal)</span>
                <Eye className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* ================= STEP 3: PREVIEW & PUBLISH ================= */}
        {currentStep === 3 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-card space-y-5 animate-fade-in max-w-3xl mx-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Pratinjau Kuis Siswa</h2>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Siap Diterbitkan</span>
            </div>

            {/* Simulated Card */}
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-2xl select-none flex-shrink-0 shadow-xs">
                    {coverEmoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg border block w-fit max-w-full truncate bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                      {subject}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-600 font-bold text-xs whitespace-nowrap">
                    Kelas {grade} SD
                  </span>
                </div>
              </div>

              <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug break-words line-clamp-2">{title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description || 'Kuis interaktif buatan Guru SD.'}</p>

              <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-medium pt-3 border-t border-slate-100 dark:border-slate-700">
                <span>{questions.length} Soal</span>
                <span>{durationPerQuestionSec}s per soal</span>
                <span>Lencana: {badgeTitle}</span>
              </div>
            </div>

            {/* Questions Summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Ringkasan {questions.length} Soal:
              </h4>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div className="truncate mr-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400 mr-1.5">#{idx + 1}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{q.text}</span>
                    </div>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded text-[11px] flex-shrink-0">
                      {q.options[q.correctIndex]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setCurrentStep(2);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[44px]"
              >
                ← Edit Soal
              </button>

              <button
                type="button"
                onClick={handleFinalPublish}
                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-sm flex items-center justify-center gap-2 min-h-[44px] btn-press text-xs sm:text-sm"
              >
                <Save className="w-4 h-4" />
                <span>Terbitkan Kuis Sekarang</span>
              </button>
            </div>
          </div>
        )}

      </main>

    </div>
  );
};
