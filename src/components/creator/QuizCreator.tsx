import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  EyeOff, 
  Layers, 
  RotateCcw, 
  Edit3, 
  Copy, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  Sparkles, 
  Star, 
  ArrowRight,
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Scale
} from 'lucide-react';
import { AiQuestionModal } from './AiQuestionModal';
import { ImageSelectorModal } from './ImageSelectorModal';
import { AiGeneratorStep, clearAiGeneratorDraft } from './AiGeneratorStep';
import { InfoKuisStep } from './InfoKuisStep';
import { QuestionTypeDropdown } from './QuestionTypeDropdown';
import { TrueFalsePresetDropdown } from './TrueFalsePresetDropdown';
import { ResizableTextarea } from '../common/ResizableTextarea';
import { AutoResizeTextarea } from '../common/AutoResizeTextarea';

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

const PAIR_PLACEHOLDERS = [
  { left: 'Contoh: Indonesia', right: 'Contoh: Ibu Kota Nusantara' },
  { left: 'Contoh: Fotosintesis', right: 'Contoh: Memasak makanan pada tumbuhan' },
  { left: 'Contoh: Oksigen', right: 'Contoh: Gas untuk bernapas' },
  { left: 'Contoh: Jantung', right: 'Contoh: Memompa darah ke seluruh tubuh' },
  { left: 'Contoh: Herbivora', right: 'Contoh: Hewan pemakan tumbuhan' },
  { left: 'Contoh: Metamorfosis', right: 'Contoh: Perubahan bentuk tubuh' },
];

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
    qDistractors?: string[];
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
  const [isCustomTrueFalse, setIsCustomTrueFalse] = useState<boolean>(() => {
    const opts = draft?.activeQuestionDraft?.qOptions;
    if (draft?.activeQuestionDraft?.qType === 'true_false' && opts && opts.length >= 2) {
      const isPreset = [
        { opt0: 'Benar', opt1: 'Salah' },
        { opt0: 'Sesuai', opt1: 'Tidak Sesuai' },
        { opt0: 'Ya', opt1: 'Tidak' },
        { opt0: 'Fakta', opt1: 'Opini' },
        { opt0: 'Setuju', opt1: 'Tidak Setuju' },
      ].some(
        (p) =>
          (opts[0] || '').trim().toLowerCase() === p.opt0.toLowerCase() &&
          (opts[1] || '').trim().toLowerCase() === p.opt1.toLowerCase()
      );
      return !isPreset;
    }
    return false;
  });
  const [qExplanation, setQExplanation] = useState(() => draft?.activeQuestionDraft?.qExplanation ?? '');
  const [qAcceptableAnswers, setQAcceptableAnswers] = useState(() => draft?.activeQuestionDraft?.qAcceptableAnswers ?? '');
  const [qMatchingPairs, setQMatchingPairs] = useState<{ left: string; right: string }[]>(
    () => draft?.activeQuestionDraft?.qMatchingPairs ?? [
      { left: '', right: '' },
      { left: '', right: '' },
      { left: '', right: '' },
    ]
  );
  const [qDistractors, setQDistractors] = useState<string[]>(
    () => draft?.activeQuestionDraft?.qDistractors ?? []
  );
  const [qPoints, setQPoints] = useState<number>(() => draft?.activeQuestionDraft?.qPoints ?? 10);
  const [qCustomDurationSec, setQCustomDurationSec] = useState<string>(() => draft?.activeQuestionDraft?.qCustomDurationSec ?? '');
  const [isAddingQuestion, setIsAddingQuestion] = useState(() => draft?.activeQuestionDraft?.isAddingQuestion ?? false);
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});
  const [showAllExplanations, setShowAllExplanations] = useState(false);
  const [showFloatingActions, setShowFloatingActions] = useState(true);
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
  const [showRacikUlangConfirm, setShowRacikUlangConfirm] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{ type: 'prev_question' } | { type: 'next_question' } | { type: 'cancel_edit' } | null>(null);

  // Akumulasi Bobot Poin & Status Timer
  const totalQuizPoints = useMemo(() => {
    return questions.reduce((sum, q) => sum + (q.points || 10), 0);
  }, [questions]);

  const customDurationQuestionsCount = useMemo(() => {
    return questions.filter((q) => Boolean(q.customDurationSec && q.customDurationSec > 0)).length;
  }, [questions]);

  // Estimasi total durasi pengerjaan kuis
  const totalEstimatedSeconds = useMemo(() => {
    return questions.reduce((sum, q) => {
      const dur = q.customDurationSec ? parseInt(String(q.customDurationSec), 10) : durationPerQuestionSec;
      return sum + (isNaN(dur) || dur <= 0 ? durationPerQuestionSec : dur);
    }, 0);
  }, [questions, durationPerQuestionSec]);

  const formattedEstimatedDuration = useMemo(() => {
    if (totalEstimatedSeconds <= 0) return '0 dtk';
    if (totalEstimatedSeconds < 60) return `${totalEstimatedSeconds} dtk`;
    const mins = Math.floor(totalEstimatedSeconds / 60);
    const secs = totalEstimatedSeconds % 60;
    if (secs === 0) return `${mins} mnt`;
    return `${mins}m ${secs}s`;
  }, [totalEstimatedSeconds]);

  // Proyeksi akumulasi total poin saat mengedit butir soal aktif
  const otherQuestionsPoints = useMemo(() => {
    return questions
      .filter((q) => q.id !== editingQuestionId)
      .reduce((sum, q) => sum + (q.points || 10), 0);
  }, [questions, editingQuestionId]);

  const projectedTotalPoints = otherQuestionsPoints + (Number(qPoints) || 0);

  // Deteksi akurat apakah butir soal yang sedang aktif diedit / dibuat mengalami modifikasi
  const isCurrentQuestionDirty = useMemo(() => {
    if (!isAddingQuestion && !editingQuestionId) return false;

    if (editingQuestionId) {
      const orig = questions.find((q) => q.id === editingQuestionId);
      if (!orig) return false;

      if (qText.trim() !== orig.text.trim()) return true;
      if (qType !== orig.type) return true;
      if (Number(qPoints) !== (orig.points || 10)) return true;
      const origDurStr = orig.customDurationSec ? String(orig.customDurationSec) : '';
      if (qCustomDurationSec.trim() !== origDurStr) return true;
      if ((qExplanation.trim() || '') !== (orig.explanation?.trim() || '')) return true;
      if (qImageUrl !== orig.imageUrl) return true;
      if ((qImageCaption.trim() || '') !== (orig.imageCaption?.trim() || '')) return true;

      if (qType === 'multiple_choice' || qType === 'true_false') {
        if (qCorrectIndex !== orig.correctIndex) return true;
        if (qOptions.length !== orig.options.length) return true;
        if (qOptions.some((opt, idx) => opt.trim() !== (orig.options[idx] || '').trim())) return true;
      } else if (qType === 'short_answer') {
        const origAcceptableStr = orig.acceptableAnswers ? orig.acceptableAnswers.join(', ') : (orig.options[0] || '');
        if (qAcceptableAnswers.trim() !== origAcceptableStr.trim()) return true;
      } else if (qType === 'matching_pairs') {
        const origPairs = orig.matchingPairs || [];
        if (qMatchingPairs.length !== origPairs.length) return true;
        if (qMatchingPairs.some((p, idx) => p.left.trim() !== (origPairs[idx]?.left || '').trim() || p.right.trim() !== (origPairs[idx]?.right || '').trim())) return true;
        const origDistractors = orig.distractors || [];
        if (qDistractors.length !== origDistractors.length) return true;
        if (qDistractors.some((d, idx) => d.trim() !== (origDistractors[idx] || '').trim())) return true;
      }

      return false;
    }

    // Penambahan soal baru: cek apakah pengguna sudah menginputkan konten
    if (qText.trim()) return true;
    if (qExplanation.trim()) return true;
    if (qImageUrl) return true;
    if (qType === 'multiple_choice' && qOptions.some((opt) => opt.trim())) return true;
    if (qType === 'short_answer' && qAcceptableAnswers.trim()) return true;
    if (qType === 'matching_pairs' && (qMatchingPairs.some((p) => p.left.trim() || p.right.trim()) || qDistractors.some((d) => d.trim()))) return true;
    if (qType === 'true_false' && (qCorrectIndex !== 0 || (qOptions[0] && qOptions[0] !== 'Benar') || (qOptions[1] && qOptions[1] !== 'Salah'))) return true;

    return false;
  }, [
    isAddingQuestion,
    editingQuestionId,
    questions,
    qText,
    qType,
    qPoints,
    qCustomDurationSec,
    qExplanation,
    qImageUrl,
    qImageCaption,
    qCorrectIndex,
    qOptions,
    qAcceptableAnswers,
    qMatchingPairs,
    qDistractors
  ]);

  // Aksi Bagi Rata 100 Poin Presisi
  const handleDistribute100Points = () => {
    playClick();
    if (questions.length === 0) {
      showToast('⚠️ Belum ada butir soal untuk dibagi rata.');
      return;
    }
    const n = questions.length;
    const base = Math.floor(100 / n);
    const remainder = 100 % n;
    const updated = questions.map((q, idx) => ({
      ...q,
      points: idx < remainder ? base + 1 : base,
    }));
    setQuestions(updated);
    showToast(`⚖️ Berhasil membagi rata 100 poin untuk ${n} butir soal!`);
  };

  // Aksi Sinkronisasi Seluruh Soal Mengikuti Waktu Standar Kuis
  const handleResetAllCustomDuration = () => {
    playClick();
    const updated = questions.map((q) => ({
      ...q,
      customDurationSec: undefined,
    }));
    setQuestions(updated);
    showToast(`⏱️ Seluruh soal kini mengikuti waktu standar kuis (${durationPerQuestionSec} detik).`);
  };

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
      qMatchingPairs.some((p) => p.left.trim() || p.right.trim()) ||
      qDistractors.some((d) => d.trim())
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
          qDistractors,
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
    qDistractors,
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
  useBackHandler('creator-unsaved-modal', 82, () => {
    if (showUnsavedConfirm) {
      handleCancelConfirmation();
      return true;
    }
    return false;
  }, showUnsavedConfirm);

  useBackHandler('creator-step-preview', 40, () => {
    if (!aiFunnelActive && currentStep === 3) {
      setCurrentStep(2);
      return true;
    }
    return false;
  }, !aiFunnelActive && currentStep === 3);

  useBackHandler('creator-step-2', 50, () => {
    if (!aiFunnelActive && currentStep === 2) {
      if (editingQuestionId || isAddingQuestion) {
        handleCancelEdit();
        return true;
      }
      setCurrentStep(1);
      return true;
    }
    return false;
  }, !aiFunnelActive && currentStep === 2);

  useBackHandler('creator-step-1', 55, () => {
    if (!aiFunnelActive && currentStep === 1) {
      if (isAiMode && (editingQuestionId || isAddingQuestion)) {
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
    setQDistractors([]);
    setQPoints(10);
    setQCustomDurationSec('');
    if (targetType === 'true_false') {
      setQOptions(['Benar', 'Salah']);
      setIsCustomTrueFalse(false);
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

  const handleAddDistractor = () => {
    if (qDistractors.length >= 2) {
      showToast('Maksimal 2 kartu pengecoh agar tidak membingungkan siswa.');
      return;
    }
    setQDistractors((prev) => [...prev, '']);
  };

  const handleRemoveDistractor = (index: number) => {
    setQDistractors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDistractorChange = (index: number, val: string) => {
    setQDistractors((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleTypeChange = (type: QuestionType) => {
    setQType(type);
    if (type === 'true_false') {
      setQOptions(['Benar', 'Salah']);
      setQCorrectIndex(0);
      setIsCustomTrueFalse(false);
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
      setQDistractors(q.distractors || []);
      setQOptions([]);
      setQCorrectIndex(0);
    } else if (q.type === 'short_answer') {
      setQAcceptableAnswers(q.acceptableAnswers ? q.acceptableAnswers.join(', ') : (q.options[0] || ''));
      setQOptions([q.options[0] || '']);
      setQCorrectIndex(0);
    } else if (q.type === 'true_false') {
      const opt0 = q.options && q.options[0] ? q.options[0] : 'Benar';
      const opt1 = q.options && q.options[1] ? q.options[1] : 'Salah';
      setQOptions([opt0, opt1]);
      setQCorrectIndex(q.correctIndex === 1 ? 1 : 0);
      const isPreset = [
        { opt0: 'Benar', opt1: 'Salah' },
        { opt0: 'Sesuai', opt1: 'Tidak Sesuai' },
        { opt0: 'Ya', opt1: 'Tidak' },
        { opt0: 'Fakta', opt1: 'Opini' },
        { opt0: 'Setuju', opt1: 'Tidak Setuju' },
      ].some(
        (p) =>
          opt0.trim().toLowerCase() === p.opt0.toLowerCase() &&
          opt1.trim().toLowerCase() === p.opt1.toLowerCase()
      );
      setIsCustomTrueFalse(!isPreset);
    } else {
      setQOptions([...q.options]);
      setQCorrectIndex(q.correctIndex);
    }

    setIsAddingQuestion(true);
  };

  const handleCancelEditImmediate = () => {
    playClick();
    setEditingQuestionId(null);
    setIsAddingQuestion(false);
    resetFormFields();
  };

  const handleCancelEdit = () => {
    if (isCurrentQuestionDirty) {
      playClick();
      setPendingNavigation({ type: 'cancel_edit' });
      setShowUnsavedConfirm(true);
    } else {
      handleCancelEditImmediate();
    }
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
      handleCancelEditImmediate();
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

  const executeNavigation = (
    nav: { type: 'prev_question' } | { type: 'next_question' } | { type: 'cancel_edit' },
    questionsList: QuizQuestion[] = questions
  ) => {
    if (nav.type === 'cancel_edit') {
      handleCancelEditImmediate();
      return;
    }

    if (!editingQuestionId) return;
    const currentIdx = questionsList.findIndex((q) => q.id === editingQuestionId);
    if (currentIdx === -1) return;

    const targetIndex = nav.type === 'prev_question' ? currentIdx - 1 : currentIdx + 1;
    if (targetIndex < 0 || targetIndex >= questionsList.length) return;

    playClick();
    const targetQ = questionsList[targetIndex];
    handleStartEditQuestion(targetQ);
  };

  const handleNavigateQuestion = (direction: 'prev' | 'next') => {
    if (isCurrentQuestionDirty) {
      playClick();
      setPendingNavigation({ type: direction === 'prev' ? 'prev_question' : 'next_question' });
      setShowUnsavedConfirm(true);
      return;
    }

    executeNavigation({ type: direction === 'prev' ? 'prev_question' : 'next_question' });
  };

  const handleAddOption = () => {
    if (qOptions.length >= 5) return;
    playClick();
    setQOptions((prev) => [...prev, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (qOptions.length <= 2) return;
    playClick();
    const updated = qOptions.filter((_, i) => i !== index);
    setQOptions(updated);
    if (qCorrectIndex === index) {
      setQCorrectIndex(0);
    } else if (qCorrectIndex > index) {
      setQCorrectIndex((prev) => prev - 1);
    }
  };

  const validateAndBuildCurrentQuestion = (): QuizQuestion | null => {
    if (!qText.trim()) {
      showToast('Pertanyaan soal tidak boleh kosong.');
      return null;
    }

    let finalOptions = qOptions;
    let finalAcceptable: string[] | undefined = undefined;
    let finalPairs = undefined;

    let finalDistractors: string[] | undefined = undefined;

    if (qType === 'matching_pairs') {
      const validPairs = qMatchingPairs.filter((p) => p.left.trim() && p.right.trim());
      if (validPairs.length < 2) {
        showToast('Minimal harus mengisi 2 pasangan kartu yang lengkap (kiri dan kanan).');
        return null;
      }
      finalPairs = validPairs.map((p) => ({ left: p.left.trim(), right: p.right.trim() }));
      finalOptions = finalPairs.map((p) => `${p.left} -> ${p.right}`);
      const validDistractors = qDistractors.map((d) => d.trim()).filter(Boolean);
      if (validDistractors.length > 0) {
        finalDistractors = validDistractors;
      }
    } else if (qType === 'short_answer') {
      const parts = qAcceptableAnswers.split(',').map((s) => s.trim()).filter(Boolean);
      if (parts.length === 0) {
        showToast('Mohon masukkan minimal satu kata kunci jawaban.');
        return null;
      }
      finalAcceptable = parts;
    } else if (qType === 'true_false') {
      const opt0 = (qOptions[0] || '').trim();
      const opt1 = (qOptions[1] || '').trim();
      if (!opt0 || !opt1) {
        showToast('Kedua pilihan Benar / Salah tidak boleh kosong.');
        return null;
      }
      finalOptions = [opt0, opt1];
    } else if (qType === 'multiple_choice') {
      const emptyOptIndex = qOptions.findIndex((opt) => !opt.trim());
      if (emptyOptIndex !== -1) {
        showToast(`Pilihan ${String.fromCharCode(65 + emptyOptIndex)} tidak boleh kosong.`);
        return null;
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
      distractors: finalDistractors,
      points: Number(qPoints) || 10,
      customDurationSec: !isNaN(durationNum) && durationNum > 0 ? durationNum : undefined,
    };

    return questionObj;
  };

  const handleSaveAndProceed = () => {
    playClick();
    const questionObj = validateAndBuildCurrentQuestion();
    if (!questionObj) {
      setShowUnsavedConfirm(false);
      return;
    }

    let updatedQuestions: QuizQuestion[];
    if (editingQuestionId) {
      updatedQuestions = questions.map((q) => (q.id === editingQuestionId ? questionObj : q));
      setQuestions(updatedQuestions);
      showToast('💾 Perubahan butir soal berhasil disimpan!');
    } else {
      updatedQuestions = [...questions, questionObj];
      setQuestions(updatedQuestions);
      showToast('💾 Butir soal baru berhasil disimpan!');
    }

    const nav = pendingNavigation;
    setShowUnsavedConfirm(false);
    setPendingNavigation(null);

    if (nav) {
      executeNavigation(nav, updatedQuestions);
    }
  };

  const handleDiscardAndProceed = () => {
    playClick();
    showToast('Perubahan butir soal dibuang.');
    const nav = pendingNavigation;
    setShowUnsavedConfirm(false);
    setPendingNavigation(null);

    if (nav) {
      executeNavigation(nav, questions);
    }
  };

  const handleCancelConfirmation = () => {
    playClick();
    setShowUnsavedConfirm(false);
    setPendingNavigation(null);
  };

  const handleSaveQuestion = (e: React.FormEvent, afterSave: 'continue' | 'finish' = 'continue') => {
    e.preventDefault();
    playClick();

    const questionObj = validateAndBuildCurrentQuestion();
    if (!questionObj) return;

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
      handleCancelEditImmediate();
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

  const isQuestionEditorActive = !aiFunnelActive && isAddingQuestion;
  const currentEditingIndex = editingQuestionId ? questions.findIndex((q) => q.id === editingQuestionId) : -1;
  const currentQuestionNumber = currentEditingIndex !== -1 ? currentEditingIndex + 1 : questions.length + 1;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-200">
      {/* App Header (Sticky Top Bar & Action Hub) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-[2000px] mx-auto px-3 xs:px-4 sm:px-8 lg:px-12 h-14 sm:h-16 flex items-center justify-between gap-3">
          
          {/* Header Left: Back Button + Title */}
          {isQuestionEditorActive ? (
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors btn-press min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                title="Batal & Kembali ke Bank Soal"
                aria-label="Kembali ke Bank Soal"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="hidden xs:flex w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 items-center justify-center font-bold shadow-xs shrink-0">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                  {editingQuestionId ? (
                    <>
                      <span>Edit </span>
                      <span className="hidden sm:inline">Butir </span>
                      <span>Soal</span>
                    </>
                  ) : (
                    <>
                      <span>Tambah </span>
                      <span className="hidden sm:inline">Butir </span>
                      <span>Soal</span>
                    </>
                  )}
                </h1>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={handleHeaderBack}
                className="p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors btn-press min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                title={aiFunnelActive && aiFunnelStage === 1 ? 'Ganti Metode Pembuatan Kuis' : 'Kembali'}
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
          )}

          {/* Header Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {isQuestionEditorActive ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="hidden sm:inline-flex px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] items-center"
                >
                  Batal
                </button>
                {editingQuestionId ? (
                  <button
                    type="button"
                    onClick={(e) => handleSaveQuestion(e, 'finish')}
                    className="px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow btn-press min-h-[44px] flex items-center gap-1.5 transition-all"
                  >
                    <Save className="w-4 h-4 hidden xs:inline" />
                    <span>Simpan</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={(e) => handleSaveQuestion(e, 'continue')}
                      className="hidden sm:inline-flex px-3.5 py-2 rounded-xl font-bold text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 min-h-[44px] items-center transition-colors"
                    >
                      Simpan & Tambah Lagi
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleSaveQuestion(e, 'finish')}
                      className="px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow btn-press min-h-[44px] flex items-center gap-1.5 transition-all"
                    >
                      <Plus className="w-4 h-4 hidden xs:inline" />
                      <span>Simpan Soal</span>
                    </button>
                  </>
                )}
                <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* Sub-Panel Ramping: Konteks & Navigasi Butir Soal (Tier 2) */}
        {isQuestionEditorActive && (
          <div className="border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/95 dark:bg-slate-850/95 backdrop-blur-xs">
            <div className="max-w-[2000px] mx-auto px-3 xs:px-4 sm:px-8 lg:px-12 py-2 flex items-center justify-between gap-2">
              
              {/* Sisi Kiri: Status & Nomor Butir Soal */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black bg-blue-600 text-white shadow-xs shrink-0">
                  Soal #{currentQuestionNumber}
                </span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">
                  {editingQuestionId && currentEditingIndex !== -1
                    ? `dari ${questions.length} butir`
                    : 'Butir soal baru'}
                </span>
              </div>

              {/* Sisi Kanan: Pager Navigasi Antar-Soal */}
              {editingQuestionId && questions.length > 1 && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleNavigateQuestion('prev')}
                    disabled={currentEditingIndex <= 0}
                    className="px-2.5 sm:px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs active:scale-95 btn-press min-h-[44px] min-w-[44px]"
                    title="Beralih ke Soal Sebelumnya (Konfirmasi jika ada perubahan)"
                    aria-label="Soal Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span className="hidden sm:inline">Sebelumnya</span>
                  </button>

                  <div className="px-2.5 py-1 text-xs font-extrabold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0 min-h-[44px] flex items-center justify-center">
                    {currentQuestionNumber} / {questions.length}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleNavigateQuestion('next')}
                    disabled={currentEditingIndex >= questions.length - 1}
                    className="px-2.5 sm:px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs active:scale-95 btn-press min-h-[44px] min-w-[44px]"
                    title="Beralih ke Soal Berikutnya (Konfirmasi jika ada perubahan)"
                    aria-label="Soal Berikutnya"
                  >
                    <span className="hidden sm:inline">Berikutnya</span>
                    <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

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
        ) : !isQuestionEditorActive ? (
          /* 3 Step Navigation Tabs (HANYA MUNCUL DI STUDIO KUIS UTAMA SAAT TIDAK SEDANG EDIT SOAL) */
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
        ) : null}
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

      {/* Modal Konfirmasi Perubahan Soal Belum Disimpan */}
      {showUnsavedConfirm && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-modal-title"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 id="unsaved-modal-title" className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  Simpan Perubahan Soal?
                </h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                  {editingQuestionId 
                    ? `Perubahan pada Butir Soal #${currentQuestionNumber} belum disimpan`
                    : 'Butir soal baru belum disimpan ke bank soal'}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5">
              <p>
                Anda terdeteksi telah memodifikasi butir soal ini. Simpan perubahan sebelum {
                  pendingNavigation?.type === 'prev_question'
                    ? 'berpindah ke Soal Sebelumnya'
                    : pendingNavigation?.type === 'next_question'
                    ? 'berpindah ke Soal Berikutnya'
                    : 'kembali ke Bank Soal'
                }, buang perubahan untuk mengembalikan data awal, atau tetap lanjutkan mengedit.
              </p>
            </div>

            {/* Action Buttons: Stacked on mobile for easy reach, touch-friendly min-h-[44px] */}
            <div className="flex flex-col sm:flex-row-reverse items-stretch sm:items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* Primary: Simpan & Lanjutkan */}
              <button
                type="button"
                onClick={handleSaveAndProceed}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 min-h-[44px] btn-press order-1 sm:order-none"
              >
                <Save className="w-4 h-4 shrink-0" />
                <span>Simpan & Lanjutkan</span>
              </button>

              {/* Secondary Warning: Buang Perubahan */}
              <button
                type="button"
                onClick={handleDiscardAndProceed}
                className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/50 transition-colors flex items-center justify-center gap-2 min-h-[44px] btn-press order-2 sm:order-none"
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                <span>Buang Perubahan</span>
              </button>

              {/* Tertiary: Batal (Tetap Mengedit) */}
              <button
                type="button"
                onClick={handleCancelConfirmation}
                className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center min-h-[44px] order-3 sm:order-none"
              >
                Tetap Mengedit
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
                customDurationCount={customDurationQuestionsCount}
                onResetAllCustomDuration={handleResetAllCustomDuration}
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
                customDurationCount={customDurationQuestionsCount}
                onResetAllCustomDuration={handleResetAllCustomDuration}
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
              {/* Item 4: Ke Atas */}
              <div 
                onClick={() => {
                  setIsSpeedDialOpen(false);
                  handleScrollToTop();
                }}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 shadow-md border border-slate-200/80 dark:border-slate-700/80 whitespace-nowrap group-hover:bg-slate-50 dark:group-hover:bg-slate-750 transition-colors">
                  Ke Atas
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
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

              {/* Item 3: Pratinjau Kuis */}
              <div 
                onClick={() => {
                  playClick();
                  setIsSpeedDialOpen(false);
                  if (questions.length === 0) {
                    showToast('Tambahkan minimal 1 butir soal untuk melihat pratinjau.');
                    return;
                  }
                  setCurrentStep(3);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold text-sky-800 dark:text-sky-200 bg-white dark:bg-slate-800 shadow-md border border-sky-200/80 dark:border-sky-800/80 whitespace-nowrap group-hover:bg-sky-50 dark:group-hover:bg-slate-750 transition-colors">
                  Pratinjau Kuis
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    playClick();
                    setIsSpeedDialOpen(false);
                    if (questions.length === 0) {
                      showToast('Tambahkan minimal 1 butir soal untuk melihat pratinjau.');
                      return;
                    }
                    setCurrentStep(3);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-11 h-11 rounded-full flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-600/25 transition-all active:scale-95 btn-press min-h-[44px] min-w-[44px]"
                  title="Lihat simulasi pratinjau kuis siswa"
                  aria-label="Lihat pratinjau kuis"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>

              {/* Item 2: Racik Soal AI */}
              <div 
                onClick={() => {
                  playClick();
                  setIsSpeedDialOpen(false);
                  setIsAiModalOpen(true);
                }}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold text-purple-900 dark:text-purple-200 bg-white dark:bg-slate-800 shadow-md border border-purple-200/80 dark:border-purple-800/80 whitespace-nowrap group-hover:bg-purple-50 dark:group-hover:bg-slate-750 transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Racik Soal AI</span>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    playClick();
                    setIsSpeedDialOpen(false);
                    setIsAiModalOpen(true);
                  }}
                  className="w-11 h-11 rounded-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/25 transition-all active:scale-95 btn-press min-h-[44px] min-w-[44px]"
                  title="Racik butir soal baru dengan asisten AI"
                  aria-label="Racik Soal AI"
                >
                  <Sparkles className="w-5 h-5" />
                </button>
              </div>

              {/* Item 1: Tambah Soal Manual */}
              <div 
                onClick={() => {
                  playClick();
                  setIsSpeedDialOpen(false);
                  handleOpenNewQuestion();
                }}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold text-indigo-900 dark:text-indigo-200 bg-white dark:bg-slate-800 shadow-md border border-indigo-200/80 dark:border-indigo-800/80 whitespace-nowrap group-hover:bg-indigo-50 dark:group-hover:bg-slate-750 transition-colors">
                  Tambah Soal
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    playClick();
                    setIsSpeedDialOpen(false);
                    handleOpenNewQuestion();
                  }}
                  className="w-11 h-11 rounded-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 transition-all active:scale-95 btn-press min-h-[44px] min-w-[44px]"
                  title="Tambah Butir Soal Baru Secara Manual"
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
            {/* Grid 3 Mini Stat Cards Dashboard (Proporsional, Padat & Terstruktur) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Card 1: Jumlah Butir Soal & Toggle Pembahasan */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0 shadow-2xs">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Jumlah Soal</span>
                    {showAllExplanations && (
                      <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400">
                        Kunci Terbuka 💡
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1.5 mt-0.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                        {questions.length}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Butir
                      </span>
                    </div>

                    {/* Tombol Aksi Compact: Buka / Tutup Pembahasan */}
                    {questions.length > 0 && (
                      <button
                        type="button"
                        onClick={handleToggleAllExplanations}
                        className={`text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg border transition-all inline-flex items-center gap-1 shrink-0 btn-press min-h-[32px] shadow-2xs ${
                          showAllExplanations
                            ? 'text-blue-800 dark:text-blue-200 bg-blue-100/90 hover:bg-blue-200 dark:bg-blue-900/60 dark:hover:bg-blue-800 border-blue-300 dark:border-blue-700'
                            : 'text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300 bg-slate-100/90 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/40 border-slate-200/90 dark:border-slate-700 hover:border-blue-200'
                        }`}
                        title={showAllExplanations ? 'Tutup semua pembahasan butir soal' : 'Buka semua pembahasan butir soal'}
                        aria-label={showAllExplanations ? 'Tutup semua pembahasan' : 'Buka semua pembahasan'}
                      >
                        {showAllExplanations ? (
                          <>
                            <EyeOff className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span className="hidden md:inline">Tutup Pembahasan</span>
                            <span className="md:hidden">Tutup Bahas</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3 text-slate-500 dark:text-slate-400 shrink-0" />
                            <span className="hidden md:inline">Buka Pembahasan</span>
                            <span className="md:hidden">Buka Bahas</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 2: Total Bobot Poin & Logika Cerdas Bagi Rata */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${
                  totalQuizPoints === 100
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40'
                    : totalQuizPoints < 100
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40'
                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40'
                }`}>
                  {totalQuizPoints === 100 ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : totalQuizPoints < 100 ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <Star className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Total Bobot</span>
                    {totalQuizPoints === 100 && (
                      <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                        Pas 100 🎯
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1.5 mt-0.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                        {totalQuizPoints}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Poin
                      </span>
                    </div>

                    {/* Tombol Aksi Cerdas Kontekstual Jika Belum 100 */}
                    {questions.length > 0 && totalQuizPoints !== 100 && (
                      <button
                        type="button"
                        onClick={handleDistribute100Points}
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border transition-all inline-flex items-center gap-1 shrink-0 btn-press ${
                          totalQuizPoints < 100
                            ? 'text-amber-800 dark:text-amber-200 bg-amber-100/90 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-800 border-amber-300 dark:border-amber-700'
                            : 'text-indigo-800 dark:text-indigo-200 bg-indigo-100/90 hover:bg-indigo-200 dark:bg-indigo-900/60 dark:hover:bg-indigo-800 border-indigo-300 dark:border-indigo-700'
                        }`}
                        title="Bagi rata bobot poin ke seluruh soal agar pas 100 poin"
                      >
                        <Scale className="w-3 h-3" />
                        <span>Bagi Rata 100p</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 3: Estimasi Durasi Total Kuis */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40 flex items-center justify-center shrink-0 shadow-2xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Estimasi Waktu
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      {formattedEstimatedDuration}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                      (~{durationPerQuestionSec}s/soal)
                    </span>
                  </div>
                </div>
              </div>
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
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50 inline-flex items-center gap-1" title="Bobot nilai butir soal">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-400" /> {q.points || 10}p
                          </span>
                          {q.customDurationSec ? (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 inline-flex items-center gap-1" title="Durasi kustom khusus butir soal ini">
                              <Clock className="w-3 h-3" /> {q.customDurationSec}s <span className="text-[9px] opacity-75">(Khusus)</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/50 inline-flex items-center gap-1" title="Mengikuti durasi standar kuis">
                              <Clock className="w-3 h-3 opacity-60" /> {durationPerQuestionSec}s <span className="text-[9px] opacity-75">(Kuis)</span>
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
                            {(q.options && q.options.length >= 2 ? q.options : ['Benar', 'Salah']).map((label, oIdx) => {
                              const isCorrect = q.correctIndex === oIdx;
                              return (
                                <div
                                  key={`${label}-${oIdx}`}
                                  className={`px-3 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border font-bold ${
                                    isCorrect
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 opacity-60'
                                  }`}
                                >
                                  {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                                  <span className="truncate">{label}</span>
                                  {isCorrect && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal shrink-0">(Kunci)</span>}
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
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-750 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                                Pasangan Kartu Menjodohkan ({q.matchingPairs.length} Pasang):
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                              {q.matchingPairs.map((pair, pIdx) => (
                                <div key={pIdx} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 text-[11px]">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 min-w-0 break-words flex-1">{pair.left}</span>
                                  <span className="text-purple-600 dark:text-purple-400 font-bold px-1 shrink-0">↔</span>
                                  <span className="font-bold text-emerald-700 dark:text-emerald-300 min-w-0 break-words flex-1 text-right">{pair.right}</span>
                                </div>
                              ))}
                            </div>
                            {q.distractors && q.distractors.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">Pengecoh Sisi Kanan:</span>
                                {q.distractors.map((d, dIdx) => (
                                  <span key={dIdx} className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 text-[10px] font-medium text-amber-800 dark:text-amber-300">
                                    {d}
                                  </span>
                                ))}
                              </div>
                            )}
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
          <form onSubmit={(e) => handleSaveQuestion(e, 'finish')} className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 sm:space-y-5 animate-fade-in">
            {/* ================= ZONA 1: INTI BUTIR SOAL (WAJIB) ================= */}
            <div className="space-y-4">
              {/* Baris 1: Tipe Format Soal & Lencana Panduan Format */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex-1 max-w-sm">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Tipe Format Soal
                  </label>
                  <QuestionTypeDropdown
                    value={qType}
                    onChange={handleTypeChange}
                    optionsCount={qOptions.length}
                  />
                </div>

                <div className="flex items-center gap-2 self-start sm:self-end text-xs text-slate-500 dark:text-slate-400 font-medium pb-1">
                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] border border-slate-200/60 dark:border-slate-700/60">
                    {qType === 'multiple_choice' ? 'Pilihan Ganda (1 Kunci Benar)' :
                     qType === 'true_false' ? 'Dua Pilihan (Benar / Salah)' :
                     qType === 'short_answer' ? 'Isian Singkat (Kata Kunci)' :
                     'Menjodohkan Pasangan Kartu'}
                  </span>
                </div>
              </div>

              {/* Baris 2: Pertanyaan Soal (Fokus Utama) */}
              <div className="space-y-1.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <label className="block text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1">
                      <span>Pertanyaan Soal</span>
                    </label>
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-900/60 px-1.5 py-0.5 rounded-md">
                      Wajib diisi
                    </span>
                  </div>
                  <p className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                    Tuliskan butir pertanyaan kuis atau instruksi soal secara jelas bagi siswa.
                  </p>
                </div>
                <ResizableTextarea
                  rows={3}
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Tuliskan butir pertanyaan kuis secara jelas di sini..."
                  minHeight={75}
                  maxHeight={350}
                  className="min-h-[85px] text-sm font-semibold"
                />
              </div>

              {/* Baris 3: Ilustrasi Gambar (Kompak & On-Demand) */}
              {qImageUrl ? (
                <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="relative group w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 flex items-center justify-center shadow-xs">
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
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Ilustrasi Terpasang</span>
                        </span>
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
                          <span>Hapus</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={qImageCaption}
                        onChange={(e) => setQImageCaption(e.target.value)}
                        placeholder="Keterangan gambar (opsional, misal: Diagram Siklus Air)"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-medium min-h-[40px] focus:border-blue-500 focus:outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsImageModalOpen(true)}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 text-xs font-bold inline-flex items-center gap-1.5 min-h-[36px] btn-press"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Ganti Gambar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsImageModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-bold inline-flex items-center gap-2 min-h-[44px] transition-all btn-press group"
                  >
                    <ImageIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <span>+ Tambah Gambar Ilustrasi (Opsional)</span>
                  </button>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium hidden sm:inline">
                    Mendukung AI, Ensiklopedia & Unggah
                  </span>
                </div>
              )}
            </div>

                {/* Form Input Opsi berdasarkan Tipe */}
                {qType === 'multiple_choice' && (
                  <div className="space-y-2.5">
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <label className="block text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                          Pilihan Jawaban
                        </label>
                        {qOptions.length < 5 && (
                          <button
                            type="button"
                            onClick={handleAddOption}
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline min-h-[36px] flex items-center gap-1 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah Opsi ({String.fromCharCode(65 + qOptions.length)})</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                        Ketik opsi jawaban dan pilih salah satu tombol huruf sebagai kunci benar.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {qOptions.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-xl border flex items-center gap-2 transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 ${
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
                            placeholder={
                              qCorrectIndex === oIdx
                                ? `Kunci Benar (${String.fromCharCode(65 + oIdx)})`
                                : `Pilihan ${String.fromCharCode(65 + oIdx)}`
                            }
                            className="flex-1 bg-transparent text-xs font-medium text-slate-900 dark:text-white focus:outline-none min-h-[40px]"
                          />
                          {qOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(oIdx)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg transition-colors shrink-0"
                              title={`Hapus Pilihan ${String.fromCharCode(65 + oIdx)}`}
                              aria-label={`Hapus Pilihan ${String.fromCharCode(65 + oIdx)}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {qType === 'true_false' && (
                  <div className="space-y-3">
                    {/* Header Pilihan & Kunci Jawaban dengan Dropdown Preset Ramping */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="space-y-0.5">
                        <label className="block text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                          Pilihan & Kunci Jawaban
                        </label>
                        <p className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                          {isCustomTrueFalse
                            ? 'Tentukan dua teks pilihan kustom dan tandai kunci yang benar.'
                            : 'Pilih preset pasangan atau kustom, lalu ketuk salah satu kartu untuk kunci benar.'}
                        </p>
                      </div>

                      {/* Bilah Kontrol Preset Ramping */}
                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <TrueFalsePresetDropdown
                          currentOptions={qOptions}
                          isCustom={isCustomTrueFalse}
                          onSelectPreset={(preset) => {
                            setIsCustomTrueFalse(false);
                            setQOptions([preset.opt0, preset.opt1]);
                          }}
                          onSelectCustom={() => {
                            setIsCustomTrueFalse(true);
                          }}
                          playClick={playClick}
                        />

                        {!isCustomTrueFalse ? (
                          <button
                            type="button"
                            onClick={() => {
                              playClick();
                              setIsCustomTrueFalse(true);
                            }}
                            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-slate-850 border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 flex items-center gap-1.5 min-h-[44px] transition-all btn-press shadow-2xs"
                            title="Tulis teks pilihan kustom sendiri"
                          >
                            <Edit3 className="w-3.5 h-3.5 shrink-0" />
                            <span>Kustom</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              playClick();
                              setIsCustomTrueFalse(false);
                              setQOptions(['Benar', 'Salah']);
                            }}
                            className="px-3 py-2 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 flex items-center gap-1.5 min-h-[44px] transition-all btn-press shadow-2xs"
                            title="Kembali menggunakan preset standar"
                          >
                            <span>Kembali ke Preset</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* MODE PRESET: Hanya Tampilkan 2 Tombol Pilihan Interaktif Bersih */}
                    {!isCustomTrueFalse ? (
                      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                        {[0, 1].map((oIdx) => {
                          const isCorrect = qCorrectIndex === oIdx;
                          const defaultLabel = oIdx === 0 ? 'Benar' : 'Salah';
                          const optLabel = qOptions[oIdx] || defaultLabel;
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => {
                                playClick();
                                setQCorrectIndex(oIdx);
                              }}
                              className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 btn-press min-h-[80px] ${
                                isCorrect
                                  ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/20 shadow-xs font-black'
                                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                            >
                              <span className="text-sm sm:text-base font-black truncate max-w-full">
                                {optLabel}
                              </span>
                              {isCorrect ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Kunci Benar</span>
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                  <span className="w-2.5 h-2.5 rounded-full border border-slate-300 dark:border-slate-600 inline-block" />
                                  <span>Jadikan Kunci</span>
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      /* MODE KUSTOM: Hanya Muncul Jika Pengguna Memilih Kustom */
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-blue-50/30 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/50 space-y-2.5 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                            <Edit3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Tulis Teks Pilihan Kustom</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              playClick();
                              setIsCustomTrueFalse(false);
                              setQOptions(['Benar', 'Salah']);
                            }}
                            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline min-h-[36px] flex items-center"
                          >
                            Kembali ke Preset
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {[0, 1].map((oIdx) => {
                            const isCorrect = qCorrectIndex === oIdx;
                            const defaultLabel = oIdx === 0 ? 'Benar' : 'Salah';
                            const optVal = qOptions[oIdx] !== undefined ? qOptions[oIdx] : defaultLabel;
                            return (
                              <div
                                key={oIdx}
                                className={`p-2.5 sm:p-3 rounded-xl border transition-all flex items-center gap-2 ${
                                  isCorrect
                                    ? 'border-emerald-500 bg-white dark:bg-slate-900 ring-2 ring-emerald-500/20 shadow-xs'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                                    Opsi {oIdx === 0 ? 'Pertama (A)' : 'Kedua (B)'}
                                  </span>
                                  <input
                                    type="text"
                                    value={optVal}
                                    onChange={(e) => handleOptionChange(oIdx, e.target.value)}
                                    placeholder={oIdx === 0 ? 'Contoh: Fakta / Setuju / Sesuai' : 'Contoh: Opini / Menolak / Keliru'}
                                    className="w-full text-xs sm:text-sm font-bold text-slate-900 dark:text-white bg-transparent outline-none placeholder:text-slate-400"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    playClick();
                                    setQCorrectIndex(oIdx);
                                  }}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all btn-press min-h-[44px] ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                  }`}
                                  title={isCorrect ? 'Kunci Benar' : 'Jadikan Kunci'}
                                >
                                  {isCorrect ? (
                                    <>
                                      <Check className="w-4 h-4 text-white" />
                                      <span>Kunci Benar</span>
                                    </>
                                  ) : (
                                    <span>Jadikan Kunci</span>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {qType === 'short_answer' && (
                  <div className="space-y-2">
                    <div className="space-y-0.5">
                      <label className="block text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        Kunci Jawaban Isian Singkat
                      </label>
                      <p className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                        Pisahkan dengan tanda koma jika ada beberapa variasi jawaban benar (contoh: fotosintesis, fotosintesa).
                      </p>
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
                  <div className="space-y-3.5">
                    {/* Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <label className="block text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                            Pasangan Kartu Menjodohkan
                          </label>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60">
                            {qMatchingPairs.length} Pasang Aktif
                          </span>
                        </div>
                        <p className="text-[11px] font-normal text-slate-400 dark:text-slate-500 mt-0.5">
                          Ideal 3–4 pasang (minimal 2, maksimal 6 pasang agar nyaman di layar ponsel siswa).
                        </p>
                      </div>

                      {qMatchingPairs.length < 6 && (
                        <button
                          type="button"
                          onClick={handleAddMatchingPair}
                          className="self-start sm:self-auto px-3 py-2 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 flex items-center gap-1.5 transition-all btn-press min-h-[44px]"
                        >
                          <Plus className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                          <span>Tambah Pasangan</span>
                        </button>
                      )}
                    </div>

                    {/* List of Pair Cards */}
                    <div className="space-y-3">
                      {qMatchingPairs.map((pair, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-850/50 shadow-2xs space-y-3 transition-all"
                        >
                          {/* Pair Card Top Bar */}
                          <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-750 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-purple-600 text-white font-extrabold text-[11px] flex items-center justify-center shadow-2xs shrink-0">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                Pasangan #{idx + 1}
                              </span>
                            </div>

                            {qMatchingPairs.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMatchingPair(idx)}
                                className="px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg flex items-center gap-1.5 transition-all min-h-[44px] btn-press"
                                title={`Hapus Pasangan #${idx + 1}`}
                                aria-label={`Hapus Pasangan #${idx + 1}`}
                              >
                                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-xs whitespace-nowrap">Hapus</span>
                              </button>
                            )}
                          </div>

                          {/* Inputs: 1 Column on Mobile, Grid on Tablet/Desktop with visual connector */}
                          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-2.5 md:gap-3 items-center">
                            {/* Left Card (Question / Concept) */}
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                  Konsep / Soal (Sisi Kiri)
                                </label>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 shadow-2xs">
                                  Kolom A
                                </span>
                              </div>
                              <AutoResizeTextarea
                                value={pair.left}
                                onChange={(e) => handleMatchingPairChange(idx, 'left', e.target.value)}
                                placeholder={PAIR_PLACEHOLDERS[idx]?.left || `Contoh: Konsep #${idx + 1}`}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none min-h-[44px]"
                              />
                            </div>

                            {/* Middle Connector Arrow (visible on desktop md:flex, hidden on mobile) */}
                            <div className="hidden md:flex flex-col items-center justify-center pt-5 text-purple-500 dark:text-purple-400">
                              <span className="text-sm font-black px-1.5 py-1 rounded-md bg-purple-100/70 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800">
                                ↔
                              </span>
                            </div>

                            {/* Right Card (Correct Match / Answer) */}
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                  <span>Pasangan Tepat (Sisi Kanan)</span>
                                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                </label>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs">
                                  Kunci Benar
                                </span>
                              </div>
                              <AutoResizeTextarea
                                value={pair.right}
                                onChange={(e) => handleMatchingPairChange(idx, 'right', e.target.value)}
                                placeholder={PAIR_PLACEHOLDERS[idx]?.right || `Contoh: Pasangan #${idx + 1}`}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-white dark:bg-slate-900 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none min-h-[44px]"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Panel Kartu Pengecoh Sisi Kanan (Opsional) */}
                    <div className="p-3.5 sm:p-4 rounded-2xl border border-dashed border-amber-300 dark:border-amber-700/80 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                            <span>Kartu Pengecoh Sisi Kanan</span>
                            <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 border border-amber-200/80 dark:border-amber-800/80 shadow-2xs">
                              Opsional
                            </span>
                          </span>
                          {qDistractors.length > 0 && (
                            <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60">
                              {qDistractors.length}/2 Aktif
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                          Pilihan palsu di Kolom B tanpa pasangan di Kolom A untuk mencegah siswa menebak dengan cara eliminasi sisa kartu.
                          {qDistractors.length > 0 && (
                            <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                              ✍️ Tersimpan otomatis saat Anda mengetik.
                            </span>
                          )}
                        </p>
                      </div>

                      {/* State Belum Ada Pengecoh */}
                      {qDistractors.length === 0 ? (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={handleAddDistractor}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-200 bg-amber-100/80 dark:bg-amber-900/40 hover:bg-amber-200/80 dark:hover:bg-amber-850 border border-amber-300 dark:border-amber-700 flex items-center justify-center gap-2 transition-all btn-press min-h-[44px]"
                          >
                            <Plus className="w-4 h-4 text-amber-700 dark:text-amber-300 shrink-0" />
                            <span>+ Tambah Kartu Pengecoh (Maks. 2)</span>
                          </button>
                        </div>
                      ) : (
                        /* State Sudah Ada Pengecoh */
                        <div className="space-y-2.5 pt-1">
                          {qDistractors.map((distractor, dIdx) => (
                            <div 
                              key={dIdx} 
                              className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200/90 dark:border-amber-800/60 shadow-2xs space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-md bg-amber-500 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                                    {dIdx + 1}
                                  </span>
                                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                    Pengecoh #{dIdx + 1} (Kolom B)
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDistractor(dIdx)}
                                  className="px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg flex items-center gap-1 transition-all min-h-[38px] btn-press"
                                  title={`Hapus Pengecoh #${dIdx + 1}`}
                                  aria-label={`Hapus Pengecoh #${dIdx + 1}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                  <span className="text-xs">Hapus</span>
                                </button>
                              </div>

                              <AutoResizeTextarea
                                value={distractor}
                                onChange={(e) => handleDistractorChange(dIdx, e.target.value)}
                                placeholder={dIdx === 0 ? 'Contoh pengecoh: Karbondioksida (atau opsi salah lain)' : 'Contoh pengecoh: Gas Nitrogen'}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-slate-50/60 dark:bg-slate-850/60 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none min-h-[44px]"
                              />
                            </div>
                          ))}

                          {/* Tombol Tambah Pengecoh Diletakkan Di Bawah */}
                          {qDistractors.length < 2 ? (
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={handleAddDistractor}
                                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-200 bg-amber-100/70 dark:bg-amber-900/30 hover:bg-amber-200/80 dark:hover:bg-amber-850 border border-amber-300/80 dark:border-amber-700 flex items-center justify-center gap-1.5 transition-all btn-press min-h-[44px]"
                              >
                                <Plus className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300 shrink-0" />
                                <span>+ Tambah Pengecoh Ke-2 (Maks. 2)</span>
                              </button>
                            </div>
                          ) : (
                            <div className="pt-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 px-1">
                              <span>✓ Kuota maksimal 2 kartu pengecoh telah terisi</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ================= ZONA 2: PENGAYAAN PEDAGOGIS (OPSIONAL) ================= */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <label className="block text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Pembahasan Jawaban</span>
                      </label>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50">
                        Opsional
                      </span>
                    </div>
                    <p className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                      Muncul setelah siswa menjawab
                    </p>
                  </div>
                  <ResizableTextarea
                    value={qExplanation}
                    onChange={(e) => setQExplanation(e.target.value)}
                    rows={2}
                    placeholder="Tuliskan pembahasan atau konsep materi di balik jawaban yang benar..."
                    minHeight={65}
                    maxHeight={300}
                    className="min-h-[75px]"
                  />
                </div>

                {/* ================= ZONA 3: PENGATURAN SKOR & WAKTU (KONFIGURASI TEKNIS) ================= */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 space-y-3.5">
                  {/* Panel Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/60 dark:border-slate-800">
                    <div className="space-y-0.5">
                      <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>Pengaturan Skor & Durasi</span>
                      </span>
                      <p className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                        Tentukan bobot nilai butir ini dan batas waktu jawab
                      </p>
                    </div>
                    {questions.length > 0 && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-start sm:self-auto shadow-2xs">
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Akumulasi Kuis:</span>
                        <strong className={`text-xs font-black ${
                          projectedTotalPoints === 100 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-blue-600 dark:text-blue-400'
                        }`}>
                          {projectedTotalPoints}p
                        </strong>
                        {projectedTotalPoints === 100 ? (
                          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md">
                            🎯 Pas 100
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                            / 100p
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
                    {/* Bobot Poin */}
                    <div className="space-y-1.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <label className="block text-xs font-black text-slate-900 dark:text-white">
                            Bobot Poin Butir Ini
                          </label>
                          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                            (Standar 10p)
                          </span>
                        </div>
                        <p className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                          Nilai yang diperoleh siswa jika menjawab dengan benar
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1 max-w-[130px]">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={qPoints}
                            onChange={(e) => setQPoints(parseInt(e.target.value) || 10)}
                            className="w-full pl-3 pr-11 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none min-h-[44px]"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                            Poin
                          </span>
                        </div>
                        {/* Preset Cepat Bobot Poin */}
                        <div className="flex items-center gap-1 flex-wrap">
                          {[5, 10, 15, 20].map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setQPoints(p)}
                              className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-colors min-h-[44px] ${
                                qPoints === p
                                  ? 'bg-blue-600 text-white shadow-xs font-black'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                              }`}
                            >
                              {p}p
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Waktu Jawab */}
                    <div className="space-y-1.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <label className="block text-xs font-black text-slate-900 dark:text-white">
                            Durasi Timer Menjawab
                          </label>
                          {/* Mode Selector Pill: Auto vs Khusus */}
                          <div className="inline-flex p-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold shrink-0">
                            <button
                              type="button"
                              onClick={() => setQCustomDurationSec('')}
                              className={`px-2 py-1 rounded-md transition-all ${
                                !qCustomDurationSec
                                  ? 'bg-blue-600 text-white shadow-2xs font-black'
                                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                              }`}
                              title={`Otomatis mengikuti durasi standar kuis (${durationPerQuestionSec} detik)`}
                            >
                              Auto ({durationPerQuestionSec}s)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!qCustomDurationSec) setQCustomDurationSec(String(durationPerQuestionSec));
                              }}
                              className={`px-2 py-1 rounded-md transition-all ${
                                qCustomDurationSec
                                  ? 'bg-blue-600 text-white shadow-2xs font-black'
                                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                              }`}
                              title="Atur waktu khusus terkunci untuk butir soal ini saja"
                            >
                              Khusus
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                          Batas waktu berpikir siswa untuk butir soal ini
                        </p>
                      </div>

                      {!qCustomDurationSec ? (
                        <div className="py-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 rounded-xl border border-slate-200/80 dark:border-slate-800 min-h-[44px]">
                          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Mengikuti pengaturan kuis <strong>({durationPerQuestionSec} detik)</strong></span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1 max-w-[130px]">
                            <input
                              type="number"
                              min="5"
                              max="300"
                              value={qCustomDurationSec}
                              onChange={(e) => setQCustomDurationSec(e.target.value)}
                              className="w-full pl-3 pr-12 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none min-h-[44px]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                              Detik
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-wrap">
                            {[15, 30, 45, 60].map((sec) => (
                              <button
                                key={sec}
                                type="button"
                                onClick={() => setQCustomDurationSec(String(sec))}
                                className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-colors min-h-[44px] ${
                                  qCustomDurationSec === String(sec)
                                    ? 'bg-blue-600 text-white shadow-xs font-black'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                                }`}
                              >
                                {sec}s
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Bottom Form Action Buttons */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold min-h-[44px] transition-colors btn-press flex items-center justify-center gap-1.5"
                  >
                    <span>Batal / Kembali</span>
                  </button>

                  <div className="w-full sm:w-auto flex items-stretch sm:items-center gap-2">
                    {editingQuestionId ? (
                      <button
                        type="button"
                        onClick={(e) => handleSaveQuestion(e, 'finish')}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow active:scale-95 transition-all min-h-[44px] flex items-center justify-center gap-2 btn-press"
                      >
                        <Save className="w-4 h-4" />
                        <span>Simpan Perubahan</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleSaveQuestion(e, 'continue')}
                          className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-900/40 transition-colors min-h-[44px] flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Simpan & Tambah Lagi</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleSaveQuestion(e, 'finish')}
                          className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow active:scale-95 transition-all min-h-[44px] flex items-center justify-center gap-1.5"
                        >
                          <Save className="w-4 h-4" />
                          <span>Simpan</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Hidden submit trigger for Enter key accessibility */}
                <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
                  Simpan
                </button>
              </form>
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
