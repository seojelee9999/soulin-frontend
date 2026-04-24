import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { Post, ColorKey } from '../types';
import { toggleBookmark as apiToggleBookmark } from '../api/posts';

interface AppContextValue {
  // 북마크
  bookmarkedIds: Set<string>;
  toggleBookmark: (postId: string) => void;

  // 피드 캐시
  feedPosts: Post[];
  setFeedPosts: (posts: Post[]) => void;
  updatePost: (post: Post) => void;

  // 색상 선택 (작성 플로우)
  selectedColor: ColorKey | null;
  setSelectedColor: (color: ColorKey | null) => void;

  // AI 모드 여부
  isAiMode: boolean;
  setIsAiMode: (v: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [feedPosts, setFeedPostsState] = useState<Post[]>([]);
  const [selectedColorState, setSelectedColorState] = useState<ColorKey | null>(null);
  const [isAiModeState, setIsAiModeState] = useState(false);

  const setSelectedColor = useCallback((color: ColorKey | null) => setSelectedColorState(color), []);
  const setIsAiMode = useCallback((v: boolean) => setIsAiModeState(v), []);

  const toggleBookmark = useCallback((postId: string) => {
    apiToggleBookmark(postId).catch(() => {});
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
    setFeedPostsState((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isBookmarked: !p.isBookmarked } : p)),
    );
  }, []);

  const setFeedPosts = useCallback((posts: Post[]) => {
    setFeedPostsState(posts);
    setBookmarkedIds(new Set(posts.filter((p) => p.isBookmarked).map((p) => p.id)));
  }, []);

  const updatePost = useCallback((updated: Post) => {
    setFeedPostsState((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const value = useMemo(
    () => ({
      bookmarkedIds,
      toggleBookmark,
      feedPosts,
      setFeedPosts,
      updatePost,
      selectedColor: selectedColorState,
      setSelectedColor,
      isAiMode: isAiModeState,
      setIsAiMode,
    }),
    [
      bookmarkedIds, toggleBookmark,
      feedPosts, setFeedPosts, updatePost,
      selectedColorState, setSelectedColor,
      isAiModeState, setIsAiMode,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
