/**
 * Mock Adapter — 백엔드 연동 전까지 axios 요청을 네트워크 전송 없이 mock 데이터로 응답.
 * 백엔드 연동 시 App.tsx에서 `import './api/mock'` 한 줄만 제거하면 됨.
 */
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import client from './client';
import { mockPosts } from '../data/mockPosts';
import { mockUser } from '../data/mockUser';
import type { ColorKey } from '../types';
import type { EmpathyReaction } from '../types';

const delay = (ms = 250) => new Promise<void>((r) => setTimeout(r, ms));

let posts = [...mockPosts];

function ok<T>(config: InternalAxiosRequestConfig, data: T, status = 200): AxiosResponse<T> {
  return { data, status, statusText: 'OK', headers: {}, config };
}

client.defaults.adapter = async (config) => {
  await delay();

  const url: string = config.url ?? '';
  const method: string = (config.method ?? 'get').toLowerCase();

  // GET /posts
  if (method === 'get' && url === '/posts') {
    const colorKey = (config.params?.colorId ?? config.params?.color ?? null) as ColorKey | null;
    const filtered = colorKey ? posts.filter((p) => p.color === colorKey) : posts;
    return ok(config, filtered);
  }

  // GET /users/me/bookmarks
  if (method === 'get' && url === '/users/me/bookmarks') {
    return ok(config, posts.filter((p) => p.isBookmarked));
  }

  // GET /users/me
  if (method === 'get' && url === '/users/me') {
    return ok(config, mockUser);
  }

  // GET /posts/:id  — must come after more-specific /posts/* routes
  const postIdMatch = url.match(/^\/posts\/([^/]+)$/);
  if (method === 'get' && postIdMatch) {
    const post = posts.find((p) => p.id === postIdMatch[1]);
    if (post) return ok(config, post);
    throw Object.assign(new Error('Not Found'), { response: { status: 404 } });
  }

  // POST /posts
  if (method === 'post' && url === '/posts') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data ?? {});
    const color = (body.color ?? body.colorId ?? 'gray') as ColorKey;
    const newPost = {
      id: `p${Date.now()}`,
      title: (body.title as string) ?? '',
      content: (body.content as string) ?? '',
      color,
      authorId: mockUser.id,
      authorNickname: mockUser.nickname,
      createdAt: new Date().toISOString(),
      empathyCount: 0,
      reactions: [],
      isBookmarked: false,
      isMine: true,
    };
    posts = [newPost, ...posts];
    return ok(config, newPost, 201);
  }

  // POST /posts/:id/reactions  (공감)
  const reactionsMatch = url.match(/^\/posts\/([^/]+)\/reactions$/);
  if (method === 'post' && reactionsMatch) {
    const reaction = (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) as EmpathyReaction;
    posts = posts.map((p) =>
      p.id !== reactionsMatch[1]
        ? p
        : { ...p, empathyCount: p.empathyCount + 1, reactions: [...p.reactions, reaction] },
    );
    return ok(config, null);
  }

  // DELETE /posts/:id/reactions  (공감 취소)
  const reactionsDelMatch = url.match(/^\/posts\/([^/]+)\/reactions$/);
  if (method === 'delete' && reactionsDelMatch) {
    posts = posts.map((p) =>
      p.id !== reactionsDelMatch[1]
        ? p
        : { ...p, empathyCount: Math.max(0, p.empathyCount - 1), reactions: [] },
    );
    return ok(config, null);
  }

  // POST /posts/:id/bookmarks  (북마크 추가)
  const bookmarkAddMatch = url.match(/^\/posts\/([^/]+)\/bookmarks$/);
  if (method === 'post' && bookmarkAddMatch) {
    posts = posts.map((p) =>
      p.id === bookmarkAddMatch[1] ? { ...p, isBookmarked: true } : p,
    );
    return ok(config, null);
  }

  // DELETE /posts/:id/bookmarks  (북마크 제거)
  const bookmarkDelMatch = url.match(/^\/posts\/([^/]+)\/bookmarks$/);
  if (method === 'delete' && bookmarkDelMatch) {
    posts = posts.map((p) =>
      p.id === bookmarkDelMatch[1] ? { ...p, isBookmarked: false } : p,
    );
    return ok(config, null);
  }

  // GET /me  (구 호환)
  if (method === 'get' && url === '/me') {
    return ok(config, mockUser);
  }

  throw Object.assign(new Error(`Unhandled mock route: ${method.toUpperCase()} ${url}`), {
    response: { status: 404 },
  });
};
