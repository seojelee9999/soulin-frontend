import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBookmarks } from '../api/posts';
import { useBookmark } from '../context/BookmarkContext';
import { COLOR_MAP } from '../types';
import type { Post } from '../types';
import TopBar from '../components/common/TopBar';
import BookmarkCardSkeleton from '../components/skeleton/BookmarkCardSkeleton';

function formatDate(iso: string) {
  const d = new Date(iso);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`;
}

export default function BookmarkPage() {
  const navigate = useNavigate();
  const { bookmarkedIds } = useBookmark();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookmarks()
      .then(setPosts)
      .finally(() => setLoading(false));
  }, [bookmarkedIds]);

  return (
    <div className="flex flex-col h-full bg-white">
      <TopBar title="북마크" />

      <div className="flex-1 overflow-y-auto pb-24">
        {loading && posts.length === 0 ? (
          <div className="pt-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <BookmarkCardSkeleton key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <p style={{ fontSize: 15, fontWeight: 700, color: '#5e5e5e' }}>아직 담아둔 글이 없어요</p>
            <p style={{ fontSize: 14, fontWeight: 400, color: '#8a8a8a', lineHeight: 1.6 }}>
              마음에 닿는 글을 만나면<br />오랫동안 간직해보세요
            </p>
          </div>
        ) : (
          <div className="pt-3">
            {posts.map((post) => (
              <BookmarkCard key={post.id} post={post} onNavigate={() => navigate(`/post/${post.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BookmarkCard({ post, onNavigate }: { post: Post; onNavigate: () => void }) {
  const hex = COLOR_MAP[post.color].main;
  const subHex = COLOR_MAP[post.color].soft;

  return (
    <article
      onClick={onNavigate}
      className="mx-4 mb-3 cursor-pointer active:opacity-80"
      style={{
        borderRadius: 15,
        background: '#ffffff',
        border: `2px solid ${subHex}`,
      }}
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

function KebabIcon() {
  return (
    <svg width="3" height="15" viewBox="0 0 3 15" fill="#757575">
      <circle cx="1.5" cy="1.5" r="1.5" />
      <circle cx="1.5" cy="7.5" r="1.5" />
      <circle cx="1.5" cy="13.5" r="1.5" />
    </svg>
  );
}
