'use client';

interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

export const ThunderBolt = ({ className = '', size = 24, color = '#00D4FF' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill={color} />
  </svg>
);

export const ShieldIcon = ({ className = '', size = 24, color = '#FFD700' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke={color} strokeWidth="2" fill="none" />
    <path d="M9 12L11 14L15 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const RuneIcon = ({ className = '', size = 24 }: IconProps) => (
  <span className={`text-2xl text-gold font-serif ${className}`}>ᛉ</span>
);

export const WalletIcon = ({ className = '', size = 24, color = '#FFD700' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M19 7H5C3.89543 7 3 7.89543 3 9V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V9C21 7.89543 20.1046 7 19 7Z" stroke={color} strokeWidth="2" />
    <path d="M16 11C16 11.5523 15.5523 12 15 12C14.4477 12 14 11.5523 14 11C14 10.4477 14.4477 10 15 10C15.5523 10 16 10.4477 16 11Z" fill={color} />
    <path d="M3 12H7" stroke={color} strokeWidth="2" />
    <path d="M21 12H17" stroke={color} strokeWidth="2" />
  </svg>
);