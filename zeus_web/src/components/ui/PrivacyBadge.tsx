'use client';

import { ShieldIcon } from './Icons';

export const PrivacyBadge = () => (
  <div className="flex items-center gap-2 bg-cyan/10 px-3 py-1.5 rounded-full border border-cyan/30">
    <ShieldIcon size={16} />
    <span className="text-cyan text-xs font-semibold tracking-wide">
      Quantum-Safe • STARK Active
    </span>
  </div>
);