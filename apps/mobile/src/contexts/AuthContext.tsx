import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  accessToken: null,
  signIn: async () => {},
  signOut: async () => {},
  register: async () => {},
  forgotPassword: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // For development, let's set a mock token
  useEffect(() => {
    setAccessToken('mock_token');
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Mock successful login
      setAccessToken('mock_token');
      setUser({ id: '1', email, name: 'Test User' });
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    setUser(null);
    setAccessToken(null);
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      // Mock successful registration
      setAccessToken('mock_token');
      setUser({ id: '1', email, name });
    } catch (error) {
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    // Mock password reset
    console.log('Password reset email sent to:', email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        accessToken,
        signIn,
        signOut,
        register,
        forgotPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 