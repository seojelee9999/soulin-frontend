import type { ColorKey } from './color';

// Color Mate 채팅 에이전트(n8n) 응답을 그리기 위한 타입.
// 색상은 ../types/color 의 ColorKey 를 재사용한다(재정의 금지).

export type ChatRole = 'agent' | 'user';

export interface Chip {
  label: string;
  value: string;
  direct?: boolean;
  action?: 'publish' | 'decline' | 'refine' | 'edit';
}

export interface ColorMatePost {
  title: string;
  content: string;
  colorKey: ColorKey | null; // 색 매핑 실패(자유색 등) 시 null
  freeColorName?: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  ts: string;
  post?: ColorMatePost;
}

export interface AgentTurn {
  text: string;
  chips: Chip[] | null;
  inputEnabled: boolean;
  allowDirectInput: boolean;
  post: ColorMatePost | null;
  phase: string;
}
