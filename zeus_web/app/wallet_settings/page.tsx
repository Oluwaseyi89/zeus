'use client';

import { ConnectWallet } from '../../src/components/wallet/ConnectWallet';
import { useAuth, useWallet, useUI } from '../../src/store';
import { tokenStorage } from '../../src/services/security/storage.service';

export default function WalletSettingsPage() {
  const { isAuthenticated, user, logout } = useAuth();
  const { wallets, activeWallet, disconnectWallet, setActiveWallet } = useWallet();
  const { showToast } = useUI();

  const handleDisconnectWallet = (address: string) => {
    disconnectWallet(address);
    if (activeWallet?.address === address) {
      if (wallets.length > 1) {
        const nextWallet = wallets.find(w => w.address !== address);
        if (nextWallet) setActiveWallet(nextWallet.address);
      }
    }
    showToast('Wallet disconnected', 'info');
  };

  const handleLogout = () => {
    logout();
    tokenStorage.clearAll();
    showToast('Logged out successfully', 'info');
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
          Wallet Settings
        </h1>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Please connect your wallet first
          </p>
          <ConnectWallet />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
        Wallet Settings
      </h1>

      {/* Connected Wallets */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Connected Wallets ({wallets.length})
        </h2>
        <div className="space-y-3">
          {wallets.map((wallet) => (
            <div
              key={wallet.address}
              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                activeWallet?.address === wallet.address
                  ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  wallet.connected ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {wallet.blockchain} • {wallet.type}
                    {wallet.balance && ` • Balance: ${wallet.balance}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeWallet?.address !== wallet.address && wallet.connected && (
                  <button
                    onClick={() => setActiveWallet(wallet.address)}
                    className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    Set Active
                  </button>
                )}
                {activeWallet?.address === wallet.address && (
                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                    Active
                  </span>
                )}
                <button
                  onClick={() => handleDisconnectWallet(wallet.address)}
                  className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14v6m-4-6v6m4 0h-4" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Wallet */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Add Another Wallet
        </h2>
        <ConnectWallet />
      </div>

      {/* Account Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Account Info
        </h2>
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-gray-500 dark:text-gray-400">User ID:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-mono">
              {user?.id}
            </span>
          </p>
          <p>
            <span className="text-gray-500 dark:text-gray-400">Blockchain:</span>
            <span className="ml-2 text-gray-900 dark:text-white capitalize">
              {user?.blockchain || 'stellar'}
            </span>
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}