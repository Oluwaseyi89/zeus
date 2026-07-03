'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useNotification } from '../../src/store';
import { useUI } from '../../src/store';

// Define NotificationItem with all required fields
interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'swap' | 'proof' | 'wallet' | 'system' | 'alert';
  read: boolean;
  timestamp: Date;
  actionUrl?: string;
  icon: string;
  color: string;
}

export default function InboxPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { notifications, unreadCount, fetchInbox, markAsRead, markAllAsRead, isLoading } = useNotification();
  const { showToast } = useUI();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (isAuthenticated) {
      fetchInbox(50);
    }
  }, [isAuthenticated]);

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    showToast('All notifications marked as read', 'success');
  };

  // Helper function to convert store Notification to NotificationItem
  const convertToNotificationItem = (notif: any): NotificationItem => {
    return {
      id: notif.id,
      title: notif.title || notif.payload?.title || 'Notification',
      message: notif.message || notif.payload?.message || notif.payload?.body || '',
      type: notif.type || notif.payload?.type || 'system',
      read: notif.read || false,
      timestamp: notif.createdAt ? new Date(notif.createdAt) : new Date(),
      actionUrl: notif.actionUrl || notif.payload?.actionUrl,
      icon: notif.icon || notif.payload?.icon || '📨',
      color: notif.color || notif.payload?.color || 'text-text-secondary',
    };
  };

  // Mock data when store is empty
  const mockNotifications: NotificationItem[] = [
    {
      id: '1',
      title: 'Swap Completed',
      message: 'Your BTC → XLM swap of 0.05 BTC has been completed successfully.',
      type: 'swap',
      read: false,
      timestamp: new Date(Date.now() - 300000),
      actionUrl: '/swap/123',
      icon: '🔄',
      color: 'text-cyan',
    },
    {
      id: '2',
      title: 'ZK Proof Verified',
      message: 'Zero-knowledge proof for privacy pool deposit has been verified on Stellar.',
      type: 'proof',
      read: false,
      timestamp: new Date(Date.now() - 1800000),
      actionUrl: '/zk/demo',
      icon: '🔐',
      color: 'text-gold',
    },
    {
      id: '3',
      title: 'Wallet Connected',
      message: 'Freighter wallet successfully connected to Zeus.',
      type: 'wallet',
      read: true,
      timestamp: new Date(Date.now() - 7200000),
      icon: '👛',
      color: 'text-cyan',
    },
    {
      id: '4',
      title: 'HTLC Expiring Soon',
      message: 'Your atomic swap #456 has 2 hours remaining before expiration.',
      type: 'alert',
      read: true,
      timestamp: new Date(Date.now() - 14400000),
      actionUrl: '/swap/456',
      icon: '⏳',
      color: 'text-yellow-400',
    },
    {
      id: '5',
      title: 'System Update',
      message: 'Zeus protocol v2.0.1 deployed. Improved ZK verification speed by 30%.',
      type: 'system',
      read: true,
      timestamp: new Date(Date.now() - 86400000),
      icon: '⚡',
      color: 'text-text-secondary',
    },
  ];

  // Get notifications - convert store notifications or use mock
  const getDisplayNotifications = (): NotificationItem[] => {
    if (notifications && notifications.length > 0) {
      return notifications.map(convertToNotificationItem);
    }
    return mockNotifications;
  };

  const displayNotifications = getDisplayNotifications();
  const filteredNotifications = filter === 'all' 
    ? displayNotifications 
    : displayNotifications.filter(n => !n.read);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background px-5 pt-6 pb-8 max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gold mb-2 tracking-wider font-serif">Inbox</h1>
        <div className="mt-8 p-6 bg-surface rounded-2xl border border-border text-center">
          <p className="text-4xl mb-4">📨</p>
          <p className="text-white font-semibold">Connect your wallet</p>
          <p className="text-text-secondary text-sm mt-2">
            Sign in to view your notifications
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-5 pt-6 pb-8 max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gold tracking-wider font-serif">Inbox</h1>
          <p className="text-text-secondary text-sm">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up ✅'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-cyan hover:text-cyan/80 transition-colors text-sm"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 bg-surface rounded-lg p-1 border border-border">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'all'
              ? 'bg-cyan text-background'
              : 'text-text-secondary hover:text-white'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'unread'
              ? 'bg-cyan text-background'
              : 'text-text-secondary hover:text-white'
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary text-sm">Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-white font-semibold">No notifications</p>
          <p className="text-text-secondary text-sm mt-2">
            {filter === 'unread' ? 'You have no unread notifications' : 'Your inbox is empty'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`bg-surface rounded-xl p-4 border transition-all cursor-pointer ${
                !notification.read
                  ? 'border-cyan/30 hover:border-cyan'
                  : 'border-border hover:border-cyan/20'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  !notification.read ? 'bg-cyan/10' : 'bg-surface/50'
                }`}>
                  {notification.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-semibold text-sm ${
                      !notification.read ? 'text-white' : 'text-text-secondary'
                    }`}>
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-cyan rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-text-secondary text-sm mt-0.5 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-text-secondary text-[10px] mt-2">
                    {notification.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="bg-surface rounded-lg p-3 border border-border text-center">
          <p className="text-text-secondary text-[10px] uppercase tracking-wider">Total</p>
          <p className="text-white font-bold">{displayNotifications.length}</p>
        </div>
        <div className="bg-surface rounded-lg p-3 border border-border text-center">
          <p className="text-text-secondary text-[10px] uppercase tracking-wider">Unread</p>
          <p className="text-cyan font-bold">{unreadCount}</p>
        </div>
        <div className="bg-surface rounded-lg p-3 border border-border text-center">
          <p className="text-text-secondary text-[10px] uppercase tracking-wider">Read</p>
          <p className="text-gold font-bold">{displayNotifications.length - unreadCount}</p>
        </div>
      </div>
    </div>
  );
}
