'use client';

import { useAuth, useWallet } from '../../store';

export function WalletStatus() {
  const { isAuthenticated, user } = useAuth();
  const { activeWallet, wallets } = useWallet();

  if (!isAuthenticated || !user) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Not connected
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="w-2 h-2 bg-green-500 rounded-full" />
      <span className="text-gray-700 dark:text-gray-300">
        {user.walletAddress?.slice(0, 6)}...{user.walletAddress?.slice(-4)}
      </span>
      {activeWallet?.balance && (
        <span className="text-gray-500 dark:text-gray-400">
          {activeWallet.balance} {activeWallet.blockchain === 'stellar' ? 'XLM' : 'BTC'}
        </span>
      )}
    </div>
  );
}