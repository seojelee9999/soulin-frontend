import { useEffect, useState } from 'react';
import { COLOR_MAP } from '../../types/color';
import type { DayColorEntry } from '../../types/myPage';
import { fetchColorCalendar } from '../../api/myPage';

interface Props {
  year: number;
  month: number;
  onSelectDate?: (date: string) => void;
}

const WEEK_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ColorCalendar({ year, month, onSelectDate }: Props) {
  const [viewYear, setViewYear] = useState(year);
  const [viewMonth, setViewMonth] = useState(month);
  const [entries, setEntries] = useState<Map<number, DayColorEntry>>(new Map());

  useEffect(() => {
    let cancelled = false;
    fetchColorCalendar(viewYear, viewMonth)
      .then((list) => {
        if (cancelled) return;
        const m = new Map<number, DayColorEntry>();
        for (const e of list) {
          const day = Number(e.date.slice(8, 10));
          m.set(day, e);
        }
        setEntries(m);
      })
      .catch(() => { if (!cancelled) setEntries(new Map()); });
    return () => { cancelled = true; };
  }, [viewYear, viewMonth]);

  const goPrev = () => {
    if (viewMonth === 1) {
      setViewYear(viewYear - 1);
      setViewMonth(12);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };
  const goNext = () => {
    if (viewMonth === 12) {
      setViewYear(viewYear + 1);
      setViewMonth(1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // 그리드 계산
  const firstDow = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0=Sun
  const daysCur = new Date(viewYear, viewMonth, 0).getDate();
  const daysPrev = new Date(viewYear, viewMonth - 1, 0).getDate();
  const cells: { day: number; inMonth: boolean; entry?: DayColorEntry }[] = [];
  // 앞 패딩 (이전 달 말일들)
  for (let i = firstDow - 1; i >= 0; i--) {
    cells.push({ day: daysPrev - i, inMonth: false });
  }
  // 당월
  for (let d = 1; d <= daysCur; d++) {
    cells.push({ day: d, inMonth: true, entry: entries.get(d) });
  }
  // 뒤 패딩 (다음 달 초)
  let next = 1;
  while (cells.length < 42) {
    cells.push({ day: next++, inMonth: false });
  }

  return (
    <div className="mx-4 mb-6">
      {/* 월 네비 헤더 */}
      <div className="flex items-center justify-center gap-6 mb-3">
        <button
          type="button"
          onClick={goPrev}
          aria-label="이전 달"
          className="flex items-center justify-center rounded-full"
          style={{ width: 28, height: 28, backgroundColor: '#f4f4f4' }}
        >
          <ChevronLeft />
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#131416' }}>
          {viewYear} {viewMonth}월
        </span>
        <button
          type="button"
          onClick={goNext}
          aria-label="다음 달"
          className="flex items-center justify-center rounded-full"
          style={{ width: 28, height: 28, backgroundColor: '#f4f4f4' }}
        >
          <ChevronRight />
        </button>
      </div>

      {/* 요일 헤더 (알약) */}
      <div
        className="grid grid-cols-7 mb-2"
        style={{
          border: '1px solid #eeeeee',
          borderRadius: 999,
          padding: '6px 4px',
        }}
      >
        {WEEK_LABELS.map((w) => (
          <span
            key={w}
            className="text-center"
            style={{ fontSize: 11, color: '#8a8a8a', fontWeight: 500 }}
          >
            {w}
          </span>
        ))}
      </div>

      {/* 날짜 그리드 6주 x 7 */}
      <div className="grid grid-cols-7 gap-y-1.5">
        {cells.map((c, i) => {
          if (!c.inMonth) {
            return (
              <div key={i} className="aspect-square flex items-center justify-center">
                <span style={{ fontSize: 13, color: '#d0d0d0' }}>{c.day}</span>
              </div>
            );
          }
          const hasPost = !!c.entry?.representativeColor;
          if (hasPost && c.entry) {
            const colorHex = COLOR_MAP[c.entry.representativeColor!].main;
            const dateStr = c.entry.date;
            return (
              <div key={i} className="aspect-square flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => onSelectDate?.(dateStr)}
                  className="flex items-center justify-center rounded-full bg-white active:opacity-70"
                  style={{
                    width: '78%',
                    height: '78%',
                    border: `2px solid ${colorHex}`,
                    color: colorHex,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {c.day}
                </button>
              </div>
            );
          }
          return (
            <div key={i} className="aspect-square flex items-center justify-center">
              <span style={{ fontSize: 13, color: '#222222' }}>{c.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
      <path d="M6.5 1L1.5 6L6.5 11" stroke="#5e5e5e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
      <path d="M1.5 1L6.5 6L1.5 11" stroke="#5e5e5e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

