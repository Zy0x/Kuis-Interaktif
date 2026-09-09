import React, { useState } from 'react';
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline min-h-[36px] flex items-center"
              >
                {isTeacherRegister ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
              </button>
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
                        placeholder="Cth: Ibu Rahmawati, S.Pd"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={showPassword ? 'Sembunyikan' : 'Perlihatkan'}
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
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline min-h-[36px] flex items-center"
              >
                {isStudentRegister ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
              </button>
            </div>

            <form onSubmit={handleStudentSubmit} className="space-y-3">
              {isStudentRegister && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Panggilan / Nickname <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Smile className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
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
                      {[1, 2, 3, 4, 5, 6].map((g) => (
                        <option key={g} value={g}>Kelas {g}</option>
                      ))}
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={showPassword ? 'Sembunyikan' : 'Perlihatkan'}
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
