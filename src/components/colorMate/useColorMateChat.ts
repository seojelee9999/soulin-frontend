import { useState, useEffect, useCallback, useRef } from 'react';
import type { AgentTurn, Chip, ChatMessage, ColorMatePost } from '../../types/colorMate';
import { COLOR_ID_MAP } from '../../types';
// 대화 어댑터: 목(개발) / 실 n8n(VITE_COLORMATE_WEBHOOK_URL 채우면).
import { mockRequestAgentTurn } from './mockAgent';
import { requestAgentTurn, toChip } from '../../api/colorMate';
// 4a: 게시/색 폴백은 실제 백엔드 연결.
import { createPost, publishPost, recommendColors } from '../../api/posts';
import { formatModerationReason } from '../../constants/moderation';
import { useDraft } from '../../context/DraftContext';

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
  onPublished?: (postId: string) => void;
  onSavedDraft?: () => void;
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
  const onPublished = options?.onPublished;
  const onSavedDraft = options?.onSavedDraft;
  const { saveDraft } = useDraft();
  const sessionIdRef = useRef<string>(makeSessionId());
  // StrictMode dev double-invoke로 mount effect가 2번 실행되어 첫 인사가 중복되는 것 방어
  const didInitRef = useRef(false);
  // publish 실패 → retry/save-draft 재시도용. 시도 직전 post 보관, 성공 시 클리어.
  const pendingPublishPostRef = useRef<ColorMatePost | null>(null);

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
    // retry 시 ref에 박힌 post를 우선 사용 (첫 시도면 currentPost)
    const post = pendingPublishPostRef.current ?? currentPost;
    if (!post || !post.colorKey) {
      pushLocalAgent('앗, 색이 아직 정해지지 않았어. 잠시 후 다시 시도해줘.');
      return;
    }
    pendingPublishPostRef.current = post; // 시도 직전 보관 (실패 시 retry/save-draft가 동일 payload 사용)
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
        pendingPublishPostRef.current = null; // 성공: pending 클리어
        pushLocalAgent('피드에 게시했어! 🎉');
        onPublished?.(created.id);
      }
    } catch (err) {
      console.error('colorMate publish failed', err);
      // 실 실패(네트워크/403/500 등) — 회복 칩 emit. REJECTED 패턴(applyTurn 직접 호출)과 동일 메커니즘.
      // pendingPublishPostRef는 유지 → retry/임시저장이 동일 payload 사용.
      applyTurn({
        text: '게시 중 문제가 생겼어. 다시 시도해볼래?',
        chips: [toChip('다시 시도하기'), toChip('임시저장')],
        inputEnabled: false,
        allowDirectInput: false,
        post: null,
        phase: 'publish-error',
      });
    } finally {
      setPublishing(false);
    }
  }, [publishing, currentPost, pushLocalAgent, onPublished, applyTurn]);

  // 임시저장: DraftContext에 저장 후 안내 + /mypage 이동(콜백)
  const saveDraftPost = useCallback(() => {
    // publish 실패 후 회복 칩의 임시저장이면 pending payload 우선
    const post = pendingPublishPostRef.current ?? currentPost;
    if (!post) {
      pushLocalAgent('앗, 저장할 글이 아직 없어.');
      return;
    }
    try {
      saveDraft(post.title, post.content, post.colorKey ?? null);
      pendingPublishPostRef.current = null; // 성공: pending 클리어
      pushLocalAgent('임시저장했어! 마이페이지 > 작성한 글에서 볼 수 있어.');
      onSavedDraft?.();
    } catch (err) {
      console.error('colorMate saveDraft failed', err);
      pushLocalAgent('임시저장 중 문제가 생겼어. 잠시 후 다시 시도해줘.');
    }
  }, [currentPost, saveDraft, pushLocalAgent, onSavedDraft]);

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
        case 'save-draft':
          setPicked(chip.value);
          saveDraftPost();
          return;
        case 'restart':
          // 새 마운트 = 새 sessionId = 새 대화(첫 인사부터)
          window.location.reload();
          return;
        case 'decline':
          setPicked(chip.value);
          pushLocalAgent('알겠어! 그럼 게시하지 않을게. 언제든 다시 불러줘.');
          return;
        case 'refine':
          void send('__refine__', chip.label);
          return;
        default:
          // 회복 칩 "다시 시도하기"는 toChip이 value '__retry_publish__'를 박음
          // (action union 확장 없이 value 분기로 처리)
          if (chip.value === '__retry_publish__') {
            setPicked(chip.value);
            void publishCurrentPost();
            return;
          }
          // "좋아"/"직접 수정하기" 등 — 그대로 n8n에 전송
          void send(chip.value, chip.label);
      }
    },
    [send, pushLocalAgent, publishCurrentPost, saveDraftPost],
  );

  // 마운트 시 첫 턴 자동 요청 (cancelled 플래그 패턴)
  useEffect(() => {
    // didInitRef로 mount-time idempotent 보장 → StrictMode 두 번째 setup도 막힘.
    // cleanup의 cancelled 가드를 따로 두면 StrictMode 1차 fetch가 cleanup으로 cancelled=true가 되어
    // applyTurn이 호출 안 되고 응답이 손실됨(typing만 남음). 그래서 cancelled 가드 제거.
    if (didInitRef.current) return;
    didInitRef.current = true;
    if (import.meta.env.DEV) {
      console.info(`[ColorMate] sessionId: ${sessionIdRef.current}`);
    }
    callAgent({ sessionId: sessionIdRef.current, chatInput: '' })
      .then((t) => applyTurn(t))
      .catch((err) => {
        console.error('colorMate init failed', err);
        pushRetryableError();
      })
      .finally(() => setTyping(false));
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
