'use client';

import { useState, useCallback } from 'react';
import { useSwap } from '../store';
import { useUI } from '../store';

export interface CreateSwapParams {
  initiator: string;
  amount: number;
  asset: string;
  blockchain?: string;
  counterparty?: string;
}

export interface FundSwapParams {
  swapId: string;
  escrowAddress?: string;
}

export interface CompleteSwapParams {
  swapId: string;
  secret: string;
  escrowAddress?: string;
}

export interface CreateStellarEscrowParams {
  swapId: string;
  verifierAddress: string;
  tokenAddress: string;
  depositor: string;
  treasury: string;
  swapAmount: number;
  timeoutTimestamp: number;
  feeBps: number;
}

export interface SwapStatus {
  id: string;
  status: 'pending' | 'funded' | 'completed' | 'refunded' | 'expired';
  escrowAddress?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export function useAtomicSwap() {
  const {
    orders,
    currentOrder,
    isLoading,
    error,
    createSwap: storeCreateSwap,
    getSwap: storeGetSwap,
    fundSwap: storeFundSwap,
    completeSwap: storeCompleteSwap,
    refundSwap: storeRefundSwap,
    createStellarEscrow: storeCreateStellarEscrow,
    fundStellarSwap: storeFundStellarSwap,
    completeStellarSwap: storeCompleteStellarSwap,
    clearError,
  } = useSwap();

  const { showToast } = useUI();
  const [progress, setProgress] = useState(0);

  const createSwap = useCallback(
    async (params: CreateSwapParams) => {
      try {
        setProgress(20);
        const result = await storeCreateSwap(params);
        setProgress(100);
        showToast('Swap created successfully!', 'success');
        return result;
      } catch (err: any) {
        showToast(err.message || 'Failed to create swap', 'error');
        throw err;
      }
    },
    [storeCreateSwap, showToast]
  );

  const getSwap = useCallback(
    async (swapId: string) => {
      try {
        return await storeGetSwap(swapId);
      } catch (err: any) {
        showToast(err.message || 'Failed to get swap', 'error');
        throw err;
      }
    },
    [storeGetSwap, showToast]
  );

  const fundSwap = useCallback(
    async (swapId: string, escrowAddress?: string) => {
      try {
        setProgress(40);
        await storeFundSwap(swapId, escrowAddress);
        setProgress(60);
        showToast('Swap funded successfully!', 'success');
      } catch (err: any) {
        showToast(err.message || 'Failed to fund swap', 'error');
        throw err;
      }
    },
    [storeFundSwap, showToast]
  );

  const completeSwap = useCallback(
    async (swapId: string, secret: string, escrowAddress?: string) => {
      try {
        setProgress(70);
        await storeCompleteSwap(swapId, secret, escrowAddress);
        setProgress(100);
        showToast('Swap completed successfully! 🎉', 'success');
      } catch (err: any) {
        showToast(err.message || 'Failed to complete swap', 'error');
        throw err;
      }
    },
    [storeCompleteSwap, showToast]
  );

  const refundSwap = useCallback(
    async (swapId: string, escrowAddress?: string) => {
      try {
        await storeRefundSwap(swapId, escrowAddress);
        showToast('Swap refunded', 'info');
      } catch (err: any) {
        showToast(err.message || 'Failed to refund swap', 'error');
        throw err;
      }
    },
    [storeRefundSwap, showToast]
  );

  const createStellarEscrow = useCallback(
    async (params: CreateStellarEscrowParams) => {
      try {
        setProgress(30);
        const escrowAddress = await storeCreateStellarEscrow(params.swapId, params);
        setProgress(50);
        showToast('Stellar escrow created!', 'success');
        return escrowAddress;
      } catch (err: any) {
        showToast(err.message || 'Failed to create Stellar escrow', 'error');
        throw err;
      }
    },
    [storeCreateStellarEscrow, showToast]
  );

  const fundStellarSwap = useCallback(
    async (swapId: string, escrowAddress: string, amount: number) => {
      try {
        setProgress(50);
        await storeFundStellarSwap(swapId, escrowAddress, amount);
        setProgress(70);
        showToast('Stellar swap funded!', 'success');
      } catch (err: any) {
        showToast(err.message || 'Failed to fund Stellar swap', 'error');
        throw err;
      }
    },
    [storeFundStellarSwap, showToast]
  );

  const completeStellarSwap = useCallback(
    async (swapId: string, params: any) => {
      try {
        setProgress(80);
        await storeCompleteStellarSwap(swapId, params);
        setProgress(100);
        showToast('Stellar swap completed! 🎉', 'success');
      } catch (err: any) {
        showToast(err.message || 'Failed to complete Stellar swap', 'error');
        throw err;
      }
    },
    [storeCompleteStellarSwap, showToast]
  );

  const getSwapStatus = useCallback(
    async (swapId: string): Promise<SwapStatus> => {
      try {
        const order = await storeGetSwap(swapId);
        return {
          id: order.id,
          status: order.status,
          escrowAddress: order.escrowAddress,
          createdAt: order.createdAt,
          expiresAt: order.expiresAt,
        };
      } catch (err: any) {
        showToast(err.message || 'Failed to get swap status', 'error');
        throw err;
      }
    },
    [storeGetSwap, showToast]
  );

  return {
    // State
    orders,
    currentOrder,
    isLoading,
    error,
    progress,
    // Actions
    createSwap,
    getSwap,
    fundSwap,
    completeSwap,
    refundSwap,
    createStellarEscrow,
    fundStellarSwap,
    completeStellarSwap,
    getSwapStatus,
    clearError,
    setProgress,
  };
}