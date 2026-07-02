'use client';

import { useState, useEffect } from 'react';
import { useAuth, useWallet, useUI } from '../../store';
import { authService } from '../../services/wallet/auth.service';
// import { freighterService } from '../../services/wallet/freighter';
// import { unisatService } from '../../services/wallet/unisat';
import { tokenStorage } from '../../services/security/storage.service';

interface ConnectWalletProps {
  onConnect?: (address: string) => void;
  onError?: (error: string) => void;
  variant?: 'button' | 'full';
}

export function ConnectWallet({ onConnect, onError, variant = 'button' }: ConnectWalletProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<'freighter' | 'unisat' | null>(null);

  const { isAuthenticated, user, walletLogin, logout } = useAuth();
  const { connectFreighter, connectUniSat, activeWallet, wallets } = useWallet();
  const { showToast } = useUI();

  // Check for existing session on mount
  useEffect(() => {
    const token = tokenStorage.getToken();
    if (token && !isAuthenticated) {
      // Try to verify token
      authService.verifyToken(token).then((result) => {
        if (result.valid) {
          walletLogin(
            result.walletAddress || '',
            '',
            undefined,
            undefined
          );
        }
      });
    }
  }, []);

  const handleConnectFreighter = async () => {
    try {
      setIsConnecting(true);
      setErrorMessage(null);
      setWalletType('freighter');

      const wallet = await connectFreighter();
      if (!wallet || !wallet.address) {
        throw new Error('Failed to get Freighter address');
      }

      const result = await authService.authenticateWithWallet(
        'freighter',
        wallet.address,
        'stellar'
      );

      if (!result.success || !result.token) {
        throw new Error(result.error || 'Authentication failed');
      }

      tokenStorage.setToken(result.token);
      await walletLogin(
        result.address || wallet.address,
        '',
        wallet.publicKey,
        undefined
      );

      showToast(`Connected to ${wallet.address.slice(0, 8)}...`, 'success');
      onConnect?.(wallet.address);
      setShowModal(false);

    } catch (error: any) {
      const message = error.message || 'Failed to connect Freighter';
      setErrorMessage(message);
      onError?.(message);
      showToast(message, 'error');
    } finally {
      setIsConnecting(false);
      setWalletType(null);
    }
  };

  const handleConnectUniSat = async () => {
    try {
      setIsConnecting(true);
      setErrorMessage(null);
      setWalletType('unisat');

      const wallet = await connectUniSat();
      if (!wallet || !wallet.address) {
        throw new Error('Failed to get UniSat address');
      }

      const result = await authService.authenticateWithWallet(
        'unisat',
        wallet.address,
        'bitcoin'
      );

      if (!result.success || !result.token) {
        throw new Error(result.error || 'Authentication failed');
      }

      tokenStorage.setToken(result.token);
      await walletLogin(
        result.address || wallet.address,
        '',
        wallet.publicKey,
        undefined
      );

      showToast(`Connected to ${wallet.address.slice(0, 8)}...`, 'success');
      onConnect?.(wallet.address);
      setShowModal(false);

    } catch (error: any) {
      const message = error.message || 'Failed to connect UniSat';
      setErrorMessage(message);
      onError?.(message);
      showToast(message, 'error');
    } finally {
      setIsConnecting(false);
      setWalletType(null);
    }
  };

  const handleDisconnect = async () => {
    try {
      await logout();
      tokenStorage.clearAll();
      showToast('Disconnected', 'info');
    } catch (error: any) {
      showToast('Failed to disconnect', 'error');
    }
  };

  const isWalletInstalled = (type: 'freighter' | 'unisat'): boolean => {
    if (typeof window === 'undefined') return false;
    if (type === 'freighter') return !!window.freighter;
    if (type === 'unisat') return !!window.unisat;
    return false;
  };

  // If already authenticated, show wallet info
  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {user.walletAddress?.slice(0, 6)}...{user.walletAddress?.slice(-4)}
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {user.blockchain || 'stellar'}
        </span>
        <button
          onClick={handleDisconnect}
          className="text-xs text-red-500 hover:text-red-600 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Wallet selection button
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        disabled={isConnecting}
      >
        {isConnecting ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Connecting...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Connect Wallet
          </>
        )}
      </button>

      {/* Wallet Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Connect Wallet</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {errorMessage}
              </div>
            )}

            <div className="space-y-3">
              {/* Freighter Button */}
              <button
                onClick={handleConnectFreighter}
                disabled={isConnecting}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900 dark:text-white">Freighter</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Stellar Wallet</div>
                </div>
                {isConnecting && walletType === 'freighter' && (
                  <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {!isWalletInstalled('freighter') && (
                  <span className="text-xs text-orange-500 dark:text-orange-400">Not installed</span>
                )}
              </button>

              {/* UniSat Button */}
              <button
                onClick={handleConnectUniSat}
                disabled={isConnecting}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-orange-500 dark:hover:border-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800"
              >
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900 dark:text-white">UniSat</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Bitcoin Wallet</div>
                </div>
                {isConnecting && walletType === 'unisat' && (
                  <svg className="animate-spin h-5 w-5 text-orange-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {!isWalletInstalled('unisat') && (
                  <span className="text-xs text-orange-500 dark:text-orange-400">Not installed</span>
                )}
              </button>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  By connecting, you agree to the terms and conditions
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}