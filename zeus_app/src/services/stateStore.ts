import { create } from 'zustand';
import React, { useMemo } from 'react';
import api, { setAuthToken } from './apiClient';
import { saveSecret, getSecret } from './secureStorage';
import { initSocket, subscribe, unsubscribe, closeSocket } from './socket';

// register the store getter in a lightweight module to avoid circular imports
import { setStoreGetter } from './storeRef';

type WalletSlice = {
  starknetAddress: string | null;
  bitcoinAddress: string | null;
  setStarknetAddress: (address: string | null) => void;
  setBitcoinAddress: (address: string | null) => void;
  fetchVaultStats: (address: string) => Promise<any>;
};

type SwapSlice = {
  fromToken: 'BTC' | 'STRK';
  toToken: 'BTC' | 'STRK';
  amount: string;
  isPrivate: boolean;
  setFromToken: (token: 'BTC' | 'STRK') => void;
  setToToken: (token: 'BTC' | 'STRK') => void;
  setAmount: (amount: string) => void;
  togglePrivacy: () => void;
  createSwap: (payload: any) => Promise<any>;
};

type AuthSlice = {
  token: string | null;
  login: (credentials: any) => Promise<any>;
  logout: () => void;
  restoreToken: () => Promise<void>;
  walletLogin?: (payload: { address: string; signature: any; publicKey?: string }) => Promise<any>;
};

type NotificationSlice = {
  inbox: any[];
  metrics: any[];
  fetchInbox: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  pushNotification: (n: any) => void;
};

type OrderbookSlice = {
  orders: any[];
  fetchOrders: () => Promise<void>;
  submitOrder: (order: any) => Promise<any>;
};

type AppSlice = {
  isBiometricsEnabled: boolean;
  theme: 'dark' | 'light';
  setBiometricsEnabled: (enabled: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  // walletconnect accounts
  wcAccounts: string[];
  setWcAccounts: (accs: string[]) => void;
  clearWcAccounts: () => void;
};

type StoreState = WalletSlice & SwapSlice & AuthSlice & NotificationSlice & OrderbookSlice & AppSlice;

export const useStore = create<StoreState>((set, get) => ({
  // Wallet
  starknetAddress: null,
  bitcoinAddress: null,
  setStarknetAddress: (address) => {
    const prev = get().starknetAddress;
    try { if (prev) unsubscribe(`vault:${prev}`); } catch (e) {}
    try { if (address) subscribe(`vault:${address}`); } catch (e) {}
    set({ starknetAddress: address });
  },
  setBitcoinAddress: (address) => {
    const prev = get().bitcoinAddress;
    try { if (prev) unsubscribe(`vault:${prev}`); } catch (e) {}
    try { if (address) subscribe(`vault:${address}`); } catch (e) {}
    set({ bitcoinAddress: address });
  },
  fetchVaultStats: async (address: string) => {
    try {
      const res = await api.get(`/bitcoin/vault/${address}/stats`);
      return res.data;
    } catch (e) {
      return null;
    }
  },

  // Swap
  fromToken: 'BTC',
  toToken: 'STRK',
  amount: '',
  isPrivate: true,
  setFromToken: (token) => set({ fromToken: token }),
  setToToken: (token) => set({ toToken: token }),
  setAmount: (amount) => set({ amount }),
  togglePrivacy: () => set((state: any) => ({ isPrivate: !state.isPrivate })),
  createSwap: async (payload: any) => {
    try {
      const res = await api.post('/swap', payload);
      return res.data;
    } catch (e) {
      throw e;
    }
  },

  // Auth
  token: null,
  login: async (credentials: any) => {
    try {
      const res = await api.post('/auth/login', credentials);
      const token = res?.data?.token || null;
      set({ token });
      if (token) {
        setAuthToken(token);
        await saveSecret('authToken', token);
      }
      // init socket after login and subscribe to core rooms
      try {
        await initSocket();
        try { subscribe('orderbook'); } catch (e) {}
        try { subscribe('swap'); } catch (e) {}
      } catch {}
      return res.data;
    } catch (e) {
      throw e;
    }
  },
  // Wallet-based login (nonce + signature)
  walletLogin: async (payload: { address: string; signature: any; publicKey?: string }) => {
    try {
      const res = await api.post('/auth/wallet-login', payload);
      const token = res?.data?.token || null;
      set({ token });
      if (token) {
        setAuthToken(token);
        await saveSecret('authToken', token);
        try {
          await initSocket();
          try { subscribe('orderbook'); } catch (e) {}
          try { subscribe('swap'); } catch (e) {}
        } catch (e) {}
      }
      return res.data;
    } catch (e) {
      throw e;
    }
  },
  logout: () => {
    set({ token: null });
    setAuthToken(null);
    saveSecret('authToken', '');
    try { closeSocket(); } catch (e) {}
  },
  restoreToken: async () => {
    const t = await getSecret('authToken');
    if (t) {
      set({ token: t });
      setAuthToken(t);
      try {
        await initSocket();
        try { subscribe('orderbook'); } catch (e) {}
        try { subscribe('swap'); } catch (e) {}
      } catch {}
    }
  },

  // Notifications
  inbox: [],
  metrics: [],
  fetchInbox: async () => {
    try {
      const res = await api.get('/notification/inbox');
      // ensure each notification has a read flag
      const inbox = (res.data || []).map((i: any) => ({ ...i, read: !!i.read }));
      set({ inbox });
    } catch (e) {
      // ignore
    }
  },
  markRead: async (id: string) => {
    try {
      await api.post(`/notification/${id}/read`);
      set((state: any) => ({ inbox: state.inbox.map((i: any) => i.id === id ? { ...i, read: true } : i) }));
    } catch (e) {}
  },
  pushNotification: (n: any) => set((state: any) => {
    const notif = { ...(n || {}), read: false };
    return { inbox: [notif, ...state.inbox] };
  }),

  // Orderbook
  orders: [],
  fetchOrders: async () => {
    try {
      const res = await api.get('/orderbook/query');
      set({ orders: res.data || [] });
    } catch (e) {}
  },
  submitOrder: async (order: any) => {
    const res = await api.post('/orderbook/submit', order);
    return res.data;
  },

  // App
  isBiometricsEnabled: false,
  theme: 'dark',
  setBiometricsEnabled: (enabled) => set({ isBiometricsEnabled: enabled }),
  setTheme: (theme) => set({ theme }),
  wcAccounts: [],
  setWcAccounts: (accs: string[]) => set({ wcAccounts: accs }),
  clearWcAccounts: () => set({ wcAccounts: [] }),
}));

// Backwards-compatible small hooks used in screens (keeps imports stable)
export const useWalletStore = () => {
  const starknetAddress = useStore((s) => s.starknetAddress);
  const bitcoinAddress = useStore((s) => s.bitcoinAddress);
  const setStarknetAddress = useStore((s) => s.setStarknetAddress);
  const setBitcoinAddress = useStore((s) => s.setBitcoinAddress);
  return useMemo(() => ({ starknetAddress, bitcoinAddress, setStarknetAddress, setBitcoinAddress }), [starknetAddress, bitcoinAddress, setStarknetAddress, setBitcoinAddress]);
};

export const useSwapStore = () => {
  const fromToken = useStore((s) => s.fromToken);
  const toToken = useStore((s) => s.toToken);
  const amount = useStore((s) => s.amount);
  const isPrivate = useStore((s) => s.isPrivate);
  const setFromToken = useStore((s) => s.setFromToken);
  const setToToken = useStore((s) => s.setToToken);
  const setAmount = useStore((s) => s.setAmount);
  const togglePrivacy = useStore((s) => s.togglePrivacy);
  const createSwap = useStore((s) => s.createSwap);
  return useMemo(() => ({ fromToken, toToken, amount, isPrivate, setFromToken, setToToken, setAmount, togglePrivacy, createSwap }), [fromToken, toToken, amount, isPrivate, setFromToken, setToToken, setAmount, togglePrivacy, createSwap]);
};

export const useAppStore = () => {
  const isBiometricsEnabled = useStore((s) => s.isBiometricsEnabled);
  const theme = useStore((s) => s.theme);
  const setBiometricsEnabled = useStore((s) => s.setBiometricsEnabled);
  const setTheme = useStore((s) => s.setTheme);
  return useMemo(() => ({ isBiometricsEnabled, theme, setBiometricsEnabled, setTheme }), [isBiometricsEnabled, theme, setBiometricsEnabled, setTheme]);
};

export const useAuthStore = () => {
  const token = useStore((s) => s.token);
  const login = useStore((s) => s.login);
  const logout = useStore((s) => s.logout);
  const restoreToken = useStore((s) => s.restoreToken);
  const walletLogin = useStore((s) => s.walletLogin);
  return useMemo(() => ({ token, login, logout, restoreToken, walletLogin }), [token, login, logout, restoreToken, walletLogin]);
};

export const useNotificationStore = () => {
  const inbox = useStore((s) => s.inbox);
  const fetchInbox = useStore((s) => s.fetchInbox);
  const pushNotification = useStore((s) => s.pushNotification);
  const markRead = useStore((s) => s.markRead);
  return useMemo(() => ({ inbox, fetchInbox, pushNotification, markRead }), [inbox, fetchInbox, pushNotification, markRead]);
};

export const useOrderbookStore = () => {
  const orders = useStore((s) => s.orders);
  const fetchOrders = useStore((s) => s.fetchOrders);
  const submitOrder = useStore((s) => s.submitOrder);
  return useMemo(() => ({ orders, fetchOrders, submitOrder }), [orders, fetchOrders, submitOrder]);
};
try { setStoreGetter(useStore.getState); } catch (e) {}
