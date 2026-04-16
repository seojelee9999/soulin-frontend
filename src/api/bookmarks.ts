import client from './client';
import type { Post } from '../types';

export const fetchBookmarks = (): Promise<Post[]> =>
  client.get<Post[]>('/users/me/bookmarks').then((r) => r.data);

export const addBookmark = (postId: string): Promise<void> =>
  client.post(`/posts/${postId}/bookmarks`).then(() => undefined);

export const removeBookmark = (postId: string): Promise<void> =>
  client.delete(`/posts/${postId}/bookmarks`).then(() => undefined);
