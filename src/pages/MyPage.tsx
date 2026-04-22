import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import TopBar from '../components/common/TopBar';

export default function MyPage() {
  const navigate = useNavigate();
  const { logout } = useApp();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <TopBar title="마이페이지" />

      <div className="flex-1 overflow-y-auto pb-24">
        {/* 프로필 */}
        <div className="flex flex-col items-center pt-8 pb-6">
          <div
            className="rounded-full bg-gray-200 flex items-center justify-center mb-3"
            style={{ width: 68, height: 68 }}
          >
            <ImagePlaceholderIcon />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#131416' }}>닉네임입니다</p>
        </div>

        {/* 통계 카드 3개 */}
        <div className="flex gap-3 px-4 mb-8">
          {/* 작성한 글 */}
          <button
            onClick={() => navigate('/posts-manage')}
            className="flex-1 flex flex-col justify-between p-3 active:opacity-80"
            style={{ background: '#f8f8f8', borderRadius: 10, height: 72 }}
          >
            <span style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>12</span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <PencilIcon />
                <span style={{ fontSize: 12, color: '#8a8a8a' }}>작성한 글</span>
              </div>
              <SmallChevron />
            </div>
          </button>

          {/* 받은 공감 */}
          <button
            onClick={() => navigate('/reactions-summary')}
            className="flex-1 flex flex-col justify-between p-3 active:opacity-80"
            style={{ background: '#f8f8f8', borderRadius: 10, height: 72 }}
          >
            <span style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>48</span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <SmileyIcon />
                <span style={{ fontSize: 12, color: '#8a8a8a' }}>받은 공감</span>
              </div>
              <SmallChevron />
            </div>
          </button>

          {/* 마이 리포트 */}
          <div
            className="flex-1 flex flex-col justify-between p-3"
            style={{ background: '#f8f8f8', borderRadius: 10, height: 72 }}
          >
            <span style={{ fontSize: 12, color: '#8a8a8a' }}>Coming Soon</span>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 12, color: '#8a8a8a' }}>마이 리포트</span>
              <SmallChevron />
            </div>
          </div>
        </div>

        {/* 설정 */}
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

        {/* 로그아웃 */}
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

function SmallChevron() {
  return (
    <div
      className="flex items-center justify-center"
      style={{ width: 13, height: 13, background: '#d8d8d8', borderRadius: 2 }}
    >
      <svg width="5" height="8" viewBox="0 0 5 8" fill="none">
        <path d="M1 1L4 4L1 7" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
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
function PencilIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#bababa" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function SmileyIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#bababa" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" strokeLinecap="round" />
      <line x1="15" y1="9" x2="15.01" y2="9" strokeLinecap="round" />
    </svg>
  );
}
