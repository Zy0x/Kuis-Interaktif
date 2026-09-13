import { createClient } from '@supabase/supabase-js';
import type { 
  LeaderboardEntry, 
  QuizAttemptResult, 
  Quiz, 
  QuizQuestion,
  TeacherProfile, 
  StudentSubmission,
  PlayerProfile,
  GameMode,
  EducationLevel,
  QuizSession,
  QuizSessionParticipant,
  QuizSessionParticipantAnswer,
  QuizSessionStatus,
  QuizSessionSettings,
  SessionLiveReaction,
  SessionChatMessage,
} from '../types/quiz';
import { MASTER_TEACHER_EMAIL } from '../types/quiz';
import { INITIAL_QUIZZES } from '../data/seedQuizzes';
import { deleteQuizDriveFolder } from './driveUploadService';
import { offlineQueue } from './offlineQueue';

const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || (globalThis as any).process?.env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || (globalThis as any).process?.env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  !SUPABASE_URL.includes('your-supabase')
);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Flush antrean offline saat peramban kembali online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (supabase) {
      offlineQueue.flushQueue(supabase);
    }
  });
}


// Local Storage Keys
const STORAGE_KEY_LEADERBOARD = 'kuis_sd_leaderboard_v1';
const STORAGE_KEY_ATTEMPTS = 'kuis_sd_attempts_v1';
const STORAGE_KEY_PLAYER = 'kuis_sd_player_profile';
const STORAGE_KEY_CUSTOM_QUIZZES = 'kuis_sd_custom_quizzes_v1';
const STORAGE_KEY_TEACHER_PROFILE = 'kuis_sd_teacher_profile_v1';
const STORAGE_KEY_DELETED_QUIZZES = 'kuis_sd_deleted_quizzes_v1';
const STORAGE_KEY_QUIZ_SESSIONS = 'kuis_sd_quiz_sessions_v1';

// RFC4122 Standard UUID Generator
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 4-Digit Static Master PIN Helper
export function generateRandomPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// 6-Digit Dynamic Live Game Room PIN Helper (Ephemeral & Isolated)
export function generateLiveGamePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Ensure seed quizzes have friendly fallback PINs
INITIAL_QUIZZES.forEach((q, idx) => {
  if (!q.pinCode) {
    q.pinCode = (1001 + idx).toString();
  }
});

// Real-time Session Broadcast Channel & Event Sync
let sessionBroadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    sessionBroadcastChannel = new BroadcastChannel('kuis_realtime_session_sync');
  }
} catch (e) {
  console.warn('BroadcastChannel initialization notice:', e);
}

export function broadcastSessionUpdate(session: QuizSession) {
  try {
    if (sessionBroadcastChannel) {
      sessionBroadcastChannel.postMessage({
        type: 'SESSION_UPDATED',
        sessionId: session.id,
        pinCode: session.pinCode,
        quizId: session.quizId,
        session,
        timestamp: Date.now(),
      });
    }
  } catch (err) {
    console.warn('BroadcastChannel postMessage error:', err);
  }

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('kuis_session_updated', {
          detail: { session },
        })
      );
    } catch {}
  }
}

export function broadcastLiveReaction(sessionId: string, reaction: SessionLiveReaction) {
  try {
    if (sessionBroadcastChannel) {
      sessionBroadcastChannel.postMessage({
        type: 'LIVE_REACTION',
        sessionId,
        reaction,
        timestamp: Date.now(),
      });
    }
  } catch (err) {
    console.warn('BroadcastChannel reaction error:', err);
  }

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('kuis_live_reaction', {
          detail: { sessionId, reaction },
        })
      );
    } catch {}
  }
}

export function broadcastChatMessage(sessionId: string, message: SessionChatMessage) {
  try {
    if (sessionBroadcastChannel) {
      sessionBroadcastChannel.postMessage({
        type: 'NEW_CHAT_MESSAGE',
        sessionId,
        message,
        timestamp: Date.now(),
      });
    }
  } catch (err) {
    console.warn('BroadcastChannel chat message error:', err);
  }

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('kuis_chat_message', {
          detail: { sessionId, message },
        })
      );
    } catch {}
  }
}

export const DataManager = {
  // Deleted Quizzes Tracking (Supports deleting seed quizzes & custom quizzes for testing & admin control)
  getDeletedQuizIds(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DELETED_QUIZZES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  restoreDefaultQuizzes(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_DELETED_QUIZZES);
    } catch (e) {
      console.warn('Error restoring default quizzes:', e);
    }
  },

  // 1. Get All Quizzes (Default Seeds + Teacher Custom Quizzes - Filtered by Deletion)
  getAllQuizzes(options?: { publicOnly?: boolean; teacherEmail?: string; teacherId?: string }): Quiz[] {
    try {
      const deletedIds = new Set(this.getDeletedQuizIds());
      const customStr = localStorage.getItem(STORAGE_KEY_CUSTOM_QUIZZES);
      let customQuizzes: Quiz[] = customStr ? JSON.parse(customStr) : [];
      // Saring kuis kustom yang belum dihapus
      customQuizzes = customQuizzes.filter((q) => !deletedIds.has(q.id));

      const customIds = new Set(customQuizzes.map((q) => q.id));
      // Saring kuis bawaan (seed) yang belum dihapus dan belum dimodifikasi di custom quizzes
      const activeSeeds = INITIAL_QUIZZES.filter((q) => !deletedIds.has(q.id) && !customIds.has(q.id));

      // If teacher options are provided
      if (options?.teacherEmail) {
        const isMaster = options.teacherEmail.trim().toLowerCase() === MASTER_TEACHER_EMAIL.toLowerCase();
        if (isMaster) {
          const teacherId = options.teacherId || 'teacher_master_zy0x';
          const teacherName = this.getTeacherProfile()?.fullName || 'Bapak Aliridho (Master)';

          // Migrasikan kepemilikan custom quizzes ke Master Teacher / Admin
          let changed = false;
          customQuizzes = customQuizzes.map((q) => {
            if (!q.creatorId || q.creatorId.startsWith('guru_demo_') || q.creatorId.startsWith('teacher_local_') || q.creatorId === teacherId || q.creatorId === 'teacher_master_zy0x') {
              changed = true;
              return { ...q, creatorId: teacherId, creatorName: teacherName };
            }
            return q;
          });
          if (changed) {
            localStorage.setItem(STORAGE_KEY_CUSTOM_QUIZZES, JSON.stringify(customQuizzes));
          }

          // Migrasikan kepemilikan kuis aktif seed ke Master Teacher / Admin agar terikat sah ke akun admin
          const claimedSeeds = activeSeeds.map((q) => ({
            ...q,
            creatorId: teacherId,
            creatorName: teacherName,
          }));

          return [...customQuizzes, ...claimedSeeds];
        } else {
          // Guru lain hanya melihat dan mengelola kuis buatannya sendiri
          return customQuizzes.filter((q) => q.creatorId === options.teacherId);
        }
      }

      let all = [...customQuizzes, ...activeSeeds];

      // If public catalog filter is requested (for student & guest dashboard)
      if (options?.publicOnly) {
        all = all.filter((q) => q.visibility !== 'private');
      }

      return all;
    } catch {
      const deletedIds = new Set(this.getDeletedQuizIds());
      const seeds = INITIAL_QUIZZES.filter((q) => !deletedIds.has(q.id));
      return options?.publicOnly ? seeds.filter((q) => q.visibility !== 'private') : seeds;
    }
  },

  // 1b. Check Supabase Cloud Connection & Schema Cache
  async checkSupabaseHealth(): Promise<{
    connected: boolean;
    configured: boolean;
    tablesReady: boolean;
    message: string;
    details?: string;
  }> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        connected: false,
        configured: false,
        tablesReady: false,
        message: 'Kredensial Supabase (.env) belum dikonfigurasi.',
      };
    }

    try {
      const { error } = await supabase.from('quizzes').select('id').limit(1);

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
          return {
            connected: true,
            configured: true,
            tablesReady: false,
            message: 'Tabel database belum dibuat di Supabase.',
            details: 'Jalankan skrip docs/setup.sql di Supabase SQL Editor untuk mengaktifkan seluruh tabel.',
          };
        }
        return {
          connected: false,
          configured: true,
          tablesReady: false,
          message: `Koneksi Supabase notice: ${error.message}`,
          details: error.details || error.hint || undefined,
        };
      }

      return {
        connected: true,
        configured: true,
        tablesReady: true,
        message: 'Database Supabase aktif dan terhubung sempurna.',
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        connected: false,
        configured: true,
        tablesReady: false,
        message: `Gagal menghubungi Supabase: ${msg}`,
      };
    }
  },

  // 1c. Fetch All Quizzes directly from Supabase Cloud (with live sync & fallback)
  async fetchQuizzesFromCloud(options?: { publicOnly?: boolean; teacherEmail?: string; teacherId?: string }): Promise<Quiz[]> {
    if (!supabase) {
      return this.getAllQuizzes(options);
    }

    try {
      let query = supabase
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
          creator_id,
          creator_name,
          visibility,
          is_published,
          default_game_mode,
          shuffle_questions,
          shuffle_options,
          drive_folder_id,
          created_at,
          quiz_questions (
            id,
            question_text,
            question_type,
            image_url,
            image_caption,
            options,
            correct_index,
            explanation,
            order_number,
            acceptable_answers,
            matching_pairs,
            custom_duration_sec,
            points
          )
        `);

      if (options?.publicOnly) {
        query = query.neq('visibility', 'private');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error || !data) {
        console.warn('Supabase fetch quizzes notice:', error);
        return this.getAllQuizzes(options);
      }

      const deletedIds = new Set(this.getDeletedQuizIds());

      const cloudQuizzes: Quiz[] = data
        .filter((row: any) => !deletedIds.has(row.id))
        .map((row: any) => {
          const rawQuestions = (row.quiz_questions as Array<{
            id: string;
            question_text: string;
            question_type: string;
            image_url: string | null;
            image_caption: string | null;
            options: any;
            correct_index: number;
            explanation: string;
            order_number: number;
            acceptable_answers?: string[];
            matching_pairs?: { left: string; right: string }[];
            custom_duration_sec?: number;
            points?: number;
          }>) || [];

          rawQuestions.sort((a, b) => (a.order_number || 0) - (b.order_number || 0));

          return {
            id: row.id,
            title: row.title,
            description: row.description || '',
            subject: row.subject as Quiz['subject'],
            grade: row.target_grade,
            durationPerQuestionSec: row.duration_per_question_sec,
            coverEmoji: row.cover_emoji || '⭐',
            themeColor: row.theme_color || 'from-blue-500 to-indigo-600',
            badgeTitle: row.badge_title || 'Bintang Juara',
            pinCode: row.pin_code,
            creatorId: row.creator_id || undefined,
            creatorName: row.creator_name || 'Guru SD',
            educationLevel: (row.education_level as EducationLevel) || (row.target_grade >= 10 ? 'SMA' : row.target_grade >= 7 ? 'SMP' : 'SD'),
            visibility: (row.visibility as 'public' | 'private') || 'public',
            defaultGameMode: (row.default_game_mode as GameMode) || 'standard',
            shuffleQuestions: Boolean(row.shuffle_questions),
            shuffleOptions: Boolean(row.shuffle_options),
            driveFolderId: row.drive_folder_id || undefined,
            createdAt: row.created_at,
            questions: rawQuestions.map((q) => {
              const rawOpts = Array.isArray(q.options) ? q.options : (typeof q.options === 'string' ? JSON.parse(q.options || '[]') : []);
              const distractors = rawOpts
                .filter((opt: string) => typeof opt === 'string' && opt.startsWith('__distractor__:'))
                .map((opt: string) => opt.replace('__distractor__:', ''));
              const cleanOptions = rawOpts.filter((opt: string) => typeof opt !== 'string' || !opt.startsWith('__distractor__:'));

              return {
                id: q.id,
                text: q.question_text,
                type: q.question_type as QuizQuestion['type'],
                imageUrl: q.image_url || undefined,
                imageCaption: q.image_caption || undefined,
                options: cleanOptions,
                correctIndex: q.correct_index,
                explanation: q.explanation || '',
                acceptableAnswers: q.acceptable_answers || undefined,
                matchingPairs: q.matching_pairs || undefined,
                distractors: distractors.length > 0 ? distractors : undefined,
                customDurationSec: q.custom_duration_sec || undefined,
                points: q.points ?? 10,
              };
            }),
          };
        });

      // Ensure active seed quizzes not present in cloud are merged
      const cloudIds = new Set(cloudQuizzes.map((q) => q.id));
      const activeSeeds = INITIAL_QUIZZES.filter((q) => !deletedIds.has(q.id) && !cloudIds.has(q.id));
      const allQuizzesCombined = [...cloudQuizzes, ...activeSeeds];

      let finalQuizzes = allQuizzesCombined;
      if (options?.teacherEmail) {
        const isMaster = options.teacherEmail.trim().toLowerCase() === MASTER_TEACHER_EMAIL.toLowerCase();
        if (!isMaster && options.teacherId) {
          finalQuizzes = finalQuizzes.filter((q) => q.creatorId === options.teacherId);
        }
      }

      // Sync cloud quizzes with local custom cache for high-availability offline capability
      if (cloudQuizzes.length > 0) {
        try {
          const currentCustomStr = localStorage.getItem(STORAGE_KEY_CUSTOM_QUIZZES);
          const currentCustom: Quiz[] = currentCustomStr ? JSON.parse(currentCustomStr) : [];
          const cloudMap = new Map(cloudQuizzes.map((q) => [q.id, q]));

          const merged = [...cloudQuizzes];
          for (const localQ of currentCustom) {
            if (!cloudMap.has(localQ.id) && !deletedIds.has(localQ.id)) {
              merged.push(localQ);
            }
          }
          localStorage.setItem(STORAGE_KEY_CUSTOM_QUIZZES, JSON.stringify(merged));
        } catch (cacheErr) {
          console.warn('Cache sync error:', cacheErr);
        }
      }

      return finalQuizzes.length > 0 ? finalQuizzes : this.getAllQuizzes(options);
    } catch (err) {
      console.warn('fetchQuizzesFromCloud error, falling back to local:', err);
      return this.getAllQuizzes(options);
    }
  },

  // 2. Find Quiz by PIN (Online Supabase + Offline Fallback)
  async getQuizByPin(pin: string): Promise<Quiz | null> {
    const cleanPin = pin.trim().toUpperCase();
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
            default_game_mode,
            shuffle_questions,
            shuffle_options,
            drive_folder_id,
            quiz_questions (
              id,
              question_text,
              question_type,
              image_url,
              image_caption,
              options,
              correct_index,
              explanation,
              order_number,
              acceptable_answers,
              matching_pairs,
              custom_duration_sec,
              points
            )
          `)
          .eq('pin_code', cleanPin)
          .maybeSingle();

        if (!error && data) {
          if (this.getDeletedQuizIds().includes(data.id)) return null;
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
            acceptable_answers?: string[];
            matching_pairs?: { left: string; right: string }[];
            custom_duration_sec?: number;
            points?: number;
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
            defaultGameMode: (data.default_game_mode as GameMode) || 'standard',
            shuffleQuestions: Boolean(data.shuffle_questions),
            shuffleOptions: Boolean(data.shuffle_options),
            driveFolderId: data.drive_folder_id || undefined,
            questions: rawQuestions.map((q) => {
              const rawOpts = Array.isArray(q.options) ? q.options : (typeof q.options === 'string' ? JSON.parse(q.options || '[]') : []);
              const distractors = rawOpts
                .filter((opt: string) => typeof opt === 'string' && opt.startsWith('__distractor__:'))
                .map((opt: string) => opt.replace('__distractor__:', ''));
              const cleanOptions = rawOpts.filter((opt: string) => typeof opt !== 'string' || !opt.startsWith('__distractor__:'));

              return {
                id: q.id,
                text: q.question_text,
                type: q.question_type as QuizQuestion['type'],
                imageUrl: q.image_url || undefined,
                imageCaption: q.image_caption || undefined,
                options: cleanOptions,
                correctIndex: q.correct_index,
                explanation: q.explanation || '',
                acceptableAnswers: q.acceptable_answers || undefined,
                matchingPairs: q.matching_pairs || undefined,
                distractors: distractors.length > 0 ? distractors : undefined,
                customDurationSec: q.custom_duration_sec || undefined,
                points: q.points ?? 10,
              };
            }),
          };

          return formattedQuiz;
        }
      } catch (e) {
        console.warn('Supabase PIN lookup notice:', e);
      }
    }

    // 2. Fallback to Local Quizzes & Seed Quizzes
    const all = this.getAllQuizzes();
    const match = all.find((q) => (q.pinCode && q.pinCode.trim().toUpperCase() === cleanPin) || (q.id && q.id.trim().toUpperCase() === cleanPin));
    return match || null;
  },

  // 3. Find Quiz by ID
  async getQuizById(id: string): Promise<Quiz | null> {
    if (this.getDeletedQuizIds().includes(id)) return null;

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
            default_game_mode,
            shuffle_questions,
            shuffle_options,
            drive_folder_id,
            quiz_questions (
              id,
              question_text,
              question_type,
              image_url,
              image_caption,
              options,
              correct_index,
              explanation,
              order_number,
              acceptable_answers,
              matching_pairs,
              custom_duration_sec,
              points
            )
          `)
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          if (this.getDeletedQuizIds().includes(data.id)) return null;
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
            acceptable_answers?: string[];
            matching_pairs?: { left: string; right: string }[];
            custom_duration_sec?: number;
            points?: number;
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
            defaultGameMode: (data.default_game_mode as GameMode) || 'standard',
            shuffleQuestions: Boolean(data.shuffle_questions),
            shuffleOptions: Boolean(data.shuffle_options),
            driveFolderId: data.drive_folder_id || undefined,
            questions: rawQuestions.map((q) => {
              const rawOpts = Array.isArray(q.options) ? q.options : (typeof q.options === 'string' ? JSON.parse(q.options || '[]') : []);
              const distractors = rawOpts
                .filter((opt: string) => typeof opt === 'string' && opt.startsWith('__distractor__:'))
                .map((opt: string) => opt.replace('__distractor__:', ''));
              const cleanOptions = rawOpts.filter((opt: string) => typeof opt !== 'string' || !opt.startsWith('__distractor__:'));

              return {
                id: q.id,
                text: q.question_text,
                type: q.question_type as QuizQuestion['type'],
                imageUrl: q.image_url || undefined,
                imageCaption: q.image_caption || undefined,
                options: cleanOptions,
                correctIndex: q.correct_index,
                explanation: q.explanation || '',
                acceptableAnswers: q.acceptable_answers || undefined,
                matchingPairs: q.matching_pairs || undefined,
                distractors: distractors.length > 0 ? distractors : undefined,
                customDurationSec: q.custom_duration_sec || undefined,
                points: q.points ?? 10,
              };
            }),
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
          default_game_mode: quiz.defaultGameMode || 'standard',
          shuffle_questions: quiz.shuffleQuestions ?? false,
          shuffle_options: quiz.shuffleOptions ?? false,
          drive_folder_id: quiz.driveFolderId || null,
        });

        // Insert questions
        const formattedQuestions = quiz.questions.map((q, idx) => {
          let opts = q.options;
          if (q.type === 'matching_pairs' && q.distractors && q.distractors.length > 0) {
            opts = [...opts, ...q.distractors.map((d) => `__distractor__:${d}`)];
          }
          return {
            quiz_id: quiz.id,
            question_text: q.text,
            question_type: q.type,
            image_url: q.imageUrl || null,
            image_caption: q.imageCaption || null,
            options: opts,
            correct_index: q.correctIndex,
            explanation: q.explanation,
            order_number: idx + 1,
            acceptable_answers: q.acceptableAnswers || null,
            matching_pairs: q.matchingPairs || null,
            custom_duration_sec: q.customDurationSec || null,
            points: q.points ?? 10,
          };
        });
        await supabase.from('quiz_questions').delete().eq('quiz_id', quiz.id);
        await supabase.from('quiz_questions').insert(formattedQuestions);
      } catch (err) {
        console.warn('Supabase quiz sync notice:', err);
      }
    }

    return quiz;
  },

  // 5. Delete Quiz (Strict RBAC Enforced: Admin & Authorized Teachers)
  async deleteQuiz(quizId: string): Promise<void> {
    // RBAC: Hanya akun Guru terautentikasi yang berhak menghapus kuis
    const teacher = this.getTeacherProfile();
    if (!teacher || !teacher.id) {
      console.error('Akses Ditolak (RBAC): Peran Siswa atau Tamu dilarang menghapus kuis.');
      throw new Error('Akses Ditolak: Hanya Guru yang berhak menghapus kuis.');
    }

    try {
      // 1. Simpan ke daftar kuis terhapus (mendukung penghapusan seed quiz maupun kuis kustom)
      const deleted = this.getDeletedQuizIds();
      if (!deleted.includes(quizId)) {
        deleted.push(quizId);
        localStorage.setItem(STORAGE_KEY_DELETED_QUIZZES, JSON.stringify(deleted));
      }

      // 2. Bersihkan dari custom quizzes lokal jika ada
      const customStr = localStorage.getItem(STORAGE_KEY_CUSTOM_QUIZZES);
      if (customStr) {
        let customQuizzes: Quiz[] = JSON.parse(customStr);
        customQuizzes = customQuizzes.filter((q) => q.id !== quizId);
        localStorage.setItem(STORAGE_KEY_CUSTOM_QUIZZES, JSON.stringify(customQuizzes));
      }

      // 2b. Bersihkan sesi terkait kuis ini dari localStorage
      const sessionsStr = localStorage.getItem(STORAGE_KEY_QUIZ_SESSIONS);
      if (sessionsStr) {
        let sessions: QuizSession[] = JSON.parse(sessionsStr);
        sessions = sessions.filter((s) => s.quizId !== quizId);
        localStorage.setItem(STORAGE_KEY_QUIZ_SESSIONS, JSON.stringify(sessions));
      }
    } catch (e) {
      console.warn('Delete quiz error:', e);
    }

    // 3. Auto-cleanup folder Google Drive Pro (non-blocking — tidak menghentikan penghapusan)
    // Harus dilakukan SEBELUM record Supabase dihapus agar drive_folder_id masih bisa diambil
    deleteQuizDriveFolder(quizId).catch((err) =>
      console.warn('Drive folder cleanup warning (non-fatal):', err)
    );

    // 4. Hapus dari Supabase jika terhubung (cascade: hapus sesi & pertanyaan kuis sebelum record kuis)
    if (supabase) {
      try {
        await supabase.from('quiz_sessions').delete().eq('quiz_id', quizId);
        await supabase.from('quiz_questions').delete().eq('quiz_id', quizId);
        await supabase.from('quizzes').delete().eq('id', quizId);
      } catch (err) {
        console.warn('Supabase quiz delete notice:', err);
      }
    }
  },

  deleteCustomQuiz(quizId: string): Promise<void> {
    return this.deleteQuiz(quizId);
  },

  // 5b. Update Quiz Settings (Visibility, Duration, PIN, etc.)
  async updateQuizSettings(quizId: string, updates: Partial<Quiz>): Promise<Quiz> {
    const teacher = this.getTeacherProfile();
    if (!teacher || !teacher.id) {
      console.error('Akses Ditolak (RBAC): Peran Siswa atau Tamu dilarang mengubah konfigurasi kuis.');
      throw new Error('Akses Ditolak: Hanya Guru yang berhak mengubah konfigurasi kuis.');
    }

    let updatedQuiz: Quiz | null = null;

    try {
      const customStr = localStorage.getItem(STORAGE_KEY_CUSTOM_QUIZZES);
      let customQuizzes: Quiz[] = customStr ? JSON.parse(customStr) : [];
      const existingIdx = customQuizzes.findIndex((q) => q.id === quizId);

      if (existingIdx >= 0) {
        updatedQuiz = {
          ...customQuizzes[existingIdx],
          ...updates,
        };
        customQuizzes[existingIdx] = updatedQuiz;
      } else {
        const seedQuiz = INITIAL_QUIZZES.find((q) => q.id === quizId);
        if (seedQuiz) {
          updatedQuiz = {
            ...seedQuiz,
            creatorId: teacher.id,
            creatorName: teacher.fullName,
            ...updates,
          };
          customQuizzes.unshift(updatedQuiz);
        }
      }

      if (updatedQuiz) {
        localStorage.setItem(STORAGE_KEY_CUSTOM_QUIZZES, JSON.stringify(customQuizzes));
      }
    } catch (e) {
      console.warn('Local update quiz settings error:', e);
    }

    if (!updatedQuiz) {
      throw new Error(`Kuis dengan ID "${quizId}" tidak ditemukan.`);
    }

    // Sync to Supabase if connected
    if (supabase) {
      try {
        const dbUpdates: Record<string, unknown> = {};
        if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility;
        if (updates.durationPerQuestionSec !== undefined) dbUpdates.duration_per_question_sec = updates.durationPerQuestionSec;
        if (updates.pinCode !== undefined) dbUpdates.pin_code = updates.pinCode;
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.defaultGameMode !== undefined) dbUpdates.default_game_mode = updates.defaultGameMode;
        if (updates.shuffleQuestions !== undefined) dbUpdates.shuffle_questions = updates.shuffleQuestions;
        if (updates.shuffleOptions !== undefined) dbUpdates.shuffle_options = updates.shuffleOptions;
        if (updates.driveFolderId !== undefined) dbUpdates.drive_folder_id = updates.driveFolderId;

        if (Object.keys(dbUpdates).length > 0) {
          await supabase
            .from('quizzes')
            .update(dbUpdates)
            .eq('id', quizId);
        }
      } catch (err) {
        console.warn('Supabase quiz settings update notice:', err);
      }
    }

    return updatedQuiz;
  },

  // 5c. Duplicate Quiz (Clone questions and metadata with new UUID and clean isolation)
  async duplicateQuiz(quizId: string): Promise<Quiz | null> {
    const original = await this.getQuizById(quizId);
    if (!original) return null;
    const teacher = this.getTeacherProfile();
    const newId = generateUUID();

    // Kloning butir soal dengan UUID baru per soal agar terisolasi sempurna
    const rawQuestions: QuizQuestion[] = original.questions || [];
    const clonedQuestions: QuizQuestion[] = rawQuestions.map((q, idx) => ({
      ...JSON.parse(JSON.stringify(q)),
      id: generateUUID(),
      orderNumber: idx + 1,
    }));

    // PIN master baru yang dipastikan tidak bentrok
    let newPin = generateRandomPin();
    const existingQuizzes = this.getAllQuizzes();
    while (existingQuizzes.some((eq) => eq.pinCode === newPin)) {
      newPin = generateRandomPin();
    }

    const duplicated: Quiz = {
      ...JSON.parse(JSON.stringify(original)),
      id: newId,
      title: `${original.title} (Salinan Saya)`,
      pinCode: newPin,
      creatorId: teacher?.id || 'teacher_custom',
      creatorName: teacher?.fullName || 'Guru Pengguna',
      createdAt: new Date().toISOString(),
      visibility: 'private', // Kuis hasil duplikasi otomatis privat untuk guru tersebut
      questions: clonedQuestions,
      driveFolderId: undefined, // KRUSIAL: Reset driveFolderId agar tidak menimpa/menghapus folder Drive guru asli!
    };

    await this.saveCustomQuiz(duplicated);
    return duplicated;
  },

  // 5c. Update Quiz Visibility (Public vs Private)
  async updateQuizVisibility(quizId: string, visibility: 'public' | 'private'): Promise<void> {
    await this.updateQuizSettings(quizId, { visibility });
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
          try {
            await supabase.from('profiles_player').upsert({
              id: data.user.id,
              auth_user_id: data.user.id,
              email: email.trim(),
              nickname,
              grade_level: gradeLevel,
              avatar_id: this.getPlayerProfile().avatarId,
              stars_earned: this.getPlayerProfile().starsEarned,
              total_score: this.getPlayerProfile().totalScore,
            });
          } catch (e) {
            console.warn('Student profile upsert notice:', e);
          }

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

    const attemptPayload = {
      quiz_id: result.quizId,
      score: result.score,
      stars: result.stars,
      total_questions: result.totalCount,
      correct_answers: result.correctCount,
      time_spent_sec: result.timeSpentSec,
      player_nickname: player.nickname,
      player_avatar: player.avatarId,
    };

    if (supabase && (typeof navigator === 'undefined' || navigator.onLine)) {
      try {
        const { error } = await supabase.from('quiz_attempts').insert(attemptPayload);
        if (error) throw error;
      } catch (err) {
        console.warn('Supabase sync background notice, simpan ke antrean offline:', err);
        offlineQueue.enqueue('quiz_attempt_insert', attemptPayload);
      }
    } else {
      offlineQueue.enqueue('quiz_attempt_insert', attemptPayload);
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
      if (!data) return null;
      const parsed: TeacherProfile = JSON.parse(data);
      // Auto-koreksi nama placeholder lama untuk akun Master Teacher (Bapak Aliridho)
      if (parsed.email?.toLowerCase() === MASTER_TEACHER_EMAIL.toLowerCase()) {
        if (!parsed.fullName || parsed.fullName.includes('Rahmawati')) {
          parsed.fullName = 'Bapak Aliridho (Master)';
          this.setTeacherProfile(parsed);
        }
      }
      return parsed;
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

  async updateTeacherProfile(fullName: string, schoolName: string): Promise<{ success: boolean; error?: string; teacher?: TeacherProfile; cloudSynced?: boolean }> {
    const current = this.getTeacherProfile();
    if (!current) {
      return { success: false, error: 'Sesi pendidik tidak ditemukan. Silakan masuk kembali.' };
    }

    const trimmedName = fullName.trim() || current.fullName;
    const trimmedSchool = schoolName.trim() || current.schoolName || 'SD Indonesia';

    const updated: TeacherProfile = {
      ...current,
      fullName: trimmedName,
      schoolName: trimmedSchool,
    };

    // 1. Simpan ke LocalStorage seketika
    this.setTeacherProfile(updated);

    // Perbarui kepemilikan dan nama author kuis lokal milik guru
    this.claimMasterTeacherQuizzes(updated.id, updated.fullName);

    // Perbarui nama host di sesi kuis lokal
    try {
      const sessStr = localStorage.getItem(STORAGE_KEY_QUIZ_SESSIONS);
      if (sessStr) {
        let sessions: QuizSession[] = JSON.parse(sessStr);
        let sUpdated = false;
        sessions = sessions.map((s) => {
          if (
            (s.teacherEmail && s.teacherEmail.toLowerCase() === updated.email.toLowerCase()) ||
            s.teacherId === updated.id
          ) {
            sUpdated = true;
            return { ...s, teacherName: updated.fullName };
          }
          return s;
        });
        if (sUpdated) {
          localStorage.setItem(STORAGE_KEY_QUIZ_SESSIONS, JSON.stringify(sessions));
        }
      }
    } catch (e) {
      console.warn('Local session sync notice:', e);
    }

    let cloudSynced = false;

    // 2. SINKRONISASI MENYELURUH KE SUPABASE CLOUD
    if (supabase) {
      try {
        // A. Perbarui Auth User Metadata jika terautentikasi
        let authUserId: string | null = null;
        try {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user?.id) {
            authUserId = authData.user.id;
            await supabase.auth.updateUser({
              data: {
                full_name: updated.fullName,
                school_name: updated.schoolName,
              },
            });
          }
        } catch (authErr) {
          console.warn('[Supabase Auth] updateUser notice:', authErr);
        }

        const isUuid = (val?: string | null) => Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

        // B. Cek apakah ada record di profiles_teacher berdasarkan email atau id
        let targetRecordId = updated.id;
        let existingAuthUserId: string | null = null;
        try {
          const { data: existingRows } = await supabase
            .from('profiles_teacher')
            .select('id, auth_user_id')
            .eq('email', updated.email)
            .limit(1);

          if (existingRows && existingRows.length > 0) {
            targetRecordId = existingRows[0].id;
            existingAuthUserId = existingRows[0].auth_user_id;
            // Sinkronkan ID lokal agar konsisten dengan cloud ID
            updated.id = targetRecordId;
            this.setTeacherProfile(updated);
          }
        } catch {}

        const finalAuthUserId = isUuid(authUserId)
          ? authUserId
          : (isUuid(existingAuthUserId) ? existingAuthUserId : (isUuid(updated.id) ? updated.id : null));

        // C. Upsert ke public.profiles_teacher
        const { error: profileError } = await supabase
          .from('profiles_teacher')
          .upsert({
            id: targetRecordId,
            auth_user_id: finalAuthUserId,
            email: updated.email,
            full_name: updated.fullName,
            school_name: updated.schoolName,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });

        if (profileError) {
          console.warn('[Supabase] profiles_teacher upsert notice:', profileError);
        } else {
          cloudSynced = true;
        }

        // D. SINKRONKAN SELURUH DATA KUIS TERKAIT DI TABEL QUIZZES
        try {
          const isMaster = updated.email.toLowerCase() === MASTER_TEACHER_EMAIL.toLowerCase();
          let quizQuery = supabase
            .from('quizzes')
            .update({
              creator_name: updated.fullName,
              updated_at: new Date().toISOString(),
            });

          if (isMaster) {
            quizQuery = quizQuery.or(
              `creator_id.eq.${updated.id},creator_id.eq.${targetRecordId},creator_id.eq.teacher_master_zy0x,creator_id.is.null,creator_name.eq.${current.fullName}`
            );
          } else {
            quizQuery = quizQuery.or(
              `creator_id.eq.${updated.id},creator_id.eq.${targetRecordId}`
            );
          }

          const { error: quizErr } = await quizQuery;
          if (quizErr) {
            console.warn('[Supabase] Quizzes creator_name sync notice:', quizErr);
          }
        } catch (quizSyncErr) {
          console.warn('[Supabase] Quizzes update error:', quizSyncErr);
        }

        // E. SINKRONKAN SELURUH DATA SESI KUIS DI TABEL QUIZ_SESSIONS
        try {
          const { error: sessionErr } = await supabase
            .from('quiz_sessions')
            .update({
              teacher_name: updated.fullName,
            })
            .or(`teacher_email.eq.${updated.email},teacher_id.eq.${updated.id},teacher_id.eq.${targetRecordId}`);

          if (sessionErr) {
            console.warn('[Supabase] quiz_sessions teacher_name sync notice:', sessionErr);
          }
        } catch (sessSyncErr) {
          console.warn('[Supabase] Quiz sessions update error:', sessSyncErr);
        }

        // F. Catat ke tabel AUDIT_LOGS di Supabase
        try {
          await supabase.from('audit_logs').insert({
            action: 'UPDATE_TEACHER_PROFILE',
            table_name: 'profiles_teacher',
            record_id: targetRecordId,
            actor_id: updated.email,
            details: {
              old_name: current.fullName,
              new_name: updated.fullName,
              old_school: current.schoolName,
              new_school: updated.schoolName,
              timestamp: new Date().toISOString(),
            },
          });
        } catch {}

      } catch (err) {
        console.warn('[Supabase] Gagal menyinkronkan pembaruan profil pendidik ke cloud:', err);
      }
    }

    // Broadcast ke seluruh window / tab
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('kuis_teacher_profile_updated', {
            detail: { teacher: updated },
          })
        );
      } catch {}
    }

    return { success: true, teacher: updated, cloudSynced };
  },

  claimMasterTeacherQuizzes(teacherId: string, teacherName: string) {
    try {
      const customStr = localStorage.getItem(STORAGE_KEY_CUSTOM_QUIZZES);
      let customQuizzes: Quiz[] = customStr ? JSON.parse(customStr) : [];
      let updated = false;
      customQuizzes = customQuizzes.map((q) => {
        if (
          !q.creatorId ||
          q.creatorId.startsWith('guru_demo_') ||
          q.creatorId.startsWith('teacher_local_') ||
          q.creatorId === teacherId ||
          q.creatorId === 'teacher_master_zy0x'
        ) {
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
          let fullName = data.user.user_metadata?.full_name;
          let schoolName = data.user.user_metadata?.school_name;

          try {
            const { data: tRow } = await supabase
              .from('profiles_teacher')
              .select('*')
              .or(`id.eq.${data.user.id},auth_user_id.eq.${data.user.id}`)
              .maybeSingle();

            if (tRow) {
              fullName = tRow.full_name || fullName;
              schoolName = tRow.school_name || schoolName;
            }
          } catch {
            // ignore
          }

          let finalFullName = fullName || cleanEmail.split('@')[0];
          let finalSchoolName = schoolName || 'SD Negeri Favorit';

          // Auto-koreksi akun Master Teacher jika di Supabase masih tersimpan nama placeholder lama
          if (cleanEmail.toLowerCase() === MASTER_TEACHER_EMAIL.toLowerCase()) {
            if (!fullName || fullName.includes('Rahmawati')) {
              finalFullName = 'Bapak Aliridho (Master)';
              finalSchoolName = schoolName && !schoolName.includes('Nusantara') ? schoolName : 'SD Kreatif Nusantara';
              try {
                supabase.auth.updateUser({
                  data: { full_name: finalFullName, school_name: finalSchoolName }
                });
                supabase.from('profiles_teacher').upsert({
                  id: data.user.id,
                  auth_user_id: data.user.id,
                  email: cleanEmail,
                  full_name: finalFullName,
                  school_name: finalSchoolName,
                  updated_at: new Date().toISOString()
                });
              } catch (e) {
                console.warn('Auto-sync master teacher profile error:', e);
              }
            }
          }

          const profile: TeacherProfile = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            fullName: finalFullName,
            schoolName: finalSchoolName,
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

          // Upsert to profiles_teacher table in Supabase
          try {
            await supabase.from('profiles_teacher').upsert({
              id: data.user.id,
              auth_user_id: data.user.id,
              email: cleanEmail,
              full_name: fullName,
              school_name: schoolName,
            });
          } catch (e) {
            console.warn('Teacher profile upsert notice:', e);
          }

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
      description: `Soal hitung cepat otomatis tingkat Kelas ${grade} dengan waktu terukur.`,
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

  // 12. Active Quiz Sessions & Wayground Host Manager
  getActiveSessions(filter?: { teacherEmail?: string; status?: QuizSessionStatus }): QuizSession[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_QUIZ_SESSIONS);
      let sessions: QuizSession[] = raw ? JSON.parse(raw) : [];
      if (filter?.teacherEmail) {
        sessions = sessions.filter(
          (s) => !s.teacherEmail || s.teacherEmail.trim().toLowerCase() === filter.teacherEmail!.trim().toLowerCase()
        );
      }
      if (filter?.status) {
        sessions = sessions.filter((s) => s.status === filter.status);
      }
      return sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return [];
    }
  },

  getActiveSessionById(sessionId: string): QuizSession | null {
    const all = this.getActiveSessions();
    return all.find((s) => s.id === sessionId) || null;
  },

  getActiveSessionByPin(pin: string): QuizSession | null {
    const cleanPin = pin.trim().toUpperCase();
    const all = this.getActiveSessions();
    const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
    return all.find((s) => 
      s.pinCode === cleanPin && 
      (s.status === 'active' || s.status === 'waiting' || s.status === 'paused') &&
      (Date.now() - new Date(s.createdAt).getTime() <= THREE_HOURS_MS)
    ) || null;
  },

  getActiveSessionByQuizId(quizId: string): QuizSession | null {
    const cleanId = quizId.trim();
    const all = this.getActiveSessions();
    const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
    return all.find((s) => 
      s.quizId === cleanId && 
      (s.status === 'active' || s.status === 'waiting' || s.status === 'paused') &&
      (Date.now() - new Date(s.createdAt).getTime() <= THREE_HOURS_MS)
    ) || null;
  },

  async createActiveSession(
    quiz: Quiz,
    options: QuizSessionSettings,
    teacher?: TeacherProfile
  ): Promise<QuizSession> {
    const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    
    // SELALU buat PIN Ruang Game Live 6-digit yang dinamis & unik untuk sesi ini!
    // JANGAN PERNAH gunakan quiz.pinCode agar sesi kelas live tidak bocor ke publik atau bertabrakan antar kelas.
    let livePin = generateLiveGamePin();
    const activeSessions = this.getActiveSessions();
    while (activeSessions.some((s) => s.pinCode === livePin && s.status !== 'finished')) {
      livePin = generateLiveGamePin();
    }
    const pin = livePin;

    const isTeacherLed = (options.executionMode || 'teacher_led') === 'teacher_led';
    const newSession: QuizSession = {
      id: sessionId,
      quizId: quiz.id,
      quizTitle: quiz.title,
      quizCover: quiz.coverEmoji,
      subject: quiz.subject,
      grade: quiz.grade,
      pinCode: pin,
      teacherId: teacher?.id,
      teacherEmail: teacher?.email,
      teacherName: teacher?.fullName,
      status: isTeacherLed ? 'waiting' : 'active',
      createdAt: new Date().toISOString(),
      startedAt: isTeacherLed ? undefined : new Date().toISOString(),
      settings: {
        executionMode: options.executionMode || 'teacher_led',
        teacherPacingSubMode: options.teacherPacingSubMode || 'manual',
        isChatMuted: options.isChatMuted ?? false,
        participantMode: options.participantMode || 'individual',
        pacingType: options.pacingType || 'in_class',
        deadlineAt: options.deadlineAt,
        requireStudentInfo: options.requireStudentInfo,
        selectedQuestionIds: options.selectedQuestionIds,
        mode: options.mode,
        durationPerQuestionSec: options.durationPerQuestionSec,
        shuffleQuestions: options.shuffleQuestions,
        shuffleOptions: options.shuffleOptions,
        presentationTarget: options.presentationTarget,
        showAnswersMode: options.showAnswersMode || 'immediate',
        showExplanationMode: options.showExplanationMode || 'immediate',
        showLeaderboardToStudents: options.showLeaderboardToStudents ?? true,
        maxAttempts: options.maxAttempts ?? 0,
        tabSwitchDetection: options.tabSwitchDetection ?? false,
      },
      participants: [],
      totalQuestions: quiz.questions?.length || 0,
      currentQuestionIndex: 0,
      questionState: 'answering',
      reactions: [],
      chatMessages: [],
    };

    // Save locally: supersede any prior active or waiting session for the same PIN or quiz
    const existing = this.getActiveSessions().map((s) => {
      if ((s.pinCode === pin || s.quizId === quiz.id) && (s.status === 'active' || s.status === 'waiting')) {
        return { ...s, status: 'finished' as QuizSessionStatus };
      }
      return s;
    });
    const updated = [newSession, ...existing];
    try {
      localStorage.setItem(STORAGE_KEY_QUIZ_SESSIONS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to cache quiz session locally:', e);
    }

    // Broadcast session update in real time across browser tabs
    broadcastSessionUpdate(newSession);

    // Try cloud sync if Supabase configured
    if (supabase) {
      try {
        // Ensure quiz entity exists in quizzes table so foreign keys don't fail
        const { data: existingQ } = await supabase.from('quizzes').select('id').eq('id', quiz.id).maybeSingle();
        if (!existingQ) {
          await supabase.from('quizzes').upsert({
            id: quiz.id,
            title: quiz.title,
            description: quiz.description || '',
            subject: quiz.subject,
            target_grade: quiz.grade,
            duration_per_question_sec: quiz.durationPerQuestionSec,
            cover_emoji: quiz.coverEmoji || '⭐',
            theme_color: quiz.themeColor || 'from-blue-600 to-cyan-500',
            badge_title: quiz.badgeTitle || 'Bintang Juara',
            pin_code: pin,
            creator_id: teacher?.id || null,
            creator_name: teacher?.fullName || null,
            visibility: quiz.visibility || 'public',
            is_published: true,
            default_game_mode: quiz.defaultGameMode || 'standard',
            shuffle_questions: quiz.shuffleQuestions ?? false,
            shuffle_options: quiz.shuffleOptions ?? false,
          });
        }

        await supabase.from('quiz_sessions').insert({
          id: newSession.id,
          quiz_id: newSession.quizId,
          quiz_title: newSession.quizTitle,
          pin_code: newSession.pinCode,
          teacher_id: newSession.teacherId,
          teacher_email: newSession.teacherEmail,
          teacher_name: newSession.teacherName,
          status: newSession.status,
          settings: newSession.settings,
          total_questions: newSession.totalQuestions,
          created_at: newSession.createdAt,
          started_at: newSession.startedAt,
        });
      } catch (err) {
        console.warn('Supabase createActiveSession notice:', err);
      }
    }

    return newSession;
  },

  async startActiveQuizSession(sessionId: string): Promise<QuizSession | null> {
    const existing = this.getActiveSessions();
    const idx = existing.findIndex((s) => s.id === sessionId);
    if (idx === -1) return null;

    existing[idx].status = 'active';
    existing[idx].startedAt = new Date().toISOString();
    existing[idx].currentQuestionIndex = 0;
    existing[idx].questionState = 'answering';

    try {
      localStorage.setItem(STORAGE_KEY_QUIZ_SESSIONS, JSON.stringify(existing));
    } catch (e) {
      console.warn('Failed to start quiz session:', e);
    }

    broadcastSessionUpdate(existing[idx]);

    if (supabase) {
      try {
        await supabase
          .from('quiz_sessions')
          .update({
            status: 'active',
            started_at: existing[idx].startedAt,
          })
          .eq('id', sessionId);
      } catch (err) {
        console.warn('Supabase startActiveQuizSession notice:', err);
      }
    }

    return existing[idx];
  },

  async advanceSessionQuestion(sessionId: string, newIndex: number): Promise<QuizSession | null> {
    const existing = this.getActiveSessions();
    const idx = existing.findIndex((s) => s.id === sessionId);
    if (idx === -1) return null;

    existing[idx].currentQuestionIndex = newIndex;
    existing[idx].questionState = 'answering';

    try {
      localStorage.setItem(STORAGE_KEY_QUIZ_SESSIONS, JSON.stringify(existing));
    } catch (e) {
      console.warn('Failed to advance session question:', e);
    }

    broadcastSessionUpdate(existing[idx]);

    if (supabase) {
      try {
        await supabase
          .from('quiz_sessions')
          .update({
            current_question_index: newIndex,
            question_state: 'answering',
          })
          .eq('id', sessionId);
      } catch (err) {
        console.warn('Supabase advanceSessionQuestion notice:', err);
      }
    }

    return existing[idx];
  },

  async updateSessionQuestionState(
    sessionId: string,
    state: 'answering' | 'revealed' | 'ended'
  ): Promise<QuizSession | null> {
    const existing = this.getActiveSessions();
    const idx = existing.findIndex((s) => s.id === sessionId);
    if (idx === -1) return null;

    existing[idx].questionState = state;

    try {
      localStorage.setItem(STORAGE_KEY_QUIZ_SESSIONS, JSON.stringify(existing));
    } catch (e) {
      console.warn('Failed to update question state:', e);
    }

    broadcastSessionUpdate(existing[idx]);

    if (supabase) {
      try {
        await supabase
          .from('quiz_sessions')
          .update({
            question_state: state,
          })
          .eq('id', sessionId);
      } catch (err) {
        console.warn('Supabase updateSessionQuestionState notice:', err);
      }
    }

    return existing[idx];
  },

  async toggleSessionChatMute(sessionId: string, isMuted: boolean): Promise<QuizSession | null> {
    const existing = this.getActiveSessions();
    const idx = existing.findIndex((s) => s.id === sessionId);
    if (idx === -1) return null;

    existing[idx].isChatMuted = isMuted;
    existing[idx].settings = {
      ...existing[idx].settings,
      isChatMuted: isMuted,
    };

    try {
      localStorage.setItem(STORAGE_KEY_QUIZ_SESSIONS, JSON.stringify(existing));
    } catch (e) {
      console.warn('Failed to toggle chat mute:', e);
    }

    broadcastSessionUpdate(existing[idx]);

    if (supabase) {
      try {
        await supabase
          .from('quiz_sessions')
          .update({
            settings: existing[idx].settings,
            is_chat_muted: isMuted,
          })
          .eq('id', sessionId);
      } catch (err) {
        console.warn('Supabase toggleSessionChatMute notice:', err);
      }
    }

    return existing[idx];
  },

  async sendSessionReaction(
    sessionId: string,
    reaction: Omit<SessionLiveReaction, 'id' | 'createdAt'>
  ): Promise<SessionLiveReaction | null> {
    const existing = this.getActiveSessions();
    const idx = existing.findIndex((s) => s.id === sessionId);
    if (idx === -1) return null;

    const newReaction: SessionLiveReaction = {
      id: 'react_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      studentName: reaction.studentName,
      senderName: reaction.senderName || reaction.studentName,
      avatarId: reaction.avatarId,
      isTeacher: reaction.isTeacher,
      emoji: reaction.emoji,
      createdAt: Date.now(),
    };

    const currentReactions = existing[idx].reactions || [];
    // Keep last 30 reactions to prevent memory bloat
    existing[idx].reactions = [...currentReactions.slice(-29), newReaction];

    try {
      localStorage.setItem(STORAGE_KEY_QUIZ_SESSIONS, JSON.stringify(existing));
    } catch (e) {
      console.warn('Failed to save reaction:', e);
    }

    broadcastLiveReaction(sessionId, newReaction);
    broadcastSessionUpdate(existing[idx]);

    if (supabase) {
      try {
        await supabase
          .from('quiz_sessions')
          .update({
            reactions: existing[idx].reactions,
          })
          .eq('id', sessionId);
      } catch (err) {
        console.warn('Supabase sendSessionReaction notice:', err);
      }
    }

    return newReaction;
  },

  async sendSessionChatMessage(
    sessionId: string,
    message: Omit<SessionChatMessage, 'id' | 'createdAt'>
  ): Promise<SessionChatMessage | null> {
    const existing = this.getActiveSessions();
    const idx = existing.findIndex((s) => s.id === sessionId);
    if (idx === -1) return null;

    // Check if chat is muted
    if ((existing[idx].isChatMuted || existing[idx].settings?.isChatMuted) && !message.isTeacher) {
      return null;
    }

    // Basic sanitization: strip dangerous HTML tags
    const cleanText = message.text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim()
      .slice(0, 150);

    if (!cleanText) return null;

    const newMsg: SessionChatMessage = {
      id: 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      studentName: message.studentName,
      avatarId: message.avatarId,
      text: cleanText,
      isTeacher: message.isTeacher,
      createdAt: Date.now(),
    };

    const currentChat = existing[idx].chatMessages || [];
    // Keep last 50 chat messages
    existing[idx].chatMessages = [...currentChat.slice(-49), newMsg];

    try {
      localStorage.setItem(STORAGE_KEY_QUIZ_SESSIONS, JSON.stringify(existing));
    } catch (e) {
      console.warn('Failed to save chat message:', e);
    }

    broadcastChatMessage(sessionId, newMsg);
    broadcastSessionUpdate(existing[idx]);

    if (supabase) {
      try {
        await supabase
          .from('quiz_sessions')
          .update({
            chat_messages: existing[idx].chatMessages,
          })
          .eq('id', sessionId);
      } catch (err) {
        console.warn('Supabase sendSessionChatMessage notice:', err);
      }
    }

    return newMsg;
  },

  async recordSessionAnswer(
    sessionId: string,
    participantName: string,
    answer: QuizSessionParticipantAnswer
  ): Promise<QuizSessionParticipant | null> {
    const existing = this.getActiveSessions();
    const sIdx = existing.findIndex((s) => s.id === sessionId);
    if (sIdx === -1) return null;

    const session = existing[sIdx];
    const pIdx = session.participants.findIndex(
      (p) => p.name.trim().toLowerCase() === participantName.trim().toLowerCase()
    );
    if (pIdx === -1) return null;

    const participant = session.participants[pIdx];
    const existingAnswers = participant.answers || {};
    existingAnswers[answer.questionId] = answer;

    // Calculate score
    const totalAnswered = Object.keys(existingAnswers).length;
    const correctCount = Object.values(existingAnswers).filter((a) => a.isCorrect).length;
    const totalQ = session.totalQuestions || 1;
    const score = Math.round((correctCount / totalQ) * 100);
    const stars = score >= 85 ? 3 : score >= 60 ? 2 : score > 0 ? 1 : 0;
    const totalTimeSpent = Object.values(existingAnswers).reduce((acc, a) => acc + (a.timeSpentSec || 0), 0);

    participant.answers = existingAnswers;
    participant.correctCount = correctCount;
    participant.incorrectCount = totalAnswered - correctCount;
    participant.score = score;
    participant.stars = stars;
    participant.timeSpentSec = totalTimeSpent;
    participant.currentQuestionIndex = Math.max(participant.currentQuestionIndex, answer.questionIndex + 1);
    participant.lastActiveAt = new Date().toISOString();

    if (totalAnswered >= totalQ) {
      participant.finished = true;
    }

    session.participants[pIdx] = participant;

    try {
      localStorage.setItem(STORAGE_KEY_QUIZ_SESSIONS, JSON.stringify(existing));
    } catch (e) {
      console.warn('Failed to record session answer:', e);
    }

    broadcastSessionUpdate(session);

    const answerPayload = {
      id: participant.id,
      session_id: sessionId,
      student_name: participant.name,
      avatar_id: participant.avatarId,
      current_question_index: participant.currentQuestionIndex,
      score: participant.score,
      stars: participant.stars,
      correct_count: participant.correctCount,
      incorrect_count: participant.incorrectCount,
      streak: participant.streak,
      finished: participant.finished,
      time_spent_sec: participant.timeSpentSec,
      answers: participant.answers,
      tab_switch_count: participant.tabSwitchCount ?? 0,
      last_active_at: participant.lastActiveAt,
    };

    if (supabase && (typeof navigator === 'undefined' || navigator.onLine)) {
      try {
        const { error } = await supabase.from('quiz_session_participants').upsert(answerPayload, {
          onConflict: 'session_id, student_name',
        });
        if (error) throw error;
      } catch (err) {
        console.warn('Supabase recordSessionAnswer notice, simpan ke antrean offline:', err);
        offlineQueue.enqueue('session_participant_upsert', answerPayload, 'session_id, student_name');
      }
    } else {
      offlineQueue.enqueue('session_participant_upsert', answerPayload, 'session_id, student_name');
    }


    return participant;
  },

  async updateActiveSessionSettings(
    sessionIdOrPinOrQuizId: string,
    settings: Partial<QuizSessionSettings>
  ): Promise<QuizSession | null> {
    const cleanKey = sessionIdOrPinOrQuizId.trim();
    const existing = this.getActiveSessions();
    const idx = existing.findIndex(
      (s) =>
        s.id === cleanKey ||
        s.pinCode.toUpperCase() === cleanKey.toUpperCase() ||
        s.quizId === cleanKey
    );

    if (idx === -1) return null;

    existing[idx].settings = {
      ...existing[idx].settings,
      ...settings,
    };

    try {
      localStorage.setItem(STORAGE_KEY_QUIZ_SESSIONS, JSON.stringify(existing));
    } catch (e) {
      console.warn('Failed to persist session settings update:', e);
    }

    const updatedSession = existing[idx];

    // Broadcast update across tabs and windows
    broadcastSessionUpdate(updatedSession);

    if (supabase) {
      try {
        await supabase
          .from('quiz_sessions')
          .update({
            settings: updatedSession.settings,
          })
          .eq('id', updatedSession.id);
      } catch (err) {
        console.warn('Supabase updateActiveSessionSettings notice:', err);
      }
    }

    return updatedSession;
  },

  async fetchActiveSessionByPin(pin: string): Promise<QuizSession | null> {
    const cleanPin = pin.trim().toUpperCase();
    const local = this.getActiveSessionByPin(cleanPin);

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('quiz_sessions')
          .select(`
            *,
            quiz_session_participants (*)
          `)
          .eq('pin_code', cleanPin)
          .in('status', ['active', 'waiting', 'paused'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data && !error) {
          // AUTO-EXPIRATION: Cek apakah sesi zombi (tidak ada heartbeat / sesi ditinggalkan guru)
          const nowMs = Date.now();
          const sessionTime = new Date(data.created_at).getTime();
          const heartbeatTime = data.last_heartbeat ? new Date(data.last_heartbeat).getTime() : sessionTime;
          const TEN_MINUTES_MS = 10 * 60 * 1000;
          const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

          const isStaleActive = data.status === 'active' && (nowMs - heartbeatTime > TEN_MINUTES_MS);
          const isTooOld = nowMs - sessionTime > THREE_HOURS_MS;

          if (isStaleActive || isTooOld) {
            // Tandai sesi selesai di background agar tidak menggantung
            supabase
              .from('quiz_sessions')
              .update({ status: 'finished', ended_at: new Date().toISOString() })
              .eq('id', data.id)
              .then(() => {}, () => {});
            return null;
          }

          const parts: QuizSessionParticipant[] = (data.quiz_session_participants || []).map((p: any) => ({
            id: p.id,
            name: p.student_name,
            avatarId: p.avatar_id,
            currentQuestionIndex: p.current_question_index,
            totalQuestions: data.total_questions || 0,
            score: p.score,
            stars: p.stars,
            correctCount: p.correct_count,
            incorrectCount: p.incorrect_count,
            streak: p.streak,
            finished: p.finished,
            timeSpentSec: p.time_spent_sec,
            answers: p.answers || {},
            tabSwitchCount: p.tab_switch_count ?? 0,
            joinedAt: p.joined_at,
            lastActiveAt: p.last_active_at,
          }));

          const session: QuizSession = {
            id: data.id,
            quizId: data.quiz_id,
            quizTitle: data.quiz_title,
            quizCover: data.quiz_cover || '⭐',
            subject: data.subject || 'Umum',
            grade: data.grade || 'Semua Kelas',
            pinCode: data.pin_code,
            teacherId: data.teacher_id,
            teacherEmail: data.teacher_email,
            teacherName: data.teacher_name,
            status: data.status,
            createdAt: data.created_at,
            startedAt: data.started_at,
            endedAt: data.ended_at,
            settings: data.settings || {},
            participants: parts.length > 0 ? parts : (local?.participants || []),
            totalQuestions: data.total_questions || 0,
            currentQuestionIndex: data.current_question_index ?? 0,
            questionState: data.question_state || 'answering',
            reactions: Array.isArray(data.reactions) ? data.reactions : (local?.reactions || []),
            chatMessages: Array.isArray(data.chat_messages) ? data.chat_messages : (local?.chatMessages || []),
            isChatMuted: Boolean(data.is_chat_muted ?? local?.isChatMuted),
            lastHeartbeat: data.last_heartbeat,
          };

          const existing = this.getActiveSessions();
          const filtered = existing.filter((s) => s.id !== session.id);
          try {
            localStorage.setItem(STORAGE_KEY_QUIZ_SESSIONS, JSON.stringify([session, ...filtered]));
          } catch {}

          return session;
        }
      } catch (err) {
        console.warn('fetchActiveSessionByPin Supabase notice:', err);
      }
    }

    return local;
  },

  async fetchActiveSessionById(sessionId: string): Promise<QuizSession | null> {
    if (!sessionId) return null;
    const cleanId = sessionId.trim();
    const local = this.getActiveSessionById(cleanId);

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('quiz_sessions')
          .select(`
            *,
            quiz_session_participants (*)
          `)
          .eq('id', cleanId)
          .maybeSingle();

        if (data && !error) {
          const parts: QuizSessionParticipant[] = (data.quiz_session_participants || []).map((p: any) => ({
            id: p.id,
            name: p.student_name,
            avatarId: p.avatar_id,
            currentQuestionIndex: p.current_question_index,
            totalQuestions: data.total_questions || 0,
            score: p.score,
            stars: p.stars,
            correctCount: p.correct_count,
            incorrectCount: p.incorrect_count,
            streak: p.streak,
            finished: p.finished,
            timeSpentSec: p.time_spent_sec,
            answers: p.answers || {},
            tabSwitchCount: p.tab_switch_count ?? 0,
            joinedAt: p.joined_at,
            lastActiveAt: p.last_active_at,
          }));

          const session: QuizSession = {
            id: data.id,
            quizId: data.quiz_id,
            quizTitle: data.quiz_title,
            quizCover: data.quiz_cover || '⭐',
            subject: data.subject || 'Umum',
            grade: data.grade || 'Semua Kelas',
            pinCode: data.pin_code,
            teacherId: data.teacher_id,
            teacherEmail: data.teacher_email,
            teacherName: data.teacher_name,
            status: data.status,
            createdAt: data.created_at,
            startedAt: data.started_at,
            endedAt: data.ended_at,
            settings: data.settings || {},
            participants: parts.length > 0 ? parts : (local?.participants || []),
            totalQuestions: data.total_questions || 0,
            currentQuestionIndex: data.current_question_index ?? 0,
            questionState: data.question_state || 'answering',
            reactions: Array.isArray(data.reactions) ? data.reactions : (local?.reactions || []),
            chatMessages: Array.isArray(data.chat_messages) ? data.chat_messages : (local?.chatMessages || []),
            isChatMuted: Boolean(data.is_chat_muted ?? local?.isChatMuted),
            lastHeartbeat: data.last_heartbeat,
          };

          const existing = this.getActiveSessions();
          const filtered = existing.filter((s) => s.id !== session.id);
          try {
            localStorage.setItem(STORAGE_KEY_QUIZ_SESSIONS, JSON.stringify([session, ...filtered]));
          } catch {}

          return session;
        }
      } catch (err) {
        console.warn('fetchActiveSessionById Supabase notice:', err);
      }
    }

    return local;
  },

  async syncActiveSessionsFromSupabase(
    teacherEmail?: string,
    options?: { limit?: number; offset?: number }
  ): Promise<QuizSession[]> {
    if (!supabase) return this.getActiveSessions({ teacherEmail });
    try {
      // Usahakan flush antrean jawaban offline terlebih dahulu agar database memiliki data teranyar
      offlineQueue.flushQueue(supabase).catch(() => {});

      const limit = Math.min(options?.limit || 50, 100);
      const offset = options?.offset || 0;

      let query = supabase
        .from('quiz_sessions')
        .select(`
          *,
          quiz_session_participants (*)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);


      if (teacherEmail && teacherEmail.trim().toLowerCase() !== MASTER_TEACHER_EMAIL.toLowerCase()) {
        query = query.eq('teacher_email', teacherEmail.trim());
      }

      const { data, error } = await query;
      if (error || !data) {
        return this.getActiveSessions({ teacherEmail });
      }

      const mappedSessions: QuizSession[] = data.map((d: any) => {
        const parts: QuizSessionParticipant[] = (d.quiz_session_participants || []).map((p: any) => ({
          id: p.id,
          name: p.student_name,
          avatarId: p.avatar_id,
          currentQuestionIndex: p.current_question_index,
          totalQuestions: d.total_questions || 0,
          score: p.score,
          stars: p.stars,
          correctCount: p.correct_count,
          incorrectCount: p.incorrect_count,
          streak: p.streak,
          finished: p.finished,
          timeSpentSec: p.time_spent_sec,
          answers: p.answers || {},
          tabSwitchCount: p.tab_switch_count ?? 0,
          joinedAt: p.joined_at,
          lastActiveAt: p.last_active_at,
        }));

        return {
          id: d.id,
          quizId: d.quiz_id,
          quizTitle: d.quiz_title,
          quizCover: d.quiz_cover || '⭐',
          subject: d.subject || 'Umum',
          grade: d.grade || 'Semua Kelas',
          pinCode: d.pin_code,
          teacherId: d.teacher_id,
          teacherEmail: d.teacher_email,
          teacherName: d.teacher_name,
          status: d.status,
          createdAt: d.created_at,
          startedAt: d.started_at,
          endedAt: d.ended_at,
          settings: d.settings || {},
          participants: parts,
          totalQuestions: d.total_questions || 0,
          currentQuestionIndex: d.current_question_index ?? 0,
          questionState: d.question_state || 'answering',
          reactions: Array.isArray(d.reactions) ? d.reactions : [],
          chatMessages: Array.isArray(d.chat_messages) ? d.chat_messages : [],
          isChatMuted: Boolean(d.is_chat_muted),
          lastHeartbeat: d.last_heartbeat,
        };
      });

      const local = this.getActiveSessions();
      const cloudIds = new Set(mappedSessions.map((s) => s.id));
      const nonCloudLocal = local.filter((s) => !cloudIds.has(s.id));
      const merged = [...mappedSessions, ...nonCloudLocal];

      try {
        localStorage.setItem(STORAGE_KEY_QUIZ_SESSIONS, JSON.stringify(merged));
      } catch {}

      if (teacherEmail) {
        return merged.filter(
          (s) => !s.teacherEmail || s.teacherEmail.trim().toLowerCase() === teacherEmail.trim().toLowerCase()
        );
      }
      return merged;
    } catch (err) {
      console.warn('syncActiveSessionsFromSupabase error:', err);
      return this.getActiveSessions({ teacherEmail });
    }
  },

  async updateSessionStatus(sessionId: string, status: QuizSessionStatus): Promise<QuizSession | null> {
    const existing = this.getActiveSessions();
    const idx = existing.findIndex((s) => s.id === sessionId);
    if (idx === -1) return null;

    existing[idx].status = status;
    if (status === 'finished') {
      existing[idx].endedAt = new Date().toISOString();
    }

    try {
      localStorage.setItem(STORAGE_KEY_QUIZ_SESSIONS, JSON.stringify(existing));
    } catch (e) {
      console.warn('Failed to save session status:', e);
    }

    // Broadcast session update
    broadcastSessionUpdate(existing[idx]);

    if (supabase) {
      try {
        await supabase
          .from('quiz_sessions')
          .update({
            status,
            ended_at: existing[idx].endedAt,
          })
          .eq('id', sessionId);

        // Jika sesi telah berakhir (finished), sinkronkan rekapitulasi nilai peserta ke tabel quiz_attempts
        if (status === 'finished') {
          const finishedSession = existing[idx];
          if (finishedSession.participants && finishedSession.participants.length > 0) {
            // Pastikan kuis terdaftar di Supabase quizzes agar relasi foreign key valid
            const { data: existingQ } = await supabase
              .from('quizzes')
              .select('id')
              .eq('id', finishedSession.quizId)
              .maybeSingle();

            if (!existingQ) {
              const masterQuiz = this.getAllQuizzes().find((q) => q.id === finishedSession.quizId);
              await supabase.from('quizzes').upsert({
                id: finishedSession.quizId,
                title: finishedSession.quizTitle,
                description: masterQuiz?.description || '',
                subject: finishedSession.subject,
                target_grade: finishedSession.grade,
                duration_per_question_sec: masterQuiz?.durationPerQuestionSec || 30,
                cover_emoji: finishedSession.quizCover || '⭐',
                theme_color: masterQuiz?.themeColor || 'from-blue-600 to-indigo-600',
                badge_title: masterQuiz?.badgeTitle || 'Bintang Juara',
                pin_code: masterQuiz?.pinCode || `P${Date.now().toString().slice(-5)}`,
                creator_id: finishedSession.teacherId || null,
                creator_name: finishedSession.teacherName || null,
                visibility: masterQuiz?.visibility || 'public',
                is_published: true,
                default_game_mode: masterQuiz?.defaultGameMode || 'standard',
                shuffle_questions: false,
                shuffle_options: false,
                drive_folder_id: masterQuiz?.driveFolderId || null,
              });
            }

            const attemptRows = finishedSession.participants.map((p) => ({
              quiz_id: finishedSession.quizId,
              player_nickname: p.name,
              player_avatar: p.avatarId,
              score: p.score ?? 0,
              stars: p.stars ?? 0,
              total_questions: finishedSession.totalQuestions || 1,
              correct_answers: p.correctCount ?? 0,
              time_spent_sec: p.timeSpentSec ?? 0,
              created_at: finishedSession.endedAt || new Date().toISOString(),
            }));

            await supabase.from('quiz_attempts').insert(attemptRows);
          }
        }
      } catch (err) {
        console.warn('Supabase updateSessionStatus notice:', err);
      }
    }

    return existing[idx];
  },

  async updateSessionHeartbeat(sessionId: string): Promise<void> {
    if (!sessionId) return;
    const now = new Date().toISOString();
    const existing = this.getActiveSessions();
    const idx = existing.findIndex((s) => s.id === sessionId);
    if (idx !== -1) {
      existing[idx].lastHeartbeat = now;
      try {
        localStorage.setItem(STORAGE_KEY_QUIZ_SESSIONS, JSON.stringify(existing));
      } catch {}
    }
    if (supabase) {
      try {
        await supabase
          .from('quiz_sessions')
          .update({ last_heartbeat: now })
          .eq('id', sessionId);
      } catch (err) {
        console.warn('updateSessionHeartbeat notice:', err);
      }
    }
  },

  async addOrUpdateSessionParticipant(
    sessionId: string,
    participant: Partial<QuizSessionParticipant> & { name: string; avatarId: string }
  ): Promise<QuizSessionParticipant | null> {
    let existing = this.getActiveSessions();
    let sIdx = existing.findIndex((s) => s.id === sessionId);

    // Jika sesi belum ada di cache lokal perangkat, coba ambil dari Supabase terlebih dahulu
    if (sIdx === -1 && supabase) {
      try {
        const cloudSess = await this.fetchActiveSessionById(sessionId);
        if (cloudSess) {
          existing = this.getActiveSessions();
          sIdx = existing.findIndex((s) => s.id === sessionId);
        }
      } catch {}
    }

    const session = sIdx !== -1 ? existing[sIdx] : null;
    const now = new Date().toISOString();
    const partId = participant.id || 'part_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    let finalParticipant: QuizSessionParticipant;

    if (session) {
      const pIdx = session.participants.findIndex(
        (p) => (participant.id && p.id === participant.id) || p.name.trim().toLowerCase() === participant.name.trim().toLowerCase()
      );

      if (pIdx >= 0) {
        // Update existing participant
        finalParticipant = {
          ...session.participants[pIdx],
          ...participant,
          tabSwitchCount: participant.tabSwitchCount !== undefined 
            ? participant.tabSwitchCount 
            : session.participants[pIdx].tabSwitchCount,
          lastActiveAt: now,
        };
        session.participants[pIdx] = finalParticipant;
      } else {
        // Insert new participant
        finalParticipant = {
          id: partId,
          name: participant.name,
          avatarId: participant.avatarId || 'lion',
          currentQuestionIndex: participant.currentQuestionIndex ?? 0,
          totalQuestions: session.totalQuestions,
          score: participant.score ?? 0,
          stars: participant.stars ?? 0,
          correctCount: participant.correctCount ?? 0,
          incorrectCount: participant.incorrectCount ?? 0,
          streak: participant.streak ?? 0,
          finished: participant.finished ?? false,
          timeSpentSec: participant.timeSpentSec ?? 0,
          answers: participant.answers ?? {},
          tabSwitchCount: participant.tabSwitchCount ?? 0,
          joinedAt: now,
          lastActiveAt: now,
        };
        session.participants.push(finalParticipant);
      }

      try {
        localStorage.setItem(STORAGE_KEY_QUIZ_SESSIONS, JSON.stringify(existing));
      } catch (e) {
        console.warn('Failed to save session participant:', e);
      }

      broadcastSessionUpdate(existing[sIdx]);
    } else {
      // Fallback jika perangkat belum memiliki cache sesi di localStorage
      finalParticipant = {
        id: partId,
        name: participant.name,
        avatarId: participant.avatarId || 'lion',
        currentQuestionIndex: participant.currentQuestionIndex ?? 0,
        totalQuestions: participant.totalQuestions || 1,
        score: participant.score ?? 0,
        stars: participant.stars ?? 0,
        correctCount: participant.correctCount ?? 0,
        incorrectCount: participant.incorrectCount ?? 0,
        streak: participant.streak ?? 0,
        finished: participant.finished ?? false,
        timeSpentSec: participant.timeSpentSec ?? 0,
        answers: participant.answers ?? {},
        tabSwitchCount: participant.tabSwitchCount ?? 0,
        joinedAt: now,
        lastActiveAt: now,
      };
    }

    const partPayload = {
      id: finalParticipant.id,
      session_id: sessionId,
      student_name: finalParticipant.name,
      avatar_id: finalParticipant.avatarId,
      current_question_index: finalParticipant.currentQuestionIndex,
      score: finalParticipant.score,
      stars: finalParticipant.stars,
      correct_count: finalParticipant.correctCount,
      incorrect_count: finalParticipant.incorrectCount,
      streak: finalParticipant.streak,
      finished: finalParticipant.finished,
      time_spent_sec: finalParticipant.timeSpentSec,
      answers: finalParticipant.answers,
      tab_switch_count: finalParticipant.tabSwitchCount ?? 0,
      last_active_at: finalParticipant.lastActiveAt,
    };

    if (supabase && (typeof navigator === 'undefined' || navigator.onLine)) {
      try {
        const { error } = await supabase.from('quiz_session_participants').upsert(
          partPayload,
          {
            onConflict: 'session_id, student_name',
          }
        );
        if (error) throw error;
      } catch (err) {
        console.warn('Supabase addOrUpdateSessionParticipant notice, simpan ke antrean offline:', err);
        offlineQueue.enqueue('session_participant_upsert', partPayload, 'session_id, student_name');
      }
    } else {
      offlineQueue.enqueue('session_participant_upsert', partPayload, 'session_id, student_name');
    }


    return finalParticipant;
  },

  // Langganan WebSocket Realtime Supabase untuk Sesi Live Lintas Perangkat (Sub-Second Latency)
  subscribeToQuizSession(
    sessionId: string,
    onSessionUpdate: (session: QuizSession) => void,
    onParticipantUpdate?: (participant: QuizSessionParticipant) => void
  ): () => void {
    if (!supabase || !sessionId) {
      return () => {};
    }

    const channelName = `quiz_sess_rt_${sessionId}_${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quiz_sessions',
          filter: `id=eq.${sessionId}`,
        },
        async () => {
          try {
            const fresh = await this.fetchActiveSessionById(sessionId);
            if (fresh) {
              onSessionUpdate(fresh);
            }
          } catch {}
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quiz_session_participants',
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload: any) => {
          try {
            if (onParticipantUpdate && payload.new) {
              const p = payload.new;
              onParticipantUpdate({
                id: p.id,
                name: p.student_name,
                avatarId: p.avatar_id,
                currentQuestionIndex: p.current_question_index,
                totalQuestions: 0,
                score: p.score,
                stars: p.stars,
                correctCount: p.correct_count,
                incorrectCount: p.incorrect_count,
                streak: p.streak,
                finished: p.finished,
                timeSpentSec: p.time_spent_sec,
                answers: p.answers || {},
                tabSwitchCount: p.tab_switch_count ?? 0,
                joinedAt: p.joined_at,
                lastActiveAt: p.last_active_at,
              });
            }
            const fresh = await this.fetchActiveSessionById(sessionId);
            if (fresh) {
              onSessionUpdate(fresh);
            }
          } catch {}
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  },

  async deleteActiveSession(sessionId: string): Promise<boolean> {
    const existing = this.getActiveSessions();
    const toDelete = existing.find((s) => s.id === sessionId);
    const filtered = existing.filter((s) => s.id !== sessionId);
    try {
      localStorage.setItem(STORAGE_KEY_QUIZ_SESSIONS, JSON.stringify(filtered));
    } catch {
      return false;
    }

    if (toDelete) {
      broadcastSessionUpdate({ ...toDelete, status: 'finished' });
    }

    if (supabase) {
      try {
        await supabase.from('quiz_sessions').delete().eq('id', sessionId);
      } catch (err) {
        console.warn('Supabase deleteActiveSession notice:', err);
      }
    }

    return true;
  },

  // Generates simulated student responses for testing and classroom demonstration
  async simulateAddStudentsToSession(sessionId: string, count = 3): Promise<QuizSession | null> {
    const session = this.getActiveSessionById(sessionId);
    if (!session) return null;

    const sampleNames = [
      'Budi Santoso', 'Siti Rahma', 'Ahmad Dani', 'Citra Lestari', 
      'Rizky Pratama', 'Putri Ayu', 'Bayu Saputra', 'Dewi Anggraini', 
      'Fajar Nugraha', 'Nabila Zahra', 'Dimas Arya', 'Tiara Maharani'
    ];
    const sampleAvatars = ['lion', 'rabbit', 'fox', 'panda', 'tiger', 'cat', 'bear', 'koala'];

    // Pick names not already in session
    const existingNames = new Set(session.participants.map((p) => p.name.toLowerCase()));
    const availableNames = sampleNames.filter((n) => !existingNames.has(n.toLowerCase()));
    const namesToUse = (availableNames.length >= count ? availableNames : sampleNames).slice(0, count);

    for (const name of namesToUse) {
      const avatar = sampleAvatars[Math.floor(Math.random() * sampleAvatars.length)];
      const totalQ = session.totalQuestions || 5;
      const correctCount = Math.floor(Math.random() * (totalQ + 1));
      const incorrectCount = totalQ - correctCount;
      const score = Math.round((correctCount / totalQ) * 100);
      const stars = score >= 85 ? 3 : score >= 60 ? 2 : score > 0 ? 1 : 0;
      const timeSpentSec = Math.floor(totalQ * (10 + Math.random() * 15));

      const answers: Record<string, any> = {};
      for (let q = 0; q < totalQ; q++) {
        const isCorrect = q < correctCount;
        answers[`q_${q}`] = {
          questionId: `q_${q}`,
          questionIndex: q,
          selectedOption: isCorrect ? 0 : Math.floor(1 + Math.random() * 3),
          isCorrect,
          timeSpentSec: Math.floor(5 + Math.random() * 15),
          pointsEarned: isCorrect ? 10 : 0,
        };
      }

      await this.addOrUpdateSessionParticipant(sessionId, {
        name,
        avatarId: avatar,
        currentQuestionIndex: totalQ,
        totalQuestions: totalQ,
        score,
        stars,
        correctCount,
        incorrectCount,
        streak: Math.min(correctCount, 4),
        finished: true,
        timeSpentSec,
        answers,
      });
    }

    return this.getActiveSessionById(sessionId);
  },
};
