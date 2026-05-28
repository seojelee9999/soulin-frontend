import type { ReactNode } from 'react';
import type { ChatRole } from '../../types/colorMate';

interface Props {
  role: ChatRole;
  children: ReactNode;
}

export default function ChatBubble({ role, children }: Props) {
  const isAgent = role === 'agent';
  return (
    <div
      className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
        isAgent ? 'rounded-2xl rounded-tl-md' : 'rounded-2xl rounded-tr-md'
      }`}
      style={{
        // flex-col 래퍼의 stretch를 막아 fit-content가 살아나게(짧으면 한 줄)
        alignSelf: isAgent ? 'flex-start' : 'flex-end',
        width: 'fit-content',
        minWidth: 'fit-content', // 부모 flex 안에서 width가 콘텐츠 이하로 붕괴(43px stuck)하는 것 방지
        maxWidth: '80%',
        // 한글(CJK) 어절 단위 줄바꿈: word-break normal이면 글자 단위로 끊겨 buble이 1글자로 붕괴됨
        wordBreak: 'keep-all',
        overflowWrap: 'break-word',
        padding: '10px 14px',
        backgroundColor: isAgent ? '#ffffff' : '#2b2b2b',
        color: isAgent ? '#131416' : '#ffffff',
        border: isAgent ? '1px solid #ececec' : 'none',
      }}
    >
      {children}
    </div>
  );
}
