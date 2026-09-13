import React, { useEffect } from 'react';
import type { QuizQuestion } from '../../types/quiz';
import {
  X,
  Star,
  Clock,
  ImageIcon,
  CheckCircle2,
  ArrowRight,
  ListOrdered,
} from 'lucide-react';

interface QuestionJumpModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuizQuestion[];
  currentIndex: number;
  onSelectQuestion: (index: number) => void;
  playClick: () => void;
}

export const QuestionJumpModal: React.FC<QuestionJumpModalProps> = ({
  isOpen,
  onClose,
  questions,
  currentIndex,
  onSelectQuestion,
  playClick,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const typeLabels: Record<string, string> = {
    multiple_choice: 'Pilihan Ganda',
    true_false: 'Benar / Salah',
    short_answer: 'Isian Singkat',
    matching_pairs: 'Menjodohkan',
    image_guess: 'Tebak Gambar',
  };

  const handlePick = (idx: number) => {
    playClick();
    onClose();
    if (idx !== currentIndex) {
      onSelectQuestion(idx);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="jump-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={() => {
          playClick();
          onClose();
        }}
      />

      {/* Dialog Window */}
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden animate-scale-up z-10">

        {/* Mobile Swipe Handle Indicator */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-0 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 id="jump-modal-title" className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Lompat ke Nomor Soal
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Pilih nomor butir soal yang ingin Anda edit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {questions.length} Soal
            </span>
            <button
              type="button"
              onClick={() => {
                playClick();
                onClose();
              }}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors btn-press"
              title="Tutup"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Number Selector Grid */}
        <div className="px-5 py-3.5 bg-slate-50/70 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
            Pilih Cepat Nomor
          </span>
          <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
            {questions.map((_, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePick(idx)}
                  className={`w-11 h-11 rounded-xl font-black text-xs flex items-center justify-center transition-all btn-press border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 ring-2 ring-blue-400/50 scale-105'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-750'
                  }`}
                  title={`Lompat ke Soal #${idx + 1}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Question List */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {questions.map((q, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => handlePick(idx)}
                className={`w-full p-3.5 rounded-2xl text-left border transition-all flex items-start gap-3 btn-press ${
                  isActive
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 ring-1 ring-blue-400/40 shadow-xs'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {/* Number Badge */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  #{idx + 1}
                </div>

                {/* Content Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {typeLabels[q.type] || 'Soal'}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-400" />
                      <span>{q.points || 10}p</span>
                    </span>
                    {q.customDurationSec && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5 text-blue-500" />
                        <span>{q.customDurationSec}s</span>
                      </span>
                    )}
                    {q.imageUrl && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 flex items-center gap-0.5">
                        <ImageIcon className="w-2.5 h-2.5 text-purple-500" />
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {q.text || 'Teks soal belum diisi'}
                  </p>
                </div>

                {/* Status Indicator */}
                <div className="shrink-0 pt-1">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-900/60 px-2 py-1 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline">Aktif</span>
                    </span>
                  ) : (
                    <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-600 flex items-center justify-center">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 transition-colors btn-press min-h-[44px]"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
