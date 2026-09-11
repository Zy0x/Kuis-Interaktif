import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  Globe, 
  Upload, 
  RefreshCw, 
  Check, 
  Loader2
} from 'lucide-react';
import { 
  searchAllEducationalImages, 
  generateRefinedAiImageUrl, 
  type EducationalImageResult 
} from '../../lib/imageService';
import { useBackHandler } from '../../lib/navigationHistory';
import { useDrawerSwipeDown } from '../../hooks/useDrawerSwipeDown';
import { DrawerHandle } from '../common/DrawerHandle';

interface ImageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (url: string, caption?: string) => void;
  initialCaption?: string;
  initialPrompt?: string;
  questionText?: string;
  subject?: string;
  topic?: string;
}

export const ImageSelectorModal: React.FC<ImageSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  initialCaption = '',
  initialPrompt = '',
  questionText = '',
  subject = '',
  topic = '',
}) => {
  const [activeTab, setActiveTab] = useState<'wiki' | 'ai' | 'upload'>('wiki');
  
  // Tab Ensiklopedia State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EducationalImageResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Tab AI Generator State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStyle, setAiStyle] = useState<'diagram' | 'cartoon' | 'realistic'>('diagram');
  const [aiSeed, setAiSeed] = useState(() => Math.floor(Math.random() * 999999));
  const [aiPreviewUrl, setAiPreviewUrl] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Tab Upload / URL State
  const [manualUrl, setManualUrl] = useState('');

  // Sinkronisasi saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;

    // Tentukan kata kunci awal pencarian
    const bestKeyword = 
      initialCaption.trim() || 
      topic.trim() || 
      (questionText.length > 5 ? questionText.slice(0, 40) : subject);
    
    setSearchQuery(bestKeyword);

    // Tentukan prompt awal untuk AI
    const bestAiPrompt = initialPrompt.trim() || initialCaption.trim() || topic.trim() || bestKeyword;
    setAiPrompt(bestAiPrompt);
    
    const seed = Math.floor(Math.random() * 999999);
    setAiSeed(seed);
    if (bestAiPrompt) {
      setAiPreviewUrl(generateRefinedAiImageUrl(bestAiPrompt, { style: 'diagram', seed }));
    }

    // Auto-search Wikipedia jika ada keyword
    if (bestKeyword && bestKeyword.length >= 2) {
      handleSearch(bestKeyword);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Handle Android Back Gesture & Popstate
  useBackHandler(
    'image-selector-modal',
    85,
    () => {
      if (isOpen) {
        onClose();
        return true;
      }
      return false;
    },
    isOpen
  );

  // Handle Escape Key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Swipe Down to Dismiss Drawer Hook
  const { handleRef, drawerStyle, backdropStyle } = useDrawerSwipeDown({
    onClose,
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const handleSearch = async (queryToUse?: string) => {
    const q = (queryToUse !== undefined ? queryToUse : searchQuery).trim();
    if (!q) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await searchAllEducationalImages(q, initialPrompt || undefined);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRegenerateAi = () => {
    const nextSeed = Math.floor(Math.random() * 999999);
    setAiSeed(nextSeed);
    setIsAiLoading(true);
    const newUrl = generateRefinedAiImageUrl(aiPrompt || searchQuery || 'educational concept', {
      style: aiStyle,
      seed: nextSeed,
    });
    setAiPreviewUrl(newUrl);
  };

  const handleApplyImage = (url: string, caption?: string) => {
    const resolvedCaption = caption || initialCaption || searchQuery.slice(0, 45);
    onSelectImage(url, resolvedCaption);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran berkas maksimal 5 MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        handleApplyImage(reader.result, file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overscroll-contain"
      onClick={onClose}
      style={backdropStyle}
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl h-[92dvh] sm:h-auto sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up overscroll-contain"
        onClick={(e) => e.stopPropagation()}
        style={drawerStyle}
      >
        {/* Mobile Pull Handle - Swipe Down to Close */}
        <DrawerHandle ref={handleRef} className="sm:hidden" />

        {/* Header Modal */}
        <div className="p-3.5 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg shrink-0">
              🎨
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                Pilih Ilustrasi Edukasi
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Media akurat dari Ensiklopedia atau racikan AI diagram presisi
              </p>
            </div>
          </div>
        </div>

        {/* Segmented Tab Switcher */}
        <div className="px-3 sm:px-5 pt-3 shrink-0">
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setActiveTab('wiki')}
              className={`min-h-[44px] px-2 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 btn-press ${
                activeTab === 'wiki'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Globe className="w-4 h-4 shrink-0" />
              <span className="truncate">
                <span className="sm:hidden">Wiki</span>
                <span className="hidden sm:inline">Ensiklopedia & Media</span>
              </span>
              {searchResults.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-black shrink-0 hidden xs:inline">
                  {searchResults.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className={`min-h-[44px] px-2 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 btn-press ${
                activeTab === 'ai'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
              <span className="truncate">
                <span className="sm:hidden">AI Flux</span>
                <span className="hidden sm:inline">Generator AI (Flux)</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`min-h-[44px] px-2 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 btn-press ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Upload className="w-4 h-4 shrink-0" />
              <span className="truncate">
                <span className="sm:hidden">Unggah</span>
                <span className="hidden sm:inline">Unggah / URL</span>
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4">
          
          {/* TAB 1: ENSIKLOPEDIA (WIKIPEDIA & WIKIMEDIA COMMONS) */}
          {activeTab === 'wiki' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearch();
                      }
                    }}
                    placeholder="Ketik topik (contoh: Siklus Air, Fotosintesis)..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none min-h-[44px]"
                  />
                </div>
                <button
                  type="button"
                  disabled={isSearching || !searchQuery.trim()}
                  onClick={() => handleSearch()}
                  className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 btn-press min-h-[44px] disabled:opacity-50 shrink-0"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Cari</span>
                </button>
              </div>

              {/* Quick Keywords Chips */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Saran Topik:</span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar whitespace-nowrap">
                  {[initialCaption, topic, subject, 'Siklus Air', 'Evaporasi', 'Fotosintesis']
                    .filter(Boolean)
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .slice(0, 6)
                    .map((kw) => (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => {
                          setSearchQuery(kw);
                          handleSearch(kw);
                        }}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors btn-press min-h-[36px] shrink-0"
                      >
                        {kw}
                      </button>
                    ))}
                </div>
              </div>

              {/* Status Loading */}
              {isSearching && (
                <div className="py-12 text-center space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Menghubungi Wikipedia & Wikimedia Commons...
                  </p>
                </div>
              )}

              {/* Search Results Grid */}
              {!isSearching && searchResults.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 hover:border-blue-500 transition-all flex flex-col justify-between"
                    >
                      <div className="relative aspect-4/3 sm:aspect-video w-full bg-slate-200 dark:bg-slate-700/50 overflow-hidden flex items-center justify-center">
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-black/60 text-white backdrop-blur-xs">
                          {item.source === 'wikipedia_id' ? 'Wiki ID' : item.source === 'wikipedia_en' ? 'Wiki EN' : 'Commons'}
                        </span>
                      </div>
                      <div className="p-2 sm:p-2.5 space-y-2 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug">
                            {item.title}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplyImage(item.url, item.title)}
                          className="w-full py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 btn-press min-h-[44px]"
                        >
                          <Check className="w-4 h-4" />
                          <span>Gunakan</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!isSearching && hasSearched && searchResults.length === 0 && (
                <div className="py-10 text-center space-y-3 p-6 rounded-3xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <div className="text-3xl">🔍</div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    Tidak menemukan gambar ensiklopedia untuk "{searchQuery}"
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Coba gunakan kata kunci ilmiah bahasa Indonesia/Inggris lainnya atau gunakan tab <strong>Generator AI (Flux)</strong> di atas.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ai')}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold inline-flex items-center gap-1.5 btn-press min-h-[44px]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Beralih ke Generator AI</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GENERATOR AI FLUX */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              {/* Gaya Visual Pills */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Gaya Ilustrasi Edukasi:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'diagram' as const, label: '📐 Diagram Pelajaran', desc: 'Skematik 2D bersih berlabel & informatif' },
                    { id: 'cartoon' as const, label: '🎨 Kartun Edukatif', desc: 'Gaya buku pelajaran ceria & ramah' },
                    { id: 'realistic' as const, label: '📷 Foto Nyata', desc: 'Dokumentasi sains & fenomena alam' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setAiStyle(s.id);
                        const newUrl = generateRefinedAiImageUrl(aiPrompt, { style: s.id, seed: aiSeed });
                        setAiPreviewUrl(newUrl);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all btn-press flex items-center justify-between sm:flex-col sm:items-start sm:justify-center min-h-[48px] ${
                        aiStyle === s.id
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20 font-bold'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-extrabold block">{s.label}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5 block">{s.desc}</span>
                      </div>
                      {aiStyle === s.id && (
                        <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 ml-2 sm:hidden">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Prompt AI */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi Visual untuk AI (Bahasa Indonesia / Inggris):
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Contoh: Proses siklus air evaporasi matahari memanaskan laut..."
                    className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={handleRegenerateAi}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 btn-press min-h-[44px] shrink-0"
                    title="Buat ulang dengan biji acak baru"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Racik Ulang</span>
                  </button>
                </div>
              </div>

              {/* Preview AI Image */}
              {aiPreviewUrl && (
                <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-500" /> Pratinjau Hasil AI
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
                      Flux Model • Presisi
                    </span>
                  </div>

                  <div className="relative aspect-video max-h-56 sm:max-h-64 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                    {isAiLoading && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-10">
                        <Loader2 className="w-8 h-8 animate-spin text-white" />
                      </div>
                    )}
                    <img
                      src={aiPreviewUrl}
                      alt="Pratinjau AI"
                      onLoad={() => setIsAiLoading(false)}
                      className="w-full h-full object-contain mx-auto"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyImage(aiPreviewUrl, aiPrompt.slice(0, 45))}
                    className="w-full py-2.5 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 btn-press min-h-[48px] shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>Gunakan Gambar AI Ini</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: UNGGAH / TAUTAN URL */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              {/* Upload Local File */}
              <div className="p-6 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3 bg-slate-50/50 dark:bg-slate-850/50">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto text-xl">
                  📁
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    Unggah Berkas Gambar dari Perangkat
                  </h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Format didukung: PNG, JPG, WEBP (Maksimal 5 MB)
                  </p>
                </div>
                <label className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer btn-press min-h-[48px]">
                  <Upload className="w-4 h-4" />
                  <span>Pilih Berkas dari HP / Komputer</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Or Manual URL */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Atau Tempel Tautan / URL Gambar:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    placeholder="https://example.com/gambar-edukasi.jpg"
                    className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs min-h-[44px]"
                  />
                  <button
                    type="button"
                    disabled={!manualUrl.trim().startsWith('http')}
                    onClick={() => handleApplyImage(manualUrl.trim())}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50 btn-press min-h-[44px] justify-center"
                  >
                    Terapkan
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span className="text-[11px] truncate max-w-[200px] sm:max-w-xs">
            Target: <strong>{initialCaption || topic || subject || 'Soal Aktif'}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors btn-press min-h-[44px]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
