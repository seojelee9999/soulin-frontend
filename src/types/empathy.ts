import type { ColorKey } from './color';

export type EmpathyCategory = '공감' | '응원' | '위로' | '지지';

export interface EmpathySentence {
  id: string;
  text: string;
}

export interface EmpathyOption {
  category: EmpathyCategory;
  sentences: EmpathySentence[];
}

export interface EmpathyReaction {
  sentence: string;
  color: ColorKey;
  category: EmpathyCategory;
}

// 텍스트 source of truth: GET /reaction-types 백엔드 응답 기준.
// 프론트 임의 변경 금지 — 백엔드 응답과 항상 일치시킬 것.
export const EMPATHY_OPTIONS: EmpathyOption[] = [
  {
    category: '공감',
    sentences: [
      { id: 'e1', text: '나도 그래' },
      { id: 'e2', text: '완전 공감해' },
      { id: 'e3', text: '어떤 기분인지 알아' },
      { id: 'e4', text: '나도 그런 적 있어' },
      { id: 'e5', text: '너를 이해해' },
    ],
  },
  {
    category: '응원',
    sentences: [
      { id: 'c1', text: '넌 특별해' },
      { id: 'c2', text: '가보자구!' },
      { id: 'c3', text: '할 수 있어' },
      { id: 'c4', text: '잘하고 있어' },
      { id: 'c5', text: '끝까지 해보자' },
    ],
  },
  {
    category: '위로',
    sentences: [
      { id: 'w1', text: '괜찮아' },
      { id: 'w2', text: '토닥토닥' },
      { id: 'w3', text: '기다릴게' },
      { id: 'w4', text: '힘들었겠다' },
      { id: 'w5', text: '최선을 다했네!' },
    ],
  },
  {
    category: '지지',
    sentences: [
      { id: 's1', text: '너를 믿어' },
      { id: 's2', text: '네 선택을 존중해' },
      { id: 's3', text: '리스펙해' },
      { id: 's4', text: '충분히 멋져🌟' },
      { id: 's5', text: '있는 그대로도 좋아' },
      { id: 's6', text: '축하해' },
    ],
  },
];

// sentence text → reactionTypeId (백엔드 GET /reaction-types 순서 기준, 1-indexed)
export const REACTION_TYPE_ID_MAP: Record<string, number> = Object.fromEntries(
  EMPATHY_OPTIONS.flatMap((opt) => opt.sentences).map((s, i) => [s.text, i + 1]),
);
