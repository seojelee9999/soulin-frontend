import { useState, useEffect, useCallback, useRef } from 'react';
import type { AgentTurn, Chip, ChatMessage, ColorMatePost } from '../../types/colorMate';
// 2단계: 목 어댑터. 4단계에서 '../../api/colorMate'의 requestAgentTurn으로 교체.
import { mockRequestAgentTurn } from './mockAgent';

interface Options {
  onEditInWriter?: (post: ColorMatePost | null) => void;
}

function makeSessionId(): string {
  const userId = localStorage.getItem('soul_in_user_id');
  if (userId) return `colormate-${userId}`;
  return `colormate-${Math.random().toString(36).slice(2, 10)}`;
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useColorMateChat(options?: Options) {
  const onEditInWriter = options?.onEditInWriter;
  const sessionIdRef = useRef<string>(makeSessionId());

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [turn, setTurn] = useState<AgentTurn | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [typing, setTyping] = useState(true); // 첫 턴 로딩 표시
  const [directMode, setDirectMode] = useState(false);
  const [currentPost, setCurrentPost] = useState<ColorMatePost | null>(null);

  // 어댑터 턴을 메시지/상태에 반영. 응답마다 directMode 리셋, post 있으면 currentPost 갱신.
  const applyTurn = useCallback((t: AgentTurn) => {
    const msg: ChatMessage = {
      id: uid(),
      role: 'agent',
      text: t.text,
      ts: new Date().toISOString(),
      post: t.post ?? undefined,
    };
    setMessages((prev) => [...prev, msg]);
    setTurn(t);
    setPicked(null);
    setDirectMode(false);
    if (t.post) setCurrentPost(t.post);
  }, []);

  // 어댑터 호출 없이 로컬 agent 메시지만 추가(목 게시/거절/안내). 입력은 잠금.
  const pushLocalAgent = useCallback((text: string) => {
    const msg: ChatMessage = { id: uid(), role: 'agent', text, ts: new Date().toISOString() };
    setMessages((prev) => [...prev, msg]);
    setTurn({ text, chips: null, inputEnabled: false, allowDirectInput: false, post: null, phase: 'local' });
    setPicked(null);
    setDirectMode(false);
  }, []);

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
        const t = await mockRequestAgentTurn({ sessionId: sessionIdRef.current, chatInput: text });
        applyTurn(t);
      } catch (err) {
        console.error('colorMate send failed', err);
        pushLocalAgent('앗, 잠시 문제가 생겼어. 다시 시도해줘.');
      } finally {
        setTyping(false);
      }
    },
    [applyTurn, pushLocalAgent],
  );

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
          pushLocalAgent('피드에 게시했어! 🎉'); // 실게시는 4단계
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
            onEditInWriter(currentPost); // 실라우팅은 3/4단계
          } else {
            pushLocalAgent('글작성 페이지로 이동할게. (연결 예정)');
          }
          return;
        default:
          void send(chip.value, chip.label);
      }
    },
    [send, pushLocalAgent, onEditInWriter, currentPost],
  );

  // 마운트 시 첫 턴 자동 요청 (cancelled 플래그 패턴)
  useEffect(() => {
    let cancelled = false;
    mockRequestAgentTurn({ sessionId: sessionIdRef.current, chatInput: '' })
      .then((t) => {
        if (!cancelled) applyTurn(t);
      })
      .catch((err) => {
        if (!cancelled) console.error('colorMate init failed', err);
      })
      .finally(() => {
        if (!cancelled) setTyping(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applyTurn]);

  return { messages, turn, picked, typing, directMode, currentPost, send, onChip };
}
