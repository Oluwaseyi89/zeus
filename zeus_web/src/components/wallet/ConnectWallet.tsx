'use client';

import { useState, useEffect } from 'react';
import { useAuth, useWallet, useUI } from '../../store';
import { authService } from '../../services/wallet/auth.service';
import { freighterService } from '../../services/wallet/freighter';
import { unisatService } from '../../services/wallet/unisat';
import { tokenStorage } from '../../services/security/storage.service';
import { WalletIcon } from '../ui/Icons';

interface ConnectWalletProps {
  onConnect?: (address: string) => void;
  onError?: (error: string) => void;
}

export function ConnectWallet({ onConnect, onError }: ConnectWalletProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<'freighter' | 'unisat' | null>(null);

  const { isAuthenticated, user, walletLogin, logout } = useAuth();
  const { connectFreighter, connectUniSat } = useWallet();
  const { showToast } = useUI();

  useEffect(() => {
    const token = tokenStorage.getToken();
    if (token && !isAuthenticated) {
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
      <div className="flex items-center gap-3 px-4 py-2 bg-surface rounded-lg border border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-white">
            {user.walletAddress?.slice(0, 6)}...{user.walletAddress?.slice(-4)}
          </span>
        </div>
        <span className="text-xs text-text-secondary">
          {user.blockchain || 'stellar'}
        </span>
        <button
          onClick={handleDisconnect}
          className="text-xs text-red-500 hover:text-red-400 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-cyan text-background font-bold rounded-lg transition-all hover:bg-cyan/80 flex items-center gap-2"
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
          'Connect Wallet'
        )}
      </button>

      {/* Wallet Selection Modal - Dark Theme */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-surface rounded-2xl p-6 max-w-md w-full border border-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Connect Wallet</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-text-secondary hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {errorMessage}
              </div>
            )}

            <div className="space-y-3">
              {/* Freighter Button - Mobile Style */}
              <button
                onClick={handleConnectFreighter}
                disabled={isConnecting}
                className="w-full flex items-center gap-4 p-4 bg-background rounded-xl border border-border hover:border-cyan transition-all disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-cyan/10 rounded-full flex items-center justify-center">
                  <WalletIcon size={24} color="#00D4FF" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-white">Freighter</div>
                  <div className="text-sm text-text-secondary">Stellar Wallet</div>
                </div>
                {isConnecting && walletType === 'freighter' && (
                  <svg className="animate-spin h-5 w-5 text-cyan" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {!isWalletInstalled('freighter') && (
                  <span className="text-xs text-orange-500">Not installed</span>
                )}
              </button>

              {/* UniSat Button - Mobile Style */}
              <button
                onClick={handleConnectUniSat}
                disabled={isConnecting}
                className="w-full flex items-center gap-4 p-4 bg-background rounded-xl border border-border hover:border-cyan transition-all disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center">
                  <WalletIcon size={24} color="#FFD700" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-white">UniSat</div>
                  <div className="text-sm text-text-secondary">Bitcoin Wallet</div>
                </div>
                {isConnecting && walletType === 'unisat' && (
                  <svg className="animate-spin h-5 w-5 text-gold" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {!isWalletInstalled('unisat') && (
                  <span className="text-xs text-orange-500">Not installed</span>
                )}
              </button>

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-text-secondary text-center">
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
