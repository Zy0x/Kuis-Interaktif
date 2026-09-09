import { createClient } from '@supabase/supabase-js';
import type { LeaderboardEntry, QuizAttemptResult } from '../types/quiz';

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

export const DataManager = {
  // 1. Get Player Profile
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

  // 2. Save Quiz Attempt & Update Leaderboard
  async recordQuizAttempt(result: QuizAttemptResult): Promise<void> {
    const player = this.getPlayerProfile();
    
    // Save to Local Attempts History
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

    // Sync to user Supabase if configured
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

  // 3. Get Leaderboard for a Quiz
  async getLeaderboard(quizId: string): Promise<LeaderboardEntry[]> {
    // If Supabase is connected, try to fetch real-time
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

    // Local Storage fallback with default seed leaderboard
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LEADERBOARD);
      let list: LeaderboardEntry[] = stored ? JSON.parse(stored) : [];
      list = list.filter((e) => e.quizId === quizId);

      // Default mock champions if list is empty
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
