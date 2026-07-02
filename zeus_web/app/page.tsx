'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth, useUI } from '../src/store';
import { ConnectWallet } from '../src/components/wallet/ConnectWallet';
import { WalletStatus } from '../src/components/wallet/WalletStatus';
import { PrivacyBadge } from '../src/components/ui/PrivacyBadge';
import { BalanceCard } from '../src/components/ui/BalanceCard';
import { ActionButton } from '../src/components/ui/ActionButton';
import { RecentTransactions } from '../src/components/ui/RecentTransactions';
import { ThunderBolt } from '../src/components/ui/Icons';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user, verifyToken } = useAuth();
  const { showToast } = useUI();

  useEffect(() => {
    const checkAuth = async () => {
      const valid = await verifyToken();
      if (valid) {
        showToast('Welcome back!', 'success');
      }
    };
    checkAuth();
  }, []);

  const handleSwap = () => {
    router.push('/swap');
  };

  return (
    <div className="min-h-screen bg-background px-5 pt-6 pb-8 max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <PrivacyBadge />
        {isAuthenticated && (
          <button
            onClick={() => router.push('/wallet_settings')}
            className="text-cyan font-bold text-sm"
          >
            Wallets
          </button>
        )}
      </div>

      {/* Inbox Link */}
      <div className="text-right mb-6">
        <button
          onClick={() => router.push('/inbox')}
          className="text-cyan font-bold text-sm"
        >
          Inbox {isAuthenticated ? '' : ''}
        </button>
      </div>

      {/* Balance Card */}
      <BalanceCard />

      {/* Quick Actions */}
      <div className="mb-10">
        <ActionButton
          onClick={handleSwap}
          icon={<ThunderBolt />}
          label="THUNDER SWAP"
        />
      </div>

      {/* Recent Transactions */}
      <RecentTransactions />

      {/* Wallet Status (if authenticated) */}
      {isAuthenticated && user && (
        <div className="mt-6 p-4 bg-surface rounded-xl border border-border">
          <p className="text-green-500 text-sm">
            ✅ Connected as {user.walletAddress?.slice(0, 8)}...
          </p>
          <p className="text-text-secondary text-xs mt-1">
            Blockchain: {user.blockchain || 'stellar'}
          </p>
        </div>
      )}

      {/* Connect Wallet (if not authenticated) */}
      {!isAuthenticated && (
        <div className="mt-8 p-6 bg-surface rounded-2xl border border-border text-center">
          <h3 className="text-white font-semibold mb-2">Get Started</h3>
          <p className="text-text-secondary text-sm mb-4">
            Connect your wallet to access Zeus features
          </p>
          <div className="flex justify-center">
            <ConnectWallet />
          </div>
        </div>
      )}
    </div>
  );
}

