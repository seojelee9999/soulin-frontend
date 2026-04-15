import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColorKey } from '../types';
import { fetchPosts } from '../api/posts';
import { useApp } from '../context/AppContext';
import PostCard from '../components/feed/PostCard';

// 파스텔 배경 (색 미선택 — 무지개)
const PASTEL_BG = [
  'radial-gradient(ellipse at 75% 5%,  #fce4ec 0%, transparent 50%)',
  'radial-gradient(ellipse at 25% 15%, #fff3e0 0%, transparent 45%)',
  'radial-gradient(ellipse at 80% 60%, #e8f5e9 0%, transparent 45%)',
  'radial-gradient(ellipse at 15% 90%, #e3f2fd 0%, transparent 40%)',
  '#fdf8f8',
].join(', ');

// 색상별 배경 그라데이션 (위→아래, 파스텔 → 흰색)
const COLOR_BG: Record<string, string> = {
  red:    'linear-gradient(to bottom, #FFE4E4 0%, #ffffff 100%)',
  orange: 'linear-gradient(to bottom, #FFE8D6 0%, #ffffff 100%)',
  yellow: 'linear-gradient(to bottom, #FFF8D6 0%, #ffffff 100%)',
  lime:   'linear-gradient(to bottom, #F0FFD6 0%, #ffffff 100%)',
  green:  'linear-gradient(to bottom, #D6FFE4 0%, #ffffff 100%)',
  cyan:   'linear-gradient(to bottom, #D6F8FF 0%, #ffffff 100%)',
  blue:   'linear-gradient(to bottom, #D6E8FF 0%, #ffffff 100%)',
  navy:   'linear-gradient(to bottom, #D6DCFF 0%, #ffffff 100%)',
  purple: 'linear-gradient(to bottom, #EDD6FF 0%, #ffffff 100%)',
  pink:   'linear-gradient(to bottom, #FFD6EE 0%, #ffffff 100%)',
  gray:   'linear-gradient(to bottom, #EBEBEB 0%, #ffffff 100%)',
  black:  'linear-gradient(to bottom, #D6D6D6 0%, #ffffff 100%)',
};

// 탭바 컬러 순서 + 파스텔(미선택) / 진한색(선택)
const TAB_COLORS: { key: ColorKey; pastel: string; vivid: string }[] = [
  { key: 'red',    pastel: '#f4b3b1', vivid: '#FF4444' },
  { key: 'orange', pastel: '#f6ccb8', vivid: '#FF8C42' },
  { key: 'yellow', pastel: '#f5e1b4', vivid: '#FFD600' },
  { key: 'lime',   pastel: '#d6eab8', vivid: '#AADD00' },
  { key: 'green',  pastel: '#b5d7c4', vivid: '#22BB66' },
  { key: 'cyan',   pastel: '#b9eff5', vivid: '#00CCDD' },
  { key: 'blue',   pastel: '#b6cbee', vivid: '#3388FF' },
  { key: 'navy',   pastel: '#b3bec9', vivid: '#3344CC' },
  { key: 'purple', pastel: '#d1baf3', vivid: '#9944EE' },
  { key: 'pink',   pastel: '#f5becb', vivid: '#FF44AA' },
  { key: 'gray',   pastel: '#d2d2d3', vivid: '#999999' },
  { key: 'black',  pastel: '#b8b8b8', vivid: '#333333' },
];

const RAINBOW_GRADIENT =
  'conic-gradient(#FF4444, #FF8C00, #FFD700, #44BB44, #4488FF, #8844EE, #FF4444)';

function RainbowCircle({ size = 26, style }: { size?: number; style?: import('react').CSSProperties }) {
  return (
    <span
      className="block rounded-full shrink-0"
      style={{ width: size, height: size, background: RAINBOW_GRADIENT, ...style }}
    />
  );
}

export default function FeedPage() {
  const navigate = useNavigate();
  const { feedPosts, setFeedPosts } = useApp();
  const [activeColor, setActiveColor] = useState<ColorKey | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchPosts(activeColor ?? undefined)
      .then(setFeedPosts)
      .finally(() => setLoading(false));
  }, [activeColor, setFeedPosts]);

  const displayed = activeColor
    ? feedPosts.filter((p) => p.color === activeColor)
    : feedPosts;

  const bg = activeColor ? COLOR_BG[activeColor] : PASTEL_BG;

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: bg, transition: 'background 0.3s ease' }}
    >
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 shrink-0" style={{ height: 54 }}>
        <button onClick={() => navigate(-1)} className="p-1 text-gray-500">
          <ChevronLeft />
        </button>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#000000' }}>피드</h1>
        <div style={{ width: 28 }} />
      </header>

      {/* 수평 스크롤 탭바 */}
      <div
        className="shrink-0 flex overflow-x-auto scrollbar-none items-center gap-1"
        style={{
          marginTop: 11,
          background: '#ffffff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          paddingTop: 9,
          paddingBottom: 9,
          paddingLeft: 16,
          paddingRight: 16,
        }}
      >
        {/* 전체 (무지개) */}
        <button
          onClick={() => setActiveColor(null)}
          className="flex items-center justify-center shrink-0"
          style={{ width: 36, height: 32 }}
        >
          <RainbowCircle
            size={20}
            style={{
              opacity: activeColor === null ? 1 : 0.4,
              boxShadow: activeColor === null
                ? '0 0 0 2px white, 0 0 0 3.5px #aaaaaa'
                : 'none',
              transform: activeColor === null ? 'scale(1.15)' : 'scale(1)',
              transition: 'opacity 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
            }}
          />
        </button>

        {/* 색상 원들 */}
        {TAB_COLORS.map(({ key, pastel, vivid }) => {
          const isActive = activeColor === key;
          return (
            <button
              key={key}
              onClick={() => setActiveColor(key)}
              className="flex items-center justify-center shrink-0"
              style={{ width: 32, height: 32 }}
            >
              <span
                className="block rounded-full"
                style={{
                  width: 20,
                  height: 20,
                  backgroundColor: isActive ? vivid : pastel,
                  boxShadow: isActive ? `0 0 0 2px white, 0 0 0 3.5px ${vivid}` : 'none',
                  transform: isActive ? 'scale(1.15)' : 'scale(1)',
                  transition: 'background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
                }}
              />
            </button>
          );
        })}
      </div>

      {/* 피드 스크롤 */}
      <div className="flex-1 overflow-y-auto pb-24 scrollbar-none" style={{ paddingTop: 25 }}>
        {loading ? (
          <div className="flex items-center justify-center h-40 text-sm text-gray-400">
            불러오는 중...
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <p className="text-sm text-gray-400">아직 글이 없어요</p>
          </div>
        ) : (
          displayed.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
      <path d="M9 1L1 8L9 15" stroke="#858585" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
