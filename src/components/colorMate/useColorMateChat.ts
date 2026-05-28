import { useState, useEffect, useCallback, useRef } from 'react';
import type { AgentTurn, Chip, ChatMessage, ColorMatePost } from '../../types/colorMate';
import { COLOR_ID_MAP } from '../../types';
// 대화 어댑터: 목(개발) / 실 n8n(VITE_COLORMATE_WEBHOOK_URL 채우면).
import { mockRequestAgentTurn } from './mockAgent';
import { requestAgentTurn } from '../../api/colorMate';
// 4a: 게시/색 폴백은 실제 백엔드 연결.
import { createPost, publishPost, recommendColors } from '../../api/posts';
import { formatModerationReason } from '../../constants/moderation';

// ── 목 ↔ 실 n8n 스위치 ─────────────────────────────────────
// USE_MOCK=true 강제 또는 webhook URL이 비어 있으면 목으로 떨어진다(현재 동작 보존).
// URL을 .env에 채우고 VITE_COLORMATE_USE_MOCK을 끄면 실연동.
const USE_MOCK =
  import.meta.env.VITE_COLORMATE_USE_MOCK === 'true' ||
  !import.meta.env.VITE_COLORMATE_WEBHOOK_URL;

if (import.meta.env.DEV) {
  console.info(`[ColorMate] agent source: ${USE_MOCK ? 'mock' : 'real(n8n)'}`);
}

function callAgent(params: { sessionId: string; chatInput: string }): Promise<AgentTurn> {
  return USE_MOCK ? mockRequestAgentTurn(params) : requestAgentTurn(params);
}

interface Options {
  onEditInWriter?: (post: ColorMatePost | null) => void;
  onPublished?: (postId: string) => void;
}

function makeSessionId(): string {
  const userId = localStorage.getItem('soul_in_user_id');
  // 매 마운트(=매 진입)마다 새 세션 → n8n 메모리가 이어지지 않고 항상 첫 인사부터
  if (userId) return `colormate-${userId}-${Date.now()}`;
  return `colormate-${Math.random().toString(36).slice(2, 10)}`;
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useColorMateChat(options?: Options) {
  const onEditInWriter = options?.onEditInWriter;
  const onPublished = options?.onPublished;
  const sessionIdRef = useRef<string>(makeSessionId());

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [turn, setTurn] = useState<AgentTurn | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [typing, setTyping] = useState(true); // 첫 턴 로딩 표시
  const [directMode, setDirectMode] = useState(false);
  const [currentPost, setCurrentPost] = useState<ColorMatePost | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [resolvingMsgId, setResolvingMsgId] = useState<string | null>(null);

  // 어댑터 호출 없이 로컬 agent 메시지만 추가(게시 결과/안내). 입력은 잠금.
  const pushLocalAgent = useCallback((text: string) => {
    const msg: ChatMessage = { id: uid(), role: 'agent', text, ts: new Date().toISOString() };
    setMessages((prev) => [...prev, msg]);
    setTurn({ text, chips: null, inputEnabled: false, allowDirectInput: false, post: null, phase: 'local' });
    setPicked(null);
    setDirectMode(false);
  }, []);

  // 실호출 실패 등 회복 가능한 에러: 안내 + 입력창 열어 재시도 가능(막다른 길 금지).
  const pushRetryableError = useCallback(() => {
    const text = '잠깐 문제가 생겼어. 다시 시도해줄래?';
    const msg: ChatMessage = { id: uid(), role: 'agent', text, ts: new Date().toISOString() };
    setMessages((prev) => [...prev, msg]);
    setTurn({ text, chips: null, inputEnabled: true, allowDirectInput: true, post: null, phase: 'error' });
    setPicked(null);
    setDirectMode(true);
  }, []);

  // 색 폴백: colorKey가 null이면 recommendColors(content)의 colors[0]로 채운다.
  const resolveColorFallback = useCallback(async (msgId: string, post: ColorMatePost) => {
    setResolvingMsgId(msgId);
    try {
      const res = await recommendColors(post.content);
      const key = res.colors[0];
      if (key) {
        const filled: ColorMatePost = { ...post, colorKey: key };
        setCurrentPost(filled);
        setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, post: filled } : m)));
      }
    } catch (err) {
      console.error('colorMate color fallback failed', err);
    } finally {
      setResolvingMsgId(null);
    }
  }, []);

  // 어댑터 턴을 메시지/상태에 반영. post 있으면 currentPost 갱신, colorKey null이면 색 폴백.
  const applyTurn = useCallback(
    (t: AgentTurn) => {
      const msgId = uid();
      const msg: ChatMessage = {
        id: msgId,
        role: 'agent',
        text: t.text,
        ts: new Date().toISOString(),
        post: t.post ?? undefined,
      };
      setMessages((prev) => [...prev, msg]);
      setTurn(t);
      setPicked(null);
      setDirectMode(false);
      if (t.post) {
        setCurrentPost(t.post);
        if (t.post.colorKey === null) {
          void resolveColorFallback(msgId, t.post);
        }
      }
    },
    [resolveColorFallback],
  );

  const send = useCallback(
    async (text: string, label?: string) => {
      const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        text: label ?? text,
        ts: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setPicked(label ?? text);
      setTyping(true);
      try {
        const t = await callAgent({ sessionId: sessionIdRef.current, chatInput: text });
        applyTurn(t);
      } catch (err) {
        console.error('colorMate send failed', err);
        pushRetryableError();
      } finally {
        setTyping(false);
      }
    },
    [applyTurn, pushRetryableError],
  );

  // 실제 게시: createPost(isPublic:true) → publishPost. 기존 작성→게시 흐름과 동일.
  const publishCurrentPost = useCallback(async () => {
    if (publishing) return;
    const post = currentPost;
    if (!post || !post.colorKey) {
      pushLocalAgent('앗, 색이 아직 정해지지 않았어. 잠시 후 다시 시도해줘.');
      return;
    }
    setPublishing(true);
    try {
      const created = await createPost({
        title: post.title,
        content: post.content,
        colorId: COLOR_ID_MAP[post.colorKey],
        isPublic: true,
      });
      const result = await publishPost(created.id);
      if (result.status === 'REJECTED') {
        // 반려 후 막다른 길 방지: 사유 안내 + 회복 칩 턴(edit/refine은 기존 onChip 분기 재사용)
        const reason = formatModerationReason(result.moderationReason);
        applyTurn({
          text: reason
            ? `게시할 수 없는 내용이에요.\n사유: ${reason}`
            : '게시할 수 없는 내용이에요.',
          chips: [
            { label: '직접 수정하기', value: '직접 수정하기', action: 'edit' },
            { label: '조금 더 대화하고 수정하기', value: '__refine__', action: 'refine' },
          ],
          inputEnabled: false,
          allowDirectInput: false,
          post: null,
          phase: 'rejected',
        });
      } else {
        pushLocalAgent('피드에 게시했어! 🎉');
        onPublished?.(created.id);
      }
    } catch (err) {
      console.error('colorMate publish failed', err);
      pushLocalAgent('게시 중 문제가 생겼어. 잠시 후 다시 시도해줘.');
    } finally {
      setPublishing(false);
    }
  }, [publishing, currentPost, pushLocalAgent, onPublished, applyTurn]);

  const onChip = useCallback(
    (chip: Chip) => {
      // direct 칩: 전송하지 않고 입력창만 연다(포커스는 ChatInput이 처리)
      if (chip.direct) {
        setPicked(chip.value);
        setDirectMode(true);
        return;
      }
      switch (chip.action) {
        case 'publish':
          setPicked(chip.value);
          void publishCurrentPost(); // 실 게시
          return;
        case 'decline':
          setPicked(chip.value);
          pushLocalAgent('알겠어! 그럼 게시하지 않을게. 언제든 다시 불러줘.');
          return;
        case 'refine':
          void send('__refine__', chip.label);
          return;
        case 'edit':
          setPicked(chip.value);
          if (onEditInWriter) {
            onEditInWriter(currentPost); // /write prefill 이동
          } else {
            pushLocalAgent('글작성 페이지로 이동할게. (연결 예정)');
          }
          return;
        default:
          void send(chip.value, chip.label);
      }
    },
    [send, pushLocalAgent, onEditInWriter, currentPost, publishCurrentPost],
  );

  // 마운트 시 첫 턴 자동 요청 (cancelled 플래그 패턴)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.info(`[ColorMate] sessionId: ${sessionIdRef.current}`);
    }
    let cancelled = false;
    callAgent({ sessionId: sessionIdRef.current, chatInput: '' })
      .then((t) => {
        if (!cancelled) applyTurn(t);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('colorMate init failed', err);
          pushRetryableError();
        }
      })
      .finally(() => {
        if (!cancelled) setTyping(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applyTurn, pushRetryableError]);

  return {
    messages,
    turn,
    picked,
    typing,
    directMode,
    currentPost,
    publishing,
    resolvingMsgId,
    send,
    onChip,
  };
}
