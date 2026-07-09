import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/common/TopBar';
import BackButton from '../components/common/BackButton';
import ColorDot from '../components/common/ColorDot';
import { COLOR_KEYS, type ColorKey, type NotificationItem } from '../types';
import { useNotification } from '../context/NotificationContext';
import { formatRelative } from '../utils/time';

// colorName(BE: 'RED', 'NAVY' 등 대문자 영문) → ColorKey. 미매칭 시 null.
function toColorKey(name: string): ColorKey | null {
  const lower = name.toLowerCase();
  return (COLOR_KEYS as readonly string[]).includes(lower) ? (lower as ColorKey) : null;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, refetch, markRead, markAllRead } = useNotification();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      await refetch();
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [refetch]);

  const handleCardClick = (item: NotificationItem) => {
    if (!item.read) markRead(item.notificationId); // fire-and-forget, 낙관적
    navigate(`/post/${item.postId}`);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <TopBar
        title="알림"
        left={<BackButton onClick={() => navigate(-1)} />}
        right={
          notifications.length > 0 ? (
            <button
              onClick={markAllRead}
              className="text-xs text-gray-400 whitespace-nowrap"
            >
              모두 읽음
            </button>
          ) : undefined
        }
      />
      <div className="flex-1 overflow-y-auto pb-24">
        {loading ? (
          <div className="pt-3 px-4 text-sm text-gray-400 text-center mt-10">불러오는 중…</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-24 text-gray-400">
            <p className="text-sm">아직 알림이 없어요</p>
          </div>
        ) : (
          <div className="pt-3">
            {notifications.map((n) => (
              <NotificationCard key={n.notificationId} item={n} onClick={() => handleCardClick(n)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationCard({ item, onClick }: { item: NotificationItem; onClick: () => void }) {
  const colorKey = toColorKey(item.colorName);
  return (
    <article
      onClick={onClick}
      className={`mx-4 mb-3 rounded-xl p-4 cursor-pointer active:opacity-80 ${
        item.read ? 'bg-gray-50' : 'bg-white border-l-4 border-red-400'
      }`}
    >
      <div className="flex items-start gap-2">
        {colorKey && <ColorDot color={colorKey} size="sm" />}
        <div className="flex-1">
          <p className="text-sm text-gray-800 leading-relaxed">
            <strong className="font-semibold">{item.actorName}</strong>님이 회원님의{' '}
            <strong className="font-semibold">‘{item.postTitle}’</strong>에{' '}
            <strong className="font-semibold">‘{item.reactionName}’</strong>으로 공감했어요
          </p>
          <p className="mt-1 text-xs text-gray-400">{formatRelative(item.createdAt)}</p>
        </div>
      </div>
    </article>
  );
}
