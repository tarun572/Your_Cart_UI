import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../types';

interface AuthCtx {
  user: User | null;
  login: (u: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthCtx | null>(null);

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on app load
  useEffect(() => {
    try {
      const authToken = localStorage.getItem('auth_token');
      const userEmail = localStorage.getItem('user_email');
      const userRole = localStorage.getItem('user_role');
      const userKey = localStorage.getItem('user_key');

      console.log('🔍 Checking session:', { authToken: !!authToken, userEmail, userRole });

      // If we have a valid token and user data, restore the session
      if (authToken && userEmail && userRole) {
        const restoredUser: User = {
          email: userEmail,
          name: userEmail, // Use email as name if not stored
          role: userRole as 'seller' | 'buyer',
          apiKey: userKey || undefined,
        };
        console.log('✅ Session restored:', restoredUser);
        setUser(restoredUser);
      } else {
        console.log('❌ No valid session found');
      }
    } catch (error) {
      console.error('❌ Error restoring session:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // If still loading, show nothing (or a loading screen)
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontSize: '18px',
          color: '#64748b',
        }}
      >
        🔄 Restoring session...
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login: (u) => setUser(u),
        logout: () => {
          setUser(null);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_email');
          localStorage.removeItem('user_role');
          localStorage.removeItem('user_key');
          console.log('✅ Session cleared');
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
