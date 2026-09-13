import React, { useState, useEffect } from 'react';
import { resolveMediaUrl, getAlternativeMediaUrl, isGoogleDriveUrl } from '../../lib/driveUtils';

export const isImageCover = (val?: string | null): boolean => {
  if (!val) return false;
  const trimmed = val.trim();
  return (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/') ||
    isGoogleDriveUrl(trimmed)
  );
};

interface QuizCoverDisplayProps {
  cover?: string | null;
  alt?: string;
  className?: string;
  fallbackEmoji?: string;
}

export const QuizCoverDisplay: React.FC<QuizCoverDisplayProps> = ({
  cover,
  alt = 'Sampul Kuis',
  className = 'w-12 h-12 rounded-2xl flex items-center justify-center text-3xl',
  fallbackEmoji = '📝',
}) => {
  const [currentUrl, setCurrentUrl] = useState<string>(() => resolveMediaUrl(cover));
  const [hasError, setHasError] = useState(false);
  const [hasTriedAlternative, setHasTriedAlternative] = useState(false);

  // Reset status saat prop cover berubah
  useEffect(() => {
    setCurrentUrl(resolveMediaUrl(cover));
    setHasError(false);
    setHasTriedAlternative(false);
  }, [cover]);

  const handleImgError = () => {
    // Coba URL alternatif Google Drive (misal thumbnail CDN vs proxy Edge function)
    if (!hasTriedAlternative && cover) {
      const altUrl = getAlternativeMediaUrl(cover);
      if (altUrl && altUrl !== currentUrl) {
        setHasTriedAlternative(true);
        setCurrentUrl(altUrl);
        return;
      }
    }
    setHasError(true);
  };

  if (isImageCover(cover) && currentUrl && !hasError) {
    return (
      <div className={`overflow-hidden shrink-0 ${className}`}>
        <img
          src={currentUrl}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={handleImgError}
        />
      </div>
    );
  }

  return (
    <div className={`shrink-0 select-none ${className}`}>
      {(!isImageCover(cover) && cover) || fallbackEmoji}
    </div>
  );
};

