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
  Trash2
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

  // Reload quizzes on mount
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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-sky-50/40 to-indigo-50/40 pb-20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-amber-100 shadow-sm px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl shadow-md select-none">
              ⭐
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-none">
                Kuis SD <span className="text-blue-600">Seru</span>
              </h1>
              <p className="text-[11px] font-bold text-amber-600 tracking-wide mt-0.5">
                BELAJAR ASYIK KELAS 1 - 6
              </p>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            {/* Mode Guru Button */}
            <button
              onClick={() => {
                playClick();
                onOpenCreator();
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs min-h-[48px] shadow-sm btn-playful"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Kuis Guru</span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => {
                playClick();
                onToggleMute();
              }}
              className="p-2.5 rounded-2xl bg-amber-100/80 text-amber-900 hover:bg-amber-200 transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center btn-playful"
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
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-2xl bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 transition-colors min-h-[48px] btn-playful"
              aria-label="Pengaturan Profil Pemain"
            >
              <span className="text-2xl select-none">{currentAvatar.emoji}</span>
              <div className="text-left hidden xs:block">
                <p className="text-xs font-black text-blue-900 leading-tight truncate max-w-[90px]">
                  {profile.nickname}
                </p>
                <p className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5">
                  <Trophy className="w-3 h-3 text-amber-500" /> {profile.starsEarned}
                </p>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-5xl mx-auto px-4 pt-4 sm:pt-6 space-y-6">
        
        {/* Cheerful Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white p-5 sm:p-7 shadow-playful">
          <div className="relative z-10 max-w-lg">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-extrabold text-amber-200 mb-2.5">
              <Sparkles className="w-3.5 h-3.5" /> Siap Menjadi Juara Hari Ini?
            </div>
            <h2 className="text-2xl sm:text-3xl font-black leading-tight mb-2">
              Halo, {profile.nickname}! 👋
            </h2>
            <p className="text-blue-100 text-sm sm:text-base font-medium leading-relaxed mb-4">
              Pilih kuis favoritmu, jawab tantangan soal bergambar, dan kumpulkan bintang prestasimu!
            </p>

            {/* Quick Button for Mobile Guru Mode */}
            <div className="sm:hidden pt-1">
              <button
                onClick={() => {
                  playClick();
                  onOpenCreator();
                }}
                className="w-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-black py-2.5 px-4 rounded-2xl text-xs shadow-md flex items-center justify-center gap-1.5 min-h-[44px] btn-playful"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Mode Guru: Buat Kuis Baru Sendiri ✍️</span>
              </button>
            </div>
          </div>
          {/* Decorative Emojis */}
          <div className="absolute -right-2 -bottom-4 text-7xl sm:text-8xl opacity-30 select-none pointer-events-none">
            🚀
          </div>
        </div>

        {/* Grade Filter Pills */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-600" /> Pilih Jenjang Kelas
            </h3>
            <span className="text-xs font-bold text-slate-500">
              {selectedGrade === 'Semua' ? 'Menampilkan Semua Kelas' : `Kelas ${selectedGrade} SD`}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {grades.map((grade) => {
              const isActive = selectedGrade === grade;
              return (
                <button
                  key={grade}
                  onClick={() => {
                    playClick();
                    setSelectedGrade(grade);
                  }}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-2xl font-black text-sm transition-all min-h-[48px] btn-playful ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-playful-sm scale-105'
                      : 'bg-white text-slate-700 hover:bg-amber-100/60 border-2 border-slate-200/80'
                  }`}
                >
                  {grade === 'Semua' ? '🌟 Semua Kelas' : `Kelas ${grade}`}
                </button>
              );
            })}
          </div>
        </section>

        {/* Subject Filter Pills */}
        <section className="space-y-2">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" /> Mata Pelajaran
          </h3>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {subjects.map((subj) => {
              const isActive = selectedSubject === subj;
              return (
                <button
                  key={subj}
                  onClick={() => {
                    playClick();
                    setSelectedSubject(subj);
                  }}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[44px] ${
                    isActive
                      ? 'bg-amber-500 text-slate-900 font-black shadow-sm'
                      : 'bg-white/80 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {subj}
                </button>
              );
            })}
          </div>
        </section>

        {/* Quizzes Grid */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">
              Daftar Kuis ({filteredQuizzes.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredQuizzes.map((quiz) => {
              const isCustom = quiz.id.startsWith('custom_');
              return (
                <div
                  key={quiz.id}
                  className="group relative bg-white rounded-3xl p-5 border-2 border-slate-200/80 shadow-playful hover:shadow-card-glow hover:border-blue-400 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Card Top Header */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl p-2 bg-amber-50 rounded-2xl border border-amber-200/60 select-none shadow-sm">
                        {quiz.coverEmoji}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isCustom && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-extrabold text-[10px]">
                            Karya Guru
                          </span>
                        )}
                        <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-extrabold text-xs">
                          Kelas {quiz.grade}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                          {quiz.subject}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h4 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1.5">
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

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartWithRules(quiz)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-3 px-4 rounded-2xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 min-h-[48px] btn-playful"
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
            <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-300 p-6">
              <div className="text-5xl mb-3">🔍</div>
              <h4 className="text-base font-black text-slate-800 mb-1">Belum Ada Kuis untuk Filter Ini</h4>
              <p className="text-xs sm:text-sm text-slate-500 mb-3">Coba pilih jenjang kelas atau mata pelajaran lainnya ya!</p>
              <button
                onClick={() => {
                  playClick();
                  onOpenCreator();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 text-white font-black text-xs"
              >
                <PlusCircle className="w-4 h-4" /> Buat Kuis Baru Sekarang
              </button>
            </div>
          )}
        </section>

      </main>

      {/* MODAL 1: Aturan Singkat (Quick Rules Modal) */}
      {rulesModalQuiz && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-pop-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-4 border-amber-200 overflow-hidden">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl">{rulesModalQuiz.coverEmoji}</span>
                <div>
                  <h3 className="font-black text-base sm:text-lg leading-tight">
                    {rulesModalQuiz.title}
                  </h3>
                  <p className="text-xs text-blue-100 font-bold">
                    Aturan Singkat & Petunjuk Kuis
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRulesModalQuiz(null)}
                className="p-2 min-h-[44px] min-w-[44px] text-white/80 hover:text-white rounded-xl"
                aria-label="Tutup Aturan"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Rules */}
            <div className="p-5 space-y-4 text-slate-700">
              <div className="flex items-start gap-3 bg-amber-50 p-3.5 rounded-2xl border border-amber-200">
                <div className="text-2xl">⏱️</div>
                <div>
                  <h5 className="font-black text-xs sm:text-sm text-amber-900">Waktu Santai</h5>
                  <p className="text-xs text-amber-800">
                    Kamu punya waktu <strong>{rulesModalQuiz.durationPerQuestionSec} detik</strong> untuk setiap soal.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-blue-50 p-3.5 rounded-2xl border border-blue-200">
                <div className="text-2xl">⭐</div>
                <div>
                  <h5 className="font-black text-xs sm:text-sm text-blue-900">Kumpulkan Bintang</h5>
                  <p className="text-xs text-blue-800">
                    Jawab benar sebanyak mungkin untuk meraih hingga <strong>3 Bintang Emas</strong>!
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200">
                <div className="text-2xl">💡</div>
                <div>
                  <h5 className="font-black text-xs sm:text-sm text-emerald-900">Penjelasan Lengkap</h5>
                  <p className="text-xs text-emerald-800">
                    Di akhir kuis ada pembahasan untuk soal yang belum kamu ketahui jawabannya.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3">
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

      {/* MODAL 2: Identitas Pemain (Pilih Avatar & Nickname) */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-pop-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-4 border-blue-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 flex items-center justify-between">
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

            <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
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
                <div className="grid grid-cols-4 gap-2.5">
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
                        className={`p-3 rounded-2xl flex flex-col items-center justify-center border-2 transition-all min-h-[64px] ${
                          isSelected
                            ? 'bg-blue-100 border-blue-600 scale-105 shadow-md ring-2 ring-blue-400'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-3xl select-none">{avatar.emoji}</span>
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
