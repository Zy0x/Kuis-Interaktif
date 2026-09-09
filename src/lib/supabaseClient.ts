import { createClient } from '@supabase/supabase-js';
import type { LeaderboardEntry, QuizAttemptResult, Quiz } from '../types/quiz';
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

// Dual-Storage Manager (Local Storage reactive fallback + Supabase Sync)
const STORAGE_KEY_LEADERBOARD = 'kuis_sd_leaderboard_v1';
const STORAGE_KEY_ATTEMPTS = 'kuis_sd_attempts_v1';
const STORAGE_KEY_PLAYER = 'kuis_sd_player_profile';
const STORAGE_KEY_CUSTOM_QUIZZES = 'kuis_sd_custom_quizzes_v1';

export const DataManager = {
  // 1. Get All Quizzes (Default Seeds + Teacher Custom Quizzes)
  getAllQuizzes(): Quiz[] {
    try {
      const customStr = localStorage.getItem(STORAGE_KEY_CUSTOM_QUIZZES);
      const customQuizzes: Quiz[] = customStr ? JSON.parse(customStr) : [];
      return [...customQuizzes, ...INITIAL_QUIZZES];
    } catch {
      return INITIAL_QUIZZES;
    }
  },

  // 2. Save Custom Quiz Created by Teacher
  async saveCustomQuiz(quiz: Quiz): Promise<void> {
    try {
      const customStr = localStorage.getItem(STORAGE_KEY_CUSTOM_QUIZZES);
      let customQuizzes: Quiz[] = customStr ? JSON.parse(customStr) : [];
      // If already exists, replace; else prepend
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
        await supabase.from('quizzes').insert({
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          subject: quiz.subject,
          target_grade: quiz.grade,
          duration_per_question_sec: quiz.durationPerQuestionSec,
          cover_emoji: quiz.coverEmoji,
          theme_color: quiz.themeColor,
          badge_title: quiz.badgeTitle,
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
        await supabase.from('quiz_questions').insert(formattedQuestions);
      } catch (err) {
        console.warn('Supabase quiz sync background notice:', err);
      }
    }
  },

  // 3. Delete Custom Quiz
  deleteCustomQuiz(quizId: string): void {
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
  },

  // 4. Get Player Profile
  getPlayerProfile() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PLAYER);
      if (data) return JSON.parse(data);
    } catch {
      // ignore
    }
    return {
      nickname: 'Bintang SD',
      avatarId: 'lion',
      totalScore: 0,
      quizzesCompleted: 0,
      starsEarned: 0,
    };
  },

  savePlayerProfile(profile: { nickname: string; avatarId: string }) {
    const current = this.getPlayerProfile();
    const updated = { ...current, ...profile };
    localStorage.setItem(STORAGE_KEY_PLAYER, JSON.stringify(updated));
    return updated;
  },

  // 5. Save Quiz Attempt & Update Leaderboard
  async recordQuizAttempt(result: QuizAttemptResult): Promise<void> {
    const player = this.getPlayerProfile();
    
    try {
      const historyStr = localStorage.getItem(STORAGE_KEY_ATTEMPTS) || '[]';
      const history: QuizAttemptResult[] = JSON.parse(historyStr);
      history.unshift(result);
      localStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify(history.slice(0, 50)));

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

  // 6. Get Leaderboard for a Quiz
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
};
