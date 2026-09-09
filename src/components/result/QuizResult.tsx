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
    const shareText = `Aku baru saja meraih nilai ${score} (${stars} Bintang ⭐) di Kuis SD Seru: "${quiz.title}"!`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 select-none flex flex-col justify-between">
      <main className="w-full max-w-2xl mx-auto p-4 sm:p-6 pb-8 space-y-5 flex-1">
        
        {/* Results Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-card text-center relative overflow-hidden animate-fade-in">
          
          {/* Stars */}
          <div className="flex justify-center items-center gap-2 mb-3">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                className={`w-9 h-9 sm:w-11 sm:h-11 transition-all ${
                  s <= stars
                    ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                    : 'text-slate-200'
                }`}
              />
            ))}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 leading-tight">
            {praise}
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Kuis: {quiz.title} (Kelas {quiz.grade} SD)
          </p>

          {/* 3 Stats Grid */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="text-center">
              <span className="text-[11px] font-semibold text-slate-500 block">Nilai Akhir</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-blue-600 mt-0.5">{score}</p>
            </div>
            <div className="text-center border-x border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block">Jawaban Benar</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-0.5">
                {correctCount} / {totalCount}
              </p>
            </div>
            <div className="text-center">
              <span className="text-[11px] font-semibold text-slate-500 block">Durasi Waktu</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-0.5">{totalTimeSpent}s</p>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-xl bg-white p-1 border border-slate-200 shadow-sm">
          <button
            onClick={() => {
              playClick();
              setActiveTab('review');
            }}
            className={`flex-1 py-2.5 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all min-h-[42px] ${
              activeTab === 'review'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
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
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Papan Peringkat</span>
          </button>
        </div>

        {/* Tab 1: Detailed Question Review */}
        {activeTab === 'review' && (
          <div className="space-y-3 animate-fade-in">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Ulasan Jawaban & Penjelasan ({quiz.questions.length} Soal)
            </h3>

            {quiz.questions.map((q, idx) => {
              const studentAnswer = answers.find((a) => a.questionId === q.id);
              const isCorrect = studentAnswer?.isCorrect;
              const selectedIdx = studentAnswer?.selectedIndex ?? -1;

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-xl p-4 sm:p-5 border shadow-sm space-y-2.5 ${
                    isCorrect ? 'border-emerald-200' : 'border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-slate-400 font-semibold">Soal {idx + 1}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isCorrect
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
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

                  <p className="font-bold text-slate-900 text-sm leading-snug">
                    {q.text}
                  </p>

                  <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-slate-600">
                      Jawabanmu:{' '}
                      <span className={isCorrect ? 'font-bold text-emerald-700' : 'font-bold text-rose-600'}>
                        {selectedIdx >= 0 ? q.options[selectedIdx] : 'Waktu Habis'}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className="text-slate-600">
                        Kunci Jawaban:{' '}
                        <span className="font-bold text-emerald-700">
                          {q.options[q.correctIndex]}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="text-xs text-slate-700 bg-blue-50/60 p-3 rounded-lg border border-blue-100">
                    <span className="font-bold text-blue-900 block mb-0.5">💡 Penjelasan:</span>
                    {q.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" /> 10 Nilai Tertinggi
              </h3>
              <span className="text-[11px] text-slate-400">Pembaruan Langsung</span>
            </div>

            <div className="divide-y divide-slate-100">
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
                        <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                          {entry.nickname}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {entry.dateStr} • {entry.timeSpentSec} detik
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs sm:text-sm font-extrabold text-blue-600 block">
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
      <footer className="sticky bottom-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200/80 p-3 sm:p-3.5 z-20 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center gap-2.5">
          <button
            onClick={() => {
              playClick();
              onGoHome();
            }}
            className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center justify-center gap-1.5 min-h-[46px] btn-press"
          >
            <Home className="w-4 h-4" />
            <span>Beranda</span>
          </button>

          <button
            onClick={() => {
              playClick();
              onReplay();
            }}
            className="flex-[2] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm flex items-center justify-center gap-1.5 min-h-[46px] btn-press"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Main Lagi</span>
          </button>

          <button
            onClick={handleShare}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 min-h-[46px] min-w-[46px] flex items-center justify-center btn-press"
            title="Bagikan Skor"
            aria-label="Bagikan Skor Kuis"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
        {copiedShare && (
          <div className="text-center text-[11px] font-semibold text-emerald-600 mt-1 animate-fade-in">
            ✓ Teks skor berhasil disalin ke clipboard!
          </div>
        )}
      </footer>
    </div>
  );
};
