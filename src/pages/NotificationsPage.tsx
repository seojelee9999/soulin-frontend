import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/common/TopBar';
import BackButton from '../components/common/BackButton';
import { useNotification } from '../context/NotificationContext';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, refetch, markAllRead } = useNotification();
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
          <div className="pt-3 px-4 text-sm text-gray-400 text-center">
            {notifications.length}개의 알림 (카드는 다음 단계)
          </div>
        )}
      </div>
    </div>
  );
}
