import React, { useState, useEffect, useRef } from 'react';
import type { Quiz, QuizQuestion, Subject, QuestionType, GameMode, EducationLevel } from '../../types/quiz';
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
  RotateCcw, 
  Edit3, 
  Copy, 
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  Star, 
  ArrowRight,
  AlertCircle,
  Check,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { AiQuestionModal } from './AiQuestionModal';
import { ImageSelectorModal } from './ImageSelectorModal';
import { AiGeneratorStep, clearAiGeneratorDraft } from './AiGeneratorStep';
import { InfoKuisStep } from './InfoKuisStep';
import { ResizableTextarea } from '../common/ResizableTextarea';

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
  aiFunnelStage?: 1 | 2 | 3 | 4;
  funnelTopic?: string;
  creatorMode?: 'ai' | 'manual';
  title: string;
  description: string;
  subject: Subject;
  grade: number;
  educationLevel?: EducationLevel;
  durationPerQuestionSec: number;
  coverEmoji: string;
  badgeTitle: string;
  visibility: 'public' | 'private';
  defaultGameMode?: GameMode;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  questions: QuizQuestion[];
  activeQuestionDraft?: {
    editingQuestionId?: string | null;
    isAddingQuestion?: boolean;
    qText?: string;
    qType?: QuestionType;
    qImageCaption?: string;
    qImagePrompt?: string;
    qImageUrl?: string;
    qOptions?: string[];
    qCorrectIndex?: number;
    qExplanation?: string;
    qAcceptableAnswers?: string;
    qMatchingPairs?: { left: string; right: string }[];
    qPoints?: number;
    qCustomDurationSec?: string;
  };
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
  const [draft] = useState<CreatorDraft | null>(() => (editingQuiz ? null : loadDraft()));
  
  // Mode pembuatan kuis: dinamis dan terkelola dengan React State
  const [creatorMode, setCreatorMode] = useState<'ai' | 'manual'>(() => {
    if (editingQuiz) return 'manual';
    if (initialMode === 'ai') return 'ai';
    if (draft?.creatorMode === 'ai') return 'ai';
    // Draf dari AI Funnel memiliki funnelTopic atau format deskripsi/judul khas generator AI
    if (draft?.funnelTopic && draft.funnelTopic.trim().length > 0) return 'ai';
    if (draft?.description && draft.description.includes('Kurikulum Merdeka')) return 'ai';
    if (draft?.title && (draft.title.startsWith('Eksplorasi') || draft.title.startsWith('Kuis '))) return 'ai';
    if (Boolean(draft?.aiFunnelActive)) return 'ai';
    if (draft?.creatorMode) return draft.creatorMode;
    return initialMode || 'manual';
  });

  const isAiMode = creatorMode === 'ai' && !editingQuiz;
  const totalSteps = 3;

  // AI Creation Funnel state:
  const [aiFunnelActive, setAiFunnelActive] = useState<boolean>(() => {
    if (editingQuiz) return false;
    // Jika user secara eksplisit memilih mode AI saat membuka creator
    if (initialMode === 'ai') {
      // Jika ada draf yang sudah berstatus AI, funnel sudah selesai (false), dan sudah ada soal yang digenerate:
      if (draft?.creatorMode === 'ai' && draft.aiFunnelActive === false && draft.questions && draft.questions.length > 0) {
        return false;
      }
      return true;
    }
    // Jika ada draf dengan status funnel spesifik
    if (draft && typeof draft.aiFunnelActive === 'boolean') {
      return draft.aiFunnelActive;
    }
    if (draft?.creatorMode === 'ai') {
      return true;
    }
    return false;
  });

  // Funnel Sub-Stage (1: Mapel & Kelas, 2: Topik Materi, 3: Format Soal, 4: Mesin AI)
  const [aiFunnelStage, setAiFunnelStage] = useState<1 | 2 | 3 | 4>(draft?.aiFunnelStage || 1);
  const [funnelTopic, setFunnelTopic] = useState<string>(draft?.funnelTopic || '');

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
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(() => {
    if (editingQuiz?.educationLevel) return editingQuiz.educationLevel;
    if (draft?.educationLevel) return draft.educationLevel;
    const initialG = editingQuiz?.grade ?? draft?.grade ?? 3;
    if (initialG >= 10) return 'SMA';
    if (initialG >= 7) return 'SMP';
    return 'SD';
  });
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

  // Active Question Form State (restored from draft if page reloaded during edit)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(() => draft?.activeQuestionDraft?.editingQuestionId ?? null);
  const [qText, setQText] = useState(() => draft?.activeQuestionDraft?.qText ?? '');
  const [qType, setQType] = useState<QuestionType>(() => draft?.activeQuestionDraft?.qType ?? 'multiple_choice');
  const [qImageCaption, setQImageCaption] = useState(() => draft?.activeQuestionDraft?.qImageCaption ?? '');
  const [qImagePrompt, setQImagePrompt] = useState(() => draft?.activeQuestionDraft?.qImagePrompt ?? '');
  const [qImageUrl, setQImageUrl] = useState<string | undefined>(() => draft?.activeQuestionDraft?.qImageUrl);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [qOptions, setQOptions] = useState<string[]>(() => draft?.activeQuestionDraft?.qOptions ?? ['', '', '', '']);
  const [qCorrectIndex, setQCorrectIndex] = useState<number>(() => draft?.activeQuestionDraft?.qCorrectIndex ?? 0);
  const [qExplanation, setQExplanation] = useState(() => draft?.activeQuestionDraft?.qExplanation ?? '');
  const [qAcceptableAnswers, setQAcceptableAnswers] = useState(() => draft?.activeQuestionDraft?.qAcceptableAnswers ?? '');
  const [qMatchingPairs, setQMatchingPairs] = useState<{ left: string; right: string }[]>(
    () => draft?.activeQuestionDraft?.qMatchingPairs ?? [
      { left: '', right: '' },
      { left: '', right: '' },
      { left: '', right: '' },
    ]
  );
  const [qPoints, setQPoints] = useState<number>(() => draft?.activeQuestionDraft?.qPoints ?? 10);
  const [qCustomDurationSec, setQCustomDurationSec] = useState<string>(() => draft?.activeQuestionDraft?.qCustomDurationSec ?? '');
  const [isAddingQuestion, setIsAddingQuestion] = useState(() => draft?.activeQuestionDraft?.isAddingQuestion ?? false);
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});
  const [showAllExplanations, setShowAllExplanations] = useState(false);
  const [showFloatingActions, setShowFloatingActions] = useState(true);
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
  const [showRacikUlangConfirm, setShowRacikUlangConfirm] = useState(false);

  // Monitor scroll untuk Smart Floating Action FAB:
  // Selalu tampil untuk menambah soal instan dan otomatis sembunyi saat mendekati dasar halaman agar tidak menutupi tombol navigasi
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      // Cek apakah mendekati dasar halaman (kurang dari 110px dari batas bawah)
      const isNearBottom = scrollHeight - (scrollY + clientHeight) < 110;

      const shouldShow = !isNearBottom;
      setShowFloatingActions(shouldShow);
      if (!shouldShow) {
        setIsSpeedDialOpen(false);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Tutup menu speed dial saat tombol Escape ditekan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSpeedDialOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleScrollToTop = () => {
    playClick();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Simpan draf kuis secara manual dan tampilkan feedback toast
  const handleSaveDraftManual = () => {
    playClick();
    try {
      const data: CreatorDraft = {
        currentStep,
        aiFunnelActive,
        aiFunnelStage,
        funnelTopic,
        creatorMode: isAiMode ? 'ai' : 'manual',
        title,
        description,
        subject,
        grade,
        educationLevel,
        durationPerQuestionSec,
        coverEmoji,
        badgeTitle,
        visibility,
        defaultGameMode,
        shuffleQuestions,
        shuffleOptions,
        questions,
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
      showToast('💾 Draf kuis berhasil disimpan! Anda dapat melanjutkannya kapan saja.');
    } catch {
      showToast('⚠️ Gagal menyimpan draf kuis.');
    }
  };

  const toggleExplanation = (id: string) => {
    playClick();
    setExpandedExplanations((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleAllExplanations = () => {
    playClick();
    const nextState = !showAllExplanations;
    setShowAllExplanations(nextState);
    const updated: Record<string, boolean> = {};
    questions.forEach((q) => {
      updated[q.id] = nextState;
    });
    setExpandedExplanations(updated);
  };

  // Persist draft automatically (only if creating new quiz)
  useEffect(() => {
    if (editingQuiz) return;
    const hasActiveQuestion = Boolean(
      editingQuestionId ||
      isAddingQuestion ||
      qText.trim() ||
      qExplanation.trim() ||
      qAcceptableAnswers.trim() ||
      qOptions.some((opt) => opt.trim()) ||
      qMatchingPairs.some((p) => p.left.trim() || p.right.trim())
    );

    const hasAnyContent = 
      title.trim() || 
      description.trim() || 
      questions.length > 0 || 
      funnelTopic.trim() ||
      hasActiveQuestion ||
      aiFunnelActive;

    if (hasAnyContent) {
      const data: CreatorDraft = {
        currentStep,
        aiFunnelActive,
        aiFunnelStage,
        funnelTopic,
        creatorMode: isAiMode ? 'ai' : 'manual',
        title,
        description,
        subject,
        grade,
        educationLevel,
        durationPerQuestionSec,
        coverEmoji,
        badgeTitle,
        visibility,
        defaultGameMode,
        shuffleQuestions,
        shuffleOptions,
        questions,
        activeQuestionDraft: hasActiveQuestion ? {
          editingQuestionId,
          isAddingQuestion,
          qText,
          qType,
          qImageCaption,
          qImagePrompt,
          qImageUrl,
          qOptions,
          qCorrectIndex,
          qExplanation,
          qAcceptableAnswers,
          qMatchingPairs,
          qPoints,
          qCustomDurationSec,
        } : undefined,
      };
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
      } catch {
        // quota fallback
      }
    }
  }, [
    currentStep, 
    aiFunnelActive, 
    aiFunnelStage, 
    funnelTopic, 
    title, 
    description, 
    subject, 
    grade, 
    educationLevel, 
    durationPerQuestionSec, 
    coverEmoji, 
    badgeTitle, 
    visibility, 
    defaultGameMode, 
    shuffleQuestions, 
    shuffleOptions, 
    questions, 
    editingQuiz,
    isAiMode,
    editingQuestionId,
    isAddingQuestion,
    qText,
    qType,
    qImageCaption,
    qImagePrompt,
    qImageUrl,
    qOptions,
    qCorrectIndex,
    qExplanation,
    qAcceptableAnswers,
    qMatchingPairs,
    qPoints,
    qCustomDurationSec
  ]);

  // Inform user if a draft was restored upon mount
  const restoredDraftRef = useRef(false);
  useEffect(() => {
    if (!editingQuiz && draft && !restoredDraftRef.current) {
      restoredDraftRef.current = true;
      const questionCount = draft.questions?.length || 0;
      const hasDraftContent = draft.title || draft.funnelTopic || questionCount > 0 || draft.activeQuestionDraft;
      if (hasDraftContent) {
        showToast('✨ Draf kuis Anda sebelumnya telah dipulihkan secara otomatis.');
      }
    }
  }, [draft, editingQuiz]);

  // Warn before accidental page reload / close if there is unsaved progress
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasProgress = 
        Boolean(title.trim()) || 
        Boolean(funnelTopic.trim()) || 
        questions.length > 0 || 
        Boolean(qText.trim()) ||
        Boolean(editingQuestionId) ||
        isAddingQuestion;

      if (hasProgress) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [title, funnelTopic, questions.length, qText, editingQuestionId, isAddingQuestion]);

  const mainContentRef = useRef<HTMLElement>(null);

  // Selalu reset posisi scroll ke paling atas dan kembalikan fokus ke konten saat perpindahan tahap/langkah
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const resetScrollAndFocus = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (mainContentRef.current) {
        mainContentRef.current.focus({ preventScroll: true });
      }
    };

    resetScrollAndFocus();
    const rafId = requestAnimationFrame(() => {
      resetScrollAndFocus();
    });
    return () => cancelAnimationFrame(rafId);
  }, [aiFunnelStage, currentStep, aiFunnelActive]);

  const handleResetDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      clearAiGeneratorDraft();
    } catch {
      // ignore
    }
    setTitle('');
    setDescription('');
    setFunnelTopic('');
    setAiFunnelStage(1);
    setSubject('Matematika');
    setGrade(3);
    setEducationLevel('SD');
    setDurationPerQuestionSec(30);
    setCoverEmoji('🍎');
    setBadgeTitle('Bintang Pintar');
    setVisibility('public');
    setDefaultGameMode('standard');
    setShuffleQuestions(false);
    setShuffleOptions(false);
    setQuestions([]);
    setEditingQuestionId(null);
    setIsAddingQuestion(false);
    resetFormFields();
    setCurrentStep(1);
    if (isAiMode) {
      setCreatorMode('ai');
      setAiFunnelActive(true);
      setAiFunnelStage(1);
      setFunnelTopic('');
    } else {
      setCreatorMode('manual');
      setAiFunnelActive(false);
    }
    setShowResetConfirm(false);
    showToast('Draf pembuatan kuis telah direset.');
  };

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
      if (isAiMode && (editingQuestionId || (isAddingQuestion && questions.length > 0))) {
        handleCancelEdit();
        return true;
      }
      if (isAiMode) {
        setShowRacikUlangConfirm(true);
        return true;
      }
      onBack();
      return true;
    }
    return false;
  }, !aiFunnelActive && currentStep === 1);

  useBackHandler('creator-ai-funnel-stage4', 56, () => {
    if (aiFunnelActive && aiFunnelStage === 4) {
      setAiFunnelStage(3);
      return true;
    }
    return false;
  }, aiFunnelActive && aiFunnelStage === 4);

  useBackHandler('creator-ai-funnel-stage3', 57, () => {
    if (aiFunnelActive && aiFunnelStage === 3) {
      setAiFunnelStage(2);
      return true;
    }
    return false;
  }, aiFunnelActive && aiFunnelStage === 3);

  useBackHandler('creator-ai-funnel-stage2', 58, () => {
    if (aiFunnelActive && aiFunnelStage === 2) {
      setAiFunnelStage(1);
      return true;
    }
    return false;
  }, aiFunnelActive && aiFunnelStage === 2);

  useBackHandler('creator-ai-funnel', 60, () => {
    if (aiFunnelActive && aiFunnelStage === 1) {
      if (onBackToMethodSelection) {
        onBackToMethodSelection();
      } else {
        onBack();
      }
      return true;
    }
    return false;
  }, aiFunnelActive && aiFunnelStage === 1);

  const resetFormFields = (targetType: QuestionType = qType) => {
    setQText('');
    setQImageCaption('');
    setQImagePrompt('');
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
    setQImagePrompt(q.imagePrompt || '');
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
    if (!window.confirm('Hapus butir soal ini dari bank soal?')) return;
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
      imagePrompt: qImagePrompt.trim() || undefined,
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
      educationLevel: educationLevel || (grade >= 10 ? 'SMA' : grade >= 7 ? 'SMP' : 'SD'),
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
      clearAiGeneratorDraft();
    } catch {
      // ignore
    }

    onSaveQuiz(finalQuiz);
  };

  const handleHeaderBack = () => {
    playClick();
    if (aiFunnelActive) {
      if (aiFunnelStage > 1) {
        setAiFunnelStage((prev) => (prev - 1) as 1 | 2 | 3 | 4);
      } else {
        if (onBackToMethodSelection) {
          onBackToMethodSelection();
        } else {
          onBack();
        }
      }
      return;
    }

    // Jika sedang di Mode AI pada Step 1 (Bank Soal), tombol back memicu Racik Ulang dengan konfirmasi
    if (isAiMode && currentStep === 1) {
      setShowRacikUlangConfirm(true);
      return;
    }

    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      if (onBackToMethodSelection) {
        onBackToMethodSelection();
      } else {
        onBack();
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-200">
      {/* App Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-[2000px] mx-auto px-3 xs:px-4 sm:px-8 lg:px-12 h-14 sm:h-16 flex items-center justify-between gap-3">
          
          {/* Header Left: Back Button + Title */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={handleHeaderBack}
              className="p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors btn-press"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
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
                  ? (aiFunnelStage === 1 
                      ? 'Tahap 1 dari 4: Jenjang, Mapel & Tingkat Kelas' 
                      : aiFunnelStage === 2 
                      ? 'Tahap 2 dari 4: Topik & Sasaran Pembelajaran'
                      : aiFunnelStage === 3 
                      ? 'Tahap 3 dari 4: Format & Konfigurasi Soal' 
                      : 'Tahap 4 dari 4: Pilihan Mesin AI & Eksekusi')
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

        {/* 4-Stage Funnel Tabs in Sticky Header (SELALU MENEMPEL DI HEADER SAAT SCROLL) */}
        {aiFunnelActive ? (
          <div className="w-full max-w-[2000px] mx-auto px-3 xs:px-4 sm:px-8 lg:px-12 mt-2.5 pb-2.5 sm:pb-3 space-y-2 transition-all">
            <div className="grid grid-cols-4 gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setAiFunnelStage(1);
                }}
                className={`py-2 px-0.5 xs:px-1.5 sm:px-2 rounded-xl font-bold text-[11px] sm:text-xs md:text-sm transition-all min-h-[44px] flex items-center justify-center gap-1 sm:gap-1.5 truncate btn-press ${
                  aiFunnelStage === 1
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30 font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span className={`w-5 h-5 rounded-full text-[10px] sm:text-xs font-black flex items-center justify-center shrink-0 ${
                  aiFunnelStage === 1 ? 'bg-white text-blue-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  1
                </span>
                <span className="truncate">
                  <span className="hidden md:inline">Mapel & Kelas</span>
                  <span className="md:hidden">Mapel</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClick();
                  setAiFunnelStage(2);
                }}
                className={`py-2 px-0.5 xs:px-1.5 sm:px-2 rounded-xl font-bold text-[11px] sm:text-xs md:text-sm transition-all min-h-[44px] flex items-center justify-center gap-1 sm:gap-1.5 truncate btn-press ${
                  aiFunnelStage === 2
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30 font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span className={`w-5 h-5 rounded-full text-[10px] sm:text-xs font-black flex items-center justify-center shrink-0 ${
                  aiFunnelStage === 2 ? 'bg-white text-blue-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  2
                </span>
                <span className="truncate">
                  <span className="hidden md:inline">Topik Materi</span>
                  <span className="md:hidden">Topik</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClick();
                  if (!funnelTopic.trim()) {
                    showToast('Mohon tentukan topik kuis terlebih dahulu pada Tahap 2.');
                    return;
                  }
                  setAiFunnelStage(3);
                }}
                className={`py-2 px-0.5 xs:px-1.5 sm:px-2 rounded-xl font-bold text-[11px] sm:text-xs md:text-sm transition-all min-h-[44px] flex items-center justify-center gap-1 sm:gap-1.5 truncate btn-press ${
                  aiFunnelStage === 3
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30 font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span className={`w-5 h-5 rounded-full text-[10px] sm:text-xs font-black flex items-center justify-center shrink-0 ${
                  aiFunnelStage === 3 ? 'bg-white text-blue-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  3
                </span>
                <span className="truncate">
                  <span className="hidden md:inline">Format Soal</span>
                  <span className="md:hidden">Format</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClick();
                  if (!funnelTopic.trim()) {
                    showToast('Mohon tentukan topik kuis terlebih dahulu pada Tahap 2.');
                    return;
                  }
                  setAiFunnelStage(4);
                }}
                className={`py-2 px-0.5 xs:px-1.5 sm:px-2 rounded-xl font-bold text-[11px] sm:text-xs md:text-sm transition-all min-h-[44px] flex items-center justify-center gap-1 sm:gap-1.5 truncate btn-press ${
                  aiFunnelStage === 4
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30 font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span className={`w-5 h-5 rounded-full text-[10px] sm:text-xs font-black flex items-center justify-center shrink-0 ${
                  aiFunnelStage === 4 ? 'bg-white text-blue-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  4
                </span>
                <span className="truncate">
                  <span className="hidden md:inline">Mesin AI</span>
                  <span className="md:hidden">Mesin</span>
                </span>
              </button>
            </div>

            {/* 4-Segment Interactive Progress Track */}
            <div className="grid grid-cols-4 gap-1 sm:gap-2">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  aiFunnelStage >= 1 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  aiFunnelStage >= 2 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  aiFunnelStage >= 3 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  aiFunnelStage >= 4 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            </div>
          </div>
        ) : (
          /* 3 Step Navigation Tabs (HANYA MUNCUL DI STUDIO KUIS UTAMA) */
          <div className="w-full max-w-[2000px] mx-auto px-3 xs:px-4 sm:px-8 lg:px-12 mt-2.5 pb-2.5 sm:pb-3 grid grid-cols-3 gap-1.5 sm:gap-2 transition-all">
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

      {/* Modal Konfirmasi Racik Ulang dengan AI */}
      {showRacikUlangConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">Racik Ulang Kuis AI?</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Kembali ke formulir konfigurasi AI</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
              Anda akan kembali ke tahap pemilihan topik dan format soal. Seluruh pengaturan tetap tersimpan sehingga Anda dapat menyesuaikannya sebelum membuat ulang.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowRacikUlangConfirm(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setShowRacikUlangConfirm(false);
                  setCreatorMode('ai');
                  setAiFunnelActive(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1.5 min-h-[44px]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ya, Racik Ulang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content View */}
      <main ref={mainContentRef} tabIndex={-1} className="flex-1 w-full mt-2 sm:mt-4 outline-none focus:outline-none">
        
        {/* ================= 1. ASISTEN RACIK KUIS AI (CREATION FUNNEL) ================= */}
        {aiFunnelActive ? (
          <AiGeneratorStep
            stage={aiFunnelStage}
            onStageChange={setAiFunnelStage}
            topic={funnelTopic}
            onTopicChange={setFunnelTopic}
            onGenerated={(data) => {
              const lvl = data.educationLevel || (data.grade >= 10 ? 'SMA' : data.grade >= 7 ? 'SMP' : 'SD');
              const lvlLabel = lvl === 'SMA' ? 'SMA / SMK' : lvl === 'SMP' ? 'SMP' : 'SD';
              const generatedTitle = data.title && data.title.trim()
                ? data.title.trim()
                : `Kuis ${data.subject}: ${data.topic.length > 40 ? data.topic.slice(0, 40) + '...' : data.topic}`;
              const generatedDesc = data.description && data.description.trim()
                ? data.description.trim()
                : `Latihan kuis interaktif Kurikulum Merdeka mata pelajaran ${data.subject} Kelas ${data.grade} ${lvlLabel} topik ${data.topic}.`;

              setQuestions(data.questions);
              setTitle(generatedTitle);
              setDescription(generatedDesc);
              setSubject(data.subject);
              setGrade(data.grade);
              setEducationLevel(lvl);
              setCoverEmoji(data.coverEmoji);
              setBadgeTitle(data.badgeTitle);
              if (data.durationPerQuestionSec && data.durationPerQuestionSec > 0) {
                setDurationPerQuestionSec(data.durationPerQuestionSec);
              }
              if (data.defaultGameMode) {
                setDefaultGameMode(data.defaultGameMode);
              }
              setCreatorMode('ai');
              setAiFunnelActive(false);
              setCurrentStep(1); // Enters Studio Step 1: Bank Soal
              showToast(`✨ Kuis "${generatedTitle}" (${data.questions.length} butir soal) berhasil diracik lengkap dengan identitas kuis!`);
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
            initialEducationLevel={educationLevel}
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
                educationLevel={educationLevel}
                setEducationLevel={setEducationLevel}
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
                educationLevel={educationLevel}
                setEducationLevel={setEducationLevel}
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

      {/* Smart Compact Speed Dial FAB (Melayang compact 48×48px di sudut kanan bawah) */}
      {!aiFunnelActive && (isAiMode ? currentStep === 1 : currentStep === 2) && !isAddingQuestion && (
        <>
          {/* Backdrop Transparan / Samar (Mengetuk area luar akan otomatis menutup menu) */}
          {isSpeedDialOpen && (
            <div
              onClick={() => setIsSpeedDialOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/20 dark:bg-slate-950/40 backdrop-blur-[1px] transition-opacity animate-fade-in"
              aria-hidden="true"
            />
          )}

          <div
            className={`fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 right-4 sm:right-6 lg:right-10 z-40 transition-all duration-200 ease-out ${
              showFloatingActions
                ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                : 'opacity-0 translate-y-6 scale-95 pointer-events-none'
            }`}
            onMouseLeave={() => {
              if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                setIsSpeedDialOpen(false);
              }
            }}
          >
            {/* Speed Dial Menu Items (Position Absolute melayang ke atas, TIDAK memperlebar area hit-test saat tertutup) */}
            <div
              className={`absolute bottom-full right-0 pb-3 flex flex-col items-end gap-2.5 transition-all duration-200 origin-bottom ${
                isSpeedDialOpen
                  ? 'visible opacity-100 translate-y-0 scale-100 pointer-events-auto'
                  : 'invisible opacity-0 translate-y-3 scale-90 pointer-events-none'
              }`}
            >
              {/* Item 2: Ke Atas */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 shadow-md border border-slate-200/80 dark:border-slate-700/80 whitespace-nowrap">
                  Ke Atas
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsSpeedDialOpen(false);
                    handleScrollToTop();
                  }}
                  className="w-11 h-11 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-lg border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all active:scale-95 btn-press min-h-[44px] min-w-[44px]"
                  title="Gulir ke paling atas"
                  aria-label="Gulir ke paling atas"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
              </div>

              {/* Item 1: Tambah Soal */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold text-indigo-900 dark:text-indigo-200 bg-white dark:bg-slate-800 shadow-md border border-indigo-200/80 dark:border-indigo-800/80 whitespace-nowrap">
                  Tambah Soal
                </span>
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setIsSpeedDialOpen(false);
                    handleOpenNewQuestion();
                  }}
                  className="w-11 h-11 rounded-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 transition-all active:scale-95 btn-press min-h-[44px] min-w-[44px]"
                  title="Tambah Butir Soal Baru"
                  aria-label="Tambah Butir Soal Baru"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Trigger FAB Utama (Ukuran presisi 48×48px di mobile, 52×52px di sm, hover hanya aktif tepat di atas tombol) */}
            <button
              type="button"
              onClick={() => {
                playClick();
                setIsSpeedDialOpen((prev) => !prev);
              }}
              onMouseEnter={() => {
                if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                  setIsSpeedDialOpen(true);
                }
              }}
              className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-200 active:scale-90 btn-press min-h-[48px] min-w-[48px] ${
                isSpeedDialOpen
                  ? 'bg-slate-800 dark:bg-slate-700 shadow-slate-900/40'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/35 hover:scale-105'
              }`}
              title={isSpeedDialOpen ? 'Tutup menu' : 'Menu tambah soal & aksi'}
              aria-label={isSpeedDialOpen ? 'Tutup menu aksi' : 'Buka menu aksi melayang'}
              aria-expanded={isSpeedDialOpen}
            >
              <Plus
                className={`w-6 h-6 stroke-[2.5] transition-transform duration-200 ${
                  isSpeedDialOpen ? 'rotate-45' : 'rotate-0'
                }`}
              />
            </button>
          </div>
        </>
      )}

      {/* Asisten Soal AI Modal */}
      <AiQuestionModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onImportQuestions={handleImportAiQuestions}
        currentSubject={subject}
        currentGrade={grade}
        playClick={playClick}
      />

      {/* Modal Pencarian & Generator Gambar Edukasi Multi-Sumber */}
      <ImageSelectorModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onSelectImage={(url, caption) => {
          setQImageUrl(url);
          if (caption) setQImageCaption(caption);
          showToast('🎨 Ilustrasi edukasi berhasil dipasang ke soal!');
        }}
        initialCaption={qImageCaption}
        initialPrompt={qImagePrompt}
        questionText={qText}
        subject={subject}
        topic={title}
      />

    </div>
  );

  // Helper renderer untuk Bank Soal
  function renderBankSoalView(isAi: boolean) {
    return (
      <div className="w-full max-w-[2000px] mx-auto px-3 xs:px-4 sm:px-8 lg:px-12 space-y-5 animate-fade-in">
        {!isAddingQuestion ? (
          /* ================= 1-KOLOM DAFTAR BANK SOAL (KE BAWAH RESPONSIV) ================= */
          <div className="space-y-4 sm:space-y-5 pb-6 sm:pb-8">
            {/* Slim Control Bar Bank Soal (Compact, Informatif & Ramping - Tombol Tambah Mengandalkan FAB Melayang) */}
            <div className="flex items-center justify-between gap-2.5 sm:gap-4 px-3.5 sm:px-5 py-2.5 sm:py-3 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              {/* Sisi Kiri: Status & Counter Butir Soal Informatif */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40 shrink-0">
                  <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{questions.length} Butir Soal</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate hidden sm:inline">
                  Periksa butir pertanyaan, opsi jawaban, dan skor nilai
                </span>
              </div>

              {/* Sisi Kanan: Toggle Buka/Tutup Semua Pembahasan Edukatif */}
              {questions.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleAllExplanations}
                  className="text-[11px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-slate-50 hover:bg-blue-50/80 dark:bg-slate-800/70 dark:hover:bg-blue-950/50 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 hover:border-blue-200 dark:hover:border-blue-800/60 transition-colors inline-flex items-center gap-1.5 min-h-[38px] shrink-0 btn-press"
                  title="Buka atau sembunyikan semua pembahasan soal sekaligus"
                >
                  <span>💡 {showAllExplanations ? 'Tutup Semua Pembahasan' : 'Buka Semua Pembahasan'}</span>
                </button>
              )}
            </div>

            {/* Questions List (Mengalir ke bawah alami dan lega) */}
            <div className="space-y-4">
              {questions.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 space-y-3">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Belum ada butir soal di kuis ini.</p>
                  <button
                    type="button"
                    onClick={handleOpenNewQuestion}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-2 min-h-[44px] shadow-sm active:scale-95 btn-press"
                  >
                    <Plus className="w-4 h-4" /> Buat Butir Soal Pertama
                  </button>
                </div>
              ) : (
                questions.map((q, idx) => {
                  const isEditingThis = editingQuestionId === q.id;
                  const isExplanationOpen = Boolean(expandedExplanations[q.id]);
                  return (
                    <div
                      key={q.id}
                      id={`question-card-${q.id}`}
                      className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all ${
                        isEditingThis
                          ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/30 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                      }`}
                    >
                      {/* 1. Header Kartu: Nomor, Tipe, Poin, Durasi & Indikator */}
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="px-2.5 py-1 rounded-xl bg-blue-600 text-white font-black text-xs shadow-xs shrink-0">
                            Soal #{idx + 1}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 truncate">
                            {q.type === 'multiple_choice'
                              ? 'Pilihan Ganda'
                              : q.type === 'true_false'
                              ? 'Benar / Salah'
                              : q.type === 'short_answer'
                              ? 'Isian Singkat'
                              : q.type === 'matching_pairs'
                              ? 'Menjodohkan'
                              : 'Tebak Gambar'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50 inline-flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-400" /> {q.points || 10}p
                          </span>
                          {q.customDurationSec && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {q.customDurationSec}s
                            </span>
                          )}
                          {q.imageUrl && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/50 inline-flex items-center gap-1 shrink-0" title="Soal memiliki gambar ilustrasi">
                              <ImageIcon className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 2. Teks Pertanyaan Soal (Utuh, Keterbacaan Tinggi, Bebas Truncate Kasar) */}
                      <div className="pt-3 pb-2">
                        <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed select-text">
                          {q.text}
                        </p>
                      </div>

                      {/* 2b. Pratinjau Ilustrasi Gambar jika ada */}
                      {q.imageUrl && (
                        <div className="my-2 flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                          <img
                            src={q.imageUrl}
                            alt={q.imageCaption || 'Ilustrasi Soal'}
                            className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-xl bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {q.imageCaption || 'Ilustrasi Pendukung'}
                            </p>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              Gambar ini akan ditampilkan kepada siswa saat menjawab
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 3. Pratinjau Pilihan Jawaban & Kunci Benar */}
                      <div className="mt-2 space-y-1.5">
                        {q.type === 'multiple_choice' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                            {q.options.map((opt, oIdx) => {
                              const isCorrect = q.correctIndex === oIdx;
                              const letter = String.fromCharCode(65 + oIdx);
                              return (
                                <div
                                  key={oIdx}
                                  className={`px-3 py-2.5 rounded-xl text-xs flex items-start gap-2.5 border transition-all ${
                                    isCorrect
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/80 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs'
                                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  <span
                                    className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                      isCorrect
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}
                                  >
                                    {isCorrect ? '✓' : letter}
                                  </span>
                                  <span className="leading-snug break-words flex-1">
                                    {opt}
                                    {isCorrect && (
                                      <span className="ml-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wide">
                                        (Kunci)
                                      </span>
                                    )}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {q.type === 'true_false' && (
                          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                            {['Benar', 'Salah'].map((label, oIdx) => {
                              const isCorrect = q.correctIndex === oIdx;
                              return (
                                <div
                                  key={label}
                                  className={`px-3 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border font-bold ${
                                    isCorrect
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 opacity-60'
                                  }`}
                                >
                                  {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                                  <span>{label}</span>
                                  {isCorrect && <span className="text-[10px] text-emerald-600 font-normal">(Kunci)</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {q.type === 'short_answer' && (
                          <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs">
                            <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Kunci Jawaban Diterima:
                            </div>
                            <p className="font-semibold text-emerald-900 dark:text-emerald-200 pl-5">
                              {q.acceptableAnswers && q.acceptableAnswers.length > 0
                                ? q.acceptableAnswers.join(', ')
                                : q.options[0] || '-'}
                            </p>
                          </div>
                        )}

                        {q.type === 'matching_pairs' && q.matchingPairs && (
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                              Pasangan Kartu Menjodohkan:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                              {q.matchingPairs.map((pair, pIdx) => (
                                <div key={pIdx} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 text-[11px]">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{pair.left}</span>
                                  <span className="text-blue-500 font-bold">➔</span>
                                  <span className="font-bold text-emerald-700 dark:text-emerald-300">{pair.right}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 4. Pembahasan Edukatif (Buka / Tutup Accordion) */}
                      {q.explanation && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => toggleExplanation(q.id)}
                            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100/60 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            <span>💡 {isExplanationOpen ? 'Sembunyikan Pembahasan' : 'Lihat Pembahasan Edukatif'}</span>
                            {isExplanationOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          {isExplanationOpen && (
                            <div className="mt-1.5 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/25 border border-blue-100 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed animate-fade-in">
                              <span className="font-bold text-blue-800 dark:text-blue-300 block mb-0.5">Penjelasan Konsep:</span>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 5. Ergonomic Action Footer: 1-Row Compact & Balanced (≥ 44×44 px) */}
                      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5 sm:gap-2">
                        {/* Left: Reordering & Utilities (Touch Targets >= 44x44px) */}
                        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200/60 dark:border-slate-700/60">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveQuestion(idx, 'up')}
                              className="w-10 sm:w-11 h-10 sm:h-11 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                              title="Pindahkan Soal ke Atas"
                              aria-label="Pindahkan Soal ke Atas"
                            >
                              <ChevronUp className="w-5 h-5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === questions.length - 1}
                              onClick={() => handleMoveQuestion(idx, 'down')}
                              className="w-10 sm:w-11 h-10 sm:h-11 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                              title="Pindahkan Soal ke Bawah"
                              aria-label="Pindahkan Soal ke Bawah"
                            >
                              <ChevronDown className="w-5 h-5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDuplicateQuestion(q)}
                            className="w-10 sm:w-auto h-11 px-0 sm:px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95 border border-slate-200/60 dark:border-slate-700/60 shrink-0"
                            title="Duplikasi Butir Soal Ini"
                            aria-label="Duplikasi Soal"
                          >
                            <Copy className="w-4 h-4" />
                            <span className="hidden sm:inline">Salin</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="w-10 sm:w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/50 flex items-center justify-center transition-colors active:scale-95 shrink-0"
                            title="Hapus Butir Soal Ini"
                            aria-label="Hapus Soal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Right: Primary Action (Flex-1 on Mobile, fills remaining space with prominent target) */}
                        <button
                          type="button"
                          onClick={() => handleStartEditQuestion(q)}
                          className="flex-1 sm:flex-initial h-11 px-3 sm:px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs hover:shadow transition-all active:scale-95 min-w-0 shrink-0"
                        >
                          <Edit3 className="w-4 h-4 shrink-0" />
                          <span className="truncate">Edit Soal</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Quick Add Question Button below question cards */}
              {questions.length > 0 && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleOpenNewQuestion}
                    className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white/60 dark:bg-slate-900/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all min-h-[48px] active:scale-99 shadow-2xs group"
                  >
                    <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors stroke-[2.5]" />
                    <span>Tambah Butir Soal Baru</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Bar: Bank Soal Navigation */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800 gap-3">
              <button
                type="button"
                onClick={handleSaveDraftManual}
                className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 min-h-[44px] flex items-center gap-2 transition-colors btn-press shadow-2xs"
                title="Simpan draf kuis untuk dilanjutkan nanti"
              >
                <Save className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Simpan Draf</span>
              </button>

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
                className="px-5 sm:px-6 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm flex items-center gap-2 min-h-[44px] btn-press transition-all"
              >
                <span>{isAi ? 'Lanjut ke Pengaturan Kuis' : `Lihat Pratinjau (${questions.length} Soal)`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* ================= MODE EDITOR SOAL TERFOKUS ================= */
          (() => {
            const editingIndex = editingQuestionId ? questions.findIndex((q) => q.id === editingQuestionId) : -1;
            const questionNumber = editingIndex !== -1 ? editingIndex + 1 : questions.length + 1;

            return (
              <form onSubmit={(e) => handleSaveQuestion(e, 'finish')} className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 sm:space-y-5 animate-fade-in">
                {/* Header Editor: Navigasi Satu Arah & Konteks Butir Soal */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 min-h-[44px] transition-colors btn-press shrink-0"
                      title="Kembali ke Bank Soal"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Kembali</span>
                    </button>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-xs shrink-0">
                        <Edit3 className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                          {editingQuestionId ? `Edit Soal #${questionNumber}` : 'Tambah Soal Baru'}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 shrink-0">
                          {editingQuestionId && editingIndex !== -1
                            ? `${questionNumber} dari ${questions.length} Soal`
                            : `Butir Soal #${questionNumber}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tipe Soal & Bobot Poin (Proporsional & Rapi) */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tipe Soal
                    </label>
                    <select
                      value={qType}
                      onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none min-h-[44px]"
                    >
                      <option value="multiple_choice">Pilihan Ganda (4 Opsi)</option>
                      <option value="true_false">Benar / Salah</option>
                      <option value="short_answer">Isian Singkat</option>
                      <option value="matching_pairs">Menjodohkan Kartu</option>
                    </select>
                  </div>

                  <div className="w-full sm:w-40 shrink-0">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Bobot Poin
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={qPoints}
                        onChange={(e) => setQPoints(parseInt(e.target.value) || 10)}
                        className="w-full pl-3.5 pr-14 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none min-h-[44px]"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                        Poin
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pertanyaan Soal */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Pertanyaan Soal <span className="text-rose-500">*</span>
                  </label>
                  <ResizableTextarea
                    rows={3}
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    placeholder="Tuliskan pertanyaan soal di sini..."
                    minHeight={75}
                    maxHeight={350}
                    className="min-h-[85px]"
                  />
                </div>

                {/* Ilustrasi Gambar (Opsional - Terpadu ke Modal Gambar) */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                      <span>Ilustrasi Gambar (Opsional)</span>
                    </span>
                    {qImageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setQImageUrl(undefined);
                          setQImageCaption('');
                          setQImagePrompt('');
                        }}
                        className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline min-h-[36px] px-2 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Gambar</span>
                      </button>
                    )}
                  </div>

                  {qImageUrl ? (
                    <div className="flex items-start gap-3.5">
                      <div className="relative group w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 flex items-center justify-center shadow-xs">
                        <img
                          src={qImageUrl}
                          alt="Ilustrasi Soal"
                          className="w-full h-full object-contain p-1"
                        />
                        <button
                          type="button"
                          onClick={() => setIsImageModalOpen(true)}
                          className="absolute inset-0 bg-black/60 text-white text-[11px] font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          title="Klik untuk mengganti gambar"
                        >
                          Ganti
                        </button>
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <input
                          type="text"
                          value={qImageCaption}
                          onChange={(e) => setQImageCaption(e.target.value)}
                          placeholder="Keterangan gambar (opsional)"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium min-h-[40px] focus:border-blue-500 focus:outline-none"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsImageModalOpen(true)}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 text-xs font-bold inline-flex items-center gap-1.5 min-h-[38px] btn-press"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Ganti Gambar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={() => setIsImageModalOpen(true)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-50/50 dark:hover:bg-slate-750 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center justify-center gap-2 min-h-[44px] btn-press transition-all group"
                      >
                        <Sparkles className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                        <span>Pilih / Buat Ilustrasi (AI, Ensiklopedia, Unggah)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Form Input Opsi berdasarkan Tipe */}
                {qType === 'multiple_choice' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Pilihan Jawaban (Pilih Kunci Benar)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {qOptions.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-xl border flex items-center gap-2.5 transition-colors ${
                            qCorrectIndex === oIdx
                              ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setQCorrectIndex(oIdx)}
                            className={`w-10 h-10 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 min-h-[40px] min-w-[40px] transition-all btn-press ${
                              qCorrectIndex === oIdx
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                            title={qCorrectIndex === oIdx ? 'Kunci Jawaban Benar' : 'Pilih sebagai Kunci Jawaban'}
                          >
                            {qCorrectIndex === oIdx ? '✓' : String.fromCharCode(65 + oIdx)}
                          </button>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(oIdx, e.target.value)}
                            placeholder={`Pilihan ${String.fromCharCode(65 + oIdx)}`}
                            className="flex-1 bg-transparent text-xs font-medium text-slate-900 dark:text-white focus:outline-none min-h-[40px]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {qType === 'true_false' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Kunci Jawaban
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Benar', 'Salah'].map((val, oIdx) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setQCorrectIndex(oIdx)}
                          className={`py-3 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 min-h-[44px] transition-all btn-press ${
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
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Kunci Jawaban Isian Singkat
                      </label>
                      <span className="text-[11px] text-slate-400">Pisahkan dengan koma jika ada variasi jawaban</span>
                    </div>
                    <input
                      type="text"
                      value={qAcceptableAnswers}
                      onChange={(e) => setQAcceptableAnswers(e.target.value)}
                      placeholder="Contoh: fotosintesis, fotosintesa"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none min-h-[44px]"
                    />
                  </div>
                )}

                {qType === 'matching_pairs' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Pasangan Kartu Menjodohkan
                      </label>
                      <button
                        type="button"
                        onClick={handleAddMatchingPair}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline min-h-[36px] flex items-center"
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
                            className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white min-h-[40px]"
                          />
                          <span className="text-slate-400 font-bold">➔</span>
                          <input
                            type="text"
                            value={pair.right}
                            onChange={(e) => handleMatchingPairChange(idx, 'right', e.target.value)}
                            placeholder={`Kartu Kanan #${idx + 1}`}
                            className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white min-h-[40px]"
                          />
                          {qMatchingPairs.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMatchingPair(idx)}
                              className="w-10 h-10 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl flex items-center justify-center shrink-0 min-h-[40px] min-w-[40px]"
                              title="Hapus Pasangan Kartu Ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pembahasan */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Pembahasan Jawaban (Opsional)
                  </label>
                  <ResizableTextarea
                    value={qExplanation}
                    onChange={(e) => setQExplanation(e.target.value)}
                    rows={2}
                    placeholder="Tuliskan pembahasan atau konsep di balik jawaban yang benar..."
                    minHeight={65}
                    maxHeight={300}
                    className="min-h-[75px]"
                  />
                </div>

                {/* Tombol Simpan Butir Soal (Sesuai Konteks Edit vs Tambah) */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] transition-colors"
                  >
                    Batal
                  </button>
                  {editingQuestionId ? (
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow btn-press min-h-[44px] transition-all"
                    >
                      Simpan Perubahan
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={(e) => handleSaveQuestion(e, 'continue')}
                        className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 min-h-[44px] transition-colors"
                      >
                        Simpan & Tambah Lagi
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow btn-press min-h-[44px] transition-all"
                      >
                        Simpan Soal
                      </button>
                    </>
                  )}
                </div>

              </form>
            );
          })()
        )}
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
                        Kelas {grade} {educationLevel === 'SMA' ? 'SMA / SMK' : educationLevel === 'SMP' ? 'SMP' : 'SD'}
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
