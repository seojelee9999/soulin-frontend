import type { ColorKey } from './color';
import type { EmpathyReaction } from './empathy';

export type PostStatus = 'PUBLISHED' | 'DRAFT' | 'PENDING' | 'REJECTED';

export interface MyReaction {
  colorKey: ColorKey;
  sentence: string;
  category: string;
}

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
  isMine: boolean;
  status?: PostStatus;       // 없으면 PUBLISHED로 간주
  isPublic?: boolean;        // 없으면 true로 간주
  moderationReason?: string; // REJECTED 사유
  myReaction?: MyReaction;
}

export interface PostDraft {
  id: string;
  title: string;
  content: string;
  color: ColorKey | null;
  savedAt: string;
}
