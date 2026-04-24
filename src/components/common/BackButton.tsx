interface Props {
  onClick: () => void;
  className?: string;
}

export default function BackButton({ onClick, className }: Props) {
  return (
    <button
      onClick={onClick}
      className={`p-1 text-gray-500${className ? ` ${className}` : ''}`}
    >
      <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
        <path
          d="M9 1L1 8L9 15"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
