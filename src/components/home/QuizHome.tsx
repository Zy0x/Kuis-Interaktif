import React, { useState, useEffect } from 'react';
import type { Quiz, GradeLevel, Subject } from '../../types/quiz';
import { AVATAR_LIST } from '../../data/seedQuizzes';
import { DataManager } from '../../lib/supabaseClient';
import { 
  Play, 
  Clock, 
  HelpCircle, 
  Volume2, 
  VolumeX, 
  Trophy, 
  ChevronRight,
  BookOpen,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Layers,
  Sparkles
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
    if (window.confirm('Hapus kuis ini dari daftar kuis guru?')) {
      DataManager.deleteCustomQuiz(quizId);
      setQuizzes(DataManager.getAllQuizzes());
    }
  };

  const currentAvatar = AVATAR_LIST.find((a) => a.id === profile.avatarId) || AVATAR_LIST[0];

  // Subject color styling helper (calm, intentional accents)
  const getSubjectBadge = (subj: Subject) => {
    switch (subj) {
      case 'Matematika':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'IPA':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Bahasa Indonesia':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Pendidikan Pancasila':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 pb-20 flex flex-col">
      
      {/* Top Navbar - Clean, Minimalist, Professional */}
      <header className="w-full sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm px-4 sm:px-8 lg:px-12 py-3">
        <div className="w-full max-w-[2000px] mx-auto flex items-center justify-between gap-3">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-sm select-none">
              ⭐
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-none">
                Kuis SD <span className="text-blue-600 font-extrabold">Seru</span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Media Belajar Interaktif Kelas 1 - 6
              </p>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={() => {
                playClick();
                onOpenCreator();
              }}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm min-h-[44px] transition-colors btn-press shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Buat Kuis Guru</span>
              <span className="sm:hidden">Buat Kuis</span>
            </button>

            {/* Audio Toggle Button */}
            <button
              onClick={() => {
                playClick();
                onToggleMute();
              }}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center btn-press"
              title={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
              aria-label="Pengaturan Suara"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5 text-slate-700" />}
            </button>

            {/* Profile Avatar Pill */}
            <button
              onClick={() => {
                playClick();
                setTempNickname(profile.nickname);
                setTempAvatar(profile.avatarId);
                setIsProfileModalOpen(true);
              }}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors min-h-[44px] btn-press"
              aria-label="Pengaturan Profil Pemain"
            >
              <span className="text-xl select-none">{currentAvatar.emoji}</span>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[100px]">
                  {profile.nickname}
                </p>
                <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5">
                  <Trophy className="w-2.5 h-2.5" /> {profile.starsEarned} Bintang
                </p>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Fluid Content */}
      <main className="w-full max-w-[2000px] mx-auto px-4 sm:px-8 lg:px-12 pt-5 sm:pt-7 space-y-6 flex-1">
        
        {/* Welcoming Header Banner - Calm, Sophisticated, Encouraging */}
        <div className="w-full bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white rounded-2xl p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold text-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Selamat Belajar Siswa Pintar
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Halo, {profile.nickname}!
            </h2>
            <p className="text-blue-100/90 text-sm sm:text-base leading-relaxed">
              Pilih kuis di bawah untuk mengasah pemahamanmu dengan soal bergambar yang interaktif dan kumpulkan 3 Bintang Emas!
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-4 flex-shrink-0">
            <div className="text-3xl select-none">🏆</div>
            <div>
              <span className="text-xs text-blue-200 block font-medium">Bintang Terkumpul</span>
              <span className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-1">
                {profile.starsEarned} <span className="text-amber-300 text-sm">⭐ Bintang</span>
              </span>
            </div>
          </div>
        </div>

        {/* Filter Section: Kelas & Mata Pelajaran */}
        <div className="space-y-3">
          
          {/* Row 1: Filter Kelas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Jenjang Kelas
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {selectedGrade === 'Semua' ? 'Menampilkan Semua Jenjang' : `Khusus Kelas ${selectedGrade} SD`}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {grades.map((grade) => {
              const isActive = selectedGrade === grade;
              return (
                <button
                  key={grade}
                  onClick={() => {
                    playClick();
                    setSelectedGrade(grade);
                  }}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[42px] btn-press ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {grade === 'Semua' ? 'Semua Kelas' : `Kelas ${grade} SD`}
                </button>
              );
            })}
          </div>

          {/* Row 2: Filter Mata Pelajaran */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 pt-1">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1 flex-shrink-0">
              <Layers className="w-3.5 h-3.5" /> Mapel:
            </span>
            {subjects.map((subj) => {
              const isActive = selectedSubject === subj;
              return (
                <button
                  key={subj}
                  onClick={() => {
                    playClick();
                    setSelectedSubject(subj);
                  }}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[38px] ${
                    isActive
                      ? 'bg-slate-900 text-white font-semibold shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {subj}
                </button>
              );
            })}
          </div>

        </div>

        {/* Quizzes Dynamic Grid - Fluid, Balanced, No Dead Space */}
        <section className="space-y-3.5 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Daftar Kuis ({filteredQuizzes.length})
            </h3>
          </div>

          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[2200px]:grid-cols-6 gap-4 sm:gap-5">
            {filteredQuizzes.map((quiz) => {
              const isCustom = quiz.id.startsWith('custom_');
              return (
                <div
                  key={quiz.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-card hover:shadow-card-hover hover:border-blue-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header Row: Subject Badge & Grade Pill */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-2xl p-2 rounded-xl bg-slate-50 border border-slate-100 select-none flex-shrink-0">
                          {quiz.coverEmoji}
                        </span>
                        <div className="min-w-0">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border inline-block truncate ${getSubjectBadge(quiz.subject)}`}>
                            {quiz.subject}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {isCustom && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[10px]">
                            Guru
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                          Kelas {quiz.grade}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="text-base font-bold text-slate-900 leading-snug break-words line-clamp-2 mb-1.5">
                      {quiz.title}
                    </h4>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed mb-4">
                      {quiz.description}
                    </p>
                  </div>

                  {/* Footer Meta & Action */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> {quiz.questions.length} Soal
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {quiz.durationPerQuestionSec}s / soal
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartWithRules(quiz)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 min-h-[46px] btn-press text-xs sm:text-sm"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Mulai Kuis</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {isCustom && (
                        <button
                          onClick={(e) => handleDeleteCustomQuiz(quiz.id, e)}
                          className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 min-h-[46px] min-w-[46px] flex items-center justify-center transition-colors"
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
            <div className="w-full text-center py-14 bg-white rounded-2xl border border-dashed border-slate-200 p-6">
              <div className="text-4xl mb-2">🔍</div>
              <h4 className="text-base font-bold text-slate-800 mb-1">Belum Ada Kuis untuk Kategori Ini</h4>
              <p className="text-xs text-slate-500 mb-3">Coba pilih jenjang kelas atau mata pelajaran lainnya.</p>
              <button
                onClick={() => {
                  playClick();
                  onOpenCreator();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs min-h-[42px]"
              >
                <Plus className="w-4 h-4" /> Buat Kuis Baru
              </button>
            </div>
          )}
        </section>

      </main>

      {/* Modal 1: Aturan Singkat (Clean, Calm, Clear) */}
      {rulesModalQuiz && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
          {/* Static Backdrop Overlay: Smooth opacity fade only, zero transform/movement */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-backdrop-fade"
            onClick={() => setRulesModalQuiz(null)}
            aria-hidden="true"
          />

          {/* Dialog Card: Pure card entrance animation */}
          <div className="relative z-10 bg-white w-full max-w-md mx-auto my-auto rounded-2xl shadow-pop border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-modal-card-in">
            
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl p-1.5 rounded-lg bg-slate-50 border border-slate-100 select-none flex-shrink-0">
                  {rulesModalQuiz.coverEmoji}
                </span>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-base leading-tight truncate">
                    {rulesModalQuiz.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Petunjuk Pengerjaan Soal
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRulesModalQuiz(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg min-h-[40px] min-w-[40px] flex-shrink-0"
                aria-label="Tutup Aturan"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rules Content */}
            <div className="p-5 space-y-3 text-slate-700 overflow-y-auto flex-1">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-xl flex-shrink-0">⏱️</div>
                <div>
                  <h5 className="font-bold text-xs text-slate-900">Durasi Menjawab</h5>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Tiap soal berdurasi <strong>{rulesModalQuiz.durationPerQuestionSec} detik</strong>. Tidak perlu terburu-buru, jawablah dengan teliti.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-xl flex-shrink-0">⭐</div>
                <div>
                  <h5 className="font-bold text-xs text-slate-900">Sistem Bintang Prestasi</h5>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Dapatkan hingga <strong>3 Bintang Emas</strong> dengan menjawab seluruh pertanyaan secara tepat.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-xl flex-shrink-0">💡</div>
                <div>
                  <h5 className="font-bold text-xs text-slate-900">Pembahasan di Akhir</h5>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Setelah selesai, kamu bisa membaca pembahasan lengkap untuk soal yang belum kamu ketahui.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2.5 flex-shrink-0">
              <button
                onClick={() => setRulesModalQuiz(null)}
                className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 min-h-[44px]"
              >
                Kembali
              </button>
              <button
                onClick={() => {
                  const q = rulesModalQuiz;
                  setRulesModalQuiz(null);
                  onSelectQuiz(q);
                }}
                className="flex-[2] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm flex items-center justify-center gap-2 min-h-[44px] btn-press"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mulai Kuis</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Profil Pemain */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
          {/* Static Backdrop Overlay: Smooth opacity fade only, zero transform/movement */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-backdrop-fade"
            onClick={() => setIsProfileModalOpen(false)}
            aria-hidden="true"
          />

          {/* Dialog Card: Pure card entrance animation */}
          <div className="relative z-10 bg-white w-full max-w-md mx-auto my-auto rounded-2xl shadow-pop border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-modal-card-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-slate-900 text-base">Atur Profil Pemain</h3>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg min-h-[40px] min-w-[40px]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Panggilan (Maksimal 12 Karakter)
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={tempNickname}
                  onChange={(e) => setTempNickname(e.target.value)}
                  placeholder="Contoh: Budi Juara"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none font-semibold text-sm text-slate-900 min-h-[44px]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Pilih Avatar
                </label>
                <div className="grid grid-cols-4 gap-2">
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
                        className={`p-2.5 rounded-xl flex flex-col items-center justify-center border transition-all min-h-[60px] ${
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

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm min-h-[44px] btn-press"
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
