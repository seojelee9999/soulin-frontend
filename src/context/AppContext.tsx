import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { Post } from '../types';

interface AppContextValue {
  // 피드 캐시
  feedPosts: Post[];
  setFeedPosts: (posts: Post[]) => void;
  updatePost: (post: Post) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [feedPosts, setFeedPostsState] = useState<Post[]>([]);

  const setFeedPosts = useCallback((posts: Post[]) => {
    setFeedPostsState(posts);
  }, []);

  const updatePost = useCallback((updated: Post) => {
    setFeedPostsState((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const value = useMemo(
    () => ({ feedPosts, setFeedPosts, updatePost }),
    [feedPosts, setFeedPosts, updatePost],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
