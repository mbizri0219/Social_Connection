import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { SOCIAL_PLATFORMS, SocialPlatform } from '../screens/ConnectChannelScreen';
import { isTokenExpired } from '../utils/tokenRefresh';

interface ConnectionData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  profile: {
    id: string;
    name: string;
    picture?: string;
  };
}

interface ConnectionContextType {
  connections: { [key: string]: ConnectionData };
  expiredCount: number;
  totalCount: number;
  loadConnections: () => Promise<void>;
  updateConnection: (platformId: string, data: ConnectionData) => Promise<void>;
  removeConnection: (platformId: string) => Promise<void>;
}

const ConnectionContext = createContext<ConnectionContextType | null>(null);

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connections, setConnections] = useState<{ [key: string]: ConnectionData }>({});
  const [expiredCount, setExpiredCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const loadConnections = async () => {
    const loadedConnections: { [key: string]: ConnectionData } = {};

    try {
      await Promise.all(
        SOCIAL_PLATFORMS.map(async (platform: SocialPlatform) => {
          const data = await SecureStore.getItemAsync(`connection_${platform.id}`);
          if (data) {
            loadedConnections[platform.id] = JSON.parse(data);
          }
        })
      );

      setConnections(loadedConnections);
      updateCounts(loadedConnections);
    } catch (error) {
      console.error('Failed to load connections:', error);
    }
  };

  const updateCounts = (conns: typeof connections) => {
    const expired = Object.values(conns).filter(conn => isTokenExpired(conn.expiresAt)).length;
    setExpiredCount(expired);
    setTotalCount(Object.keys(conns).length);
  };

  const updateConnection = async (platformId: string, data: ConnectionData) => {
    try {
      await SecureStore.setItemAsync(
        `connection_${platformId}`,
        JSON.stringify(data)
      );

      setConnections(prev => {
        const next = { ...prev, [platformId]: data };
        updateCounts(next);
        return next;
      });
    } catch (error) {
      console.error('Failed to update connection:', error);
    }
  };

  const removeConnection = async (platformId: string) => {
    try {
      await SecureStore.deleteItemAsync(`connection_${platformId}`);
      
      setConnections(prev => {
        const next = { ...prev };
        delete next[platformId];
        updateCounts(next);
        return next;
      });
    } catch (error) {
      console.error('Failed to remove connection:', error);
    }
  };

  useEffect(() => {
    loadConnections();

    // Set up periodic check for expired tokens
    const interval = setInterval(() => {
      updateCounts(connections);
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <ConnectionContext.Provider
      value={{
        connections,
        expiredCount,
        totalCount,
        loadConnections,
        updateConnection,
        removeConnection,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnections = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnections must be used within a ConnectionProvider');
  }
  return context;
}; 