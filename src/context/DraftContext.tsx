import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { PostDraft, ColorKey } from '../types';

interface DraftContextValue {
  drafts: PostDraft[];
  draft: PostDraft | null;
  saveDraft: (title: string, content: string, color: ColorKey | null) => void;
  clearDraft: (id?: string) => void;
}

const DraftContext = createContext<DraftContextValue | null>(null);

const DRAFTS_KEY = 'soul_in_drafts';

function loadDrafts(): PostDraft[] {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    return raw ? (JSON.parse(raw) as PostDraft[]) : [];
  } catch {
    return [];
  }
}

export function DraftProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<PostDraft[]>(loadDrafts);

  const saveDraft = useCallback((title: string, content: string, color: ColorKey | null) => {
    const d: PostDraft = {
      id: String(Date.now()),
      title,
      content,
      color,
      savedAt: new Date().toISOString(),
    };
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

  const value = useMemo(
    () => ({ drafts, draft, saveDraft, clearDraft }),
    [drafts, draft, saveDraft, clearDraft],
  );

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraft() {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('useDraft must be used within DraftProvider');
  return ctx;
}
