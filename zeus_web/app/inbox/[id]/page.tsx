'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useNotification, useUI } from '../../../src/store';

export default function InboxDetailPage() {
  const params = useParams();
  const router = useRouter();
  const notificationId = params.id as string;
  const { showToast } = useUI();
  const { notifications, markAsRead } = useNotification();
  const [notification, setNotification] = useState<any>(null);

  useEffect(() => {
    const found = notifications.find(n => n.id === notificationId);
    if (found) {
      setNotification(found);
      if (!found.read) {
        markAsRead(found.id);
      }
    }
  }, [notificationId, notifications]);

  if (!notification) {
    return (
      <div className="min-h-screen bg-background px-5 pt-6 pb-8 max-w-md mx-auto">
        <button onClick={() => router.back()} className="text-cyan hover:text-cyan/80 transition-colors mb-4">
          ← Back
        </button>
        <div className="text-center py-12">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-white font-semibold">Notification not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-5 pt-6 pb-8 max-w-md mx-auto">
      <button onClick={() => router.back()} className="text-cyan hover:text-cyan/80 transition-colors mb-4">
        ← Back
      </button>

      <div className="bg-surface rounded-2xl p-6 border border-border">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{notification.icon || '📨'}</span>
          <h1 className="text-xl font-bold text-white">{notification.title}</h1>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs px-2 py-1 rounded-full ${
            notification.read ? 'bg-surface/50 text-text-secondary' : 'bg-cyan/20 text-cyan'
          }`}>
            {notification.read ? 'Read' : 'Unread'}
          </span>
          <span className="text-text-secondary text-xs">
            {new Date(notification.timestamp).toLocaleString()}
          </span>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
            {notification.message}
          </p>
        </div>

        {notification.actionUrl && (
          <button
            onClick={() => router.push(notification.actionUrl)}
            className="w-full mt-6 py-3 bg-cyan text-background font-bold rounded-lg transition-all hover:bg-cyan/80"
          >
            View Details →
          </button>
        )}
      </div>
    </div>
  );
}