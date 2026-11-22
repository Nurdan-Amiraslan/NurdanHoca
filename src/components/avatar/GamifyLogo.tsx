import React from 'react';

export const GamifyLogo: React.FC<{ size?: number; showText?: boolean }> = ({
  size = 36,
  showText = true,
}) => {
  return (
    <div className="inline-flex items-center gap-2.5 select-none shrink-0">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="GAMIFY Logo"
      >
        <defs>
          <linearGradient id="gamifyGrad" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1f108e" />
            <stop offset="55%" stopColor="#3730a3" />
            <stop offset="100%" stopColor="#712ae2" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#gamifyGrad)" />
        <rect x="4" y="52" width="56" height="8" rx="4" fill="#0f0069" fillOpacity="0.45" />
        {/* Graduation cap + G emblem */}
        <path d="M32 13L50 21L32 29L14 21L32 13Z" fill="#6ffbbe" />
        <path d="M21 25V33C21 37 26 40 32 40C38 40 43 37 43 33V25" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M48 22V34" stroke="#fbbf24" strokeWidth="2.8" strokeLinecap="round" />
        <circle cx="48" cy="36" r="2.6" fill="#fbbf24" />
        {/* Spark accent */}
        <path d="M32 43L34.5 48L40 50.5L34.5 53L32 58L29.5 53L24 50.5L29.5 48L32 43Z" fill="#6ffbbe" />
      </svg>
      {showText && (
        <span className="font-display font-extrabold text-xl tracking-tight text-[#1f108e] whitespace-nowrap">
          GAMIFY
        </span>
      )}
    </div>
  );
};
