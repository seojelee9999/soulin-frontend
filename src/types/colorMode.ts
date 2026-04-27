import type { ColorKey } from './color';

export type ColorMode =
  | { kind: 'color'; color: ColorKey }
  | { kind: 'ai' };
