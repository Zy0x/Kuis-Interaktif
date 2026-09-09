import React, { useState } from 'react';
import { DataManager, isSupabaseConfigured } from '../../lib/supabaseClient';
import type { TeacherProfile } from '../../types/quiz';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { X, GraduationCap, Lock, Mail, User, School, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface TeacherAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (teacher: TeacherProfile) => void;
  playClick: () => void;
}

export const TeacherAuthModal: React.FC<TeacherAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  playClick,
}) => {
  useBodyScrollLock(isOpen);

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (isRegister) {
        if (password.length < 6) {
          setErrorMessage('Kata sandi minimal 6 karakter');
          setIsLoading(false);
          return;
        }
        const res = await DataManager.signUpTeacher(
          email,
          password,
          fullName.trim() || 'Bapak/Ibu Guru',
          schoolName.trim() || 'SD Negeri'
        );
        if (res.success && res.teacher) {
          onLoginSuccess(res.teacher);
          onClose();
        } else {
          setErrorMessage(res.error || 'Gagal mendaftar. Silakan coba lagi.');
        }
      } else {
        const res = await DataManager.signInTeacher(email, password);
        if (res.success && res.teacher) {
          onLoginSuccess(res.teacher);
          onClose();
        } else {
          setErrorMessage(res.error || 'Email atau kata sandi tidak cocok.');
        }
      }
    } catch {
      setErrorMessage('Terjadi kendala jaringan saat menghubungi server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    playClick();
    setIsLoading(true);
    const mockTeacher: TeacherProfile = {
      id: 'guru_demo_' + Date.now(),
      email: 'guru.hebat@kemdikbud.go.id',
      fullName: 'Ibu Rahmawati, S.Pd',
      schoolName: 'SD Negeri Teladan 01',
    };
    DataManager.setTeacherProfile(mockTeacher);
    onLoginSuccess(mockTeacher);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 select-none modal-wrapper overscroll-contain">
      {/* Static Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-backdrop-fade touch-none"
        onClick={onClose}
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

      {/* Modal Dialog Card */}
      <div className="relative z-10 bg-white dark:bg-slate-900 w-full max-w-md mx-auto my-auto rounded-3xl shadow-pop border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-modal-card-in overscroll-contain">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">
                {isRegister ? 'Pendaftaran Akun Guru' : 'Portal Masuk Guru'}
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Kelola Bank Soal, PIN Kuis & Rekap Nilai
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Supabase Status Indicator */}
        <div className="px-6 py-2 bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            Backend: {isSupabaseConfigured ? 'Supabase Cloud Terhubung' : 'Mode Offline / Lokal'}
          </span>
          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">v2.2.6</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Nama Lengkap Guru</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs sm:text-sm font-semibold text-slate-900 dark:text-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <School className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Nama Sekolah SD</span>
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs sm:text-sm font-semibold text-slate-900 dark:text-white min-h-[44px]"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Alamat Email</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs sm:text-sm font-semibold text-slate-900 dark:text-white min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Kata Sandi (Minimal 6 Karakter)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs sm:text-sm font-semibold text-slate-900 dark:text-white min-h-[44px]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm flex items-center justify-center gap-2 min-h-[46px] btn-press transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <span>{isRegister ? 'Daftar Akun Guru Sekarang' : 'Masuk ke Dashboard Guru'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Demo Login Quick Pass */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/40 hover:bg-blue-50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors min-h-[42px]"
            >
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Masuk Langsung Sebagai Guru Demo (Uji Coba Cepat)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClick();
                setIsRegister(!isRegister);
                setErrorMessage(null);
              }}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-1.5 text-center transition-colors"
            >
              {isRegister
                ? 'Sudah punya akun? Masuk di sini'
                : 'Belum punya akun guru? Daftar sekarang'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
