'use client';

import { ReactNode } from 'react';

interface ActionButtonProps {
  onClick: () => void;
  icon: ReactNode;
  label: string;
  className?: string;
}

export const ActionButton = ({ onClick, icon, label, className = '' }: ActionButtonProps) => (
  <button
    onClick={onClick}
    className={`w-full h-[70px] rounded-[35px] flex items-center justify-center gap-4 border-2 border-cyan bg-background shadow-[0_0_30px_rgba(0,212,255,0.15)] hover:shadow-[0_0_50px_rgba(0,212,255,0.25)] transition-all ${className}`}
  >
    {icon}
    <span className="text-cyan text-xl font-bold tracking-wider">{label}</span>
  </button>
);