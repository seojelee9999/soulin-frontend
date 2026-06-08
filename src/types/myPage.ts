import type { ColorKey } from './color';

export type PeriodPreset = '1m' | '3m' | '6m' | 'custom';

export interface DayColorEntry {
  date: string; // 'YYYY-MM-DD'
  representativeColor: ColorKey | null;
  postCount: number;
}

export interface ColorRatioEntry {
  color: ColorKey;
  count: number;
  ratio: number; // 0~1
}

export interface EmotionReport {
  available: boolean;
  period: string; // 'YYYY-MM'
  summary: string | null;
}
