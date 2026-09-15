import React, { useState } from 'react';
import { DataManager } from '../../lib/supabaseClient';
import type { TeacherProfile, PlayerProfile } from '../../types/quiz';
import { AVATAR_LIST } from '../../data/seedQuizzes';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../lib/navigationHistory';
import { 
  GraduationCap, 
  Backpack, 
  User, 
  School, 
  Sparkles, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  Mail, 
  LogOut 
} from 'lucide-react';

export interface OAuthOnboardingData {
  role: 'teacher' | 'student';
  profile: TeacherProfile | PlayerProfile;
}

interface OAuthOnboardingModalProps {
  isOpen: boolean;
  role: 'teacher' | 'student';
  profile: TeacherProfile | PlayerProfile;
  onCompleteTeacher: (profile: TeacherProfile) => void;
  onCompleteStudent: (profile: PlayerProfile) => void;
  onCancel: () => void;
  playClick?: () => void;
}

export const OAuthOnboardingModal: React.FC<OAuthOnboardingModalProps> = ({
  isOpen,
  role,
  profile,
  onCompleteTeacher,
  onCompleteStudent,
  onCancel,
  playClick,
}) => {
  useBodyScrollLock(isOpen);
  useBackHandler('oauth-onboarding-modal', 100, () => {
    onCancel();
    return true;
  }, isOpen);

  // State for Teacher
  const initialTeacherName = role === 'teacher' ? (profile as TeacherProfile).fullName || '' : '';
  const rawSchool = role === 'teacher' ? (profile as TeacherProfile).schoolName || '' : '';
  const initialSchoolName = (rawSchool === 'SD Indonesia' || rawSchool === 'SD Negeri Favorit') ? '' : rawSchool;

  const [teacherName, setTeacherName] = useState(initialTeacherName);
  const [teacherSchool, setTeacherSchool] = useState(initialSchoolName);

  // State for Student
  const initialStudentNickname = role === 'student' ? (profile as PlayerProfile).nickname || '' : '';
  const initialGrade = role === 'student' ? (profile as PlayerProfile).grade || 3 : 3;
  const initialAvatar = role === 'student' ? (profile as PlayerProfile).avatarId || 'lion' : 'lion';

  const [studentNickname, setStudentNickname] = useState(initialStudentNickname);
  const [studentGrade, setStudentGrade] = useState<number>(initialGrade);
  const [studentAvatar, setStudentAvatar] = useState<string>(initialAvatar);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const userEmail = (role === 'teacher' ? (profile as TeacherProfile).email : (profile as PlayerProfile).email) || '';

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (playClick) playClick();

    if (!teacherName.trim()) {
      setErrorMessage('Nama lengkap tidak boleh kosong.');
      return;
    }
    if (!teacherSchool.trim()) {
      setErrorMessage('Nama sekolah / instansi wajib diisi.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await DataManager.updateTeacherProfile(teacherName.trim(), teacherSchool.trim());
      if (res.success && res.teacher) {
        onCompleteTeacher(res.teacher);
      } else {
        // Fallback with current updated profile
        const updated: TeacherProfile = {
          ...(profile as TeacherProfile),
          fullName: teacherName.trim(),
          schoolName: teacherSchool.trim(),
        };
        DataManager.setTeacherProfile(updated);
        onCompleteTeacher(updated);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan profil guru.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (playClick) playClick();

    if (!studentNickname.trim()) {
      setErrorMessage('Nama panggilan tidak boleh kosong.');
      return;
    }
    if (studentNickname.trim().length > 50) {
      setErrorMessage('Nama panggilan maksimal 50 karakter.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await DataManager.updateStudentProfile({
        nickname: studentNickname.trim(),
        grade: studentGrade,
        avatarId: studentAvatar,
      });

      if (res.success && res.profile) {
        onCompleteStudent(res.profile);
      } else {
        const updated: PlayerProfile = {
          ...(profile as PlayerProfile),
          nickname: studentNickname.trim(),
          grade: studentGrade,
          avatarId: studentAvatar,
          isLoggedIn: true,
        };
        DataManager.savePlayerProfile(updated);
        onCompleteStudent(updated);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan profil siswa.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-lg my-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 overflow-hidden text-slate-800 dark:text-slate-100 transition-all duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        {/* Background decorative glows */}
        {role === 'teacher' ? (
          <div className="absolute -top-24 -right-24 w-52 h-52 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        ) : (
          <div className="absolute -top-24 -right-24 w-52 h-52 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        )}

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl mb-3 shadow-md border transition-transform hover:scale-105 duration-200">
            {role === 'teacher' ? (
              <div className="w-full h-full rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-indigo-500/30">
                <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
            ) : (
              <div className="w-full h-full rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-emerald-500/30">
                <Backpack className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>{role === 'teacher' ? 'Langkah Terakhir: Akun Guru' : 'Langkah Terakhir: Akun Siswa'}</span>
          </div>

          <h2 id="onboarding-title" className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {role === 'teacher' ? 'Lengkapi Profil Pendidik' : 'Yuk Lengkapi Profil Belajarmu!'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            {role === 'teacher' 
              ? 'Akun Google berhasil terhubung. Lengkapi nama dan instansi Anda untuk keperluan penugasan kuis dan sertifikat.'
              : 'Akun Google berhasil terhubung! Tentukan nama panggilan, kelas, dan karakter favoritmu.'}
          </p>

          {userEmail && (
            <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate max-w-[240px]">{userEmail}</span>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
            <span className="flex-1 font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Teacher Form */}
        {role === 'teacher' && (
          <form onSubmit={handleTeacherSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nama Lengkap & Gelar <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Contoh: Budi Santoso, S.Pd."
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs sm:text-sm focus:border-indigo-500 focus:outline-none min-h-[44px] transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Nama ini akan ditampilkan kepada siswa di sesi live kuis dan laporan hasil.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Asal Sekolah / Instansi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <School className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={teacherSchool}
                  onChange={(e) => setTeacherSchool(e.target.value)}
                  placeholder="Contoh: SD Negeri 1 Cerdas Bangsa"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs sm:text-sm focus:border-indigo-500 focus:outline-none min-h-[44px] transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Nama sekolah Anda akan tercantum pada kop lembar tugas kuis.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 min-h-[48px] btn-press transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Simpan & Masuk Dasbor Guru</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 min-h-[44px] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Batal & Keluar</span>
              </button>
            </div>
          </form>
        )}

        {/* Student Form */}
        {role === 'student' && (
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nama Panggilan Siswa <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={studentNickname}
                  onChange={(e) => setStudentNickname(e.target.value)}
                  placeholder="Contoh: Budi atau Salsabila"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs sm:text-sm focus:border-emerald-500 focus:outline-none min-h-[44px] transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Nama ini akan muncul di papan juara (leaderboard) dan ruang kuis live.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tingkat Kelas <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <School className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={studentGrade}
                  onChange={(e) => setStudentGrade(Number(e.target.value))}
                  className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs sm:text-sm focus:border-emerald-500 focus:outline-none min-h-[44px] appearance-none transition-colors"
                >
                  <option value={1}>SD - Kelas 1</option>
                  <option value={2}>SD - Kelas 2</option>
                  <option value={3}>SD - Kelas 3</option>
                  <option value={4}>SD - Kelas 4</option>
                  <option value={5}>SD - Kelas 5</option>
                  <option value={6}>SD - Kelas 6</option>
                  <option value={7}>SMP (Kelas 7 - 9)</option>
                  <option value={10}>SMA / SMK (Kelas 10 - 12)</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Pilih Karakter Avatar Favorit
              </label>
              <div className="grid grid-cols-4 gap-2 sm:gap-2.5 max-h-44 overflow-y-auto p-1 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                {AVATAR_LIST.map((avatar) => {
                  const isSelected = studentAvatar === avatar.id;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => {
                        if (playClick) playClick();
                        setStudentAvatar(avatar.id);
                      }}
                      className={`relative flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all min-h-[56px] ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 shadow-sm ring-2 ring-emerald-500/20'
                          : 'border-transparent bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                      aria-label={`Pilih avatar ${avatar.name}`}
                    >
                      <span className="text-2xl sm:text-3xl leading-none mb-1">{avatar.emoji}</span>
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 text-center truncate w-full">
                        {avatar.name.split(' ')[0]}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 min-h-[48px] btn-press transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Mulai Petualangan Belajar! 🚀</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 min-h-[44px] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Batal & Keluar</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
