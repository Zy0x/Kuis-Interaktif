import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import type { Quiz, QuizAttemptAnswer, LeaderboardEntry } from '../../types/quiz';
import { DataManager } from '../../lib/supabaseClient';
import { ThemeToggle } from '../common/ThemeToggle';
import { 
  Trophy, 
  RotateCcw, 
  Home, 
  Star, 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  Award, 
  Share2 
} from 'lucide-react';

interface QuizResultProps {
  quiz: Quiz;
  answers: QuizAttemptAnswer[];
  totalTimeSpent: number;
  onReplay: () => void;
  onGoHome: () => void;
  playClick: () => void;
  playCelebration: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const QuizResult: React.FC<QuizResultProps> = ({
  quiz,
  answers,
  totalTimeSpent,
  onReplay,
  onGoHome,
  playClick,
  playCelebration,
  isDark = false,
  onToggleTheme = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<'review' | 'leaderboard'>('review');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [copiedShare, setCopiedShare] = useState(false);

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const totalCount = quiz.questions.length;
  const score = Math.round((correctCount / totalCount) * 100);

  let stars = 1;
  let praise = 'Bagus Sekali! Ayo Terus Berlatih!';
  if (score === 100) {
    stars = 3;
    praise = 'Sempurna! Kamu Sangat Hebat!';
  } else if (score >= 70) {
    stars = 2;
    praise = 'Luar Biasa! Hasil Belajarmu Memuaskan!';
  }

  useEffect(() => {
    playCelebration();

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    const resultObj = {
      quizId: quiz.id,
      quizTitle: quiz.title,
      subject: quiz.subject,
      grade: quiz.grade,
      score,
      stars,
      correctCount,
      totalCount,
      timeSpentSec: totalTimeSpent,
      answers,
      completedAt: new Date().toISOString(),
    };

    DataManager.recordQuizAttempt(resultObj).then(() => {
      DataManager.getLeaderboard(quiz.id).then(setLeaderboard);
    });
  }, [quiz, score, stars, correctCount, totalCount, totalTimeSpent, answers, playCelebration]);

  const handleShare = () => {
    playClick();
    const shareText = `Aku baru saja meraih nilai ${score} (${stars} Bintang ⭐) di Kuis Interaktif: "${quiz.title}"!`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none flex flex-col justify-between">
      <main className="w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto p-4 sm:p-6 pb-8 space-y-5 flex-1">
        
        {/* Results Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-card text-center relative overflow-hidden animate-fade-in">
          
          {/* Stars */}
          <div className="flex justify-center items-center gap-2 mb-3">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                className={`w-9 h-9 sm:w-11 sm:h-11 transition-all ${
                  s <= stars
                    ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                    : 'text-slate-200 dark:text-slate-700'
                }`}
              />
            ))}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1 leading-tight">
            {praise}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Kuis: {quiz.title} (Kelas {quiz.grade})
          </p>

          {/* 3 Stats Grid */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <div className="text-center">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Nilai Akhir</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">{score}</p>
            </div>
            <div className="text-center border-x border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Jawaban Benar</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {correctCount} / {totalCount}
              </p>
            </div>
            <div className="text-center">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Durasi Waktu</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{totalTimeSpent}s</p>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-xl bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => {
              playClick();
              setActiveTab('review');
            }}
            className={`flex-1 py-2.5 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all min-h-[42px] ${
              activeTab === 'review'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Pembahasan Soal</span>
          </button>
          <button
            onClick={() => {
              playClick();
              setActiveTab('leaderboard');
            }}
            className={`flex-1 py-2.5 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all min-h-[42px] ${
              activeTab === 'leaderboard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Papan Peringkat</span>
          </button>
        </div>

        {/* Tab 1: Detailed Question Review */}
        {activeTab === 'review' && (
          <div className="space-y-3 animate-fade-in">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ulasan Jawaban & Penjelasan ({quiz.questions.length} Soal)
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {quiz.questions.map((q, idx) => {
              const studentAnswer = answers.find((a) => a.questionId === q.id);
              const isCorrect = studentAnswer?.isCorrect;
              const selectedIdx = studentAnswer?.selectedIndex ?? -1;

              return (
                <div
                  key={q.id}
                  className={`bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border shadow-sm space-y-2.5 ${
                    isCorrect ? 'border-emerald-200 dark:border-emerald-800/80' : 'border-rose-200 dark:border-rose-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Soal {idx + 1}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" /> Benar
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" /> Belum Tepat
                        </>
                      )}
                    </span>
                  </div>

                  <p className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                    {q.text}
                  </p>

                  <div className="text-xs space-y-1 bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-slate-600 dark:text-slate-300">
                      Jawabanmu:{' '}
                      <span className={isCorrect ? 'font-bold text-emerald-700 dark:text-emerald-400' : 'font-bold text-rose-600 dark:text-rose-400'}>
                        {selectedIdx >= 0 ? q.options[selectedIdx] : 'Waktu Habis'}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className="text-slate-600 dark:text-slate-300">
                        Kunci Jawaban:{' '}
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          {q.options[q.correctIndex]}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="text-xs text-slate-700 dark:text-slate-300 bg-blue-50/60 dark:bg-blue-950/40 p-3 rounded-lg border border-blue-100 dark:border-blue-900/60">
                    <span className="font-bold text-blue-900 dark:text-blue-300 block mb-0.5">💡 Penjelasan:</span>
                    {q.explanation}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}

        {/* Tab 2: Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" /> 10 Nilai Tertinggi
              </h3>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Pembaruan Langsung</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {leaderboard.map((entry, idx) => {
                let medalBadge = <span className="font-bold text-slate-400 text-xs w-6 text-center">{idx + 1}</span>;
                if (idx === 0) medalBadge = <span className="text-lg">🥇</span>;
                if (idx === 1) medalBadge = <span className="text-lg">🥈</span>;
                if (idx === 2) medalBadge = <span className="text-lg">🥉</span>;

                return (
                  <div key={entry.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 flex justify-center flex-shrink-0">{medalBadge}</div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm truncate">
                          {entry.nickname}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                          {entry.dateStr} • {entry.timeSpentSec} detik
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs sm:text-sm font-extrabold text-blue-600 dark:text-blue-400 block">
                        {entry.score}
                      </span>
                      <span className="text-[10px] text-amber-500 font-medium">
                        {'⭐'.repeat(entry.stars)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Clearance Spacer */}
        <div className="h-4 w-full" aria-hidden="true" />
      </main>

      {/* Sticky Bottom Action Bar - Docked at viewport bottom, never covers content */}
      <footer className="sticky bottom-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 p-2.5 xs:p-3 sm:p-3.5 z-20 shadow-lg pb-[max(env(safe-area-inset-bottom),0.625rem)]">
        <div className="max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto flex items-center gap-1.5 xs:gap-2.5">
          <button
            onClick={() => {
              playClick();
              onGoHome();
            }}
            className="flex-1 py-2 xs:py-2.5 px-2 xs:px-3 rounded-xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 flex items-center justify-center gap-1 sm:gap-1.5 min-h-[44px] btn-press truncate"
          >
            <Home className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Beranda</span>
          </button>

          <button
            onClick={() => {
              playClick();
              onReplay();
            }}
            className="flex-[1.5] xs:flex-[2] py-2 xs:py-2.5 px-2 xs:px-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm flex items-center justify-center gap-1 sm:gap-1.5 min-h-[44px] btn-press truncate"
          >
            <RotateCcw className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Main Lagi</span>
          </button>

          <button
            onClick={handleShare}
            className="p-2 xs:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center btn-press flex-shrink-0"
            title="Bagikan Skor"
            aria-label="Bagikan Skor Kuis"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Theme Toggle Button */}
          <div className="flex-shrink-0">
            <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
          </div>
        </div>
        {copiedShare && (
          <div className="text-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 animate-fade-in">
            ✓ Teks skor berhasil disalin ke clipboard!
          </div>
        )}
      </footer>
    </div>
  );
};
