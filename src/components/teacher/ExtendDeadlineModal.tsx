import React, { useState } from 'react';
import type { QuizSession } from '../../types/quiz';
import { Calendar, Clock, Plus, X, Check } from 'lucide-react';
import { formatIndonesianFullDeadline } from '../../lib/deadlineUtils';

interface ExtendDeadlineModalProps {
  session: QuizSession | null;
  isOpen: boolean;
  onClose: () => void;
  onExtend: (sessionId: string, newDeadlineIso: string) => Promise<void>;
  playClick?: () => void;
}

export const ExtendDeadlineModal: React.FC<ExtendDeadlineModalProps> = ({
  session,
  isOpen,
  onClose,
  onExtend,
  playClick = () => {},
}) => {
  if (!isOpen || !session) return null;

  const currentDeadline = session.settings?.deadlineAt;
  
  // Format initial datetime-local value (YYYY-MM-DDTHH:mm)
  const getInitialInputDate = () => {
    const baseDate = currentDeadline ? new Date(currentDeadline) : new Date();
    // Jika sudah lewat, gunakan waktu sekarang + 24 jam
    const target = baseDate.getTime() < Date.now() 
      ? new Date(Date.now() + 24 * 60 * 60 * 1000) 
      : baseDate;
    
    const tzOffset = target.getTimezoneOffset() * 60000;
    return new Date(target.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [selectedDateTime, setSelectedDateTime] = useState<string>(getInitialInputDate);
  const [isSaving, setIsSaving] = useState(false);

  // Quick preset helper
  const handleApplyPreset = (daysToAdd: number) => {
    playClick();
    const base = currentDeadline && new Date(currentDeadline).getTime() > Date.now()
      ? new Date(currentDeadline)
      : new Date();
    
    const newDate = new Date(base.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    const tzOffset = newDate.getTimezoneOffset() * 60000;
    setSelectedDateTime(new Date(newDate.getTime() - tzOffset).toISOString().slice(0, 16));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDateTime) return;
    
    playClick();
    setIsSaving(true);
    try {
      const isoDate = new Date(selectedDateTime).toISOString();
      await onExtend(session.id, isoDate);
      onClose();
    } catch (err) {
      console.error('Failed to extend deadline:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Perpanjang Batas Waktu PR
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[240px]">
                {session.quizTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Deadline Status */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Batas Waktu Saat Ini
          </span>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>{formatIndonesianFullDeadline(currentDeadline)}</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Tambah Waktu Cepat:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset(1)}
                className="py-2.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all min-h-[44px] flex items-center justify-center gap-1 btn-press"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+1 Hari</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(3)}
                className="py-2.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all min-h-[44px] flex items-center justify-center gap-1 btn-press"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+3 Hari</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(7)}
                className="py-2.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all min-h-[44px] flex items-center justify-center gap-1 btn-press"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+1 Minggu</span>
              </button>
            </div>
          </div>

          {/* Custom Date & Time Picker */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Atur Tanggal & Jam Penutupan Baru:
            </label>
            <input
              type="datetime-local"
              value={selectedDateTime}
              onChange={(e) => setSelectedDateTime(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                playClick();
                onClose();
              }}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving || !selectedDateTime}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 min-h-[44px] disabled:opacity-50 btn-press"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Simpan Batas Waktu</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
