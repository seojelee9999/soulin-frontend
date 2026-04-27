import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

interface AuthContextValue {
  isLoggedIn: boolean;
  userName: string | null;
  userId: number | null;
  login: (data?: { userName?: string; userId?: number }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUserId(): number | null {
  const raw = localStorage.getItem('soul_in_user_id');
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem('soul_in_auth') === 'true',
  );
  const [userName, setUserName] = useState<string | null>(
    () => localStorage.getItem('soul_in_user_name'),
  );
  const [userId, setUserId] = useState<number | null>(loadUserId);

  const login = useCallback((data?: { userName?: string; userId?: number }) => {
    localStorage.setItem('soul_in_auth', 'true');
    if (data?.userName) {
      localStorage.setItem('soul_in_user_name', data.userName);
      setUserName(data.userName);
    }
    if (data?.userId != null) {
      localStorage.setItem('soul_in_user_id', String(data.userId));
      setUserId(data.userId);
    }
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('soul_in_auth');
    localStorage.removeItem('soul_in_token');
    localStorage.removeItem('soul_in_refresh_token');
    localStorage.removeItem('soul_in_user_name');
    localStorage.removeItem('soul_in_user_id');
    setIsLoggedIn(false);
    setUserName(null);
    setUserId(null);
  }, []);

  const value = useMemo(
    () => ({ isLoggedIn, userName, userId, login, logout }),
    [isLoggedIn, userName, userId, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
