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
    if (error.response?.status === 401) {
      localStorage.removeItem('soul_in_token');
      localStorage.removeItem('soul_in_refresh_token');
      localStorage.removeItem('soul_in_auth');
      window.location.replace('/login');
    }
    return Promise.reject(error);
  },
);

export default client;
