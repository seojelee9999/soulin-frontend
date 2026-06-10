import client from './client';
import { COLOR_KEYS } from '../types/color';
import type { ColorKey } from '../types/color';
import type {
  DayColorEntry,
  ColorRatioEntry,
  EmotionReport,
  PeriodPreset,
} from '../types/myPage';
import {
  mockCalendar,
  mockColorRatios,
  mockEmotionReport,
} from '../data/myPageMock';

// 기본 실 API. 로컬에서 목 보려면 .env에 VITE_MYPAGE_USE_MOCK=true.
const USE_MOCK = import.meta.env.VITE_MYPAGE_USE_MOCK === 'true';

function delay<T>(value: T, ms = 80): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const colorIdToKey = (id: number): ColorKey | null => COLOR_KEYS[id - 1] ?? null;

// ── BE DTO (쓰는 필드만 최소) ─────────────────────────────────

interface CalendarDayDto {
  date: string;
  postCount: number;
  representativeColorId?: number | null;
  representativeColorName?: string;
}

interface MypageSummaryResponse {
  calendarDays: CalendarDayDto[];
}

interface ColorStatItemDto {
  colorId: number;
  colorName: string;
  count: number;
  percentage: number;
}

interface ColorStatsResponse {
  colorStats: ColorStatItemDto[];
}

// ── 엔드포인트 ─────────────────────────────────────────────

export function fetchColorCalendar(year: number, month: number): Promise<DayColorEntry[]> {
  if (USE_MOCK) {
    return delay(mockCalendar(year, month));
  }
  return client
    .get<MypageSummaryResponse>('/users/me/mypage/summary', { params: { year, month } })
    .then((r) =>
      r.data.calendarDays.map((cd) => ({
        date: cd.date,
        representativeColor: cd.representativeColorId
          ? colorIdToKey(cd.representativeColorId)
          : null,
        postCount: cd.postCount,
      })),
    );
}

export function fetchColorRatios(period: PeriodPreset): Promise<ColorRatioEntry[]> {
  if (USE_MOCK) {
    return delay(mockColorRatios(period));
  }
  // custom: 날짜 피커 미구현 → range 없이 호출해 BE 기본값 사용
  // TODO: custom startDate/endDate 연동
  const params = period === 'custom' ? {} : { range: period };
  return client
    .get<ColorStatsResponse>('/users/me/mypage/color-stats', { params })
    .then((r) => {
      const entries: ColorRatioEntry[] = r.data.colorStats
        .map((c) => {
          const key = colorIdToKey(c.colorId);
          return key
            ? { color: key, count: c.count, ratio: c.percentage / 100 }
            : null;
        })
        .filter((e): e is ColorRatioEntry => e !== null);
      // BE 정렬 보장 없음 — ColorRatioGraph가 data[0]=max 가정이라 내림차순 정렬.
      entries.sort((a, b) => b.ratio - a.ratio);
      return entries;
    });
}

export function fetchEmotionReport(period: string): Promise<EmotionReport> {
  // TODO: 백엔드 리포트 API 생기면 연동
  return delay(mockEmotionReport(period));
}
