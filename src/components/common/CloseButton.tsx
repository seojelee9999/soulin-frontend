interface Props {
  onClick: () => void;
  className?: string;
}

export default function CloseButton({ onClick, className }: Props) {
  return (
    <button
      onClick={onClick}
      className={`p-1 text-gray-500${className ? ` ${className}` : ''}`}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M3 3L15 15M15 3L3 15"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
