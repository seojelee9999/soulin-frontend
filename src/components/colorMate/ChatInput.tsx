import { useRef, useEffect, useLayoutEffect } from 'react';

interface Props {
  enabled: boolean;
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  autoFocus?: boolean;
}

// textarea 자체 폰트 기준 em — text-sm + leading-relaxed에서 약 5줄 + 여유.
// 그 이상은 내부 스크롤. (line-height 1.625 × 5 ≈ 8.1em)
const MAX_INPUT_HEIGHT = '8.5em';

export default function ChatInput({ enabled, value, onChange, onSend, autoFocus }: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 입력창이 열리고(autoFocus) 활성화되면 포커스
  useEffect(() => {
    if (enabled && autoFocus) inputRef.current?.focus();
  }, [enabled, autoFocus]);

  // 자동 grow: value 바뀔 때마다 height를 auto로 reset 후 scrollHeight로 set.
  // CSS maxHeight에 막혀 5줄 넘으면 내부 스크롤로 떨어진다.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const canSend = enabled && value.trim().length > 0;

  return (
    <div className="flex items-end gap-2 px-4 py-3 bg-white">
      <textarea
        ref={inputRef}
        rows={1}
        value={value}
        disabled={!enabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // 엔터=전송, Shift+엔터=줄바꿈, 한글 IME 조합 중 엔터는 전송 안 함(조합 확정용 보호)
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (canSend) onSend();
          }
        }}
        placeholder={enabled ? '자유롭게 입력해주세요' : '선택지를 골라주세요'}
        className="flex-1 outline-none bg-transparent text-sm leading-relaxed py-[7px] min-h-[36px]"
        style={{
          color: '#131416',
          resize: 'none',
          overflowY: 'auto',
          maxHeight: MAX_INPUT_HEIGHT,
        }}
      />
      <button
        type="button"
        onClick={() => canSend && onSend()}
        disabled={!canSend}
        aria-label="전송"
        className="shrink-0 flex items-center justify-center rounded-full transition-colors"
        style={{ width: 36, height: 36, backgroundColor: canSend ? '#2b2b2b' : '#e6e6e6' }}
      >
        <UpArrowIcon active={canSend} />
      </button>
    </div>
  );
}

function UpArrowIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 13V3M8 3L3 8M8 3L13 8"
        stroke={active ? '#ffffff' : '#aaaaaa'}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
