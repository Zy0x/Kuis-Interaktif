import React from 'react';

export const isImageCover = (val?: string | null): boolean => {
  if (!val) return false;
  const trimmed = val.trim();
  return (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/')
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
  const [hasError, setHasError] = React.useState(false);

  // Reset error jika cover prop berubah
  React.useEffect(() => {
    setHasError(false);
  }, [cover]);

  if (isImageCover(cover) && !hasError) {
    return (
      <div className={`overflow-hidden shrink-0 ${className}`}>
        <img
          src={cover!}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setHasError(true)}
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
