import client from './client';
import type { Post, User } from '../types';
import { normalizePost } from './posts';

// ── 타입 ───────────────────────────────────────────────────

export interface UpdateProfileRequest {
  userName?: string;
  profileImage?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export type PostsTab = 'published' | 'draft-private' | 'rejected';

// ── 엔드포인트 ─────────────────────────────────────────────

export const fetchMe = (): Promise<User> =>
  client.get<User>('/users/me').then((r) => r.data);

export const updateProfile = (data: UpdateProfileRequest): Promise<User> =>
  client.patch<User>('/users/me', data).then((r) => r.data);

export const changePassword = (data: ChangePasswordRequest): Promise<void> =>
  client.patch('/users/me/password', data).then(() => undefined);

export const fetchMyPosts = (tab?: PostsTab): Promise<Post[]> =>
  client.get('/users/me/posts', { params: tab ? { tab } : undefined }).then((r) => r.data.map(normalizePost));
