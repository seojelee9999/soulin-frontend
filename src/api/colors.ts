import client from './client';

export interface ColorItem {
  id: number;
  name: string;
  hexCode: string;
  label: string;
}

export const fetchColors = (): Promise<ColorItem[]> =>
  client.get<ColorItem[]>('/colors').then((r) => r.data);
