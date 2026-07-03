import { StateCreator } from 'zustand';
import { Wallet } from '../types';
import { freighterService } from '../../services/wallet/freighter';
import { unisatService } from '../../services/wallet/unisat';

export interface WalletState {
  wallets: Wallet[];
  activeWallet: Wallet | null;
  isConnecting: boolean;
  connectionError: string | null;
  freighterInstalled: boolean | null;
  unisatInstalled: boolean | null;
}

export interface WalletActions {
  checkFreighterInstalled: () => Promise<boolean>;
  checkUnisatInstalled: () => boolean;
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
  wallets: [],
  activeWallet: null,
  isConnecting: false,
  connectionError: null,
  freighterInstalled: null,
  unisatInstalled: null,

  checkFreighterInstalled: async () => {
    try {
      const installed = await freighterService.isInstalled();
      set({ freighterInstalled: installed });
      return installed;
    } catch {
      set({ freighterInstalled: false });
      return false;
    }
  },

  checkUnisatInstalled: () => {
    const installed = typeof window !== 'undefined' && !!window.unisat;
    set({ unisatInstalled: installed });
    return installed;
  },

  connectFreighter: async () => {
    set({ isConnecting: true, connectionError: null });
    try {
      // Check if installed
      const installed = await freighterService.isInstalled();
      if (!installed) {
        set({ freighterInstalled: false });
        throw new Error('Freighter wallet is not installed');
      }
      set({ freighterInstalled: true });

      // Connect using the official API
      const walletInfo = await freighterService.connect();
      
      const existingWallet = get().wallets.find(w => w.address === walletInfo.address);
      if (existingWallet) {
        set({ 
          activeWallet: { ...existingWallet, connected: true },
          isConnecting: false 
        });
        return existingWallet;
      }

      const newWallet: Wallet = {
        address: walletInfo.address,
        blockchain: 'stellar',
        balance: walletInfo.balance || '0',
        publicKey: walletInfo.publicKey,
        connected: true,
        type: 'freighter',
      };

      set((state) => ({
        wallets: [...state.wallets, newWallet],
        activeWallet: newWallet,
        isConnecting: false,
        freighterInstalled: true,
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
