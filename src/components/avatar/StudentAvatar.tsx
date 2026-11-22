import React from 'react';

interface StudentAvatarProps {
  outfit?: string;
  accessory?: string;
  size?: number;
  nickname?: string;
}

export const StudentAvatar: React.FC<StudentAvatarProps> = ({
  outfit = 'outfit_classic',
  accessory = 'acc_none',
  size = 56,
  nickname = 'Şagird',
}) => {
  const blazerColor =
    outfit === 'outfit_emerald_mentor'
      ? '#004d33'
      : outfit === 'outfit_violet_scholar'
        ? '#712ae2'
        : '#1f108e';

  const bgTint =
    outfit === 'outfit_emerald_mentor'
      ? '#d1fae5'
      : outfit === 'outfit_violet_scholar'
        ? '#eaddff'
        : '#e2dfff';

  return (
    <div
      className="relative rounded-full overflow-hidden flex items-center justify-center shrink-0 ring-2 ring-[#3730a3]/20"
      style={{ width: size, height: size, backgroundColor: bgTint }}
      title={nickname}
    >
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
        {/* Crown if equipped */}
        {accessory === 'acc_scholar_crown' && (
          <path d="M24 22L28 10L40 18L52 10L56 22H24Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
        )}
        {/* Shoulders */}
        <path d="M14 78C14 62 25 54 40 54C55 54 66 62 66 78H14Z" fill={blazerColor} />
        <path d="M33 54L40 66L47 54H33Z" fill="#ffffff" />
        {/* Hair & Head */}
        <circle cx="40" cy="36" r="16" fill="#231942" />
        <circle cx="40" cy="38" r="14" fill="#fdd8c2" />
        <path d="M26 35C27 25 34 21 42 22C49 23 53 27 54 34C48 28 34 28 26 35Z" fill="#231942" />
        {/* Eyes */}
        <circle cx="35" cy="38" r="2" fill="#191c1e" />
        <circle cx="45" cy="38" r="2" fill="#191c1e" />
        {/* Glasses if equipped */}
        {accessory === 'acc_smart_glasses' && (
          <g>
            <rect x="30" y="34" width="9" height="7" rx="2.5" stroke="#d97706" strokeWidth="1.8" />
            <rect x="41" y="34" width="9" height="7" rx="2.5" stroke="#d97706" strokeWidth="1.8" />
            <line x1="39" y1="37" x2="41" y2="37" stroke="#d97706" strokeWidth="1.8" />
          </g>
        )}
        {/* Smile */}
        <path d="M35 45Q40 49 45 45" stroke="#93000a" strokeWidth="2" strokeLinecap="round" />
        {/* Golden Pin if equipped */}
        {accessory === 'acc_golden_pin' && (
          <circle cx="52" cy="64" r="4" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.2" />
        )}
      </svg>
    </div>
  );
};
