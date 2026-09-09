import React, { useState, useEffect } from 'react';
import type { Quiz, GradeLevel, Subject } from '../../types/quiz';
import { AVATAR_LIST } from '../../data/seedQuizzes';
import { DataManager } from '../../lib/supabaseClient';
import { 
  Play, 
  Sparkles, 
  Clock, 
  HelpCircle, 
  Volume2, 
  VolumeX, 
  Trophy, 
  User, 
  ChevronRight,
  BookOpen,
  Award,
  CheckCircle2,
  X,
  PlusCircle,
  Trash2,
  Zap,
  Target
} from 'lucide-react';

interface QuizHomeProps {
  onSelectQuiz: (quiz: Quiz) => void;
  onOpenCreator: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  playClick: () => void;
}

export const QuizHome: React.FC<QuizHomeProps> = ({
  onSelectQuiz,
  onOpenCreator,
  isMuted,
  onToggleMute,
  playClick,
}) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>(() => DataManager.getAllQuizzes());
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>('Semua');
  const [selectedSubject, setSelectedSubject] = useState<string>('Semua');
  const [profile, setProfile] = useState(() => DataManager.getPlayerProfile());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [rulesModalQuiz, setRulesModalQuiz] = useState<Quiz | null>(null);
  const [tempNickname, setTempNickname] = useState(profile.nickname);
  const [tempAvatar, setTempAvatar] = useState(profile.avatarId);

  useEffect(() => {
    setQuizzes(DataManager.getAllQuizzes());
  }, []);

  const grades: GradeLevel[] = ['Semua', 1, 2, 3, 4, 5, 6];
  const subjects: (Subject | 'Semua')[] = [
    'Semua',
    'Matematika',
    'IPA',
    'Bahasa Indonesia',
    'Pendidikan Pancasila'
  ];

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchGrade = selectedGrade === 'Semua' || quiz.grade === selectedGrade;
    const matchSubject = selectedSubject === 'Semua' || quiz.subject === selectedSubject;
    return matchGrade && matchSubject;
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    const updated = DataManager.savePlayerProfile({
      nickname: tempNickname.trim() || 'Bintang SD',
      avatarId: tempAvatar,
    });
    setProfile(updated);
    setIsProfileModalOpen(false);
  };

  const handleStartWithRules = (quiz: Quiz) => {
    playClick();
    setRulesModalQuiz(quiz);
  };

  const handleDeleteCustomQuiz = (quizId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playClick();
    if (window.confirm('Yakin ingin menghapus kuis buatan ini?')) {
      DataManager.deleteCustomQuiz(quizId);
      setQuizzes(DataManager.getAllQuizzes());
    }
  };

  const currentAvatar = AVATAR_LIST.find((a) => a.id === profile.avatarId) || AVATAR_LIST[0];

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-amber-50/70 via-sky-50/40 to-indigo-50/40 pb-20 flex flex-col">
      {/* Top Navbar - Fluid Edge-to-Edge */}
      <header className="w-full sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-amber-200/60 shadow-sm px-3 sm:px-6 lg:px-10 xl:px-14 py-2.5 sm:py-3.5">
        <div className="w-full max-w-[2200px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex-shrink-0 flex items-center justify-center text-xl sm:text-2xl shadow-md select-none">
              ⭐
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-black text-slate-900 leading-none truncate">
                Kuis SD <span className="text-blue-600">Seru</span>
              </h1>
              <p className="text-[10px] sm:text-xs font-bold text-amber-600 tracking-wide mt-0.5 truncate">
                BELAJAR ASYIK KELAS 1 - 6
              </p>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Mode Guru Button */}
            <button
              onClick={() => {
                playClick();
                onOpenCreator();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm min-h-[44px] sm:min-h-[48px] shadow-sm btn-playful"
            >
              <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="hidden xs:inline">Buat Kuis Guru</span>
              <span className="xs:hidden">Guru</span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => {
                playClick();
                onToggleMute();
              }}
              className="p-2 sm:p-2.5 rounded-2xl bg-amber-100/90 text-amber-900 hover:bg-amber-200 transition-colors min-h-[44px] min-w-[44px] sm:min-h-[48px] sm:min-w-[48px] flex items-center justify-center btn-playful flex-shrink-0"
              title={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
              aria-label="Pengaturan Suara"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5 text-emerald-600" />}
            </button>

            {/* Profile Avatar Button */}
            <button
              onClick={() => {
                playClick();
                setTempNickname(profile.nickname);
                setTempAvatar(profile.avatarId);
                setIsProfileModalOpen(true);
              }}
              className="flex items-center gap-1.5 sm:gap-2 pl-2 pr-3 py-1.5 rounded-2xl bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 transition-colors min-h-[44px] sm:min-h-[48px] btn-playful flex-shrink-0"
              aria-label="Pengaturan Profil Pemain"
            >
              <span className="text-2xl select-none">{currentAvatar.emoji}</span>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-black text-blue-900 leading-tight truncate max-w-[110px]">
                  {profile.nickname}
                </p>
                <p className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5">
                  <Trophy className="w-3 h-3 text-amber-500" /> {profile.starsEarned} Bintang
                </p>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Fluid Content Container - Expands to full screen width up to 2200px */}
      <main className="w-full max-w-[2200px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-14 pt-4 sm:pt-6 space-y-5 sm:space-y-7 flex-1">
        
        {/* Responsive Hero Banner - Fluid & Beautiful on all screens */}
        <div className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white p-4 sm:p-7 lg:p-9 shadow-playful">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            {/* Left Side: Greeting & Description */}
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-extrabold text-amber-200">
                <Sparkles className="w-3.5 h-3.5" /> Platform Kuis Edukasi Interaktif SD
              </div>
              <h2 className="text-xl sm:text-3xl lg:text-4xl font-black leading-tight">
                Halo, {profile.nickname}! 👋
              </h2>
              <p className="text-blue-100 text-xs sm:text-base lg:text-lg font-medium leading-relaxed">
                Pilih kuis favoritmu, tantang pengetahuanmu dengan soal bergambar, dan kumpulkan 3 Bintang Emas untuk menjadi Juara Kelas!
              </p>
            </div>

            {/* Right Side: Quick Stats Badges for Wide / Ultrawide Displays */}
            <div className="flex flex-wrap md:flex-col gap-2.5 flex-shrink-0">
              <div className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl px-4 py-2.5 flex items-center gap-3">
                <Target className="w-5 h-5 text-amber-300 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-blue-200 font-bold block">Total Kuis Aktif</span>
                  <span className="text-sm sm:text-base font-black text-white">{quizzes.length} Paket Kuis</span>
                </div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl px-4 py-2.5 flex items-center gap-3">
                <Zap className="w-5 h-5 text-yellow-300 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-blue-200 font-bold block">Mata Pelajaran</span>
                  <span className="text-sm sm:text-base font-black text-white">5 Bidang Studi SD</span>
                </div>
              </div>
            </div>

          </div>

          {/* Decorative Rocket Background */}
          <div className="absolute right-2 bottom-0 text-7xl sm:text-9xl opacity-15 select-none pointer-events-none hidden sm:block">
            🚀
          </div>
        </div>

        {/* Grade Filter Pills - Fluid Horizontal Track */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-600" /> Filter Tingkat Kelas
            </h3>
            <span className="text-xs font-bold text-slate-500">
              {selectedGrade === 'Semua' ? 'Menampilkan Semua Kelas' : `Kelas ${selectedGrade} SD`}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
            {grades.map((grade) => {
              const isActive = selectedGrade === grade;
              return (
                <button
                  key={grade}
                  onClick={() => {
                    playClick();
                    setSelectedGrade(grade);
                  }}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all min-h-[44px] sm:min-h-[48px] btn-playful ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-playful-sm scale-105'
                      : 'bg-white text-slate-700 hover:bg-amber-100/60 border-2 border-slate-200/80'
                  }`}
                >
                  {grade === 'Semua' ? '🌟 Semua Kelas' : `Kelas ${grade} SD`}
                </button>
              );
            })}
          </div>
        </section>

        {/* Subject Filter Pills */}
        <section className="space-y-2">
          <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" /> Mata Pelajaran
          </h3>

          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
            {subjects.map((subj) => {
              const isActive = selectedSubject === subj;
              return (
                <button
                  key={subj}
                  onClick={() => {
                    playClick();
                    setSelectedSubject(subj);
                  }}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[40px] sm:min-h-[44px] ${
                    isActive
                      ? 'bg-amber-500 text-slate-900 font-black shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {subj}
                </button>
              );
            })}
          </div>
        </section>

        {/* Quizzes Dynamic Grid - Fluid from 1 column on Mobile to 6 columns on Ultrawide */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-xl font-black text-slate-900">
              Katalog Kuis ({filteredQuizzes.length})
            </h3>
          </div>

          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[2200px]:grid-cols-6 gap-4 sm:gap-5 lg:gap-6">
            {filteredQuizzes.map((quiz) => {
              const isCustom = quiz.id.startsWith('custom_');
              return (
                <div
                  key={quiz.id}
                  className="group relative bg-white rounded-3xl p-4 sm:p-5 border-2 border-slate-200/90 shadow-playful hover:shadow-card-glow hover:border-blue-400 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Card Header with badges that never overflow or overlap */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-2xl sm:text-3xl p-2 bg-amber-50 rounded-2xl border border-amber-200/60 select-none shadow-sm flex-shrink-0">
                        {quiz.coverEmoji}
                      </span>
                      
                      {/* Responsive Badges Container */}
                      <div className="flex flex-wrap items-center justify-end gap-1.5 min-w-0">
                        {isCustom && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-extrabold text-[10px] whitespace-nowrap">
                            Karya Guru 🧑‍🏫
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold text-xs whitespace-nowrap">
                          Kelas {quiz.grade}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs whitespace-nowrap">
                          {quiz.subject}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description with break-words */}
                    <h4 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors break-words line-clamp-2 mb-1.5 leading-snug">
                      {quiz.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed mb-4">
                      {quiz.description}
                    </p>
                  </div>

                  {/* Card Footer Details */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-blue-500" /> {quiz.questions.length} Soal
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" /> {quiz.durationPerQuestionSec}s / soal
                      </span>
                    </div>

                    {/* Action buttons with minimum 48px touch targets */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartWithRules(quiz)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-3 px-4 rounded-2xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 min-h-[48px] btn-playful text-xs sm:text-sm"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Mulai Kuis</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {isCustom && (
                        <button
                          onClick={(e) => handleDeleteCustomQuiz(quiz.id, e)}
                          className="p-3 text-rose-500 hover:bg-rose-50 rounded-2xl border border-rose-200 min-h-[48px] min-w-[48px] flex items-center justify-center"
                          title="Hapus Kuis Ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredQuizzes.length === 0 && (
            <div className="w-full text-center py-14 bg-white rounded-3xl border-2 border-dashed border-slate-300 p-6">
              <div className="text-5xl mb-3">🔍</div>
              <h4 className="text-lg font-black text-slate-800 mb-1">Belum Ada Kuis untuk Filter Ini</h4>
              <p className="text-sm text-slate-500 mb-4">Coba pilih jenjang kelas atau mata pelajaran lainnya ya!</p>
              <button
                onClick={() => {
                  playClick();
                  onOpenCreator();
                }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 text-white font-black text-sm min-h-[48px] shadow-md"
              >
                <PlusCircle className="w-4 h-4" /> Buat Kuis Baru Sekarang
              </button>
            </div>
          )}
        </section>

      </main>

      {/* MODAL 1: Aturan Singkat (Quick Rules Modal) - Completely Responsive */}
      {rulesModalQuiz && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-pop-in">
          <div className="bg-white w-full max-w-lg mx-auto my-auto rounded-3xl shadow-2xl border-4 border-amber-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-2xl sm:text-3xl flex-shrink-0">{rulesModalQuiz.coverEmoji}</span>
                <div className="min-w-0">
                  <h3 className="font-black text-sm sm:text-base leading-tight truncate">
                    {rulesModalQuiz.title}
                  </h3>
                  <p className="text-xs text-blue-100 font-bold">
                    Aturan Singkat & Petunjuk Kuis
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRulesModalQuiz(null)}
                className="p-2 min-h-[44px] min-w-[44px] text-white/80 hover:text-white rounded-xl flex-shrink-0"
                aria-label="Tutup Aturan"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Rules */}
            <div className="p-4 sm:p-6 space-y-3.5 text-slate-700 overflow-y-auto flex-1">
              <div className="flex items-start gap-3 bg-amber-50 p-3.5 rounded-2xl border border-amber-200">
                <div className="text-2xl flex-shrink-0">⏱️</div>
                <div>
                  <h5 className="font-black text-xs sm:text-sm text-amber-900">Waktu Santai</h5>
                  <p className="text-xs text-amber-800">
                    Kamu punya waktu <strong>{rulesModalQuiz.durationPerQuestionSec} detik</strong> untuk setiap soal.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-blue-50 p-3.5 rounded-2xl border border-blue-200">
                <div className="text-2xl flex-shrink-0">⭐</div>
                <div>
                  <h5 className="font-black text-xs sm:text-sm text-blue-900">Kumpulkan Bintang</h5>
                  <p className="text-xs text-blue-800">
                    Jawab benar sebanyak mungkin untuk meraih hingga <strong>3 Bintang Emas</strong>!
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200">
                <div className="text-2xl flex-shrink-0">💡</div>
                <div>
                  <h5 className="font-black text-xs sm:text-sm text-emerald-900">Penjelasan Lengkap</h5>
                  <p className="text-xs text-emerald-800">
                    Di akhir kuis ada pembahasan untuk soal yang belum kamu ketahui jawabannya.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex gap-3 flex-shrink-0">
              <button
                onClick={() => setRulesModalQuiz(null)}
                className="flex-1 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm text-slate-600 bg-white border-2 border-slate-200 hover:bg-slate-100 min-h-[48px]"
              >
                Kembali
              </button>
              <button
                onClick={() => {
                  const q = rulesModalQuiz;
                  setRulesModalQuiz(null);
                  onSelectQuiz(q);
                }}
                className="flex-[2] py-3 px-4 rounded-2xl font-black text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 min-h-[48px] btn-playful"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mulai Main Sekarang!</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Identitas Pemain (Pilih Avatar & Nickname) - Completely Responsive */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-pop-in">
          <div className="bg-white w-full max-w-lg mx-auto my-auto rounded-3xl shadow-2xl border-4 border-blue-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <User className="w-6 h-6 text-amber-300" />
                <h3 className="font-black text-base sm:text-lg">Atur Identitas Pemain</h3>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-2 min-h-[44px] min-w-[44px] text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Panggilan (Maksimal 12 Huruf)
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={tempNickname}
                  onChange={(e) => setTempNickname(e.target.value)}
                  placeholder="Contoh: Budi Juara"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-300 focus:border-blue-500 focus:outline-none font-bold text-sm text-slate-800 min-h-[48px]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Pilih Avatar Favoritmu
                </label>
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {AVATAR_LIST.map((avatar) => {
                    const isSelected = tempAvatar === avatar.id;
                    return (
                      <button
                        type="button"
                        key={avatar.id}
                        onClick={() => {
                          playClick();
                          setTempAvatar(avatar.id);
                        }}
                        className={`p-2.5 sm:p-3 rounded-2xl flex flex-col items-center justify-center border-2 transition-all min-h-[60px] sm:min-h-[70px] ${
                          isSelected
                            ? 'bg-blue-100 border-blue-600 scale-105 shadow-md ring-2 ring-blue-400'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-2xl sm:text-3xl select-none">{avatar.emoji}</span>
                        <span className="text-[10px] font-bold text-slate-700 mt-1 truncate max-w-full">
                          {avatar.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl font-bold text-xs sm:text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 min-h-[48px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl font-black text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md min-h-[48px] btn-playful"
                >
                  Simpan Profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
