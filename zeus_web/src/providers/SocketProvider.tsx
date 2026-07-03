'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from '../store';
import { socketService } from '../services/realtime/socket.service';

interface SocketContextType {
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ isConnected: false });

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
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
    } else {
      socketService.disconnect();
      setIsConnected(false);
    }
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocketContext = () => useContext(SocketContext);

// Add missing import
import { useState } from 'react';