import React, { useState } from 'react';
import type { Quiz, QuizQuestion, Subject } from '../../types/quiz';
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
  Upload 
} from 'lucide-react';

interface QuizCreatorProps {
  onBack: () => void;
  onSaveQuiz: (newQuiz: Quiz) => void;
  playClick: () => void;
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
      questions,
    };

    onSaveQuiz(finalQuiz);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 pb-20 select-none flex flex-col">
      
      {/* Top Header */}
      <header className="w-full sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 shadow-sm">
        <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => {
              playClick();
              onBack();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm min-h-[42px] btn-press"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>

          <div className="text-center">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Studio Penyusun Kuis Guru 🧑‍🏫
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Langkah {currentStep} dari 3: {currentStep === 1 ? 'Informasi Kuis' : currentStep === 2 ? 'Bank Soal' : 'Pratinjau'}
            </p>
          </div>

          <div className="w-20 flex justify-end">
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
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
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-5 animate-fade-in">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Informasi Dasar Kuis</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Judul Kuis <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Ulangan Harian IPA: Mengenal Tumbuhan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none font-semibold text-sm min-h-[44px]"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Deskripsi / Petunjuk untuk Siswa
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tuliskan petunjuk pengerjaan yang ramah anak..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Target Kelas SD <span className="text-rose-500">*</span>
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:outline-none font-semibold text-sm min-h-[44px] bg-white"
                >
                  {[1, 2, 3, 4, 5, 6].map((g) => (
                    <option key={g} value={g}>Kelas {g} SD</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as Subject)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:outline-none font-semibold text-sm min-h-[44px] bg-white"
                >
                  <option value="Matematika">Matematika</option>
                  <option value="IPA">IPA (Sains)</option>
                  <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                  <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                  <option value="Pengetahuan Umum">Pengetahuan Umum</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {dur}s
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Gelar Hadiah Kuis
                </label>
                <input
                  type="text"
                  value={badgeTitle}
                  onChange={(e) => setBadgeTitle(e.target.value)}
                  placeholder="Misal: Juara Matematika"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:outline-none font-semibold text-sm min-h-[44px]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                          ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-400 shadow-sm'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
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
              <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" /> Bank Soal ({questions.length})
                  </h3>
                  {!isAddingQuestion && (
                    <button
                      onClick={() => {
                        playClick();
                        setIsAddingQuestion(true);
                      }}
                      className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1 min-h-[36px]"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Soal
                    </button>
                  )}
                </div>

                {questions.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Belum ada soal. Tulis soal pertamamu di formulir sebelah kanan.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    {questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-start justify-between gap-2.5"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 uppercase">
                              {q.type === 'multiple_choice' ? 'Pilgan' : 'Benar/Salah'}
                            </span>
                          </div>
                          <p className="font-bold text-slate-800 text-xs line-clamp-2 break-words">{q.text}</p>
                          <p className="text-[11px] text-emerald-700 font-semibold truncate">
                            ✓ Kunci: {q.options[q.correctIndex]}
                          </p>
                        </div>

                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center flex-shrink-0"
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
                    className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-card space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Plus className="w-4 h-4 text-blue-600" />
                        Tambah Soal #{questions.length + 1}
                      </h3>

                      <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => handleTypeChange('multiple_choice')}
                          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all min-h-[34px] ${
                            qType === 'multiple_choice'
                              ? 'bg-white text-blue-600 shadow-sm font-bold'
                              : 'text-slate-600'
                          }`}
                        >
                          Pilihan Ganda
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTypeChange('true_false')}
                          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all min-h-[34px] ${
                            qType === 'true_false'
                              ? 'bg-white text-blue-600 shadow-sm font-bold'
                              : 'text-slate-600'
                          }`}
                        >
                          Benar / Salah
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Teks Pertanyaan <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        value={qText}
                        onChange={(e) => setQText(e.target.value)}
                        placeholder="Tuliskan pertanyaan yang jelas dan mudah dipahami..."
                        rows={2}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none font-semibold text-sm min-h-[44px]"
                        required
                      />
                    </div>

                    {/* Sisipkan Ilustrasi */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
                      <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600" /> Sisipkan Gambar / Ilustrasi (Opsional)
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
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
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
                          placeholder="Ketik deskripsi ilustrasi..."
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium bg-white"
                        />

                        <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 bg-white hover:bg-slate-50 cursor-pointer min-h-[36px]">
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-xs font-medium text-slate-600 truncate">
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
                      <label className="block text-xs font-bold text-slate-700">
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
                                ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                                : 'bg-white border-slate-200'
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
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                              title="Tandai Kunci Jawaban Benar"
                            >
                              {isCorrect ? '✓' : letters[idx]}
                            </button>

                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleOptionChange(idx, e.target.value)}
                              placeholder={`Pilihan ${letters[idx]}`}
                              disabled={qType === 'true_false'}
                              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-500 min-h-[38px]"
                              required
                            />

                            {isCorrect && (
                              <span className="text-[11px] font-bold text-emerald-700 px-2 py-0.5 bg-emerald-100 rounded-md whitespace-nowrap">
                                Kunci Benar
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Catatan Penjelasan */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-blue-600" /> Penjelasan Pembahasan
                      </label>
                      <input
                        type="text"
                        value={qExplanation}
                        onChange={(e) => setQExplanation(e.target.value)}
                        placeholder="Contoh: Karena katak bernapas dengan paru-paru dan kulit..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:outline-none font-medium text-xs sm:text-sm min-h-[40px]"
                      />
                    </div>

                    <div className="pt-2 flex gap-2">
                      {questions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsAddingQuestion(false)}
                          className="px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 min-h-[42px]"
                        >
                          Tutup Form
                        </button>
                      )}
                      <button
                        type="submit"
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-1.5 min-h-[42px] btn-press text-xs sm:text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Simpan Soal ke Bank Soal</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 p-6 space-y-2.5">
                    <p className="font-semibold text-slate-700 text-xs sm:text-sm">Formulir soal sedang ditutup.</p>
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

            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setCurrentStep(1);
                }}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-700 bg-white border border-slate-200 min-h-[42px]"
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
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-5 animate-fade-in max-w-3xl mx-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Pratinjau Kuis Siswa</h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">Siap Diterbitkan</span>
            </div>

            {/* Simulated Card */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-3xl select-none">{coverEmoji}</span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-xs">
                    Kelas {grade} SD
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-xs">
                    {subject}
                  </span>
                </div>
              </div>

              <h4 className="text-base font-bold text-slate-900 mt-2">{title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{description || 'Kuis interaktif buatan Guru SD.'}</p>

              <div className="flex items-center justify-between text-xs text-slate-400 font-medium pt-3 border-t border-slate-100">
                <span>{questions.length} Soal</span>
                <span>{durationPerQuestionSec}s per soal</span>
                <span>Lencana: {badgeTitle}</span>
              </div>
            </div>

            {/* Questions Summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Ringkasan {questions.length} Soal:
              </h4>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div className="truncate mr-2">
                      <span className="font-bold text-blue-600 mr-1.5">#{idx + 1}</span>
                      <span className="font-medium text-slate-800">{q.text}</span>
                    </div>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] flex-shrink-0">
                      {q.options[q.correctIndex]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setCurrentStep(2);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 min-h-[44px]"
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
