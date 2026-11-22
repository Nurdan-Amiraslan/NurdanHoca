import React from 'react';
import { NurdanMood } from '../../types/gamify.ts';

interface NurdanAvatarProps {
  mood?: NurdanMood;
  size?: number;
  className?: string;
}

const MOOD_META: Record<
  NurdanMood,
  { bg: string; ring: string; badgeText: string; badgeBg: string }
> = {
  welcome: {
    bg: '#e2dfff',
    ring: '#3730a3',
    badgeText: 'Xoş Gəldin!',
    badgeBg: '#1f108e',
  },
  explaining: {
    bg: '#eaddff',
    ring: '#712ae2',
    badgeText: 'İzah Rejimi',
    badgeBg: '#712ae2',
  },
  thinking: {
    bg: '#eceef0',
    ring: '#464553',
    badgeText: 'Düşünür...',
    badgeBg: '#464553',
  },
  encouraging: {
    bg: '#d1fae5',
    ring: '#059669',
    badgeText: 'Ruhlandırıcı',
    badgeBg: '#004d33',
  },
  celebrating: {
    bg: '#fef3c7',
    ring: '#d97706',
    badgeText: 'Təbrik Edir!',
    badgeBg: '#b45309',
  },
  correcting: {
    bg: '#ffdad6',
    ring: '#ba1a1a',
    badgeText: 'Xəta Təhlili',
    badgeBg: '#ba1a1a',
  },
};

export const NurdanAvatar: React.FC<NurdanAvatarProps> = ({
  mood = 'explaining',
  size = 88,
  className = '',
}) => {
  const meta = MOOD_META[mood];

  return (
    <div className={`relative inline-flex flex-col items-center shrink-0 ${className}`}>
      <div
        className="relative rounded-2xl flex items-center justify-center overflow-hidden shadow-[0_4px_0_0_#d8dadc] transition-all duration-300"
        style={{ width: size, height: size, backgroundColor: meta.bg }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label={`Nurdan Teacher (${mood})`}
        >
          {/* Decorative Halo */}
          <circle cx="60" cy="56" r="46" fill="#ffffff" fillOpacity="0.45" />

          {/* Hair Back */}
          <path
            d="M28 54C28 31 42 18 60 18C78 18 92 31 92 54V82C92 88 86 92 80 92H40C34 92 28 88 28 82V54Z"
            fill="#231942"
          />

          {/* Teacher Blazer & Shirt */}
          <path
            d="M22 118C22 97 38 86 60 86C82 86 98 97 98 118H22Z"
            fill="#1f108e"
          />
          <path d="M48 87L60 107L72 87H48Z" fill="#ffffff" />
          <path d="M56 97L60 112L64 97H56Z" fill="#712ae2" />

          {/* Neck */}
          <rect x="52" y="75" width="16" height="16" rx="7" fill="#f7cbb2" />

          {/* Face */}
          <ellipse cx="60" cy="54" rx="23" ry="26" fill="#fdd8c2" />

          {/* Hair Front Waves */}
          <path
            d="M36 47C38 30 50 22 63 23C75 24 83 32 85 45C78 36 69 33 60 34C50 35 42 40 36 47Z"
            fill="#231942"
          />

          {/* Eyebrows based on mood */}
          {mood === 'thinking' ? (
            <>
              <path d="M44 43Q49 40 54 43" stroke="#231942" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M66 40Q71 38 76 41" stroke="#231942" strokeWidth="2.4" strokeLinecap="round" />
            </>
          ) : mood === 'correcting' ? (
            <>
              <path d="M44 42Q49 44 54 41" stroke="#231942" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M66 41Q71 44 76 42" stroke="#231942" strokeWidth="2.4" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d="M44 42Q49 39 54 42" stroke="#231942" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M66 42Q71 39 76 42" stroke="#231942" strokeWidth="2.4" strokeLinecap="round" />
            </>
          )}

          {/* Eyes */}
          {mood === 'celebrating' ? (
            <>
              <path d="M45 52Q50 47 54 52" stroke="#191c1e" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M66 52Q71 47 75 52" stroke="#191c1e" strokeWidth="2.8" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="50" cy="52" r="3.4" fill="#191c1e" />
              <circle cx="70" cy="52" r="3.4" fill="#191c1e" />
              <circle cx="51.2" cy="50.8" r="1.1" fill="#ffffff" />
              <circle cx="71.2" cy="50.8" r="1.1" fill="#ffffff" />
            </>
          )}

          {/* Modern Teacher Glasses */}
          <rect x="41" y="45" width="17" height="13" rx="4.5" stroke="#3730a3" strokeWidth="2.2" fill="#ffffff" fillOpacity="0.12" />
          <rect x="62" y="45" width="17" height="13" rx="4.5" stroke="#3730a3" strokeWidth="2.2" fill="#ffffff" fillOpacity="0.12" />
          <line x1="58" y1="51" x2="62" y2="51" stroke="#3730a3" strokeWidth="2.2" />

          {/* Rosy Cheeks */}
          <ellipse cx="43" cy="60" rx="4" ry="2.2" fill="#f43f5e" fillOpacity="0.22" />
          <ellipse cx="77" cy="60" rx="4" ry="2.2" fill="#f43f5e" fillOpacity="0.22" />

          {/* Mouth Expression */}
          {mood === 'celebrating' || mood === 'welcome' ? (
            <path d="M51 64Q60 73 69 64Z" fill="#ffffff" stroke="#ba1a1a" strokeWidth="2" />
          ) : mood === 'thinking' ? (
            <line x1="55" y1="66" x2="65" y2="65" stroke="#93000a" strokeWidth="2.4" strokeLinecap="round" />
          ) : mood === 'correcting' ? (
            <path d="M53 66Q60 64 67 66" stroke="#93000a" strokeWidth="2.4" strokeLinecap="round" />
          ) : (
            <path d="M52 64Q60 71 68 64" stroke="#93000a" strokeWidth="2.5" strokeLinecap="round" />
          )}

          {/* Mood Accent Icon */}
          {mood === 'explaining' && (
            <g transform="translate(88, 72)">
              <circle cx="10" cy="10" r="10" fill="#6ffbbe" />
              <path d="M6 10L9 13L15 7" stroke="#003421" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}
          {mood === 'celebrating' && (
            <g transform="translate(88, 18)">
              <path d="M10 0L12.5 6.5L19 9L12.5 11.5L10 18L7.5 11.5L1 9L7.5 6.5Z" fill="#f59e0b" />
            </g>
          )}
          {mood === 'thinking' && (
            <g transform="translate(88, 16)">
              <circle cx="6" cy="14" r="2.5" fill="#712ae2" />
              <circle cx="12" cy="8" r="4" fill="#712ae2" />
            </g>
          )}
        </svg>
        <div
          className="absolute bottom-1.5 right-1.5 w-3 h-3 rounded-full ring-2 ring-white"
          style={{ backgroundColor: '#2dc68d' }}
        />
      </div>
    </div>
  );
};
