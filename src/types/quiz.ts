export type EducationLevel = 'SD' | 'SMP' | 'SMA';

export type GradeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'Semua';

export type Subject = 
  // Jenjang SD & Umum
  | 'Matematika' 
  | 'IPA' 
  | 'IPAS'
  | 'IPS'
  | 'Bahasa Indonesia' 
  | 'Pendidikan Pancasila' 
  | 'Pengetahuan Umum'
  | 'Bahasa Inggris'
  | 'PJOK'
  | 'Seni Musik'
  | 'Seni Rupa'
  | 'Seni Tari'
  | 'Seni Teater'
  | 'Pendidikan Agama Islam'
  | 'Pendidikan Agama Kristen'
  | 'Pendidikan Agama Katolik'
  | 'Pendidikan Agama Hindu'
  | 'Pendidikan Agama Buddha'
  | 'Pendidikan Agama Konghucu'
  | 'Bahasa Daerah'
  | 'Informatika'
  // Khas SMP (Fase D)
  | 'IPA Terpadu'
  | 'IPS Terpadu'
  | 'Prakarya'
  // Khas SMA / SMK (Fase E & F)
  | 'Fisika'
  | 'Kimia'
  | 'Biologi'
  | 'Ekonomi'
  | 'Sosiologi'
  | 'Geografi'
  | 'Sejarah'
  | 'Matematika Tingkat Lanjut'
  | 'Antropologi';

export type QuestionType = 
  | 'multiple_choice' 
  | 'true_false' 
  | 'image_guess' 
  | 'short_answer' 
  | 'matching_pairs';

export type GameMode = 'standard' | 'survival_3hearts' | 'untimed';

export type ScreenState = 
  | 'home' 
  | 'arena' 
  | 'result' 
  | 'creator' 
  | 'student-lobby' 
  | 'teacher-dashboard' 
  | 'worksheet-print';

export interface QuizQuestion {
  id: string;
  text: string;
  type: QuestionType;
  imageUrl?: string;
  imageCaption?: string;
  imagePrompt?: string; // Deskripsi visual terstruktur untuk generator AI
  options: string[];
  correctIndex: number;
  explanation: string;
  acceptableAnswers?: string[]; // Variasi kunci jawaban benar untuk isian singkat
  matchingPairs?: { left: string; right: string }[]; // Pasangan kartu untuk menjodohkan
  distractors?: string[]; // Pengecoh sisi kanan tanpa pasangan (opsional, maks 2)
  customDurationSec?: number; // Durasi waktu kustom khusus butir soal ini (opsional)
  points?: number; // Poin/bobot nilai butir soal (default 10)
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  subject: Subject;
  grade: number; // 1 to 12
  educationLevel?: EducationLevel; // 'SD' | 'SMP' | 'SMA'
  durationPerQuestionSec: number;
  coverEmoji: string;
  themeColor: string;
  badgeTitle: string;
  questions: QuizQuestion[];
  pinCode?: string; // 4-digit room code, e.g. "4821"
  creatorId?: string;
  creatorName?: string;
  isPublished?: boolean;
  createdAt?: string;
  visibility?: 'public' | 'private';
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  defaultGameMode?: GameMode;
  defaultSettings?: Partial<QuizSessionSettings>;
}

export interface AiQuizMetadata {
  title?: string;
  description?: string;
  coverEmoji?: string;
  badgeTitle?: string;
  durationPerQuestionSec?: number;
  themeColor?: string;
  defaultGameMode?: GameMode;
}

export const MASTER_TEACHER_EMAIL = 'zy0x.noir@gmail.com';

export interface PlayerProfile {
  nickname: string;
  avatarId: string;
  totalScore: number;
  quizzesCompleted: number;
  starsEarned: number;
  isLoggedIn?: boolean;
  email?: string;
  studentId?: string;
  grade?: number;
}

export interface TeacherProfile {
  id: string;
  email: string;
  fullName: string;
  schoolName?: string;
  createdAt?: string;
}

export interface StudentSubmission {
  id: string;
  quizId: string;
  quizTitle: string;
  studentName: string;
  avatarId: string;
  score: number; // 0 - 100
  stars: number; // 1 - 3
  correctCount: number;
  totalCount: number;
  timeSpentSec: number;
  submittedAt: string;
}

export interface QuizAttemptAnswer {
  questionId: string;
  selectedIndex: number;
  textAnswer?: string;
  isCorrect: boolean;
  timeSpentSec: number;
  earnedPoints?: number; // Poin aktual yang diraih (mendukung penilaian proporsional / partial credit scoring)
  matchedCount?: number; // Jumlah pasangan yang berhasil dijodohkan (untuk tipe matching_pairs)
  totalPairs?: number;   // Total pasangan yang harus dijodohkan
}

export interface QuizAttemptResult {
  quizId: string;
  quizTitle: string;
  subject: Subject;
  grade: number;
  score: number; // 0 - 100
  stars: number; // 1, 2, or 3
  correctCount: number;
  totalCount: number;
  timeSpentSec: number;
  answers: QuizAttemptAnswer[];
  completedAt: string;
}

export interface LeaderboardEntry {
  id: string;
  quizId: string;
  nickname: string;
  avatarId: string;
  score: number;
  stars: number;
  timeSpentSec: number;
  dateStr: string;
}

// ==========================================================
// ROLE-BASED ACCESS CONTROL (RBAC) DEFINITIONS
// ==========================================================
export type UserRole = 'teacher' | 'student' | 'guest';

export interface RolePermissions {
  readonly canCreateQuiz: boolean;
  readonly canEditQuiz: boolean;
  readonly canDeleteQuiz: boolean;
  readonly canViewTeacherDashboard: boolean;
  readonly canViewSubmissions: boolean;
  readonly canExportData: boolean;
  readonly canPlayQuiz: boolean;
  readonly canAccessSmartboard: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  teacher: {
    canCreateQuiz: true,
    canEditQuiz: true,
    canDeleteQuiz: true,
    canViewTeacherDashboard: true,
    canViewSubmissions: true,
    canExportData: true,
    canPlayQuiz: true,
    canAccessSmartboard: true,
  },
  student: {
    canCreateQuiz: false,
    canEditQuiz: false,
    canDeleteQuiz: false,
    canViewTeacherDashboard: false,
    canViewSubmissions: false,
    canExportData: false,
    canPlayQuiz: true,
    canAccessSmartboard: false,
  },
  guest: {
    canCreateQuiz: false,
    canEditQuiz: false,
    canDeleteQuiz: false,
    canViewTeacherDashboard: false,
    canViewSubmissions: false,
    canExportData: false,
    canPlayQuiz: true,
    canAccessSmartboard: false,
  },
};

export const getRolePermissions = (role: UserRole): RolePermissions => {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.guest;
};

export const canManageQuizzes = (teacher: TeacherProfile | null | undefined): boolean => {
  return Boolean(teacher && teacher.id && teacher.id.trim() !== '');
};

// ==========================================================
// ACTIVE QUIZ SESSION & WAYGROUND HOST DEFINITIONS
// ==========================================================
export type QuizSessionStatus = 'waiting' | 'active' | 'paused' | 'finished';

export interface QuizSessionParticipantAnswer {
  questionId: string;
  questionIndex: number;
  selectedOption?: number;
  textAnswer?: string;
  isCorrect: boolean;
  timeSpentSec: number;
  pointsEarned: number;
}

export interface QuizSessionParticipant {
  id: string;
  name: string;
  avatarId: string;
  currentQuestionIndex: number; // 0-based
  totalQuestions: number;
  score: number;
  stars: number;
  correctCount: number;
  incorrectCount: number;
  streak: number;
  finished: boolean;
  timeSpentSec: number;
  answers: Record<string, QuizSessionParticipantAnswer>;
  joinedAt: string;
  lastActiveAt: string;
}

export type AnswerVisibilityMode = 'immediate' | 'status_only' | 'exam_strict';
export type ExplanationVisibilityMode = 'immediate' | 'end_only' | 'never';
export type ExecutionMode = 'teacher_led' | 'self_paced';
export type TeacherPacingSubMode = 'manual' | 'timed_next';
export type ParticipantMode = 'individual' | 'team';
export type PacingType = 'in_class' | 'homework';

export interface SessionLiveReaction {
  id: string;
  studentName: string;
  senderName?: string;
  avatarId: string;
  emoji: string;
  createdAt: number;
}

export interface SessionChatMessage {
  id: string;
  studentName: string;
  avatarId: string;
  text: string;
  isTeacher?: boolean;
  createdAt: number;
}

export interface QuizSessionSettings {
  executionMode?: ExecutionMode;
  teacherPacingSubMode?: TeacherPacingSubMode;
  isChatMuted?: boolean;
  participantMode?: ParticipantMode;
  pacingType?: PacingType;
  deadlineAt?: string;
  requireStudentInfo?: boolean;
  selectedQuestionIds?: string[];
  mode: GameMode;
  durationPerQuestionSec: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  presentationTarget: 'smartboard' | 'student-lobby';
  showAnswersMode?: AnswerVisibilityMode;
  showExplanationMode?: ExplanationVisibilityMode;
  showLeaderboardToStudents?: boolean;
  maxAttempts?: number; // 0 = Bebas/Unlimited, 1 = 1x Ujian Resmi
  tabSwitchDetection?: boolean; // Deteksi dan peringatan jika berpindah tab/layar
  overrideCustomQuestionDurations?: boolean; // Menimpa durasi kustom butir soal dengan durasi seragam
}

export interface QuizSession {
  id: string;
  quizId: string;
  quizTitle: string;
  quizCover?: string;
  subject: Subject;
  grade: number;
  pinCode: string;
  teacherId?: string;
  teacherEmail?: string;
  teacherName?: string;
  status: QuizSessionStatus;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  settings: QuizSessionSettings;
  participants: QuizSessionParticipant[];
  totalQuestions: number;
  currentQuestionIndex?: number;
  questionState?: 'answering' | 'revealed' | 'ended';
  reactions?: SessionLiveReaction[];
  chatMessages?: SessionChatMessage[];
  isChatMuted?: boolean;
}

