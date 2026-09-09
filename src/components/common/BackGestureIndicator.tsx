import React, { useState, useEffect } from 'react';
import { navigationManager } from '../../lib/navigationHistory';
import { ArrowLeft } from 'lucide-react';

export const BackGestureIndicator: React.FC = () => {
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  useEffect(() => {
    navigationManager.setVisualFeedback((text) => {
      setFeedbackText(text);
      const timer = setTimeout(() => {
        setFeedbackText(null);
      }, 1200);
      return () => clearTimeout(timer);
    });

    return () => {
      navigationManager.setVisualFeedback(null);
    };
  }, []);

  if (!feedbackText) return null;

  return (
    <div className="fixed top-1/2 left-4 -translate-y-1/2 z-50 pointer-events-none animate-fade-in">
      <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/85 backdrop-blur-md text-white text-xs sm:text-sm font-bold shadow-lg border border-white/20">
        <ArrowLeft className="w-4 h-4 text-blue-400 animate-pulse" />
        <span>{feedbackText}</span>
      </div>
    </div>
  );
};
