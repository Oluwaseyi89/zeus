'use client';

import { HTLCProgress } from '../zk/HTLCProgress';

interface SwapStatusProps {
  status: 'pending' | 'funded' | 'completed' | 'refunded' | 'expired';
  swapId: string;
  amount?: string;
  asset?: string;
  timestamp?: Date;
}

export const SwapStatus = ({ status, swapId, amount, asset, timestamp }: SwapStatusProps) => {
  const statusMap = {
    pending: { label: 'AWAITING FUNDING', color: 'text-cyan', icon: '⏳' },
    funded: { label: 'FUNDED - LOCKED', color: 'text-gold', icon: '🔒' },
    completed: { label: 'COMPLETED', color: 'text-green-400', icon: '✅' },
    refunded: { label: 'REFUNDED', color: 'text-yellow-400', icon: '↩️' },
    expired: { label: 'EXPIRED', color: 'text-red-400', icon: '❌' },
  };

  const statusInfo = statusMap[status] || statusMap.pending;
  const stepMap = { pending: 1, funded: 2, completed: 3, refunded: 0, expired: 0 };

  return (
    <div className="bg-surface rounded-xl p-5 border border-border">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{statusInfo.icon}</span>
          <span className={`font-bold tracking-wider ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
        <span className="text-text-secondary text-xs font-mono">
          #{swapId.slice(0, 8)}
        </span>
      </div>

      {/* HTLC Progress */}
      <HTLCProgress step={stepMap[status]} />

      {/* Details */}
      <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-2">
        {amount && (
          <div>
            <p className="text-text-secondary text-[10px] uppercase tracking-wider">Amount</p>
            <p className="text-white font-mono text-sm">
              {amount} {asset || 'BTC'}
            </p>
          </div>
        )}
        {timestamp && (
          <div>
            <p className="text-text-secondary text-[10px] uppercase tracking-wider">Created</p>
            <p className="text-white font-mono text-sm">
              {timestamp.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="mt-3">
        <div className="flex justify-between text-[10px] text-text-secondary mb-1">
          <span>Initiate</span>
          <span>Lock</span>
          <span>Verify</span>
          <span>Claim</span>
        </div>
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              status === 'completed' ? 'bg-gold' :
              status === 'funded' ? 'bg-cyan' :
              status === 'pending' ? 'bg-cyan/50' :
              'bg-red-400'
            }`}
            style={{
              width: status === 'completed' ? '100%' :
                     status === 'funded' ? '66%' :
                     status === 'pending' ? '33%' :
                     '0%',
            }}
          />
        </div>
      </div>
    </div>
  );
};