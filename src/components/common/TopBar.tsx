import type { ReactNode } from 'react';

interface Props {
  title?: string;
  left?: ReactNode;
  right?: ReactNode;
}

export default function TopBar({ title, left, right }: Props) {
  return (
    <header className="flex items-center justify-between h-14 px-4 bg-white border-b border-gray-100 shrink-0">
      <div className="w-10 flex items-center">{left}</div>
      {title && (
        <span className="text-base font-semibold text-gray-800 tracking-tight">
          {title}
        </span>
      )}
      <div className="w-10 flex items-center justify-end">{right}</div>
    </header>
  );
}
