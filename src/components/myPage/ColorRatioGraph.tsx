import { useEffect, useState } from 'react';
import { COLOR_MAP } from '../../types/color';
import type { ColorKey } from '../../types/color';
import type { ColorRatioEntry, PeriodPreset } from '../../types/myPage';
import { fetchColorRatios } from '../../api/myPage';

interface Props {
  period: PeriodPreset;
  customRange: { startDate: string; endDate: string } | null;
}

const EN_LABELS: Record<ColorKey, string> = {
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  lime: 'Light Green',
  green: 'Green',
  cyan: 'Light Blue',
  blue: 'Blue',
  navy: 'Navy',
  purple: 'Purple',
  pink: 'Pink',
  gray: 'Grey',
  black: 'Black',
};

const TRACK_H = 140; // 트랙 픽셀 높이

export default function ColorRatioGraph({ period, customRange }: Props) {
  const [data, setData] = useState<ColorRatioEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    // custom 모드 + 범위 미선택이면 빈 배열 즉시 resolve(setData를 effect 동기 호출하지 않음 → cascading-render 회피)
    const fetchPromise: Promise<ColorRatioEntry[]> =
      period === 'custom' && !customRange
        ? Promise.resolve([])
        : period === 'custom' && customRange
          ? fetchColorRatios('custom', customRange)
          : fetchColorRatios(period);
    fetchPromise
      .then((list) => { if (!cancelled) setData(list); })
      .catch(() => { if (!cancelled) setData([]); });
    return () => { cancelled = true; };
  }, [period, customRange]);

  const maxRatio = data.length > 0 ? data[0].ratio : 1;

  return (
    <div className="mx-4 mb-6" style={{ height: 260 }}>
      <div className="flex gap-3 overflow-x-auto scrollbar-none h-full px-1 py-2">
        {data.map((e) => {
          const main = COLOR_MAP[e.color].main;
          const soft = COLOR_MAP[e.color].soft;
          const fillH = Math.max(2, Math.round((e.ratio / maxRatio) * TRACK_H));
          const pct = Math.round(e.ratio * 100);
          return (
            <div
              key={e.color}
              className="flex flex-col items-center shrink-0"
              style={{ width: 44 }}
            >
              {/* 상단 % */}
              <span style={{ fontSize: 11, color: '#8a8a8a', marginBottom: 6 }}>
                {pct}%
              </span>

              {/* 트랙 + 채움 */}
              <div
                className="relative"
                style={{
                  width: '100%',
                  height: TRACK_H,
                  background: '#f4f4f4',
                  borderRadius: 10,
                  overflow: 'hidden',
                }}
              >
                <div
                  className="absolute left-0 right-0 bottom-0"
                  style={{
                    height: fillH,
                    background: `linear-gradient(to top, ${main}, ${soft})`,
                    borderTopLeftRadius: 10,
                    borderTopRightRadius: 10,
                  }}
                />
              </div>

              {/* 하단 dot + 영문 라벨 */}
              <div className="flex flex-col items-center mt-2 gap-1" style={{ width: '100%' }}>
                <span
                  className="rounded-full shrink-0"
                  style={{ width: 8, height: 8, backgroundColor: main }}
                />
                <span
                  className="text-center leading-tight"
                  style={{ fontSize: 10, color: '#5e5e5e', wordBreak: 'keep-all' }}
                >
                  {EN_LABELS[e.color]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
