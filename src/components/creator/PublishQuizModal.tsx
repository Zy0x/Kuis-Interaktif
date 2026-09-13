import React, { useState, useEffect, useMemo } from 'react';
import type { GameMode, Subject } from '../../types/quiz';
import {
  X,
  Globe,
  Lock,
  Shuffle,
  Dice5,
  Award,
  ChevronDown,
  ChevronUp,
  Rocket,
  ShieldCheck,
  Zap,
  Heart,
  Smile,
  Clock,
} from 'lucide-react';
import { QuizCoverDisplay } from '../common/QuizCoverDisplay';

const getBadgeSuggestions = (subj: Subject): string[] => {
  if (['Matematika', 'Matematika Tingkat Lanjut'].includes(subj)) return ['Master Matematika', 'Kalkulator Hidup', 'Ahli Angka'];
  if (['IPA', 'IPAS', 'Fisika', 'Kimia', 'Biologi'].includes(subj)) return ['Ilmuwan Muda', 'Peneliti Cilik', 'Saintis Hebat'];
  if (['Bahasa Indonesia', 'Bahasa Inggris', 'Bahasa Jawa', 'Bahasa Daerah'].includes(subj)) return ['Pujangga Kata', 'Orator Handal', 'Sastrawan Muda'];
  if (['IPS', 'Sejarah', 'Geografi', 'Sosiologi', 'Ekonomi', 'PPKn', 'Pendidikan Pancasila'].includes(subj)) return ['Cendekiawan Bangsa', 'Penjelajah Peradaban', 'Pemikir Kritis'];
  if (subj.startsWith('Pendidikan Agama')) return ['Insan Berbudi', 'Santri Teladan', 'Generasi Berakhlak'];
  if (['Pendidikan Jasmani (PJOK)', 'PJOK'].includes(subj)) return ['Atlet Tangguh', 'Juara Bugar', 'Sportif Sejati'];
  if (['Seni Musik', 'Seni Rupa', 'Seni Tari', 'Prakarya'].includes(subj)) return ['Seniman Berbakat', 'Maestro Karya', 'Kreator Inspiratif'];
  if (subj === 'Informatika') return ['Programmer Cilik', 'Master Digital', 'Cyber Explorer'];
  return ['Bintang Pintar', 'Juara Kelas', 'Pakar Pengetahuan', 'Learner Hebat'];
};

const DURATION_PRESETS = [10, 15, 20, 30, 45, 60, 90, 120];

interface PublishQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  coverEmoji: string;
  title: string;
  questionsCount: number;
  subject: Subject;
  durationPerQuestionSec: number;
  setDurationPerQuestionSec: (v: number) => void;
  visibility: 'public' | 'private';
  setVisibility: (v: 'public' | 'private') => void;
  defaultGameMode: GameMode;
  setDefaultGameMode: (v: GameMode) => void;
  shuffleQuestions: boolean;
  setShuffleQuestions: (v: boolean) => void;
  shuffleOptions: boolean;
  setShuffleOptions: (v: boolean) => void;
  badgeTitle: string;
  setBadgeTitle: (v: string) => void;
  isEditMode?: boolean;
  onConfirmPublish: () => void;
  playClick: () => void;
}

export const PublishQuizModal: React.FC<PublishQuizModalProps> = ({
  isOpen,
  onClose,
  coverEmoji,
  title,
  questionsCount,
  subject,
  durationPerQuestionSec,
  setDurationPerQuestionSec,
  visibility,
  setVisibility,
  defaultGameMode,
  setDefaultGameMode,
  shuffleQuestions,
  setShuffleQuestions,
  shuffleOptions,
  setShuffleOptions,
  badgeTitle,
  setBadgeTitle,
  isEditMode = false,
  onConfirmPublish,
  playClick,
}) => {
  const [showBadgeSuggestions, setShowBadgeSuggestions] = useState(false);
  const [customDuration, setCustomDuration] = useState('');
  const badgeSuggestions = useMemo(() => getBadgeSuggestions(subject), [subject]);

  useEffect(() => {
    if (isOpen) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const isCustomDuration = !DURATION_PRESETS.includes(durationPerQuestionSec);

  const handleCustomDurationBlur = () => {
    const val = parseInt(customDuration);
    if (!isNaN(val) && val >= 5 && val <= 300) {
      setDurationPerQuestionSec(val);
    }
    setCustomDuration('');
  };

  const gameModes: { mode: GameMode; label: string; icon: React.ReactNode; desc: string; activeClass: string; iconClass: string }[] = [
    {
      mode: 'standard',
      label: 'Standar',
      icon: <Zap className="w-4 h-4" />,
      desc: 'Timer per soal',
      activeClass: 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 ring-1 ring-blue-400/40',
      iconClass: 'text-blue-600 dark:text-blue-400',
    },
    {
      mode: 'survival_3hearts',
      label: '3 Hati',
      icon: <Heart className="w-4 h-4" />,
      desc: '3 nyawa',
      activeClass: 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/30 ring-1 ring-rose-400/40',
      iconClass: 'text-rose-600 dark:text-rose-400',
    },
    {
      mode: 'untimed',
      label: 'Santai',
      icon: <Smile className="w-4 h-4" />,
      desc: 'Waktu bebas',
      activeClass: 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 ring-1 ring-emerald-400/40',
      iconClass: 'text-emerald-600 dark:text-emerald-400',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={() => { playClick(); onClose(); }}
      />

      {/* Panel — mobile: bottom sheet, desktop: centered dialog */}
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-slate-200 dark:border-slate-700 flex flex-col max-h-[92dvh] sm:max-h-[88vh]">

        {/* Pill indicator (mobile only) */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-0 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 id="publish-modal-title" className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Rocket className="w-4 h-4 text-blue-600 shrink-0" />
              {isEditMode ? 'Perbarui & Simpan' : 'Terbitkan Kuis'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Atur distribusi sebelum kuis aktif</p>
          </div>
          <button
            type="button"
            onClick={() => { playClick(); onClose(); }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750 flex items-center justify-center transition-colors shrink-0 btn-press ml-3"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

          {/* Ringkasan kuis */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <QuizCoverDisplay
              cover={coverEmoji}
              className="w-11 h-11 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-2xl shrink-0 overflow-hidden border border-slate-200 dark:border-slate-600"
            />
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                {title.trim() || 'Kuis Tanpa Judul'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {questionsCount} soal · {subject}
              </p>
            </div>
          </div>

          {/* === DURASI WAKTU === */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Durasi per Soal
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DURATION_PRESETS.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => { playClick(); setDurationPerQuestionSec(sec); }}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all min-h-[44px] btn-press border flex items-center justify-center ${
                    durationPerQuestionSec === sec
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-1 ring-blue-400/40'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  {sec < 60 ? `${sec}d` : `${sec / 60}m`}
                </button>
              ))}
              {/* Custom input */}
              <div className="relative">
                <input
                  type="number"
                  min={5}
                  max={300}
                  placeholder={isCustomDuration ? `${durationPerQuestionSec}d` : 'Kustom'}
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  onBlur={handleCustomDurationBlur}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCustomDurationBlur(); }}
                  className={`w-20 px-2 py-2 rounded-xl text-xs font-extrabold text-center border min-h-[44px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400/30 transition-all ${
                    isCustomDuration
                      ? 'border-blue-500 ring-1 ring-blue-400/40'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Saat ini: <span className="font-bold text-slate-600 dark:text-slate-300">{durationPerQuestionSec} detik/soal</span>
              {defaultGameMode === 'untimed' && <span className="ml-1 text-emerald-600 dark:text-emerald-400">(mode santai — timer tidak aktif)</span>}
            </p>
          </div>

          {/* === AKSES SISWA === */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Akses Siswa
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                {
                  val: 'public' as const,
                  icon: <Globe className="w-4 h-4 shrink-0" />,
                  label: 'Publik',
                  desc: 'Muncul di katalog, bebas bergabung',
                  activeClass: 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 ring-1 ring-blue-400/40',
                  iconClass: 'text-blue-600 dark:text-blue-400',
                },
                {
                  val: 'private' as const,
                  icon: <Lock className="w-4 h-4 shrink-0" />,
                  label: 'Privat PIN',
                  desc: 'Hanya via PIN dari guru',
                  activeClass: 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 ring-1 ring-amber-400/40',
                  iconClass: 'text-amber-600 dark:text-amber-400',
                },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => { playClick(); setVisibility(opt.val); }}
                  className={`flex flex-col items-start gap-1.5 p-3.5 rounded-2xl border transition-all text-left min-h-[72px] btn-press ${
                    visibility === opt.val
                      ? opt.activeClass
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className={`flex items-center gap-1.5 w-full ${visibility === opt.val ? opt.iconClass : 'text-slate-400 dark:text-slate-500'}`}>
                    {opt.icon}
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">{opt.label}</span>
                    {visibility === opt.val && <ShieldCheck className="w-3.5 h-3.5 ml-auto" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* === MODE PERMAINAN === */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Mode Permainan
              </label>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Bisa diubah di lobi</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {gameModes.map((item) => {
                const isActive = defaultGameMode === item.mode;
                return (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => { playClick(); setDefaultGameMode(item.mode); }}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border text-center transition-all min-h-[68px] btn-press ${
                      isActive ? item.activeClass : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <span className={isActive ? item.iconClass : 'text-slate-400 dark:text-slate-500'}>{item.icon}</span>
                    <span className="text-[11px] font-extrabold text-slate-900 dark:text-white leading-tight">{item.label}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* === PENGACAKAN === */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Pengacakan
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { val: shuffleQuestions, set: setShuffleQuestions, icon: <Shuffle className="w-4 h-4" />, label: 'Acak Soal' },
                { val: shuffleOptions, set: setShuffleOptions, icon: <Dice5 className="w-4 h-4" />, label: 'Acak Pilihan' },
              ].map((tog, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { playClick(); tog.set(!tog.val); }}
                  className={`flex items-center justify-between gap-2 p-3.5 rounded-2xl border transition-all min-h-[52px] btn-press ${
                    tog.val
                      ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 ring-1 ring-blue-400/40'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={tog.val ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}>{tog.icon}</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{tog.label}</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${tog.val ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform absolute top-0.5 ${tog.val ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* === GELAR HADIAH === */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Gelar Hadiah Siswa
              </label>
              <button
                type="button"
                onClick={() => { playClick(); setShowBadgeSuggestions((p) => !p); }}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0"
              >
                <span>💡 {showBadgeSuggestions ? 'Tutup' : `Pilihan Cepat`}</span>
                {showBadgeSuggestions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={badgeTitle}
                onChange={(e) => setBadgeTitle(e.target.value)}
                placeholder="Contoh: Juara Pancasila, Peneliti Cilik"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/20 min-h-[44px] transition-all"
              />
              <Award className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {showBadgeSuggestions && (
              <div className="flex flex-wrap gap-1.5 pt-1 animate-fade-in">
                {badgeSuggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { playClick(); setBadgeTitle(sug); }}
                    className={`text-xs font-bold px-3 py-2 rounded-xl transition-all min-h-[44px] flex items-center gap-1.5 btn-press border ${
                      badgeTitle === sug
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Award className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>{sug}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0 flex gap-2.5">
          <button
            type="button"
            onClick={() => { playClick(); onClose(); }}
            className="px-4 py-3 rounded-2xl font-bold text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[48px] flex items-center justify-center transition-colors btn-press shrink-0"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => { playClick(); onConfirmPublish(); }}
            className="flex-1 px-5 py-3 rounded-2xl font-extrabold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm min-h-[48px] flex items-center justify-center gap-2 transition-all btn-press"
          >
            <Rocket className="w-4 h-4 shrink-0" />
            <span>{isEditMode ? 'Simpan Perubahan' : 'Terbitkan Sekarang'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
