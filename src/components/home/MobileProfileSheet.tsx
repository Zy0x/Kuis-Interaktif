import React from 'react';
import type { TeacherProfile, PlayerProfile } from '../../types/quiz';
import { AVATAR_LIST } from '../../data/seedQuizzes';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../lib/navigationHistory';
import { useDrawerSwipeDown } from '../../hooks/useDrawerSwipeDown';
import { DrawerHandle } from '../common/DrawerHandle';
import { 
  X, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX, 
  GraduationCap, 
  Trophy, 
  LogIn, 
  LogOut, 
  User, 
  LayoutDashboard, 
  ChevronRight,
  Smile
} from 'lucide-react';

interface MobileProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: TeacherProfile | null;
  profile: PlayerProfile;
  isDark: boolean;
  onToggleTheme: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenTeacherPortal: () => void;
  onOpenAuthModal?: (tab?: 'teacher' | 'student') => void;
  onOpenProfileModal: () => void;
  onOpenTeacherProfileModal: () => void;
  onTeacherLogout?: () => void;
  playClick: () => void;
}

export const MobileProfileSheet: React.FC<MobileProfileSheetProps> = ({
  isOpen,
  onClose,
  teacher,
  profile,
  isDark,
  onToggleTheme,
  isMuted,
  onToggleMute,
  onOpenTeacherPortal,
  onOpenAuthModal,
  onOpenProfileModal,
  onOpenTeacherProfileModal,
  onTeacherLogout,
  playClick,
}) => {
  useBodyScrollLock(isOpen);
  useBackHandler('mobile-profile-sheet', 80, () => {
    onClose();
    return true;
  }, isOpen);

  const handleClose = () => {
    playClick();
    onClose();
  };

  const { handleRef, drawerStyle, backdropStyle } = useDrawerSwipeDown({
    onClose: handleClose,
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const currentAvatar = AVATAR_LIST.find((a) => a.id === profile.avatarId) || AVATAR_LIST[0];

  return (
    <div className="fixed inset-0 z-50 sm:hidden flex flex-col justify-end select-none overscroll-contain">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-backdrop-fade"
        style={backdropStyle}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet Container */}
      <div 
        className="relative z-10 w-full bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200/90 dark:border-slate-800 shadow-2xl p-4 xs:p-5 pt-2 animate-slide-up max-h-[88vh] overflow-y-auto overscroll-contain pb-[max(env(safe-area-inset-bottom),1.25rem)]"
        role="dialog"
        aria-modal="true"
        aria-label="Menu Profil dan Pengaturan Cepat"
        style={drawerStyle}
      >
        {/* Mobile Drag Handle - Swipe Down to Close */}
        <DrawerHandle ref={handleRef} className="-mt-1 mb-0.5" />

        {/* Header Row */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Menu & Profil</span>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Tutup Panel Profil"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Account Summary Card */}
        <div className="mt-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          {teacher ? (
            /* Teacher Identity */
            <>
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md flex-shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight truncate">
                    {teacher.fullName}
                  </h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex-shrink-0">
                    Guru Pro
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  {teacher.schoolName || 'Pendidik'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                  {teacher.email}
                </p>
              </div>
            </>
          ) : profile.isLoggedIn ? (
            /* Registered Student Identity */
            <>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
                {currentAvatar.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight truncate">
                    {profile.nickname}
                  </h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex-shrink-0">
                    Kelas {profile.grade || 1}
                  </span>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>{profile.starsEarned} Bintang Terkumpul</span>
                </p>
              </div>
            </>
          ) : (
            /* Guest Student Identity */
            <>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
                {currentAvatar.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight truncate">
                    {profile.nickname || 'Pengunjung Tamu'}
                  </h3>
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Tamu
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ⭐ {profile.starsEarned} Bintang • Mode Latihan
                </p>
              </div>
            </>
          )}
        </div>

        {/* 2. Quick Settings Controls (Theme & SFX) */}
        <div className="mt-3.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2 px-1">
            Pengaturan Cepat
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Theme Toggle Tile */}
            <button
              onClick={() => {
                playClick();
                onToggleTheme();
              }}
              className="p-3 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 flex flex-col items-start justify-between min-h-[64px] transition-all hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-98 shadow-xs"
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </div>
                <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                  isDark 
                    ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700' 
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {isDark ? 'Gelap' : 'Terang'}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-2">
                Mode Tampilan
              </span>
            </button>

            {/* Audio SFX Toggle Tile */}
            <button
              onClick={() => {
                playClick();
                onToggleMute();
              }}
              className="p-3 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 flex flex-col items-start justify-between min-h-[64px] transition-all hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-98 shadow-xs"
            >
              <div className="flex items-center justify-between w-full">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  isMuted 
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400' 
                    : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </div>
                <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                  isMuted 
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800' 
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                }`}>
                  {isMuted ? 'Senyap' : 'Aktif'}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-2">
                Efek Suara (SFX)
              </span>
            </button>
          </div>
        </div>

        {/* 3. Account Actions */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {teacher ? (
            /* Teacher Specific Actions */
            <>
              <button
                onClick={() => {
                  playClick();
                  onClose();
                  onOpenTeacherPortal();
                }}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-between min-h-[46px] shadow-sm transition-colors btn-press"
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Buka Dashboard Guru</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-70" />
              </button>

              <button
                onClick={() => {
                  playClick();
                  onClose();
                  onOpenTeacherProfileModal();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-between min-h-[44px] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Kelola Profil & Sekolah</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              <button
                onClick={() => {
                  playClick();
                  onClose();
                  onTeacherLogout?.();
                }}
                className="w-full py-2.5 px-4 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 min-h-[44px] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar dari Akun Guru</span>
              </button>
            </>
          ) : profile.isLoggedIn ? (
            /* Registered Student Actions */
            <>
              <button
                onClick={() => {
                  playClick();
                  onClose();
                  onOpenProfileModal();
                }}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-between min-h-[46px] shadow-sm transition-colors btn-press"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Atur Profil & Ganti Avatar</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-70" />
              </button>

              <button
                onClick={() => {
                  playClick();
                  onClose();
                  onTeacherLogout?.();
                }}
                className="w-full py-2.5 px-4 rounded-xl text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 min-h-[44px] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Akun Siswa</span>
              </button>
            </>
          ) : (
            /* Guest Actions */
            <>
              <button
                onClick={() => {
                  playClick();
                  onClose();
                  onOpenAuthModal?.('student');
                }}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-between min-h-[46px] shadow-sm transition-colors btn-press"
              >
                <div className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  <span>Masuk / Daftar Akun (Guru & Siswa)</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-70" />
              </button>

              <button
                onClick={() => {
                  playClick();
                  onClose();
                  onOpenProfileModal();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-between min-h-[44px] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Smile className="w-4 h-4 text-amber-500" />
                  <span>Ganti Maskot Avatar & Nama Tamu</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
