// VITE_API_BASE_URL(예: https://api.soulin.kr) → wss://api.soulin.kr/ws
// http → ws, https → wss (프로토콜 접두어만 치환)
export function getWsUrl(): string {
  const base = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080') as string;
  return base.replace(/^http/, 'ws') + '/ws';
}
