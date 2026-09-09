import React from 'react';
import type { TimePhase } from '../../hooks/useTimeGreeting';

interface CelestialSkyVisualProps {
  phase: TimePhase;
  className?: string;
}

export const CelestialSkyVisual: React.FC<CelestialSkyVisualProps> = ({ phase, className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none absolute inset-0 overflow-hidden rounded-2xl flex items-center justify-end ${className}`}
    >
      {/* Dynamic Ambient Background Glow */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-64 sm:w-96 sm:h-96 2xl:w-[500px] 2xl:h-[500px] rounded-full blur-3xl opacity-35 transition-all duration-700 pointer-events-none">
        {phase === 'morning' && <div className="w-full h-full bg-amber-400" />}
        {phase === 'noon' && <div className="w-full h-full bg-amber-300" />}
        {phase === 'afternoon' && <div className="w-full h-full bg-orange-500" />}
        {phase === 'evening' && <div className="w-full h-full bg-indigo-400" />}
        {phase === 'midnight' && <div className="w-full h-full bg-blue-500" />}
        {phase === 'dawn' && <div className="w-full h-full bg-purple-500" />}
      </div>

      {/* SVG Container - Fluid scaling across 360px up to 4K Smartboards */}
      <svg
        viewBox="0 0 320 200"
        className="w-40 h-28 xs:w-48 xs:h-32 sm:w-64 sm:h-40 md:w-72 md:h-44 lg:w-80 lg:h-48 xl:w-96 xl:h-56 2xl:w-[420px] 2xl:h-[260px] flex-shrink-0 transition-all duration-500 mr-1 xs:mr-2 sm:mr-6 md:mr-10 xl:mr-16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Radial Gradient for Sun Glow */}
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
          </radialGradient>

          {/* Radial Gradient for Moon Glow */}
          <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="65%" stopColor="#93C5FD" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>

          {/* Sunset Gradient */}
          <linearGradient id="sunsetRay" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#EA580C" stopOpacity="0.2" />
          </linearGradient>

          {/* Cloud Linear Gradient */}
          <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
          </linearGradient>

          {/* Warm Cloud Gradient */}
          <linearGradient id="cloudWarmGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FED7AA" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FB923C" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* ================= 1. PAGI HARI (Matahari terbit sedikit / Rising Sun) ================= */}
        {phase === 'morning' && (
          <g className="animate-fade-in">
            {/* Ambient horizon beam */}
            <ellipse cx="230" cy="165" rx="90" ry="25" fill="url(#sunGlow)" className="animate-horizon-glow" />

            {/* Rising Sun (half-risen emerging from horizon line) */}
            <g className="animate-celestial-pulse">
              <circle cx="230" cy="120" r="38" fill="url(#sunGlow)" opacity="0.6" />
              <circle cx="230" cy="120" r="28" fill="#FBBF24" />
              <circle cx="230" cy="120" r="22" fill="#FDE047" />

              {/* Sun rays emerging upwards */}
              <line x1="230" y1="75" x2="230" y2="60" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
              <line x1="195" y1="85" x2="182" y2="72" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
              <line x1="265" y1="85" x2="278" y2="72" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
              <line x1="175" y1="120" x2="158" y2="120" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
              <line x1="285" y1="120" x2="302" y2="120" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
            </g>

            {/* Gentle Morning Floating Clouds */}
            <g className="animate-celestial-float">
              {/* Back Cloud */}
              <path
                d="M170 135c0-11 9-20 20-20 4 0 7 1 10 3 4-8 12-14 22-14 14 0 25 11 25 25 3 1 6 3 8 6 4 4 6 9 6 15 0 11-9 20-20 20h-53c-10 0-18-8-18-18 0-8 5-15 12-17z"
                fill="url(#cloudGrad)"
              />
              {/* Foreground Cloud below sun */}
              <path
                d="M205 148c0-9 8-16 17-16 3 0 6 1 8 2 3-7 10-12 18-12 11 0 20 9 20 20 2 1 5 2 7 5 3 3 5 8 5 12 0 9-7 16-16 16h-44c-8 0-15-7-15-15 0-6 4-11 10-12z"
                fill="#FFFFFF"
                fillOpacity="0.35"
              />
            </g>

            {/* Morning sparkles */}
            <circle cx="140" cy="55" r="1.5" fill="#FEF08A" className="animate-star-twinkle" />
            <circle cx="170" cy="35" r="2" fill="#FEF08A" className="animate-star-twinkle-delayed" />
          </g>
        )}

        {/* ================= 2. SIANG HARI (Matahari penuh benderang / Full Sun) ================= */}
        {phase === 'noon' && (
          <g className="animate-fade-in">
            {/* Radiant Halo */}
            <circle cx="235" cy="85" r="55" fill="url(#sunGlow)" className="animate-celestial-pulse" />
            <circle cx="235" cy="85" r="42" fill="#FDE047" fillOpacity="0.3" />

            {/* Central Bright Sun */}
            <circle cx="235" cy="85" r="30" fill="#F59E0B" />
            <circle cx="235" cy="85" r="24" fill="#FDE047" />
            <circle cx="231" cy="81" r="18" fill="#FEF9C3" />

            {/* Distinct Sunburst Rays */}
            <g className="animate-celestial-pulse" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" opacity="0.85">
              <line x1="235" y1="40" x2="235" y2="24" />
              <line x1="235" y1="130" x2="235" y2="146" />
              <line x1="190" y1="85" x2="174" y2="85" />
              <line x1="280" y1="85" x2="296" y2="85" />

              <line x1="203" y1="53" x2="191" y2="41" />
              <line x1="267" y1="117" x2="279" y2="129" />
              <line x1="203" y1="117" x2="191" y2="129" />
              <line x1="267" y1="53" x2="279" y2="41" />
            </g>

            {/* Fluffy High Noon Cloud */}
            <g className="animate-celestial-float">
              <path
                d="M150 135c0-12 10-22 22-22 4 0 8 1 11 3 5-9 14-16 25-16 16 0 28 13 28 28 3 1 7 3 9 7 4 4 7 10 7 17 0 12-10 22-22 22h-60c-11 0-20-9-20-20 0-9 6-17 14-19z"
                fill="url(#cloudGrad)"
              />
            </g>
          </g>
        )}

        {/* ================= 3. SORE HARI (Matahari senja / Sunset Golden Hour) ================= */}
        {phase === 'afternoon' && (
          <g className="animate-fade-in">
            {/* Sunset Warm Halo */}
            <ellipse cx="230" cy="145" r="70" ry="40" fill="url(#sunsetRay)" opacity="0.6" className="animate-horizon-glow" />

            {/* Descending Sunset Sun */}
            <g className="animate-celestial-pulse">
              <circle cx="230" cy="120" r="32" fill="#F97316" />
              <circle cx="230" cy="120" r="26" fill="#FBBF24" />
              <circle cx="230" cy="120" r="20" fill="#FEF08A" />

              {/* Horizontal Sunset Glow Lines */}
              <line x1="165" y1="120" x2="140" y2="120" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
              <line x1="295" y1="120" x2="315" y2="120" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
              <line x1="180" y1="95" x2="160" y2="80" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
              <line x1="280" y1="95" x2="300" y2="80" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            </g>

            {/* Warm Tinted Sunset Clouds */}
            <g className="animate-celestial-float">
              <path
                d="M175 140c0-10 8-18 18-18 3 0 7 1 9 3 4-8 12-13 21-13 13 0 24 11 24 24 3 1 6 3 8 6 3 4 5 8 5 14 0 10-8 18-18 18h-50c-9 0-17-8-17-17 0-8 5-15 12-17z"
                fill="url(#cloudWarmGrad)"
              />
              <path
                d="M130 160c0-7 6-13 13-13 2 0 5 1 6 2 3-5 8-9 15-9 10 0 17 8 17 17 2 1 4 2 6 4 2 3 3 6 3 10 0 7-6 13-13 13h-36c-7 0-12-6-12-12 0-6 4-11 9-12z"
                fill="#FED7AA"
                fillOpacity="0.25"
              />
            </g>
          </g>
        )}

        {/* ================= 4. MALAM HARI (Bulan bersinar & taburan bintang) ================= */}
        {phase === 'evening' && (
          <g className="animate-fade-in">
            {/* Soft Lunar Glow */}
            <circle cx="230" cy="85" r="45" fill="url(#moonGlow)" className="animate-celestial-pulse" />

            {/* Crescent Moon */}
            <path
              d="M245 55c-18 2-32 17-32 36s14 34 32 36c-24 2-44-17-44-41 0-21 16-39 44-31z"
              fill="#F8FAFC"
              className="animate-celestial-pulse"
            />
            {/* Inner subtle silver texture */}
            <path
              d="M240 60c-14 3-24 15-24 30s10 27 24 30c-18 1-33-14-33-33 0-17 12-31 33-27z"
              fill="#E2E8F0"
              opacity="0.6"
            />

            {/* Twinkling Night Stars */}
            {/* Star 1 - 4-point sparkle */}
            <g transform="translate(150, 45)" className="animate-star-twinkle">
              <path d="M0 -7 Q0 0 7 0 Q0 0 0 7 Q0 0 -7 0 Q0 0 0 -7Z" fill="#FDE047" />
            </g>
            {/* Star 2 */}
            <g transform="translate(180, 80)" className="animate-star-twinkle-delayed">
              <path d="M0 -5 Q0 0 5 0 Q0 0 0 5 Q0 0 -5 0 Q0 0 0 -5Z" fill="#FEF08A" />
            </g>
            {/* Star 3 */}
            <g transform="translate(285, 45)" className="animate-star-twinkle">
              <path d="M0 -6 Q0 0 6 0 Q0 0 0 6 Q0 0 -6 0 Q0 0 0 -6Z" fill="#FDE047" />
            </g>
            {/* Star 4 */}
            <circle cx="130" cy="85" r="1.5" fill="#FFFFFF" className="animate-star-twinkle-delayed" />
            <circle cx="170" cy="120" r="2" fill="#93C5FD" className="animate-star-twinkle" />
            <circle cx="280" cy="115" r="1.5" fill="#FFFFFF" className="animate-star-twinkle-delayed" />

            {/* Wispy Night Cloud */}
            <g className="animate-celestial-float">
              <path
                d="M175 125c0-8 7-15 15-15 3 0 5 1 7 2 4-6 10-11 18-11 11 0 20 9 20 20 2 1 5 3 7 5 3 3 4 7 4 12 0 9-7 15-15 15h-42c-8 0-14-7-14-14 0-6 4-11 10-12z"
                fill="url(#cloudGrad)"
              />
            </g>
          </g>
        )}

        {/* ================= 5. TENGAH MALAM (Deep Midnight tenang & bulan sabit) ================= */}
        {phase === 'midnight' && (
          <g className="animate-fade-in">
            {/* Deep Midnight Aura */}
            <circle cx="240" cy="80" r="40" fill="url(#moonGlow)" opacity="0.4" className="animate-celestial-pulse" />

            {/* Elegant Slim Crescent Moon */}
            <path
              d="M255 50c-20 3-35 20-35 41s15 38 35 41c-26 2-48-19-48-46 0-24 18-44 48-36z"
              fill="#F1F5F9"
              className="animate-celestial-pulse"
            />

            {/* Dense Constellation Stars */}
            <g transform="translate(130, 45)" className="animate-star-twinkle">
              <path d="M0 -7 Q0 0 7 0 Q0 0 0 7 Q0 0 -7 0 Q0 0 0 -7Z" fill="#67E8F9" />
            </g>
            <g transform="translate(170, 75)" className="animate-star-twinkle-delayed">
              <path d="M0 -5 Q0 0 5 0 Q0 0 0 5 Q0 0 -5 0 Q0 0 0 -5Z" fill="#F8FAFC" />
            </g>
            <g transform="translate(200, 35)" className="animate-star-twinkle">
              <circle cx="0" cy="0" r="2" fill="#E2E8F0" />
            </g>
            <g transform="translate(285, 40)" className="animate-star-twinkle-delayed">
              <path d="M0 -6 Q0 0 6 0 Q0 0 0 6 Q0 0 -6 0 Q0 0 0 -6Z" fill="#BAE6FD" />
            </g>
            <circle cx="110" cy="90" r="1.5" fill="#FFFFFF" className="animate-star-twinkle" />
            <circle cx="150" cy="120" r="1.5" fill="#93C5FD" className="animate-star-twinkle-delayed" />
            <circle cx="275" cy="110" r="2" fill="#FFFFFF" className="animate-star-twinkle" />
            <circle cx="210" cy="140" r="1.5" fill="#67E8F9" className="animate-star-twinkle-delayed" />
          </g>
        )}

        {/* ================= 6. DINI HARI / FAJAR (Pre-Dawn / Bintang Kejora) ================= */}
        {phase === 'dawn' && (
          <g className="animate-fade-in">
            {/* Pre-Dawn Horizon Purple-Indigo Glow */}
            <ellipse cx="230" cy="170" rx="85" ry="30" fill="url(#sunGlow)" opacity="0.3" className="animate-horizon-glow" />

            {/* Morning Star (Bintang Kejora / Venus) with large 4-point radiant cross */}
            <g transform="translate(225, 75)" className="animate-celestial-pulse">
              <circle cx="0" cy="0" r="16" fill="url(#moonGlow)" opacity="0.6" />
              <path d="M0 -14 Q0 0 14 0 Q0 0 0 14 Q0 0 -14 0 Q0 0 0 -14Z" fill="#FFFFFF" />
              <circle cx="0" cy="0" r="3.5" fill="#FEF08A" />
            </g>

            {/* Subtle Slim Fading Moon */}
            <path
              d="M275 65c-10 1-18 10-18 20s8 19 18 20c-13 1-24-9-24-23 0-12 9-22 24-17z"
              fill="#E2E8F0"
              opacity="0.65"
              className="animate-star-twinkle-delayed"
            />

            {/* Dawn Stars */}
            <g transform="translate(145, 55)" className="animate-star-twinkle">
              <path d="M0 -5 Q0 0 5 0 Q0 0 0 5 Q0 0 -5 0 Q0 0 0 -5Z" fill="#FDE047" />
            </g>
            <circle cx="180" cy="90" r="2" fill="#C4B5FD" className="animate-star-twinkle-delayed" />
            <circle cx="120" cy="80" r="1.5" fill="#FFFFFF" className="animate-star-twinkle" />

            {/* Pre-dawn Mist Clouds */}
            <g className="animate-celestial-float">
              <path
                d="M165 145c0-7 6-13 13-13 3 0 5 1 6 2 4-5 9-9 16-9 10 0 18 8 18 18 2 1 4 2 6 5 2 2 3 6 3 10 0 8-6 14-14 14h-38c-7 0-13-6-13-13 0-6 4-11 9-12z"
                fill="url(#cloudGrad)"
              />
            </g>
          </g>
        )}

      </svg>
    </div>
  );
};
