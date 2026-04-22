import client from './client';
import type { Post, ColorKey } from '../types';

// ── 요청 타입 ──────────────────────────────────────────────

export interface CreatePostRequest {
  title: string;
  content: string;
  colorId?: number;
  color?: ColorKey; // mock 호환용
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  colorId?: number;
  color?: ColorKey; // mock 호환용
}

export interface PublishPostRequest {
  postId: string;
}

export interface ColorRecommendationRequest {
  content: string;
}

export interface ColorRecommendationResponse {
  colors: ColorKey[];
}

// ── 게시글 CRUD ────────────────────────────────────────────

export const fetchPosts = (color?: ColorKey): Promise<Post[]> =>
  client
    .get<Post[]>('/posts', { params: color ? { colorId: color } : {} })
    .then((r) => r.data);

export const fetchPost = (postId: string): Promise<Post> =>
  client.get<Post>(`/posts/${postId}`).then((r) => r.data);

export const createPost = (data: CreatePostRequest): Promise<Post> =>
  client.post<Post>('/posts', data).then((r) => r.data);

export const updatePost = (postId: string, data: UpdatePostRequest): Promise<Post> =>
  client.patch<Post>(`/posts/${postId}`, data).then((r) => r.data);

export const deletePost = (postId: string): Promise<void> =>
  client.delete(`/posts/${postId}`).then(() => undefined);

// ── 게시 요청 ──────────────────────────────────────────────

export const publishPost = (postId: string): Promise<void> =>
  client.post('/posts/publish', { postId } satisfies PublishPostRequest).then(() => undefined);

// ── AI 색상 추천 ───────────────────────────────────────────

export const recommendColors = (content: string): Promise<ColorRecommendationResponse> =>
  client
    .post<ColorRecommendationResponse>('/posts/color-recommendation', { content } satisfies ColorRecommendationRequest)
    .then((r) => r.data);

// ── 북마크 (posts 도메인 내 기존 호환용) ──────────────────

export const fetchBookmarks = (): Promise<Post[]> =>
  client.get<Post[]>('/users/me/bookmarks').then((r) => r.data);

export const toggleBookmark = (postId: string): Promise<void> =>
  client.post(`/posts/${postId}/bookmarks`).then(() => undefined);

// ── 공감 (기존 호환용) ─────────────────────────────────────

export const sendEmpathy = (
  postId: string,
  reaction: { sentence: string; color: ColorKey; category: string },
): Promise<void> =>
  client.post(`/posts/${postId}/reactions`, reaction).then(() => undefined);
