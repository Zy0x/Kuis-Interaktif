import React, { useState } from 'react';
import type { Quiz, GameMode } from '../../types/quiz';
import { AVATAR_LIST } from '../../data/seedQuizzes';
import { DataManager } from '../../lib/supabaseClient';
import { ThemeToggle } from '../common/ThemeToggle';
import { QuizCoverDisplay } from '../common/QuizCoverDisplay';
import { Play, Sparkles, Clock, HelpCircle, ArrowLeft, User } from 'lucide-react';

interface StudentLobbyProps {
  quiz: Quiz;
  onStartQuiz: (mode?: GameMode) => void;
  onBackToHome: () => void;
  playClick: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const StudentLobby: React.FC<StudentLobbyProps> = ({
  quiz,
  onStartQuiz,
  onBackToHome,
  playClick,
  isDark = false,
  onToggleTheme = () => {},
}) => {
  const profile = DataManager.getPlayerProfile();
  const isCustom = Boolean(
    profile.nickname &&
    profile.nickname.trim().toLowerCase() !== 'saya' &&
    profile.nickname.trim().toLowerCase() !== 'bintang sd' &&
    profile.nickname.trim().toLowerCase() !== 'bintang pintar'
  );
  const [nickname, setNickname] = useState(isCustom ? profile.nickname : '');
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatarId);
  const [selectedMode, setSelectedMode] = useState<GameMode>(quiz.defaultGameMode || 'standard');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    const cleanNick = nickname.trim() || (isCustom ? profile.nickname : 'Saya');
    DataManager.savePlayerProfile({
      nickname: cleanNick,
      avatarId: selectedAvatar,
    });
    onStartQuiz(selectedMode);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between select-none">
      {/* Top Header */}
      <header className="w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-8 lg:px-12 pt-[max(env(safe-area-inset-top),0.625rem)] pb-2.5 sm:pb-3 sticky top-0 z-20 shadow-sm">
        <div className="w-full max-w-[2000px] mx-auto flex items-center justify-between gap-2">
          <button
            onClick={() => {
              playClick();
              onBackToHome();
            }}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 px-2.5 sm:px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Katalog Kuis</span>
            <span className="xs:hidden">Katalog</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
            <div className="hidden xs:flex items-center gap-1.5">
              <span className="text-lg sm:text-xl">⭐</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Ruang Kuis</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Lobby Room */}
      <main className="flex-1 max-w-xl 2xl:max-w-2xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center my-auto">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-pop space-y-6 animate-fade-in">
          
          {/* Quiz Badge & Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>PIN Kuis: <strong className="font-mono text-sm tracking-wider text-blue-900 dark:text-blue-100">{quiz.pinCode || '1001'}</strong></span>
            </div>

            <QuizCoverDisplay
              cover={quiz.coverEmoji}
              className="w-16 h-16 sm:w-20 sm:h-20 mx-auto my-2 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl select-none overflow-hidden"
            />

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
              {quiz.title}
            </h1>

            <div className="flex items-center justify-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Kelas {quiz.grade}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300">
                {quiz.subject}
              </span>
              {quiz.creatorName && (
                <span className="px-2.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Oleh: {quiz.creatorName}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto pt-1">
              {quiz.description || 'Kuis interaktif untuk menguji pemahaman dan mengumpulkan Bintang Prestasi!'}
            </p>
          </div>

          {/* Quick Meta Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-blue-500" /> Jumlah Soal
              </span>
              <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                {quiz.questions.length} Soal
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> Durasi / Soal
              </span>
              <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                {quiz.durationPerQuestionSec} Detik
              </span>
            </div>
          </div>

          {/* Player Name & Avatar Form */}
          <form onSubmit={handleStart} className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Nama / Nama Panggilan Siswa:</span>
              </label>
              <input
                type="text"
                maxLength={16}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none font-bold text-sm text-slate-900 dark:text-white min-h-[48px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
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
                          ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-500 ring-2 ring-blue-400 shadow-sm'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                      }`}
                    >
                      <span className="text-2xl select-none">{avatar.emoji}</span>
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 mt-1 truncate max-w-full">
                        {avatar.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Game Mode Selector */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                <span>Pilih Mode Permainan:</span>
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">Sesuaikan gaya belajar</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    mode: 'standard' as GameMode,
                    title: 'Standar',
                    icon: '⏱️',
                    desc: 'Timer per soal',
                    borderActive: 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-400'
                  },
                  {
                    mode: 'survival_3hearts' as GameMode,
                    title: '3 Hati',
                    icon: '❤️',
                    desc: 'Mode bertahan',
                    borderActive: 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100 ring-2 ring-rose-400'
                  },
                  {
                    mode: 'untimed' as GameMode,
                    title: 'Santai',
                    icon: '🧘',
                    desc: 'Tanpa buru-buru',
                    borderActive: 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-400'
                  },
                ].map((item) => {
                  const isActive = selectedMode === item.mode;
                  return (
                    <button
                      type="button"
                      key={item.mode}
                      onClick={() => {
                        playClick();
                        setSelectedMode(item.mode);
                      }}
                      className={`p-2.5 rounded-2xl flex flex-col items-center text-center transition-all min-h-[64px] border ${
                        isActive
                          ? item.borderActive
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-xl mb-0.5 select-none">{item.icon}</span>
                      <span className="text-xs font-bold leading-tight">{item.title}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Launch Button */}
            <div className="pt-2">
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
      <footer className="w-full py-3 text-center text-xs text-slate-400 dark:text-slate-500">
        Kuis Interaktif Seru • Platform Belajar Terpadu
      </footer>
    </div>
  );
};
