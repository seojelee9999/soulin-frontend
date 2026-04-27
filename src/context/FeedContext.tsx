import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { Post } from '../types';

interface FeedContextValue {
  feedPosts: Post[];
  setFeedPosts: (posts: Post[]) => void;
  updatePost: (post: Post) => void;
}

const FeedContext = createContext<FeedContextValue | null>(null);

export function FeedProvider({ children }: { children: ReactNode }) {
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

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
}

export function useFeed() {
  const ctx = useContext(FeedContext);
  if (!ctx) throw new Error('useFeed must be used within FeedProvider');
  return ctx;
}
