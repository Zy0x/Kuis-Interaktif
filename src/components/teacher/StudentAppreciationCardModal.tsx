import React from 'react';
import {
  X,
  Printer,
  Share2,
  Award,
  Star,
  Calendar,
  Sparkles
} from 'lucide-react';
import type { Quiz, QuizSessionParticipant } from '../../types/quiz';
import { AVATAR_MAP } from '../../data/seedQuizzes';
import { formatIndonesianDate } from '../../lib/dateUtils';
import { generateStudentWhatsAppUrl } from '../../lib/shareUtils';
import { triggerHaptic } from '../../lib/mobileUtils';

interface StudentAppreciationCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: QuizSessionParticipant;
  quiz: Quiz;
  schoolName?: string;
}

export const StudentAppreciationCardModal: React.FC<StudentAppreciationCardModalProps> = ({
  isOpen,
  onClose,
  participant,
  quiz,
  schoolName,
}) => {
  if (!isOpen || !participant) return null;

  const isPassed = participant.score >= 70;
  const starsCount = participant.score === 100 ? 3 : participant.score >= 70 ? 2 : 1;
  const praiseTitle = participant.score === 100 
    ? 'Juara Hebat: Skor Sempurna!' 
    : participant.score >= 85 
    ? 'Capaian Sangat Memuaskan!' 
    : isPassed 
    ? 'Tuntas dengan Baik!' 
    : 'Semangat Terus Berlatih!';

  const formattedDate = formatIndonesianDate(
    participant.completedAt || participant.lastActiveAt || new Date().toISOString()
  );

  const handleSendWA = () => {
    triggerHaptic('light');
    const url = generateStudentWhatsAppUrl({
      studentName: participant.name,
      quizTitle: quiz.title,
      score: participant.score,
      correctCount: participant.correctCount,
      totalQuestions: quiz.questions?.length || participant.totalQuestions || 1,
      timeSpentSec: participant.timeSpentSec,
      schoolName,
      dateStr: formattedDate,
    });
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    triggerHaptic('light');
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header Modal Bar */}
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/70 flex-shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-white">
              Kartu Apresiasi Prestasi Siswa
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The Printable Appreciation Card */}
        <div className="p-5 sm:p-6 overflow-y-auto">
          <div className="rounded-3xl border-2 border-dashed border-amber-300 dark:border-amber-600/60 p-5 bg-gradient-to-b from-amber-50/60 via-white to-orange-50/40 dark:from-slate-850 dark:via-slate-900 dark:to-slate-850 text-center relative overflow-hidden shadow-inner">
            
            {/* Top School & Badge Label */}
            <div className="space-y-1 mb-4">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Sertifikat Prestasi Belajar
              </span>
              {schoolName && (
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {schoolName}
                </div>
              )}
            </div>

            {/* Student Avatar & Name */}
            <div className="w-20 h-20 mx-auto rounded-3xl bg-white dark:bg-slate-800 border-2 border-amber-300 dark:border-amber-500/80 shadow-md flex items-center justify-center text-4xl mb-3">
              {AVATAR_MAP[participant.avatarId] || '🦁'}
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">
              {participant.name}
            </h3>
            
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              {praiseTitle}
            </p>

            {/* Stars */}
            <div className="flex items-center justify-center gap-1.5 my-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-6 h-6 ${
                    i < starsCount
                      ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                      : 'text-slate-300 dark:text-slate-700'
                  }`}
                />
              ))}
            </div>

            {/* Score Pill */}
            <div className="my-3 inline-block px-5 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/80 shadow-sm">
              <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Nilai Perolehan</div>
              <div className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
                {participant.score} <span className="text-xs font-bold text-slate-400">/ 100</span>
              </div>
            </div>

            {/* Quiz Info Details */}
            <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200">{quiz.title}</div>
              <div className="text-[11px] flex items-center justify-center gap-2">
                <span>{participant.correctCount} Soal Benar</span>
                <span>•</span>
                <span>Durasi: {participant.timeSpentSec} detik</span>
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-1 flex items-center justify-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formattedDate}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-850/70 flex-shrink-0 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 min-h-[44px] transition-colors btn-press"
            title="Cetak Lembar Apresiasi"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden xs:inline">Cetak</span>
          </button>

          <button
            type="button"
            onClick={handleSendWA}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm min-h-[44px] transition-colors btn-press"
            title="Kirim ke WhatsApp Wali Murid"
          >
            <Share2 className="w-4 h-4" />
            <span>Kirim WhatsApp Wali Murid</span>
          </button>
        </div>

      </div>
    </div>
  );
};
