import React, { useState, useEffect } from 'react';
import { DataManager } from '../../lib/supabaseClient';
import type { TeacherProfile, PlayerProfile } from '../../types/quiz';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../lib/navigationHistory';
import { 
  X, 
  GraduationCap, 
  Backpack, 
  Lock, 
  Mail, 
  User, 
  School, 
  AlertCircle, 
  ArrowRight, 
  Eye,
  EyeOff,
  Smile
} from 'lucide-react';

export type AuthModalTab = 'teacher' | 'student';

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} flex-shrink-0`} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

interface UnifiedAuthModalProps {
  isOpen: boolean;
  initialTab?: AuthModalTab;
  onClose: () => void;
  onLoginTeacher: (teacher: TeacherProfile) => void;
  onLoginStudent: (student: PlayerProfile) => void;
  playClick: () => void;
}

export const UnifiedAuthModal: React.FC<UnifiedAuthModalProps> = ({
  isOpen,
  initialTab = 'student',
  onClose,
  onLoginTeacher,
  onLoginStudent,
  playClick,
}) => {
  useBodyScrollLock(isOpen);
  useBackHandler('unified-auth-modal', 70, () => {
    onClose();
    return true;
  }, isOpen);

  const [activeTab, setActiveTab] = useState<AuthModalTab>(initialTab);

  // Teacher Form State
  const [isTeacherRegister, setIsTeacherRegister] = useState(false);
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherFullName, setTeacherFullName] = useState('');
  const [teacherSchoolName, setTeacherSchoolName] = useState('');

  // Student Form State
  const [isStudentRegister, setIsStudentRegister] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentNickname, setStudentNickname] = useState('');
  const [studentGrade, setStudentGrade] = useState<number>(3);

  // Common UI State
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle Google OAuth Sign In
  const handleGoogleSignIn = async (role: AuthModalTab) => {
    playClick();
    setErrorMessage(null);
    setIsGoogleLoading(true);
    try {
      const res = await DataManager.signInWithGoogle(role);
      if (res.error) {
        setErrorMessage(res.error);
        setIsGoogleLoading(false);
      }
      // Jika berhasil, peramban akan diarahkan langsung ke Google OAuth oleh Supabase
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghubungi server Google OAuth';
      setErrorMessage(msg);
      setIsGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setErrorMessage(null);
      const current = DataManager.getPlayerProfile();
      if (current.nickname && current.nickname !== 'Saya' && current.nickname !== 'Pengunjung') {
        setStudentNickname((prev) => prev || current.nickname);
      }
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  // Handle Teacher Submit
  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (isTeacherRegister) {
        if (teacherPassword.length < 6) {
          setErrorMessage('Kata sandi minimal 6 karakter.');
          setIsLoading(false);
          return;
        }
        const res = await DataManager.signUpTeacher(
          teacherEmail,
          teacherPassword,
          teacherFullName.trim() || 'Bapak/Ibu Guru',
          teacherSchoolName.trim() || 'SD Negeri Favorit'
        );
        if (res.success && res.teacher) {
          onLoginTeacher(res.teacher);
          onClose();
        } else {
          setErrorMessage(res.error || 'Pendaftaran guru gagal. Silakan coba lagi.');
        }
      } else {
        const res = await DataManager.signInTeacher(teacherEmail, teacherPassword);
        if (res.success && res.teacher) {
          onLoginTeacher(res.teacher);
          onClose();
        } else {
          setErrorMessage(res.error || 'Email atau kata sandi guru tidak cocok.');
        }
      }
    } catch {
      setErrorMessage('Kendala koneksi. Silakan periksa jaringan internet Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Student Submit
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (isStudentRegister) {
        if (studentPassword.length < 6) {
          setErrorMessage('Kata sandi minimal 6 karakter.');
          setIsLoading(false);
          return;
        }
        const res = await DataManager.signUpStudent(
          studentEmail,
          studentPassword,
          studentNickname.trim() || 'Saya',
          studentGrade
        );
        if (res.success && res.profile) {
          onLoginStudent(res.profile);
          onClose();
        } else {
          setErrorMessage(res.error || 'Pendaftaran siswa gagal. Silakan coba lagi.');
        }
      } else {
        const res = await DataManager.signInStudent(studentEmail, studentPassword);
        if (res.success && res.profile) {
          onLoginStudent(res.profile);
          onClose();
        } else {
          setErrorMessage(res.error || 'Email atau kata sandi siswa tidak sesuai.');
        }
      }
    } catch {
      setErrorMessage('Kendala koneksi. Silakan periksa jaringan internet Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 select-none modal-wrapper overscroll-contain">
      {/* Static Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm animate-backdrop-fade touch-none"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 z-10 animate-scale-up my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Header with Close */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Masuk / Daftar Akun
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pilih peran Anda untuk melanjutkan
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center btn-press"
            aria-label="Tutup Dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Segmented Tabs (Touch-first >= 44px) */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
          {/* Tab Guru */}
          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('teacher');
              setErrorMessage(null);
            }}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm min-h-[44px] transition-all ${
              activeTab === 'teacher'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Pendidik / Guru</span>
          </button>

          {/* Tab Siswa */}
          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('student');
              setErrorMessage(null);
            }}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm min-h-[44px] transition-all ${
              activeTab === 'student'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Backpack className="w-4 h-4" />
            <span>Siswa / Pelajar</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-3.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* PANEL PENDIDIK / GURU                                     */}
        {/* ========================================================= */}
        {activeTab === 'teacher' && (
          <div className="mt-4 space-y-4 animate-fade-in">
            {/* Sub-mode Switch: Masuk vs Daftar */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isTeacherRegister ? 'Daftar Akun Guru Baru' : 'Masuk ke Dashboard Guru'}
              </span>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setIsTeacherRegister(!isTeacherRegister);
                  setErrorMessage(null);
                }}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline min-h-[44px] flex items-center"
              >
                {isTeacherRegister ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
              </button>
            </div>

            {/* Google OAuth Button Guru */}
            <button
              type="button"
              onClick={() => handleGoogleSignIn('teacher')}
              disabled={isLoading || isGoogleLoading}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-xs flex items-center justify-center gap-2.5 min-h-[44px] btn-press transition-all disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              <span>
                {isTeacherRegister ? 'Daftar Guru dengan Akun Google' : 'Masuk Guru dengan Akun Google'}
              </span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider absolute">
                atau dengan email
              </span>
            </div>

            <form onSubmit={handleTeacherSubmit} className="space-y-3">
              {isTeacherRegister && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Lengkap & Gelar Pendidik <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={teacherFullName}
                        onChange={(e) => setTeacherFullName(e.target.value)}
                        placeholder="Cth: Bapak Aliridho, S.Pd"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs sm:text-sm focus:border-blue-500 focus:outline-none min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Sekolah / Instansi <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <School className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={teacherSchoolName}
                        onChange={(e) => setTeacherSchoolName(e.target.value)}
                        placeholder="Cth: SD Negeri Teladan 01"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs sm:text-sm focus:border-blue-500 focus:outline-none min-h-[44px]"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Pendidik <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={teacherEmail}
                    onChange={(e) => setTeacherEmail(e.target.value)}
                    placeholder="nama.guru@sekolah.sch.id"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs sm:text-sm focus:border-blue-500 focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kata Sandi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    placeholder={isTeacherRegister ? 'Minimal 6 karakter' : 'Masukkan kata sandi'}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs sm:text-sm focus:border-blue-500 focus:outline-none min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors btn-press"
                    title={showPassword ? 'Sembunyikan Kata Sandi' : 'Perlihatkan Kata Sandi'}
                    aria-label={showPassword ? 'Sembunyikan Kata Sandi' : 'Perlihatkan Kata Sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 min-h-[44px] btn-press transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>{isTeacherRegister ? 'Daftar Sebagai Guru' : 'Masuk ke Dashboard Guru'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* PANEL SISWA / PELAJAR                                     */}
        {/* ========================================================= */}
        {activeTab === 'student' && (
          <div className="mt-4 space-y-4 animate-fade-in">
            {/* Sub-mode Switch: Masuk vs Daftar */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isStudentRegister ? 'Daftar Akun Siswa Baru' : 'Masuk Akun Siswa Tersimpan'}
              </span>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setIsStudentRegister(!isStudentRegister);
                  setErrorMessage(null);
                }}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline min-h-[44px] flex items-center"
              >
                {isStudentRegister ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
              </button>
            </div>

            {/* Google OAuth Button Siswa */}
            <button
              type="button"
              onClick={() => handleGoogleSignIn('student')}
              disabled={isLoading || isGoogleLoading}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-xs flex items-center justify-center gap-2.5 min-h-[44px] btn-press transition-all disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              <span>
                {isStudentRegister ? 'Daftar Siswa dengan Akun Google' : 'Masuk Siswa dengan Akun Google'}
              </span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider absolute">
                atau dengan email
              </span>
            </div>

            <form onSubmit={handleStudentSubmit} className="space-y-3">
              {isStudentRegister && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>Nama Panggilan / Nickname (Maks. 50 Karakter) <span className="text-rose-500">*</span></span>
                      <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">{studentNickname.length}/50</span>
                    </label>
                    <div className="relative">
                      <Smile className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        maxLength={50}
                        value={studentNickname}
                        onChange={(e) => setStudentNickname(e.target.value)}
                        placeholder="Cth: Bintang Cerdas"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs sm:text-sm focus:border-emerald-500 focus:outline-none min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tingkat Kelas <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={studentGrade}
                      onChange={(e) => setStudentGrade(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm focus:border-emerald-500 focus:outline-none min-h-[44px]"
                    >
                      <optgroup label="Sekolah Dasar (SD / MI)">
                        {[1, 2, 3, 4, 5, 6].map((g) => (
                          <option key={g} value={g}>Kelas {g} SD</option>
                        ))}
                      </optgroup>
                      <optgroup label="Sekolah Menengah Pertama (SMP / MTs)">
                        {[7, 8, 9].map((g) => (
                          <option key={g} value={g}>Kelas {g} SMP</option>
                        ))}
                      </optgroup>
                      <optgroup label="Sekolah Menengah Atas / Kejuruan (SMA / SMK)">
                        {[10, 11, 12].map((g) => (
                          <option key={g} value={g}>Kelas {g} SMA / SMK</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Siswa / Orang Tua <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="siswa@gmail.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs sm:text-sm focus:border-emerald-500 focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kata Sandi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder={isStudentRegister ? 'Minimal 6 karakter' : 'Masukkan kata sandi'}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs sm:text-sm focus:border-emerald-500 focus:outline-none min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors btn-press"
                    title={showPassword ? 'Sembunyikan Kata Sandi' : 'Perlihatkan Kata Sandi'}
                    aria-label={showPassword ? 'Sembunyikan Kata Sandi' : 'Perlihatkan Kata Sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 min-h-[44px] btn-press transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>{isStudentRegister ? 'Daftar Akun Siswa' : 'Masuk Akun Siswa'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Button to Stay in Guest Mode */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  onClose();
                }}
                className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 flex items-center justify-center gap-2 min-h-[44px] transition-colors"
              >
                <span>🦁 Tetap Bermain di Mode Tamu (Tanpa Akun)</span>
              </button>
              <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 mt-1.5">
                Nilai dan bintang Anda tetap tersimpan di perangkat ini.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
