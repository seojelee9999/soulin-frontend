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
  newPasswordConfirm: string;
}

export type PostsTab = 'published' | 'draft-private' | 'rejected';

// ── 엔드포인트 ─────────────────────────────────────────────

export const fetchMe = (): Promise<User> =>
  client.get<User>('/users/me').then((r) => r.data);

export const updateProfile = (data: UpdateProfileRequest): Promise<User> =>
  client.patch<User>('/users/me', data).then((r) => r.data);

export const changePassword = (data: ChangePasswordRequest): Promise<void> =>
  client.patch('/users/me/password', data).then(() => undefined);

// BE 계약: date 지정 시 PUBLISHED만 반환, date가 tab보다 우선
export const fetchMyPosts = (opts?: { tab?: PostsTab; date?: string }): Promise<Post[]> => {
  const params: Record<string, string> = {
    ...(opts?.tab && { tab: opts.tab }),
    ...(opts?.date && { date: opts.date }),
  };
  return client
    .get('/users/me/posts', { params: Object.keys(params).length ? params : undefined })
    .then((r) => r.data.map(normalizePost));
};

export const deleteAccount = (): Promise<void> =>
  client.delete('/users/me').then(() => undefined);
