'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { hasFaceData as checkLocalFaceData, hasFaceDataOnServer } from '@/lib/faceStorage';
import { preloadModelsInBackground, getModelsStatus } from '@/lib/faceRecognition';

export interface User {
  id: string;
  name: string;
  userType: 'student' | 'lecturer';
  identifier: string;
  email?: string;
  program_study?: string;
  photo?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  hasFaceRegistered: boolean;
  modelsReady: boolean;
  login: (userData: User) => void;
  logout: () => void;
  refreshFaceStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFaceRegistered, setHasFaceRegistered] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);

  // Check face registration status
  const refreshFaceStatus = useCallback(async () => {
    if (!user || user.userType !== 'student') {
      setHasFaceRegistered(false);
      return;
    }

    // Check local first (faster)
    const hasLocal = checkLocalFaceData(user.id);
    if (hasLocal) {
      setHasFaceRegistered(true);
      return;
    }

    // Then check server
    try {
      const hasServer = await hasFaceDataOnServer(user.id);
      setHasFaceRegistered(hasServer);
    } catch {
      setHasFaceRegistered(false);
    }
  }, [user]);

  // Initialize user from localStorage
  useEffect(() => {
    const initUser = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        }
      } catch {
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    initUser();
  }, []);

  // Update face status when user changes
  useEffect(() => {
    if (user) {
      refreshFaceStatus();
    }
  }, [user, refreshFaceStatus]);

  // Pre-load face recognition models for students
  useEffect(() => {
    if (user && user.userType === 'student') {
      console.log('[Auth] Pre-loading face recognition models for student...');
      preloadModelsInBackground();
      
      // Poll for model status
      const checkModels = () => {
        const status = getModelsStatus();
        setModelsReady(status.loaded);
        if (!status.loaded && status.loading) {
          setTimeout(checkModels, 500);
        }
      };
      checkModels();
    }
  }, [user]);

  const login = useCallback((userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  // Logout - only clears state, does NOT redirect (caller handles redirect)
  const logout = useCallback(() => {
    localStorage.removeItem('user');
    setUser(null);
    setHasFaceRegistered(false);
    // Don't redirect here - let the component that calls logout handle the redirect
    // This prevents race conditions between state updates and navigation
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      hasFaceRegistered,
      modelsReady,
      login,
      logout,
      refreshFaceStatus,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Custom hook for protected pages
export function useRequireAuth(requiredUserType?: 'student' | 'lecturer') {
  const { user, isLoading } = useAuth();

  return { 
    user, 
    isLoading, 
    isAuthenticated: !!user,
    hasCorrectType: !requiredUserType || user?.userType === requiredUserType
  };
}
