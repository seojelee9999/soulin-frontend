import { useState, useRef, useEffect } from 'react';
import { COLOR_MAP, type ColorKey } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const EMOTION_TABLE: { emotion: string; colors: { label: string; key: ColorKey }[] }[] = [
  { emotion: '기쁨', colors: [
    { label: '따뜻한 오렌지', key: 'orange' },
    { label: '라임', key: 'lime' },
    { label: '민트', key: 'cyan' },
  ]},
  { emotion: '슬픔', colors: [
    { label: '파랑', key: 'blue' },
    { label: '네이비', key: 'navy' },
    { label: '회색', key: 'gray' },
  ]},
  { emotion: '분노', colors: [
    { label: '빨강', key: 'red' },
    { label: '다크 그레이', key: 'black' },
    { label: '보라', key: 'purple' },
  ]},
  { emotion: '상처', colors: [
    { label: '분홍', key: 'pink' },
    { label: '초록', key: 'green' },
    { label: '파랑', key: 'blue' },
  ]},
  { emotion: '불안', colors: [
    { label: '노랑', key: 'yellow' },
    { label: '회색', key: 'gray' },
    { label: '보라', key: 'purple' },
  ]},
  { emotion: '당황', colors: [
    { label: '빨강', key: 'red' },
    { label: '노랑', key: 'yellow' },
    { label: '보라', key: 'purple' },
  ]},
];

export default function FilterGuideBottomSheet({ open, onClose }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      // 다음 frame에 isVisible=true 해야 transform 트랜지션 발동
      const id = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(id);
    } else {
      setIsVisible(false);
      setDragOffset(0);
    }
  }, [open]);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartY.current = e.clientY;
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartY.current === null) return;
    const delta = e.clientY - dragStartY.current;
    setDragOffset(Math.max(0, delta)); // 위로는 못 가게
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartY.current === null) return;
    const delta = e.clientY - dragStartY.current;
    dragStartY.current = null;
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* 이미 release됐거나 capture 안 잡힌 경우 무시 */
    }

    if (delta > 100) {
      // 시트가 화면 밖으로 마저 슬라이드 다운한 후 onClose
      setDragOffset(window.innerHeight);
      setTimeout(() => onClose(), 300); // transition 0.3s와 맞춤
    } else {
      // 복귀
      setDragOffset(0);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* 딤 */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        style={{
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
        }}
        onClick={onClose}
      />

      {/* 시트 */}
      <div
        className="fixed bottom-0 left-1/2 w-full max-w-[430px] bg-white rounded-t-3xl z-50 max-h-[85vh] flex flex-col"
        style={{
          transform: isVisible
            ? `translate(-50%, ${dragOffset}px)`
            : 'translate(-50%, 100%)',
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {/* 핸들 — 드래그 영역 */}
        <div
          className="flex justify-center pt-3 pb-2 shrink-0 cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="overflow-y-auto scrollbar-none px-5 pb-6">
          {/* 섹션 1 */}
          <h3 className="text-base font-bold text-gray-900 mt-2 mb-2">스며듦 컬러 필터란?</h3>
          <p className="text-sm text-gray-700 leading-relaxed mb-5">
            글을 쓰고 나면, 스며듦의 AI가 당신의 글을 읽고 감정을 분석합니다.
          </p>

          {/* 섹션 2 */}
          <h3 className="text-base font-bold text-gray-900 mb-2">색상 별 감정 분류</h3>
          <p className="text-sm text-gray-700 leading-relaxed mb-5">
            색상과 감정의 연결은 색채와 심리학 연구를 바탕으로 설계되었습니다.
            감정과 색에 대한 연구들을 종합하여 각 감정에 가장 어울리는 색을 연결합니다.
          </p>

          {/* 섹션 3 */}
          <h3 className="text-base font-bold text-gray-900 mb-2">감정과 색상은 어떻게 연결되나요?</h3>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            글을 쓰고 나면, 스며듦의 AI 필터가 글을 읽고 감정을 분석합니다.
            아래는 감정과 색상이 어떻게 연결되는지 보여주는 예시입니다. 분류 원칙의 일부를 담았습니다.
          </p>

          {/* 표 */}
          <div className="rounded-lg border border-gray-200 overflow-hidden mb-6">
            {/* 헤더 행 */}
            <div className="grid grid-cols-[80px_1fr] bg-gray-50 border-b border-gray-200">
              <div className="text-xs font-semibold text-gray-700 text-center py-2.5">감정</div>
              <div className="text-xs font-semibold text-gray-700 text-center py-2.5">색상</div>
            </div>
            {/* 데이터 행 */}
            {EMOTION_TABLE.map(({ emotion, colors }) => (
              <div
                key={emotion}
                className="grid grid-cols-[80px_1fr] border-b border-gray-100 last:border-b-0"
              >
                <div className="text-xs font-medium text-gray-900 text-center py-3 flex items-center justify-center">
                  {emotion}
                </div>
                <div className="py-3 px-3 flex flex-wrap gap-x-3 gap-y-1.5 items-center">
                  {colors.map(({ label, key }, i) => (
                    <span key={`${emotion}-${i}-${key}`} className="inline-flex items-center gap-1.5">
                      <span className="text-xs text-gray-700">{label}</span>
                      <span
                        className="block rounded-full"
                        style={{ width: 10, height: 10, backgroundColor: COLOR_MAP[key].main }}
                      />
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 섹션 4 */}
          <h3 className="text-base font-bold text-gray-900 mb-2">나의 감정과 분석 결과가 다를 수 있어요.</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            AI가 분석한 감정과 색상이 정답은 아닙니다. 글로 담기 어려운 미묘한 감정은
            파악하지 못할 수 있습니다. 분석 결과를 참고하되 원한다면 직접 선택이 가능합니다.
          </p>
        </div>
      </div>
    </>
  );
}
