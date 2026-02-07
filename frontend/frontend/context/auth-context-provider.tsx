'use client';

import type React from 'react';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getUserService } from '@/lib/services';

type AuthContextValue = {
  isAuthenticated: boolean;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const storageKey = 'root:auth';

const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const didHydrate = useRef(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      // Simplified approach: Verify auth via API call
      // This works with httpOnly cookies (sent automatically via withCredentials)
      // No need to read cookies directly - the API will use httpOnly cookies
      try {
        await getUserService();
        if (isMounted) {
          setIsAuthenticated(true);
          setLoading(false);
        }
        return true;
      } catch (error: any) {
        // If API call fails, check localStorage as fallback (for guest users)
        const localToken = localStorage.getItem('auth_token');
        if (localToken) {
          // Try one more time with localStorage token
          try {
            await getUserService();
            if (isMounted) {
              setIsAuthenticated(true);
              setLoading(false);
            }
            return true;
          } catch {
            // Both failed, user not authenticated
            if (isMounted) {
              setIsAuthenticated(false);
              setLoading(false);
            }
            return false;
          }
        }
        
        // No token, user not authenticated
        if (isMounted) {
          setIsAuthenticated(false);
          setLoading(false);
        }
        return false;
      }
    };

    // Single API call to verify auth
    // httpOnly cookies are sent automatically with the request
    checkAuth();

    // Cleanup on unmount
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!didHydrate.current) {
      didHydrate.current = true;
      return;
    }

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        isAuthenticated,
      })
    );
  }, [isAuthenticated]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      setIsAuthenticated,
      loading,
    }),
    [isAuthenticated, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return ctx;
};

export default AuthContextProvider;
