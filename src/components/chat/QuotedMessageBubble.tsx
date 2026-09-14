import React from "react";
import { CornerUpLeft, Sparkles } from "lucide-react";
import type { ChatReplyRef } from "../../types/quiz";

interface QuotedMessageBubbleProps {
  replyTo: ChatReplyRef;
  currentUserName?: string;
  onClick?: () => void;
  variant?: "preview" | "embed";
}

const TRUNCATE = 80;

function truncate(text: string) {
  return text.length > TRUNCATE ? text.slice(0, TRUNCATE) + "..." : text;
}

/**
 * QuotedMessageBubble
 * - variant="preview" : tampil di preview bar atas input (dengan tombol X)
 * - variant="embed"   : tampil di dalam bubble pesan yang sudah terkirim (clickable jump-to)
 */
export const QuotedMessageBubble: React.FC<QuotedMessageBubbleProps> = ({
  replyTo,
  currentUserName,
  onClick,
  variant = "embed",
}) => {
  const isTeacher = replyTo.isTeacher;
  const isSelf = replyTo.studentName === currentUserName;

  const displayName = isTeacher
    ? "Guru"
    : isSelf
    ? "Kamu"
    : replyTo.studentName;

  if (variant === "embed") {
    return (
      <button
        onClick={onClick}
        type="button"
        className={[
          "w-full text-left rounded-lg px-3 py-2 mb-1.5 border-l-4 transition-colors",
          "hover:brightness-95 active:brightness-90",
          isTeacher
            ? "bg-amber-50/80 border-amber-400 dark:bg-amber-900/20 dark:border-amber-500"
            : "bg-indigo-50/80 border-indigo-400 dark:bg-indigo-900/20 dark:border-indigo-500",
        ].join(" ")}
        aria-label={`Balas pesan dari ${displayName}`}
      >
        <div className="flex items-center gap-1.5 mb-0.5">
          {isTeacher ? (
            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
          ) : (
            <CornerUpLeft className="w-3 h-3 text-indigo-400 shrink-0" />
          )}
          <span
            className={[
              "text-xs font-semibold truncate",
              isTeacher ? "text-amber-600 dark:text-amber-400" : "text-indigo-600 dark:text-indigo-400",
            ].join(" ")}
          >
            {displayName}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
          {truncate(replyTo.text)}
        </p>
      </button>
    );
  }

  // variant === "preview" — shown above input box
  return (
    <div
      className={[
        "flex items-start gap-2 rounded-xl px-3 py-2 border-l-4",
        isTeacher
          ? "bg-amber-50 border-amber-400 dark:bg-amber-900/20 dark:border-amber-500"
          : "bg-indigo-50 border-indigo-400 dark:bg-indigo-900/20 dark:border-indigo-500",
      ].join(" ")}
    >
      <CornerUpLeft className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
      <div className="flex-1 min-w-0">
        <p
          className={[
            "text-xs font-semibold mb-0.5",
            isTeacher ? "text-amber-600 dark:text-amber-400" : "text-indigo-600 dark:text-indigo-400",
          ].join(" ")}
        >
          {displayName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {truncate(replyTo.text)}
        </p>
      </div>
    </div>
  );
};
