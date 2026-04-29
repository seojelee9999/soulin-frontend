export default function PostDetailSkeleton() {
  return (
    <div className="flex-1 flex flex-col animate-pulse" aria-hidden="true">
      {/* 제목 행 */}
      <div className="flex items-center gap-3 px-5 py-3 shrink-0">
        <span className="rounded-full bg-gray-200" style={{ width: 26, height: 26 }} />
        <span className="flex-1 rounded bg-gray-200" style={{ height: 16, maxWidth: '60%' }} />
      </div>

      <div className="flex-1 px-5 pb-32">
        {/* 본문 카드 */}
        <div
          className="rounded-2xl mb-5"
          style={{ border: '2px solid #f0f0f0', backgroundColor: '#fafafa' }}
        >
          <div className="px-5 pt-5 pb-4 flex flex-col gap-3">
            <span className="rounded bg-gray-200" style={{ height: 12 }} />
            <span className="rounded bg-gray-200" style={{ height: 12 }} />
            <span className="rounded bg-gray-200" style={{ height: 12 }} />
            <span className="rounded bg-gray-200" style={{ height: 12, width: '60%' }} />
          </div>
          <div className="px-5 pb-4">
            <span className="block rounded bg-gray-200" style={{ height: 11, width: 180 }} />
          </div>
        </div>

        {/* 받은 공감 라벨 */}
        <span className="block rounded bg-gray-200 mb-3" style={{ height: 14, width: 64 }} />

        {/* 받은 공감 칩들 */}
        <div className="flex flex-wrap gap-2">
          {[88, 110, 96, 84].map((width, i) => (
            <span
              key={i}
              className="rounded-full bg-gray-100"
              style={{ width, height: 32 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
