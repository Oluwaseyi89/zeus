import { StateCreator } from 'zustand';

export interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  modal: {
    isOpen: boolean;
    type: string | null;
    data: any;
  };
  loading: {
    global: boolean;
    [key: string]: boolean;
  };
  toast: {
    message: string | null;
    type: 'success' | 'error' | 'info' | 'warning' | null;
    duration: number;
  };
}

export interface UIActions {
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  openModal: (type: string, data?: any) => void;
  closeModal: () => void;
  setLoading: (key: string, loading: boolean) => void;
  showToast: (message: string, type?: UIState['toast']['type'], duration?: number) => void;
  hideToast: () => void;
}

export type UISlice = UIState & UIActions;

export const createUISlice: StateCreator<UISlice> = (set, get) => ({
  // State
  theme: 'system',
  sidebarOpen: false,
  modal: {
    isOpen: false,
    type: null,
    data: null,
  },
  loading: {
    global: false,
  },
  toast: {
    message: null,
    type: null,
    duration: 3000,
  },

  // Actions
  toggleTheme: () => {
    const current = get().theme;
    const newTheme = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
    set({ theme: newTheme });
    // Apply theme to document
    document.documentElement.className = newTheme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : newTheme;
  },

  setTheme: (theme: 'light' | 'dark' | 'system') => {
    set({ theme });
    document.documentElement.className = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  openModal: (type: string, data?: any) => set({
    modal: { isOpen: true, type, data: data || null },
  }),

  closeModal: () => set({
    modal: { isOpen: false, type: null, data: null },
  }),

  setLoading: (key: string, loading: boolean) => {
    if (key === 'global') {
      set({ loading: { ...get().loading, global: loading } });
    } else {
      set({ loading: { ...get().loading, [key]: loading } });
    }
  },

  showToast: (message: string, type: UIState['toast']['type'] = 'info', duration = 3000) => {
    set({ toast: { message, type, duration } });
    // Auto-hide after duration
    if (duration > 0) {
      setTimeout(() => {
        get().hideToast();
      }, duration);
    }
  },

  hideToast: () => {
    set({
      toast: { message: null, type: null, duration: 3000 },
    });
  },
});