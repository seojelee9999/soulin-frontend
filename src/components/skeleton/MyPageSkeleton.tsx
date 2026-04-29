export default function MyPageSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto pb-24 animate-pulse" aria-hidden="true">
      {/* 프로필 */}
      <div className="flex flex-col items-center pt-8 pb-6 gap-3">
        <div className="rounded-full bg-gray-200" style={{ width: 68, height: 68 }} />
        <span className="rounded bg-gray-200" style={{ height: 14, width: 80 }} />
      </div>

      {/* 통계 카드 3개 */}
      <div className="flex gap-3 px-4 mb-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex-1 flex flex-col justify-between p-3"
            style={{ background: '#f8f8f8', borderRadius: 10, height: 72 }}
          >
            <span className="rounded bg-gray-200" style={{ height: 18, width: 36 }} />
            <span className="rounded bg-gray-200" style={{ height: 11, width: 56 }} />
          </div>
        ))}
      </div>

      {/* 설정 */}
      <div className="px-4">
        <span className="block rounded bg-gray-200 mb-3" style={{ height: 14, width: 36 }} />
        <div style={{ borderTop: '1px solid #eeeeee' }}>
          {[0, 1].map((i) => (
            <div
              key={i}
              className="w-full flex items-center justify-between py-4"
              style={{ borderBottom: '1px solid #eeeeee' }}
            >
              <span className="rounded bg-gray-200" style={{ height: 14, width: 100 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
