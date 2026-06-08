interface Props {
  year: number;
  month: number;
  onSelectDate?: (date: string) => void;
}

export default function ColorCalendar({ year, month }: Props) {
  return (
    <div
      className="mx-4 mb-6 flex items-center justify-center text-sm text-gray-400"
      style={{
        height: 320,
        border: '1px dashed #cccccc',
        borderRadius: 12,
      }}
    >
      컬러 캘린더 ({year}.{month})
    </div>
  );
}
