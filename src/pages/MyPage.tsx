import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchReactionSummary } from '../api/reactions';
import TopBar from '../components/common/TopBar';
import MyPageSkeleton from '../components/skeleton/MyPageSkeleton';
import logo from '../assets/logo.png';
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
        {/* 1) 프로필 — 좌측 가로 배치 */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-6">
          <div
            className="rounded-full bg-gray-100 overflow-hidden shrink-0"
            style={{ width: 40, height: 40 }}
          >
            <img src={logo} alt="" className="w-full h-full object-cover" />
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
            className="flex-1 flex flex-col justify-between p-4 active:opacity-80 rounded-xl"
            style={{ background: '#f4f4f4', minHeight: 120, textAlign: 'left' }}
          >
            <span style={{ fontSize: 26, fontWeight: 700, color: '#131416', lineHeight: 1 }}>
              {display(reactionCount)}
            </span>
            <div className="flex items-center gap-1.5">
              <SmileIcon />
              <span style={{ fontSize: 12, color: '#5e5e5e' }}>받은 공감</span>
              <span className="ml-auto"><ChevronRight /></span>
            </div>
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
function SmileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5e5e5e" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" strokeLinecap="round" />
      <line x1="15" y1="9" x2="15.01" y2="9" strokeLinecap="round" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
      <path d="M1.5 1L6.5 6L1.5 11" stroke="#8a8a8a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
