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
  main: string; // 진한 색 (강조, 선택 상태, 색상 원)
  soft: string; // 흐린 색 (배경, 미선택 탭)
}

export const COLOR_KEYS: ColorKey[] = [
  'red', 'orange', 'yellow', 'lime', 'green',
  'cyan', 'blue', 'navy', 'purple', 'pink', 'gray', 'black',
];

// colorId 순서: 1~12 (COLOR_KEYS 배열 인덱스 + 1, 백엔드 GET /colors 기준)
export const COLOR_ID_MAP: Record<ColorKey, number> = Object.fromEntries(
  COLOR_KEYS.map((key, i) => [key, i + 1]),
) as Record<ColorKey, number>;

export const COLOR_MAP: Record<ColorKey, ColorInfo> = {
  red:    { label: '레드',      main: '#F21A14', soft: '#F4B3B1' },
  orange: { label: '오렌지',    main: '#FA6E2C', soft: '#F6CCB8' },
  yellow: { label: '옐로',      main: '#F8B420', soft: '#F5E1B4' },
  lime:   { label: '라이트 그린', main: '#90D12C', soft: '#D6EAB8' },
  green:  { label: '그린',      main: '#219352', soft: '#B5D7C4' },
  cyan:   { label: '라이트 블루', main: '#2DE1F5', soft: '#B9EFF5' },
  blue:   { label: '블루',      main: '#266BDE', soft: '#B6CBEE' },
  navy:   { label: '네이비',    main: '#1B4163', soft: '#B3BEC9' },
  purple: { label: '퍼플',      main: '#7F32F1', soft: '#D1BAF3' },
  pink:   { label: '핑크',      main: '#F7416B', soft: '#F5BECB' },
  gray:   { label: '그레이',    main: '#818285', soft: '#D2D2D3' },
  black:  { label: '블랙',      main: '#2B2B2B', soft: '#B8B8B8' },
};
