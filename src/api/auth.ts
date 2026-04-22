import client from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  userId: number;
  userName: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  userName: string;
}

export const login = (data: LoginRequest): Promise<LoginResponse> =>
  client.post<LoginResponse>('/auth/login', data).then((r) => {
    const { accessToken, refreshToken } = r.data;
    if (accessToken) localStorage.setItem('soul_in_token', accessToken);
    if (refreshToken) localStorage.setItem('soul_in_refresh_token', refreshToken);
    localStorage.setItem('soul_in_auth', 'true');
    return r.data;
  });

export const signup = (data: SignupRequest): Promise<void> =>
  client.post('/auth/signup', data).then(() => undefined);

export const logout = (): Promise<void> =>
  client.post('/auth/logout').then(() => {
    localStorage.removeItem('soul_in_token');
    localStorage.removeItem('soul_in_refresh_token');
    localStorage.removeItem('soul_in_auth');
  });
