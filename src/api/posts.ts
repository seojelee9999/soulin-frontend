import client from './client';
import type { Post, ColorKey, PostStatus } from '../types';
import { COLOR_KEYS, COLOR_ID_MAP, REACTION_TYPE_ID_MAP } from '../types';
import type { EmpathyReaction } from '../types';

// ── 요청 타입 ──────────────────────────────────────────────

export interface CreatePostRequest {
  title: string;
  content: string;
  colorId: number;
  isPublic?: boolean;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  colorId?: number;
}

export interface ColorRecommendationRequest {
  content: string;
}

export interface ColorRecommendationResponse {
  colors: ColorKey[];
}

// ── 백엔드 응답 → 프론트 Post 변환 ────────────────────────

interface BackendPostResponse {
  postId?: number;
  id?: string | number;
  title: string;
  content: string;
  isPublic?: boolean;
  colorId?: number;
  color?: ColorKey;
  userId?: number;
  userName?: string;
  authorNickname?: string;
  authorId?: string;
  status?: PostStatus;
  createdAt: string;
  updatedAt?: string;
  empathyCount?: number;
  reactions?: EmpathyReaction[];
  isMine?: boolean;
  moderationReason?: string;
  myReaction?: Post['myReaction'];
}

export function normalizePost(raw: BackendPostResponse): Post {
  const id = String(raw.postId ?? raw.id ?? '');
  const color: ColorKey =
    raw.colorId != null ? (COLOR_KEYS[raw.colorId - 1] ?? 'gray') : (raw.color ?? 'gray');
  return {
    id,
    title: raw.title,
    content: raw.content,
    color,
    userId: raw.userId ?? 0,
    authorId: raw.authorId ?? '',
    authorNickname: raw.authorNickname ?? raw.userName ?? '',
    createdAt: raw.createdAt,
    empathyCount: raw.empathyCount ?? 0,
    reactions: raw.reactions ?? [],
    isMine: raw.isMine ?? false,
    status: raw.status,
    isPublic: raw.isPublic,
    moderationReason: raw.moderationReason,
    myReaction: raw.myReaction,
  };
}

// ── 게시글 CRUD ────────────────────────────────────────────

export const fetchPosts = (color?: ColorKey): Promise<Post[]> =>
  client
    .get<BackendPostResponse[]>('/posts', { params: color ? { colorId: color } : {} })
    .then((r) => r.data.map(normalizePost));

export const fetchPost = (postId: string): Promise<Post> =>
  client.get<BackendPostResponse>(`/posts/${postId}`).then((r) => normalizePost(r.data));

export const fetchMyPost = (postId: string): Promise<Post> =>
  client.get<BackendPostResponse>(`/users/me/posts/${postId}`).then((r) => normalizePost(r.data));

export const createPost = (data: CreatePostRequest): Promise<Post> =>
  client.post<BackendPostResponse>('/posts', data).then((r) => normalizePost(r.data));

export const updatePost = (postId: string, data: UpdatePostRequest): Promise<Post> =>
  client.patch<BackendPostResponse>(`/posts/${postId}`, data).then((r) => normalizePost(r.data));

export const deletePost = (postId: string): Promise<void> =>
  client.delete(`/posts/${postId}`).then(() => undefined);

// ── 게시 요청 ──────────────────────────────────────────────

export const publishPost = (postId: string): Promise<void> =>
  client.post('/posts/publish', { postId: Number(postId) }).then(() => undefined);

// ── AI 색상 추천 ───────────────────────────────────────────

export const recommendColors = (content: string): Promise<ColorRecommendationResponse> =>
  client
    .post<ColorRecommendationResponse>('/posts/color-recommendation', { content } satisfies ColorRecommendationRequest)
    .then((r) => r.data);

// ── 북마크 ─────────────────────────────────────────────────

export const fetchBookmarks = (): Promise<Post[]> =>
  client.get<BackendPostResponse[]>('/users/me/bookmarks').then((r) => r.data.map(normalizePost));

export const addBookmark = (postId: string): Promise<void> =>
  client.post(`/posts/${postId}/bookmarks`).then(() => undefined);

export const removeBookmark = (postId: string): Promise<void> =>
  client.delete(`/posts/${postId}/bookmarks`).then(() => undefined);

// ── 공감 ───────────────────────────────────────────────────

export const sendEmpathy = (
  postId: string,
  reaction: { sentence: string; color: ColorKey; category: string },
): Promise<void> =>
  client.post(`/posts/${postId}/reactions`, {
    reactionTypeId: REACTION_TYPE_ID_MAP[reaction.sentence],
    sentence: reaction.sentence,
    colorId: COLOR_ID_MAP[reaction.color],
  }).then(() => undefined);
