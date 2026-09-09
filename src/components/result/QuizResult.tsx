import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import type { Quiz, QuizAttemptAnswer, LeaderboardEntry } from '../../types/quiz';
import { DataManager } from '../../lib/supabaseClient';
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
}

export const QuizResult: React.FC<QuizResultProps> = ({
  quiz,
  answers,
  totalTimeSpent,
  onReplay,
  onGoHome,
  playClick,
  playCelebration,
}) => {
  const [activeTab, setActiveTab] = useState<'review' | 'leaderboard'>('review');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [copiedShare, setCopiedShare] = useState(false);

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const totalCount = quiz.questions.length;
  const score = Math.round((correctCount / totalCount) * 100);

  let stars = 1;
  let praise = '💪 Bagus Sekali! Ayo Coba Lagi Pasti Bisa!';
  if (score === 100) {
    stars = 3;
    praise = '🌟 Sempurna! Kamu Juara Kelas Sejati!';
  } else if (score >= 70) {
    stars = 2;
    praise = '🎉 Hebat Sekali! Nilaimu Sangat Memuaskan!';
  }

  useEffect(() => {
    playCelebration();

    try {
      confetti({
        particleCount: 70,
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
    const shareText = `Aku baru saja meraih nilai ${score} (${stars} Bintang ⭐) di Kuis SD Seru: "${quiz.title}"! Ayo belajar bersama!`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-sky-50/40 to-indigo-50/40 p-3 sm:p-6 pb-28 select-none">
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Celebration Banner Card - Mobile-S/M/L scale */}
        <div className="bg-white rounded-3xl p-4 sm:p-8 border-4 border-amber-300 shadow-2xl text-center relative overflow-hidden animate-pop-in">
          <div className="absolute top-0 left-0 right-0 h-2.5 sm:h-3 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
          
          {/* Animated Stars */}
          <div className="flex justify-center items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                className={`w-8 h-8 sm:w-12 sm:h-12 transition-all duration-500 ${
                  s <= stars
                    ? 'text-amber-400 fill-amber-400 scale-110 drop-shadow-md animate-bounce-soft'
                    : 'text-slate-200'
                }`}
              />
            ))}
          </div>

          <h2 className="text-xl sm:text-3xl font-black text-slate-900 mb-1 leading-tight">
            {praise}
          </h2>
          <p className="text-[11px] sm:text-sm font-bold text-slate-500 mb-4 sm:mb-6 truncate px-2">
            Kuis: {quiz.title} (Kelas {quiz.grade} SD)
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3 bg-slate-50 p-2.5 sm:p-4 rounded-2xl border border-slate-200">
            <div className="text-center">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 block">Nilai Akhir</span>
              <p className="text-xl sm:text-3xl font-black text-blue-600 mt-0.5">{score}</p>
            </div>
            <div className="text-center border-x border-slate-200">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 block">Jawaban Benar</span>
              <p className="text-xl sm:text-3xl font-black text-emerald-600 mt-0.5">
                {correctCount} / {totalCount}
              </p>
            </div>
            <div className="text-center">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 block">Waktu Main</span>
              <p className="text-xl sm:text-3xl font-black text-amber-600 mt-0.5">{totalTimeSpent}s</p>
            </div>
          </div>
        </div>

        {/* Dual Tab Buttons */}
        <div className="flex rounded-2xl bg-white p-1 border border-slate-200 shadow-sm">
          <button
            onClick={() => {
              playClick();
              setActiveTab('review');
            }}
            className={`flex-1 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all min-h-[44px] sm:min-h-[48px] ${
              activeTab === 'review'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Pembahasan</span>
          </button>
          <button
            onClick={() => {
              playClick();
              setActiveTab('leaderboard');
            }}
            className={`flex-1 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all min-h-[44px] sm:min-h-[48px] ${
              activeTab === 'leaderboard'
                ? 'bg-amber-500 text-slate-900 shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Papan Peringkat</span>
          </button>
        </div>

        {/* Tab 1: Detailed Question Review */}
        {activeTab === 'review' && (
          <div className="space-y-3 sm:space-y-4 animate-pop-in">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-700 uppercase tracking-wider">
              Ulasan Jawaban & Pembahasan
            </h3>

            {quiz.questions.map((q, idx) => {
              const studentAnswer = answers.find((a) => a.questionId === q.id);
              const isCorrect = studentAnswer?.isCorrect;
              const selectedIdx = studentAnswer?.selectedIndex ?? -1;

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-2xl p-4 sm:p-5 border-2 shadow-sm space-y-2.5 ${
                    isCorrect ? 'border-emerald-200' : 'border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-500">Soal {idx + 1}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-black ${
                        isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
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

                  <p className="font-extrabold text-slate-800 text-xs sm:text-base leading-snug">
                    {q.text}
                  </p>

                  <div className="text-xs space-y-1 bg-slate-50 p-2.5 sm:p-3 rounded-xl">
                    <p className="text-slate-600">
                      Jawabanmu:{' '}
                      <span className={isCorrect ? 'font-black text-emerald-700' : 'font-black text-rose-600'}>
                        {selectedIdx >= 0 ? q.options[selectedIdx] : 'Waktu Habis'}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className="text-slate-600">
                        Jawaban Benar:{' '}
                        <span className="font-black text-emerald-700">
                          {q.options[q.correctIndex]}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="text-[11px] sm:text-xs text-blue-900 bg-blue-50/70 p-2.5 sm:p-3 rounded-xl border border-blue-100">
                    <span className="font-black block mb-0.5">💡 Penjelasan:</span>
                    {q.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3 sm:space-y-4 animate-pop-in">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" /> 10 Juara Tertinggi
              </h3>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400">Pembaruan Langsung</span>
            </div>

            <div className="divide-y divide-slate-100">
              {leaderboard.map((entry, idx) => {
                let medalBadge = <span className="font-bold text-slate-500 text-xs w-6 text-center">{idx + 1}</span>;
                if (idx === 0) medalBadge = <span className="text-lg sm:text-xl">🥇</span>;
                if (idx === 1) medalBadge = <span className="text-lg sm:text-xl">🥈</span>;
                if (idx === 2) medalBadge = <span className="text-lg sm:text-xl">🥉</span>;

                return (
                  <div key={entry.id} className="py-2.5 sm:py-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 sm:w-7 flex justify-center flex-shrink-0">{medalBadge}</div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-800 text-xs sm:text-sm truncate max-w-[130px] sm:max-w-none">
                          {entry.nickname}
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-slate-400">
                          {entry.dateStr} • {entry.timeSpentSec}s
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs sm:text-base font-black text-blue-600 block">
                        {entry.score}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-amber-500 font-bold">
                        {'⭐'.repeat(entry.stars)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Floating Bottom Actions - Ultra-Optimized for Mobile-S/M/L */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 sm:p-3.5 z-30 shadow-2xl">
        <div className="max-w-2xl mx-auto flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              playClick();
              onGoHome();
            }}
            className="flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-2xl font-black text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center justify-center gap-1 min-h-[48px] btn-playful"
          >
            <Home className="w-4 h-4 flex-shrink-0" />
            <span>Beranda</span>
          </button>

          <button
            onClick={() => {
              playClick();
              onReplay();
            }}
            className="flex-[2] py-2.5 sm:py-3 px-2 sm:px-4 rounded-2xl font-black text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-playful flex items-center justify-center gap-1.5 min-h-[48px] btn-playful"
          >
            <RotateCcw className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Main Lagi</span>
          </button>

          <button
            onClick={handleShare}
            className="p-2.5 sm:p-3 rounded-2xl bg-amber-100 text-amber-900 hover:bg-amber-200 min-h-[48px] min-w-[48px] flex items-center justify-center btn-playful flex-shrink-0"
            title="Bagikan Skor"
            aria-label="Bagikan Skor Kuis"
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
          </button>
        </div>
        {copiedShare && (
          <div className="text-center text-[10px] sm:text-xs font-bold text-emerald-600 mt-1 animate-pop-in">
            ✓ Teks skor berhasil disalin ke clipboard!
          </div>
        )}
      </footer>
    </div>
  );
};
