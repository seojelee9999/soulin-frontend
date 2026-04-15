import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLOR_MAP, type ColorKey } from '../types';
import { useApp } from '../context/AppContext';

// AI 원 그라데이션
const AI_CIRCLE_BG =
  'radial-gradient(circle at 30% 30%, #fce4ec, #e8f4fd 40%, #e8faf5 70%, #fef9e7)';

// 전환 화면 배경
const PASTEL_BG = [
  'radial-gradient(ellipse at 75% 5%,  #fce4ec 0%, transparent 50%)',
  'radial-gradient(ellipse at 25% 15%, #fff3e0 0%, transparent 45%)',
  'radial-gradient(ellipse at 80% 60%, #e8f5e9 0%, transparent 45%)',
  'radial-gradient(ellipse at 15% 90%, #e3f2fd 0%, transparent 40%)',
  '#fdf8f8',
].join(', ');

// 피그마 색상 순서 (4열 × 3행)
const COLOR_GRID: ColorKey[] = [
  'red', 'orange', 'yellow', 'lime',
  'green', 'cyan', 'blue', 'navy',
  'purple', 'pink', 'gray', 'black',
];

export default function ColorSelectPage() {
  const navigate = useNavigate();
  const { setSelectedColor, setIsAiMode } = useApp();
  const [selected, setSelected] = useState<ColorKey | 'ai' | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  const handleDone = () => {
    if (!selected) return;
    if (selected === 'ai') {
      setIsAiMode(true);
      setSelectedColor(null);
    } else {
      setIsAiMode(false);
      setSelectedColor(selected);
    }
    setTransitioning(true);
    setTimeout(() => navigate('/write'), 1200);
  };

  if (transitioning) {
    return (
      <div className="fixed inset-0 flex items-center justify-center px-8" style={{ background: PASTEL_BG }}>
        <div className="bg-white rounded-3xl px-8 py-10 text-center w-full shadow-sm">
          <p className="text-base font-semibold text-gray-900 leading-relaxed">
            글 작성 페이지로 이동합니다.<br />잠시만 기다려 주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 상단 헤더 */}
      <header className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-500">
          <ChevronLeft />
        </button>
        <button onClick={() => navigate(-1)} className="p-1 text-gray-500">
          <XIcon />
        </button>
      </header>

      {/* 콘텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-6">
        {/* 제목 */}
        <h2
          className="text-center mb-8"
          style={{ fontSize: 18, fontWeight: 600, color: '#000000' }}
        >
          현재 당신의 마음은 어떤 색 인가요?
        </h2>

        {/* 4×3 색상 그리드 — 원 40px */}
        <div
          className="grid grid-cols-4 mb-10"
          style={{ gap: '30px 0', width: '100%', maxWidth: 320 }}
        >
          {COLOR_GRID.map((key) => {
            const isSelected = selected === key;
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className="flex items-center justify-center active:scale-90 transition-transform"
                style={{ height: 60 }}
              >
                <span
                  className="block rounded-full"
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: COLOR_MAP[key].hex,
                    boxShadow: isSelected
                      ? `0 0 0 4px white, 0 0 0 6px ${COLOR_MAP[key].hex}`
                      : 'none',
                    transition: 'box-shadow 0.15s',
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* AI 옵션 */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => setSelected('ai')}
            className="active:scale-90 transition-transform"
          >
            <span
              className="block rounded-full"
              style={{
                width: 56,
                height: 56,
                background: AI_CIRCLE_BG,
                boxShadow: selected === 'ai'
                  ? '0 0 0 4px white, 0 0 0 6px #c084fc'
                  : 'none',
              }}
            />
          </button>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: 12, fontWeight: 500, color: '#000000' }}>
              스며듦 AI 필터 적용
            </span>
            <span
              className="flex items-center justify-center"
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: '1px solid #aaaeb3',
                fontSize: 10,
                color: '#aaaeb3',
                fontWeight: 500,
              }}
            >
              ?
            </span>
          </div>
        </div>
      </div>

      {/* 완료 버튼 */}
      <div className="px-4 pb-8 pt-3 shrink-0">
        <button
          onClick={handleDone}
          disabled={!selected}
          style={{
            width: '100%',
            height: 44,
            borderRadius: 91,
            backgroundColor: selected ? '#131416' : '#e6e6e6',
            color: selected ? '#ffffff' : '#131416',
            fontSize: 16,
            fontWeight: 500,
            border: 'none',
            cursor: selected ? 'pointer' : 'default',
            transition: 'background-color 0.2s',
          }}
        >
          완료
        </button>
      </div>
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
