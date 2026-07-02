'use client';

import { useState, useEffect } from 'react';
import { useNotification } from '../../store';
import { tokenStorage } from '../security/storage.service';

const io = require('socket.io-client');
type Socket = any;

interface NotificationData {
  id?: string;
  title?: string;
  message?: string;
  type?: string;
  createdAt?: string;
  actionUrl?: string;
  icon?: string;
  color?: string;
  channel?: string;
  payload?: any;
}

interface SwapUpdateData {
  swapId: string;
  status: string;
  [key: string]: any;
}

interface ProofData {
  proofId: string;
  status: string;
  [key: string]: any;
}

interface RoomData {
  room: string;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  connect(): Socket | null {
    if (this.socket?.connected) return this.socket;
    if (this.isConnecting) return null;

    const token = tokenStorage.getToken();
    if (!token) {
      console.warn('No token found, skipping socket connection');
      return null;
    }

    this.isConnecting = true;
    const socketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3000';

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupListeners();
    this.isConnecting = false;
    return this.socket;
  }

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log(`🔌 Socket disconnected: ${reason}`);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ Socket connection error:', error);
      this.reconnectAttempts++;
    });

    // Notification events
    this.socket.on('notification', (data: NotificationData) => {
      const state = useNotification();
      
      const notification = {
        id: data.id || `notif_${Date.now()}`,
        title: data.title || data.payload?.title || 'Notification',
        message: data.message || data.payload?.message || data.payload?.body || '',
        type: data.type || data.payload?.type || 'system',
        read: false,
        createdAt: new Date(data.createdAt || Date.now()),
        to: data.payload?.to || data.channel || 'user',
        channel: data.channel || data.payload?.channel || 'system',
        payload: data.payload || data,
        actionUrl: data.actionUrl || data.payload?.actionUrl,
        icon: data.icon || data.payload?.icon || '📨',
        color: data.color || data.payload?.color || 'text-cyan',
      };
      
      state.addNotification(notification);
    });

    // Swap events
    this.socket.on('swap:updated', (data: SwapUpdateData) => {
      console.log('🔄 Swap updated:', data);
    });

    this.socket.on('swap:completed', (data: SwapUpdateData) => {
      console.log('✅ Swap completed:', data);
    });

    // Proof events
    this.socket.on('proof:verified', (data: ProofData) => {
      console.log('🔐 Proof verified:', data);
    });

    // Room subscription acknowledgment
    this.socket.on('room:joined', (data: RoomData) => {
      console.log(`📡 Joined room: ${data.room}`);
    });

    this.socket.on('room:left', (data: RoomData) => {
      console.log(`📡 Left room: ${data.room}`);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Room management
  joinRoom(room: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('join', { room });
  }

  leaveRoom(room: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('leave', { room });
  }

  // Event subscription
  on(event: string, callback: (data: any) => void): void {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  off(event: string, callback?: (data: any) => void): void {
    if (!this.socket) return;
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  // Emit events
  emit(event: string, data: any): void {
    if (!this.socket?.connected) return;
    this.socket.emit(event, data);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Singleton instance
export const socketService = new SocketService();

// React hook for socket
export function useSocket() {
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    const socket = socketService.connect();
    
    if (socket) {
      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);
      
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      
      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
      };
    }
  }, []);

  return {
    isConnected,
    joinRoom: socketService.joinRoom.bind(socketService),
    leaveRoom: socketService.leaveRoom.bind(socketService),
    on: socketService.on.bind(socketService),
    off: socketService.off.bind(socketService),
    emit: socketService.emit.bind(socketService),
  };
}
