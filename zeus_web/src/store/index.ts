import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createAuthSlice, AuthSlice } from './slices/authSlice';
import { createWalletSlice, WalletSlice } from './slices/walletSlice';
import { createZKSlice, ZKSlice } from './slices/zkSlice';
import { createSwapSlice, SwapSlice } from './slices/swapSlice';
import { createOrderBookSlice, OrderBookSlice } from './slices/orderbookSlice';
import { createNotificationSlice, NotificationSlice } from './slices/notificationSlice';
import { createUISlice, UISlice } from './slices/uiSlice';

export type StoreState = AuthSlice &
  WalletSlice &
  ZKSlice &
  SwapSlice &
  OrderBookSlice &
  NotificationSlice &
  UISlice;

export const useStore = create<StoreState>()(
  persist(
    (set, get, api) => ({
      ...createAuthSlice(set, get, api),
      ...createWalletSlice(set, get, api),
      ...createZKSlice(set, get, api),
      ...createSwapSlice(set, get, api),
      ...createOrderBookSlice(set, get, api),
      ...createNotificationSlice(set, get, api),
      ...createUISlice(set, get, api),
    }),
    {
      name: 'zeus-storage',
      partialize: (state) => ({
        auth: {
          token: state.token,
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        },
        wallet: {
          wallets: state.wallets,
          activeWallet: state.activeWallet,
        },
        ui: {
          theme: state.theme,
        },
      }),
      version: 1,
    }
  )
);

// Export hooks for better DX
export const useAuth = () => useStore((state) => ({
  token: state.token,
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
  error: state.error,
  login: state.login,
  walletLogin: state.walletLogin,
  logout: state.logout,
  verifyToken: state.verifyToken,
  setToken: state.setToken,
  clearError: state.clearError,
}));

export const useWallet = () => useStore((state) => ({
  wallets: state.wallets,
  activeWallet: state.activeWallet,
  isConnecting: state.isConnecting,
  connectionError: state.connectionError,
  connectFreighter: state.connectFreighter,
  connectUniSat: state.connectUniSat,
  disconnectWallet: state.disconnectWallet,
  setActiveWallet: state.setActiveWallet,
  updateWalletBalance: state.updateWalletBalance,
  getWalletBalance: state.getWalletBalance,
  clearConnectionError: state.clearConnectionError,
}));

export const useZK = () => useStore((state) => ({
  proofs: state.proofs,
  currentProof: state.currentProof,
  isGenerating: state.isGenerating,
  isVerifying: state.isVerifying,
  error: state.error,
  generateProof: state.generateProof,
  verifyProof: state.verifyProof,
  verifyStellarProof: state.verifyStellarProof,
  getProofHistory: state.getProofHistory,
  clearError: state.clearError,
  clearProofs: state.clearProofs,
}));

export const useSwap = () => useStore((state) => ({
  orders: state.orders,
  currentOrder: state.currentOrder,
  isLoading: state.isLoading,
  error: state.error,
  createSwap: state.createSwap,
  getSwap: state.getSwap,
  fundSwap: state.fundSwap,
  completeSwap: state.completeSwap,
  refundSwap: state.refundSwap,
  createStellarEscrow: state.createStellarEscrow,
  fundStellarSwap: state.fundStellarSwap,
  completeStellarSwap: state.completeStellarSwap,
  clearError: state.clearError,
}));

export const useOrderBook = () => useStore((state) => ({
  orders: state.orders,
  isLoading: state.isLoading,
  error: state.error,
  submitOrder: state.submitOrder,
  queryOrders: state.queryOrders,
  clearError: state.clearError,
}));

export const useNotification = () => useStore((state) => ({
  notifications: state.notifications,
  unreadCount: state.unreadCount,
  isLoading: state.isLoading,
  error: state.error,
  fetchInbox: state.fetchInbox,
  markAsRead: state.markAsRead,
  markAllAsRead: state.markAllAsRead,
  addNotification: state.addNotification,
  clearError: state.clearError,
}));

export const useUI = () => useStore((state) => ({
  theme: state.theme,
  sidebarOpen: state.sidebarOpen,
  modal: state.modal,
  loading: state.loading,
  toast: state.toast,
  toggleTheme: state.toggleTheme,
  setTheme: state.setTheme,
  toggleSidebar: state.toggleSidebar,
  openModal: state.openModal,
  closeModal: state.closeModal,
  setLoading: state.setLoading,
  showToast: state.showToast,
  hideToast: state.hideToast,
}));