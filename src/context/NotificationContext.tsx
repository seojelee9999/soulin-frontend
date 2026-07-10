import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { Client } from '@stomp/stompjs';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../api/notifications';
import type { NotificationItem } from '../types';
import { getWsUrl } from '../utils/ws';
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
  const clientRef = useRef<Client | null>(null);

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

  // 웹소켓(STOMP) 연결 — 폴링과 병행(폴링이 백업). 연결 실패해도 앱 크래시 없음.
  useEffect(() => {
    if (!isLoggedIn) return;
    const token = localStorage.getItem('soul_in_token');
    if (!token) return;

    const client = new Client({
      brokerURL: getWsUrl(),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000, // 5초 후 자동 재연결
      onConnect: () => {
        // 재연결 포함 — 놓친 알림 REST로 회수
        void refetch();
        client.subscribe('/user/queue/notifications', (message) => {
          try {
            const notif = JSON.parse(message.body) as NotificationItem;
            setNotifications((prev) => {
              // 폴링과 병행 — notificationId로 중복 방지
              if (prev.some((n) => n.notificationId === notif.notificationId)) return prev;
              return [notif, ...prev];
            });
            if (!notif.read) setUnreadCount((c) => c + 1);
          } catch {
            // 파싱 실패 시 무시 (폴링이 백업)
          }
        });
      },
      onStompError: () => {
        // STOMP 프로토콜 에러 — 재연결은 라이브러리가 처리
      },
      onWebSocketError: () => {
        // 연결 실패 (nginx 미설정 등) — 폴링이 백업하므로 조용히 실패
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      void client.deactivate();
      clientRef.current = null;
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
