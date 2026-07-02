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
      <BalanceCard btcBalance="1.24" strkBalance="12,450.00" />

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

























// 'use client';

// import { ConnectWallet } from '../src/components/wallet/ConnectWallet';
// import { WalletStatus } from '../src/components/wallet/WalletStatus';
// import { useAuth, useUI } from '../src/store';
// import { useEffect } from 'react';

// export default function HomePage() {
//   const { isAuthenticated, user, verifyToken } = useAuth();
//   const { showToast } = useUI();

//   useEffect(() => {
//     const checkAuth = async () => {
//       const valid = await verifyToken();
//       if (valid) {
//         showToast('Welcome back!', 'success');
//       }
//     };
//     checkAuth();
//   }, []);

//   return (
//     <div className="container mx-auto px-4 py-12">
//       {/* Hero Section */}
//       <section className="text-center py-20">
//         <div className="flex justify-center mb-6">
//           <div className="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
//             <span className="text-white text-5xl font-bold">Z</span>
//           </div>
//         </div>
//         <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
//           Zero-Knowledge on Stellar
//         </h2>
//         <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
//           Privacy-preserving atomic swaps and ZK proofs for cross-chain settlements
//         </p>
//         {!isAuthenticated && (
//           <div className="flex justify-center">
//             <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl max-w-md w-full">
//               <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
//                 Get Started
//               </h3>
//               <p className="text-gray-500 dark:text-gray-400 mb-4">
//                 Connect your wallet to access Zeus features
//               </p>
//               <ConnectWallet />
//             </div>
//           </div>
//         )}
//         {isAuthenticated && user && (
//           <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 max-w-md mx-auto">
//             <p className="text-green-700 dark:text-green-300">
//               ✅ Connected as {user.walletAddress?.slice(0, 8)}...
//             </p>
//             <p className="text-sm text-green-600 dark:text-green-400 mt-1">
//               Blockchain: {user.blockchain || 'stellar'}
//             </p>
//             <div className="mt-4 flex justify-center">
//               <WalletStatus />
//             </div>
//           </div>
//         )}
//       </section>

//       {/* Features */}
//       <section className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
//         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
//           <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
//             <span className="text-2xl">🔐</span>
//           </div>
//           <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
//             ZK Proofs
//           </h3>
//           <p className="text-sm text-gray-600 dark:text-gray-300">
//             Generate and verify zero-knowledge proofs on Stellar
//           </p>
//         </div>
//         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
//           <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
//             <span className="text-2xl">🔄</span>
//           </div>
//           <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
//             Atomic Swaps
//           </h3>
//           <p className="text-sm text-gray-600 dark:text-gray-300">
//             Cross-chain swaps between Bitcoin and Stellar assets
//           </p>
//         </div>
//         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
//           <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
//             <span className="text-2xl">🛡️</span>
//           </div>
//           <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
//             Privacy Pools
//           </h3>
//           <p className="text-sm text-gray-600 dark:text-gray-300">
//             Confidential transfers with compliance proofs
//           </p>
//         </div>
//       </section>
//     </div>
//   );
// }
