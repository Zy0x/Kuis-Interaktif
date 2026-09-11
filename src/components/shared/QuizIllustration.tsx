import { useState, useEffect, useRef } from 'react';
import { fetchWikipediaImageUrl, generateAiIllustrationUrl } from '../../lib/geminiApi';

interface QuizIllustrationProps {
  imageUrl?: string;
  imageCaption?: string;
  imagePrompt?: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  enableWikipedia?: boolean;
}

/**
 * Komponen ilustrasi soal dengan resolusi gambar hybrid:
 * 1. Langsung tampil gambar dari imageUrl (Pollinations) sebagai placeholder cepat.
 * 2. Fetch Wikipedia async — jika ditemukan, upgrade ke gambar Wikipedia yang lebih relevan.
 * 3. Jika semua sumber gagal, tampilkan placeholder caption.
 */
export function QuizIllustration({
  imageUrl,
  imageCaption,
  imagePrompt,
  alt = 'Ilustrasi Soal',
  className = '',
  imgClassName = 'max-h-32 sm:max-h-48 xl:max-h-60 w-auto rounded-xl object-contain mx-auto',
  enableWikipedia = true,
}: QuizIllustrationProps) {
  const pollinationsUrl =
    imageUrl ||
    (imagePrompt || imageCaption
      ? generateAiIllustrationUrl(imagePrompt || imageCaption || '', {
          seed:
            Math.abs(
              (imageCaption || imagePrompt || '')
                .split('')
                .reduce((acc, c) => acc + c.charCodeAt(0), 0)
            ) % 999999,
        })
      : null);

  const [resolvedUrl, setResolvedUrl] = useState<string | null>(pollinationsUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    setHasError(false);
    setResolvedUrl(pollinationsUrl);

    if (!enableWikipedia || !imageCaption) return;
    const keyword = imageCaption.replace(/[^\w\s\u00C0-\u024F]/gi, ' ').trim();
    if (keyword.length < 3) return;

    setIsLoading(true);
    fetchWikipediaImageUrl(keyword)
      .then((wikiUrl) => {
        if (!mountedRef.current) return;
        if (wikiUrl) setResolvedUrl(wikiUrl);
      })
      .catch(() => {})
      .finally(() => { if (mountedRef.current) setIsLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageCaption, imagePrompt, imageUrl]);

  const handleImgError = () => {
    if (resolvedUrl !== pollinationsUrl && pollinationsUrl) {
      setResolvedUrl(pollinationsUrl);
    } else {
      setHasError(true);
    }
  };

  if (!resolvedUrl && !hasError) return null;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute top-1.5 right-1.5 z-10">
          <div className="w-4 h-4 rounded-full border-2 border-blue-400/40 border-t-blue-500 animate-spin" />
        </div>
      )}
      {resolvedUrl && !hasError ? (
        <img
          src={resolvedUrl}
          alt={alt}
          className={imgClassName}
          onError={handleImgError}
          loading="lazy"
        />
      ) : (
        <div className="w-full min-h-[80px] flex flex-col items-center justify-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
          <svg className="w-6 h-6 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {imageCaption && (
            <span className="text-[10px] font-medium text-center px-2 leading-tight">{imageCaption}</span>
          )}
        </div>
      )}
    </div>
  );
}
