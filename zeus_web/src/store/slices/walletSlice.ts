import { StateCreator } from 'zustand';
import { Wallet } from '../types';
import { freighterService } from '../../services/wallet/freighter';
import { unisatService } from '../../services/wallet/unisat';

export interface WalletState {
  wallets: Wallet[];
  activeWallet: Wallet | null;
  isConnecting: boolean;
  connectionError: string | null;
}

export interface WalletActions {
  connectFreighter: () => Promise<Wallet>;
  connectUniSat: () => Promise<Wallet>;
  disconnectWallet: (address: string) => void;
  setActiveWallet: (address: string) => void;
  updateWalletBalance: (address: string, balance: string | number) => void;
  getWalletBalance: (address: string) => string | number | undefined;
  clearConnectionError: () => void;
}

export type WalletSlice = WalletState & WalletActions;

export const createWalletSlice: StateCreator<WalletSlice> = (set, get) => ({
  // State
  wallets: [],
  activeWallet: null,
  isConnecting: false,
  connectionError: null,

  // Actions
  connectFreighter: async () => {
    set({ isConnecting: true, connectionError: null });
    try {
      const wallet = await freighterService.connect();
      
      // Check if wallet already exists
      const existingWallet = get().wallets.find(w => w.address === wallet.address);
      if (existingWallet) {
        set({ 
          activeWallet: { ...existingWallet, connected: true },
          isConnecting: false 
        });
        return existingWallet;
      }

      const newWallet: Wallet = {
        address: wallet.address,
        blockchain: 'stellar',
        balance: wallet.balance || '0',
        publicKey: wallet.publicKey,
        connected: true,
        type: 'freighter',
      };

      set((state) => ({
        wallets: [...state.wallets, newWallet],
        activeWallet: newWallet,
        isConnecting: false,
      }));

      return newWallet;
    } catch (error: any) {
      set({
        connectionError: error.message || 'Failed to connect Freighter',
        isConnecting: false,
      });
      throw error;
    }
  },

  connectUniSat: async () => {
    set({ isConnecting: true, connectionError: null });
    try {
      const wallet = await unisatService.connect();
      
      const existingWallet = get().wallets.find(w => w.address === wallet.address);
      if (existingWallet) {
        set({ 
          activeWallet: { ...existingWallet, connected: true },
          isConnecting: false 
        });
        return existingWallet;
      }

      const newWallet: Wallet = {
        address: wallet.address,
        blockchain: 'bitcoin',
        balance: wallet.balance || '0',
        publicKey: wallet.publicKey,
        connected: true,
        type: 'unisat',
      };

      set((state) => ({
        wallets: [...state.wallets, newWallet],
        activeWallet: newWallet,
        isConnecting: false,
      }));

      return newWallet;
    } catch (error: any) {
      set({
        connectionError: error.message || 'Failed to connect UniSat',
        isConnecting: false,
      });
      throw error;
    }
  },

  disconnectWallet: (address: string) => {
    set((state) => ({
      wallets: state.wallets.map(w => 
        w.address === address ? { ...w, connected: false } : w
      ),
      activeWallet: state.activeWallet?.address === address ? null : state.activeWallet,
    }));
  },

  setActiveWallet: (address: string) => {
    const wallet = get().wallets.find(w => w.address === address);
    if (wallet) {
      set({ activeWallet: wallet });
    }
  },

  updateWalletBalance: (address: string, balance: string | number) => {
    set((state) => ({
      wallets: state.wallets.map(w =>
        w.address === address ? { ...w, balance } : w
      ),
      activeWallet: state.activeWallet?.address === address 
        ? { ...state.activeWallet, balance }
        : state.activeWallet,
    }));
  },

  getWalletBalance: (address: string) => {
    const wallet = get().wallets.find(w => w.address === address);
    return wallet?.balance;
  },

  clearConnectionError: () => set({ connectionError: null }),
});