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

export default function ColorMatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const { messages, turn, picked, typing, directMode, publishing, resolvingMsgId, send, onChip } =
    useColorMateChat({
      // 게시 성공 시 피드로 이동
      onPublished: () => navigate('/', { replace: true }),
      // 임시저장 후 마이페이지로 이동
      onSavedDraft: () => navigate('/mypage'),
    });
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

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
    </div>
  );
}
