import { COLOR_KEYS } from '../types/color';
import type {
  DayColorEntry,
  ColorRatioEntry,
  EmotionReport,
  PeriodPreset,
} from '../types/myPage';

// EmotionReportCard 빈 상태 vs 정상 상태 토글용.
// false: 빈 상태(데이터 부족) / true: summary 채워진 상태
const MOCK_REPORT_AVAILABLE = false;

// 결정적 해시 — 같은 (year, month, day)면 항상 같은 값.
// splitmix32로 mixing해서 인접 day 사이 분포가 균등해지게(앞부분 몰빵 방지).
function seed(year: number, month: number, day: number): number {
  let n = (year * 10000 + month * 100 + day) >>> 0;
  n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
  n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
  return (n ^ (n >>> 16)) >>> 0;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function mockCalendar(year: number, month: number): DayColorEntry[] {
  const total = daysInMonth(year, month);
  const entries: DayColorEntry[] = [];
  for (let d = 1; d <= total; d++) {
    const s = seed(year, month, d);
    // 약 55% 날짜에 글
    const hasPost = (s % 100) < 55;
    if (hasPost) {
      const colorIdx = s % COLOR_KEYS.length;
      const postCount = 1 + (s % 3); // 1~3
      entries.push({
        date: `${year}-${pad2(month)}-${pad2(d)}`,
        representativeColor: COLOR_KEYS[colorIdx],
        postCount,
      });
    } else {
      entries.push({
        date: `${year}-${pad2(month)}-${pad2(d)}`,
        representativeColor: null,
        postCount: 0,
      });
    }
  }
  return entries;
}

// PeriodPreset별 raw count 베이스(분포만 다르게)
const RATIO_BASE: Record<PeriodPreset, number[]> = {
  // 12색 순서: red, orange, yellow, lime, green, cyan, blue, navy, purple, pink, gray, black
  '1m':     [12, 9, 7, 5, 8, 4, 11, 6, 10, 3, 2, 1],
  '3m':     [28, 22, 18, 12, 19, 9, 26, 14, 21, 8, 5, 3],
  '6m':     [52, 41, 33, 24, 36, 17, 48, 27, 39, 15, 9, 6],
  'custom': [20, 16, 13, 9, 14, 7, 19, 11, 16, 6, 4, 2],
};

export function mockColorRatios(period: PeriodPreset): ColorRatioEntry[] {
  const counts = RATIO_BASE[period];
  const total = counts.reduce((a, b) => a + b, 0);
  const entries: ColorRatioEntry[] = COLOR_KEYS.map((color, i) => ({
    color,
    count: counts[i],
    ratio: counts[i] / total,
  }));
  return entries.sort((a, b) => b.count - a.count);
}

export function mockEmotionReport(period: string): EmotionReport {
  if (!MOCK_REPORT_AVAILABLE) {
    return { available: false, period, summary: null };
  }
  return {
    available: true,
    period,
    summary: `${period} 한 달 동안 블루 계열의 차분한 감정이 가장 자주 나타났어요. 후반부로 갈수록 옐로와 라이트 그린이 늘며 회복의 흐름이 보입니다.`,
  };
}
