'use client';

import { ConnectWallet } from '../src/components/wallet/ConnectWallet';
import { WalletStatus } from '../src/components/wallet/WalletStatus';
import { useAuth, useUI } from '../src/store';
import { useEffect } from 'react';

export default function HomePage() {
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

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="text-center py-20">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
            <span className="text-white text-5xl font-bold">Z</span>
          </div>
        </div>
        <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Zero-Knowledge on Stellar
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
          Privacy-preserving atomic swaps and ZK proofs for cross-chain settlements
        </p>
        {!isAuthenticated && (
          <div className="flex justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Get Started
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Connect your wallet to access Zeus features
              </p>
              <ConnectWallet />
            </div>
          </div>
        )}
        {isAuthenticated && user && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 max-w-md mx-auto">
            <p className="text-green-700 dark:text-green-300">
              ✅ Connected as {user.walletAddress?.slice(0, 8)}...
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Blockchain: {user.blockchain || 'stellar'}
            </p>
            <div className="mt-4 flex justify-center">
              <WalletStatus />
            </div>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">🔐</span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            ZK Proofs
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Generate and verify zero-knowledge proofs on Stellar
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">🔄</span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Atomic Swaps
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Cross-chain swaps between Bitcoin and Stellar assets
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">🛡️</span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Privacy Pools
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Confidential transfers with compliance proofs
          </p>
        </div>
      </section>
    </div>
  );
}
