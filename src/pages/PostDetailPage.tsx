import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { COLOR_MAP } from '../types';
import type { Post, EmpathyReaction } from '../types';
import { fetchPost, sendEmpathy } from '../api/posts';
import { useApp } from '../context/AppContext';
import EmpathyBottomSheet from '../components/post/EmpathyBottomSheet';

function formatDate(iso: string) {
  const d = new Date(iso);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`;
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { bookmarkedIds, toggleBookmark, updatePost } = useApp();
  const [post, setPost] = useState<Post | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [bookmarkToastOpen, setBookmarkToastOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchPost(id).then(setPost).finally(() => setLoading(false));
  }, [id]);

  const handleEmpathy = async (reaction: EmpathyReaction) => {
    if (!post) return;
    await sendEmpathy(post.id, reaction);
    const updated: Post = {
      ...post,
      empathyCount: post.empathyCount + 1,
      reactions: [...post.reactions, reaction],
    };
    setPost(updated);
    updatePost(updated);
  };

  const handleBookmark = () => {
    if (!post) return;
    toggleBookmark(post.id);
    setActionSheetOpen(false);
    setBookmarkToastOpen(true);
    setTimeout(() => setBookmarkToastOpen(false), 1600);
  };

  const handleBookmarkInCard = () => {
    if (!post) return;
    toggleBookmark(post.id);
    setBookmarkToastOpen(true);
    setTimeout(() => setBookmarkToastOpen(false), 1600);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-sm text-gray-400">불러오는 중...</div>;
  }
  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <span className="text-3xl">🌫</span>
        <p className="text-sm text-gray-400">글을 찾을 수 없어요</p>
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 underline">돌아가기</button>
      </div>
    );
  }

  const colorInfo = COLOR_MAP[post.color];
  const isBookmarked = bookmarkedIds.has(post.id);
  const shownReactions = post.reactions.slice(0, 6);
  const hasMore = post.reactions.length > 6;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 상단바 — 케밥 없음 */}
      <header className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-500"><ChevronLeft /></button>
        <h1 className="text-base font-bold text-gray-800">피드</h1>
        <div className="w-7" /> {/* 균형용 */}
      </header>

      {/* 제목 행 — 색상 원 + 제목 + 케밥 */}
      <div className="flex items-center gap-3 px-5 py-3 shrink-0">
        <span className="w-6 h-6 rounded-full shrink-0" style={{ backgroundColor: colorInfo.hex }} />
        <h2 className="text-base font-bold text-gray-900 flex-1 leading-snug">{post.title}</h2>
        <button
          onClick={() => setActionSheetOpen(true)}
          className="p-1 text-gray-400 shrink-0"
        >
          <KebabIcon />
        </button>
      </div>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto px-5 pb-32 scrollbar-none">
        {/* 본문 카드 */}
        <div
          className="rounded-2xl p-4 mb-5"
          style={{
            border: `1.5px solid ${colorInfo.hex}40`,
            backgroundColor: colorInfo.hex + '08',
          }}
        >
          <p className="leading-[18px] whitespace-pre-wrap mb-4" style={{ fontSize: 15, color: '#5e5e5e' }}>
            {post.content}
          </p>
          {/* 카드 하단 */}
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 12, color: '#8a8a8a' }}>
              {post.authorNickname} • {formatDate(post.createdAt)}
            </span>
            <button onClick={handleBookmarkInCard} className="transition-colors">
              <BookmarkSm filled={isBookmarked} />
            </button>
          </div>
        </div>

        {/* 받은 공감 */}
        {post.reactions.length > 0 && (
          <div className="mb-4">
            <p className="mb-3" style={{ fontSize: 14, color: '#131416' }}>받은 공감</p>
            <div className="flex flex-wrap gap-2">
              {shownReactions.map((r, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 bg-white rounded-full"
                  style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 12, paddingRight: 12, border: '1px solid #dfdfdf' }}
                >
                  <span className="rounded-full shrink-0" style={{ width: 12, height: 12, backgroundColor: COLOR_MAP[r.color].hex }} />
                  <span style={{ fontSize: 14, color: '#222222' }}>{r.sentence}</span>
                </span>
              ))}
            </div>
            {hasMore && (
              <button className="mt-2 text-sm text-gray-400">더 보기</button>
            )}
          </div>
        )}
      </div>

      {/* 공감하기 버튼 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-5 pb-8 pt-3 bg-white">
        <button
          onClick={() => setSheetOpen(true)}
          className="w-full py-4 rounded-full text-base font-semibold text-white bg-gray-900 active:scale-[0.98] transition-transform"
        >
          공감하기
        </button>
      </div>

      <EmpathyBottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onSend={handleEmpathy} />

      {/* ===== 케밥 액션 바텀시트 ===== */}
      {actionSheetOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setActionSheetOpen(false)} />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white rounded-t-3xl z-50 pb-8">
            {/* 핸들 */}
            <div className="flex justify-center pt-3 pb-4">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            {/* 저장 원형 버튼 */}
            <div className="flex justify-center mb-5">
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleBookmark}
                  className="w-16 h-16 rounded-full border-2 border-gray-200 flex items-center justify-center active:scale-90 transition-transform"
                >
                  <BookmarkMd filled={isBookmarked} />
                </button>
                <span className="text-sm text-gray-700 font-medium">저장</span>
              </div>
            </div>
            {/* 구분선 */}
            <div className="border-t border-gray-100 mx-5 mb-3" />
            {/* 리스트 */}
            <button
              onClick={() => setActionSheetOpen(false)}
              className="w-full flex items-center gap-4 px-6 py-3.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <ShareIcon /> 공유하기
            </button>
            <button
              onClick={() => setActionSheetOpen(false)}
              className="w-full flex items-center gap-4 px-6 py-3.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <ImageIcon /> 이미지로 다운로드
            </button>
            <button
              onClick={() => { setActionSheetOpen(false); setReportDialogOpen(true); }}
              className="w-full flex items-center gap-4 px-6 py-3.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <AlertIcon /> 신고하기
            </button>
          </div>
        </>
      )}

      {/* ===== 신고 다이얼로그 ===== */}
      {reportDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
          <div className="w-full bg-white rounded-3xl p-8 text-center">
            <p className="text-lg font-bold text-gray-900 mb-2">이 글을 신고할까요?</p>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
              욕설, 비방, 광고 등 타인에게 불쾌감을 주거나<br />안전한 소통을 방해하는 글이라면 신고해 주세요.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setReportDialogOpen(false)}
                className="w-full py-3.5 rounded-full text-sm font-semibold text-white bg-gray-900"
              >
                네
              </button>
              <button
                onClick={() => setReportDialogOpen(false)}
                className="w-full py-3.5 rounded-full text-sm font-semibold text-gray-600 bg-gray-100"
              >
                아니오
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 북마크 저장 확인 ===== */}
      {bookmarkToastOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white rounded-t-3xl z-50 pb-12 pt-8 flex flex-col items-center gap-4">
            <div className="w-10 h-1 rounded-full bg-gray-200 absolute top-3" />
            <div className="w-20 h-20 rounded-full border-2 border-gray-200 flex items-center justify-center">
              <BookmarkMd filled={isBookmarked} />
            </div>
            <p className="text-xl font-bold text-gray-900">
              {isBookmarked ? '저장되었습니다!' : '저장이 취소되었습니다.'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function ChevronLeft() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
}
function KebabIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>;
}
function BookmarkSm({ filled }: { filled: boolean }) {
  return <svg className={`w-4 h-4 ${filled ? 'text-gray-800' : 'text-gray-400'}`} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>;
}
function BookmarkMd({ filled }: { filled: boolean }) {
  return <svg className={`w-7 h-7 ${filled ? 'text-gray-800' : 'text-gray-500'}`} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>;
}
function ShareIcon() {
  return <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>;
}
function ImageIcon() {
  return <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" /></svg>;
}
function AlertIcon() {
  return <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
}
