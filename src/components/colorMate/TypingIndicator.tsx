export default function TypingIndicator() {
  return (
    <div
      className="rounded-2xl rounded-tl-md inline-flex items-center gap-1"
      style={{
        padding: '12px 14px',
        backgroundColor: '#ffffff',
        border: '1px solid #ececec',
        width: 'fit-content',
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block rounded-full bg-gray-400 animate-pulse"
          style={{ width: 6, height: 6, animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}
