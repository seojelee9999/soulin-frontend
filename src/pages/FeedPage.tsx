import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColorKey } from '../types';
import { fetchPosts } from '../api/posts';
import { useApp } from '../context/AppContext';
import PostCard from '../components/feed/PostCard';

// 파스텔 배경 (색 미선택)
const PASTEL_BG = [
  'radial-gradient(ellipse at 75% 5%,  #fce4ec 0%, transparent 50%)',
  'radial-gradient(ellipse at 25% 15%, #fff3e0 0%, transparent 45%)',
  'radial-gradient(ellipse at 80% 60%, #e8f5e9 0%, transparent 45%)',
  'radial-gradient(ellipse at 15% 90%, #e3f2fd 0%, transparent 40%)',
  '#fdf8f8',
].join(', ');

// 탭바 컬러 순서 + 파스텔 버전 (피그마 수치)
const TAB_COLORS: { key: ColorKey; pastel: string }[] = [
  { key: 'red',    pastel: '#f4b3b1' },
  { key: 'orange', pastel: '#f6ccb8' },
  { key: 'yellow', pastel: '#f5e1b4' },
  { key: 'lime',   pastel: '#d6eab8' },
  { key: 'green',  pastel: '#b5d7c4' },
  { key: 'cyan',   pastel: '#b9eff5' },
  { key: 'blue',   pastel: '#b6cbee' },
  { key: 'navy',   pastel: '#b3bec9' },
  { key: 'purple', pastel: '#d1baf3' },
  { key: 'pink',   pastel: '#f5becb' },
  { key: 'gray',   pastel: '#d2d2d3' },
  { key: 'black',  pastel: '#b8b8b8' },
];

// 무지개 원 색상 (피그마 ellipse 수치)
const RAINBOW_BLOBS = [
  { color: '#f4b3b1', w: 14, h: 13, left: 8,  top: 9  },
  { color: '#f5e1b4', w: 14, h: 13, left: 2,  top: 7  },
  { color: '#d6eab8', w: 14, h: 13, left: -2, top: 4  },
  { color: '#b9eff5', w: 14, h: 13, left: -2, top: 1  },
  { color: '#b3bec9', w: 14, h: 13, left: 2,  top: -2 },
  { color: '#d1baf3', w: 14, h: 13, left: 5,  top: -2 },
  { color: '#f5becb', w: 11, h: 13, left: 8,  top: -1 },
  { color: '#f4b3b1', w: 14, h: 13, left: 10, top: 3  },
];

function RainbowCircle({ size = 26 }: { size?: number }) {
  const scale = size / 26;
  return (
    <span
      className="relative overflow-hidden block rounded-full shrink-0"
      style={{ width: size, height: size }}
    >
      {RAINBOW_BLOBS.map((b, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            width: b.w * scale,
            height: b.h * scale,
            backgroundColor: b.color,
            left: b.left * scale,
            top: b.top * scale,
            filter: `blur(${5 * scale}px)`,
          }}
        />
      ))}
    </span>
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

  const bgStyle = activeColor
    ? { backgroundColor: '#ffffff' }
    : { background: PASTEL_BG };

  return (
    <div className="flex flex-col h-full" style={bgStyle}>
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
        className="flex overflow-x-auto scrollbar-none shrink-0 bg-white"
        style={{ height: 48, paddingLeft: 8, paddingRight: 8, marginTop: 11 }}
      >
        {/* 전체 (무지개) */}
        <button
          onClick={() => setActiveColor(null)}
          className="flex items-center justify-center shrink-0 active:scale-90 transition-transform"
          style={{ width: 48, height: 48 }}
        >
          <span
            className="flex items-center justify-center rounded-full"
            style={{
              width: 33,
              height: 33,
              background: '#ffffff',
              boxShadow: activeColor === null
                ? '0 0 0 2px white, 0 0 0 4px #c8c8c8'
                : '0 1px 4px rgba(0,0,0,0.12)',
            }}
          >
            <RainbowCircle size={26} />
          </span>
        </button>

        {/* 색상 원들 */}
        {TAB_COLORS.map(({ key, pastel }) => {
          const isActive = activeColor === key;
          return (
            <button
              key={key}
              onClick={() => setActiveColor(key)}
              className="flex items-center justify-center shrink-0 active:scale-90 transition-transform"
              style={{ width: 48, height: 48 }}
            >
              <span
                className="block rounded-full"
                style={{
                  width: 26,
                  height: 26,
                  backgroundColor: pastel,
                  boxShadow: isActive
                    ? `0 0 0 2px white, 0 0 0 4px ${pastel}`
                    : 'none',
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
