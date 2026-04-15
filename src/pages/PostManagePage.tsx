import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLOR_MAP } from '../types';
import type { Post } from '../types';
import { mockPosts } from '../data/mockPosts';

const TABS = ['작성 게시글', '임시저장/비공개', '반려 게시글'] as const;
type Tab = typeof TABS[number];

function formatDate(iso: string) {
  const d = new Date(iso);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`;
}

export default function PostManagePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('작성 게시글');

  const posts: Post[] = activeTab === '작성 게시글' ? mockPosts : [];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 헤더 */}
      <header className="flex items-center px-5 pt-4 pb-2 shrink-0">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-500 mr-4">
          <ChevronLeft />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#000000' }}>게시글 관리</span>
      </header>

      {/* 탭 */}
      <div className="flex shrink-0" style={{ borderBottom: '1px solid #eeeeee' }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-3 relative"
            style={{
              fontSize: 13,
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? '#000000' : '#8a8a8a',
            }}
          >
            {tab}
            {activeTab === tab && (
              <div
                className="absolute bottom-0 left-0 right-0"
                style={{ height: 2, backgroundColor: '#000000' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto pt-3 pb-4">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60">
            <p style={{ fontSize: 15, fontWeight: 600, color: '#5e5e5e' }}>아직 글이 없어요</p>
          </div>
        ) : (
          posts.map((post) => (
            <ManageCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}

function ManageCard({ post }: { post: Post }) {
  const navigate = useNavigate();
  const hex = COLOR_MAP[post.color].hex;

  return (
    <article
      onClick={() => navigate(`/post/${post.id}`)}
      className="mx-4 mb-3 cursor-pointer active:opacity-80"
      style={{ borderRadius: 15, background: '#f8f8f8' }}
    >
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <span className="rounded-full shrink-0" style={{ width: 15, height: 15, backgroundColor: hex }} />
            <span
              className="flex-1 font-bold line-clamp-1"
              style={{ fontSize: 15, color: '#131416' }}
            >
              {post.title}
            </span>
          </div>
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1 shrink-0"
          >
            <KebabIcon />
          </button>
        </div>
        <p className="line-clamp-3" style={{ fontSize: 15, color: '#5e5e5e', lineHeight: '20px' }}>
          {post.content}
        </p>
        <p style={{ fontSize: 13, color: '#757575' }}>
          {formatDate(post.createdAt)}
        </p>
      </div>
    </article>
  );
}

function ChevronLeft() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
      <path d="M9 1L1 8L9 15" stroke="#858585" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function KebabIcon() {
  return (
    <svg width="3" height="15" viewBox="0 0 3 15" fill="#757575">
      <circle cx="1.5" cy="1.5" r="1.5" />
      <circle cx="1.5" cy="7.5" r="1.5" />
      <circle cx="1.5" cy="13.5" r="1.5" />
    </svg>
  );
}
