import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { Post, ColorKey } from '../types';

interface AppContextValue {
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
  const [feedPosts, setFeedPostsState] = useState<Post[]>([]);
  const [selectedColorState, setSelectedColorState] = useState<ColorKey | null>(null);
  const [isAiModeState, setIsAiModeState] = useState(false);

  const setSelectedColor = useCallback((color: ColorKey | null) => setSelectedColorState(color), []);
  const setIsAiMode = useCallback((v: boolean) => setIsAiModeState(v), []);

  const setFeedPosts = useCallback((posts: Post[]) => {
    setFeedPostsState(posts);
  }, []);

  const updatePost = useCallback((updated: Post) => {
    setFeedPostsState((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const value = useMemo(
    () => ({
      feedPosts,
      setFeedPosts,
      updatePost,
      selectedColor: selectedColorState,
      setSelectedColor,
      isAiMode: isAiModeState,
      setIsAiMode,
    }),
    [
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
