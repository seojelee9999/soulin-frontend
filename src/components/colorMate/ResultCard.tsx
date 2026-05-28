import { useState } from 'react';
import { COLOR_MAP, type ColorKey } from '../../types';
import type { ColorMatePost } from '../../types/colorMate';
import { resolveColorKey } from '../../api/colorMate';
import AgentAvatar from './AgentAvatar';

// 카드 푸터에 표시할 정식 한글 색명(음차 X).
// COLOR_MAP.label은 음차("라이트 그린" 등)라 재사용하지 않고 여기서 직접 정의.
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

interface Props {
  post: ColorMatePost;
  resolving?: boolean; // 색 폴백(recommendColors) 진행 중
}

// colorKey가 있으면 "freeColorName · 가장 가까운 {label}" / 자유색만 있으면 freeColorName,
// 둘 다 없으면 빈 문자열.
function footerText(post: ColorMatePost): string {
  // raw colorKey가 음차("light green") 등으로 와도 정규화로 흡수해 정식 한글 라벨로.
  const key = post.colorKey ? resolveColorKey(post.colorKey) : null;
  if (key) {
    const label = COLOR_LABEL_KO[key];
    return post.freeColorName ? `${post.freeColorName} · 가장 가까운 ${label}` : label;
  }
  return post.freeColorName ?? '';
}

export default function ResultCard({ post, resolving }: Props) {
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
      {(resolving || footer) && (
        <div className="px-5 pb-4">
          <span className="text-xs" style={{ color: '#8a8a8a' }}>
            {resolving ? '어울리는 색을 분석하고 있어요…' : footer}
          </span>
        </div>
      )}
    </div>
  );
}
