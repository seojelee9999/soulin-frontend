import { useState, useEffect } from 'react';
import { COLOR_KEYS, COLOR_MAP, EMPATHY_OPTIONS, type ColorKey, type EmpathyReaction } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSend: (reaction: EmpathyReaction) => void;
  initialColor?: ColorKey;
  initialSentence?: string;
  initialCategory?: string;
}

export default function EmpathyBottomSheet({ open, onClose, onSend, initialColor, initialSentence, initialCategory }: Props) {
  const [selectedColor, setSelectedColor] = useState<ColorKey>(initialColor ?? 'blue');
  const [selectedSentence, setSelectedSentence] = useState<{ text: string; category: string } | null>(
    initialSentence && initialCategory ? { text: initialSentence, category: initialCategory } : null,
  );

  useEffect(() => {
    if (open) {
      setSelectedColor(initialColor ?? 'blue');
      setSelectedSentence(initialSentence && initialCategory ? { text: initialSentence, category: initialCategory } : null);
    }
  }, [open, initialColor, initialSentence, initialCategory]);

  const handleDone = () => {
    if (!selectedSentence) return;
    onSend({
      sentence: selectedSentence.text,
      color: selectedColor,
      category: selectedSentence.category as EmpathyReaction['category'],
    });
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* 딤 */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* 시트 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white rounded-t-3xl z-50 max-h-[85vh] flex flex-col">
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="overflow-y-auto scrollbar-none px-5 pb-6">
          {/* 제목 */}
          <h2 className="text-lg font-bold text-gray-900 mb-4 mt-2">어떤 마음을 전할까요?</h2>

          {/* 색상 12개 — 2행×6열 */}
          <div className="grid grid-cols-6 gap-3 mb-6">
            {COLOR_KEYS.map((key) => {
              const isSelected = selectedColor === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedColor(key)}
                  className="flex items-center justify-center active:scale-90 transition-transform"
                >
                  <span
                    className="block w-10 h-10 rounded-full"
                    style={{
                      backgroundColor: COLOR_MAP[key].main,
                      boxShadow: isSelected
                        ? `0 0 0 2px white, 0 0 0 4px ${COLOR_MAP[key].main}`
                        : 'none',
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* 공감 문장 — 카테고리별 */}
          {EMPATHY_OPTIONS.map(({ category, sentences }) => (
            <div key={category} className="mb-5">
              <p className="text-sm font-bold text-gray-900 mb-2.5">{category}</p>
              <div className="flex flex-wrap gap-2">
                {sentences.map(({ id, text }) => {
                  const isSelected = selectedSentence?.text === text;
                  return (
                    <button
                      key={id}
                      onClick={() => setSelectedSentence(isSelected ? null : { text, category })}
                      className={`px-3.5 py-2 rounded-full text-sm border transition-colors
                        ${isSelected
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                        }`}
                    >
                      {text}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* 완료 버튼 */}
          <button
            onClick={handleDone}
            disabled={!selectedSentence}
            className="w-full py-4 rounded-full text-base font-semibold text-white bg-gray-900 disabled:opacity-30 active:scale-[0.98] transition-all mt-2"
          >
            완료
          </button>
        </div>
      </div>
    </>
  );
}
