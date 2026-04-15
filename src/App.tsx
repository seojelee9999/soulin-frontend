import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
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

// mock 인터셉터 활성화
import './api/mock';

const NO_TAB_PATHS = ['/color-select', '/write', '/login', '/signup', '/profile-edit', '/change-password', '/posts-manage'];

function Layout() {
  const { pathname } = useLocation();
  const { isLoggedIn } = useApp();
  const hideNav = NO_TAB_PATHS.includes(pathname) || pathname.startsWith('/post/');

  if (!isLoggedIn && pathname !== '/login' && pathname !== '/signup') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="relative w-full max-w-[430px] min-h-svh bg-white flex flex-col overflow-hidden shadow-2xl">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/" element={<FeedPage />} />
        <Route path="/color-select" element={<ColorSelectPage />} />
        <Route path="/write" element={<WritePage />} />
        <Route path="/post/:id" element={<PostDetailPage />} />
        <Route path="/bookmark" element={<BookmarkPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/profile-edit" element={<ProfileEditPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/posts-manage" element={<PostManagePage />} />
      </Routes>
      {!hideNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div className="flex justify-center min-h-svh bg-gray-200">
          <Layout />
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}
