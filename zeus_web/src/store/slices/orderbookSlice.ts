import { StateCreator } from 'zustand';
import { OrderBookEntry } from '../types';
import { apiClient } from '../../services/api/client';

export interface OrderBookState {
  orders: OrderBookEntry[];
  isLoading: boolean;
  error: string | null;
}

export interface OrderBookActions {
  submitOrder: (order: any) => Promise<void>;
  queryOrders: (params: any) => Promise<OrderBookEntry[]>;
  clearError: () => void;
}

export type OrderBookSlice = OrderBookState & OrderBookActions;

export const createOrderBookSlice: StateCreator<OrderBookSlice> = (set, get) => ({
  // State
  orders: [],
  isLoading: false,
  error: null,

  // Actions
  submitOrder: async (order: any) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post('/orderbook/submit', order);
      // Refresh orders after submission
      await get().queryOrders({});
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to submit order',
        isLoading: false,
      });
      throw error;
    }
  },

  queryOrders: async (params: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/orderbook/query', { params });
      set({
        orders: response.data,
        isLoading: false,
      });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to query orders',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
});