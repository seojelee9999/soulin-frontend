import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { COLOR_MAP } from '../types';
import type { Post, EmpathyReaction, MyReaction } from '../types';
import { fetchPost, fetchMyPost, sendEmpathy, deletePost as apiDeletePost } from '../api/posts';
import { useAuth } from '../context/AuthContext';
import { useFeed } from '../context/FeedContext';
import { useBookmark } from '../context/BookmarkContext';
import EmpathyBottomSheet from '../components/post/EmpathyBottomSheet';
import BackButton from '../components/common/BackButton';

function formatDate(iso: string) {
  const d = new Date(iso);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`;
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPostsManage = location.state?.from === 'posts-manage';
  const { userId } = useAuth();
  const { updatePost, removePost } = useFeed();
  const { bookmarkedIds, toggleBookmark } = useBookmark();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  // viewer state
  const [myReaction, setMyReaction] = useState<MyReaction | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // owner state
  const [ownerSheetOpen, setOwnerSheetOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [cancelEmpathyConfirmOpen, setCancelEmpathyConfirmOpen] = useState(false);
  const [viewerSheetOpen, setViewerSheetOpen] = useState(false);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  // shared
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [bookmarkToastOpen, setBookmarkToastOpen] = useState(false);
  const [reactionsExpanded, setReactionsExpanded] = useState(false);
  const [shareToastOpen, setShareToastOpen] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    const fetcher = fromPostsManage ? fetchMyPost : fetchPost;
    fetcher(id).then((p) => {
      setPost(p);
      setMyReaction(p.myReaction ?? null);
    }).finally(() => setLoading(false));
  }, [id, fromPostsManage]);

  const handleEmpathy = async (reaction: EmpathyReaction) => {
    if (!post) return;
    const newMyReaction: MyReaction = { colorKey: reaction.color, sentence: reaction.sentence, category: reaction.category };
    const alreadyReacted = !!myReaction;
    const updated: Post = {
      ...post,
      empathyCount: alreadyReacted ? post.empathyCount : post.empathyCount + 1,
      reactions: alreadyReacted
        ? post.reactions.map((r) => r.sentence === myReaction!.sentence ? { ...r, sentence: reaction.sentence, color: reaction.color, category: reaction.category as EmpathyReaction['category'] } : r)
        : [...post.reactions, reaction],
      myReaction: newMyReaction,
    };
    await sendEmpathy(post.id, reaction);
    setPost(updated);
    setMyReaction(newMyReaction);
    updatePost(updated);
  };

  const handleCancelEmpathy = async () => {
    if (!post || !myReaction) return;
    const updated: Post = {
      ...post,
      empathyCount: Math.max(0, post.empathyCount - 1),
      reactions: post.reactions.filter((r) => r.sentence !== myReaction.sentence),
      myReaction: undefined,
    };
    setPost(updated);
    setMyReaction(null);
    updatePost(updated);
  };

  const handleBookmarkToggle = () => {
    if (!post) return;
    toggleBookmark(post.id);
    setBookmarkToastOpen(true);
    setTimeout(() => setBookmarkToastOpen(false), 1600);
  };

  const handleShare = async () => {
    if (!post) return;
    const url = `https://soulin.xyz/post/${post.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: post.title, url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setShareToastOpen(true);
      setTimeout(() => setShareToastOpen(false), 1600);
    }
    setOwnerSheetOpen(false);
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setOwnerSheetOpen(false);
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true });
    const link = document.createElement('a');
    link.download = `soulin-${post?.id ?? 'post'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleDelete = () => {
    setOwnerSheetOpen(false);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!post) return;
    try {
      await apiDeletePost(post.id);
      removePost(post.id);
      setDeleteConfirmOpen(false);
      const backTo = fromPostsManage ? '/posts-manage' : '/';
      navigate(backTo, { replace: true });
    } catch (err) {
      console.error('deletePost failed', err);
      setDeleteConfirmOpen(false);
    }
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
  const isOwner = userId != null && post.userId === userId;
  const shownReactions = reactionsExpanded ? post.reactions : post.reactions.slice(0, 6);
  const hasMore = !reactionsExpanded && post.reactions.length > 6;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 상단바 */}
      <header className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
        <BackButton onClick={() => navigate(-1)} />
        {!fromPostsManage && <h1 className="text-base font-bold text-gray-800">피드</h1>}
        {isOwner ? (
          <button onClick={() => setOwnerSheetOpen(true)} className="p-1 text-gray-400"><KebabIcon /></button>
        ) : (
          <button onClick={() => setViewerSheetOpen(true)} className="p-1 text-gray-400"><KebabIcon /></button>
        )}
      </header>

      {/* 제목 행 */}
      <div className="flex items-center gap-3 px-5 py-3 shrink-0">
        <span className="rounded-full shrink-0" style={{ width: 26, height: 26, backgroundColor: colorInfo.main }} />
        <h2 className="text-base font-bold text-gray-900 flex-1 leading-snug">{post.title}</h2>
      </div>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto px-5 pb-32 scrollbar-none">
        {/* 본문 카드 */}
        <div
          ref={cardRef}
          className="rounded-2xl mb-5"
          style={{
            border: `2px solid ${colorInfo.soft}`,
            backgroundColor: colorInfo.main + '08',
          }}
        >
          <p className="leading-relaxed whitespace-pre-wrap px-5 pt-5 pb-4" style={{ fontSize: 15, color: '#5e5e5e' }}>
            {post.content}
          </p>
          <div className="flex items-center justify-between px-5 pb-4">
            <span style={{ fontSize: 12, color: '#8a8a8a' }}>
              {post.authorNickname} · {formatDate(post.createdAt)}
            </span>
            {!isOwner && (
              <button onClick={handleBookmarkToggle} className="transition-colors">
                <BookmarkSm filled={isBookmarked} />
              </button>
            )}
          </div>
        </div>

        {/* 받은 공감 */}
        {post.reactions.length > 0 ? (
          <div className="mb-4">
            <p className="mb-3" style={{ fontSize: 14, color: '#131416' }}>받은 공감</p>
            <div className="flex flex-wrap gap-2">
              {shownReactions.map((r, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 bg-white rounded-full"
                  style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 16, paddingRight: 16, border: '1px solid #dfdfdf' }}
                >
                  <span className="rounded-full shrink-0" style={{ width: 12, height: 12, backgroundColor: COLOR_MAP[r.color].main }} />
                  <span style={{ fontSize: 14, color: '#222222' }}>{r.sentence}</span>
                </span>
              ))}
            </div>
            {isOwner ? (
              <button className="mt-2 text-sm text-gray-500">더 보기</button>
            ) : hasMore ? (
              <button onClick={() => setReactionsExpanded(true)} className="mt-2 text-sm text-gray-400">더 보기</button>
            ) : null}
          </div>
        ) : isOwner ? (
          <div className="mb-4 flex flex-col items-center py-8 gap-2">
            <span className="text-3xl">🌱</span>
            <p className="text-sm text-gray-400">아직 받은 공감이 없어요</p>
          </div>
        ) : null}

        {/* 내 공감 (viewer only) */}
        {!isOwner && myReaction && (
          <div className="mb-4">
            <p className="mb-3" style={{ fontSize: 14, color: '#131416' }}>내 공감</p>
            <button
              onClick={() => setCancelEmpathyConfirmOpen(true)}
              className="inline-flex items-center gap-1 bg-white rounded-full transition-colors hover:bg-gray-50 active:bg-gray-100"
              style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 12, paddingRight: 10, border: `1.5px solid ${COLOR_MAP[myReaction.colorKey].main}` }}
            >
              <span className="rounded-full shrink-0" style={{ width: 12, height: 12, backgroundColor: COLOR_MAP[myReaction.colorKey].main }} />
              <span style={{ fontSize: 14, color: '#222222' }}>{myReaction.sentence}</span>
              <XSmIcon />
            </button>
          </div>
        )}
      </div>

      {/* 하단 버튼 (viewer only) */}
      {!isOwner && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-5 pb-8 pt-3 bg-white">
          <button
            onClick={() => setSheetOpen(true)}
            className="w-full py-4 rounded-full text-base font-semibold text-white bg-gray-900 active:scale-[0.98] transition-transform"
          >
            {myReaction ? '공감 수정하기' : '공감하기'}
          </button>
        </div>
      )}

      <EmpathyBottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSend={handleEmpathy}
        initialColor={myReaction?.colorKey}
        initialSentence={myReaction?.sentence}
        initialCategory={myReaction?.category}
      />

      {/* ===== 오너 케밥 액션 바텀시트 ===== */}
      {ownerSheetOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setOwnerSheetOpen(false)} />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white rounded-t-3xl z-50 pb-8">
            <div className="flex justify-center pt-3 pb-4">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            <button
              onClick={() => { setOwnerSheetOpen(false); navigate('/color-select', { state: { editId: post.id, initialColor: post.color, title: post.title, content: post.content, from: `/post/${post.id}` } }); }}
              className="w-full flex items-center gap-4 px-6 py-3.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <EditIcon /> 게시글 수정
            </button>
            <button
              onClick={() => { setOwnerSheetOpen(false); }}
              className="w-full flex items-center gap-4 px-6 py-3.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <LockIcon /> 게시글 비공개 처리
            </button>
            <button
              onClick={handleShare}
              className="w-full flex items-center gap-4 px-6 py-3.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <ShareIcon /> 공유하기
            </button>
            <button
              onClick={handleDownload}
              className="w-full flex items-center gap-4 px-6 py-3.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <ImageIcon /> 이미지로 다운로드
            </button>
            <div className="border-t border-gray-100 mx-5 my-2" />
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-4 px-6 py-3.5 text-sm text-red-500 hover:bg-gray-50"
            >
              <TrashIcon /> 게시글 삭제
            </button>
          </div>
        </>
      )}

      {/* ===== 뷰어 케밥 바텀시트 ===== */}
      {!isOwner && viewerSheetOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setViewerSheetOpen(false)} />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white rounded-t-3xl z-50 pb-8">
            {/* 드래그 핸들 */}
            <div className="flex justify-center pt-3 pb-4">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* 저장 강조 영역 */}
            <div className="flex flex-col items-center pt-2 pb-5">
              <button
                onClick={() => { handleBookmarkToggle(); setViewerSheetOpen(false); }}
                className="w-14 h-14 rounded-full border border-gray-300 flex items-center justify-center active:bg-gray-50 transition-colors"
              >
                <BookmarkMd filled={isBookmarked} />
              </button>
              <span className="mt-2 text-xs text-gray-800">
                {isBookmarked ? '저장됨' : '저장'}
              </span>
            </div>

            {/* 구분선 */}
            <div className="border-t border-gray-100 mx-5 mb-2" />

            {/* 나머지 메뉴 리스트 */}
            <button
              onClick={() => { setViewerSheetOpen(false); setComingSoonOpen(true); }}
              className="w-full flex items-center gap-4 px-6 py-3.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <ShareIcon /> 공유하기
            </button>
            <button
              onClick={() => { setViewerSheetOpen(false); setComingSoonOpen(true); }}
              className="w-full flex items-center gap-4 px-6 py-3.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <ImageIcon /> 이미지로 다운로드
            </button>
            <button
              onClick={() => { setViewerSheetOpen(false); setReportDialogOpen(true); }}
              className="w-full flex items-center gap-4 px-6 py-3.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <AlertIcon /> 신고하기
            </button>
          </div>
        </>
      )}

      {/* ===== 추후 출시 예정 알럿 ===== */}
      {comingSoonOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-[430px] px-8">
            <div className="w-full bg-white rounded-3xl p-8 text-center">
              <p className="text-lg font-bold text-gray-900 mb-2">추후 출시 예정</p>
              <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                해당 기능은 곧 추가될 예정이에요.
              </p>
              <button
                onClick={() => setComingSoonOpen(false)}
                className="w-full py-3.5 rounded-full text-sm font-semibold text-white bg-gray-900"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 뷰어 케밥 (신고하기) ===== */}
      {!isOwner && reportDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-[430px] px-8">
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
        </div>
      )}

      {/* ===== 삭제 확인 다이얼로그 ===== */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-[430px] px-8">
            <div className="w-full bg-white rounded-3xl p-8 text-center">
              <p className="text-lg font-bold text-gray-900 mb-2">이 글을 삭제할까요?</p>
              <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                삭제된 글은 복구할 수 없어요.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={confirmDelete}
                  className="w-full py-3.5 rounded-full text-sm font-semibold text-white bg-red-500"
                >
                  삭제
                </button>
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="w-full py-3.5 rounded-full text-sm font-semibold text-gray-600 bg-gray-100"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 북마크 토스트 ===== */}
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

      {/* ===== 공감 취소 확인 다이얼로그 ===== */}
      {cancelEmpathyConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-[430px] px-8">
            <div className="w-full bg-white rounded-3xl p-8 text-center">
              <p className="text-lg font-bold text-gray-900 mb-2">공감을 취소할까요?</p>
              <p className="text-sm text-gray-400 mb-8 leading-relaxed">선택한 공감이 삭제돼요.</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { setCancelEmpathyConfirmOpen(false); handleCancelEmpathy(); }}
                  className="w-full py-3.5 rounded-full text-sm font-semibold text-white bg-red-500"
                >
                  공감 취소
                </button>
                <button
                  onClick={() => setCancelEmpathyConfirmOpen(false)}
                  className="w-full py-3.5 rounded-full text-sm font-semibold text-gray-600 bg-gray-100"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 공유 링크 복사 토스트 ===== */}
      {shareToastOpen && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm px-4 py-2 rounded-full">
          링크가 복사되었습니다
        </div>
      )}
    </div>
  );
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
function EditIcon() {
  return <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
}
function LockIcon() {
  return <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="11" width="18" height="11" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" /></svg>;
}
function ShareIcon() {
  return <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>;
}
function ImageIcon() {
  return <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" /></svg>;
}
function XSmIcon() {
  return <svg className="w-3.5 h-3.5 text-gray-400 ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
}
function AlertIcon() {
  return <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
}
function TrashIcon() {
  return <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
}
