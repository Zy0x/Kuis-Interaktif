import { createClient } from '@supabase/supabase-js';
import type { 
  LeaderboardEntry, 
  QuizAttemptResult, 
  Quiz, 
  QuizQuestion,
  TeacherProfile, 
  StudentSubmission,
  PlayerProfile 
} from '../types/quiz';
import { MASTER_TEACHER_EMAIL } from '../types/quiz';
import { INITIAL_QUIZZES } from '../data/seedQuizzes';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  !SUPABASE_URL.includes('your-supabase')
);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Local Storage Keys
const STORAGE_KEY_LEADERBOARD = 'kuis_sd_leaderboard_v1';
const STORAGE_KEY_ATTEMPTS = 'kuis_sd_attempts_v1';
const STORAGE_KEY_PLAYER = 'kuis_sd_player_profile';
const STORAGE_KEY_CUSTOM_QUIZZES = 'kuis_sd_custom_quizzes_v1';
const STORAGE_KEY_TEACHER_PROFILE = 'kuis_sd_teacher_profile_v1';

// 4-Digit PIN Helper
export function generateRandomPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Ensure seed quizzes have friendly fallback PINs
INITIAL_QUIZZES.forEach((q, idx) => {
  if (!q.pinCode) {
    q.pinCode = (1001 + idx).toString();
  }
});

export const DataManager = {
  // 1. Get All Quizzes (Default Seeds + Teacher Custom Quizzes)
  getAllQuizzes(options?: { publicOnly?: boolean; teacherEmail?: string; teacherId?: string }): Quiz[] {
    try {
      const customStr = localStorage.getItem(STORAGE_KEY_CUSTOM_QUIZZES);
      let customQuizzes: Quiz[] = customStr ? JSON.parse(customStr) : [];

      // If teacher options are provided
      if (options?.teacherEmail) {
        const isMaster = options.teacherEmail.trim().toLowerCase() === MASTER_TEACHER_EMAIL.toLowerCase();
        if (isMaster) {
          // Master Teacher owns/manages all custom quizzes + seed quizzes
          if (options.teacherId) {
            let changed = false;
            customQuizzes = customQuizzes.map((q) => {
              if (!q.creatorId || q.creatorId.startsWith('guru_demo_') || q.creatorId.startsWith('teacher_local_')) {
                changed = true;
                return { ...q, creatorId: options.teacherId, creatorName: q.creatorName || 'Pendidik' };
              }
              return q;
            });
            if (changed) {
              localStorage.setItem(STORAGE_KEY_CUSTOM_QUIZZES, JSON.stringify(customQuizzes));
            }
          }
          return [...customQuizzes, ...INITIAL_QUIZZES];
        } else {
          // Other teachers only see and manage their own created quizzes (starts empty for new teachers)
          return customQuizzes.filter((q) => q.creatorId === options.teacherId);
        }
      }

      let all = [...customQuizzes, ...INITIAL_QUIZZES];

      // If public catalog filter is requested (for student & guest dashboard)
      if (options?.publicOnly) {
        all = all.filter((q) => q.visibility !== 'private');
      }

      return all;
    } catch {
      const seeds = INITIAL_QUIZZES;
      return options?.publicOnly ? seeds.filter((q) => q.visibility !== 'private') : seeds;
    }
  },

  // 2. Find Quiz by PIN (Online Supabase + Offline Fallback)
  async getQuizByPin(pin: string): Promise<Quiz | null> {
    const cleanPin = pin.trim();
    if (!cleanPin) return null;

    // 1. Try Supabase first if available
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('quizzes')
          .select(`
            id,
            title,
            description,
            subject,
            target_grade,
            duration_per_question_sec,
            cover_emoji,
            theme_color,
            badge_title,
            pin_code,
            creator_name,
            visibility,
            quiz_questions (
              id,
              question_text,
              question_type,
              image_url,
              image_caption,
              options,
              correct_index,
              explanation,
              order_number
            )
          `)
          .eq('pin_code', cleanPin)
          .maybeSingle();

        if (!error && data) {
          const rawQuestions = (data.quiz_questions as Array<{
            id: string;
            question_text: string;
            question_type: string;
            image_url: string | null;
            image_caption: string | null;
            options: string[];
            correct_index: number;
            explanation: string;
            order_number: number;
          }>) || [];

          // Sort questions by order_number
          rawQuestions.sort((a, b) => a.order_number - b.order_number);

          const formattedQuiz: Quiz = {
            id: data.id,
            title: data.title,
            description: data.description || '',
            subject: data.subject as Quiz['subject'],
            grade: data.target_grade,
            durationPerQuestionSec: data.duration_per_question_sec,
            coverEmoji: data.cover_emoji || '⭐',
            themeColor: data.theme_color || 'from-blue-500 to-indigo-600',
            badgeTitle: data.badge_title || 'Bintang Juara',
            pinCode: data.pin_code,
            creatorName: data.creator_name || 'Guru SD',
            visibility: (data.visibility as 'public' | 'private') || 'public',
            questions: rawQuestions.map((q) => ({
              id: q.id,
              text: q.question_text,
              type: q.question_type as QuizQuestion['type'],
              imageUrl: q.image_url || undefined,
              imageCaption: q.image_caption || undefined,
              options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]'),
              correctIndex: q.correct_index,
              explanation: q.explanation || '',
            })),
          };

          return formattedQuiz;
        }
      } catch (e) {
        console.warn('Supabase PIN lookup notice:', e);
      }
    }

    // 2. Fallback to Local Quizzes & Seed Quizzes
    const all = this.getAllQuizzes();
    const match = all.find((q) => q.pinCode === cleanPin || q.id === cleanPin);
    return match || null;
  },

  // 3. Find Quiz by ID
  async getQuizById(id: string): Promise<Quiz | null> {
    const all = this.getAllQuizzes();
    const local = all.find((q) => q.id === id);
    if (local) return local;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('quizzes')
          .select(`
            id,
            title,
            description,
            subject,
            target_grade,
            duration_per_question_sec,
            cover_emoji,
            theme_color,
            badge_title,
            pin_code,
            creator_name,
            visibility,
            quiz_questions (
              id,
              question_text,
              question_type,
              image_url,
              image_caption,
              options,
              correct_index,
              explanation,
              order_number
            )
          `)
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          const rawQuestions = (data.quiz_questions as Array<{
            id: string;
            question_text: string;
            question_type: string;
            image_url: string | null;
            image_caption: string | null;
            options: string[];
            correct_index: number;
            explanation: string;
            order_number: number;
          }>) || [];

          rawQuestions.sort((a, b) => a.order_number - b.order_number);

          return {
            id: data.id,
            title: data.title,
            description: data.description || '',
            subject: data.subject as Quiz['subject'],
            grade: data.target_grade,
            durationPerQuestionSec: data.duration_per_question_sec,
            coverEmoji: data.cover_emoji || '⭐',
            themeColor: data.theme_color || 'from-blue-500 to-indigo-600',
            badgeTitle: data.badge_title || 'Bintang Juara',
            pinCode: data.pin_code,
            creatorName: data.creator_name || 'Guru SD',
            visibility: (data.visibility as 'public' | 'private') || 'public',
            questions: rawQuestions.map((q) => ({
              id: q.id,
              text: q.question_text,
              type: q.question_type as QuizQuestion['type'],
              imageUrl: q.image_url || undefined,
              imageCaption: q.image_caption || undefined,
              options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]'),
              correctIndex: q.correct_index,
              explanation: q.explanation || '',
            })),
          };
        }
      } catch {
        // ignore
      }
    }

    return null;
  },

  // 4. Save Custom Quiz Created by Teacher (Strict RBAC Enforced)
  async saveCustomQuiz(quiz: Quiz): Promise<Quiz> {
    // RBAC: Hanya akun Guru terautentikasi yang berhak membuat atau memodifikasi kuis
    const teacher = this.getTeacherProfile();
    if (!teacher || !teacher.id) {
      console.error('Akses Ditolak (RBAC): Peran Siswa atau Tamu dilarang membuat atau memodifikasi kuis.');
      throw new Error('Akses Ditolak: Hanya Guru yang berhak membuat atau memodifikasi kuis.');
    }

    // Pastikan identitas pembuat terikat pada Guru yang sedang aktif
    quiz.creatorId = teacher.id;
    quiz.creatorName = teacher.fullName;
    quiz.visibility = quiz.visibility || 'public';

    // Ensure 4-digit PIN exists
    if (!quiz.pinCode) {
      quiz.pinCode = generateRandomPin();
    }

    try {
      const customStr = localStorage.getItem(STORAGE_KEY_CUSTOM_QUIZZES);
      let customQuizzes: Quiz[] = customStr ? JSON.parse(customStr) : [];
      const existingIdx = customQuizzes.findIndex((q) => q.id === quiz.id);
      if (existingIdx >= 0) {
        customQuizzes[existingIdx] = quiz;
      } else {
        customQuizzes.unshift(quiz);
      }
      localStorage.setItem(STORAGE_KEY_CUSTOM_QUIZZES, JSON.stringify(customQuizzes));
    } catch (e) {
      console.warn('Local save error:', e);
    }

    // Sync to user Supabase if configured
    if (supabase) {
      try {
        await supabase.from('quizzes').upsert({
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          subject: quiz.subject,
          target_grade: quiz.grade,
          duration_per_question_sec: quiz.durationPerQuestionSec,
          cover_emoji: quiz.coverEmoji,
          theme_color: quiz.themeColor,
          badge_title: quiz.badgeTitle,
          pin_code: quiz.pinCode,
          creator_id: quiz.creatorId || null,
          creator_name: quiz.creatorName || null,
          visibility: quiz.visibility || 'public',
          is_published: true,
        });

        // Insert questions
        const formattedQuestions = quiz.questions.map((q, idx) => ({
          quiz_id: quiz.id,
          question_text: q.text,
          question_type: q.type,
          image_url: q.imageUrl || null,
          image_caption: q.imageCaption || null,
          options: q.options,
          correct_index: q.correctIndex,
          explanation: q.explanation,
          order_number: idx + 1,
        }));
        await supabase.from('quiz_questions').delete().eq('quiz_id', quiz.id);
        await supabase.from('quiz_questions').insert(formattedQuestions);
      } catch (err) {
        console.warn('Supabase quiz sync notice:', err);
      }
    }

    return quiz;
  },

  // 5. Delete Custom Quiz (Strict RBAC Enforced)
  async deleteCustomQuiz(quizId: string): Promise<void> {
    // RBAC: Hanya akun Guru terautentikasi yang berhak menghapus kuis
    const teacher = this.getTeacherProfile();
    if (!teacher || !teacher.id) {
      console.error('Akses Ditolak (RBAC): Peran Siswa atau Tamu dilarang menghapus kuis.');
      throw new Error('Akses Ditolak: Hanya Guru yang berhak menghapus kuis.');
    }

    try {
      const customStr = localStorage.getItem(STORAGE_KEY_CUSTOM_QUIZZES);
      if (customStr) {
        let customQuizzes: Quiz[] = JSON.parse(customStr);
        customQuizzes = customQuizzes.filter((q) => q.id !== quizId);
        localStorage.setItem(STORAGE_KEY_CUSTOM_QUIZZES, JSON.stringify(customQuizzes));
      }
    } catch (e) {
      console.warn('Delete quiz error:', e);
    }

    if (supabase) {
      try {
        await supabase.from('quizzes').delete().eq('id', quizId);
      } catch (err) {
        console.warn('Supabase quiz delete notice:', err);
      }
    }
  },

  // 5b. Update Quiz Visibility (Public vs Private)
  async updateQuizVisibility(quizId: string, visibility: 'public' | 'private'): Promise<void> {
    const teacher = this.getTeacherProfile();
    if (!teacher || !teacher.id) {
      console.error('Akses Ditolak (RBAC): Peran Siswa atau Tamu dilarang mengubah privasi kuis.');
      throw new Error('Akses Ditolak: Hanya Guru yang berhak mengubah privasi kuis.');
    }

    try {
      const customStr = localStorage.getItem(STORAGE_KEY_CUSTOM_QUIZZES);
      let customQuizzes: Quiz[] = customStr ? JSON.parse(customStr) : [];
      const existingIdx = customQuizzes.findIndex((q) => q.id === quizId);
      if (existingIdx >= 0) {
        customQuizzes[existingIdx] = {
          ...customQuizzes[existingIdx],
          visibility,
        };
      } else {
        const seedQuiz = INITIAL_QUIZZES.find((q) => q.id === quizId);
        if (seedQuiz) {
          customQuizzes.unshift({
            ...seedQuiz,
            creatorId: teacher.id,
            creatorName: teacher.fullName,
            visibility,
          });
        }
      }
      localStorage.setItem(STORAGE_KEY_CUSTOM_QUIZZES, JSON.stringify(customQuizzes));
    } catch (e) {
      console.warn('Local update quiz visibility error:', e);
    }

    if (supabase) {
      try {
        await supabase
          .from('quizzes')
          .update({ visibility })
          .eq('id', quizId);
      } catch (err) {
        console.warn('Supabase quiz update visibility notice:', err);
      }
    }
  },

  // 6. Get Player Profile (Default Mode Tamu)
  getPlayerProfile(): PlayerProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PLAYER);
      if (data) {
        const parsed: PlayerProfile = JSON.parse(data);
        if (parsed.nickname === 'Bintang SD') {
          parsed.nickname = 'Saya';
          localStorage.setItem(STORAGE_KEY_PLAYER, JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return {
      nickname: 'Saya',
      avatarId: 'lion',
      totalScore: 0,
      quizzesCompleted: 0,
      starsEarned: 0,
      isLoggedIn: false,
    };
  },

  savePlayerProfile(profile: Partial<PlayerProfile>): PlayerProfile {
    const current = this.getPlayerProfile();
    const updated: PlayerProfile = { ...current, ...profile };
    if (!updated.nickname || !updated.nickname.trim()) {
      updated.nickname = 'Saya';
    }
    localStorage.setItem(STORAGE_KEY_PLAYER, JSON.stringify(updated));
    return updated;
  },

  // Student Cloud Auth
  async signInStudent(email: string, pass: string): Promise<{ success: boolean; error?: string; profile?: PlayerProfile }> {
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: pass,
        });
        if (error) {
          return { success: false, error: error.message };
        }
        if (data.user) {
          const { data: pData } = await supabase
            .from('profiles_player')
            .select('*')
            .eq('auth_user_id', data.user.id)
            .maybeSingle();

          const current = this.getPlayerProfile();
          const studentProfile: PlayerProfile = {
            ...current,
            isLoggedIn: true,
            email: data.user.email || email,
            studentId: data.user.id,
            nickname: pData?.nickname || data.user.user_metadata?.nickname || email.split('@')[0],
            avatarId: pData?.avatar_id || current.avatarId,
            starsEarned: pData?.stars_earned ?? current.starsEarned,
            totalScore: pData?.total_score ?? current.totalScore,
            quizzesCompleted: pData?.quizzes_completed ?? current.quizzesCompleted,
            grade: pData?.grade_level || current.grade || 1,
          };
          this.savePlayerProfile(studentProfile);
          return { success: true, profile: studentProfile };
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Gagal menghubungi server Supabase';
        return { success: false, error: message };
      }
    }

    // Mock student fallback
    const current = this.getPlayerProfile();
    const mockStudent: PlayerProfile = {
      ...current,
      isLoggedIn: true,
      email,
      studentId: 'student_local_' + Date.now(),
      nickname: email.split('@')[0],
    };
    this.savePlayerProfile(mockStudent);
    return { success: true, profile: mockStudent };
  },

  async signUpStudent(email: string, pass: string, nickname: string, gradeLevel: number = 1): Promise<{ success: boolean; error?: string; profile?: PlayerProfile }> {
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: pass,
          options: {
            data: {
              nickname,
              grade_level: gradeLevel,
            },
          },
        });
        if (error) {
          return { success: false, error: error.message };
        }
        if (data.user) {
          await supabase.from('profiles_player').insert({
            auth_user_id: data.user.id,
            nickname,
            grade_level: gradeLevel,
            avatar_id: this.getPlayerProfile().avatarId,
            stars_earned: this.getPlayerProfile().starsEarned,
            total_score: this.getPlayerProfile().totalScore,
          });

          const studentProfile: PlayerProfile = {
            ...this.getPlayerProfile(),
            isLoggedIn: true,
            email: data.user.email || email,
            studentId: data.user.id,
            nickname,
            grade: gradeLevel,
          };
          this.savePlayerProfile(studentProfile);
          return { success: true, profile: studentProfile };
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Gagal mendaftar akun siswa';
        return { success: false, error: message };
      }
    }

    const mockStudent: PlayerProfile = {
      ...this.getPlayerProfile(),
      isLoggedIn: true,
      email,
      studentId: 'student_local_' + Date.now(),
      nickname,
      grade: gradeLevel,
    };
    this.savePlayerProfile(mockStudent);
    return { success: true, profile: mockStudent };
  },

  async signOutStudent(): Promise<PlayerProfile> {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    const current = this.getPlayerProfile();
    const guestProfile: PlayerProfile = {
      nickname: current.nickname,
      avatarId: current.avatarId,
      totalScore: current.totalScore,
      quizzesCompleted: current.quizzesCompleted,
      starsEarned: current.starsEarned,
      isLoggedIn: false,
    };
    this.savePlayerProfile(guestProfile);
    return guestProfile;
  },

  // 7. Save Quiz Attempt & Update Leaderboard
  async recordQuizAttempt(result: QuizAttemptResult): Promise<void> {
    const player = this.getPlayerProfile();
    
    try {
      const historyStr = localStorage.getItem(STORAGE_KEY_ATTEMPTS) || '[]';
      const history: QuizAttemptResult[] = JSON.parse(historyStr);
      history.unshift(result);
      localStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify(history.slice(0, 100)));

      // Update Player Stats
      player.quizzesCompleted += 1;
      player.totalScore += result.score;
      player.starsEarned += result.stars;
      localStorage.setItem(STORAGE_KEY_PLAYER, JSON.stringify(player));
      
      // Save to Leaderboard
      const leaderboardStr = localStorage.getItem(STORAGE_KEY_LEADERBOARD) || '[]';
      const leaderboard: LeaderboardEntry[] = JSON.parse(leaderboardStr);
      const newEntry: LeaderboardEntry = {
        id: 'entry_' + Date.now(),
        quizId: result.quizId,
        nickname: player.nickname,
        avatarId: player.avatarId,
        score: result.score,
        stars: result.stars,
        timeSpentSec: result.timeSpentSec,
        dateStr: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      };
      leaderboard.unshift(newEntry);
      localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(leaderboard));
    } catch (e) {
      console.warn('Local storage save error:', e);
    }

    if (supabase) {
      try {
        await supabase.from('quiz_attempts').insert({
          quiz_id: result.quizId,
          score: result.score,
          stars: result.stars,
          total_questions: result.totalCount,
          correct_answers: result.correctCount,
          time_spent_sec: result.timeSpentSec,
          player_nickname: player.nickname,
          player_avatar: player.avatarId,
        });
      } catch (err) {
        console.warn('Supabase sync background notice:', err);
      }
    }
  },

  // 8. Get Leaderboard for a Quiz
  async getLeaderboard(quizId: string): Promise<LeaderboardEntry[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('quiz_attempts')
          .select('id, quiz_id, score, stars, time_spent_sec, player_nickname, player_avatar, created_at')
          .eq('quiz_id', quizId)
          .order('score', { ascending: false })
          .order('time_spent_sec', { ascending: true })
          .limit(10);
          
        if (!error && data && data.length > 0) {
          return data.map((d) => ({
            id: d.id,
            quizId: d.quiz_id,
            nickname: d.player_nickname || 'Siswa Berprestasi',
            avatarId: d.player_avatar || 'owl',
            score: d.score,
            stars: d.stars,
            timeSpentSec: d.time_spent_sec,
            dateStr: new Date(d.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          }));
        }
      } catch {
        // Fallback to local
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY_LEADERBOARD);
      let list: LeaderboardEntry[] = stored ? JSON.parse(stored) : [];
      list = list.filter((e) => e.quizId === quizId);

      if (list.length === 0) {
        list = [
          { id: '1', quizId, nickname: 'Rani Ceria', avatarId: 'rabbit', score: 100, stars: 3, timeSpentSec: 42, dateStr: 'Hari ini' },
          { id: '2', quizId, nickname: 'Bima Pintar', avatarId: 'lion', score: 95, stars: 3, timeSpentSec: 49, dateStr: 'Kemarin' },
          { id: '3', quizId, nickname: 'Zahra Juara', avatarId: 'owl', score: 85, stars: 2, timeSpentSec: 56, dateStr: '2 hari lalu' },
        ];
      }

      return list.sort((a, b) => b.score - a.score || a.timeSpentSec - b.timeSpentSec);
    } catch {
      return [];
    }
  },

  // 9. Teacher Gradebook Submissions (Rekap Nilai Siswa)
  async getTeacherSubmissions(quizId?: string): Promise<StudentSubmission[]> {
    if (supabase) {
      try {
        let query = supabase
          .from('quiz_attempts')
          .select(`
            id,
            quiz_id,
            score,
            stars,
            total_questions,
            correct_answers,
            time_spent_sec,
            player_nickname,
            player_avatar,
            created_at,
            quizzes (
              title
            )
          `)
          .order('created_at', { ascending: false })
          .limit(100);

        if (quizId) {
          query = query.eq('quiz_id', quizId);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return (data as any[]).map((d: any) => {
            const qTitle = Array.isArray(d.quizzes) ? d.quizzes[0]?.title : d.quizzes?.title;
            return {
              id: d.id,
              quizId: d.quiz_id,
              quizTitle: qTitle || 'Kuis Interaktif SD',
              studentName: d.player_nickname || 'Siswa Pintar',
              avatarId: d.player_avatar || 'lion',
              score: d.score,
              stars: d.stars,
              correctCount: d.correct_answers,
              totalCount: d.total_questions,
              timeSpentSec: d.time_spent_sec,
              submittedAt: new Date(d.created_at).toLocaleString('id-ID', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              }),
            };
          });
        }
      } catch {
        // fallback
      }
    }

    // Fallback to local storage attempts
    try {
      const historyStr = localStorage.getItem(STORAGE_KEY_ATTEMPTS) || '[]';
      const history: QuizAttemptResult[] = JSON.parse(historyStr);
      const filtered = quizId ? history.filter((h) => h.quizId === quizId) : history;
      return filtered.map((h, i) => ({
        id: 'sub_' + i + '_' + (h.completedAt || Date.now()),
        quizId: h.quizId,
        quizTitle: h.quizTitle,
        studentName: this.getPlayerProfile().nickname,
        avatarId: this.getPlayerProfile().avatarId,
        score: h.score,
        stars: h.stars,
        correctCount: h.correctCount,
        totalCount: h.totalCount,
        timeSpentSec: h.timeSpentSec,
        submittedAt: new Date(h.completedAt).toLocaleString('id-ID', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }));
    } catch {
      return [];
    }
  },

  // 10. Teacher Auth & Profile
  getTeacherProfile(): TeacherProfile | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_TEACHER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setTeacherProfile(profile: TeacherProfile | null) {
    if (profile) {
      localStorage.setItem(STORAGE_KEY_TEACHER_PROFILE, JSON.stringify(profile));
    } else {
      localStorage.removeItem(STORAGE_KEY_TEACHER_PROFILE);
    }
  },

  claimMasterTeacherQuizzes(teacherId: string, teacherName: string) {
    try {
      const customStr = localStorage.getItem(STORAGE_KEY_CUSTOM_QUIZZES);
      let customQuizzes: Quiz[] = customStr ? JSON.parse(customStr) : [];
      let updated = false;
      customQuizzes = customQuizzes.map((q) => {
        if (!q.creatorId || q.creatorId.startsWith('guru_demo_') || q.creatorId.startsWith('teacher_local_')) {
          updated = true;
          return { ...q, creatorId: teacherId, creatorName: teacherName };
        }
        return q;
      });
      if (updated) {
        localStorage.setItem(STORAGE_KEY_CUSTOM_QUIZZES, JSON.stringify(customQuizzes));
      }
    } catch (e) {
      console.warn('Error claiming master teacher quizzes:', e);
    }
  },

  async signInTeacher(email: string, pass: string): Promise<{ success: boolean; error?: string; teacher?: TeacherProfile }> {
    const cleanEmail = email.trim();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: pass,
        });
        if (error) {
          return { success: false, error: error.message };
        }
        if (data.user) {
          const profile: TeacherProfile = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            fullName: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
            schoolName: data.user.user_metadata?.school_name || 'SD Negeri Favorit',
          };
          this.setTeacherProfile(profile);
          if (cleanEmail.toLowerCase() === MASTER_TEACHER_EMAIL.toLowerCase()) {
            this.claimMasterTeacherQuizzes(profile.id, profile.fullName);
          }
          return { success: true, teacher: profile };
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Gagal menghubungi server Supabase';
        return { success: false, error: message };
      }
    }

    // Offline / Local fallback teacher session
    const mockTeacher: TeacherProfile = {
      id: cleanEmail.toLowerCase() === MASTER_TEACHER_EMAIL.toLowerCase() ? 'teacher_master_zy0x' : 'teacher_local_' + Date.now(),
      email: cleanEmail,
      fullName: cleanEmail.toLowerCase() === MASTER_TEACHER_EMAIL.toLowerCase() ? 'Bapak Aliridho (Master)' : cleanEmail.split('@')[0],
      schoolName: 'SD Kreatif Nusantara',
    };
    this.setTeacherProfile(mockTeacher);
    if (cleanEmail.toLowerCase() === MASTER_TEACHER_EMAIL.toLowerCase()) {
      this.claimMasterTeacherQuizzes(mockTeacher.id, mockTeacher.fullName);
    }
    return { success: true, teacher: mockTeacher };
  },

  async signUpTeacher(email: string, pass: string, fullName: string, schoolName: string): Promise<{ success: boolean; error?: string; teacher?: TeacherProfile }> {
    const cleanEmail = email.trim();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: pass,
          options: {
            data: {
              full_name: fullName,
              school_name: schoolName,
            },
          },
        });
        if (error) {
          return { success: false, error: error.message };
        }
        if (data.user) {
          const profile: TeacherProfile = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            fullName,
            schoolName,
          };
          this.setTeacherProfile(profile);
          if (cleanEmail.toLowerCase() === MASTER_TEACHER_EMAIL.toLowerCase()) {
            this.claimMasterTeacherQuizzes(profile.id, profile.fullName);
          }
          return { success: true, teacher: profile };
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Gagal mendaftar ke server Supabase';
        return { success: false, error: message };
      }
    }

    const mockTeacher: TeacherProfile = {
      id: cleanEmail.toLowerCase() === MASTER_TEACHER_EMAIL.toLowerCase() ? 'teacher_master_zy0x' : 'teacher_local_' + Date.now(),
      email: cleanEmail,
      fullName,
      schoolName,
    };
    this.setTeacherProfile(mockTeacher);
    if (cleanEmail.toLowerCase() === MASTER_TEACHER_EMAIL.toLowerCase()) {
      this.claimMasterTeacherQuizzes(mockTeacher.id, mockTeacher.fullName);
    }
    return { success: true, teacher: mockTeacher };
  },

  async signOutTeacher() {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    this.setTeacherProfile(null);
  },

  // 11. Quick Math Quiz Generator
  generateQuickMathQuiz(grade: number, count: number = 5): Quiz {
    const questions: QuizQuestion[] = [];
    const pin = generateRandomPin();

    for (let i = 0; i < count; i++) {
      let text = '';
      let correctAnswer = 0;
      let explanation = '';

      if (grade === 1 || grade === 2) {
        // Simple addition & subtraction (under 20 for grade 1, under 50 for grade 2)
        const max = grade === 1 ? 15 : 40;
        const a = Math.floor(Math.random() * max) + 2;
        const b = Math.floor(Math.random() * max) + 1;
        const isAdd = Math.random() > 0.4;

        if (isAdd) {
          correctAnswer = a + b;
          text = `Berapakah hasil dari ${a} + ${b}?`;
          explanation = `Hasil penjumlahan ${a} ditambah ${b} adalah ${correctAnswer}.`;
        } else {
          const bigger = Math.max(a, b);
          const smaller = Math.min(a, b);
          correctAnswer = bigger - smaller;
          text = `Berapakah hasil dari ${bigger} - ${smaller}?`;
          explanation = `Hasil pengurangan ${bigger} dikurang ${smaller} adalah ${correctAnswer}.`;
        }
      } else if (grade === 3 || grade === 4) {
        // Multiplication & Division
        const isMul = Math.random() > 0.4;
        const a = Math.floor(Math.random() * 9) + 2;
        const b = Math.floor(Math.random() * 9) + 2;

        if (isMul) {
          correctAnswer = a * b;
          text = `Berapakah hasil dari perkalian ${a} × ${b}?`;
          explanation = `${a} dikalikan ${b} adalah ${correctAnswer}.`;
        } else {
          const product = a * b;
          correctAnswer = a;
          text = `Berapakah hasil pembagian dari ${product} ÷ ${b}?`;
          explanation = `${product} dibagi ${b} menghasilkan ${correctAnswer}.`;
        }
      } else {
        // Grade 5 & 6 (Fractions, Percentages, Multi-step)
        const type = Math.floor(Math.random() * 3);
        if (type === 0) {
          const a = (Math.floor(Math.random() * 8) + 2) * 10;
          const b = Math.floor(Math.random() * 5) + 2;
          correctAnswer = a * b + 15;
          text = `Hitunglah operasi hitung campuran: (${a} × ${b}) + 15 = ...`;
          explanation = `Kerjakan perkalian terlebih dahulu: ${a} × ${b} = ${a * b}. Lalu jumlahkan dengan 15 menjadi ${correctAnswer}.`;
        } else if (type === 1) {
          const percent = [10, 20, 25, 50][Math.floor(Math.random() * 4)];
          const base = [100, 200, 400, 500][Math.floor(Math.random() * 4)];
          correctAnswer = (percent / 100) * base;
          text = `Berapakah ${percent}% dari ${base}?`;
          explanation = `${percent}% dari ${base} adalah (${percent}/100) × ${base} = ${correctAnswer}.`;
        } else {
          const a = Math.floor(Math.random() * 15) + 10;
          const b = Math.floor(Math.random() * 10) + 5;
          correctAnswer = a * a + b;
          text = `Berapakah hasil dari ${a}² + ${b}?`;
          explanation = `${a}² = ${a * a}, lalu ditambah ${b} = ${correctAnswer}.`;
        }
      }

      // Generate 3 plausible distractors
      const distractors = new Set<number>();
      distractors.add(correctAnswer + 1);
      distractors.add(Math.max(1, correctAnswer - 1));
      distractors.add(correctAnswer + (Math.random() > 0.5 ? 2 : -2));
      distractors.add(correctAnswer + 10);
      distractors.delete(correctAnswer);

      const options = [correctAnswer.toString(), ...Array.from(distractors).slice(0, 3).map(String)];
      // Shuffle options
      const shuffledOptions = [...options].sort(() => Math.random() - 0.5);
      const correctIndex = shuffledOptions.indexOf(correctAnswer.toString());

      questions.push({
        id: `gen_q_${i + 1}_${Date.now()}`,
        text,
        type: 'multiple_choice',
        options: shuffledOptions,
        correctIndex,
        explanation,
      });
    }

    const newQuiz: Quiz = {
      id: `custom_math_g${grade}_${Date.now()}`,
      title: `Latihan Kilat Matematika Kelas ${grade}`,
      description: `Soal hitung cepat otomatis tingkat Kelas ${grade} SD dengan waktu terukur.`,
      subject: 'Matematika',
      grade,
      durationPerQuestionSec: 25,
      coverEmoji: '⚡',
      themeColor: 'from-blue-600 to-cyan-500',
      badgeTitle: 'Master Berhitung',
      pinCode: pin,
      creatorName: 'Generator Guru Pintar',
      questions,
    };

    return newQuiz;
  },
};
