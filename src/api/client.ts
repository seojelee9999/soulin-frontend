import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

const AUTH_PATHS = ['/auth/login', '/auth/signup', '/auth/reissue'];

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const url = config.url ?? '';
  const isAuthPath = AUTH_PATHS.some((p) => url.includes(p));
  if (!isAuthPath) {
    const token = localStorage.getItem('soul_in_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// reissue 동시 호출 방지용 공유 promise.
// 401 떨어진 첫 요청이 reissue 시작 → 다른 요청들은 같은 promise 대기 → 새 토큰으로 재시도.
let reissuePromise: Promise<string> | null = null;

function clearAuthAndRedirect() {
  localStorage.removeItem('soul_in_token');
  localStorage.removeItem('soul_in_refresh_token');
  localStorage.removeItem('soul_in_auth');
  localStorage.removeItem('soul_in_user_name');
  localStorage.removeItem('soul_in_user_id');
  if (window.location.pathname !== '/login') {
    window.location.replace('/login');
  }
}

async function performReissue(): Promise<string> {
  const refreshToken = localStorage.getItem('soul_in_refresh_token');
  if (!refreshToken) throw new Error('no refresh token');

  // axios 직접 호출. client 거치면 interceptor 재진입 위험.
  const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
  const res = await axios.post<{ accessToken: string; refreshToken: string }>(
    `${baseURL}/auth/reissue`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' }, timeout: 10000 },
  );
  const { accessToken, refreshToken: newRefresh } = res.data;
  localStorage.setItem('soul_in_token', accessToken);
  localStorage.setItem('soul_in_refresh_token', newRefresh);
  return accessToken;
}

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalConfig = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const url = originalConfig?.url ?? '';
    const isAuthPath = AUTH_PATHS.some((p) => url.includes(p));

    // 401 처리 (auth path 제외, 재시도 1회만)
    if (status === 401 && !isAuthPath && originalConfig && !originalConfig._retry) {
      const refreshToken = localStorage.getItem('soul_in_refresh_token');
      if (!refreshToken) {
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      originalConfig._retry = true;

      try {
        // 진행 중인 reissue 있으면 그거 await, 없으면 새로 시작
        if (!reissuePromise) {
          reissuePromise = performReissue().finally(() => {
            reissuePromise = null;
          });
        }
        const newAccessToken = await reissuePromise;

        // 원 요청을 새 토큰으로 재시도
        originalConfig.headers = originalConfig.headers ?? {};
        (originalConfig.headers as Record<string, string>).Authorization = `Bearer ${newAccessToken}`;
        return client.request(originalConfig);
      } catch (reissueError) {
        // reissue 실패 → 진짜 로그아웃
        clearAuthAndRedirect();
        return Promise.reject(reissueError);
      }
    }

    // 403은 비즈니스 거부, logout 안 함 (기존 동작 유지)
    if (status === 403 && !isAuthPath) {
      console.error(
        `API 403 ${originalConfig?.method?.toUpperCase() ?? 'REQUEST'} ${url}`,
        error.response?.data,
      );
    }

    return Promise.reject(error);
  },
);

export default client;
