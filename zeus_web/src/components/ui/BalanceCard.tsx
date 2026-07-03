'use client';

import { useState } from 'react';

interface BalanceCardProps {
  btcBalance?: string;
  xlmBalance?: string;
}

export const BalanceCard = ({ btcBalance = '0.5', xlmBalance = '189,532.72' }: BalanceCardProps) => {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div 
      className="bg-surface rounded-2xl p-6 border-2 border-border mb-8 cursor-pointer transition-all hover:glow-cyan"
      onClick={() => setIsRevealed(!isRevealed)}
    >
      <p className="text-text-secondary text-sm uppercase tracking-wider mb-2">
        Private Vault Balance
      </p>
      <div className="mb-3">
        <p className={`text-4xl font-bold ${!isRevealed ? 'blur-text' : 'text-white'}`}>
          {isRevealed ? `${btcBalance} BTC` : '•••• BTC'}
        </p>
        <p className={`text-xl mt-1 ${!isRevealed ? 'blur-text' : 'text-cyan'}`}>
          {isRevealed ? `≈ ${xlmBalance} XLM` : '•••• XLM'}
        </p>
      </div>
      <p className="text-gold text-xs text-center italic opacity-70">
        {isRevealed ? 'Tap to conceal' : 'Tap to reveal vault'}
      </p>
    </div>
  );
};