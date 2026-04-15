import type { ColorKey } from './color';
import type { EmpathyReaction } from './empathy';

export interface Post {
  id: string;
  title: string;
  content: string;
  color: ColorKey;
  authorId: string;
  authorNickname: string;
  createdAt: string; // ISO 8601
  empathyCount: number;
  reactions: EmpathyReaction[];
  isBookmarked: boolean;
  isMine: boolean;
}

export interface PostDraft {
  id: string;
  title: string;
  content: string;
  color: ColorKey | null;
  savedAt: string;
}
