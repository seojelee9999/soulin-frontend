import type { ColorKey } from './color';
import type { EmpathyReaction } from './empathy';

export type PostStatus = 'PUBLISHED' | 'DRAFT' | 'PENDING' | 'REJECTED';

export interface MyPostReaction {
  postReactionId: number;
  reactionTypeId: number;
  reactionName: string;
  reactionText: string;
  colorId: number;
  colorName: string;
  colorCode: string;
}

export interface ReceivedReaction {
  reactionTypeId: number;
  reactionName: string;
  reactionText: string;
  colorId: number;
  colorCode: string;
  count: number;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  color: ColorKey;
  userId: number;
  authorId: string;
  authorNickname: string;
  createdAt: string; // ISO 8601
  empathyCount: number;
  reactions: EmpathyReaction[];
  isMine: boolean;
  status?: PostStatus;       // 없으면 PUBLISHED로 간주
  isPublic?: boolean;        // 없으면 true로 간주
  moderationReason?: string; // REJECTED 사유
  myReaction?: MyPostReaction | null;
  receivedReactions?: ReceivedReaction[];
  totalReactionCount?: number;
}

export interface PostDraft {
  id: string;
  title: string;
  content: string;
  color: ColorKey | null;
  savedAt: string;
}
