import type { Chip } from '../../types/colorMate';

interface Props {
  chips: Chip[];
  picked?: string | null;
  disabled?: boolean;
  onPick: (chip: Chip) => void;
}

export default function ChipBar({ chips, picked, disabled, onPick }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none px-4 py-2">
      {chips.map((chip, i) => {
        const selected = picked != null && picked === chip.value;
        return (
          <button
            key={`${chip.value}-${i}`}
            onClick={() => !disabled && onPick(chip)}
            disabled={disabled}
            className="shrink-0 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-transform active:scale-95"
            style={{
              backgroundColor: selected ? '#e6e6e6' : '#ffffff',
              border: `1px solid ${selected ? '#e6e6e6' : '#d8d8d8'}`,
              color: '#131416',
              opacity: disabled ? 0.4 : 1,
              cursor: disabled ? 'default' : 'pointer',
            }}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
