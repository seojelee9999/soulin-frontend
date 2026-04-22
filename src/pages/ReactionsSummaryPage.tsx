import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLOR_MAP } from '../types';
import type { ColorKey, EmpathyReaction } from '../types';
import { mockPosts } from '../data/mockPosts';

// isMine + published + reactions 있는 글
const myActivePosts = mockPosts.filter(
  (p) => p.isMine && p.reactions.length > 0 && p.status !== 'DRAFT' && p.status !== 'REJECTED',
);

function aggregateColorCounts(reactions: EmpathyReaction[]): { color: ColorKey; count: number }[] {
  const map: Partial<Record<ColorKey, number>> = {};
  reactions.forEach((r) => { map[r.color] = (map[r.color] ?? 0) + 1; });
  return (Object.entries(map) as [ColorKey, number][])
    .sort(([, a], [, b]) => b - a)
    .map(([color, count]) => ({ color, count }));
}

function getTopColor(reactions: EmpathyReaction[]): { color: ColorKey; count: number } | null {
  const agg = aggregateColorCounts(reactions);
  return agg[0] ?? null;
}

function getTopSentence(reactions: EmpathyReaction[]): string | null {
  if (!reactions.length) return null;
  const map: Record<string, number> = {};
  reactions.forEach((r) => { map[r.sentence] = (map[r.sentence] ?? 0) + 1; });
  return Object.entries(map).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;
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
      {/* 배경 링 */}
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

      {/* 중앙 텍스트 */}
      <text x={CX} y={CY - 10} textAnchor="middle" fontSize={11} fill="#8a8a8a" fontFamily="sans-serif">
        총 받은 공감
      </text>
      <text x={CX} y={CY + 16} textAnchor="middle" fontSize={28} fontWeight={700} fill="#131416" fontFamily="sans-serif">
        {total}
      </text>
    </svg>
  );
}

// ── 색상 범례 ──────────────────────────────────────────────────

function ColorLegend({ segments, total }: { segments: Segment[]; total: number }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 px-6 mt-2 mb-6">
      {segments.map(({ color, count }) => (
        <div key={color} className="flex items-center gap-1.5">
          <span className="rounded-full shrink-0" style={{ width: 10, height: 10, backgroundColor: COLOR_MAP[color].main }} />
          <span style={{ fontSize: 12, color: '#5e5e5e' }}>
            {COLOR_MAP[color].label} {total > 0 ? Math.round((count / total) * 100) : 0}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ── 글별 카드 ─────────────────────────────────────────────────

interface PostCardProps {
  post: typeof myActivePosts[0];
  onClick: () => void;
}

function PostReactionCard({ post, onClick }: PostCardProps) {
  const topColor = getTopColor(post.reactions);
  const topSentence = getTopSentence(post.reactions);
  const colorInfo = COLOR_MAP[post.color];

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl p-4 mb-3 active:bg-gray-50 transition-colors"
      style={{ border: '1px solid #eeeeee' }}
    >
      {/* 상단: 색상 점 + 제목 + 화살표 */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="rounded-full shrink-0" style={{ width: 10, height: 10, backgroundColor: colorInfo.main }} />
          <span className="font-semibold text-sm text-gray-900 truncate">{post.title || '(제목 없음)'}</span>
        </div>
        <ChevronRightIcon />
      </div>

      {/* 본문 미리보기 */}
      <p className="text-xs text-gray-400 line-clamp-1 mb-3 pl-[18px]">{post.content}</p>

      {/* 공감 요약 태그 */}
      <div className="flex items-center gap-2 pl-[18px]">
        {topColor && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{ backgroundColor: COLOR_MAP[topColor.color].soft + '60' }}
          >
            <span className="rounded-full shrink-0" style={{ width: 8, height: 8, backgroundColor: COLOR_MAP[topColor.color].main }} />
            <span style={{ fontSize: 11, color: '#444444' }}>{topColor.count}개</span>
          </span>
        )}
        {topSentence && (
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1"
            style={{ backgroundColor: '#f4f4f4' }}
          >
            <span style={{ fontSize: 11, color: '#444444' }}>"{topSentence}"</span>
          </span>
        )}
        <span className="ml-auto" style={{ fontSize: 11, color: '#aaaaaa' }}>
          총 {post.reactions.length}개
        </span>
      </div>
    </button>
  );
}

// ── 페이지 ────────────────────────────────────────────────────

export default function ReactionsSummaryPage() {
  const navigate = useNavigate();

  const allReactions = myActivePosts.flatMap((p) => p.reactions);
  const totalCount = allReactions.length;
  const colorSegments = aggregateColorCounts(allReactions);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-500"><ChevronLeftIcon /></button>
        <h1 className="text-base font-bold text-gray-800">받은 공감</h1>
        <div className="w-7" />
      </header>

      <div className="flex-1 overflow-y-auto pb-10 scrollbar-none">
        {/* 도넛 차트 */}
        <div className="flex justify-center pt-6 pb-2">
          <DonutChart segments={colorSegments} total={totalCount} />
        </div>

        <ColorLegend segments={colorSegments} total={totalCount} />

        {/* 글별 공감 */}
        <div className="px-5">
          <p className="text-sm font-bold text-gray-900 mb-3">글별 공감</p>

          {myActivePosts.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-2">
              <span className="text-3xl">🌱</span>
              <p className="text-sm text-gray-400">아직 받은 공감이 없어요</p>
            </div>
          ) : (
            myActivePosts
              .sort((a, b) => b.reactions.length - a.reactions.length)
              .map((post) => (
                <PostReactionCard
                  key={post.id}
                  post={post}
                  onClick={() => navigate(`/reactions-summary/${post.id}`)}
                />
              ))
          )}
        </div>
      </div>
    </div>
  );
}

function ChevronLeftIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
}
function ChevronRightIcon() {
  return <svg className="w-4 h-4 text-gray-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" /></svg>;
}
