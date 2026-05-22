import { useState } from 'react';
import { COLOR_MAP } from '../../types';
import type { ColorMatePost } from '../../types/colorMate';
import AgentAvatar from './AgentAvatar';

interface Props {
  post: ColorMatePost;
}

// colorKey가 있으면 "freeColorName · 가장 가까운 {label}" / 자유색만 있으면 freeColorName,
// 둘 다 없으면 빈 문자열.
function footerText(post: ColorMatePost): string {
  if (post.colorKey) {
    const label = COLOR_MAP[post.colorKey].label;
    return post.freeColorName ? `${post.freeColorName} · 가장 가까운 ${label}` : label;
  }
  return post.freeColorName ?? '';
}

export default function ResultCard({ post }: Props) {
  const [opened, setOpened] = useState(false);
  // colorKey 없으면 회색 중립 accent
  const accent = post.colorKey ? COLOR_MAP[post.colorKey].main : '#d8d8d8';

  if (!opened) {
    return (
      <button
        type="button"
        onClick={() => setOpened(true)}
        className="w-full flex flex-col items-center gap-3 rounded-2xl px-5 py-8 active:scale-[0.98] transition-transform"
        style={{ background: '#f3f3f3' }}
      >
        <AgentAvatar size={40} />
        <p className="text-sm text-gray-500 text-center leading-relaxed">
          글 작성이 완료 되었습니다.
          <br />
          텍스트 박스를 클릭해 주세요.
        </p>
      </button>
    );
  }

  const footer = footerText(post);

  return (
    <div
      className="w-full rounded-2xl overflow-hidden"
      style={{ border: `2px solid ${accent}`, background: '#ffffff' }}
    >
      <div className="px-5 pt-5 pb-4">
        <h3 className="text-base font-bold mb-3" style={{ color: '#131416' }}>
          {post.title}
        </h3>
        <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: '#5e5e5e' }}>
          {post.content}
        </p>
      </div>
      {footer && (
        <div className="px-5 pb-4">
          <span className="text-xs" style={{ color: '#8a8a8a' }}>
            {footer}
          </span>
        </div>
      )}
    </div>
  );
}
