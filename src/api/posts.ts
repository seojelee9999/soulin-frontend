import client from './client';
import type { Post, ColorKey, EmpathyReaction } from '../types';

export const fetchPosts = (color?: ColorKey) =>
  client.get<Post[]>('/posts', { params: color ? { color } : {} }).then((r) => r.data);

export const fetchPost = (id: string) =>
  client.get<Post>(`/posts/${id}`).then((r) => r.data);

export const createPost = (title: string, content: string, color: ColorKey) =>
  client.post<Post>('/posts', { title, content, color }).then((r) => r.data);

export const sendEmpathy = (postId: string, reaction: EmpathyReaction) =>
  client.post(`/posts/${postId}/empathy`, reaction);

export const toggleBookmark = (postId: string) =>
  client.post(`/posts/${postId}/bookmark`);

export const fetchBookmarks = () =>
  client.get<Post[]>('/bookmarks').then((r) => r.data);
