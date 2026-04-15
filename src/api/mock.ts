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
    const color = (config.params?.color ?? null) as ColorKey | null;
    const filtered = color ? posts.filter((p) => p.color === color) : posts;
    return ok(config, filtered);
  }

  // GET /posts/:id
  const postMatch = url.match(/^\/posts\/(.+)$/);
  if (method === 'get' && postMatch) {
    const post = posts.find((p) => p.id === postMatch[1]);
    if (post) return ok(config, post);
    throw Object.assign(new Error('Not Found'), { response: { status: 404 } });
  }

  // POST /posts
  if (method === 'post' && url === '/posts') {
    const body = JSON.parse(config.data as string);
    const newPost = {
      id: `p${Date.now()}`,
      title: body.title as string,
      content: body.content as string,
      color: body.color as ColorKey,
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

  // POST /posts/:id/empathy
  const empathyMatch = url.match(/^\/posts\/(.+)\/empathy$/);
  if (method === 'post' && empathyMatch) {
    const reaction = JSON.parse(config.data as string) as EmpathyReaction;
    posts = posts.map((p) =>
      p.id !== empathyMatch[1]
        ? p
        : { ...p, empathyCount: p.empathyCount + 1, reactions: [...p.reactions, reaction] },
    );
    return ok(config, null);
  }

  // POST /posts/:id/bookmark
  const bookmarkMatch = url.match(/^\/posts\/(.+)\/bookmark$/);
  if (method === 'post' && bookmarkMatch) {
    posts = posts.map((p) =>
      p.id === bookmarkMatch[1] ? { ...p, isBookmarked: !p.isBookmarked } : p,
    );
    return ok(config, null);
  }

  // GET /bookmarks
  if (method === 'get' && url === '/bookmarks') {
    return ok(config, posts.filter((p) => p.isBookmarked));
  }

  // GET /me
  if (method === 'get' && url === '/me') {
    return ok(config, mockUser);
  }

  throw Object.assign(new Error(`Unhandled mock route: ${method.toUpperCase()} ${url}`), {
    response: { status: 404 },
  });
};
