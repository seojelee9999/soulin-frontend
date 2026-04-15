import { useRef, useEffect } from 'react';
import { COLOR_KEYS, COLOR_MAP, type ColorKey } from '../../types';

interface Props {
  active: ColorKey | null;
  onChange: (color: ColorKey | null) => void;
}

// 무지개 그라데이션 — "전체" 버튼용
const RAINBOW =
  'conic-gradient(from 0deg, #ef4444, #f97316, #eab308, #22c55e, #06b6d4, #3b82f6, #a855f7, #ec4899, #ef4444)';

const DOT_SIZE = 36; // 기본 크기
const DOT_ACTIVE_SIZE = 40; // 선택 시 크기

export default function ColorTabBar({ active, onChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current?.querySelector('[data-active="true"]') as HTMLElement | null;
    el?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
  }, [active]);

  return (
    <div
      ref={scrollRef}
      className="flex items-center gap-2.5 px-4 pb-3 shrink-0 overflow-x-auto scrollbar-none"
    >
      {/* 전체 — 무지개 원 */}
      <button
        data-active={active === null}
        onClick={() => onChange(null)}
        aria-label="전체"
        className="shrink-0 relative flex items-center justify-center active:scale-90 transition-all duration-200"
        style={{
          width: active === null ? DOT_ACTIVE_SIZE : DOT_SIZE,
          height: active === null ? DOT_ACTIVE_SIZE : DOT_SIZE,
        }}
      >
        <span
          className="block w-full h-full rounded-full"
          style={{ background: RAINBOW }}
        />
        {active === null && (
          <span
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: '0 0 0 2.5px white, 0 0 0 4.5px rgba(0,0,0,0.25)' }}
          />
        )}
      </button>

      {/* 색상 원 12개 */}
      {COLOR_KEYS.map((key) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            data-active={isActive}
            onClick={() => onChange(key)}
            aria-label={COLOR_MAP[key].label}
            className="shrink-0 relative flex items-center justify-center active:scale-90 transition-all duration-200"
            style={{
              width: isActive ? DOT_ACTIVE_SIZE : DOT_SIZE,
              height: isActive ? DOT_ACTIVE_SIZE : DOT_SIZE,
            }}
          >
            <span
              className="block w-full h-full rounded-full"
              style={{ backgroundColor: COLOR_MAP[key].hex }}
            />
            {isActive && (
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  boxShadow: `0 0 0 2.5px white, 0 0 0 4.5px ${COLOR_MAP[key].hex}`,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
