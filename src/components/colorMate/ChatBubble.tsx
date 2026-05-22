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
        width: 'fit-content',
        maxWidth: '80%',
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
