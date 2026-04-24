import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

interface AuthContextValue {
  isLoggedIn: boolean;
  userName: string | null;
  login: (data?: { userName?: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem('soul_in_auth') === 'true',
  );
  const [userName, setUserName] = useState<string | null>(
    () => localStorage.getItem('soul_in_user_name'),
  );

  const login = useCallback((data?: { userName?: string }) => {
    localStorage.setItem('soul_in_auth', 'true');
    if (data?.userName) {
      localStorage.setItem('soul_in_user_name', data.userName);
      setUserName(data.userName);
    }
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('soul_in_auth');
    localStorage.removeItem('soul_in_token');
    localStorage.removeItem('soul_in_refresh_token');
    localStorage.removeItem('soul_in_user_name');
    setIsLoggedIn(false);
    setUserName(null);
  }, []);

  const value = useMemo(
    () => ({ isLoggedIn, userName, login, logout }),
    [isLoggedIn, userName, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
