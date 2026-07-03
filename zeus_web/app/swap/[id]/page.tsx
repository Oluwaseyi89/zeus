'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAtomicSwap } from '../../../src/hooks/useAtomicSwap';
import { SwapStatus } from '../../../src/components/atomic_swap/SwapStatus';
import { CountdownTimer } from '../../../src/components/atomic_swap/CountdownTimer';
import { useUI } from '../../../src/store';

export default function SwapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const swapId = params.id as string;
  const { showToast } = useUI();
  const { getSwap, fundSwap, completeSwap, refundSwap, currentOrder, isLoading } = useAtomicSwap();
  const [secret, setSecret] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    if (swapId) {
      getSwap(swapId).catch(() => {});
    }
  }, [swapId]);

  const handleFund = async () => {
    setIsActionLoading(true);
    try {
      await fundSwap(swapId);
      await getSwap(swapId);
    } catch (err) {
      // handled in hook
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!secret) {
      showToast('Please enter the secret', 'error');
      return;
    }
    setIsActionLoading(true);
    try {
      await completeSwap(swapId, secret);
      await getSwap(swapId);
      setSecret('');
    } catch (err) {
      // handled in hook
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRefund = async () => {
    setIsActionLoading(true);
    try {
      await refundSwap(swapId);
      await getSwap(swapId);
    } catch (err) {
      // handled in hook
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading || !currentOrder) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading swap details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-5 pt-6 pb-8 max-w-md mx-auto">
      <button
        onClick={() => router.back()}
        className="text-cyan hover:text-cyan/80 transition-colors mb-4"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold text-gold mb-2 tracking-wider font-serif">
        Swap Details
      </h1>
      <p className="text-text-secondary text-sm mb-6 font-mono">
        #{swapId.slice(0, 12)}...
      </p>

      {/* Swap Status */}
      <SwapStatus
        status={currentOrder.status}
        swapId={swapId}
        amount={currentOrder.amount?.toString()}
        asset={currentOrder.asset}
        timestamp={currentOrder.createdAt}
      />

      {/* Countdown Timer */}
      {currentOrder.expiresAt && (
        <div className="mt-6 bg-surface rounded-xl p-5 border border-border">
          <p className="text-text-secondary text-xs uppercase tracking-wider text-center mb-3">
            Time Remaining
          </p>
          <CountdownTimer
            targetTime={Math.floor(new Date(currentOrder.expiresAt).getTime() / 1000)}
            onExpire={() => {
              showToast('Swap has expired', 'error');
              getSwap(swapId);
            }}
          />
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 space-y-3">
        {currentOrder.status === 'pending' && (
          <button
            onClick={handleFund}
            disabled={isActionLoading}
            className="w-full py-3 bg-cyan text-background font-bold rounded-lg transition-all hover:bg-cyan/80 disabled:opacity-50"
          >
            {isActionLoading ? 'FUNDING...' : '🔓 FUND SWAP'}
          </button>
        )}

        {currentOrder.status === 'funded' && (
          <>
            <input
              type="text"
              placeholder="Enter secret to complete swap"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-text-secondary focus:outline-none focus:border-cyan"
            />
            <button
              onClick={handleComplete}
              disabled={isActionLoading || !secret}
              className="w-full py-3 bg-gold text-background font-bold rounded-lg transition-all hover:bg-gold/80 disabled:opacity-50"
            >
              {isActionLoading ? 'COMPLETING...' : '✅ COMPLETE SWAP'}
            </button>
          </>
        )}

        {(currentOrder.status === 'expired' || currentOrder.status === 'pending') && (
          <button
            onClick={handleRefund}
            disabled={isActionLoading}
            className="w-full py-3 bg-red-500/10 text-red-400 border border-red-500/30 font-bold rounded-lg transition-all hover:bg-red-500/20 disabled:opacity-50"
          >
            {isActionLoading ? 'REFUNDING...' : '↩️ REFUND'}
          </button>
        )}
      </div>
    </div>
  );
}