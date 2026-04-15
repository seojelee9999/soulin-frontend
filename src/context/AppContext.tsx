import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Post, PostDraft, ColorKey } from '../types';
import { toggleBookmark as apiToggleBookmark } from '../api/posts';

interface AppContextValue {
  // 인증
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;

  // 북마크
  bookmarkedIds: Set<string>;
  toggleBookmark: (postId: string) => void;

  // 피드 캐시
  feedPosts: Post[];
  setFeedPosts: (posts: Post[]) => void;
  updatePost: (post: Post) => void;

  // 글 작성 임시저장
  draft: PostDraft | null;
  saveDraft: (title: string, content: string, color: ColorKey | null) => void;
  clearDraft: () => void;

  // 색상 선택 (작성 플로우)
  selectedColor: ColorKey | null;
  setSelectedColor: (color: ColorKey | null) => void;

  // AI 모드 여부
  isAiMode: boolean;
  setIsAiMode: (v: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const DRAFT_KEY = 'soul_in_draft';

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const login = useCallback(() => setIsLoggedIn(true), []);
  const logout = useCallback(() => setIsLoggedIn(false), []);

  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [feedPosts, setFeedPostsState] = useState<Post[]>([]);
  const [draft, setDraft] = useState<PostDraft | null>(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as PostDraft) : null;
  });
  const [selectedColor, setSelectedColor] = useState<ColorKey | null>(null);
  const [isAiMode, setIsAiMode] = useState(false);

  const toggleBookmark = useCallback((postId: string) => {
    apiToggleBookmark(postId).catch(() => {});
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
    setFeedPostsState((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, isBookmarked: !p.isBookmarked } : p,
      ),
    );
  }, []);

  const setFeedPosts = useCallback((posts: Post[]) => {
    setFeedPostsState(posts);
    setBookmarkedIds(new Set(posts.filter((p) => p.isBookmarked).map((p) => p.id)));
  }, []);

  const updatePost = useCallback((updated: Post) => {
    setFeedPostsState((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p)),
    );
  }, []);

  const saveDraft = useCallback((title: string, content: string, color: ColorKey | null) => {
    const d: PostDraft = { title, content, color, savedAt: new Date().toISOString() };
    setDraft(d);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  }, []);

  const clearDraft = useCallback(() => {
    setDraft(null);
    localStorage.removeItem(DRAFT_KEY);
  }, []);

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        login,
        logout,
        bookmarkedIds,
        toggleBookmark,
        feedPosts,
        setFeedPosts,
        updatePost,
        draft,
        saveDraft,
        clearDraft,
        selectedColor,
        setSelectedColor,
        isAiMode,
        setIsAiMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
