import type { PeriodPreset } from '../../types/myPage';

interface Props {
  period: PeriodPreset;
}

export default function ColorRatioGraph({ period }: Props) {
  return (
    <div
      className="mx-4 mb-6 flex items-center justify-center text-sm text-gray-400"
      style={{
        height: 180,
        border: '1px dashed #cccccc',
        borderRadius: 12,
      }}
    >
      컬러 그래프 ({period})
    </div>
  );
}
