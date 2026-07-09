import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { FeedProvider } from './context/FeedContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BookmarkProvider } from './context/BookmarkContext';
import { DraftProvider } from './context/DraftContext';
import { NotificationProvider } from './context/NotificationContext';
import BottomNav from './components/common/BottomNav';

import FeedPage from './pages/FeedPage';
import ColorSelectPage from './pages/ColorSelectPage';
import WritePage from './pages/WritePage';
import PostDetailPage from './pages/PostDetailPage';
import BookmarkPage from './pages/BookmarkPage';
import MyPage from './pages/MyPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ProfileEditPage from './pages/ProfileEditPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import PostManagePage from './pages/PostManagePage';
import ReactionsSummaryPage from './pages/ReactionsSummaryPage';
import ReactionsDetailPage from './pages/ReactionsDetailPage';
import ColorMatePage from './pages/ColorMatePage';

// mock 인터셉터 활성화 (백엔드 연동 시 주석 처리)
import './api/mock';

const NO_TAB_PATHS = ['/color-select', '/write', '/login', '/signup', '/profile-edit', '/change-password', '/posts-manage', '/color-mate'];

function Layout() {
  const { pathname } = useLocation();
  const { isLoggedIn } = useAuth();
  const hideNav = NO_TAB_PATHS.includes(pathname) || pathname.startsWith('/post/') || pathname.startsWith('/reactions-summary') || pathname.startsWith('/write/');

  if (!isLoggedIn && pathname !== '/login' && pathname !== '/signup') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="relative w-full max-w-[430px] min-h-svh bg-white flex flex-col overflow-hidden shadow-2xl">
      <div key={pathname} className="flex-1 flex flex-col animate-fadeIn">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/" element={<FeedPage />} />
          <Route path="/color-select" element={<ColorSelectPage />} />
          <Route path="/write" element={<WritePage />} />
          <Route path="/write/:postId" element={<WritePage />} />
          <Route path="/post/:id" element={<PostDetailPage />} />
          <Route path="/bookmark" element={<BookmarkPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/profile-edit" element={<ProfileEditPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/posts-manage" element={<PostManagePage />} />
          <Route path="/reactions-summary" element={<ReactionsSummaryPage />} />
          <Route path="/reactions-summary/:postId" element={<ReactionsDetailPage />} />
          <Route path="/color-mate" element={<ColorMatePage />} />
        </Routes>
      </div>
      {!hideNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <BookmarkProvider>
            <DraftProvider>
              <FeedProvider>
                <div className="flex justify-center min-h-svh bg-gray-200">
                  <Layout />
                </div>
              </FeedProvider>
            </DraftProvider>
          </BookmarkProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
