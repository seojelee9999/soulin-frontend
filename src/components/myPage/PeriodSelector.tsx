import type { PeriodPreset } from '../../types/myPage';

interface Props {
  value: PeriodPreset;
  onChange: (p: PeriodPreset) => void;
}

const OPTIONS: { key: PeriodPreset; label: string }[] = [
  { key: '1m', label: '1개월' },
  { key: '3m', label: '3개월' },
  { key: '6m', label: '6개월' },
  { key: 'custom', label: '기간설정' },
];

export default function PeriodSelector({ value, onChange }: Props) {
  return (
    <div className="flex gap-2 px-4 mb-3">
      {OPTIONS.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className="flex-1 py-2 text-xs"
            style={{
              borderRadius: 8,
              backgroundColor: active ? '#2b2b2b' : '#f4f4f4',
              color: active ? '#ffffff' : '#5e5e5e',
              fontWeight: active ? 600 : 400,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
