export default function PostCardSkeleton() {
  return (
    <div
      className="mx-4 mb-4 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.04)] animate-pulse"
      style={{ borderRadius: 15 }}
      aria-hidden="true"
    >
      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="shrink-0 rounded-full bg-gray-200" style={{ width: 15, height: 15 }} />
          <span className="flex-1 rounded bg-gray-200" style={{ height: 14, maxWidth: '55%' }} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="rounded bg-gray-100" style={{ height: 12 }} />
          <span className="rounded bg-gray-100" style={{ height: 12 }} />
          <span className="rounded bg-gray-100" style={{ height: 12, width: '70%' }} />
        </div>
        <span className="rounded bg-gray-100" style={{ height: 11, width: 110 }} />
      </div>
    </div>
  );
}
