import { StateCreator } from 'zustand';
import { User } from '../types';
import { apiClient } from '../../services/api/client';

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (username: string, password: string) => Promise<void>;
  walletLogin: (address: string, signature: string | string[], publicKey?: string, message?: string) => Promise<void>;
  logout: () => void;
  verifyToken: () => Promise<boolean>;
  setToken: (token: string) => void;
  clearError: () => void;
}

export type AuthSlice = AuthState & AuthActions;

export const createAuthSlice: StateCreator<AuthSlice> = (set, get) => ({
  // State
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Actions
  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/auth/login', { username, password });
      const { token } = response.data;
      
      // Verify token and get user info
      const verification = await apiClient.post('/auth/verify', { token });
      
      set({
        token,
        user: {
          id: verification.data.userId,
          username,
          walletAddress: verification.data.walletAddress,
          blockchain: verification.data.blockchain,
        },
        isAuthenticated: true,
        isLoading: false,
      });
      
      // Store token in cookie/localStorage
      localStorage.setItem('zeus_token', token);
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Login failed',
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  walletLogin: async (address: string, signature: string | string[], publicKey?: string, message?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/auth/wallet-login', {
        address,
        signature,
        publicKey,
        message,
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Wallet login failed');
      }

      const { token, address: walletAddress, blockchain } = response.data;

      set({
        token,
        user: {
          id: walletAddress,
          walletAddress,
          blockchain,
        },
        isAuthenticated: true,
        isLoading: false,
      });

      localStorage.setItem('zeus_token', token);
    } catch (error: any) {
      set({
        error: error.message || 'Wallet login failed',
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('zeus_token');
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  verifyToken: async () => {
    const token = get().token || localStorage.getItem('zeus_token');
    if (!token) {
      set({ isAuthenticated: false });
      return false;
    }

    try {
      const response = await apiClient.post('/auth/verify', { token });
      if (response.data.valid) {
        set({
          isAuthenticated: true,
          user: {
            id: response.data.userId,
            walletAddress: response.data.walletAddress,
            blockchain: response.data.blockchain,
          },
        });
        return true;
      } else {
        set({ isAuthenticated: false });
        localStorage.removeItem('zeus_token');
        return false;
      }
    } catch (error) {
      set({ isAuthenticated: false });
      localStorage.removeItem('zeus_token');
      return false;
    }
  },

  setToken: (token: string) => {
    set({ token, isAuthenticated: true });
    localStorage.setItem('zeus_token', token);
  },

  clearError: () => set({ error: null }),
});