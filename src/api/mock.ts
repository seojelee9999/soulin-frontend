/**
 * Mock Adapter — 백엔드 연동 전까지 axios 요청을 네트워크 전송 없이 mock 데이터로 응답.
 * VITE_USE_MOCK=true 일 때만 활성화됨.
 */
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import client from './client';
import { mockPosts } from '../data/mockPosts';
import { mockUser } from '../data/mockUser';
import type { ColorKey } from '../types';
import type { EmpathyReaction } from '../types';

if (import.meta.env.VITE_USE_MOCK === 'true') {
  const delay = (ms = 250) => new Promise<void>((r) => setTimeout(r, ms));

  let posts = [...mockPosts];
  const bookmarkedIds = new Set<string>();

  function ok<T>(config: InternalAxiosRequestConfig, data: T, status = 200): AxiosResponse<T> {
    return { data, status, statusText: 'OK', headers: {}, config };
  }

  client.defaults.adapter = async (config) => {
    await delay();

    const url: string = config.url ?? '';
    const method: string = (config.method ?? 'get').toLowerCase();

    // POST /auth/login — mock 로그인 (토큰 반환)
    if (method === 'post' && url.includes('/auth/login')) {
      return ok(config, {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        userId: 1,
        userName: mockUser.nickname,
      });
    }

    // POST /auth/signup
    if (method === 'post' && url.includes('/auth/signup')) {
      return ok(config, { userId: 1, email: 'mock@email.com', userName: mockUser.nickname }, 201);
    }

    // POST /auth/logout
    if (method === 'post' && url.includes('/auth/logout')) {
      return ok(config, null);
    }

    // GET /posts
    if (method === 'get' && url === '/posts') {
      const colorKey = (config.params?.colorId ?? config.params?.color ?? null) as ColorKey | null;
      const filtered = colorKey ? posts.filter((p) => p.color === colorKey) : posts;
      return ok(config, filtered);
    }

    // GET /users/me/bookmarks
    if (method === 'get' && url === '/users/me/bookmarks') {
      return ok(config, posts.filter((p) => bookmarkedIds.has(p.id)));
    }

    // GET /users/me
    if (method === 'get' && url === '/users/me') {
      return ok(config, mockUser);
    }

    // GET /colors
    if (method === 'get' && url === '/colors') {
      return ok(config, []);
    }

    // GET /reaction-types
    if (method === 'get' && url === '/reaction-types') {
      return ok(config, []);
    }

    // GET /posts/:id — more-specific /posts/* routes must come first
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
        userId: 1,
        authorId: mockUser.id,
        authorNickname: mockUser.nickname,
        createdAt: new Date().toISOString(),
        empathyCount: 0,
        reactions: [],
        isMine: true,
      };
      posts = [newPost, ...posts];
      return ok(config, newPost, 201);
    }

    // PATCH /posts/:id (수정)
    const patchPostMatch = url.match(/^\/posts\/([^/]+)$/);
    if (method === 'patch' && patchPostMatch) {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data ?? {});
      let updated: (typeof posts)[0] | undefined;
      posts = posts.map((p) => {
        if (p.id !== patchPostMatch[1]) return p;
        updated = {
          ...p,
          title: (body.title as string) ?? p.title,
          content: (body.content as string) ?? p.content,
          color: (body.color ?? body.colorId ?? p.color) as ColorKey,
        };
        return updated!;
      });
      if (!updated) throw Object.assign(new Error('Not Found'), { response: { status: 404 } });
      return ok(config, updated);
    }

    // DELETE /posts/:id (삭제)
    const deletePostMatch = url.match(/^\/posts\/([^/]+)$/);
    if (method === 'delete' && deletePostMatch) {
      posts = posts.filter((p) => p.id !== deletePostMatch[1]);
      return ok(config, null);
    }

    // POST /posts/color-recommendation
    if (method === 'post' && url === '/posts/color-recommendation') {
      const colors: ColorKey[] = ['red', 'blue', 'green'];
      return ok(config, { colors });
    }

    // POST /posts/:id/reactions (공감)
    const reactionsPostMatch = url.match(/^\/posts\/([^/]+)\/reactions$/);
    if (method === 'post' && reactionsPostMatch) {
      const reaction = (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) as EmpathyReaction;
      posts = posts.map((p) =>
        p.id !== reactionsPostMatch[1]
          ? p
          : { ...p, empathyCount: p.empathyCount + 1, reactions: [...p.reactions, reaction] },
      );
      return ok(config, null);
    }

    // DELETE /posts/:id/reactions (공감 취소)
    const reactionsDelMatch = url.match(/^\/posts\/([^/]+)\/reactions$/);
    if (method === 'delete' && reactionsDelMatch) {
      posts = posts.map((p) =>
        p.id !== reactionsDelMatch[1]
          ? p
          : { ...p, empathyCount: Math.max(0, p.empathyCount - 1), reactions: [] },
      );
      return ok(config, null);
    }

    // POST /posts/:id/bookmarks (토글)
    const bookmarkAddMatch = url.match(/^\/posts\/([^/]+)\/bookmarks$/);
    if (method === 'post' && bookmarkAddMatch) {
      const id = bookmarkAddMatch[1];
      if (bookmarkedIds.has(id)) bookmarkedIds.delete(id);
      else bookmarkedIds.add(id);
      return ok(config, null);
    }

    // DELETE /posts/:id/bookmarks (북마크 제거)
    const bookmarkDelMatch = url.match(/^\/posts\/([^/]+)\/bookmarks$/);
    if (method === 'delete' && bookmarkDelMatch) {
      bookmarkedIds.delete(bookmarkDelMatch[1]);
      return ok(config, null);
    }

    throw Object.assign(new Error(`Unhandled mock route: ${method.toUpperCase()} ${url}`), {
      response: { status: 404 },
    });
  };
}
