import { StateCreator } from 'zustand';
import { SwapOrder } from '../types';
import { apiClient } from '../../services/api/client';

export interface SwapState {
  swapOrders: SwapOrder[];
  currentOrder: SwapOrder | null;
  isLoading: boolean;
  error: string | null;
}

export interface SwapActions {
  createSwap: (params: any) => Promise<SwapOrder>;
  getSwap: (swapId: string) => Promise<SwapOrder>;
  fundSwap: (swapId: string, escrowAddress?: string) => Promise<void>;
  completeSwap: (swapId: string, secret: string, escrowAddress?: string) => Promise<void>;
  refundSwap: (swapId: string, escrowAddress?: string) => Promise<void>;
  createStellarEscrow: (swapId: string, params: any) => Promise<string>;
  fundStellarSwap: (swapId: string, escrowAddress: string, amount: number) => Promise<void>;
  completeStellarSwap: (swapId: string, params: any) => Promise<void>;
  clearError: () => void;
}

export type SwapSlice = SwapState & SwapActions;

export const createSwapSlice: StateCreator<any, [], [], SwapSlice> = (set, get) => ({
  // State
  swapOrders: [],
  currentOrder: null,
  isLoading: false,
  error: null,

  // Actions
  createSwap: async (params: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/swap', params);
      const order: SwapOrder = {
        id: response.data.swapId,
        swapId: response.data.swapId,
        status: response.data.status,
        blockchain: response.data.blockchain,
        ...params,
        createdAt: new Date(),
      };

      set((state: any) => ({
        swapOrders: [...state.swapOrders, order], // Updated property name
        currentOrder: order,
        isLoading: false,
      }));

      return order;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create swap',
        isLoading: false,
      });
      throw error;
    }
  },

  getSwap: async (swapId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/swap/${swapId}`);
      const order = response.data;
      
      set((state: any) => ({
        swapOrders: state.swapOrders.map((o: any) => o.id === swapId ? order : o), // Updated property name
        currentOrder: order,
        isLoading: false,
      }));

      return order;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to get swap',
        isLoading: false,
      });
      throw error;
    }
  },

  fundSwap: async (swapId: string, escrowAddress?: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post(`/swap/${swapId}/fund`, { escrowAddress });
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fund swap',
        isLoading: false,
      });
      throw error;
    }
  },

  completeSwap: async (swapId: string, secret: string, escrowAddress?: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post(`/swap/${swapId}/complete`, { secret, escrowAddress });
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to complete swap',
        isLoading: false,
      });
      throw error;
    }
  },

  refundSwap: async (swapId: string, escrowAddress?: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post(`/swap/${swapId}/refund`, { escrowAddress });
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to refund swap',
        isLoading: false,
      });
      throw error;
    }
  },

  createStellarEscrow: async (swapId: string, params: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post(`/swap/${swapId}/stellar-escrow`, params);
      set({ isLoading: false });
      return response.data.escrowAddress;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create Stellar escrow',
        isLoading: false,
      });
      throw error;
    }
  },

  fundStellarSwap: async (swapId: string, escrowAddress: string, amount: number) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post(`/swap/${swapId}/stellar-fund`, { escrowAddress, amount });
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fund Stellar swap',
        isLoading: false,
      });
      throw error;
    }
  },

  completeStellarSwap: async (swapId: string, params: any) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post(`/swap/${swapId}/stellar-complete`, params);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to complete Stellar swap',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
});
