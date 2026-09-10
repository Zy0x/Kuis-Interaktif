import React, { useState, useEffect } from 'react';
import type { Quiz, QuizQuestion, Subject, QuestionType, GameMode } from '../../types/quiz';
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
  Lock,
  AlertCircle,
  RotateCcw,
  Edit3,
  Copy,
  ChevronUp,
  ChevronDown,
  Check,
  X,
  Sparkles,
  Shuffle,
  Star,
  Clock,
  Loader2
} from 'lucide-react';
import { AiQuestionModal } from './AiQuestionModal';
import { generateAiIllustrationUrl } from '../../lib/geminiApi';

interface QuizCreatorProps {
  onBack: () => void;
  onSaveQuiz: (newQuiz: Quiz) => void;
  playClick: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  editingQuiz?: Quiz | null;
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

const DRAFT_STORAGE_KEY = 'kuis_creator_draft_v1';

interface CreatorDraft {
  currentStep: 1 | 2 | 3;
  title: string;
  description: string;
  subject: Subject;
  grade: number;
  durationPerQuestionSec: number;
  coverEmoji: string;
  badgeTitle: string;
  visibility: 'public' | 'private';
  defaultGameMode?: GameMode;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  questions: QuizQuestion[];
}

const loadDraft = (): CreatorDraft | null => {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const QuizCreator: React.FC<QuizCreatorProps> = ({
  onBack,
  onSaveQuiz,
  playClick,
  isDark = false,
  onToggleTheme = () => {},
  editingQuiz = null,
}) => {
  const [draft] = useState<CreatorDraft | null>(() => (editingQuiz ? null : loadDraft()));

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(draft?.currentStep || 1);

  // General Quiz State
  const [title, setTitle] = useState(editingQuiz?.title || draft?.title || '');
  const [description, setDescription] = useState(editingQuiz?.description || draft?.description || '');
  const [subject, setSubject] = useState<Subject>(editingQuiz?.subject || draft?.subject || 'Matematika');
  const [grade, setGrade] = useState<number>(editingQuiz?.grade ?? draft?.grade ?? 3);
  const [durationPerQuestionSec, setDurationPerQuestionSec] = useState<number>(editingQuiz?.durationPerQuestionSec ?? draft?.durationPerQuestionSec ?? 30);
  const [coverEmoji, setCoverEmoji] = useState(editingQuiz?.coverEmoji || draft?.coverEmoji || '🍎');
  const [badgeTitle, setBadgeTitle] = useState(editingQuiz?.badgeTitle || draft?.badgeTitle || 'Bintang Pintar');
  const [visibility, setVisibility] = useState<'public' | 'private'>(editingQuiz?.visibility || draft?.visibility || 'public');
  const [defaultGameMode, setDefaultGameMode] = useState<GameMode>(editingQuiz?.defaultGameMode || draft?.defaultGameMode || 'standard');
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(editingQuiz?.shuffleQuestions ?? draft?.shuffleQuestions ?? false);
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(editingQuiz?.shuffleOptions ?? draft?.shuffleOptions ?? false);

  // Questions State
  const [questions, setQuestions] = useState<QuizQuestion[]>(editingQuiz?.questions || draft?.questions || []);

  // Notice & Reset states (replacing alert/confirm)
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setNoticeMessage(msg);
  };

  const handleImportAiQuestions = (newQuestions: QuizQuestion[]) => {
    playClick();
    setQuestions((prev) => [...prev, ...newQuestions]);
    showToast(`${newQuestions.length} butir soal berhasil ditambahkan ke bank soal!`);
  };

  useEffect(() => {
    if (noticeMessage) {
      const timer = setTimeout(() => setNoticeMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [noticeMessage]);

  // Persist draft automatically (only if creating new quiz)
  useEffect(() => {
    if (editingQuiz) return;
    if (title.trim() || description.trim() || questions.length > 0) {
      const data: CreatorDraft = {
        currentStep,
        title,
        description,
        subject,
        grade,
        durationPerQuestionSec,
        coverEmoji,
        badgeTitle,
        visibility,
        defaultGameMode,
        shuffleQuestions,
        shuffleOptions,
        questions,
      };
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
      } catch {
        // quota fallback
      }
    }
  }, [currentStep, title, description, subject, grade, durationPerQuestionSec, coverEmoji, badgeTitle, visibility, defaultGameMode, shuffleQuestions, shuffleOptions, questions]);

  const handleResetDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
    setTitle('');
    setDescription('');
    setSubject('Matematika');
    setGrade(3);
    setDurationPerQuestionSec(30);
    setCoverEmoji('🍎');
    setBadgeTitle('Bintang Pintar');
    setVisibility('public');
    setDefaultGameMode('standard');
    setShuffleQuestions(false);
    setShuffleOptions(false);
    setQuestions([]);
    setEditingQuestionId(null);
    setCurrentStep(1);
    setShowResetConfirm(false);
    showToast('Draf pembuatan kuis telah direset.');
  };

  // Active Question Form State
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState<QuestionType>('multiple_choice');
  const [qImageCaption, setQImageCaption] = useState('');
  const [qImageUrl, setQImageUrl] = useState<string | undefined>(undefined);
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrectIndex, setQCorrectIndex] = useState<number>(0);
  const [qExplanation, setQExplanation] = useState('');
  const [isAddingQuestion, setIsAddingQuestion] = useState(true);
  const [isGeneratingSingleImage, setIsGeneratingSingleImage] = useState(false);

  // New Question Type Specific Form States
  const [qAcceptableAnswers, setQAcceptableAnswers] = useState<string>('');
  const [qMatchingPairs, setQMatchingPairs] = useState<{ left: string; right: string }[]>([
    { left: '', right: '' },
    { left: '', right: '' },
    { left: '', right: '' },
  ]);
  const [qPoints, setQPoints] = useState<number>(10);
  const [qCustomDurationSec, setQCustomDurationSec] = useState<number | ''>('');

  // 1. Level 2 (Prioritas 50): Mundur dari Langkah 3 (Pratinjau) ke Langkah 2 (Soal)
  useBackHandler('creator-step-3', 50, () => {
    if (currentStep === 3) {
      setCurrentStep(2);
      return true;
    }
    return false;
  }, currentStep === 3);

  // 2. Level 2 (Prioritas 50): Mundur dari Langkah 2 ke Langkah 1, atau batalkan edit / tutup form
  useBackHandler('creator-step-2', 50, () => {
    if (currentStep === 2) {
      if (editingQuestionId) {
        handleCancelEdit();
        return true;
      }
      if (isAddingQuestion && questions.length > 0) {
        setIsAddingQuestion(false);
        return true;
      }
      setCurrentStep(1);
      return true;
    }
    return false;
  }, currentStep === 2);

  const resetFormFields = (targetType: QuestionType = qType) => {
    setQText('');
    setQImageCaption('');
    setQImageUrl(undefined);
    setQExplanation('');
    setQAcceptableAnswers('');
    setQMatchingPairs([
      { left: '', right: '' },
      { left: '', right: '' },
      { left: '', right: '' },
    ]);
    setQPoints(10);
    setQCustomDurationSec('');
    if (targetType === 'true_false') {
      setQOptions(['Benar', 'Salah']);
    } else if (targetType === 'short_answer') {
      setQOptions(['']);
    } else if (targetType === 'matching_pairs') {
      setQOptions([]);
    } else {
      setQOptions(['', '', '', '']);
    }
    setQCorrectIndex(0);
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...qOptions];
    updated[index] = value;
    setQOptions(updated);
  };

  const handleMatchingPairChange = (index: number, field: 'left' | 'right', val: string) => {
    setQMatchingPairs((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleAddMatchingPair = () => {
    if (qMatchingPairs.length >= 6) {
      showToast('Maksimal 6 pasangan kartu untuk kenyamanan tampilan siswa.');
      return;
    }
    setQMatchingPairs((prev) => [...prev, { left: '', right: '' }]);
  };

  const handleRemoveMatchingPair = (index: number) => {
    if (qMatchingPairs.length <= 2) {
      showToast('Minimal harus ada 2 pasangan kartu.');
      return;
    }
    setQMatchingPairs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTypeChange = (type: QuestionType) => {
    setQType(type);
    if (type === 'true_false') {
      setQOptions(['Benar', 'Salah']);
      setQCorrectIndex(0);
    } else if (type === 'short_answer') {
      setQOptions(['']);
      setQCorrectIndex(0);
    } else if (type === 'matching_pairs') {
      setQOptions([]);
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

  const handleGenerateAiImageForQuestion = () => {
    playClick();
    const promptBasis = qImageCaption.trim() || qText.trim();
    if (!promptBasis) {
      showToast('Tulis deskripsi ilustrasi atau pertanyaan terlebih dahulu.');
      return;
    }
    setIsGeneratingSingleImage(true);
    try {
      const url = generateAiIllustrationUrl(promptBasis);
      setQImageUrl(url);
      if (!qImageCaption.trim()) {
        setQImageCaption(promptBasis.slice(0, 40));
      }
      showToast('🎨 Ilustrasi edukasi AI berhasil dibuat!');
    } catch {
      showToast('Gagal membuat gambar AI.');
    } finally {
      setIsGeneratingSingleImage(false);
    }
  };

  const handleStartEditQuestion = (q: QuizQuestion) => {
    playClick();
    setEditingQuestionId(q.id);
    setQText(q.text);
    setQType(q.type || 'multiple_choice');
    setQImageCaption(q.imageCaption || '');
    setQImageUrl(q.imageUrl);
    setQOptions(q.options && q.options.length > 0 ? [...q.options] : ['', '', '', '']);
    setQCorrectIndex(q.correctIndex || 0);
    setQExplanation(q.explanation || '');
    setQAcceptableAnswers((q.acceptableAnswers || []).join(', '));
    setQPoints(q.points ?? 10);
    setQCustomDurationSec(q.customDurationSec ?? '');
    if (q.matchingPairs && q.matchingPairs.length > 0) {
      setQMatchingPairs([...q.matchingPairs]);
    } else {
      setQMatchingPairs([
        { left: '', right: '' },
        { left: '', right: '' },
        { left: '', right: '' },
      ]);
    }
    setIsAddingQuestion(true);
  };

  const handleCancelEdit = () => {
    playClick();
    setEditingQuestionId(null);
    resetFormFields();
    if (questions.length > 0) {
      setIsAddingQuestion(false);
    }
  };

  const handleOpenNewQuestion = () => {
    playClick();
    setEditingQuestionId(null);
    resetFormFields();
    setIsAddingQuestion(true);
  };

  const handleDuplicateQuestion = (id: string) => {
    playClick();
    const index = questions.findIndex((q) => q.id === id);
    if (index === -1) return;

    const source = questions[index];
    const duplicated: QuizQuestion = {
      ...source,
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      text: `${source.text} (Salinan)`,
      options: source.options ? [...source.options] : [],
      matchingPairs: source.matchingPairs ? [...source.matchingPairs] : undefined,
      acceptableAnswers: source.acceptableAnswers ? [...source.acceptableAnswers] : undefined,
      points: source.points ?? 10,
      customDurationSec: source.customDurationSec,
    };

    const next = [...questions];
    next.splice(index + 1, 0, duplicated);
    setQuestions(next);
    showToast(`Soal #${index + 1} berhasil disalin.`);
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    playClick();
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const next = [...questions];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setQuestions(next);
    showToast(`Urutan soal berhasil dipindahkan.`);
  };

  const handleSaveQuestion = (e: React.FormEvent, mode: 'finish' | 'continue' = 'finish') => {
    e.preventDefault();
    playClick();

    if (!qText.trim()) {
      showToast('Teks pertanyaan wajib diisi.');
      return;
    }

    let validOptions: string[] = [];
    let acceptableAnswers: string[] | undefined = undefined;
    let matchingPairs: { left: string; right: string }[] | undefined = undefined;

    if (qType === 'short_answer') {
      const parsedAnswers = qAcceptableAnswers
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (parsedAnswers.length === 0) {
        showToast('Tulis minimal 1 kunci jawaban untuk isian singkat.');
        return;
      }
      acceptableAnswers = parsedAnswers;
      validOptions = [parsedAnswers[0]];
    } else if (qType === 'matching_pairs') {
      const validPairs = qMatchingPairs.filter((p) => p.left.trim() !== '' && p.right.trim() !== '');
      if (validPairs.length < 2) {
        showToast('Minimal harus ada 2 pasangan kartu yang terisi.');
        return;
      }
      matchingPairs = validPairs.map((p) => ({ left: p.left.trim(), right: p.right.trim() }));
      validOptions = validPairs.map((p) => `${p.left} ↔ ${p.right}`);
    } else {
      validOptions = qOptions.filter((opt) => opt.trim() !== '');
      if (validOptions.length < 2) {
        showToast('Minimal harus ada 2 pilihan jawaban.');
        return;
      }
    }

    const calculatedPoints = Number(qPoints) > 0 ? Number(qPoints) : 10;
    const customDuration = typeof qCustomDurationSec === 'number' && qCustomDurationSec > 0 ? qCustomDurationSec : undefined;

    if (editingQuestionId) {
      const updatedQuestions = questions.map((q) => {
        if (q.id === editingQuestionId) {
          return {
            ...q,
            text: qText.trim(),
            type: qType,
            imageCaption: qImageCaption.trim() || undefined,
            imageUrl: qImageUrl,
            options: validOptions,
            correctIndex: qType === 'short_answer' || qType === 'matching_pairs' ? 0 : Math.min(qCorrectIndex, validOptions.length - 1),
            explanation: qExplanation.trim() || 'Jawaban ini benar sesuai dengan konsep materi terkait.',
            acceptableAnswers,
            matchingPairs,
            points: calculatedPoints,
            customDurationSec: customDuration,
          };
        }
        return q;
      });

      setQuestions(updatedQuestions);
      setEditingQuestionId(null);
      resetFormFields();
      if (mode === 'finish') {
        setIsAddingQuestion(false);
      }
      showToast('Perubahan butir soal berhasil disimpan.');
      return;
    }

    const newQuestion: QuizQuestion = {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      text: qText.trim(),
      type: qType,
      imageCaption: qImageCaption.trim() || undefined,
      imageUrl: qImageUrl,
      options: validOptions,
      correctIndex: qType === 'short_answer' || qType === 'matching_pairs' ? 0 : Math.min(qCorrectIndex, validOptions.length - 1),
      explanation: qExplanation.trim() || 'Jawaban ini benar sesuai dengan konsep materi terkait.',
      acceptableAnswers,
      matchingPairs,
      points: calculatedPoints,
      customDurationSec: customDuration,
    };

    setQuestions([...questions, newQuestion]);
    resetFormFields();

    if (mode === 'continue') {
      setIsAddingQuestion(true);
      showToast('Soal disimpan. Silakan buat soal berikutnya!');
    } else {
      setIsAddingQuestion(false);
      showToast('Soal berhasil disimpan ke bank soal.');
    }
  };

  const handleDeleteQuestion = (id: string) => {
    playClick();
    if (editingQuestionId === id) {
      handleCancelEdit();
    }
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    showToast('Soal telah dihapus.');
  };

  const handleFinalPublish = () => {
    playClick();
    if (!title.trim()) {
      showToast('Judul kuis tidak boleh kosong.');
      setCurrentStep(1);
      return;
    }
    if (questions.length === 0) {
      showToast('Kuis minimal harus memiliki 1 soal.');
      setCurrentStep(2);
      return;
    }

    const finalQuiz: Quiz = {
      id: editingQuiz?.id || ('custom_' + Date.now()),
      title: title.trim(),
      description: description.trim() || `Kuis interaktif buatan Guru untuk Kelas ${grade}.`,
      subject,
      grade,
      durationPerQuestionSec,
      coverEmoji,
      themeColor: editingQuiz?.themeColor || 'from-blue-600 to-indigo-600',
      badgeTitle: badgeTitle.trim() || 'Bintang Juara',
      visibility,
      questions,
      pinCode: editingQuiz?.pinCode,
      creatorId: editingQuiz?.creatorId,
      creatorName: editingQuiz?.creatorName,
      defaultGameMode,
      shuffleQuestions,
      shuffleOptions,
    };

    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }

    onSaveQuiz(finalQuiz);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 select-none flex flex-col">
      
      {/* Top Header */}
      <header className="w-full sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-8 lg:px-12 pt-[max(env(safe-area-inset-top),0.625rem)] pb-2.5 sm:pb-3 shadow-sm">
        <div className={`w-full mx-auto flex items-center justify-between gap-2 sm:gap-3 transition-all ${
          currentStep === 2 ? 'max-w-[2000px]' : 'max-w-4xl 2xl:max-w-5xl'
        }`}>
          <button
            onClick={() => {
              playClick();
              onBack();
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm min-h-[44px] min-w-[44px] justify-center btn-press transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Kembali</span>
          </button>

          <div className="text-center min-w-0 flex-1 px-1">
            <h1 className="text-xs xs:text-sm sm:text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
              {editingQuiz ? 'Edit Kuis ✏️' : 'Studio Kuis Guru 🧑‍🏫'}
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate hidden xs:block">
              Langkah {currentStep} dari 3: {currentStep === 1 ? 'Informasi Kuis' : currentStep === 2 ? 'Bank Soal' : 'Pratinjau'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {(title.trim() || questions.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setShowResetConfirm(true);
                }}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 p-2 sm:px-2.5 sm:py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1 min-h-[44px] min-w-[44px] justify-center"
                title="Hapus draf yang sedang diedit"
                aria-label="Reset Draf"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Reset Draf</span>
              </button>
            )}
            <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
            <span className="hidden sm:inline-block text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-xl">
              {questions.length} Soal
            </span>
          </div>
        </div>

        {/* Step Tabs */}
        <div className={`w-full mx-auto mt-2 grid grid-cols-3 gap-1.5 sm:gap-2 transition-all ${
          currentStep === 2 ? 'max-w-[2000px]' : 'max-w-4xl 2xl:max-w-5xl'
        }`}>
          <button
            onClick={() => {
              playClick();
              setCurrentStep(1);
            }}
            className={`py-2 px-1 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[44px] truncate ${
              currentStep === 1
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span className="hidden xs:inline">1. Info Kuis</span>
            <span className="xs:hidden">1. Info</span>
          </button>
          <button
            onClick={() => {
              playClick();
              setCurrentStep(2);
            }}
            className={`py-2 px-1 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[44px] truncate ${
              currentStep === 2
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span className="hidden xs:inline">2. Bank Soal ({questions.length})</span>
            <span className="xs:hidden">2. Soal ({questions.length})</span>
          </button>
          <button
            onClick={() => {
              playClick();
              setCurrentStep(3);
            }}
            className={`py-2 px-1 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[44px] truncate ${
              currentStep === 3
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span className="hidden xs:inline">3. Pratinjau</span>
            <span className="xs:hidden">3. Simpan</span>
          </button>
        </div>
      </header>

      {/* Floating notice toast (replaces alert) */}
      {noticeMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-slate-100/95 text-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-xl border border-slate-700/40 dark:border-slate-300/40 flex items-center gap-2.5 text-xs sm:text-sm font-semibold backdrop-blur-md animate-fade-in">
          <AlertCircle className="w-4 h-4 text-amber-400 dark:text-amber-600 shrink-0" />
          <span>{noticeMessage}</span>
        </div>
      )}

      {/* Custom Reset Draft Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Kosongkan Draf?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Seluruh data judul dan soal yang belum disimpan akan dihapus permanen.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetDraft}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors"
              >
                Hapus Draf
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Content */}
      <main className="w-full max-w-[2000px] mx-auto px-3 xs:px-4 sm:px-8 lg:px-12 pt-5 flex-1">

        {/* ================= STEP 1: GENERAL INFO ================= */}
        {currentStep === 1 && (
          <div className="max-w-4xl 2xl:max-w-5xl mx-auto bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-card space-y-5 animate-fade-in">
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
                  Target Kelas <span className="text-rose-500">*</span>
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:outline-none font-semibold text-sm min-h-[44px] bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {[1, 2, 3, 4, 5, 6].map((g) => (
                    <option key={g} value={g}>Kelas {g}</option>
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

              {/* Default Game Mode Selector */}
              <div className="sm:col-span-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                  <span>Mode Permainan Bawaan</span>
                  <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">Dapat diubah siswa saat lobi</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: 'standard' as GameMode,
                      title: 'Standar ⏱️',
                      sub: 'Timer per soal dengan tantangan skor kecepatan.',
                      activeBg: 'bg-blue-50/80 border-blue-500 text-blue-950 dark:bg-blue-950/40 dark:border-blue-500 dark:text-blue-100 ring-2 ring-blue-400/30 shadow-sm',
                    },
                    {
                      id: 'survival_3hearts' as GameMode,
                      title: '3 Hati (Survival) ❤️',
                      sub: 'Tantangan 3 nyawa. Salah atau kehabisan waktu berkurang 1 hati.',
                      activeBg: 'bg-rose-50/80 border-rose-500 text-rose-950 dark:bg-rose-950/40 dark:border-rose-500 dark:text-rose-100 ring-2 ring-rose-400/30 shadow-sm',
                    },
                    {
                      id: 'untimed' as GameMode,
                      title: 'Santai 🧘',
                      sub: 'Belajar tanpa tekanan waktu, fokus pada pemahaman konsep.',
                      activeBg: 'bg-emerald-50/80 border-emerald-500 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-500 dark:text-emerald-100 ring-2 ring-emerald-400/30 shadow-sm',
                    },
                  ].map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => {
                        playClick();
                        setDefaultGameMode(m.id);
                      }}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[52px] btn-press ${
                        defaultGameMode === m.id
                          ? m.activeBg
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                      }`}
                    >
                      <span className="font-bold text-xs sm:text-sm">{m.title}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        {m.sub}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Shuffle Options */}
              <div className="sm:col-span-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Pengaturan Acak (Fair Play & Variasi Belajar)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer min-h-[48px] transition-colors ${
                    shuffleQuestions
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <Shuffle className={`w-4 h-4 ${shuffleQuestions ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                      <div>
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                          Acak Urutan Soal
                        </span>
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                          Setiap siswa menerima urutan nomor yang berbeda
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={shuffleQuestions}
                      onChange={(e) => setShuffleQuestions(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    />
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer min-h-[48px] transition-colors ${
                    shuffleOptions
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <Shuffle className={`w-4 h-4 ${shuffleOptions ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                      <div>
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                          Acak Urutan Pilihan Jawaban
                        </span>
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                          Pilihan A, B, C, D diacak posisinya
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={shuffleOptions}
                      onChange={(e) => setShuffleOptions(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  if (!title.trim()) {
                    showToast('Silakan isi judul kuis terlebih dahulu.');
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 2xl:gap-8 items-start">
              
              {/* Question Bank List */}
              <div className="lg:col-span-5 2xl:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Bank Soal ({questions.length})
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setIsAiModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-bold text-xs flex items-center gap-1.5 min-h-[36px] transition-colors border border-indigo-200/60 dark:border-indigo-800/60"
                      title="Asisten AI & Impor Cepat Soal"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Asisten AI
                    </button>
                    {(!isAddingQuestion || editingQuestionId) && (
                      <button
                        type="button"
                        onClick={handleOpenNewQuestion}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 font-bold text-xs flex items-center gap-1 min-h-[36px] transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah Soal
                      </button>
                    )}
                  </div>
                </div>

                {questions.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4 space-y-2.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Belum ada soal. Tulis soal di sebelah kanan atau buat dengan asisten AI.</p>
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setIsAiModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm min-h-[38px] transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Buka Asisten AI & Impor
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    {questions.map((q, idx) => {
                      const isBeingEdited = editingQuestionId === q.id;
                      return (
                        <div
                          key={q.id}
                          className={`p-3 rounded-xl border transition-all ${
                            isBeingEdited
                              ? 'border-blue-500 dark:border-blue-400 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-400/30 dark:ring-blue-500/30 shadow-sm'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          {/* Top Row: Info & Actions Toolbar */}
                          <div className="flex items-center justify-between gap-1.5 pb-2 mb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className={`w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center flex-shrink-0 transition-colors ${
                                  isBeingEdited ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase truncate">
                                {q.type === 'short_answer'
                                  ? 'Isian'
                                  : q.type === 'image_guess'
                                  ? 'Tebak Gbr'
                                  : q.type === 'matching_pairs'
                                  ? 'Jodohkan'
                                  : q.type === 'true_false'
                                  ? 'Benar/Salah'
                                  : 'Pilgan'}
                              </span>
                              <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 flex-shrink-0">
                                <Star className="w-2.5 h-2.5 text-amber-500" /> {q.points || 10}p
                              </span>
                              {q.customDurationSec && (
                                <span className="text-[10px] font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 flex-shrink-0">
                                  <Clock className="w-2.5 h-2.5 text-blue-500" /> {q.customDurationSec}s
                                </span>
                              )}
                              {isBeingEdited && (
                                <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
                                  Diedit
                                </span>
                              )}
                            </div>

                            {/* Toolbar: Reorder, Edit, Duplicate, Delete */}
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveQuestion(idx, 'up');
                                }}
                                disabled={idx === 0}
                                className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-slate-400 rounded-lg min-w-[32px] min-h-[32px] flex items-center justify-center transition-colors"
                                title="Geser Urutan ke Atas"
                                aria-label={`Geser Soal ${idx + 1} ke Atas`}
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveQuestion(idx, 'down');
                                }}
                                disabled={idx === questions.length - 1}
                                className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-slate-400 rounded-lg min-w-[32px] min-h-[32px] flex items-center justify-center transition-colors"
                                title="Geser Urutan ke Bawah"
                                aria-label={`Geser Soal ${idx + 1} ke Bawah`}
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEditQuestion(q);
                                }}
                                className={`p-1 rounded-lg min-w-[32px] min-h-[32px] flex items-center justify-center transition-colors ${
                                  isBeingEdited
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40'
                                }`}
                                title="Edit Soal Ini"
                                aria-label={`Edit Soal ${idx + 1}`}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicateQuestion(q.id);
                                }}
                                className="p-1 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg min-w-[32px] min-h-[32px] flex items-center justify-center transition-colors"
                                title="Duplikat Soal"
                                aria-label={`Duplikat Soal ${idx + 1}`}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteQuestion(q.id);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg min-w-[32px] min-h-[32px] flex items-center justify-center transition-colors"
                                title="Hapus Soal"
                                aria-label={`Hapus Soal ${idx + 1}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Clickable Card Body for Quick Edit */}
                          <div
                            onClick={() => handleStartEditQuestion(q)}
                            className="space-y-1 cursor-pointer group"
                            title="Klik untuk mengedit soal ini"
                          >
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-xs line-clamp-2 break-words group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {q.text}
                            </p>
                            <div className="flex items-center justify-between text-[11px] pt-0.5">
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold truncate">
                                {q.type === 'short_answer'
                                  ? `✍️ Kunci: ${q.acceptableAnswers?.[0] || q.options[0] || '-'}`
                                  : q.type === 'matching_pairs'
                                  ? `🧩 ${q.matchingPairs?.length || q.options.length} Pasangan Kartu`
                                  : `✓ Kunci: ${q.options[q.correctIndex] || '-'}`}
                              </span>
                              {q.imageUrl && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-0.5 flex-shrink-0">
                                  <ImageIcon className="w-3 h-3" /> Ada Gambar
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Form Input Soal */}
              <div className="lg:col-span-7 2xl:col-span-8">
                {isAddingQuestion ? (
                  <form
                    onSubmit={(e) => handleSaveQuestion(e, 'continue')}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-card space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        {editingQuestionId ? (
                          <>
                            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                              <Edit3 className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                Edit Soal #{questions.findIndex((q) => q.id === editingQuestionId) + 1}
                              </h3>
                              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                Mode pengeditan butir soal
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                              <Plus className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                Tambah Soal #{questions.length + 1}
                              </h3>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                Masukkan pertanyaan dan opsi jawaban
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto gap-1">
                        {[
                          { id: 'multiple_choice' as QuestionType, label: 'Pilgan' },
                          { id: 'true_false' as QuestionType, label: 'Benar/Salah' },
                          { id: 'short_answer' as QuestionType, label: 'Isian' },
                          { id: 'image_guess' as QuestionType, label: 'Tebak Gbr' },
                          { id: 'matching_pairs' as QuestionType, label: 'Jodohkan' },
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleTypeChange(t.id)}
                            className={`flex-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px] flex items-center justify-center whitespace-nowrap ${
                              qType === t.id
                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
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

                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={qImageCaption}
                            onChange={(e) => setQImageCaption(e.target.value)}
                            placeholder="Kata kunci gambar (misal: Daun Hijau, Garuda)"
                            aria-label="Deskripsi ilustrasi"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                          />

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleGenerateAiImageForQuestion}
                              disabled={isGeneratingSingleImage}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-all min-h-[36px]"
                              title="Buat gambar edukasi AI gratis tanpa API key"
                            >
                              {isGeneratingSingleImage ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              )}
                              <span>{isGeneratingSingleImage ? 'Membuat...' : '🎨 Buat Gambar AI'}</span>
                            </button>

                            <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer min-h-[36px]">
                              <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
                                {qImageUrl ? 'Ganti Foto' : 'Unggah Foto'}
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

                        {/* Pratinjau Gambar / Ilustrasi */}
                        {qImageUrl && (
                          <div className="relative p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                            <img
                              src={qImageUrl}
                              alt={qImageCaption || 'Pratinjau Ilustrasi'}
                              className="w-14 h-14 object-cover rounded-lg border border-slate-200 dark:border-slate-700 flex-shrink-0"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLElement).style.opacity = '0.5';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                {qImageCaption || 'Ilustrasi Soal'}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {qImageUrl.startsWith('data:') ? 'Foto dari perangkat' : 'Gambar Ilustrasi AI'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                playClick();
                                setQImageUrl(undefined);
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg text-xs font-bold transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="Hapus gambar"
                              aria-label="Hapus Gambar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mode Isian Singkat */}
                    {qType === 'short_answer' && (
                      <div className="space-y-3 pt-1">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Kunci Jawaban Utama <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={qOptions[0] || ''}
                            onChange={(e) => {
                              handleOptionChange(0, e.target.value);
                              if (!qAcceptableAnswers.trim()) {
                                setQAcceptableAnswers(e.target.value);
                              }
                            }}
                            placeholder="Contoh: Paru-paru"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/40 dark:bg-emerald-950/20 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                            <span>Variasi Jawaban Diterima (Pisahkan tanda koma):</span>
                            <span className="text-[11px] font-normal text-slate-500">Opsional</span>
                          </label>
                          <input
                            type="text"
                            value={qAcceptableAnswers}
                            onChange={(e) => setQAcceptableAnswers(e.target.value)}
                            placeholder="Contoh: paru paru, pulmo, paru-paru"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-500 min-h-[44px]"
                          />
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            💡 Pemeriksaan otomatis mengabaikan huruf besar/kecil (case-insensitive).
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Mode Menjodohkan */}
                    {qType === 'matching_pairs' && (
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Pasangan Kartu (Kolom Kiri ↔ Kolom Kanan) <span className="text-rose-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={handleAddMatchingPair}
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 min-h-[36px]"
                          >
                            <Plus className="w-3.5 h-3.5" /> Tambah Pasangan
                          </button>
                        </div>

                        <div className="space-y-2">
                          {qMatchingPairs.map((pair, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60">
                              <span className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                                {idx + 1}
                              </span>
                              <input
                                type="text"
                                value={pair.left}
                                onChange={(e) => handleMatchingPairChange(idx, 'left', e.target.value)}
                                placeholder={`Konsep ${idx + 1} (contoh: Insang)`}
                                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-blue-500 min-h-[38px]"
                                required
                              />
                              <span className="text-slate-400 font-bold text-xs select-none">↔</span>
                              <input
                                type="text"
                                value={pair.right}
                                onChange={(e) => handleMatchingPairChange(idx, 'right', e.target.value)}
                                placeholder={`Pasangan ${idx + 1} (contoh: Ikan)`}
                                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-blue-500 min-h-[38px]"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveMatchingPair(idx)}
                                disabled={qMatchingPairs.length <= 2}
                                className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 flex items-center justify-center transition-colors flex-shrink-0"
                                title="Hapus Pasangan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          💡 Di arena kuis siswa, kedua kolom akan diacak secara terpisah. Siswa mencocokkan setiap kartu ke pasangannya.
                        </p>
                      </div>
                    )}

                    {/* Banner Edukasi Tebak Gambar */}
                    {qType === 'image_guess' && (
                      <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 flex items-start gap-2.5">
                        <span className="text-xl select-none">🧩</span>
                        <div>
                          <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200">Mode Tebak Gambar Misteri</h4>
                          <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5 leading-relaxed">
                            Gambar kuis akan ditutupi oleh 9 panel puzzle misteri di arena siswa. Siswa dapat mengetuk kotak untuk mengintip gambar sebelum memilih jawaban di bawah. Pastikan Anda menyisipkan gambar/ilustrasi di atas!
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Pilihan Jawaban (Pilgan, Benar/Salah, Tebak Gambar) */}
                    {(qType === 'multiple_choice' || qType === 'true_false' || qType === 'image_guess') && (
                      <div className="space-y-2 pt-1">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Opsi Jawaban & Kunci Benar (Klik Huruf/Centang untuk Menandai Kunci)
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
                    )}

                    {/* Pengaturan Bobot Poin & Waktu Khusus Soal */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-850/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-amber-500" /> Bobot Nilai Poin
                        </label>
                        <div className="flex items-center gap-1.5">
                          {[5, 10, 15, 20].map((pts) => (
                            <button
                              key={pts}
                              type="button"
                              onClick={() => {
                                playClick();
                                setQPoints(pts);
                              }}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[38px] ${
                                qPoints === pts
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-slate-700'
                              }`}
                            >
                              {pts}
                            </button>
                          ))}
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={qPoints}
                            onChange={(e) => setQPoints(Math.max(1, Number(e.target.value) || 1))}
                            className="w-14 px-1.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs text-center min-h-[38px]"
                            title="Kustom bobot poin"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-500" /> Waktu Khusus Soal Ini (Detik)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={5}
                            max={300}
                            placeholder={`Standar Kuis (${durationPerQuestionSec} dtk)`}
                            value={qCustomDurationSec}
                            onChange={(e) => setQCustomDurationSec(e.target.value ? Math.max(5, Number(e.target.value)) : '')}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs min-h-[38px]"
                          />
                          {qCustomDurationSec !== '' && (
                            <button
                              type="button"
                              onClick={() => setQCustomDurationSec('')}
                              className="text-xs text-slate-500 hover:text-rose-500 font-bold px-2 py-1 min-h-[38px]"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                          Kosongkan bila ingin mengikuti durasi kuis umum ({durationPerQuestionSec} detik).
                        </span>
                      </div>
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

                    <div className="pt-2 flex flex-wrap sm:flex-nowrap gap-2 items-center">
                      {editingQuestionId ? (
                        <>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[44px] flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <X className="w-4 h-4" /> Batal Edit
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleSaveQuestion(e, 'finish')}
                            className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-1.5 min-h-[44px] btn-press text-xs sm:text-sm"
                          >
                            <Check className="w-4 h-4" />
                            <span>Perbarui Soal</span>
                          </button>
                        </>
                      ) : (
                        <>
                          {questions.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setIsAddingQuestion(false)}
                              className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[44px] flex items-center justify-center gap-1.5 transition-colors"
                            >
                              Tutup Form
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleSaveQuestion(e, 'continue')}
                            className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-1.5 min-h-[44px] btn-press text-xs sm:text-sm"
                            title="Simpan soal ini dan langsung siapkan formulir untuk soal berikutnya"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Simpan & Buat Baru</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleSaveQuestion(e, 'finish')}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 min-h-[44px] flex items-center justify-center gap-1.5 transition-colors border border-slate-200/80 dark:border-slate-700"
                            title="Simpan soal ini dan tutup formulir"
                          >
                            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>Simpan & Selesai</span>
                          </button>
                        </>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Formulir Soal Sedang Ditutup</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Pilih butir soal di samping untuk mengedit, atau klik tombol di bawah untuk menambah soal baru.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenNewQuestion}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 min-h-[44px] shadow-sm btn-press transition-colors"
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
                    showToast('Tambahkan minimal 1 soal terlebih dahulu.');
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-card space-y-5 animate-fade-in max-w-3xl 2xl:max-w-4xl mx-auto">
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
                    Kelas {grade}
                  </span>
                </div>
              </div>

              <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug break-words line-clamp-2">{title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description || 'Kuis interaktif buatan Guru.'}</p>

              <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-medium pt-3 border-t border-slate-100 dark:border-slate-700 flex-wrap gap-2">
                <span>{questions.length} Soal</span>
                <span>{durationPerQuestionSec}s per soal</span>
                <span>Mode: {defaultGameMode === 'survival_3hearts' ? '3 Hati ❤️' : defaultGameMode === 'untimed' ? 'Santai 🧘' : 'Standar ⏱️'}</span>
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
                  <div
                    key={q.id}
                    onClick={() => {
                      handleStartEditQuestion(q);
                      setCurrentStep(2);
                    }}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/90 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 flex items-center justify-between text-xs cursor-pointer transition-all group"
                    title="Klik untuk langsung mengedit soal ini di Langkah 2"
                  >
                    <div className="truncate mr-2 min-w-0">
                      <span className="font-bold text-blue-600 dark:text-blue-400 mr-1.5 flex-shrink-0">#{idx + 1}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {q.text}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 text-amber-500" /> {q.points || 10}p
                      </span>
                      {q.customDurationSec && (
                        <span className="text-[10px] font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5 text-blue-500" /> {q.customDurationSec}s
                        </span>
                      )}
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded text-[11px]">
                        {q.type === 'short_answer'
                          ? (q.acceptableAnswers?.[0] || q.options[0] || '-')
                          : q.type === 'matching_pairs'
                          ? `${q.matchingPairs?.length || q.options.length} Pasang`
                          : (q.options[q.correctIndex] || '-')}
                      </span>
                      <span className="p-1 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 rounded">
                        <Edit3 className="w-3.5 h-3.5" />
                      </span>
                    </div>
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
                <span>{editingQuiz ? 'Simpan Perubahan Kuis' : 'Terbitkan Kuis Sekarang'}</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Asisten Soal AI & Impor Modal */}
      <AiQuestionModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onImportQuestions={handleImportAiQuestions}
        currentSubject={subject}
        currentGrade={grade}
        playClick={playClick}
      />

    </div>
  );
};
