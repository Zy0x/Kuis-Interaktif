import React, { useState, useEffect } from 'react';
import type { Quiz, GradeLevel, Subject, TeacherProfile } from '../../types/quiz';
import { AVATAR_LIST } from '../../data/seedQuizzes';
import { DataManager } from '../../lib/supabaseClient';
import { useBackHandler } from '../../lib/navigationHistory';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
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
  Trash2,
  Layers,
  Sparkles,
  GraduationCap,
  KeyRound,
  ArrowRight,
  AlertCircle,
  LayoutDashboard,
  LogOut,
  School,
  Mail,
  User
} from 'lucide-react';

interface QuizHomeProps {
  onSelectQuiz: (quiz: Quiz) => void;
  onOpenTeacherPortal: () => void;
  onEnterPin: (quiz: Quiz) => void;
  teacher: TeacherProfile | null;
  onTeacherLogout?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  playClick: () => void;
}

export const QuizHome: React.FC<QuizHomeProps> = ({
  onSelectQuiz,
  onOpenTeacherPortal,
  onEnterPin,
  teacher,
  onTeacherLogout,
  isMuted,
  onToggleMute,
  playClick,
}) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>(() => DataManager.getAllQuizzes());
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>('Semua');
  const [selectedSubject, setSelectedSubject] = useState<string>('Semua');
  const [profile, setProfile] = useState(() => DataManager.getPlayerProfile());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isTeacherProfileModalOpen, setIsTeacherProfileModalOpen] = useState(false);
  const [rulesModalQuiz, setRulesModalQuiz] = useState<Quiz | null>(null);

  // Kunci scroll latar belakang saat modal profil siswa, modal guru, atau modal aturan terbuka
  useBodyScrollLock(isProfileModalOpen || isTeacherProfileModalOpen || Boolean(rulesModalQuiz));

  const isCustomName = (name?: string): boolean => {
    if (!name) return false;
    const trimmed = name.trim().toLowerCase();
    return trimmed !== '' && trimmed !== 'saya' && trimmed !== 'bintang sd';
  };

  const [tempNickname, setTempNickname] = useState(
    isCustomName(profile.nickname) ? profile.nickname : ''
  );
  const [tempAvatar, setTempAvatar] = useState(profile.avatarId);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isPinLoading, setIsPinLoading] = useState(false);

  // Student Cloud Auth State (Mode Tamu is Default)
  const [profileTab, setProfileTab] = useState<'guest' | 'login' | 'register'>('guest');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentGrade, setStudentGrade] = useState(1);
  const [studentAuthLoading, setStudentAuthLoading] = useState(false);
  const [studentAuthError, setStudentAuthError] = useState<string | null>(null);

  // 1. Level 1 (Prioritas 100): Modal Aturan Kuis
  useBackHandler('home-rules-modal', 100, () => {
    if (rulesModalQuiz) {
      setRulesModalQuiz(null);
      return true;
    }
    return false;
  }, Boolean(rulesModalQuiz));

  // 2. Level 1 (Prioritas 100): Modal Profil Siswa
  useBackHandler('home-profile-modal', 100, () => {
    if (isProfileModalOpen) {
      if (profileTab !== 'guest') {
        setProfileTab('guest');
        return true;
      }
      setIsProfileModalOpen(false);
      return true;
    }
    return false;
  }, isProfileModalOpen);

  // 2b. Level 1 (Prioritas 100): Modal Profil Guru
  useBackHandler('home-teacher-profile-modal', 100, () => {
    if (isTeacherProfileModalOpen) {
      setIsTeacherProfileModalOpen(false);
      return true;
    }
    return false;
  }, isTeacherProfileModalOpen);

  // 3. Level 4 (Prioritas 10): Reset Filter Kategori Aktif
  const hasActiveFilter = selectedGrade !== 'Semua' || selectedSubject !== 'Semua';
  useBackHandler('home-filter-reset', 10, () => {
    if (hasActiveFilter) {
      setSelectedGrade('Semua');
      setSelectedSubject('Semua');
      return true;
    }
    return false;
  }, hasActiveFilter);

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
    const cleanNick = tempNickname.trim() || 'Saya';
    const updated = DataManager.savePlayerProfile({
      nickname: cleanNick,
      avatarId: tempAvatar,
    });
    setProfile(updated);
    setIsProfileModalOpen(false);
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    if (!pinInput.trim()) return;
    setPinError(null);
    setIsPinLoading(true);

    try {
      const match = await DataManager.getQuizByPin(pinInput.trim());
      if (match) {
        onEnterPin(match);
      } else {
        setPinError('PIN Kuis tidak ditemukan. Silakan periksa kembali 4 digit PIN dari gurumu.');
      }
    } catch {
      setPinError('Gagal memeriksa PIN. Coba lagi sebentar.');
    } finally {
      setIsPinLoading(false);
    }
  };

  const handleStudentSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    setStudentAuthError(null);
    setStudentAuthLoading(true);
    try {
      const res = await DataManager.signInStudent(studentEmail, studentPassword);
      if (res.success && res.profile) {
        setProfile(res.profile);
        setTempNickname(isCustomName(res.profile.nickname) ? res.profile.nickname : '');
        setTempAvatar(res.profile.avatarId);
        setProfileTab('guest');
        setIsProfileModalOpen(false);
      } else {
        setStudentAuthError(res.error || 'Email atau kata sandi tidak sesuai.');
      }
    } catch {
      setStudentAuthError('Gagal menghubungi server.');
    } finally {
      setStudentAuthLoading(false);
    }
  };

  const handleStudentSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    if (studentPassword.length < 6) {
      setStudentAuthError('Kata sandi minimal 6 karakter.');
      return;
    }
    setStudentAuthError(null);
    setStudentAuthLoading(true);
    try {
      const res = await DataManager.signUpStudent(
        studentEmail,
        studentPassword,
        tempNickname.trim() || 'Saya',
        studentGrade
      );
      if (res.success && res.profile) {
        setProfile(res.profile);
        setProfileTab('guest');
        setIsProfileModalOpen(false);
      } else {
        setStudentAuthError(res.error || 'Gagal mendaftar akun siswa.');
      }
    } catch {
      setStudentAuthError('Gagal mendaftar akun siswa.');
    } finally {
      setStudentAuthLoading(false);
    }
  };

  const handleStudentSignOut = async () => {
    playClick();
    const guest = await DataManager.signOutStudent();
    setProfile(guest);
    setTempNickname(isCustomName(guest.nickname) ? guest.nickname : '');
    setTempAvatar(guest.avatarId);
    setProfileTab('guest');
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
            {!teacher ? (
              <>
                {/* Teacher Portal Entry Button */}
                <button
                  onClick={() => {
                    playClick();
                    onOpenTeacherPortal();
                  }}
                  className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs sm:text-sm min-h-[44px] transition-colors btn-press shadow-sm whitespace-nowrap"
                  title="Portal Masuk Guru"
                >
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span className="hidden sm:inline">Portal Guru</span>
                  <span className="sm:hidden">Guru</span>
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

                {/* Profile Avatar Pill (Mode Siswa / Tamu) */}
                <button
                  onClick={() => {
                    playClick();
                    setTempNickname(isCustomName(profile.nickname) ? profile.nickname : '');
                    setTempAvatar(profile.avatarId);
                    setIsProfileModalOpen(true);
                  }}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors min-h-[44px] btn-press"
                  aria-label="Pengaturan Profil Pemain"
                >
                  <span className="text-xl select-none">{currentAvatar.emoji}</span>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[100px]">
                      {isCustomName(profile.nickname) ? profile.nickname : 'Saya'}
                    </p>
                    <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5">
                      <Trophy className="w-2.5 h-2.5" /> {profile.starsEarned} Bintang
                    </p>
                  </div>
                </button>
              </>
            ) : (
              <>
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

                {/* Profil Resmi Guru (Menggantikan Profil Tamu Siswa) */}
                <button
                  onClick={() => {
                    playClick();
                    setIsTeacherProfileModalOpen(true);
                  }}
                  className="flex items-center gap-2 pl-2 sm:pl-2.5 pr-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 transition-colors min-h-[44px] btn-press shadow-sm"
                  title={`Profil Guru: ${teacher.fullName}`}
                  aria-label="Profil Akun Guru"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-extrabold text-blue-950 leading-tight truncate max-w-[120px] sm:max-w-[180px]">
                      {teacher.fullName}
                    </p>
                    <p className="text-[10px] text-blue-700 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                      <span className="truncate max-w-[100px] sm:max-w-[150px]">{teacher.schoolName || 'Guru SD'}</span>
                    </p>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Fluid Content */}
      <main className="w-full max-w-[2000px] mx-auto px-4 sm:px-8 lg:px-12 pt-5 sm:pt-7 space-y-6 flex-1">
        
        {/* Quick PIN Entry Bar for Students */}
        <div className="w-full bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-sm">
          <form onSubmit={handlePinSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs sm:text-sm whitespace-nowrap self-start sm:self-center">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <span>Punya PIN Kuis dari Guru?</span>
            </div>

            <div className="flex-1 w-full flex items-center gap-2">
              <input
                type="text"
                maxLength={8}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(null);
                }}
                aria-label="Masukkan 4 digit PIN Kuis"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono font-bold text-xs sm:text-sm text-slate-900 min-h-[44px]"
              />

              <button
                type="submit"
                disabled={isPinLoading || !pinInput.trim()}
                className="px-4 sm:px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm min-h-[44px] flex items-center gap-1.5 shadow-sm transition-all btn-press disabled:opacity-50 whitespace-nowrap"
              >
                {isPinLoading ? 'Mencari...' : 'Masuk Kuis'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {pinError && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{pinError}</span>
            </div>
          )}
        </div>

        {/* Welcoming Header Banner - Dynamic Role Based */}
        {!teacher ? (
          <div className="w-full bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white rounded-2xl p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold text-blue-100">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Selamat Belajar Siswa Pintar
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {isCustomName(profile.nickname) ? `Halo, ${profile.nickname}!` : 'Halo, Siswa Hebat!'}
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
        ) : (
          <div className="w-full bg-gradient-to-r from-indigo-800 via-blue-800 to-sky-800 text-white rounded-2xl p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold text-indigo-100">
                <GraduationCap className="w-3.5 h-3.5 text-amber-300" /> Ruang Pendidik SD
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Halo, {teacher.fullName}!
              </h2>
              <p className="text-blue-100/90 text-sm sm:text-base leading-relaxed">
                Anda sedang aktif sebagai Guru di <strong className="text-white">{teacher.schoolName || 'SD Indonesia'}</strong>. Tinjau kuis aktif siswa, luncurkan kuis ke Smartboard kelas, atau kelola soal di Dasbor Guru.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-shrink-0">
              <button
                onClick={() => {
                  playClick();
                  onOpenTeacherPortal();
                }}
                className="px-5 py-3 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors min-h-[44px] btn-press"
              >
                <LayoutDashboard className="w-4 h-4 text-blue-600" />
                <span>Buka Dashboard Guru</span>
              </button>
            </div>
          </div>
        )}

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

          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-hover -mx-4 px-4 sm:mx-0 sm:px-0">
            {grades.map((grade) => {
              const isActive = selectedGrade === grade;
              return (
                <button
                  key={grade}
                  onClick={() => {
                    playClick();
                    setSelectedGrade(grade);
                  }}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[44px] btn-press ${
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

          {/* Row 2: Filter Mata Pelajaran (Label Mapel diam / tidak ikut bergeser) */}
          <div className="flex items-center gap-2 pt-1">
            <div className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold text-slate-600 pr-1 select-none">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Mapel:</span>
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 scrollbar-hover">
              {subjects.map((subj) => {
                const isActive = selectedSubject === subj;
                return (
                  <button
                    key={subj}
                    onClick={() => {
                      playClick();
                      setSelectedSubject(subj);
                    }}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all min-h-[44px] btn-press ${
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
                  setSelectedGrade('Semua');
                  setSelectedSubject('Semua');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs min-h-[42px] btn-press shadow-sm"
              >
                <span>Tampilkan Semua Kuis</span>
              </button>
            </div>
          )}
        </section>

      </main>

      {/* Modal 1: Aturan Singkat (Clean, Calm, Clear) */}
      {rulesModalQuiz && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 modal-wrapper overscroll-contain">
          {/* Static Backdrop Overlay: Smooth opacity fade only, zero transform/movement */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-backdrop-fade touch-none"
            onClick={() => setRulesModalQuiz(null)}
            onWheel={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            aria-hidden="true"
          />

          {/* Dialog Card: Pure card entrance animation */}
          <div className="relative z-10 bg-white w-full max-w-md mx-auto my-auto rounded-2xl shadow-pop border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-modal-card-in overscroll-contain">
            
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

      {/* Modal 2: Profil & Akun Siswa (Default: Mode Tamu) */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 modal-wrapper overscroll-contain">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-backdrop-fade touch-none"
            onClick={() => setIsProfileModalOpen(false)}
            onWheel={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 bg-white w-full max-w-md mx-auto my-auto rounded-3xl shadow-pop border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-modal-card-in overscroll-contain">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Profil & Akun Siswa</h3>
                <p className="text-xs text-slate-500">
                  {profile.isLoggedIn ? 'Akun Siswa Terhubung' : 'Mode Tamu (Default Aktif)'}
                </p>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50 p-1.5 gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setProfileTab('guest');
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
                  profileTab === 'guest'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Profil & Maskot
              </button>

              <button
                type="button"
                onClick={() => {
                  playClick();
                  setProfileTab(profile.isLoggedIn ? 'guest' : 'login');
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
                  profileTab !== 'guest' || profile.isLoggedIn
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {profile.isLoggedIn ? 'Akun Cloud Aktif' : 'Login / Simpan Cloud'}
              </button>
            </div>

            {/* TAB 1: Mode Tamu (Profil & Maskot) */}
            {profileTab === 'guest' && (
              <form onSubmit={handleSaveProfile} className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* Status Badge */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${profile.isLoggedIn ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                    {profile.isLoggedIn ? `Akun: ${profile.email}` : 'Status: Mode Tamu (Tanpa Login)'}
                  </span>
                  <span className="font-bold text-amber-600 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> {profile.starsEarned} ⭐
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Panggilan Siswa (Maksimal 12 Karakter)
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={tempNickname}
                    onChange={(e) => setTempNickname(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none font-bold text-sm text-slate-900 min-h-[44px]"
                  />
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">
                    Kosongkan jika ingin tetap menggunakan profil &quot;Saya&quot;.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Pilih Maskot Hewan
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
                          className={`p-2.5 rounded-2xl flex flex-col items-center justify-center border transition-all min-h-[60px] ${
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

                {/* Cloud account helper */}
                {!profile.isLoggedIn ? (
                  <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-blue-900">
                      <span className="font-bold block">Ingin menyimpan bintang di cloud?</span>
                      <span>Daftar akun siswa gratis.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setProfileTab('login');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-[11px] hover:bg-blue-700 min-h-[36px] whitespace-nowrap"
                    >
                      Masuk / Daftar
                    </button>
                  </div>
                ) : (
                  <div className="pt-1 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Bintang tersinkronisasi otomatis.</span>
                    <button
                      type="button"
                      onClick={handleStudentSignOut}
                      className="text-rose-600 hover:text-rose-700 font-bold"
                    >
                      Keluar Akun
                    </button>
                  </div>
                )}

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
            )}

            {/* TAB 2: Login / Daftar Akun Siswa (Cloud Sync) */}
            {profileTab !== 'guest' && (
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {profile.isLoggedIn ? (
                  <div className="space-y-4 text-center py-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-slate-900">
                        {isCustomName(profile.nickname) ? profile.nickname : 'Saya'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">{profile.email}</p>
                      <p className="text-xs font-bold text-amber-600 mt-2">
                        {profile.starsEarned} Bintang Tersimpan di Cloud
                      </p>
                    </div>

                    <div className="pt-4 flex gap-2.5">
                      <button
                        type="button"
                        onClick={handleStudentSignOut}
                        className="flex-1 py-2.5 rounded-xl font-bold text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 min-h-[44px]"
                      >
                        Keluar ke Mode Tamu
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfileTab('guest')}
                        className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 min-h-[44px]"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={profileTab === 'login' ? handleStudentSignIn : handleStudentSignUp}
                    className="space-y-3.5"
                  >
                    {studentAuthError && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-fade-in">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{studentAuthError}</span>
                      </div>
                    )}

                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          setProfileTab('login');
                          setStudentAuthError(null);
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          profileTab === 'login' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                        }`}
                      >
                        Masuk Siswa
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          setProfileTab('register');
                          setStudentAuthError(null);
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          profileTab === 'register' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                        }`}
                      >
                        Daftar Akun Baru
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Alamat Email Siswa
                      </label>
                      <input
                        type="email"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none font-semibold text-xs sm:text-sm text-slate-900 min-h-[44px]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Kata Sandi
                      </label>
                      <input
                        type="password"
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none font-semibold text-xs sm:text-sm text-slate-900 min-h-[44px]"
                      />
                    </div>

                    {profileTab === 'register' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tingkat Kelas SD
                        </label>
                        <select
                          value={studentGrade}
                          onChange={(e) => setStudentGrade(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none font-bold text-xs sm:text-sm text-slate-900 min-h-[44px]"
                        >
                          {[1, 2, 3, 4, 5, 6].map((g) => (
                            <option key={g} value={g}>
                              Kelas {g} SD
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="pt-2 space-y-2">
                      <button
                        type="submit"
                        disabled={studentAuthLoading}
                        className="w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm min-h-[44px] btn-press disabled:opacity-50"
                      >
                        {studentAuthLoading
                          ? 'Memproses...'
                          : profileTab === 'login'
                          ? 'Masuk ke Akun Siswa'
                          : 'Daftar & Hubungkan Akun'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          setProfileTab('guest');
                        }}
                        className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        Tetap Gunakan Mode Tamu
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 3: Profil Akun Guru (Terbuka saat Guru mengklik identitasnya di Beranda) */}
      {isTeacherProfileModalOpen && teacher && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 modal-wrapper overscroll-contain">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-backdrop-fade touch-none"
            onClick={() => setIsTeacherProfileModalOpen(false)}
            onWheel={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            aria-hidden="true"
          />

          <div 
            className="relative z-10 bg-white w-full max-w-md mx-auto my-auto rounded-3xl shadow-pop border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-modal-card-in overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-sm flex-shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-base leading-tight truncate">
                    Akun Pendidik & Guru
                  </h3>
                  <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                    Sesi Pendidik Aktif (Pro)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTeacherProfileModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg min-h-[40px] min-w-[40px] flex-shrink-0"
                aria-label="Tutup Profil Guru"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-slate-700 overflow-y-auto flex-1">
              <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white text-blue-600 flex items-center justify-center shadow-xs flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Nama Pendidik</span>
                    <span className="text-sm font-extrabold text-slate-900 truncate block">{teacher.fullName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white text-blue-600 flex items-center justify-center shadow-xs flex-shrink-0">
                    <School className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Asal Sekolah</span>
                    <span className="text-xs font-bold text-slate-800 truncate block">{teacher.schoolName || 'SD Indonesia'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white text-blue-600 flex items-center justify-center shadow-xs flex-shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Email Pendidik</span>
                    <span className="text-xs font-semibold text-slate-700 truncate block">{teacher.email}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Hak Akses Guru Aktif:
                </span>
                <p className="leading-relaxed">
                  Pembuatan kuis tak terbatas, generator soal kilat, pemantauan rekap nilai siswa, dan cetak lembar kerja siswa (LKS).
                </p>
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  onClick={() => {
                    playClick();
                    setIsTeacherProfileModalOpen(false);
                    onOpenTeacherPortal();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm min-h-[44px] flex items-center justify-center gap-2 btn-press transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Buka Dashboard Guru</span>
                </button>

                {onTeacherLogout && (
                  <button
                    onClick={() => {
                      playClick();
                      setIsTeacherProfileModalOpen(false);
                      onTeacherLogout();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 min-h-[44px] flex items-center justify-center gap-2 btn-press transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar Akun Guru (Logout)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
