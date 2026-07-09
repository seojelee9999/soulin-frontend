import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../api/notifications';
import type { NotificationItem } from '../types';
import { useAuth } from './AuthContext';

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  refetch: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

// 90초 간격 폴링 + visibilitychange로 백그라운드 진입 시 중지, 복귀 시 즉시 조회
const POLL_INTERVAL_MS = 90_000;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refetch = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([fetchNotifications(), fetchUnreadCount()]);
      setNotifications(list);
      setUnreadCount(count);
    } catch {
      // 401/403 등 인증 오류는 axios interceptor가 처리
    }
  }, []);

  // 로그인 시 초기 로드 / 로그아웃 시 초기화
  useEffect(() => {
    if (isLoggedIn) {
      refetch();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isLoggedIn, refetch]);

  // 폴링 + visibilitychange
  useEffect(() => {
    if (!isLoggedIn) return;

    let interval: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (interval) return;
      interval = setInterval(refetch, POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        refetch(); // 복귀 시 즉시 조회
        start();
      } else {
        stop();
      }
    };

    // 초기: 활성 상태면 폴링 시작 (visibilitychange가 발화되기 전 커버)
    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVis);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [isLoggedIn, refetch]);

  const markRead = useCallback(
    async (id: number) => {
      const previous = notifications;
      const wasUnread = notifications.some((n) => n.notificationId === id && !n.read);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, read: true } : n)),
      );
      if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await markNotificationRead(id);
      } catch {
        setNotifications(previous);
        if (wasUnread) setUnreadCount((c) => c + 1);
      }
    },
    [notifications],
  );

  const markAllRead = useCallback(async () => {
    const previous = notifications;
    const prevCount = unreadCount;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      setNotifications(previous);
      setUnreadCount(prevCount);
    }
  }, [notifications, unreadCount]);

  const value = useMemo(
    () => ({ notifications, unreadCount, refetch, markRead, markAllRead }),
    [notifications, unreadCount, refetch, markRead, markAllRead],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
