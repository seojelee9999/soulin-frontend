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

// 기본 목 — BE 준비되면 VITE_MYPAGE_USE_MOCK='false'로 실 API 전환
const USE_MOCK = import.meta.env.VITE_MYPAGE_USE_MOCK !== 'false';

function delay<T>(value: T, ms = 80): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function fetchColorCalendar(year: number, month: number): Promise<DayColorEntry[]> {
  if (USE_MOCK) {
    return delay(mockCalendar(year, month));
  }
  // TODO: 백엔드 집계 API 연동 — GET /me/color-calendar?year=&month=
  throw new Error('myPage API not implemented');
}

export function fetchColorRatios(period: PeriodPreset): Promise<ColorRatioEntry[]> {
  if (USE_MOCK) {
    return delay(mockColorRatios(period));
  }
  // TODO: 백엔드 집계 API 연동 — GET /me/color-ratios?period=
  throw new Error('myPage API not implemented');
}

export function fetchEmotionReport(period: string): Promise<EmotionReport> {
  if (USE_MOCK) {
    return delay(mockEmotionReport(period));
  }
  // TODO: 백엔드 집계 API 연동 — GET /me/emotion-report?period=
  throw new Error('myPage API not implemented');
}
