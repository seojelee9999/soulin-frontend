import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.png';

const WRITE_ORIGINS = ['/', '/bookmark', '/mypage'];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleWrite = () => {
    const from = WRITE_ORIGINS.includes(location.pathname) ? location.pathname : '/';
    navigate('/color-select', { state: { from } });
  };

  // 가운데 오브 FAB → Color Mate AI 에이전트 (글작성 연필과 별개 진입)
  const handleAgent = () => {
    navigate('/color-mate', { state: { from: location.pathname } });
  };

  const isWriteActive =
    location.pathname === '/color-select' || location.pathname === '/write';

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 bg-white"
      style={{
        borderRadius: '12px 12px 0 0',
        boxShadow: '0 -2px 6px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-stretch h-[60px]">
        {/* 피드 */}
        <NavLink to="/" end className="flex-1 flex flex-col items-center justify-center gap-1 pb-1">
          {({ isActive }) => (
            <>
              <FeedIcon active={isActive} />
              <span className="text-[10px] font-medium leading-none" style={{ color: isActive ? '#000000' : '#8a8a8a' }}>
                피드
              </span>
            </>
          )}
        </NavLink>

        {/* 글작성 */}
        <button
          onClick={handleWrite}
          className="flex-1 flex flex-col items-center justify-center gap-1 pb-1"
        >
          <WriteIcon active={isWriteActive} />
          <span className="text-[10px] font-medium leading-none" style={{ color: isWriteActive ? '#000000' : '#8a8a8a' }}>
            글작성
          </span>
        </button>

        {/* 가운데 오브 FAB (Color Mate) — 흰 원형 받침이 바에서 볼록 솟고 오브가 얹힌 형태 */}
        <div className="flex-1 flex items-center justify-center relative">
          <button
            onClick={handleAgent}
            aria-label="Color Mate"
            className="absolute rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{
              width: 60,
              height: 60,
              bottom: 20,
              backgroundColor: '#ffffff',
              // 받침은 네비 바와 같은 면: 바와 동일한 위쪽 그림자만(360도 디스크 그림자 X)
              boxShadow: '0 -2px 6px rgba(0,0,0,0.06)',
            }}
          >
            {/* 오브는 흰 면 위로 떠서 자체 그림자(투명 PNG 알파 따라 drop-shadow) */}
            <span style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.18))' }}>
              <span className="block rounded-full overflow-hidden" style={{ width: 50, height: 50 }}>
                <img src={logo} alt="" className="w-full h-full object-cover" />
              </span>
            </span>
          </button>
        </div>

        {/* 북마크 */}
        <NavLink to="/bookmark" className="flex-1 flex flex-col items-center justify-center gap-1 pb-1">
          {({ isActive }) => (
            <>
              <BookmarkIcon active={isActive} />
              <span className="text-[10px] font-medium leading-none" style={{ color: isActive ? '#000000' : '#8a8a8a' }}>
                북마크
              </span>
            </>
          )}
        </NavLink>

        {/* 마이페이지 */}
        <NavLink to="/mypage" className="flex-1 flex flex-col items-center justify-center gap-1 pb-1">
          {({ isActive }) => (
            <>
              <MyPageIcon active={isActive} />
              <span className="text-[10px] font-medium leading-none" style={{ color: isActive ? '#000000' : '#8a8a8a' }}>
                마이페이지
              </span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
}

// 피드 아이콘 — 피그마 원본 (filled house)
function FeedIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0 6.3L8 0L16 6.3V16.2C16 16.6774 15.8127 17.1352 15.4793 17.4728C15.1459 17.8104 14.6937 18 14.2222 18H1.77778C1.30628 18 0.854097 17.8104 0.520699 17.4728C0.187301 17.1352 0 16.6774 0 16.2V6.3Z"
        fill={active ? '#000000' : '#bababa'}
      />
    </svg>
  );
}

// 글작성 아이콘 — 피그마 원본 (pencil)
function WriteIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 16H3.425L13.2 6.225L11.775 4.8L2 14.575V16ZM0 18V13.75L13.2 0.575C13.4 0.391667 13.6208 0.25 13.8625 0.15C14.1042 0.05 14.3583 0 14.625 0C14.8917 0 15.15 0.05 15.4 0.15C15.65 0.25 15.8667 0.4 16.05 0.6L17.425 2C17.625 2.18333 17.7708 2.4 17.8625 2.65C17.9542 2.9 18 3.15 18 3.4C18 3.66667 17.9542 3.92083 17.8625 4.1625C17.7708 4.40417 17.625 4.625 17.425 4.825L4.25 18H0ZM12.475 5.525L11.775 4.8L13.2 6.225L12.475 5.525Z"
        fill={active ? '#000000' : '#bababa'}
      />
    </svg>
  );
}

// 북마크 아이콘 — 피그마 원본 (outline bookmark)
function BookmarkIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 0.75H12C12.3495 0.75 12.6297 0.866028 12.8818 1.11816C13.134 1.3703 13.25 1.65049 13.25 2V16.8623L7.2959 14.3105L7 14.1836L6.7041 14.3105L0.75 16.8623V2C0.75 1.65049 0.866028 1.3703 1.11816 1.11816C1.3703 0.866028 1.65049 0.75 2 0.75Z"
        stroke={active ? '#000000' : '#bababa'}
        strokeWidth="1.5"
        fill={active ? '#000000' : 'none'}
      />
    </svg>
  );
}

// 마이페이지 아이콘 — 피그마 원본 (person in circle)
function MyPageIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.465 13.59C4.23 13.005 5.085 12.5437 6.03 12.2062C6.975 11.8687 7.965 11.7 9 11.7C10.035 11.7 11.025 11.8687 11.97 12.2062C12.915 12.5437 13.77 13.005 14.535 13.59C15.06 12.975 15.4688 12.2775 15.7613 11.4975C16.0538 10.7175 16.2 9.885 16.2 9C16.2 7.005 15.4987 5.30625 14.0962 3.90375C12.6937 2.50125 10.995 1.8 9 1.8C7.005 1.8 5.30625 2.50125 3.90375 3.90375C2.50125 5.30625 1.8 7.005 1.8 9C1.8 9.885 1.94625 10.7175 2.23875 11.4975C2.53125 12.2775 2.94 12.975 3.465 13.59ZM9 9.9C8.115 9.9 7.36875 9.59625 6.76125 8.98875C6.15375 8.38125 5.85 7.635 5.85 6.75C5.85 5.865 6.15375 5.11875 6.76125 4.51125C7.36875 3.90375 8.115 3.6 9 3.6C9.885 3.6 10.6312 3.90375 11.2387 4.51125C11.8462 5.11875 12.15 5.865 12.15 6.75C12.15 7.635 11.8462 8.38125 11.2387 8.98875C10.6312 9.59625 9.885 9.9 9 9.9ZM9 18C7.755 18 6.585 17.7637 5.49 17.2912C4.395 16.8187 3.4425 16.1775 2.6325 15.3675C1.8225 14.5575 1.18125 13.605 0.70875 12.51C0.23625 11.415 0 10.245 0 9C0 7.755 0.23625 6.585 0.70875 5.49C1.18125 4.395 1.8225 3.4425 2.6325 2.6325C3.4425 1.8225 4.395 1.18125 5.49 0.70875C6.585 0.23625 7.755 0 9 0C10.245 0 11.415 0.23625 12.51 0.70875C13.605 1.18125 14.5575 1.8225 15.3675 2.6325C16.1775 3.4425 16.8187 4.395 17.2912 5.49C17.7637 6.585 18 7.755 18 9C18 10.245 17.7637 11.415 17.2912 12.51C16.8187 13.605 16.1775 14.5575 15.3675 15.3675C14.5575 16.1775 13.605 16.8187 12.51 17.2912C11.415 17.7637 10.245 18 9 18Z"
        fill={active ? '#000000' : '#bababa'}
      />
    </svg>
  );
}
