import { useNavigate } from 'react-router-dom';
import { COLOR_MAP, type ColorKey } from '../../types';
import type { Post } from '../../types';

interface Props {
  post: Post;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`;
}

export default function PostCard({ post }: Props) {
  const navigate = useNavigate();
  const color = post.color as ColorKey;
  const hex = COLOR_MAP[color].main;

  return (
    <article
      onClick={() => navigate(`/post/${post.id}`)}
      className="mx-4 mb-4 bg-white cursor-pointer active:scale-[0.985] transition-transform"
      style={{ borderRadius: 15 }}
    >
      <div className="p-4 flex flex-col gap-4">
        {/* 제목 행: 색상원 + 제목 */}
        <div className="flex items-center gap-2">
          <span
            className="shrink-0 rounded-full"
            style={{ width: 15, height: 15, backgroundColor: hex }}
          />
          <span
            className="flex-1 font-bold leading-snug line-clamp-1"
            style={{ fontSize: 15, color: '#131416' }}
          >
            {post.title}
          </span>
        </div>

        {/* 본문 */}
        <p
          className="leading-[18px] line-clamp-3"
          style={{ fontSize: 15, color: '#5e5e5e' }}
        >
          {post.content}
        </p>

        {/* 날짜 */}
        <p style={{ fontSize: 13, color: '#757575', lineHeight: '15.6px' }}>
          {formatDate(post.createdAt)}
        </p>
      </div>
    </article>
  );
}
