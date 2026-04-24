import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { Post, PostDraft, ColorKey } from '../types';
import { toggleBookmark as apiToggleBookmark } from '../api/posts';

interface AppContextValue {
  // 인증
  isLoggedIn: boolean;
  userName: string | null;
  login: (data?: { userName?: string }) => void;
  logout: () => void;

  // 북마크
  bookmarkedIds: Set<string>;
  toggleBookmark: (postId: string) => void;

  // 피드 캐시
  feedPosts: Post[];
  setFeedPosts: (posts: Post[]) => void;
  updatePost: (post: Post) => void;

  // 글 작성 임시저장 (배열)
  drafts: PostDraft[];
  draft: PostDraft | null;
  saveDraft: (title: string, content: string, color: ColorKey | null) => void;
  clearDraft: (id?: string) => void;

  // 색상 선택 (작성 플로우)
  selectedColor: ColorKey | null;
  setSelectedColor: (color: ColorKey | null) => void;

  // AI 모드 여부
  isAiMode: boolean;
  setIsAiMode: (v: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const DRAFTS_KEY = 'soul_in_drafts';

function loadDrafts(): PostDraft[] {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    return raw ? (JSON.parse(raw) as PostDraft[]) : [];
  } catch {
    return [];
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem('soul_in_auth') === 'true',
  );
  const [userName, setUserName] = useState<string | null>(
    () => localStorage.getItem('soul_in_user_name'),
  );

  const login = useCallback((data?: { userName?: string }) => {
    localStorage.setItem('soul_in_auth', 'true');
    if (data?.userName) {
      localStorage.setItem('soul_in_user_name', data.userName);
      setUserName(data.userName);
    }
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('soul_in_auth');
    localStorage.removeItem('soul_in_token');
    localStorage.removeItem('soul_in_refresh_token');
    localStorage.removeItem('soul_in_user_name');
    setIsLoggedIn(false);
    setUserName(null);
  }, []);

  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [feedPosts, setFeedPostsState] = useState<Post[]>([]);
  const [drafts, setDrafts] = useState<PostDraft[]>(loadDrafts);
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
    const d: PostDraft = { id: String(Date.now()), title, content, color, savedAt: new Date().toISOString() };
    setDrafts((prev) => {
      const next = [d, ...prev];
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearDraft = useCallback((id?: string) => {
    setDrafts((prev) => {
      const next = id ? prev.filter((d) => d.id !== id) : prev.slice(1);
      if (next.length === 0) {
        localStorage.removeItem(DRAFTS_KEY);
      } else {
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const draft = useMemo(() => drafts[0] ?? null, [drafts]);

  const value = useMemo(() => ({
    isLoggedIn,
    userName,
    login,
    logout,
    bookmarkedIds,
    toggleBookmark,
    feedPosts,
    setFeedPosts,
    updatePost,
    drafts,
    draft,
    saveDraft,
    clearDraft,
    selectedColor: selectedColorState,
    setSelectedColor,
    isAiMode: isAiModeState,
    setIsAiMode,
  }), [
    isLoggedIn, userName, login, logout,
    bookmarkedIds, toggleBookmark,
    feedPosts, setFeedPosts, updatePost,
    drafts, draft, saveDraft, clearDraft,
    selectedColorState, setSelectedColor,
    isAiModeState, setIsAiMode,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
