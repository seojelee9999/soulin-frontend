import { useRef, useEffect } from 'react';

interface Props {
  enabled: boolean;
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  autoFocus?: boolean;
}

export default function ChatInput({ enabled, value, onChange, onSend, autoFocus }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  // 입력창이 열리고(autoFocus) 활성화되면 포커스
  useEffect(() => {
    if (enabled && autoFocus) inputRef.current?.focus();
  }, [enabled, autoFocus]);

  const canSend = enabled && value.trim().length > 0;

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-white">
      <input
        ref={inputRef}
        value={value}
        disabled={!enabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && canSend) onSend();
        }}
        placeholder={enabled ? '자유롭게 입력해주세요' : '선택지를 골라주세요'}
        className="flex-1 outline-none bg-transparent text-sm"
        style={{ color: '#131416' }}
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
