import axios from 'axios';

const AUTH_PATHS = ['/auth/login', '/auth/signup'];

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

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';
    const isAuthPath = AUTH_PATHS.some((p) => url.includes(p));
    if (status === 401 && !isAuthPath) {
      localStorage.removeItem('soul_in_token');
      localStorage.removeItem('soul_in_refresh_token');
      localStorage.removeItem('soul_in_auth');
      localStorage.removeItem('soul_in_user_name');
      localStorage.removeItem('soul_in_user_id');
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    } else if (status === 403 && !isAuthPath) {
      console.error(`API 403 ${error.config?.method?.toUpperCase() ?? 'REQUEST'} ${url}`, error.response?.data);
    }
    return Promise.reject(error);
  },
);

export default client;
