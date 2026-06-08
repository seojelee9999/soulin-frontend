import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchReactionSummary } from '../api/reactions';
import TopBar from '../components/common/TopBar';
import MyPageSkeleton from '../components/skeleton/MyPageSkeleton';
import ColorCalendar from '../components/myPage/ColorCalendar';
import PeriodSelector from '../components/myPage/PeriodSelector';
import ColorRatioGraph from '../components/myPage/ColorRatioGraph';
import EmotionReportCard from '../components/myPage/EmotionReportCard';
import type { PeriodPreset } from '../types/myPage';

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export default function MyPage() {
  const navigate = useNavigate();
  const { userName, logout } = useAuth();
  const [reactionCount, setReactionCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodPreset>('1m');

  // 현재 연/월 (캘린더 + 감정 요약 'YYYY-MM')
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const periodLabel = `${year}-${pad2(month)}`;

  useEffect(() => {
    let cancelled = false;
    fetchReactionSummary()
      .then((summary) => {
        if (cancelled) return;
        setReactionCount(summary.totalReactionCount ?? 0);
      })
      .catch((err) => {
        console.error('mypage stats failed', err);
        if (cancelled) return;
        setReactionCount(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const display = (n: number | null) => (n == null ? '—' : String(n));

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white">
        <TopBar title="마이페이지" />
        <MyPageSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <TopBar title="마이페이지" />

      <div className="flex-1 overflow-y-auto pb-24">
        {/* 1) 프로필 */}
        <div className="flex flex-col items-center pt-8 pb-6">
          <div
            className="rounded-full bg-gray-200 flex items-center justify-center mb-3"
            style={{ width: 68, height: 68 }}
          >
            <ImagePlaceholderIcon />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#131416' }}>{userName ?? ''}</p>
        </div>

        {/* 2) 컬러 캘린더 */}
        <ColorCalendar year={year} month={month} onSelectDate={() => {}} />

        {/* 3) 기간 선택 */}
        <PeriodSelector value={period} onChange={setPeriod} />

        {/* 4) 컬러 비율 그래프 */}
        <ColorRatioGraph period={period} />

        {/* 5) 받은 공감 + 감정 요약 (가로 2카드) */}
        <div className="flex gap-3 px-4 mb-8">
          <button
            onClick={() => navigate('/reactions-summary')}
            className="flex-1 flex flex-col p-3 active:opacity-80"
            style={{ background: '#f8f8f8', borderRadius: 10, minHeight: 110, textAlign: 'left' }}
          >
            <span style={{ fontSize: 12, color: '#8a8a8a', marginBottom: 6 }}>받은 공감</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>
              {display(reactionCount)}
            </span>
          </button>
          <EmotionReportCard period={periodLabel} />
        </div>

        {/* 6) 글 관리 */}
        <div className="px-4 mb-8">
          <p style={{ fontSize: 15, fontWeight: 700, color: '#222222', marginBottom: 12 }}>글 관리</p>
          <div style={{ borderTop: '1px solid #eeeeee' }}>
            <button
              onClick={() => navigate('/posts-manage')}
              className="w-full flex items-center justify-between py-4"
              style={{ borderBottom: '1px solid #eeeeee' }}
            >
              <span style={{ fontSize: 15, fontWeight: 400, color: '#222222' }}>작성 게시글</span>
              <SettingChevron />
            </button>
            <button
              onClick={() => navigate('/posts-manage')}
              className="w-full flex items-center justify-between py-4"
              style={{ borderBottom: '1px solid #eeeeee' }}
            >
              <span style={{ fontSize: 15, fontWeight: 400, color: '#222222' }}>임시저장</span>
              <SettingChevron />
            </button>
            <button
              onClick={() => navigate('/posts-manage')}
              className="w-full flex items-center justify-between py-4"
              style={{ borderBottom: '1px solid #eeeeee' }}
            >
              <span style={{ fontSize: 15, fontWeight: 400, color: '#222222' }}>반려 게시글</span>
              <SettingChevron />
            </button>
          </div>
        </div>

        {/* 7) 설정 */}
        <div className="px-4">
          <p style={{ fontSize: 15, fontWeight: 700, color: '#222222', marginBottom: 12 }}>설정</p>
          <div style={{ borderTop: '1px solid #eeeeee' }}>
            <button
              onClick={() => navigate('/profile-edit')}
              className="w-full flex items-center justify-between py-4"
              style={{ borderBottom: '1px solid #eeeeee' }}
            >
              <span style={{ fontSize: 15, fontWeight: 400, color: '#222222' }}>내 프로필 편집</span>
              <SettingChevron />
            </button>
            <button
              onClick={() => navigate('/change-password')}
              className="w-full flex items-center justify-between py-4"
              style={{ borderBottom: '1px solid #eeeeee' }}
            >
              <span style={{ fontSize: 15, fontWeight: 400, color: '#222222' }}>비밀번호 변경</span>
              <SettingChevron />
            </button>
          </div>
        </div>

        {/* 8) 로그아웃 */}
        <div className="flex justify-center mt-10">
          <button
            onClick={handleLogout}
            style={{ fontSize: 15, fontWeight: 400, color: 'rgba(242,26,20,1)' }}
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingChevron() {
  return (
    <svg width="7" height="11" viewBox="0 0 7 11" fill="none">
      <path d="M1 1L6 5.5L1 10" stroke="#bababa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ImagePlaceholderIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
    </svg>
  );
}
