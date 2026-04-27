import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';
import { fetchBookmarks, addBookmark, removeBookmark } from '../api/posts';
import { useAuth } from './AuthContext';

interface BookmarkContextValue {
  bookmarkedIds: Set<string>;
  toggleBookmark: (postId: string) => void;
  refreshBookmarks: () => Promise<void>;
}

const BookmarkContext = createContext<BookmarkContextValue | null>(null);

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const refreshBookmarks = useCallback(async () => {
    try {
      const posts = await fetchBookmarks();
      setBookmarkedIds(new Set(posts.map((p) => p.id)));
    } catch {
      // 401/403 등 인증 오류는 axios interceptor가 처리
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      refreshBookmarks();
    } else {
      setBookmarkedIds(new Set());
    }
  }, [isLoggedIn, refreshBookmarks]);

  const toggleBookmark = useCallback((postId: string) => {
    let hadIt = false;
    setBookmarkedIds((prev) => {
      hadIt = prev.has(postId);
      const next = new Set(prev);
      if (hadIt) next.delete(postId);
      else next.add(postId);
      return next;
    });
    const apiCall = hadIt ? removeBookmark(postId) : addBookmark(postId);
    apiCall.catch(() => {
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (hadIt) next.add(postId);
        else next.delete(postId);
        return next;
      });
    });
  }, []);

  const value = useMemo(
    () => ({ bookmarkedIds, toggleBookmark, refreshBookmarks }),
    [bookmarkedIds, toggleBookmark, refreshBookmarks],
  );

  return <BookmarkContext.Provider value={value}>{children}</BookmarkContext.Provider>;
}

export function useBookmark() {
  const ctx = useContext(BookmarkContext);
  if (!ctx) throw new Error('useBookmark must be used within BookmarkProvider');
  return ctx;
}
