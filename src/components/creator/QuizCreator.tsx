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
  Eye, 
  Layers, 
  Upload, 
  RotateCcw, 
  Edit3, 
  Copy, 
  ChevronUp, 
  ChevronDown, 
  X, 
  Sparkles, 
  Star, 
  Loader2,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { AiQuestionModal } from './AiQuestionModal';
import { generateAiIllustrationUrl } from '../../lib/geminiApi';
import { AiGeneratorStep } from './AiGeneratorStep';
import { InfoKuisStep } from './InfoKuisStep';

interface QuizCreatorProps {
  onBack: () => void;
  onSaveQuiz: (newQuiz: Quiz) => void;
  playClick: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  editingQuiz?: Quiz | null;
  initialMode?: 'ai' | 'manual';
  onBackToMethodSelection?: () => void;
}

const DRAFT_STORAGE_KEY = 'kuis_creator_draft_v1';

interface CreatorDraft {
  currentStep: number;
  aiFunnelActive?: boolean;
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
  initialMode = 'manual',
  onBackToMethodSelection,
}) => {
  const isAiMode = initialMode === 'ai' && !editingQuiz;
  const totalSteps = 3;

  const [draft] = useState<CreatorDraft | null>(() => (editingQuiz ? null : loadDraft()));

  // AI Creation Funnel state:
  // When active, hides Studio tabs and displays full creation assistant.
  // Once generated, switches to Studio Kuis with 3 clean tabs.
  const [aiFunnelActive, setAiFunnelActive] = useState<boolean>(() => {
    if (editingQuiz) return false;
    if (initialMode === 'ai') {
      const draftData = loadDraft();
      if (draftData && draftData.questions && draftData.questions.length > 0) {
        return false;
      }
      return true;
    }
    return false;
  });

  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (editingQuiz && editingQuiz.questions && editingQuiz.questions.length > 0) {
      return 2;
    }
    return draft?.currentStep || 1;
  });

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

  // Notice & Reset states
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
        aiFunnelActive,
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
  }, [currentStep, aiFunnelActive, title, description, subject, grade, durationPerQuestionSec, coverEmoji, badgeTitle, visibility, defaultGameMode, shuffleQuestions, shuffleOptions, questions, editingQuiz]);

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
    if (isAiMode) {
      setAiFunnelActive(true);
    }
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
  const [qAcceptableAnswers, setQAcceptableAnswers] = useState('');
  const [qMatchingPairs, setQMatchingPairs] = useState<{ left: string; right: string }[]>([
    { left: '', right: '' },
    { left: '', right: '' },
    { left: '', right: '' },
  ]);
  const [qPoints, setQPoints] = useState<number>(10);
  const [qCustomDurationSec, setQCustomDurationSec] = useState<string>('');
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);

  // Back Handlers
  useBackHandler('creator-step-preview', 40, () => {
    if (!aiFunnelActive && currentStep === 3) {
      setCurrentStep(2);
      return true;
    }
    return false;
  }, !aiFunnelActive && currentStep === 3);

  useBackHandler('creator-step-2', 50, () => {
    if (!aiFunnelActive && currentStep === 2) {
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
  }, !aiFunnelActive && currentStep === 2);

  useBackHandler('creator-step-1', 55, () => {
    if (!aiFunnelActive && currentStep === 1) {
      if (isAiMode) {
        setAiFunnelActive(true);
        return true;
      }
      onBack();
      return true;
    }
    return false;
  }, !aiFunnelActive && currentStep === 1);

  useBackHandler('creator-ai-funnel', 60, () => {
    if (aiFunnelActive) {
      if (onBackToMethodSelection) {
        onBackToMethodSelection();
      } else {
        onBack();
      }
      return true;
    }
    return false;
  }, aiFunnelActive);

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

  const handleGenerateSingleAiImage = () => {
    playClick();
    const promptText = qImageCaption.trim() || qText.trim() || `${subject} Kelas ${grade}`;
    if (!promptText) {
      showToast('Tulis deskripsi gambar atau pertanyaan terlebih dahulu untuk membuat ilustrasi AI.');
      return;
    }

    setIsGeneratingAiImage(true);
    try {
      const generatedUrl = generateAiIllustrationUrl(promptText);
      setQImageUrl(generatedUrl);
      if (!qImageCaption.trim()) {
        setQImageCaption(promptText.slice(0, 45));
      }
      showToast('🎨 Gambar ilustrasi edukasi AI berhasil dibuat!');
    } catch {
      showToast('Kendala saat meracik gambar AI.');
    } finally {
      setIsGeneratingAiImage(false);
    }
  };

  const handleOpenNewQuestion = () => {
    playClick();
    setEditingQuestionId(null);
    resetFormFields('multiple_choice');
    setIsAddingQuestion(true);
  };

  const handleStartEditQuestion = (q: QuizQuestion) => {
    playClick();
    setEditingQuestionId(q.id);
    setQText(q.text);
    setQType(q.type);
    setQImageCaption(q.imageCaption || '');
    setQImageUrl(q.imageUrl);
    setQExplanation(q.explanation || '');
    setQPoints(q.points || 10);
    setQCustomDurationSec(q.customDurationSec ? String(q.customDurationSec) : '');

    if (q.type === 'matching_pairs') {
      setQMatchingPairs(q.matchingPairs && q.matchingPairs.length > 0 ? q.matchingPairs : [
        { left: '', right: '' },
        { left: '', right: '' },
      ]);
      setQOptions([]);
      setQCorrectIndex(0);
    } else if (q.type === 'short_answer') {
      setQAcceptableAnswers(q.acceptableAnswers ? q.acceptableAnswers.join(', ') : (q.options[0] || ''));
      setQOptions([q.options[0] || '']);
      setQCorrectIndex(0);
    } else {
      setQOptions([...q.options]);
      setQCorrectIndex(q.correctIndex);
    }

    setIsAddingQuestion(true);
  };

  const handleCancelEdit = () => {
    playClick();
    setEditingQuestionId(null);
    setIsAddingQuestion(false);
    resetFormFields();
  };

  const handleDuplicateQuestion = (q: QuizQuestion) => {
    playClick();
    const dup: QuizQuestion = {
      ...q,
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      text: q.text + ' (Salinan)',
    };
    setQuestions((prev) => [...prev, dup]);
    showToast('Soal berhasil diduplikasi.');
  };

  const handleDeleteQuestion = (id: string) => {
    playClick();
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    if (editingQuestionId === id) {
      handleCancelEdit();
    }
    showToast('Soal telah dihapus.');
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    playClick();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    const reordered = [...questions];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    setQuestions(reordered);
  };

  const handleSaveQuestion = (e: React.FormEvent, afterSave: 'continue' | 'finish' = 'continue') => {
    e.preventDefault();
    playClick();

    if (!qText.trim()) {
      showToast('Pertanyaan soal tidak boleh kosong.');
      return;
    }

    let finalOptions = qOptions;
    let finalAcceptable: string[] | undefined = undefined;
    let finalPairs = undefined;

    if (qType === 'matching_pairs') {
      const validPairs = qMatchingPairs.filter((p) => p.left.trim() && p.right.trim());
      if (validPairs.length < 2) {
        showToast('Minimal harus mengisi 2 pasangan kartu yang lengkap (kiri dan kanan).');
        return;
      }
      finalPairs = validPairs.map((p) => ({ left: p.left.trim(), right: p.right.trim() }));
      finalOptions = finalPairs.map((p) => `${p.left} -> ${p.right}`);
    } else if (qType === 'short_answer') {
      const parts = qAcceptableAnswers.split(',').map((s) => s.trim()).filter(Boolean);
      if (parts.length === 0) {
        showToast('Mohon masukkan minimal satu kata kunci jawaban.');
        return;
      }
      finalAcceptable = parts;
      finalOptions = [parts[0]];
    } else if (qType === 'multiple_choice') {
      const emptyOptIndex = qOptions.findIndex((opt) => !opt.trim());
      if (emptyOptIndex !== -1) {
        showToast(`Pilihan ${String.fromCharCode(65 + emptyOptIndex)} tidak boleh kosong.`);
        return;
      }
    }

    const durationNum = parseInt(qCustomDurationSec);

    const questionObj: QuizQuestion = {
      id: editingQuestionId || ('q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
      text: qText.trim(),
      type: qType,
      options: finalOptions,
      correctIndex: qType === 'matching_pairs' || qType === 'short_answer' ? 0 : qCorrectIndex,
      explanation: qExplanation.trim() || 'Pembahasan materi terkait konsep pertanyaan ini.',
      imageUrl: qImageUrl,
      imageCaption: qImageCaption.trim() || undefined,
      acceptableAnswers: finalAcceptable,
      matchingPairs: finalPairs,
      points: Number(qPoints) || 10,
      customDurationSec: !isNaN(durationNum) && durationNum > 0 ? durationNum : undefined,
    };

    if (editingQuestionId) {
      setQuestions((prev) => prev.map((q) => (q.id === editingQuestionId ? questionObj : q)));
      showToast('Soal berhasil diperbarui.');
    } else {
      setQuestions((prev) => [...prev, questionObj]);
      showToast('Soal baru berhasil ditambahkan.');
    }

    if (afterSave === 'continue') {
      resetFormFields(qType);
      setEditingQuestionId(null);
      setIsAddingQuestion(true);
    } else {
      handleCancelEdit();
    }
  };

  const handleFinalPublish = () => {
    playClick();

    if (!title.trim()) {
      showToast('Judul kuis tidak boleh kosong.');
      setCurrentStep(isAiMode ? 2 : 1);
      return;
    }

    if (questions.length === 0) {
      showToast('Tambahkan minimal 1 butir soal sebelum menerbitkan kuis.');
      setCurrentStep(isAiMode ? 1 : 2);
      return;
    }

    const finalQuiz: Quiz = {
      id: editingQuiz?.id || ('quiz_' + Date.now()),
      title: title.trim(),
      description: description.trim(),
      subject,
      grade,
      durationPerQuestionSec,
      coverEmoji,
      badgeTitle: badgeTitle.trim() || 'Bintang Pintar',
      themeColor: editingQuiz?.themeColor || '#2563eb',
      visibility,
      defaultGameMode,
      shuffleQuestions,
      shuffleOptions,
      questions,
      pinCode: editingQuiz?.pinCode || Math.floor(1000 + Math.random() * 9000).toString(),
      isPublished: true,
      creatorId: editingQuiz?.creatorId || 'teacher_custom',
      creatorName: editingQuiz?.creatorName || 'Guru Kuis',
      createdAt: editingQuiz?.createdAt || new Date().toISOString(),
    };

    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }

    onSaveQuiz(finalQuiz);
  };

  const handleHeaderBack = () => {
    playClick();
    if (isAiMode && currentStep === 1) {
      setAiFunnelActive(true);
      return;
    }
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      return;
    }
    onBack();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col pb-16">
      
      {/* Top Header */}
      <header className="w-full sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 xs:px-4 sm:px-8 lg:px-12 pt-[max(env(safe-area-inset-top),0.625rem)] pb-2.5 sm:pb-3 shadow-xs">
        <div className="w-full max-w-[2000px] mx-auto flex items-center justify-between gap-2 sm:gap-3 transition-all">
          {aiFunnelActive ? (
            <button
              onClick={() => {
                playClick();
                if (onBackToMethodSelection) {
                  onBackToMethodSelection();
                } else {
                  onBack();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm min-h-[44px] min-w-[44px] justify-center btn-press transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden xs:inline">Ganti Metode</span>
            </button>
          ) : (
            <button
              onClick={handleHeaderBack}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm min-h-[44px] min-w-[44px] justify-center btn-press transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden xs:inline">Kembali</span>
            </button>
          )}

          <div className="text-center min-w-0 flex-1 px-1">
            <h1 className="text-xs xs:text-sm sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight truncate">
              {aiFunnelActive 
                ? 'Asisten Racik Kuis AI ⚡' 
                : editingQuiz 
                  ? 'Edit Kuis ✏️' 
                  : isAiMode 
                    ? 'Studio Kuis AI ⚡' 
                    : 'Studio Kuis Guru 🧑‍🏫'}
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate hidden xs:block">
              {aiFunnelActive 
                ? 'Racik bank soal interaktif otomatis berbasis Kurikulum Merdeka SD'
                : `Langkah ${currentStep} dari ${totalSteps}: ${
                    isAiMode
                      ? currentStep === 1
                        ? 'Bank Soal'
                        : currentStep === 2
                        ? 'Pengaturan Kuis'
                        : 'Pratinjau & Simpan'
                      : currentStep === 1
                      ? 'Pengaturan Kuis'
                      : currentStep === 2
                      ? 'Bank Soal'
                      : 'Pratinjau & Simpan'
                  }`}
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {!aiFunnelActive && (title.trim() || questions.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setShowResetConfirm(true);
                }}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 p-2 sm:px-2.5 sm:py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1 min-h-[44px] min-w-[44px] justify-center"
                title="Hapus draf yang sedang dibuat"
                aria-label="Reset Draf"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Reset Draf</span>
              </button>
            )}
            <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
            {!aiFunnelActive && (
              <span className="hidden sm:inline-block text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-xl">
                {questions.length} Soal
              </span>
            )}
          </div>
        </div>

        {/* 3 Step Navigation Tabs (HANYA MUNCUL DI STUDIO KUIS UTAMA) */}
        {!aiFunnelActive && (
          <div className="w-full max-w-[2000px] mx-auto mt-2.5 grid grid-cols-3 gap-1.5 sm:gap-2 transition-all">
            {isAiMode ? (
              <>
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
                  <span className="hidden sm:inline">1. Bank Soal ({questions.length})</span>
                  <span className="sm:hidden">1. Soal ({questions.length})</span>
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
                  <span className="hidden sm:inline">2. Pengaturan Kuis</span>
                  <span className="sm:hidden">2. Info</span>
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
                  <span className="hidden sm:inline">3. Pratinjau & Simpan</span>
                  <span className="sm:hidden">3. Simpan</span>
                </button>
              </>
            ) : (
              <>
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
                  <span className="hidden sm:inline">1. Pengaturan Kuis</span>
                  <span className="sm:hidden">1. Info</span>
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
                  <span className="hidden sm:inline">2. Bank Soal ({questions.length})</span>
                  <span className="sm:hidden">2. Soal ({questions.length})</span>
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
                  <span className="hidden sm:inline">3. Pratinjau & Simpan</span>
                  <span className="sm:hidden">3. Simpan</span>
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Floating Notice Toast */}
      {noticeMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-slate-100/95 text-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-xl border border-slate-700/40 dark:border-slate-300/40 flex items-center gap-2.5 text-xs sm:text-sm font-semibold backdrop-blur-md animate-fade-in">
          <AlertCircle className="w-4 h-4 text-amber-400 dark:text-amber-600 shrink-0" />
          <span>{noticeMessage}</span>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Kosongkan Draf?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Seluruh data judul dan butir soal yang belum disimpan akan dihapus permanen.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetDraft}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors"
              >
                Ya, Kosongkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content View */}
      <main className="flex-1 w-full mt-4">
        
        {/* ================= 1. ASISTEN RACIK KUIS AI (CREATION FUNNEL) ================= */}
        {aiFunnelActive ? (
          <AiGeneratorStep
            onGenerated={(data) => {
              setQuestions(data.questions);
              setTitle(`Kuis ${data.subject}: ${data.topic.length > 40 ? data.topic.slice(0, 40) + '...' : data.topic}`);
              setDescription(`Latihan kuis interaktif Kurikulum Merdeka mata pelajaran ${data.subject} Kelas ${data.grade} SD topik ${data.topic}.`);
              setSubject(data.subject);
              setGrade(data.grade);
              setCoverEmoji(data.coverEmoji);
              setBadgeTitle(data.badgeTitle);
              setAiFunnelActive(false);
              setCurrentStep(1); // Enters Studio Step 1: Bank Soal
              showToast(`⚡ Berhasil meracik ${data.questions.length} butir soal! Silakan periksa di Bank Soal.`);
            }}
            onBack={() => {
              if (onBackToMethodSelection) {
                onBackToMethodSelection();
              } else {
                onBack();
              }
            }}
            playClick={playClick}
            initialSubject={subject}
            initialGrade={grade}
          />
        ) : isAiMode ? (
          /* ================= 2. STUDIO KUIS AI (3 TABS) ================= */
          <>
            {/* Step 1 in AI Mode: Bank Soal */}
            {currentStep === 1 && renderBankSoalView(true)}

            {/* Step 2 in AI Mode: Pengaturan Kuis */}
            {currentStep === 2 && (
              <InfoKuisStep
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
                grade={grade}
                setGrade={setGrade}
                subject={subject}
                setSubject={setSubject}
                durationPerQuestionSec={durationPerQuestionSec}
                setDurationPerQuestionSec={setDurationPerQuestionSec}
                badgeTitle={badgeTitle}
                setBadgeTitle={setBadgeTitle}
                coverEmoji={coverEmoji}
                setCoverEmoji={setCoverEmoji}
                visibility={visibility}
                setVisibility={setVisibility}
                defaultGameMode={defaultGameMode}
                setDefaultGameMode={setDefaultGameMode}
                shuffleQuestions={shuffleQuestions}
                setShuffleQuestions={setShuffleQuestions}
                shuffleOptions={shuffleOptions}
                setShuffleOptions={setShuffleOptions}
                questionsCount={questions.length}
                isAiMode={true}
                onNext={() => setCurrentStep(3)}
                onBack={() => setCurrentStep(1)}
                playClick={playClick}
              />
            )}

            {/* Step 3 in AI Mode: Pratinjau & Simpan */}
            {currentStep === 3 && renderPreviewView(true)}
          </>
        ) : (
          /* ================= 3. STUDIO KUIS MANUAL (3 TABS) ================= */
          <>
            {/* Step 1 in Manual Mode: Pengaturan Kuis */}
            {currentStep === 1 && (
              <InfoKuisStep
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
                grade={grade}
                setGrade={setGrade}
                subject={subject}
                setSubject={setSubject}
                durationPerQuestionSec={durationPerQuestionSec}
                setDurationPerQuestionSec={setDurationPerQuestionSec}
                badgeTitle={badgeTitle}
                setBadgeTitle={setBadgeTitle}
                coverEmoji={coverEmoji}
                setCoverEmoji={setCoverEmoji}
                visibility={visibility}
                setVisibility={setVisibility}
                defaultGameMode={defaultGameMode}
                setDefaultGameMode={setDefaultGameMode}
                shuffleQuestions={shuffleQuestions}
                setShuffleQuestions={setShuffleQuestions}
                shuffleOptions={shuffleOptions}
                setShuffleOptions={setShuffleOptions}
                questionsCount={questions.length}
                isAiMode={false}
                onNext={() => setCurrentStep(2)}
                onBack={onBack}
                playClick={playClick}
              />
            )}

            {/* Step 2 in Manual Mode: Bank Soal */}
            {currentStep === 2 && renderBankSoalView(false)}

            {/* Step 3 in Manual Mode: Pratinjau & Simpan */}
            {currentStep === 3 && renderPreviewView(false)}
          </>
        )}

      </main>

      {/* Asisten Soal AI Modal */}
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

  // Helper renderer untuk Bank Soal
  function renderBankSoalView(isAi: boolean) {
    return (
      <div className="w-full max-w-6xl 2xl:max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-5 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 2xl:gap-8 items-start">
          
          {/* Question Bank List */}
          <div className="lg:col-span-5 2xl:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
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
                  className="px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-bold text-xs flex items-center gap-1.5 min-h-[36px] transition-colors border border-indigo-200/60 dark:border-indigo-800/60"
                  title="Asisten AI & Tambah Soal Cepat"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Asisten AI
                </button>
                {(!isAddingQuestion || editingQuestionId) && (
                  <button
                    type="button"
                    onClick={handleOpenNewQuestion}
                    className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 min-h-[36px] transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Soal
                  </button>
                )}
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {questions.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 space-y-3">
                  <p className="text-xs">Belum ada butir soal di kuis ini.</p>
                  <button
                    type="button"
                    onClick={handleOpenNewQuestion}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Buat Butir Soal Pertama
                  </button>
                </div>
              ) : (
                questions.map((q, idx) => {
                  const isEditingThis = editingQuestionId === q.id;
                  return (
                    <div
                      key={q.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isEditingThis
                          ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-400/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 mb-1 flex-wrap">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 text-amber-500" /> {q.points || 10}p
                              </span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {q.type === 'multiple_choice' ? 'Pilihan Ganda' : q.type === 'true_false' ? 'Benar / Salah' : q.type === 'short_answer' ? 'Isian' : q.type === 'matching_pairs' ? 'Pasangan' : 'Tebak Gambar'}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                              {q.text}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveQuestion(idx, 'up')}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Pindah ke Atas"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === questions.length - 1}
                            onClick={() => handleMoveQuestion(idx, 'down')}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Pindah ke Bawah"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEditQuestion(q)}
                            className="p-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                            title="Edit Soal"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateQuestion(q)}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                            title="Duplikasi Soal"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-500 hover:text-rose-700"
                            title="Hapus Soal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Question Editor Form Column */}
          <div className="lg:col-span-7 2xl:col-span-8">
            {isAddingQuestion ? (
              <form onSubmit={(e) => handleSaveQuestion(e, 'finish')} className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-blue-600" />
                    {editingQuestionId ? 'Edit Butir Soal' : 'Tambah Butir Soal Baru'}
                  </h3>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Tipe Soal & Poin */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Format Tipe Soal
                    </label>
                    <select
                      value={qType}
                      onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                    >
                      <option value="multiple_choice">Pilihan Ganda (4 Opsi)</option>
                      <option value="true_false">Benar / Salah</option>
                      <option value="short_answer">Isian Singkat</option>
                      <option value="matching_pairs">Menjodohkan Kartu</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Bobot Poin
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={qPoints}
                      onChange={(e) => setQPoints(parseInt(e.target.value) || 10)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Pertanyaan */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teks Pertanyaan Soal <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    placeholder="Tuliskan butir pertanyaan kuis secara jelas dan ramah anak..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Gambar Ilustrasi */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" /> Ilustrasi Gambar (Opsional)
                    </span>
                    {qImageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setQImageUrl(undefined);
                          setQImageCaption('');
                        }}
                        className="text-xs text-rose-500 hover:underline"
                      >
                        Hapus Gambar
                      </button>
                    )}
                  </div>

                  {qImageUrl ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={qImageUrl}
                        alt="Ilustrasi Soal"
                        className="w-20 h-20 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div className="min-w-0 flex-1">
                        <input
                          type="text"
                          value={qImageCaption}
                          onChange={(e) => setQImageCaption(e.target.value)}
                          placeholder="Keterangan gambar (misal: Organ Paru-Paru)"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 min-h-[36px]">
                        <Upload className="w-3.5 h-3.5 text-slate-500" /> Unggah Berkas
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={isGeneratingAiImage}
                        onClick={handleGenerateSingleAiImage}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 text-xs font-bold inline-flex items-center gap-1.5 min-h-[36px] disabled:opacity-50"
                      >
                        {isGeneratingAiImage ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Meracik Gambar...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Buat Gambar Edukasi AI
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Form Input Opsi berdasarkan Tipe */}
                {qType === 'multiple_choice' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Pilihan Jawaban & Kunci Benar (Klik lingkaran untuk memilih kunci)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {qOptions.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                            qCorrectIndex === oIdx
                              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setQCorrectIndex(oIdx)}
                            className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                              qCorrectIndex === oIdx
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </button>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(oIdx, e.target.value)}
                            placeholder={`Pilihan ${String.fromCharCode(65 + oIdx)}`}
                            className="flex-1 bg-transparent text-xs font-medium focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {qType === 'true_false' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Pilih Kunci Jawaban Pernyataan Ini
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Benar', 'Salah'].map((val, oIdx) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setQCorrectIndex(oIdx)}
                          className={`py-3 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 min-h-[44px] ${
                            qCorrectIndex === oIdx
                              ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {qType === 'short_answer' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Kunci Jawaban Isian Singkat (Pisahkan tanda koma jika ada variasi ejaan)
                    </label>
                    <input
                      type="text"
                      value={qAcceptableAnswers}
                      onChange={(e) => setQAcceptableAnswers(e.target.value)}
                      placeholder="Contoh: paru-paru, pulmo, paru paru"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}

                {qType === 'matching_pairs' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Pasangan Kartu Menjodohkan (Kiri ➔ Kanan)
                      </label>
                      <button
                        type="button"
                        onClick={handleAddMatchingPair}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        + Tambah Pasangan
                      </button>
                    </div>

                    <div className="space-y-2">
                      {qMatchingPairs.map((pair, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={pair.left}
                            onChange={(e) => handleMatchingPairChange(idx, 'left', e.target.value)}
                            placeholder={`Kartu Kiri #${idx + 1}`}
                            className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                          />
                          <span className="text-slate-400 font-bold">➔</span>
                          <input
                            type="text"
                            value={pair.right}
                            onChange={(e) => handleMatchingPairChange(idx, 'right', e.target.value)}
                            placeholder={`Kartu Kanan #${idx + 1}`}
                            className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                          />
                          {qMatchingPairs.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMatchingPair(idx)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pembahasan */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Pembahasan Edukatif (Muncul saat siswa selesai menjawab)
                  </label>
                  <textarea
                    value={qExplanation}
                    onChange={(e) => setQExplanation(e.target.value)}
                    rows={2}
                    placeholder="Jelaskan alasan mengapa jawaban tersebut benar untuk menambah wawasan siswa..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Tombol Simpan Butir Soal */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSaveQuestion(e, 'continue')}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800"
                  >
                    Simpan & Tambah Lagi
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-sm btn-press"
                  >
                    Simpan & Selesai
                  </button>
                </div>

              </form>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-3 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
                  <Layers className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-extrabold text-slate-900 dark:text-white text-base">Editor Soal Siap Digunakan</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    Pilih butir soal di samping untuk mengoreksi teks/jawaban, atau klik tombol di bawah untuk menyusun butir soal baru.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenNewQuestion}
                  className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 min-h-[44px] shadow-sm btn-press transition-colors"
                >
                  <Plus className="w-4 h-4" /> Tambah Butir Soal Baru
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Bottom Bar: Bank Soal Navigation */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
          {isAi ? (
            <button
              type="button"
              onClick={() => {
                playClick();
                setAiFunnelActive(true);
              }}
              className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px] flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Racik Ulang dengan AI</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                playClick();
                setCurrentStep(1);
              }}
              className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px] flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Pengaturan Kuis</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              playClick();
              if (questions.length === 0) {
                showToast('Tambahkan minimal 1 butir soal sebelum melanjutkan.');
                return;
              }
              if (isAi) {
                setCurrentStep(2); // Lanjut ke Pengaturan Kuis di AI mode
              } else {
                setCurrentStep(3); // Lanjut ke Pratinjau di Manual mode
              }
            }}
            className="px-6 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm flex items-center gap-2 min-h-[44px] btn-press transition-all"
          >
            <span>{isAi ? 'Lanjut ke Pengaturan Kuis' : `Lihat Pratinjau (${questions.length} Soal)`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    );
  }

  // Helper renderer untuk Pratinjau & Simpan (Step 3)
  function renderPreviewView(isAi: boolean) {
    return (
      <div className="w-full max-w-[2000px] mx-auto px-3 xs:px-4 sm:px-8 lg:px-12 py-4 sm:py-6 animate-fade-in space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Kolom Kiri: Pratinjau Soal (8 kolom di desktop) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-card space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Pratinjau Butir Soal Kuis ({questions.length} Soal)
                </h2>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-xl">
                Siap Diterbitkan
              </span>
            </div>

            {/* Questions Summary List */}
            <div className="space-y-2">
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    onClick={() => {
                      handleStartEditQuestion(q);
                      setCurrentStep(isAi ? 1 : 2); // Kembali ke Bank Soal
                    }}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 flex items-center justify-between text-xs cursor-pointer transition-all group"
                    title="Klik untuk mengedit butir soal ini di Bank Soal"
                  >
                    <div className="truncate mr-3 min-w-0">
                      <span className="font-extrabold text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0">#{idx + 1}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {q.text}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500" /> {q.points || 10}p
                      </span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg text-xs">
                        {q.type === 'short_answer'
                          ? (q.acceptableAnswers?.[0] || q.options[0] || '-')
                          : q.type === 'matching_pairs'
                          ? `${q.matchingPairs?.length || q.options.length} Pasang`
                          : (q.options[q.correctIndex] || '-')}
                      </span>
                      <span className="p-1 text-slate-400 group-hover:text-blue-600 rounded">
                        <Edit3 className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Card Kuis & Tombol Simpan (4 kolom di desktop) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Simulated Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Kartu Kuis Siswa
              </span>
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
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2">{title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{description || 'Kuis interaktif buatan Guru.'}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 font-medium space-y-1">
                  <div className="flex justify-between">
                    <span>Total Soal:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{questions.length} Butir</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Durasi Menjawab:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{durationPerQuestionSec}s / soal</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mode Permainan:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {defaultGameMode === 'survival_3hearts' ? '3 Hati ❤️' : defaultGameMode === 'untimed' ? 'Santai 🧘' : 'Standar ⏱️'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status Akses:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {visibility === 'public' ? '🌐 Publik' : '🔒 Privat PIN'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <button
                type="button"
                onClick={handleFinalPublish}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 px-5 rounded-2xl shadow-md flex items-center justify-center gap-2 min-h-[48px] btn-press text-sm transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{editingQuiz ? 'Simpan Perubahan Kuis' : 'Terbitkan Kuis Sekarang'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClick();
                  setCurrentStep(2); // Kembali ke step 2 (Pengaturan Kuis di AI mode, Bank Soal di Manual mode)
                }}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 min-h-[44px] transition-colors"
              >
                {isAi ? '← Edit Pengaturan Kuis' : '← Edit Bank Soal'}
              </button>
            </div>

          </div>

        </div>
      </div>
    );
  }
};
