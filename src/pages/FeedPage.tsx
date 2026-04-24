import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLOR_MAP, COLOR_KEYS, type ColorKey } from '../types';
import { fetchPosts } from '../api/posts';
import { useApp } from '../context/AppContext';
import PostCard from '../components/feed/PostCard';

// soft 색상 기반 배경 그라데이션 (COLOR_MAP에서 파생)
const COLOR_BG = Object.fromEntries(
  COLOR_KEYS.map((key) => [
    key,
    `linear-gradient(to bottom, ${COLOR_MAP[key].soft} 0%, #ffffff 100%)`,
  ]),
) as Record<ColorKey, string>;

// 무지개 — main 색상 순서로
const RAINBOW_GRADIENT =
  'conic-gradient(#F21A14, #FA6E2C, #F8B420, #90D12C, #219352, #2DE1F5, #266BDE, #1B4163, #7F32F1, #F7416B, #F21A14)';

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

  const bg = activeColor ? COLOR_BG[activeColor] : '#fdf8f8';

  return (
    <div
      className="flex flex-col relative overflow-hidden"
      style={{ height: '100dvh', background: bg, transition: 'background 0.3s ease' }}
    >
      {!activeColor && <RainbowBackground />}
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 shrink-0" style={{ height: 54, position: 'relative', zIndex: 1 }}>
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
          position: 'relative',
          zIndex: 1,
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
        {COLOR_KEYS.map((key) => {
          const isActive = activeColor === key;
          const { main, soft } = COLOR_MAP[key];
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
                  backgroundColor: isActive ? main : soft,
                  boxShadow: isActive ? `0 0 0 2px white, 0 0 0 3.5px ${main}` : 'none',
                  transform: isActive ? 'scale(1.15)' : 'scale(1)',
                  transition: 'background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
                }}
              />
            </button>
          );
        })}
      </div>

      {/* 피드 스크롤 */}
      <div className="flex-1 overflow-y-auto pb-24 scrollbar-none" style={{ paddingTop: 25, position: 'relative', zIndex: 1 }}>
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

function RainbowBackground() {
  return (
    <div className="feed-rainbow-bg" aria-hidden="true">
      <div className="color-orb color-orb-1" />
      <div className="color-orb color-orb-2" />
      <div className="color-orb color-orb-3" />
      <div className="color-orb color-orb-4" />
      <div className="color-orb color-orb-5" />
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
