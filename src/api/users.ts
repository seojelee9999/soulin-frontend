import client from './client';
import type { User } from '../types';

// ── 타입 ───────────────────────────────────────────────────

export interface UpdateProfileRequest {
  userName?: string;
  profileImage?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export type PostStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface MyPostsParams {
  status?: PostStatus;
  isPublic?: boolean;
}

// ── 엔드포인트 ─────────────────────────────────────────────

export const fetchMe = (): Promise<User> =>
  client.get<User>('/users/me').then((r) => r.data);

export const updateProfile = (data: UpdateProfileRequest): Promise<User> =>
  client.patch<User>('/users/me', data).then((r) => r.data);

export const changePassword = (data: ChangePasswordRequest): Promise<void> =>
  client.patch('/users/me/password', data).then(() => undefined);

export const fetchMyPosts = (params?: MyPostsParams) =>
  client.get('/users/me/posts', { params }).then((r) => r.data);
