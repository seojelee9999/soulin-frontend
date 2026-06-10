import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { COLOR_MAP, COLOR_ID_MAP } from '../types';
import type { Post, PostDraft, ColorMode } from '../types';
import { fetchMyPosts, type PostsTab } from '../api/users';
import { deletePost as apiDeletePost, updatePost as apiUpdatePost } from '../api/posts';
import { useDraft } from '../context/DraftContext';
import { useFeed } from '../context/FeedContext';
import BackButton from '../components/common/BackButton';

const TABS = ['작성 게시글', '임시저장', '반려 게시글'] as const;
type Tab = typeof TABS[number];

const TAB_TO_QUERY: Record<Tab, PostsTab> = {
  '작성 게시글': 'published',
  '임시저장': 'draft-private',
  '반려 게시글': 'rejected',
};

type SheetTarget =
  | { kind: 'published'; post: Post }
  | { kind: 'draft-post'; post: Post }
  | { kind: 'draft-local'; draft: PostDraft }
  | { kind: 'rejected'; post: Post };

function formatDate(iso: string) {
  const d = new Date(iso);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`;
}

// '?tab='(PostsTab 키)을 TAB_TO_QUERY 역매핑해 초기 Tab 라벨로. 없거나 무효면 기본값.
function resolveInitialTab(tabParam: string | null): Tab {
  return (
    (Object.entries(TAB_TO_QUERY).find(([, q]) => q === tabParam)?.[0] as Tab | undefined)
    ?? '작성 게시글'
  );
}

export default function PostManagePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const dateMode = !!dateParam;
  const { drafts, clearDraft } = useDraft();
  const { removePost: removeFromFeed } = useFeed();
  const [activeTab, setActiveTab] = useState<Tab>(() => resolveInitialTab(searchParams.get('tab')));
  const [localPosts, setLocalPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [sheet, setSheet] = useState<SheetTarget | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; kind: 'post' | 'draft' } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [objectionOpen, setObjectionOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    const promise = dateMode
      ? fetchMyPosts({ date: dateParam! })
      : fetchMyPosts({ tab: TAB_TO_QUERY[activeTab] });
    promise
      .then((posts) => {
        if (!cancelled) setLocalPosts(posts.map((p) => ({ ...p, isMine: true })));
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, dateMode, dateParam]);

  // ── helpers ──────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const deletePost = (postId: string) => {
    let removed: Post | undefined;
    setLocalPosts((prev) => {
      removed = prev.find((p) => p.id === postId);
      return prev.filter((p) => p.id !== postId);
    });
    apiDeletePost(postId)
      .then(() => removeFromFeed(postId))
      .catch((err) => {
        console.error('deletePost failed', err);
        if (removed) setLocalPosts((prev) => [removed!, ...prev]);
      });
  };

  const makePrivate = (post: Post) => {
    const previous = localPosts;
    setLocalPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, isPublic: false } : p)),
    );
    apiUpdatePost(post.id, {
      title: post.title,
      content: post.content,
      colorId: COLOR_ID_MAP[post.color],
      isPublic: false,
    })
      .then(() => removeFromFeed(post.id))
      .catch((err) => {
        console.error('makePrivate failed', err);
        setLocalPosts(previous);
        showToast('비공개 처리에 실패했습니다');
      });
  };

  const handleDeleteConfirm = () => {
    if (!confirmDelete) return;
    if (confirmDelete.kind === 'post') {
      deletePost(confirmDelete.id);
    } else {
      clearDraft(confirmDelete.id);
    }
    setConfirmDelete(null);
    setSheet(null);
    showToast('삭제되었습니다');
  };

  // ── sheet actions ─────────────────────────────────────────

  const handleMakePrivate = (post: Post) => {
    makePrivate(post);
    setSheet(null);
    showToast('비공개 처리되었습니다');
  };

  const handleEditPost = (post: Post) => {
    setSheet(null);
    // 서버에 저장된 글: /write/:postId로 직행 → WritePage가 fetchMyPost로 prefill
    navigate(`/write/${post.id}`);
  };

  const handleEditDraft = (draft: PostDraft) => {
    setSheet(null);
    const colorMode: ColorMode | undefined = draft.color
      ? { kind: 'color', color: draft.color }
      : undefined;
    navigate('/write', {
      state: { from: '/posts-manage', content: draft.content, title: draft.title, draftId: draft.id, colorMode },
    });
  };

  // ── 탭별 빈 화면 & 목록 렌더 ─────────────────────────────

  function renderList() {
    if (loadError) return <ErrorState />;
    if (loading) return <Loading />;
    // date 모드: PUBLISHED 가정으로 작성 게시글 경로와 동일 렌더
    if (dateMode) {
      if (localPosts.length === 0) return <Empty />;
      return localPosts.map((post) => (
        <ManageCard
          key={post.id}
          post={post}
          onCard={() => navigate(`/post/${post.id}`, { state: { from: 'posts-manage' } })}
          onKebab={() => setSheet({ kind: 'published', post })}
        />
      ));
    }
    if (activeTab === '작성 게시글') {
      // PUBLISHED + isPublic === false 인 글은 비공개 탭으로만 노출
      const visiblePosts = localPosts.filter((p) => p.isPublic !== false);
      if (visiblePosts.length === 0) return <Empty />;
      return visiblePosts.map((post) => (
        <ManageCard
          key={post.id}
          post={post}
          onCard={() => navigate(`/post/${post.id}`, { state: { from: 'posts-manage' } })}
          onKebab={() => setSheet({ kind: 'published', post })}
        />
      ));
    }

    if (activeTab === '임시저장') {
      const hasPosts = localPosts.length > 0;
      const hasDrafts = drafts.length > 0;
      if (!hasPosts && !hasDrafts) return <Empty />;
      return (
        <>
          {localPosts.map((post) => (
            <ManageCard
              key={post.id}
              post={post}
              badge={post.status === 'DRAFT' ? '임시저장' : '비공개'}
              onCard={() => handleEditPost(post)}
              onKebab={() => setSheet({ kind: 'draft-post', post })}
            />
          ))}
          {drafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              onCard={() =>
                navigate('/write', {
                  state: {
                    from: '/posts-manage',
                    content: draft.content,
                    title: draft.title,
                    draftId: draft.id,
                    colorMode: draft.color ? { kind: 'color', color: draft.color } : undefined,
                  },
                })
              }
              onKebab={() => setSheet({ kind: 'draft-local', draft })}
            />
          ))}
        </>
      );
    }

    if (activeTab === '반려 게시글') {
      if (localPosts.length === 0) return <Empty />;
      return localPosts.map((post) => (
        <RejectedCard
          key={post.id}
          post={post}
          onKebab={() => setSheet({ kind: 'rejected', post })}
        />
      ));
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 헤더 */}
      <header className="relative flex items-center px-5 pt-4 pb-2 shrink-0">
        <BackButton onClick={() => navigate(-1)} className="mr-4" />
        <span
          className="absolute left-1/2 -translate-x-1/2"
          style={{ fontSize: 16, fontWeight: 700, color: '#000000' }}
        >{dateMode ? dateParam!.replace(/-/g, '.') : '글 관리'}</span>
      </header>

      {/* 탭 (date 모드에선 숨김) */}
      {!dateMode && (
        <div className="flex shrink-0" style={{ borderBottom: '1px solid #eeeeee' }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-3 relative"
              style={{
                fontSize: 13,
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? '#000000' : '#8a8a8a',
              }}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0" style={{ height: 2, backgroundColor: '#000000' }} />
              )}
            </button>
          ))}
        </div>
      )}

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto pt-3 pb-4">
        {renderList()}
      </div>

      {/* ── 바텀시트 ── */}

      {/* A. 작성 게시글 */}
      {sheet?.kind === 'published' && (
        <ActionSheet onClose={() => setSheet(null)}>
          <SheetItem
            icon={<HideIcon />}
            label="게시글 임시저장 처리"
            onClick={() => handleMakePrivate(sheet.post)}
          />
          <SheetItem
            icon={<TrashIcon />}
            label="게시글 삭제"
            danger
            onClick={() => setConfirmDelete({ id: sheet.post.id, kind: 'post' })}
          />
        </ActionSheet>
      )}

      {/* B-1. 임시저장/비공개 (mock Post) */}
      {sheet?.kind === 'draft-post' && (
        <ActionSheet onClose={() => setSheet(null)}>
          <SheetItem
            icon={<EditIcon />}
            label="게시글 수정"
            onClick={() => handleEditPost(sheet.post)}
          />
          <SheetItem
            icon={<TrashIcon />}
            label="게시글 삭제"
            danger
            onClick={() => setConfirmDelete({ id: sheet.post.id, kind: 'post' })}
          />
        </ActionSheet>
      )}

      {/* B-2. 임시저장/비공개 (로컬 draft) */}
      {sheet?.kind === 'draft-local' && (
        <ActionSheet onClose={() => setSheet(null)}>
          <SheetItem
            icon={<EditIcon />}
            label="게시글 수정"
            onClick={() => handleEditDraft(sheet.draft)}
          />
          <SheetItem
            icon={<TrashIcon />}
            label="게시글 삭제"
            danger
            onClick={() => setConfirmDelete({ id: sheet.draft.id, kind: 'draft' })}
          />
        </ActionSheet>
      )}

      {/* C. 반려 게시글 */}
      {sheet?.kind === 'rejected' && (
        <ActionSheet onClose={() => setSheet(null)}>
          <SheetItem
            icon={<EditIcon />}
            label="게시글 수정"
            onClick={() => handleEditPost(sheet.post)}
          />
          <SheetItem
            icon={<AlertIcon />}
            label="이의제기"
            onClick={() => { setSheet(null); setObjectionOpen(true); }}
          />
          <SheetItem
            icon={<TrashIcon />}
            label="게시글 삭제"
            danger
            onClick={() => setConfirmDelete({ id: sheet.post.id, kind: 'post' })}
          />
        </ActionSheet>
      )}

      {/* 삭제 확인 다이얼로그 */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-[430px] px-8">
            <div className="w-full bg-white rounded-3xl p-8 text-center">
              <p className="text-lg font-bold text-gray-900 mb-2">게시글을 삭제할까요?</p>
              <p className="text-sm text-gray-400 mb-8">삭제한 글은 복구할 수 없어요.</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleDeleteConfirm}
                  className="w-full py-3.5 rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: '#F21A14' }}
                >
                  삭제하기
                </button>
                <button
                  onClick={() => { setConfirmDelete(null); setSheet(null); }}
                  className="w-full py-3.5 rounded-full text-sm font-semibold text-gray-600 bg-gray-100"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 이의제기 알럿 */}
      {objectionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-[430px] px-8">
            <div className="w-full bg-white rounded-3xl p-8 text-center">
              <p className="text-lg font-bold text-gray-900 mb-2">이의제기</p>
              <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                이의제기 기능은 추후 출시 예정입니다.<br />불편을 드려 죄송합니다.
              </p>
              <button
                onClick={() => setObjectionOpen(false)}
                className="w-full py-3.5 rounded-full text-sm font-semibold text-white bg-gray-900"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full text-sm font-medium text-white"
          style={{ bottom: 96, backgroundColor: 'rgba(0,0,0,0.75)', whiteSpace: 'nowrap' }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

// ── 공통 바텀시트 래퍼 ────────────────────────────────────────

function ActionSheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white rounded-t-3xl z-50 pb-8">
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        {children}
      </div>
    </>
  );
}

function SheetItem({
  icon,
  label,
  danger = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-6 py-3.5 text-sm active:bg-gray-50"
      style={{ color: danger ? '#F21A14' : '#131416' }}
    >
      {icon}
      {label}
    </button>
  );
}

// ── 카드 컴포넌트 ─────────────────────────────────────────────

function ManageCard({
  post,
  badge,
  onCard,
  onKebab,
}: {
  post: Post;
  badge?: string;
  onCard: () => void;
  onKebab: () => void;
}) {
  const hex = COLOR_MAP[post.color].main;
  return (
    <article
      onClick={onCard}
      className="mx-4 mb-3 cursor-pointer active:opacity-80"
      style={{ borderRadius: 15, background: '#f8f8f8' }}
    >
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="rounded-full shrink-0" style={{ width: 15, height: 15, backgroundColor: hex }} />
            <span className="flex-1 font-bold line-clamp-1 min-w-0" style={{ fontSize: 15, color: '#131416' }}>
              {post.title || '(제목 없음)'}
            </span>
            {badge && (
              <span
                className="shrink-0 text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: '#f0f0f0', color: '#757575', fontSize: 11 }}
              >
                {badge}
              </span>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onKebab(); }}
            className="p-1 shrink-0 ml-2"
          >
            <KebabIcon />
          </button>
        </div>
        <p className="line-clamp-3" style={{ fontSize: 15, color: '#5e5e5e', lineHeight: '20px' }}>
          {post.content}
        </p>
        <p style={{ fontSize: 13, color: '#757575' }}>{formatDate(post.createdAt)}</p>
      </div>
    </article>
  );
}

function DraftCard({
  draft,
  onCard,
  onKebab,
}: {
  draft: PostDraft;
  onCard: () => void;
  onKebab: () => void;
}) {
  const hex = draft.color ? COLOR_MAP[draft.color].main : '#D2D2D3';
  return (
    <article
      onClick={onCard}
      className="mx-4 mb-3 cursor-pointer active:opacity-80"
      style={{ borderRadius: 15, background: '#f8f8f8' }}
    >
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="rounded-full shrink-0" style={{ width: 15, height: 15, backgroundColor: hex }} />
            <span className="flex-1 font-bold line-clamp-1 min-w-0" style={{ fontSize: 15, color: '#131416' }}>
              {draft.title || '(제목 없음)'}
            </span>
            <span
              className="shrink-0 text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#f0f0f0', color: '#757575', fontSize: 11 }}
            >
              임시저장
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onKebab(); }}
            className="p-1 shrink-0 ml-2"
          >
            <KebabIcon />
          </button>
        </div>
        <p className="line-clamp-3" style={{ fontSize: 15, color: '#5e5e5e', lineHeight: '20px' }}>
          {draft.content || '(내용 없음)'}
        </p>
        <p style={{ fontSize: 13, color: '#757575' }}>{formatDate(draft.savedAt)}</p>
      </div>
    </article>
  );
}

function RejectedCard({ post, onKebab }: { post: Post; onKebab: () => void }) {
  const hex = COLOR_MAP[post.color].main;
  return (
    <article
      className="mx-4 mb-3"
      style={{ borderRadius: 15, background: '#fff5f5', border: '1px solid #fde0df' }}
    >
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="rounded-full shrink-0" style={{ width: 15, height: 15, backgroundColor: hex }} />
            <span className="flex-1 font-bold line-clamp-1 min-w-0" style={{ fontSize: 15, color: '#131416' }}>
              {post.title || '(제목 없음)'}
            </span>
          </div>
          <button
            onClick={onKebab}
            className="p-1 shrink-0 ml-2"
          >
            <KebabIcon />
          </button>
        </div>
        <p className="line-clamp-2" style={{ fontSize: 15, color: '#5e5e5e', lineHeight: '20px' }}>
          {post.content}
        </p>
        {post.moderationReason && (
          <p
            className="text-xs leading-relaxed rounded-xl px-3 py-2"
            style={{ color: '#c0392b', backgroundColor: '#fce8e8' }}
          >
            반려 사유: {post.moderationReason}
          </p>
        )}
        <p style={{ fontSize: 13, color: '#757575' }}>{formatDate(post.createdAt)}</p>
      </div>
    </article>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center justify-center h-60">
      <p style={{ fontSize: 15, fontWeight: 600, color: '#5e5e5e' }}>아직 글이 없어요</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center h-40 text-sm text-gray-400">
      불러오는 중...
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center h-60">
      <p style={{ fontSize: 15, fontWeight: 600, color: '#5e5e5e' }}>
        게시글을 불러오지 못했어요
      </p>
    </div>
  );
}

// ── 아이콘 ────────────────────────────────────────────────────

function KebabIcon() {
  return (
    <svg width="3" height="15" viewBox="0 0 3 15" fill="#757575">
      <circle cx="1.5" cy="1.5" r="1.5" />
      <circle cx="1.5" cy="7.5" r="1.5" />
      <circle cx="1.5" cy="13.5" r="1.5" />
    </svg>
  );
}
function HideIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
