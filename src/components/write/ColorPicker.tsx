import { useEffect, useRef, useCallback } from 'react';
import { COLOR_MAP, COLOR_KEYS, type ColorKey } from '../../types';

const ITEM_BOX = 60;
const GAP = 0;
const ACTIVE_DIAMETER = 50;
const INACTIVE_DIAMETER = 24;
const TRACK_HEIGHT = 80;
const SETS = 3;
const COUNT = COLOR_KEYS.length;
const TOTAL = SETS * COUNT;
const MIDDLE_OFFSET = COUNT; // 12 — middle set의 첫 인덱스
const SET_SHIFT = COUNT * (ITEM_BOX + GAP); // 한 set 만큼 시프트할 픽셀
const SETTLE_DELAY = 120;

interface Props {
  value: ColorKey;
  onChange: (color: ColorKey) => void;
}

export default function ColorPicker({ value, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const lastSetByPickerRef = useRef<ColorKey | null>(null);
  const isFirstRunRef = useRef(true);
  const settleTimeoutRef = useRef<number | null>(null);

  // value 외부 변경 시 가운데 set의 해당 색으로 스크롤
  useEffect(() => {
    if (lastSetByPickerRef.current === value) {
      lastSetByPickerRef.current = null;
      return;
    }
    const idx = COLOR_KEYS.indexOf(value);
    if (idx < 0) return;
    const el = itemRefs.current[MIDDLE_OFFSET + idx];
    if (!el) return;
    el.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: isFirstRunRef.current ? 'auto' : 'smooth',
    });
    isFirstRunRef.current = false;
  }, [value]);

  const handleScroll = useCallback(() => {
    if (settleTimeoutRef.current != null) window.clearTimeout(settleTimeoutRef.current);
    settleTimeoutRef.current = window.setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;
      const cRect = container.getBoundingClientRect();
      const cCenter = cRect.left + cRect.width / 2;

      let closestIdx = -1;
      let minDist = Infinity;
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const itemCenter = r.left + r.width / 2;
        const dist = Math.abs(itemCenter - cCenter);
        if (dist < minDist) {
          minDist = dist;
          closestIdx = i;
        }
      });
      if (closestIdx < 0) return;

      const closestKey = COLOR_KEYS[closestIdx % COUNT];
      if (closestKey !== value) {
        lastSetByPickerRef.current = closestKey;
        onChange(closestKey);
      }

      // 사용자가 set 0 또는 set 2에서 멈췄으면 가운데 set의 같은 위치로 silent jump
      if (closestIdx < MIDDLE_OFFSET) {
        container.scrollLeft += SET_SHIFT;
      } else if (closestIdx >= MIDDLE_OFFSET + COUNT) {
        container.scrollLeft -= SET_SHIFT;
      }
    }, SETTLE_DELAY);
  }, [value, onChange]);

  const handleClick = (instanceIdx: number, key: ColorKey) => {
    if (key !== value) {
      lastSetByPickerRef.current = key;
      onChange(key);
    }
    const el = itemRefs.current[instanceIdx];
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex items-center overflow-x-auto scrollbar-none"
      style={{
        height: TRACK_HEIGHT,
        scrollSnapType: 'x mandatory',
        gap: GAP,
        paddingInline: `calc(50% - ${ITEM_BOX / 2}px)`,
      }}
    >
      {Array.from({ length: TOTAL }).map((_, i) => {
        const key = COLOR_KEYS[i % COUNT];
        const isActive = key === value;
        const diameter = isActive ? ACTIVE_DIAMETER : INACTIVE_DIAMETER;
        const c = COLOR_MAP[key];
        const fillColor = isActive ? c.main : c.soft;
        return (
          <button
            key={i}
            ref={(el) => { itemRefs.current[i] = el; }}
            onClick={() => handleClick(i, key)}
            className="shrink-0 flex items-center justify-center rounded-full"
            style={{
              width: ITEM_BOX,
              height: ITEM_BOX,
              scrollSnapAlign: 'center',
            }}
            aria-label={c.label}
          >
            <span
              className="block rounded-full transition-[width,height] duration-150"
              style={{
                width: diameter,
                height: diameter,
                backgroundColor: fillColor,
                boxShadow: isActive ? `0 0 0 3px white, 0 0 0 5px ${c.main}` : 'none',
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
