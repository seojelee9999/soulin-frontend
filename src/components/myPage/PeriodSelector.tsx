import type { PeriodPreset } from '../../types/myPage';

interface Props {
  value: PeriodPreset;
  onChange: (p: PeriodPreset) => void;
  customRange: { startDate: string; endDate: string } | null;
  onCustomRangeChange: (r: { startDate: string; endDate: string }) => void;
}

const OPTIONS: { key: PeriodPreset; label: string }[] = [
  { key: '1m', label: '1개월' },
  { key: '3m', label: '3개월' },
  { key: '6m', label: '6개월' },
  { key: 'custom', label: '기간설정' },
];

export default function PeriodSelector({
  value,
  onChange,
  customRange,
  onCustomRangeChange,
}: Props) {
  const startDate = customRange?.startDate ?? '';
  const endDate = customRange?.endDate ?? '';

  return (
    <div className="px-4 mb-3">
      <div className="flex gap-2">
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

      {value === 'custom' && (
        <div className="flex items-center gap-2 mt-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) =>
              onCustomRangeChange({ startDate: e.target.value, endDate: endDate || e.target.value })
            }
            className="flex-1 px-3 py-2 text-xs outline-none"
            style={{
              borderRadius: 8,
              backgroundColor: '#f4f4f4',
              color: '#131416',
              border: '1px solid transparent',
            }}
          />
          <span style={{ fontSize: 11, color: '#8a8a8a' }}>~</span>
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) =>
              onCustomRangeChange({ startDate: startDate || e.target.value, endDate: e.target.value })
            }
            className="flex-1 px-3 py-2 text-xs outline-none"
            style={{
              borderRadius: 8,
              backgroundColor: '#f4f4f4',
              color: '#131416',
              border: '1px solid transparent',
            }}
          />
        </div>
      )}
    </div>
  );
}
