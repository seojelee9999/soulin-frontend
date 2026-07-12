export default function TypingIndicator({ label }: { label?: string }) {
  return (
    <div
      className="rounded-2xl rounded-tl-md inline-flex flex-col gap-1.5"
      style={{
        padding: '12px 14px',
        backgroundColor: '#ffffff',
        border: '1px solid #ececec',
        width: 'fit-content',
      }}
    >
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block rounded-full bg-gray-400 animate-pulse"
            style={{ width: 6, height: 6, animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
      {label && (
        <span className="text-xs text-gray-500" style={{ whiteSpace: 'nowrap' }}>
          {label}
        </span>
      )}
    </div>
  );
}
