import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Smile,
  Upload,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Trash2,
  Link2,
  AlertCircle
} from 'lucide-react';
import { QuizCoverDisplay, isImageCover } from '../common/QuizCoverDisplay';
import { uploadFileToGoogleDrive } from '../../lib/driveUploadService';
import type { Subject } from '../../types/quiz';

interface QuizCoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCover: string;
  onSelectCover: (cover: string) => void;
  subject?: Subject;
  playClick: () => void;
}

const COVER_EMOJI_CATEGORIES = [
  {
    id: 'sains',
    label: '🔬 Sains',
    emojis: ['🔬', '🌱', '🐸', '🪐', '🫀', '🌋', '⚡', '🦅', '🌊', '☀️', '🌸', '🍄', '🧪', '🔭', '🧬', '☄️'],
  },
  {
    id: 'matematika',
    label: '📐 Matematika',
    emojis: ['📐', '📊', '🧮', '🧩', '💡', '🎯', '⚙️', '🔍', '🎲', '🧠', '📏', '📉', '🔢', '⏳'],
  },
  {
    id: 'literasi',
    label: '📚 Bahasa',
    emojis: ['📚', '📖', '🎨', '🎭', '✍️', '🌍', '🏛️', '🎵', '📜', '🎙️', '🗺️', '🖌️', '🎻', '📝'],
  },
  {
    id: 'prestasi',
    label: '🏆 Karakter',
    emojis: ['⭐', '🏆', '🥇', '👑', '🚀', '🇮🇩', '🤝', '🛡️', '🌟', '🏅', '🎖️', '🔥', '💎', '🚩'],
  },
  {
    id: 'fauna',
    label: '🎒 Sekolah',
    emojis: ['🎒', '🍎', '🎓', '🦁', '🐯', '🐼', '🦉', '⚽', '🐬', '🐝', '🦊', '🦒', '🐘', '🏀'],
  },
];

// Helper untuk resize gambar via Canvas ke ukuran avatar square (256x256) agar hemat memori & kilat dimuat
const compressImageToAvatar = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(typeof reader.result === 'string' ? reader.result : '');
        }

        // Hitung crop tengah persegi (center-crop object-fit cover)
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

        // Ekspor ke WebP jika didukung, fallback JPEG
        try {
          const dataUrl = canvas.toDataURL('image/webp', 0.85);
          if (dataUrl.startsWith('data:image/webp')) {
            resolve(dataUrl);
            return;
          }
        } catch {
          // fallback
        }
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const QuizCoverModal: React.FC<QuizCoverModalProps> = ({
  isOpen,
  onClose,
  currentCover,
  onSelectCover,
  playClick,
}) => {
  const [activeTab, setActiveTab] = useState<'emoji' | 'upload'>('emoji');
  const [selectedCover, setSelectedCover] = useState<string>(currentCover || '📝');
  const [activeCategory, setActiveCategory] = useState<string>('sains');
  const [customEmojiInput, setCustomEmojiInput] = useState('');
  
  // Tab Upload States
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sinkronisasi cover saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setSelectedCover(currentCover || '📝');
      setActiveTab(isImageCover(currentCover) ? 'upload' : 'emoji');
      setUploadError(null);
      setImageUrlInput(isImageCover(currentCover) && !currentCover.startsWith('data:') ? currentCover : '');
    }
  }, [isOpen, currentCover]);

  // Handle keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setUploadError('Ukuran berkas melebihi 8 MB. Harap pilih gambar yang lebih kecil.');
      return;
    }

    setUploadError(null);
    setIsCompressing(true);

    try {
      // Unggah berkas langsung ke Google Drive Pro via Supabase Edge Function
      const driveResult = await uploadFileToGoogleDrive(file, `quiz_cover_${Date.now()}_${file.name}`);
      if (driveResult.success && driveResult.directUrl) {
        setSelectedCover(driveResult.directUrl);
      } else {
        console.warn('Google Drive cover upload notice:', driveResult.error);
        // Fallback kompresi lokal jika kuota service account tertahan atau offline
        const compressedDataUrl = await compressImageToAvatar(file);
        setSelectedCover(compressedDataUrl);
        if (driveResult.error) {
          setUploadError(`Penyimpanan cadangan aktif (${driveResult.error})`);
        }
      }
      playClick();
    } catch {
      setUploadError('Gagal memproses gambar. Pastikan format berkas didukung (PNG, JPG, WEBP).');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApplyUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setUploadError('Tautan harus diawali dengan http:// atau https://');
      return;
    }
    setUploadError(null);
    setSelectedCover(trimmed);
    playClick();
  };

  const handleResetToDefaultEmoji = () => {
    playClick();
    setSelectedCover('📝');
    setActiveTab('emoji');
    setImageUrlInput('');
    setUploadError(null);
  };

  const handleSave = () => {
    playClick();
    onSelectCover(selectedCover.trim() || '📝');
    onClose();
  };

  const isCurrentAnImage = isImageCover(selectedCover);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs overscroll-contain animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92dvh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal Compact dengan Live Preview Terintegrasi */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850/80 shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-xs border-2 border-blue-500/40 dark:border-blue-400/40 shrink-0 overflow-hidden text-2xl sm:text-3xl">
              <QuizCoverDisplay
                cover={selectedCover}
                className="w-12 h-12 flex items-center justify-center"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                  Pilih Sampul Kuis
                </h3>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                  isCurrentAnImage
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                }`}>
                  {isCurrentAnImage ? 'Gambar Kustom' : 'Emoji'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {isCurrentAnImage ? 'Foto sampul aktif' : `Sampul aktif: ${selectedCover}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isCurrentAnImage && (
              <button
                type="button"
                onClick={handleResetToDefaultEmoji}
                className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700 text-[11px] font-bold transition-colors shrink-0 flex items-center gap-1 btn-press min-h-[38px]"
                title="Ganti ke emoji standar"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Reset</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-colors btn-press min-h-[44px] min-w-[44px]"
              aria-label="Tutup modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selector Nav */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex gap-2 shrink-0 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('emoji');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all min-h-[44px] btn-press ${
              activeTab === 'emoji'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
            }`}
          >
            <Smile className="w-4 h-4" />
            <span>Koleksi Emoji</span>
          </button>
          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('upload');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all min-h-[44px] btn-press ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Unggah Gambar</span>
          </button>
        </div>

        {/* Tab Content Area (Scrollable) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: KOLEKSI EMOJI */}
          {activeTab === 'emoji' && (
            <div className="space-y-3.5">
              {/* Kategori Nav Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none touch-pan-x">
                {COVER_EMOJI_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      playClick();
                      setActiveCategory(cat.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all min-h-[38px] flex items-center ${
                      activeCategory === cat.id
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Grid Emojis */}
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                {COVER_EMOJI_CATEGORIES.find((c) => c.id === activeCategory)?.emojis.map((em) => (
                  <button
                    type="button"
                    key={em}
                    onClick={() => {
                      playClick();
                      setSelectedCover(em);
                    }}
                    className={`h-12 rounded-2xl text-2xl flex items-center justify-center border transition-all min-h-[48px] btn-press ${
                      selectedCover === em
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 ring-2 ring-blue-500 dark:ring-blue-400 shadow-sm scale-105'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-900 dark:text-white'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>

              {/* Ketik Emoji Manual */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={customEmojiInput}
                  onChange={(e) => setCustomEmojiInput(e.target.value)}
                  placeholder="Atau ketik emoji dari keyboard..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:border-blue-500 focus:outline-none min-h-[44px]"
                />
                <button
                  type="button"
                  disabled={!customEmojiInput.trim()}
                  onClick={() => {
                    playClick();
                    if (customEmojiInput.trim()) {
                      setSelectedCover(customEmojiInput.trim());
                      setCustomEmojiInput('');
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-40 transition-colors min-h-[44px] btn-press shrink-0"
                >
                  Pilih
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: UNGGAH GAMBAR KUSTOM */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              {/* Dropzone File Upload - Direct to Google Drive Pro */}
              <div className="p-6 rounded-3xl border-2 border-dashed border-blue-200 dark:border-blue-900 text-center space-y-3 bg-gradient-to-b from-blue-50/50 to-indigo-50/30 dark:from-blue-950/30 dark:to-slate-900/50">
                <div className="flex items-center justify-center gap-1.5 px-3 py-1 bg-blue-100/80 dark:bg-blue-900/60 rounded-full w-fit mx-auto text-[10px] font-extrabold text-blue-700 dark:text-blue-300">
                  <span>☁️ Google Drive Pro Storage</span>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto text-2xl">
                  {isCompressing ? <RefreshCw className="w-6 h-6 animate-spin text-blue-600" /> : <ImageIcon className="w-6 h-6" />}
                </div>

                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                    {isCompressing ? 'Menyinkronkan ke Google Drive Pro...' : 'Unggah Foto / Logo Sampul'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                    Format: PNG, JPG, WEBP. Media otomatis disimpan permanen di folder Google Drive Pro Anda.
                  </p>
                </div>

                <label className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs cursor-pointer btn-press min-h-[46px] shadow-sm transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Pilih Berkas dari HP / Laptop</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isCompressing}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Input URL Gambar */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 space-y-2.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Atau Tempelkan Tautan Web (URL Gambar):
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => {
                        setImageUrlInput(e.target.value);
                        setUploadError(null);
                      }}
                      placeholder="https://domain.com/logo-sampul.png"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 focus:outline-none min-h-[44px]"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!imageUrlInput.trim()}
                    onClick={handleApplyUrl}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-blue-600 hover:text-white dark:bg-slate-700 dark:hover:bg-blue-600 text-slate-800 dark:text-slate-200 font-bold text-xs disabled:opacity-50 transition-colors min-h-[44px] btn-press shrink-0 flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Terapkan URL</span>
                  </button>
                </div>
              </div>

              {/* Alert Error jika ada */}
              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-xs transition-colors min-h-[44px] btn-press"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition-all shadow-sm min-h-[44px] btn-press flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Terapkan Sampul</span>
          </button>
        </div>
      </div>
    </div>
  );
};
