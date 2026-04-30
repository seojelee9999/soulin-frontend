import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { fetchMe } from '../api/users';

interface AuthContextValue {
  isLoggedIn: boolean;
  userName: string | null;
  userId: number | null;
  login: (data?: { userName?: string; userId?: number }) => void;
  logout: () => void;
  updateUserName: (name: string) => void;
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

  const updateUserName = useCallback((name: string) => {
    localStorage.setItem('soul_in_user_name', name);
    setUserName(name);
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

  // 마운트 시 토큰 유효성 1회 검증.
  // 401/403만 logout (토큰 무효). 5xx·네트워크 에러는 일시 장애로 보고 유지.
  useEffect(() => {
    const token = localStorage.getItem('soul_in_token');
    if (!token) return;
    fetchMe().catch((err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        logout();
      }
    });
  }, [logout]);

  const value = useMemo(
    () => ({ isLoggedIn, userName, userId, login, logout, updateUserName }),
    [isLoggedIn, userName, userId, login, logout, updateUserName],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
