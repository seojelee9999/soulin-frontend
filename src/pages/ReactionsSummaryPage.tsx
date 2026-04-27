import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLOR_KEYS, COLOR_MAP } from '../types';
import type { ColorKey } from '../types';
import {
  fetchReactionSummary,
  type ReactionColorStat,
  type PostReactionSummary,
  type ReactionSummaryResponse,
} from '../api/reactions';
import BackButton from '../components/common/BackButton';

function colorIdToKey(colorId: number): ColorKey {
  return COLOR_KEYS[colorId - 1] ?? 'gray';
}

// ── 도넛 차트 ─────────────────────────────────────────────────

interface Segment { color: ColorKey; count: number; }

function DonutChart({ segments, total }: { segments: Segment[]; total: number }) {
  const R = 55;
  const CX = 80, CY = 80;
  const CIRC = 2 * Math.PI * R;
  const n = segments.length;
  const GAP = n > 1 ? 5 : 0;
  const usableLen = CIRC - GAP * n;

  let accumulated = 0;

  return (
    <svg viewBox="0 0 160 160" className="w-52 h-52">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f0f0f0" strokeWidth={14} />

      {total === 0 ? null : segments.map(({ color, count }, i) => {
        const segLen = (count / total) * usableLen;
        const offset = accumulated;
        accumulated += segLen + GAP;
        return (
          <circle
            key={i}
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={COLOR_MAP[color].main}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={`${segLen} ${CIRC}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${CX} ${CY})`}
          />
        );
      })}

      <text x={CX} y={CY - 10} textAnchor="middle" fontSize={11} fill="#8a8a8a" fontFamily="sans-serif">
        총 받은 공감
      </text>
      <text x={CX} y={CY + 16} textAnchor="middle" fontSize={28} fontWeight={700} fill="#131416" fontFamily="sans-serif">
        {total}
      </text>
    </svg>
  );
}

function ColorLegend({ stats, total }: { stats: ReactionColorStat[]; total: number }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 px-6 mt-2 mb-6">
      {stats.map((s) => {
        const key = colorIdToKey(s.colorId);
        return (
          <div key={s.colorId} className="flex items-center gap-1.5">
            <span className="rounded-full shrink-0" style={{ width: 10, height: 10, backgroundColor: s.colorCode }} />
            <span style={{ fontSize: 12, color: '#5e5e5e' }}>
              {COLOR_MAP[key].label} {total > 0 ? Math.round(s.ratio) : 0}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── 글별 카드 ─────────────────────────────────────────────────

function PostReactionCard({ summary, onClick }: { summary: PostReactionSummary; onClick: () => void }) {
  const top = summary.topColor;
  const topReactionText = summary.topReactionType?.reactionText ?? null;
  const totalForPost =
    (top?.count ?? 0); // backend gives only top; chip shows total fallback to top count

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl p-4 mb-3 active:bg-gray-50 transition-colors"
      style={{ border: '1px solid #eeeeee' }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {top && (
            <span className="rounded-full shrink-0" style={{ width: 10, height: 10, backgroundColor: top.colorCode }} />
          )}
          <span className="font-semibold text-sm text-gray-900 truncate">{summary.title || '(제목 없음)'}</span>
        </div>
        <ChevronRightIcon />
      </div>

      <p className="text-xs text-gray-400 line-clamp-1 mb-3 pl-[18px]">{summary.content}</p>

      <div className="flex items-center gap-2 pl-[18px]">
        {top && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{ backgroundColor: top.colorCode + '30' }}
          >
            <span className="rounded-full shrink-0" style={{ width: 8, height: 8, backgroundColor: top.colorCode }} />
            <span style={{ fontSize: 11, color: '#444444' }}>{top.count}개</span>
          </span>
        )}
        {topReactionText && (
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1"
            style={{ backgroundColor: '#f4f4f4' }}
          >
            <span style={{ fontSize: 11, color: '#444444' }}>"{topReactionText}"</span>
          </span>
        )}
        {totalForPost > 0 && (
          <span className="ml-auto" style={{ fontSize: 11, color: '#aaaaaa' }}>
            {totalForPost}개 이상
          </span>
        )}
      </div>
    </button>
  );
}

// ── 페이지 ────────────────────────────────────────────────────

export default function ReactionsSummaryPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<ReactionSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchReactionSummary()
      .then((res) => { if (!cancelled) setData(res); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const segments: Segment[] = (data?.colorRatios ?? []).map((s) => ({
    color: colorIdToKey(s.colorId),
    count: s.count,
  }));
  const totalCount = data?.totalReactionCount ?? 0;
  const summaries = data?.postReactionSummaries ?? [];

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
        <BackButton onClick={() => navigate(-1)} />
        <h1 className="text-base font-bold text-gray-800">받은 공감</h1>
        <div className="w-7" />
      </header>

      <div className="flex-1 overflow-y-auto pb-10 scrollbar-none">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-sm text-gray-400">불러오는 중...</div>
        ) : error ? (
          <div className="flex flex-col items-center py-16 gap-2">
            <p className="text-sm text-gray-400">받은 공감을 불러오지 못했어요</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center pt-6 pb-2">
              <DonutChart segments={segments} total={totalCount} />
            </div>

            <ColorLegend stats={data?.colorRatios ?? []} total={totalCount} />

            <div className="px-5">
              <p className="text-sm font-bold text-gray-900 mb-3">글별 공감</p>

              {summaries.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-2">
                  <span className="text-3xl">🌱</span>
                  <p className="text-sm text-gray-400">아직 받은 공감이 없어요</p>
                </div>
              ) : (
                summaries.map((s) => (
                  <PostReactionCard
                    key={s.postId}
                    summary={s}
                    onClick={() => navigate(`/reactions-summary/${s.postId}`)}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ChevronRightIcon() {
  return <svg className="w-4 h-4 text-gray-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" /></svg>;
}
