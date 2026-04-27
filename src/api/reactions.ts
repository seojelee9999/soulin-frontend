import client from './client';
import type { ColorKey } from '../types';

// ── 요청 타입 ───────────────────────────────────────────────

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

// ── 응답 타입 (백엔드 명세 기준) ───────────────────────────

export interface ReactionColorStat {
  colorId: number;
  colorName: string;
  colorCode: string;
  count: number;
  ratio: number;
}

export interface ReactionTopColor {
  colorId: number;
  colorName: string;
  colorCode: string;
  count: number;
}

export interface ReactionTopType {
  reactionTypeId: number;
  reactionName: string;
  reactionText: string;
}

export interface PostReactionSummary {
  postId: number;
  title: string;
  content: string;
  topColor: ReactionTopColor | null;
  topReactionType: ReactionTopType | null;
}

export interface ReactionSummaryResponse {
  totalReactionCount: number;
  colorRatios: ReactionColorStat[];
  postReactionSummaries: PostReactionSummary[];
}

export interface ReactionTextStat {
  reactionTypeId: number;
  reactionName: string;
  reactionText: string;
  count: number;
}

export interface ReactionDetailResponse {
  postId: number;
  title: string;
  colorStats: ReactionColorStat[];
  reactionTextStats: ReactionTextStat[];
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

export const fetchReactionSummary = (): Promise<ReactionSummaryResponse> =>
  client.get<ReactionSummaryResponse>('/users/me/reactions/summary').then((r) => r.data);

export const fetchReactionDetails = (postId: string): Promise<ReactionDetailResponse> =>
  client.get<ReactionDetailResponse>(`/posts/${postId}/reactions/details`).then((r) => r.data);
