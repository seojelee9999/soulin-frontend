export type ColorKey =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'cyan'
  | 'blue'
  | 'navy'
  | 'purple'
  | 'pink'
  | 'gray'
  | 'black';

export interface ColorInfo {
  label: string;
  hex: string;
  bg: string;       // Tailwind bg class
  text: string;     // Tailwind text class
  border: string;   // Tailwind border class
  light: string;    // 연한 배경 (카드용)
}

export const COLOR_KEYS: ColorKey[] = [
  'red', 'orange', 'yellow', 'lime', 'green',
  'cyan', 'blue', 'navy', 'purple', 'pink', 'gray', 'black',
];

export const COLOR_MAP: Record<ColorKey, ColorInfo> = {
  red:    { label: '빨강', hex: '#ef4444', bg: 'bg-red-500',    text: 'text-red-500',    border: 'border-red-400',    light: 'bg-red-50'    },
  orange: { label: '주황', hex: '#f97316', bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-400', light: 'bg-orange-50' },
  yellow: { label: '노랑', hex: '#eab308', bg: 'bg-yellow-400', text: 'text-yellow-500', border: 'border-yellow-400', light: 'bg-yellow-50' },
  lime:   { label: '연두', hex: '#84cc16', bg: 'bg-lime-500',   text: 'text-lime-500',   border: 'border-lime-400',   light: 'bg-lime-50'   },
  green:  { label: '초록', hex: '#22c55e', bg: 'bg-green-500',  text: 'text-green-500',  border: 'border-green-400',  light: 'bg-green-50'  },
  cyan:   { label: '하늘', hex: '#06b6d4', bg: 'bg-cyan-500',   text: 'text-cyan-500',   border: 'border-cyan-400',   light: 'bg-cyan-50'   },
  blue:   { label: '파랑', hex: '#3b82f6', bg: 'bg-blue-500',   text: 'text-blue-500',   border: 'border-blue-400',   light: 'bg-blue-50'   },
  navy:   { label: '남색', hex: '#4338ca', bg: 'bg-indigo-700', text: 'text-indigo-700', border: 'border-indigo-600', light: 'bg-indigo-50' },
  purple: { label: '보라', hex: '#a855f7', bg: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-400', light: 'bg-purple-50' },
  pink:   { label: '분홍', hex: '#ec4899', bg: 'bg-pink-500',   text: 'text-pink-500',   border: 'border-pink-400',   light: 'bg-pink-50'   },
  gray:   { label: '회색', hex: '#6b7280', bg: 'bg-gray-500',   text: 'text-gray-500',   border: 'border-gray-400',   light: 'bg-gray-50'   },
  black:  { label: '검정', hex: '#1f2937', bg: 'bg-gray-900',   text: 'text-gray-900',   border: 'border-gray-800',   light: 'bg-gray-100'  },
};
