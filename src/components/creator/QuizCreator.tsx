import React, { useState } from 'react';
import type { Quiz, QuizQuestion, Subject } from '../../types/quiz';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Sparkles, 
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
const THEME_OPTIONS = [
  { name: 'Biru Angkasa', class: 'from-blue-500 to-indigo-600', bg: 'bg-blue-600' },
  { name: 'Hijau Alam', class: 'from-emerald-400 to-teal-600', bg: 'bg-emerald-600' },
  { name: 'Oranye Ceria', class: 'from-amber-400 to-orange-500', bg: 'bg-amber-500' },
  { name: 'Ungu Juara', class: 'from-purple-500 to-indigo-700', bg: 'bg-purple-600' },
  { name: 'Merah Semangat', class: 'from-rose-500 to-red-600', bg: 'bg-rose-600' },
];

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
  // Step Management: 1 = General Info, 2 = Questions List & Form, 3 = Preview & Publish
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // General Quiz State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState<Subject>('Matematika');
  const [grade, setGrade] = useState<number>(3);
  const [durationPerQuestionSec, setDurationPerQuestionSec] = useState<number>(30);
  const [coverEmoji, setCoverEmoji] = useState('🍎');
  const [themeColor, setThemeColor] = useState(THEME_OPTIONS[0].class);
  const [badgeTitle, setBadgeTitle] = useState('Bintang Pintar');

  // Questions State
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  // Active Question Editor Form
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState<'multiple_choice' | 'true_false'>('multiple_choice');
  const [qImageCaption, setQImageCaption] = useState('');
  const [qImageUrl, setQImageUrl] = useState<string | undefined>(undefined);
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrectIndex, setQCorrectIndex] = useState<number>(0);
  const [qExplanation, setQExplanation] = useState('');
  const [isAddingQuestion, setIsAddingQuestion] = useState(true);

  // Handle Option Change
  const handleOptionChange = (index: number, value: string) => {
    const updated = [...qOptions];
    updated[index] = value;
    setQOptions(updated);
  };

  // Switch Question Type
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

  // Image Upload handler (Base64 DataURL for offline & fast rendering)
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

  // Add Question to List
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

    // Reset Form for next question
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

  // Delete Question
  const handleDeleteQuestion = (id: string) => {
    playClick();
    setQuestions(questions.filter((q) => q.id !== id));
  };

  // Final Publish
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
      themeColor,
      badgeTitle: badgeTitle.trim() || 'Bintang Juara',
      questions,
    };

    onSaveQuiz(finalQuiz);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-sky-50/40 to-indigo-50/40 pb-20 select-none">
      
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-amber-100 px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => {
              playClick();
              onBack();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm min-h-[48px] btn-playful"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>

          <div className="text-center">
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Studio Penyusun Kuis Guru 🧑‍🏫
            </h1>
            <p className="text-[11px] font-bold text-blue-600">
              Langkah {currentStep} dari 3: {currentStep === 1 ? 'Identitas Kuis' : currentStep === 2 ? 'Bank Soal & Gambar' : 'Pratinjau & Terbitkan'}
            </p>
          </div>

          <div className="w-20 flex justify-end">
            <span className="text-xs font-black bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
              {questions.length} Soal
            </span>
          </div>
        </div>

        {/* Step Indicator Tabs */}
        <div className="max-w-4xl mx-auto mt-2 grid grid-cols-3 gap-2">
          <button
            onClick={() => {
              playClick();
              setCurrentStep(1);
            }}
            className={`py-2 rounded-xl font-bold text-xs transition-all min-h-[44px] ${
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
            className={`py-2 rounded-xl font-bold text-xs transition-all min-h-[44px] ${
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
            className={`py-2 rounded-xl font-bold text-xs transition-all min-h-[44px] ${
              currentStep === 3
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            3. Pratinjau
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-4 sm:pt-6">

        {/* ================= STEP 1: GENERAL INFO ================= */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-slate-200 shadow-playful space-y-5 animate-pop-in">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-black text-slate-900">Informasi Kuis Baru</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Judul Kuis */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Judul Kuis <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Ulangan Harian IPA: Ekosistem & Hewan"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-300 focus:border-blue-500 focus:outline-none font-bold text-sm min-h-[48px]"
                  required
                />
              </div>

              {/* Deskripsi */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Deskripsi / Petunjuk untuk Siswa
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ceritakan gambaran kuis ini dengan bahasa yang menyenangkan..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-300 focus:border-blue-500 focus:outline-none font-bold text-sm"
                />
              </div>

              {/* Jenjang Kelas */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Kelas SD <span className="text-rose-500">*</span>
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-300 focus:border-blue-500 focus:outline-none font-bold text-sm min-h-[48px] bg-white"
                >
                  {[1, 2, 3, 4, 5, 6].map((g) => (
                    <option key={g} value={g}>Kelas {g} SD</option>
                  ))}
                </select>
              </div>

              {/* Mata Pelajaran */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as Subject)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-300 focus:border-blue-500 focus:outline-none font-bold text-sm min-h-[48px] bg-white"
                >
                  <option value="Matematika">Matematika</option>
                  <option value="IPA">IPA (Sains)</option>
                  <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                  <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                  <option value="Pengetahuan Umum">Pengetahuan Umum</option>
                </select>
              </div>

              {/* Durasi Waktu */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Waktu Menjawab Per Soal
                </label>
                <div className="flex items-center gap-2">
                  {[15, 20, 30, 45, 60].map((dur) => (
                    <button
                      type="button"
                      key={dur}
                      onClick={() => {
                        playClick();
                        setDurationPerQuestionSec(dur);
                      }}
                      className={`flex-1 py-2 rounded-xl font-bold text-xs min-h-[44px] ${
                        durationPerQuestionSec === dur
                          ? 'bg-amber-400 text-slate-900 shadow-sm font-black'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {dur}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Gelar Lencana */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Lencana Hadiah
                </label>
                <input
                  type="text"
                  value={badgeTitle}
                  onChange={(e) => setBadgeTitle(e.target.value)}
                  placeholder="Misal: Juara Matematika"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-300 focus:border-blue-500 focus:outline-none font-bold text-sm min-h-[48px]"
                />
              </div>

              {/* Pilih Emoji Sampul */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Pilih Tema Warna Kuis
                </label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {THEME_OPTIONS.map((thm) => (
                    <button
                      type="button"
                      key={thm.name}
                      onClick={() => {
                        playClick();
                        setThemeColor(thm.class);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all min-h-[44px] flex items-center gap-2 ${
                        themeColor === thm.class
                          ? 'border-slate-900 shadow-md ring-2 ring-blue-400 font-black'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${thm.bg}`} />
                      <span>{thm.name}</span>
                    </button>
                  ))}
                </div>

                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
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
                      className={`w-12 h-12 rounded-2xl text-2xl flex items-center justify-center border-2 transition-transform ${
                        coverEmoji === em
                          ? 'bg-amber-100 border-amber-500 scale-110 shadow-md ring-2 ring-amber-400'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Next Button */}
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
                className="bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-6 rounded-2xl shadow-playful flex items-center gap-2 min-h-[48px] btn-playful"
              >
                <span>Lanjut: Buat Soal ({questions.length})</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: BANK SOAL & GAMBAR ================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-pop-in">
            
            {/* List of Existing Questions */}
            {questions.length > 0 && (
              <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" /> Daftar Soal ({questions.length})
                  </h3>
                  {!isAddingQuestion && (
                    <button
                      onClick={() => {
                        playClick();
                        setIsAddingQuestion(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1 min-h-[40px]"
                    >
                      <Plus className="w-4 h-4" /> Tambah Soal Lain
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-500 uppercase">
                            {q.type === 'multiple_choice' ? 'Pilihan Ganda' : 'Benar / Salah'}
                          </span>
                          {q.imageCaption && (
                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                              Ilustrasi: {q.imageCaption}
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-slate-800 text-sm">{q.text}</p>
                        <p className="text-xs text-emerald-700 font-extrabold">
                          ✓ Kunci: {q.options[q.correctIndex]}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Hapus Soal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Question Input Form */}
            {isAddingQuestion && (
              <form
                onSubmit={handleSaveQuestion}
                className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-amber-300 shadow-playful space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-amber-500" />
                    Tambah Soal ke-{questions.length + 1}
                  </h3>

                  {/* Question Type Switcher */}
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => handleTypeChange('multiple_choice')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[38px] ${
                        qType === 'multiple_choice'
                          ? 'bg-white text-blue-600 shadow-sm font-black'
                          : 'text-slate-600'
                      }`}
                    >
                      Pilihan Ganda
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeChange('true_false')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[38px] ${
                        qType === 'true_false'
                          ? 'bg-white text-blue-600 shadow-sm font-black'
                          : 'text-slate-600'
                      }`}
                    >
                      Benar / Salah
                    </button>
                  </div>
                </div>

                {/* Teks Pertanyaan */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Teks Pertanyaan <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    placeholder="Tuliskan soal yang mudah dipahami oleh anak..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-slate-300 focus:border-blue-500 focus:outline-none font-bold text-sm min-h-[48px]"
                    required
                  />
                </div>

                {/* Sisipkan Gambar / Ilustrasi */}
                <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-3">
                  <label className="block text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-600" /> Sisipkan Gambar / Ilustrasi (Opsional)
                  </label>

                  {/* Stiker Prasetel Cepat */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                      Pilih Cepat Ilustrasi Edukasi Populer:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_STICKERS.map((stk) => (
                        <button
                          type="button"
                          key={stk}
                          onClick={() => {
                            playClick();
                            setQImageCaption(stk);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors min-h-[36px] ${
                            qImageCaption === stk
                              ? 'bg-amber-400 text-slate-900 border-amber-500 font-black shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-100'
                          }`}
                        >
                          {stk}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Atau Input Teks / Upload Gambar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[11px] font-bold text-slate-600 block mb-1">
                        Ketik Teks Ilustrasi / Emoji Bebas:
                      </span>
                      <input
                        type="text"
                        value={qImageCaption}
                        onChange={(e) => setQImageCaption(e.target.value)}
                        placeholder="Contoh: 🍕 1/4 Bagian Pizza"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs bg-white"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-600 block mb-1">
                        Atau Unggah Foto dari HP / Komputer:
                      </span>
                      <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 border-dashed border-amber-400 bg-white hover:bg-amber-50 cursor-pointer min-h-[42px]">
                        <Upload className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-bold text-slate-600 truncate">
                          {qImageUrl ? '✓ Foto Berhasil Dipilih' : 'Pilih File Gambar'}
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

                  {/* Preview Gambar jika diunggah */}
                  {qImageUrl && (
                    <div className="relative inline-block mt-2">
                      <img
                        src={qImageUrl}
                        alt="Preview Soal"
                        className="h-24 w-auto rounded-xl border border-slate-300 object-cover shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setQImageUrl(undefined)}
                        className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Pilihan Jawaban & Kunci Jawaban */}
                <div className="space-y-2.5 pt-1">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Pilihan Jawaban & Tandai Kunci yang Benar (Klik Lingkaran Hijau)
                  </label>

                  {qOptions.map((opt, idx) => {
                    const isCorrect = qCorrectIndex === idx;
                    const letters = ['A', 'B', 'C', 'D'];
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-2.5 p-2 rounded-2xl border-2 transition-all ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            playClick();
                            setQCorrectIndex(idx);
                          }}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs transition-all min-h-[40px] min-w-[40px] ${
                            isCorrect
                              ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300'
                              : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                          }`}
                          title="Tandai sebagai Kunci Jawaban Benar"
                        >
                          {isCorrect ? '✓' : letters[idx]}
                        </button>

                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          placeholder={`Pilihan ${letters[idx]}`}
                          disabled={qType === 'true_false'}
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-sm focus:outline-none focus:border-blue-500 min-h-[44px]"
                          required
                        />

                        {isCorrect && (
                          <span className="text-xs font-black text-emerald-700 px-2 py-1 bg-emerald-100 rounded-lg">
                            Kunci Benar
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Catatan Penjelasan / Pembahasan */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-blue-600" /> Penjelasan Jawaban (Akan Tampil di Pembahasan)
                  </label>
                  <input
                    type="text"
                    value={qExplanation}
                    onChange={(e) => setQExplanation(e.target.value)}
                    placeholder="Contoh: Karena 3 apel ditambah 2 apel sama dengan 5 apel (3 + 2 = 5)."
                    className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-300 focus:border-blue-500 focus:outline-none font-bold text-xs sm:text-sm min-h-[44px]"
                  />
                </div>

                {/* Action Buttons inside Question Form */}
                <div className="pt-3 flex gap-3">
                  {questions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsAddingQuestion(false)}
                      className="px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 min-h-[48px]"
                    >
                      Batal Tambah
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black py-3 px-5 rounded-2xl shadow-playful flex items-center justify-center gap-2 min-h-[48px] btn-playful"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Simpan Soal Ini ke Kuis</span>
                  </button>
                </div>
              </form>
            )}

            {/* Bottom Navigation between Steps */}
            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setCurrentStep(1);
                }}
                className="px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm text-slate-700 bg-white border-2 border-slate-200 min-h-[48px]"
              >
                ← Kembali ke Info Kuis
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
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 px-6 rounded-2xl shadow-playful flex items-center gap-2 min-h-[48px] btn-playful"
              >
                <span>Lihat Pratinjau Kuis ({questions.length} Soal)</span>
                <Eye className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* ================= STEP 3: PREVIEW & PUBLISH ================= */}
        {currentStep === 3 && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-slate-200 shadow-playful space-y-6 animate-pop-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-black text-slate-900">Pratinjau Kuis Sebelum Diterbitkan</h2>
              </div>
              <span className="text-xs font-bold text-slate-500">Tampilan Siswa</span>
            </div>

            {/* Simulated Quiz Card */}
            <div className="max-w-md mx-auto bg-white rounded-3xl p-5 border-2 border-blue-300 shadow-card-glow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-4xl p-2 bg-amber-50 rounded-2xl border border-amber-200 select-none shadow-sm">
                  {coverEmoji}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-extrabold text-xs">
                    Kelas {grade} SD
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                    {subject}
                  </span>
                </div>
              </div>

              <h4 className="text-lg font-black text-slate-900 mb-1">{title}</h4>
              <p className="text-xs text-slate-600 mb-4">{description || 'Kuis interaktif buatan Guru SD.'}</p>

              <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-3 border-t border-slate-100">
                <span>📚 {questions.length} Soal</span>
                <span>⏱️ {durationPerQuestionSec} detik / soal</span>
                <span>🏆 {badgeTitle}</span>
              </div>
            </div>

            {/* Summary of Questions in Preview */}
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                Ringkasan {questions.length} Soal yang Akan Terbit:
              </h4>

              <div className="space-y-2">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-black text-blue-600 mr-2">Soal {idx + 1}:</span>
                      <span className="font-bold text-slate-800">{q.text}</span>
                    </div>
                    <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                      Kunci: {q.options[q.correctIndex]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Publish Actions */}
            <div className="pt-4 border-t border-slate-100 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setCurrentStep(2);
                }}
                className="flex-1 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 min-h-[48px]"
              >
                ← Ubah Soal
              </button>

              <button
                type="button"
                onClick={handleFinalPublish}
                className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 px-6 rounded-2xl shadow-playful flex items-center justify-center gap-2 min-h-[48px] btn-playful"
              >
                <Save className="w-5 h-5" />
                <span>Simpan & Terbitkan Kuis Sekarang!</span>
              </button>
            </div>
          </div>
        )}

      </main>

    </div>
  );
};
