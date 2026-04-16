import client from './client';
import type { ColorKey } from '../types';

// ── 타입 ───────────────────────────────────────────────────

export interface ReactionType {
  id: number;
  category: string;
  sentence: string;
}

export interface CreateReactionRequest {
  reactionTypeId: number;
  colorKey: ColorKey;
}

export interface UpdateReactionRequest {
  reactionTypeId?: number;
  colorKey?: ColorKey;
}

export interface ReactionDetail {
  reactionId: string;
  userId: string;
  userName: string;
  sentence: string;
  category: string;
  colorKey: ColorKey;
  createdAt: string;
}

// ── 엔드포인트 ─────────────────────────────────────────────

export const fetchReactionTypes = (): Promise<ReactionType[]> =>
  client.get<ReactionType[]>('/reaction-types').then((r) => r.data);

export const createReaction = (postId: string, data: CreateReactionRequest): Promise<void> =>
  client.post(`/posts/${postId}/reactions`, data).then(() => undefined);

export const deleteReaction = (postId: string): Promise<void> =>
  client.delete(`/posts/${postId}/reactions`).then(() => undefined);

export const updateReaction = (postId: string, data: UpdateReactionRequest): Promise<void> =>
  client.patch(`/posts/${postId}/reactions`, data).then(() => undefined);

export const fetchReactionDetails = (postId: string): Promise<ReactionDetail[]> =>
  client.get<ReactionDetail[]>(`/posts/${postId}/reactions/details`).then((r) => r.data);
