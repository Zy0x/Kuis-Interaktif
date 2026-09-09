import React, { useState } from 'react';
import type { Quiz } from '../../types/quiz';
import { AVATAR_LIST } from '../../data/seedQuizzes';
import { DataManager } from '../../lib/supabaseClient';
import { Play, Sparkles, Clock, HelpCircle, ArrowLeft, User } from 'lucide-react';

interface StudentLobbyProps {
  quiz: Quiz;
  onStartQuiz: () => void;
  onBackToHome: () => void;
  playClick: () => void;
}

export const StudentLobby: React.FC<StudentLobbyProps> = ({
  quiz,
  onStartQuiz,
  onBackToHome,
  playClick,
}) => {
  const profile = DataManager.getPlayerProfile();
  const [nickname, setNickname] = useState(profile.nickname);
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatarId);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    const cleanNick = nickname.trim() || 'Bintang SD';
    DataManager.savePlayerProfile({
      nickname: cleanNick,
      avatarId: selectedAvatar,
    });
    onStartQuiz();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-slate-50 to-indigo-50/40 text-slate-900 flex flex-col justify-between select-none">
      {/* Top Header */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => {
              playClick();
              onBackToHome();
            }}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Katalog Kuis</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xl">⭐</span>
            <span className="text-xs font-bold text-slate-800">Ruang Kuis Siswa</span>
          </div>
        </div>
      </header>

      {/* Main Lobby Room */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center my-auto">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-pop space-y-6 animate-fade-in">
          
          {/* Quiz Badge & Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>PIN Kuis: <strong className="font-mono text-sm tracking-wider text-blue-900">{quiz.pinCode || '1001'}</strong></span>
            </div>

            <div className="text-4xl sm:text-5xl my-2 select-none">
              {quiz.coverEmoji}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {quiz.title}
            </h1>

            <div className="flex items-center justify-center gap-2 flex-wrap text-xs text-slate-500 font-semibold">
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                Kelas {quiz.grade} SD
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800">
                {quiz.subject}
              </span>
              {quiz.creatorName && (
                <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                  Oleh: {quiz.creatorName}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto pt-1">
              {quiz.description || 'Kuis interaktif untuk menguji pemahaman dan mengumpulkan Bintang Prestasi!'}
            </p>
          </div>

          {/* Quick Meta Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-blue-500" /> Jumlah Soal
              </span>
              <span className="text-lg font-extrabold text-slate-800">
                {quiz.questions.length} Soal
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> Durasi / Soal
              </span>
              <span className="text-lg font-extrabold text-slate-800">
                {quiz.durationPerQuestionSec} Detik
              </span>
            </div>
          </div>

          {/* Player Name & Avatar Form */}
          <form onSubmit={handleStart} className="space-y-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Nama / Nama Panggilan Siswa:</span>
              </label>
              <input
                type="text"
                maxLength={16}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none font-bold text-sm text-slate-900 min-h-[48px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Pilih Maskot Kuis:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {AVATAR_LIST.map((avatar) => {
                  const isSelected = selectedAvatar === avatar.id;
                  return (
                    <button
                      type="button"
                      key={avatar.id}
                      onClick={() => {
                        playClick();
                        setSelectedAvatar(avatar.id);
                      }}
                      className={`p-2.5 rounded-2xl flex flex-col items-center justify-center border transition-all min-h-[58px] ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-400 shadow-sm'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-2xl select-none">{avatar.emoji}</span>
                      <span className="text-[10px] font-semibold text-slate-600 mt-1 truncate max-w-full">
                        {avatar.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Launch Button */}
            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 min-h-[52px] btn-press transition-all"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>Masuk & Kerjakan Kuis Sekarang</span>
              </button>
            </div>
          </form>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-3 text-center text-xs text-slate-400">
        Kuis SD Seru • Platform Belajar Interaktif SD Indonesia
      </footer>
    </div>
  );
};
