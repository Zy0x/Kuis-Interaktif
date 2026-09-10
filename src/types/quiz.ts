export type GradeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 'Semua';

export type Subject = 
  | 'Matematika' 
  | 'IPA' 
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
  | 'Informatika';

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
  options: string[];
  correctIndex: number;
  explanation: string;
  acceptableAnswers?: string[]; // Variasi kunci jawaban benar untuk isian singkat
  matchingPairs?: { left: string; right: string }[]; // Pasangan kartu untuk menjodohkan
  customDurationSec?: number; // Durasi waktu kustom khusus butir soal ini (opsional)
  points?: number; // Poin/bobot nilai butir soal (default 10)
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  subject: Subject;
  grade: number; // 1 to 6
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

