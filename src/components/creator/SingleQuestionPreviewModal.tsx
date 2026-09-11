import React, { useState, useEffect, useMemo } from 'react';
import type { QuizQuestion } from '../../types/quiz';
import {
  X,
  Clock,
  Star,
  CheckCircle,
  XCircle,
  Lightbulb,
  Edit3,
  RotateCcw,
  Eye,
  Check,
} from 'lucide-react';

interface SingleQuestionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: QuizQuestion | null;
  questionIndex: number;
  totalQuestions: number;
  durationPerQuestionSec: number;
  onEditQuestion?: (q: QuizQuestion) => void;
  playClick: () => void;
}

export const SingleQuestionPreviewModal: React.FC<SingleQuestionPreviewModalProps> = ({
  isOpen,
  onClose,
  question,
  questionIndex,
  totalQuestions,
  durationPerQuestionSec,
  onEditQuestion,
  playClick,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerConfirmed, setIsAnswerConfirmed] = useState(false);
  const [shortAnswerInput, setShortAnswerInput] = useState('');
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());
  const [wrongPairAttempt, setWrongPairAttempt] = useState<{ left: number; right: number } | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showKeyDirectly, setShowKeyDirectly] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedOption(null);
      setIsAnswerConfirmed(false);
      setShortAnswerInput('');
      setSelectedLeft(null);
      setMatchedPairs(new Set());
      setWrongPairAttempt(null);
      setShowExplanation(false);
      setShowKeyDirectly(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, question?.id]);

  const shuffledRightItems = useMemo(() => {
    if (!question || question.type !== 'matching_pairs' || !question.matchingPairs) return [];
    const items: { originalIndex: number; text: string; isDistractor?: boolean }[] = [];
    question.matchingPairs.forEach((p, idx) => {
      items.push({ originalIndex: idx, text: p.right, isDistractor: false });
    });
    (question.distractors || []).forEach((d, idx) => {
      items.push({ originalIndex: 1000 + idx, text: d, isDistractor: true });
    });
    for (let i = items.length - 1; i > 0; i--) {
      const j = (i * 3 + 1) % (i + 1);
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }, [question]);

  if (!isOpen || !question) return null;

  const effectiveDuration = question.customDurationSec || durationPerQuestionSec;

  const handleResetSimulation = () => {
    playClick();
    setSelectedOption(null);
    setIsAnswerConfirmed(false);
    setShortAnswerInput('');
    setSelectedLeft(null);
    setMatchedPairs(new Set());
    setWrongPairAttempt(null);
    setShowExplanation(false);
    setShowKeyDirectly(false);
  };

  const handleOptionSelect = (idx: number) => {
    if (isAnswerConfirmed) return;
    playClick();
    setSelectedOption(idx);
    setIsAnswerConfirmed(true);
  };

  const handleShortAnswerSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!shortAnswerInput.trim() || isAnswerConfirmed) return;
    playClick();
    setIsAnswerConfirmed(true);
  };

  const handleLeftPairClick = (idx: number) => {
    if (isAnswerConfirmed || matchedPairs.has(idx)) return;
    playClick();
    setSelectedLeft(idx === selectedLeft ? null : idx);
  };

  const handleRightPairClick = (item: { originalIndex: number; text: string; isDistractor?: boolean }) => {
    if (isAnswerConfirmed || matchedPairs.has(item.originalIndex) || selectedLeft === null) return;
    playClick();

    if (!item.isDistractor && item.originalIndex === selectedLeft) {
      const nextMatched = new Set(matchedPairs);
      nextMatched.add(selectedLeft);
      setMatchedPairs(nextMatched);
      setSelectedLeft(null);

      const totalPairs = question.matchingPairs?.length || 0;
      if (nextMatched.size === totalPairs) {
        setIsAnswerConfirmed(true);
      }
    } else {
      setWrongPairAttempt({ left: selectedLeft, right: item.originalIndex });
      setTimeout(() => {
        setWrongPairAttempt(null);
        setSelectedLeft(null);
      }, 600);
    }
  };

  const isShortAnswerCorrect = useMemo(() => {
    if (!isAnswerConfirmed || question.type !== 'short_answer') return false;
    const cleanInput = shortAnswerInput.trim().toLowerCase();
    const primaryAnswer = (question.options[0] || '').trim().toLowerCase();
    if (cleanInput === primaryAnswer) return true;
    if (question.acceptableAnswers && question.acceptableAnswers.length > 0) {
      return question.acceptableAnswers.some((ans) => ans.trim().toLowerCase() === cleanInput);
    }
    return false;
  }, [isAnswerConfirmed, shortAnswerInput, question]);

  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  const typeLabels: Record<string, string> = {
    multiple_choice: 'Pilihan Ganda',
    true_false: 'Benar / Salah',
    short_answer: 'Isian Singkat',
    matching_pairs: 'Menjodohkan',
    image_guess: 'Tebak Gambar',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-750 flex flex-col max-h-[92vh] overflow-hidden animate-scale-up">

        {/* Top Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-850 border-b border-slate-750/80 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2.5 py-1 rounded-xl bg-blue-600 text-white font-black text-xs shadow-xs shrink-0">
              Soal #{questionIndex + 1}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-750 text-slate-300 truncate">
              {typeLabels[question.type] || 'Soal Kuis'}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold hidden xs:inline">
              dari {totalQuestions} Soal
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>{question.points || 10} Poin</span>
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-750 text-slate-300 border border-slate-650 inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-400" />
              <span>{effectiveDuration}s</span>
            </span>
            <button
              type="button"
              onClick={() => {
                playClick();
                onClose();
              }}
              className="w-8 h-8 rounded-xl bg-slate-750 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors btn-press ml-1"
              title="Tutup Pratinjau"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bar Info Mode Pratinjau Guru */}
        <div className="px-4 sm:px-6 py-2 bg-indigo-950/50 border-b border-indigo-900/40 flex items-center justify-between gap-2 text-xs shrink-0 flex-wrap">
          <span className="text-indigo-300 font-semibold flex items-center gap-1.5 text-[11px]">
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>Tampilan Nyata Siswa (Interaktif)</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playClick();
                setShowKeyDirectly((prev) => !prev);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all btn-press border ${
                showKeyDirectly
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
              }`}
            >
              {showKeyDirectly ? '✓ Kunci Terbuka' : 'Intip Kunci'}
            </button>
            <button
              type="button"
              onClick={handleResetSimulation}
              className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750 border border-slate-750 text-[11px] font-semibold flex items-center gap-1 transition-colors btn-press"
              title="Reset pilihan jawaban untuk mencoba lagi"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden xs:inline">Coba Lagi</span>
            </button>
          </div>
        </div>

        {/* Body Soal Simulasi Nyata */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4">

          {question.imageUrl && (
            <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 max-w-md mx-auto">
              <img
                src={question.imageUrl}
                alt={question.imageCaption || 'Ilustrasi Soal'}
                className="max-h-48 sm:max-h-56 w-auto object-contain rounded-xl bg-slate-900 p-1"
              />
              {question.imageCaption && (
                <span className="text-[11px] text-slate-400 font-medium mt-1.5 text-center">
                  {question.imageCaption}
                </span>
              )}
            </div>
          )}

          <div className="py-1">
            <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed select-none">
              {question.text}
            </h3>
          </div>

          {(question.type === 'multiple_choice' || question.type === 'true_false' || question.type === 'image_guess') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
              {question.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = question.correctIndex === idx;

                let btnStyle = 'bg-slate-800/90 border-slate-700 text-slate-100 hover:border-blue-500/60 hover:bg-slate-750';

                if (showKeyDirectly) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold ring-1 ring-emerald-500/50';
                  } else {
                    btnStyle = 'bg-slate-800/50 border-slate-750 text-slate-400 opacity-60';
                  }
                } else if (isAnswerConfirmed) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-950/70 border-2 border-emerald-500 text-emerald-100 font-bold shadow-xs';
                  } else if (isSelected && !isCorrect) {
                    btnStyle = 'bg-rose-950/70 border-2 border-rose-500 text-rose-100 font-bold';
                  } else {
                    btnStyle = 'bg-slate-850 border-slate-800 text-slate-500 opacity-50';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAnswerConfirmed || showKeyDirectly}
                    onClick={() => handleOptionSelect(idx)}
                    className={`w-full p-3.5 sm:p-4 rounded-2xl text-left flex items-start gap-3 border transition-all min-h-[52px] btn-press ${btnStyle}`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        (isAnswerConfirmed || showKeyDirectly) && isCorrect
                          ? 'bg-emerald-500 text-white'
                          : isSelected && !isCorrect
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {(isAnswerConfirmed || showKeyDirectly) && isCorrect ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        letters[idx] || idx + 1
                      )}
                    </span>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <span className="text-xs sm:text-sm font-semibold leading-snug break-words">
                        {opt}
                      </span>
                      {showKeyDirectly && isCorrect && (
                        <span className="ml-2 text-[10px] text-emerald-400 font-extrabold uppercase tracking-wide">
                          (KUNCI)
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {question.type === 'short_answer' && (
            <div className="space-y-3 pt-1">
              <form onSubmit={handleShortAnswerSubmit} className="flex gap-2">
                <input
                  type="text"
                  disabled={isAnswerConfirmed}
                  value={shortAnswerInput}
                  onChange={(e) => setShortAnswerInput(e.target.value)}
                  placeholder="Ketik jawaban siswa di sini..."
                  className="flex-1 px-4 py-3 rounded-2xl bg-slate-850 border border-slate-750 text-white font-bold text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={isAnswerConfirmed || !shortAnswerInput.trim()}
                  className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-colors disabled:opacity-50 btn-press shrink-0"
                >
                  Kirim
                </button>
              </form>

              {showKeyDirectly && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs">
                  <span className="font-bold block mb-0.5">Kunci Jawaban Tepat:</span>
                  <span>{question.options[0] || question.acceptableAnswers?.[0] || '-'}</span>
                  {question.acceptableAnswers && question.acceptableAnswers.length > 1 && (
                    <span className="text-slate-400 block mt-1">
                      Variasi lain: {question.acceptableAnswers.slice(1).join(', ')}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {question.type === 'matching_pairs' && (
            <div className="space-y-3 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-800 text-xs text-slate-300 text-center">
                <span>
                  {matchedPairs.size === (question.matchingPairs?.length || 0)
                    ? '🎉 Semua Pasangan Berhasil Dijodohkan Sempurna!'
                    : selectedLeft === null
                    ? '👉 Ketuk satu kartu di Kolom A, lalu pilih pasangannya di Kolom B.'
                    : '🎯 Sekarang ketuk kartu pasangannya di Kolom B!'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 block px-1">Kolom A (Soal)</span>
                  {(question.matchingPairs || []).map((pair, idx) => {
                    const isMatched = matchedPairs.has(idx);
                    const isSelected = selectedLeft === idx;
                    const isWrong = wrongPairAttempt?.left === idx;

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isAnswerConfirmed || isMatched}
                        onClick={() => handleLeftPairClick(idx)}
                        className={`w-full p-3 rounded-xl text-left font-bold text-xs flex items-center justify-between min-h-[46px] border transition-all ${
                          isMatched
                            ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200'
                            : isWrong
                            ? 'bg-rose-950/50 border-rose-400 text-rose-300 animate-shake'
                            : isSelected
                            ? 'bg-blue-950/60 border-2 border-blue-500 text-white ring-2 ring-blue-500/40'
                            : 'bg-slate-800 border-slate-700 text-slate-200 hover:border-blue-400 hover:bg-slate-750'
                        }`}
                      >
                        <span className="truncate pr-1">{pair.left}</span>
                        {isMatched && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 block px-1">Kolom B (Pasangan)</span>
                  {shuffledRightItems.map((item, idx) => {
                    const isMatched = !item.isDistractor && matchedPairs.has(item.originalIndex);
                    const isWrong = wrongPairAttempt?.right === item.originalIndex;

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isAnswerConfirmed || isMatched || selectedLeft === null}
                        onClick={() => handleRightPairClick(item)}
                        className={`w-full p-3 rounded-xl text-left font-bold text-xs flex items-center justify-between min-h-[46px] border transition-all ${
                          isMatched
                            ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200'
                            : isWrong
                            ? 'bg-rose-950/50 border-rose-400 text-rose-300 animate-shake'
                            : selectedLeft !== null
                            ? 'bg-blue-950/30 border-dashed border-blue-400 hover:bg-blue-900/40 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-400 opacity-75'
                        }`}
                      >
                        <span className="truncate pr-1">{item.text}</span>
                        {isMatched && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {isAnswerConfirmed && (
            <div className="mt-3 p-3.5 rounded-2xl bg-slate-850 border border-slate-750 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-bold">
                {question.type === 'multiple_choice' || question.type === 'true_false' ? (
                  selectedOption === question.correctIndex ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-emerald-300">Jawaban Benar! Siswa mendapatkan +{question.points || 10} Poin</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="text-rose-300">Jawaban Salah. Kunci: {question.options[question.correctIndex]}</span>
                    </>
                  )
                ) : question.type === 'short_answer' ? (
                  isShortAnswerCorrect ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-emerald-300">Jawaban Tepat! Siswa mendapatkan +{question.points || 10} Poin</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="text-rose-300">Jawaban Belum Tepat. Kunci: {question.options[0]}</span>
                    </>
                  )
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-emerald-300">Semua pasangan berhasil dijodohkan!</span>
                  </>
                )}
              </div>
            </div>
          )}

          {question.explanation && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowExplanation((prev) => !prev)}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-blue-950/40 border border-blue-800/50 transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>{showExplanation ? 'Sembunyikan Pembahasan' : 'Lihat Pembahasan Edukatif'}</span>
              </button>
              {showExplanation && (
                <div className="mt-2 p-3.5 rounded-2xl bg-blue-950/30 border border-blue-900/50 text-xs text-slate-300 leading-relaxed animate-fade-in">
                  <span className="font-bold text-blue-300 block mb-1">Penjelasan Konsep untuk Siswa:</span>
                  <p>{question.explanation}</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Aksi */}
        <div className="px-4 sm:px-6 py-3 bg-slate-850 border-t border-slate-750/80 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-750 transition-colors btn-press min-h-[44px]"
          >
            Tutup Pratinjau
          </button>

          {onEditQuestion && (
            <button
              type="button"
              onClick={() => {
                playClick();
                onClose();
                onEditQuestion(question);
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 shadow-sm transition-all btn-press min-h-[44px]"
            >
              <Edit3 className="w-4 h-4 shrink-0" />
              <span>Edit Soal Ini</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
