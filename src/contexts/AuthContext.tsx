'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';
import { User } from '@/models/User';

// Session management interface following clean architecture
interface SessionState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends SessionState {
  login: (email: string, password: string) => Promise<void>;
  signup: (firstName: string, lastName: string, email: string, password: string, useCase: 'Personal' | 'Professional' | 'Business', goal: 'Sustainable growth' | 'Rapid growth', context: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [sessionState, setSessionState] = useState<SessionState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });
  
  const router = useRouter();

  // Initialize session on mount
  useEffect(() => {
    initializeSession();
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((user) => {
      setSessionState({
        user,
        isLoading: false,
        isAuthenticated: !!user,
      });
    });

    return unsubscribe;
  }, []);

  const initializeSession = async () => {
    try {
      const user = await authService.getCurrentUser();
      setSessionState({
        user,
        isLoading: false,
        isAuthenticated: !!user,
      });
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setSessionState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setSessionState(prev => ({ ...prev, isLoading: true }));
      
      const response = await authService.login({ email, password });
      
      // Navigation intent is handled by the service layer
      if (response.navigationIntent) {
        router.push(response.navigationIntent.redirectTo);
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      setSessionState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signup = async (firstName: string, lastName: string, email: string, password: string, useCase: 'Personal' | 'Professional' | 'Business', goal: 'Sustainable growth' | 'Rapid growth', context: string) => {
    try {
      setSessionState(prev => ({ ...prev, isLoading: true }));
      
      const response = await authService.signup({ firstName, lastName, email, password, useCase, goal, context });
      
      // Navigation intent is handled by the service layer
      if (response.navigationIntent) {
        router.push(response.navigationIntent.redirectTo);
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      setSessionState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setSessionState(prev => ({ ...prev, isLoading: true }));
      await authService.logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setSessionState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const refreshSession = async () => {
    try {
      setSessionState(prev => ({ ...prev, isLoading: true }));
      const user = await authService.getCurrentUser();
      setSessionState({
        user,
        isLoading: false,
        isAuthenticated: !!user,
      });
    } catch (error) {
      console.error('Session refresh failed:', error);
      setSessionState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const contextValue: AuthContextType = {
    ...sessionState,
    login,
    signup,
    logout,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}