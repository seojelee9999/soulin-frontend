import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { COLOR_MAP } from '../types';
import type { ColorKey } from '../types';
import { mockPosts } from '../data/mockPosts';
import BackButton from '../components/common/BackButton';

const COLOR_BAR_LIMIT = 5;
const CHIP_LIMIT = 8;

export default function ReactionsDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  const post = mockPosts.find((p) => p.id === postId);
  const reactions = post?.reactions ?? [];

  const [colorExpanded, setColorExpanded] = useState(false);
  const [chipExpanded, setChipExpanded] = useState(false);

  // ── 집계 ──────────────────────────────────────────────────────
  const colorMap: Partial<Record<ColorKey, number>> = {};
  reactions.forEach((r) => { colorMap[r.color] = (colorMap[r.color] ?? 0) + 1; });
  const colorRows = (Object.entries(colorMap) as [ColorKey, number][]).sort(([, a], [, b]) => b - a);
  const maxColorCount = colorRows[0]?.[1] ?? 1;

  const sentenceMap: Record<string, number> = {};
  reactions.forEach((r) => { sentenceMap[r.sentence] = (sentenceMap[r.sentence] ?? 0) + 1; });
  const sentenceRows = Object.entries(sentenceMap).sort(([, a], [, b]) => b - a);

  const shownColorRows = colorExpanded ? colorRows : colorRows.slice(0, COLOR_BAR_LIMIT);
  const shownSentenceRows = chipExpanded ? sentenceRows : sentenceRows.slice(0, CHIP_LIMIT);

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <span className="text-3xl">🌫</span>
        <p className="text-sm text-gray-400">글을 찾을 수 없어요</p>
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 underline">돌아가기</button>
      </div>
    );
  }

  const colorInfo = COLOR_MAP[post.color];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
        <BackButton onClick={() => navigate(-1)} />
        <h1 className="text-base font-bold text-gray-800">받은 세부 공감</h1>
        <button onClick={() => navigate('/mypage')} className="p-1 text-gray-500"><XIcon /></button>
      </header>

      {/* 글 제목 행 */}
      <div className="flex items-center gap-2 px-5 py-3 shrink-0">
        <span className="rounded-full shrink-0" style={{ width: 10, height: 10, backgroundColor: colorInfo.main }} />
        <h2 className="text-sm font-semibold text-gray-800 truncate">{post.title || '(제목 없음)'}</h2>
      </div>
      <div className="border-t border-gray-100 mx-5 mb-1" />

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto px-5 pb-10 scrollbar-none">

        {reactions.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-2">
            <span className="text-3xl">🌱</span>
            <p className="text-sm text-gray-400">아직 공감이 없어요</p>
          </div>
        ) : (
          <>
            {/* 색상별 공감 비율 */}
            <section className="mt-5 mb-6">
              <p className="text-sm font-bold text-gray-900 mb-4">색상별 공감 비율</p>
              <div className="flex flex-col gap-3">
                {shownColorRows.map(([color, count]) => (
                  <ColorBarRow key={color} color={color as ColorKey} count={count} max={maxColorCount} />
                ))}
              </div>
              {!colorExpanded && colorRows.length > COLOR_BAR_LIMIT && (
                <button
                  onClick={() => setColorExpanded(true)}
                  className="mt-3 text-sm text-gray-400"
                >
                  더 보기
                </button>
              )}
            </section>

            <div className="border-t border-gray-100 mb-6" />

            {/* 텍스트 공감 */}
            <section className="mb-6">
              <p className="text-sm font-bold text-gray-900 mb-4">텍스트 공감</p>
              <div className="flex flex-wrap gap-2">
                {shownSentenceRows.map(([sentence, count]) => (
                  <span
                    key={sentence}
                    className="inline-flex items-center rounded-full px-3.5 py-2"
                    style={{ border: '1px solid #e8e8e8', backgroundColor: '#fafafa' }}
                  >
                    <span style={{ fontSize: 13, color: '#222222' }}>{sentence}</span>
                    <span style={{ fontSize: 13, color: '#aaaaaa', marginLeft: 6 }}>{count}</span>
                  </span>
                ))}
              </div>
              {!chipExpanded && sentenceRows.length > CHIP_LIMIT && (
                <button
                  onClick={() => setChipExpanded(true)}
                  className="mt-3 text-sm text-gray-400"
                >
                  더 보기
                </button>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function ColorBarRow({ color, count, max }: { color: ColorKey; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="rounded-full shrink-0" style={{ width: 12, height: 12, backgroundColor: COLOR_MAP[color].main }} />
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full"
          style={{ width: `${pct}%`, backgroundColor: COLOR_MAP[color].main, transition: 'width 0.4s ease' }}
        />
      </div>
      <span className="text-xs text-gray-500 w-6 text-right shrink-0">{count}</span>
    </div>
  );
}

function XIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
}
