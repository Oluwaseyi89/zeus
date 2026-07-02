'use client';

import { useAuth, useWallet } from '../../store';

export function WalletStatus() {
  const { isAuthenticated, user } = useAuth();
  const { activeWallet } = useWallet();

  if (!isAuthenticated || !user) {
    return (
      <div className="text-xs text-text-secondary">
        Not connected
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
      <span className="text-text-secondary font-mono">
        {user.walletAddress?.slice(0, 4)}...{user.walletAddress?.slice(-4)}
      </span>
    </div>
  );
}
