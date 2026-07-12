import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLOR_MAP, COLOR_KEYS, COLOR_ID_MAP, type ColorKey } from '../types';
import { fetchPosts } from '../api/posts';
import { useFeed } from '../context/FeedContext';
import { useNotification } from '../context/NotificationContext';
import PostCard from '../components/feed/PostCard';
import RainbowBackground from '../components/common/RainbowBackground';
import PostCardSkeleton from '../components/skeleton/PostCardSkeleton';

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
  const { feedPosts, setFeedPosts } = useFeed();
  const { unreadCount } = useNotification();
  const [activeColor, setActiveColor] = useState<ColorKey | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const restoredRef = useRef(false);

  useEffect(() => {
    setLoading(true);
    fetchPosts(activeColor ? COLOR_ID_MAP[activeColor] : undefined)
      .then(setFeedPosts)
      .finally(() => setLoading(false));
  }, [activeColor, setFeedPosts]);

  const displayed = activeColor
    ? feedPosts.filter((p) => p.color === activeColor)
    : feedPosts;

  // 스크롤 위치 저장: 언마운트 직전 sessionStorage에 저장
  useEffect(() => {
    const el = scrollRef.current;
    return () => {
      if (el) sessionStorage.setItem('feed_scroll', String(el.scrollTop));
    };
  }, []);

  // 스크롤 위치 복원: 데이터 로드 후 1회만 (useLayoutEffect로 페인트 전 실행 → 깜빡임 방지)
  useLayoutEffect(() => {
    if (restoredRef.current) return;
    if (loading) return;
    const el = scrollRef.current;
    const saved = sessionStorage.getItem('feed_scroll');
    if (el && saved) {
      el.scrollTop = parseInt(saved, 10);
      restoredRef.current = true;
    }
  }, [loading, displayed.length]);

  const bg = activeColor ? COLOR_BG[activeColor] : '#fdf8f8';

  return (
    <div
      className="flex flex-col relative overflow-hidden"
      style={{ height: '100dvh', background: bg, transition: 'background 0.3s ease' }}
    >
      {!activeColor && <RainbowBackground />}
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 shrink-0" style={{ height: 54, position: 'relative', zIndex: 1 }}>
        <span className="w-6" />
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#000000' }}>피드</h1>
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-1 text-gray-500"
          aria-label="알림"
        >
          <BellIcon />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>
      </header>

      {/* 수평 스크롤 탭바 */}
      <div
        className="shrink-0 flex overflow-x-auto scrollbar-none items-center gap-1"
        style={{
          marginTop: 11,
          background: '#ffffff',
          paddingTop: 0,
          paddingBottom: 0,
          paddingLeft: 9,
          paddingRight: 9,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* 전체 (무지개) */}
        <button
          onClick={() => setActiveColor(null)}
          className="flex items-center justify-center shrink-0"
          style={{ width: 48, height: 48 }}
        >
          <RainbowCircle
            size={26}
            style={{
              opacity: activeColor === null ? 1 : 0.4,
              boxShadow: activeColor === null
                ? '0 0 0 2px white, 0 0 0 4px #9ca3af'
                : 'none',
              transition: 'opacity 0.15s ease, box-shadow 0.15s ease',
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
              style={{ width: 48, height: 48 }}
            >
              <span
                className="block rounded-full"
                style={{
                  width: 26,
                  height: 26,
                  backgroundColor: isActive ? main : soft,
                  boxShadow: isActive ? `0 0 0 2px white, 0 0 0 4px ${main}` : 'none',
                  transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
                }}
              />
            </button>
          );
        })}
      </div>

      {/* 피드 스크롤 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-24 scrollbar-thin" style={{ paddingTop: 25, marginBottom: 'calc(60px + env(safe-area-inset-bottom, 0px))', position: 'relative', zIndex: 1, scrollbarGutter: 'stable' }}>
        {loading && displayed.length === 0 ? (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </>
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

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}


