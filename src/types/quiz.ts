export type GradeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 'Semua';

export type Subject = 
  | 'Matematika' 
  | 'IPA' 
  | 'Bahasa Indonesia' 
  | 'Pendidikan Pancasila' 
  | 'Pengetahuan Umum';

export type QuestionType = 'multiple_choice' | 'true_false' | 'image_guess';

export interface QuizQuestion {
  id: string;
  text: string;
  type: QuestionType;
  imageUrl?: string;
  imageCaption?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
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
}

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
