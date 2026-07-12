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

export interface SendVerificationCodeRequest {
  email: string;
}
export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export const sendVerificationCode = (email: string): Promise<void> =>
  client.post('/auth/email/send-code', { email }).then(() => undefined);

export const verifyCode = (email: string, code: string): Promise<void> =>
  client.post('/auth/email/verify', { email, code }).then(() => undefined);

// 비밀번호 재설정 전용 (회원가입 이메일 인증과 별개 API)
export const sendPasswordResetCode = (email: string): Promise<void> =>
  client.post('/auth/password-reset/send-code', { email }).then(() => undefined);

export interface VerifyResetCodeResponse {
  resetToken: string;
  expiresIn: number; // 초 단위 (600)
}

export const verifyPasswordResetCode = (email: string, code: string): Promise<VerifyResetCodeResponse> =>
  client
    .post<VerifyResetCodeResponse>('/auth/password-reset/verify-code', { email, code })
    .then((r) => r.data);

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
  newPasswordConfirm: string;
}

export const resetPassword = (data: ResetPasswordRequest): Promise<void> =>
  client.post('/auth/password-reset', data).then(() => undefined);

export const logout = (): Promise<void> =>
  client.post('/auth/logout').then(() => {
    localStorage.removeItem('soul_in_token');
    localStorage.removeItem('soul_in_refresh_token');
    localStorage.removeItem('soul_in_auth');
    localStorage.removeItem('soul_in_user_name');
    localStorage.removeItem('soul_in_user_id');
  });

export interface ReissueResponse {
  accessToken: string;
  refreshToken: string;
}

export const reissue = (refreshToken: string): Promise<ReissueResponse> =>
  client.post<ReissueResponse>('/auth/reissue', { refreshToken }).then((r) => {
    const { accessToken, refreshToken: newRefresh } = r.data;
    localStorage.setItem('soul_in_token', accessToken);
    localStorage.setItem('soul_in_refresh_token', newRefresh);
    return r.data;
  });
