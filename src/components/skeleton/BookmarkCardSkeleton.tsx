export default function BookmarkCardSkeleton() {
  return (
    <div
      className="mx-4 mb-3 animate-pulse"
      style={{ borderRadius: 15, background: '#f8f8f8' }}
      aria-hidden="true"
    >
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="shrink-0 rounded-full bg-gray-200" style={{ width: 15, height: 15 }} />
          <span className="flex-1 rounded bg-gray-200" style={{ height: 14, maxWidth: '50%' }} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="rounded bg-gray-200" style={{ height: 12 }} />
          <span className="rounded bg-gray-200" style={{ height: 12 }} />
          <span className="rounded bg-gray-200" style={{ height: 12, width: '70%' }} />
        </div>
        <span className="rounded bg-gray-200" style={{ height: 11, width: 110 }} />
      </div>
    </div>
  );
}
