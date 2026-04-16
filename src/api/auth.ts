import client from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  userId: string;
  userName: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  userName: string;
}

export const login = (data: LoginRequest): Promise<LoginResponse> =>
  client.post<LoginResponse>('/auth/login', data).then((r) => {
    const { accessToken } = r.data;
    localStorage.setItem('token', accessToken);
    localStorage.setItem('soul_in_auth', 'true');
    return r.data;
  });

export const signup = (data: SignupRequest): Promise<void> =>
  client.post('/auth/signup', data).then(() => undefined);

export const logout = (): Promise<void> =>
  client.post('/auth/logout').then(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('soul_in_auth');
  });
