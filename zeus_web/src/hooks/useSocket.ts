'use client';

import { useEffect, useRef, useState } from 'react';
import { socketService, useSocket } from '../services/realtime/socket.service';
import { useAuth } from '../store';

interface UseSocketOptions {
  rooms?: string[];
  onNotification?: (data: any) => void;
  onSwapUpdate?: (data: any) => void;
  onProofUpdate?: (data: any) => void;
  autoConnect?: boolean;
}

export function useSocketConnection(options: UseSocketOptions = {}) {
  const { isAuthenticated, token } = useAuth();
  const { 
    rooms = [], 
    onNotification, 
    onSwapUpdate, 
    onProofUpdate,
    autoConnect = true 
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const joinedRooms = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!autoConnect || !isAuthenticated) return;

    const socket = socketService.connect();
    if (!socket) return;

    const handleConnect = () => {
      setIsConnected(true);
      // Join rooms
      rooms.forEach(room => {
        if (!joinedRooms.current.has(room)) {
          socketService.joinRoom(room);
          joinedRooms.current.add(room);
        }
      });
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Event handlers
    if (onNotification) {
      socket.on('notification', onNotification);
    }
    if (onSwapUpdate) {
      socket.on('swap:updated', onSwapUpdate);
    }
    if (onProofUpdate) {
      socket.on('proof:verified', onProofUpdate);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      
      if (onNotification) socket.off('notification', onNotification);
      if (onSwapUpdate) socket.off('swap:updated', onSwapUpdate);
      if (onProofUpdate) socket.off('proof:verified', onProofUpdate);
      
      // Leave rooms
      rooms.forEach(room => {
        if (joinedRooms.current.has(room)) {
          socketService.leaveRoom(room);
          joinedRooms.current.delete(room);
        }
      });
    };
  }, [isAuthenticated, autoConnect]);

  return {
    isConnected,
    joinRoom: (room: string) => {
      if (!joinedRooms.current.has(room)) {
        socketService.joinRoom(room);
        joinedRooms.current.add(room);
      }
    },
    leaveRoom: (room: string) => {
      if (joinedRooms.current.has(room)) {
        socketService.leaveRoom(room);
        joinedRooms.current.delete(room);
      }
    },
    emit: socketService.emit.bind(socketService),
    on: socketService.on.bind(socketService),
    off: socketService.off.bind(socketService),
  };
}