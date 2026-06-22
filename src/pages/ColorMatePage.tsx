import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BackButton from '../components/common/BackButton';
import { useColorMateChat } from '../components/colorMate/useColorMateChat';
import AgentAvatar from '../components/colorMate/AgentAvatar';
import ChatBubble from '../components/colorMate/ChatBubble';
import TypingIndicator from '../components/colorMate/TypingIndicator';
import ChipBar from '../components/colorMate/ChipBar';
import ResultCard from '../components/colorMate/ResultCard';
import ChatInput from '../components/colorMate/ChatInput';
import { COLOR_KEYS, COLOR_MAP, type ColorKey } from '../types';

// ResultCard 내부 COLOR_LABEL_KO가 export 안 돼서 같은 정의 재선언 (정식 한글 12색)
const COLOR_LABEL_KO: Record<ColorKey, string> = {
  red: '빨강',
  orange: '주황',
  yellow: '노랑',
  lime: '연두',
  green: '초록',
  cyan: '하늘',
  blue: '파랑',
  navy: '남색',
  purple: '보라',
  pink: '분홍',
  gray: '회색',
  black: '검정',
};

export default function ColorMatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const {
    messages,
    turn,
    picked,
    typing,
    directMode,
    publishing,
    resolvingMsgId,
    currentPost,
    colorPickerOpen,
    previewColor,
    confirmColor,
    cancelColorPicker,
    send,
    onChip,
  } = useColorMateChat({
    // 게시 성공 시 피드로 이동
    onPublished: () => navigate('/', { replace: true }),
    // 임시저장 후 마이페이지로 이동
    onSavedDraft: () => navigate('/mypage'),
  });
  const [input, setInput] = useState('');
  const [tempKey, setTempKey] = useState<ColorKey | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 시트 열릴 때 tempKey를 현재 카드 색으로 초기화 (열기 시점 1회 동기화 — cascading-render 우려 없음)
  useEffect(() => {
    if (colorPickerOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTempKey(currentPost?.colorKey ?? null);
    }
  }, [colorPickerOpen, currentPost]);

  // 새 메시지/타이핑 표시 시 맨 아래로
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    void send(text);
  };

  // 입력창은 기본 잠금. direct 칩을 눌러 directMode가 켜졌거나,
  // 칩이 없는 자유 대화 턴(inputEnabled)일 때만 열린다.
  const inputOpen = directMode || (turn != null && turn.chips == null && turn.inputEnabled);

  return (
    <div className="flex flex-col h-full bg-white animate-fadeIn">
      {/* 헤더 */}
      <header className="flex items-center px-5 pt-4 pb-2 shrink-0">
        <BackButton onClick={() => (from ? navigate(from) : navigate(-1))} />
        <span
          className="flex-1 text-center text-base font-bold text-gray-900"
          style={{ marginRight: 24 }}
        >
          Color Mate
        </span>
      </header>

      {/* 채팅 영역 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-none px-4 py-3 flex flex-col gap-3"
        style={{ background: '#fafafa' }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'agent' && <AgentAvatar />}
            <div className="flex flex-col gap-2" style={{ maxWidth: '85%' }}>
              {m.text && <ChatBubble role={m.role}>{m.text}</ChatBubble>}
              {m.post && <ResultCard post={m.post} resolving={resolvingMsgId === m.id} />}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex gap-2 justify-start">
            <AgentAvatar />
            <TypingIndicator />
          </div>
        )}
      </div>

      {/* 하단: 칩바 + 입력바 (고정) */}
      <div className="shrink-0 border-t border-gray-100 bg-white pb-safe">
        {turn?.chips && turn.chips.length > 0 && (
          <ChipBar chips={turn.chips} picked={picked} disabled={typing || publishing} onPick={onChip} />
        )}
        <ChatInput
          enabled={inputOpen && !typing}
          value={input}
          onChange={setInput}
          onSend={handleSend}
          autoFocus={directMode}
        />
      </div>

      {colorPickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => { cancelColorPicker(); setTempKey(null); }}
        >
          <div
            className="w-full max-w-[430px] bg-white rounded-t-3xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base font-bold text-gray-900 mb-4 text-center">색상 변경</p>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {COLOR_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => { setTempKey(key); previewColor(key); }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span
                    className="rounded-full"
                    style={{
                      width: 44,
                      height: 44,
                      background: COLOR_MAP[key].main,
                      border: tempKey === key ? '3px solid #131416' : '2px solid #e0e0e0',
                    }}
                  />
                  <span className="text-xs text-gray-600">{COLOR_LABEL_KO[key]}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => { if (tempKey) confirmColor(tempKey); setTempKey(null); }}
              className="w-full py-3.5 rounded-full text-sm font-semibold text-white bg-gray-900"
            >
              이 색으로 할게요
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
