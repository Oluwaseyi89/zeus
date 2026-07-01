import { StateCreator } from 'zustand';
import { Notification } from '../types';
import { apiClient } from '../../services/api/client';

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

export interface NotificationActions {
  fetchInbox: (limit?: number) => Promise<Notification[]>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  clearError: () => void;
}

export type NotificationSlice = NotificationState & NotificationActions;

export const createNotificationSlice: StateCreator<NotificationSlice> = (set, get) => ({
  // State
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  // Actions
  fetchInbox: async (limit = 50) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/notification/inbox', { params: { limit } });
      const notifications = response.data;
      const unreadCount = notifications.filter((n: Notification) => !n.read).length;
      
      set({
        notifications,
        unreadCount,
        isLoading: false,
      });
      
      return notifications;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch notifications',
        isLoading: false,
      });
      throw error;
    }
  },

  markAsRead: async (id: string) => {
    try {
      await apiClient.post(`/notification/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to mark notification as read',
      });
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      // Mark all as read by calling markAsRead for each unread
      const unreadIds = get().notifications.filter(n => !n.read).map(n => n.id);
      await Promise.all(unreadIds.map(id => get().markAsRead(id)));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to mark all as read',
      });
      throw error;
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  clearError: () => set({ error: null }),
});