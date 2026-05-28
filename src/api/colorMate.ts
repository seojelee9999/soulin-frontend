import { COLOR_KEYS, COLOR_ID_MAP, COLOR_MAP } from '../types';
import type { ColorKey } from '../types';
import type { AgentTurn, Chip, ColorMatePost } from '../types/colorMate';

// n8n 챗 에이전트 webhook. soulin 백엔드(client)와 별개 엔드포인트라 client를 쓰지 않는다.
const WEBHOOK_URL = import.meta.env.VITE_COLORMATE_WEBHOOK_URL as string | undefined;

// 자유 입력을 의미하는 칩 라벨
const DIRECT_LABELS = ['직접 입력', '직접 쓰기'];
const DIRECT_INPUT_HINT = /원한다면 직접 입력해도 돼요\.?/g;

// ── 색상 매핑 ──────────────────────────────────────────────
// ColorKey / colorId(1~12) / 한글 label 어떤 형태로 와도 ColorKey로 정규화.
// 기존 색상 상수만 재사용한다(하드코딩/재정의 금지).
export function resolveColorKey(input: string | number): ColorKey | null {
  // colorId(숫자)
  if (typeof input === 'number') {
    return COLOR_KEYS.find((k) => COLOR_ID_MAP[k] === input) ?? null;
  }

  const trimmed = input.trim();
  if (!trimmed) return null;

  // 이미 ColorKey
  if ((COLOR_KEYS as readonly string[]).includes(trimmed)) {
    return trimmed as ColorKey;
  }

  // colorId 문자열("1"~"12")
  const asNum = Number(trimmed);
  if (Number.isInteger(asNum)) {
    const byId = COLOR_KEYS.find((k) => COLOR_ID_MAP[k] === asNum);
    if (byId) return byId;
  }

  // 한글 label
  return COLOR_KEYS.find((k) => COLOR_MAP[k].label === trimmed) ?? null;
}

// ── 칩 정규화 ──────────────────────────────────────────────
function toChip(label: string, value?: string, direct?: boolean, action?: Chip['action']): Chip {
  const isDirect = direct === true || DIRECT_LABELS.some((d) => label.includes(d));
  let resolvedValue = value ?? label;
  let resolvedAction = action;

  // n8n이 action을 안 박아 보낼 때 라벨로 보강(응답에 action 있으면 그대로 우선).
  // 신 spec(STEP 7/8): 게시하기→publish, 임시저장→save-draft, 다시 처음부터→restart,
  // 조금 더 대화→refine. "좋아"/"직접 수정하기"는 매핑 없이 n8n에 그대로 전송.
  if (!resolvedAction) {
    if (label.includes('게시')) {
      resolvedAction = 'publish';
    } else if (label.includes('임시저장')) {
      resolvedAction = 'save-draft';
    } else if (label.includes('다시 처음부터')) {
      resolvedAction = 'restart';
    } else if (label.includes('조금 더 대화')) {
      resolvedAction = 'refine';
      resolvedValue = '__refine__'; // 기존 refine 분기 그대로 타게
    }
  }

  const chip: Chip = { label, value: resolvedValue, direct: isDirect };
  if (resolvedAction) chip.action = resolvedAction;
  return chip;
}

function normalizeChips(raw: unknown): Chip[] | null {
  if (!Array.isArray(raw)) return null;
  const chips: Chip[] = [];
  for (const item of raw) {
    if (typeof item === 'string') {
      const label = item.trim();
      if (label) chips.push(toChip(label));
    } else if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>;
      const label = typeof o.label === 'string' ? o.label.trim() : '';
      if (!label) continue;
      const value = typeof o.value === 'string' ? o.value : undefined;
      const direct = o.direct === true;
      const action = isChipAction(o.action) ? o.action : undefined;
      chips.push(toChip(label, value, direct, action));
    }
  }
  return chips.length > 0 ? chips : null;
}

function isChipAction(v: unknown): v is NonNullable<Chip['action']> {
  return (
    v === 'publish' ||
    v === 'decline' ||
    v === 'refine' ||
    v === 'edit' ||
    v === 'restart' ||
    v === 'save-draft'
  );
}

// ── post 색상 정규화 ───────────────────────────────────────
// color / colorId / colorKey / freeColorName 어떤 키로 와도 colorKey(ColorKey)로 정규화.
function buildPost(raw: unknown): ColorMatePost | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;

  const title = typeof p.title === 'string' ? p.title : '';
  const content = typeof p.content === 'string' ? p.content : '';
  if (!title && !content) return null;

  const freeColorName = typeof p.freeColorName === 'string' ? p.freeColorName : undefined;

  // 우선순위: colorKey > color > colorId > freeColorName
  // 색을 못 잡아도 title/content/freeColorName은 살리고 colorKey=null로 둔다.
  const candidates = [p.colorKey, p.color, p.colorId, p.freeColorName];
  let colorKey: ColorKey | null = null;
  for (const c of candidates) {
    if (typeof c === 'string' || typeof c === 'number') {
      colorKey = resolveColorKey(c);
      if (colorKey) break;
    }
  }

  const post: ColorMatePost = { title, content, colorKey };
  if (freeColorName) post.freeColorName = freeColorName;
  return post;
}

// ── 대괄호 칩 폴백 파서 ─────────────────────────────────────
// 자유 텍스트 응답에서 "[칩]" 형태를 추출. direct 칩이 없으면 입력창 비활성.
export function parseBracketChips(text: string): AgentTurn {
  const chipRegex = /\[([^\]]+)\]/g;
  const chips: Chip[] = [];
  let m: RegExpExecArray | null;
  while ((m = chipRegex.exec(text)) !== null) {
    const label = m[1].trim();
    if (label) chips.push(toChip(label));
  }

  const cleaned = text
    .replace(chipRegex, '')
    .replace(DIRECT_INPUT_HINT, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const hasChips = chips.length > 0;
  const hasDirect = chips.some((c) => c.direct);
  // 칩이 있는데 direct 칩이 없으면 자유 입력 비활성.
  const inputEnabled = hasChips ? hasDirect : true;

  return {
    text: cleaned,
    chips: hasChips ? chips : null,
    inputEnabled,
    allowDirectInput: inputEnabled,
    post: null,
    phase: 'chat',
  };
}

// ── 응답 정규화 ────────────────────────────────────────────
export function normalizeAgentResponse(raw: unknown): AgentTurn {
  // n8n은 배열로 감싸 보내는 경우가 있다.
  if (Array.isArray(raw)) {
    return normalizeAgentResponse(raw[0]);
  }

  if (typeof raw === 'string') {
    return parseBracketChips(raw);
  }

  if (!raw || typeof raw !== 'object') {
    return emptyTurn();
  }

  const r = raw as Record<string, unknown>;

  // 구조화 JSON: { message, chips?, inputEnabled?, post?, phase? }
  if (typeof r.message === 'string') {
    const chips = normalizeChips(r.chips);
    const post = buildPost(r.post);
    const hasDirect = chips ? chips.some((c) => c.direct) : false;
    const inputEnabled =
      typeof r.inputEnabled === 'boolean'
        ? r.inputEnabled
        : chips
          ? hasDirect
          : true;
    return {
      text: r.message,
      chips,
      inputEnabled,
      allowDirectInput: hasDirect || inputEnabled,
      post,
      phase: typeof r.phase === 'string' ? r.phase : 'chat',
    };
  }

  // output / text 문자열 폴백
  const fallbackText =
    typeof r.output === 'string'
      ? r.output
      : typeof r.text === 'string'
        ? r.text
        : '';
  if (fallbackText) return parseBracketChips(fallbackText);

  return emptyTurn();
}

function emptyTurn(): AgentTurn {
  return {
    text: '',
    chips: null,
    inputEnabled: true,
    allowDirectInput: true,
    post: null,
    phase: 'unknown',
  };
}

// ── 에이전트 턴 요청 ───────────────────────────────────────
export async function requestAgentTurn(params: {
  sessionId: string;
  chatInput: string;
}): Promise<AgentTurn> {
  if (!WEBHOOK_URL) {
    throw new Error('VITE_COLORMATE_WEBHOOK_URL is not configured');
  }

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: params.sessionId,
        chatInput: params.chatInput,
        action: 'sendMessage',
      }),
    });
    if (!res.ok) {
      throw new Error(`Color Mate webhook responded ${res.status}`);
    }
    const raw: unknown = await res.json();
    return normalizeAgentResponse(raw);
  } catch (err) {
    console.error('requestAgentTurn failed', err);
    throw err;
  }
}
