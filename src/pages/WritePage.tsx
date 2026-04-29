import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { COLOR_MAP, COLOR_KEYS, COLOR_ID_MAP, type ColorKey, type ColorMode, type PostStatus } from '../types';
import { useFeed } from '../context/FeedContext';
import { useDraft } from '../context/DraftContext';
import { createPost, fetchMyPost, updatePost as apiUpdatePost, publishPost } from '../api/posts';
import { formatModerationReason } from '../constants/moderation';
import BackButton from '../components/common/BackButton';
import CloseButton from '../components/common/CloseButton';
import ColorPicker from '../components/write/ColorPicker';

const MAX_LENGTH = 300;

// AI 원 그라데이션
const AI_CIRCLE_BG =
  'radial-gradient(circle at 30% 30%, #fce4ec, #e8f4fd 40%, #e8faf5 70%, #fef9e7)';

type DialogType = 'draft' | 'confirm' | 'posting' | 'done' | 'publish-failed' | 'rejected' | 'analyzing' | 'result' | null;

function pick3Colors(): ColorKey[] {
  return [...COLOR_KEYS].sort(() => Math.random() - 0.5).slice(0, 3) as ColorKey[];
}

export default function WritePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { postId: routePostId } = useParams<{ postId: string }>();
  const locState = location.state as { from?: string; content?: string; title?: string; draftId?: string; editId?: string; colorMode?: ColorMode } | null;
  const editId: string | undefined = routePostId ?? locState?.editId;
  const isEdit = !!editId;
  const initialMode: ColorMode | undefined = locState?.colorMode;
  const { setFeedPosts, feedPosts } = useFeed();
  const { saveDraft, clearDraft } = useDraft();

  const [title, setTitle] = useState(locState?.title ?? '');
  const [content, setContent] = useState(locState?.content ?? '');
  const [dialog, setDialog] = useState<DialogType>(null);
  const [rejectedReason, setRejectedReason] = useState<string | null>(null);
  const [suggestedColors, setSuggestedColors] = useState<ColorKey[]>([]);
  const [pickedColor, setPickedColor] = useState<ColorKey | null>(null);
  const [isAiMode, setIsAiMode] = useState(initialMode?.kind === 'ai');
  // finalColor: 선택된 색 (AI 분석 완료 후 또는 직접 선택)
  const [finalColor, setFinalColor] = useState<ColorKey | null>(
    initialMode?.kind === 'color' ? initialMode.color : null,
  );
  const [fetchedIsPublic, setFetchedIsPublic] = useState<boolean | undefined>(undefined);
  const [fetchedStatus, setFetchedStatus] = useState<PostStatus | undefined>(undefined);

  // 수정 모드일 땐 status에 따라 복귀 경로 결정 (DRAFT/REJECTED는 /post/{id}로 가면 404)
  const from: string = isEdit && routePostId
    ? (fetchedStatus === 'PUBLISHED' ? `/post/${routePostId}` : '/posts-manage')
    : (locState?.from ?? '/');

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 수정 모드(URL 또는 state): 색 선택 단계 건너뛰고 본 페이지 진입 가능
    if (isEdit) return;
    if (!initialMode && !finalColor) navigate('/color-select', { replace: true });
  }, [isEdit, initialMode, finalColor, navigate]);

  // 수정 모드 prefill: editId가 있으면 fetchMyPost로 isPublic 보존 + 라우트 진입은 본문/색까지 prefill
  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    fetchMyPost(editId)
      .then((p) => {
        if (cancelled) return;
        setFetchedIsPublic(p.isPublic);
        setFetchedStatus(p.status);
        if (routePostId) {
          setTitle(p.title);
          setContent(p.content);
          setFinalColor(p.color);
        }
      })
      .catch((err) => console.error('edit prefill failed', err));
    return () => { cancelled = true; };
  }, [editId, routePostId]);

  useEffect(() => {
    // 임시저장 목록에서 진입: 해당 draft 제거(편집 후 새로 저장되므로)
    if (locState?.draftId) {
      clearDraft(locState.draftId);
    }
    titleRef.current?.focus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remaining = MAX_LENGTH - content.length;

  const handleDraft = () => {
    setDialog('draft');
  };

  // 수정 모드 + DRAFT/REJECTED 상태에서 임시저장: PATCH만, status 유지
  const handleEditSaveDraft = async () => {
    if (!editId || !finalColor || !content.trim()) return;
    setDialog('posting');
    try {
      const updated = await apiUpdatePost(editId, {
        title: title.trim(),
        content: content.trim(),
        colorId: COLOR_ID_MAP[finalColor],
        isPublic: fetchedIsPublic ?? false,
      });
      setFeedPosts(feedPosts.map((p) => p.id === editId ? updated : p));
      setDialog(null);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('saveDraft (edit) failed', err);
      setDialog(null);
    }
  };

  // 일반 게시 / 수정
  const handleSubmit = async () => {
    const color = finalColor;
    if (!color || !content.trim()) return;
    setDialog('posting');

    if (editId) {
      const isDraftLike = fetchedStatus === 'DRAFT' || fetchedStatus === 'REJECTED';
      try {
        const updated = await apiUpdatePost(editId, {
          title: title.trim(),
          content: content.trim(),
          colorId: COLOR_ID_MAP[color],
          isPublic: isDraftLike ? true : (fetchedIsPublic ?? true),
        });
        if (isDraftLike) {
          // DRAFT/REJECTED 수정 + 게시: PATCH 후 publishPost 호출
          const result = await publishPost(editId);
          if (result.status === 'REJECTED') {
            setRejectedReason(result.moderationReason);
            setDialog('rejected');
            return;
          }
          // 게시 성공: 피드 맨 앞에 낙관적 추가 (백엔드 정렬이 옛 createdAt 기준일 수 있음)
          setFeedPosts([
            { ...updated, status: 'PUBLISHED' },
            ...feedPosts.filter((p) => p.id !== editId),
          ]);
        } else {
          setFeedPosts(feedPosts.map((p) => p.id === editId ? updated : p));
        }
        setDialog('done');
        setTimeout(() => navigate(`/post/${editId}`, { replace: true }), 1200);
      } catch (err) {
        console.error('updatePost/publish failed', err);
        setDialog(null);
      }
      return;
    }

    // 신규 게시: 1단계(DRAFT 생성) → 2단계(publish)
    let draftPost: Awaited<ReturnType<typeof createPost>> | null = null;
    try {
      draftPost = await createPost({ title: title.trim(), content: content.trim(), colorId: COLOR_ID_MAP[color], isPublic: true });
      const result = await publishPost(draftPost.id);
      if (result.status === 'REJECTED') {
        setRejectedReason(result.moderationReason);
        setDialog('rejected');
        return;
      }
      setFeedPosts([{ ...draftPost, status: 'PUBLISHED' }, ...feedPosts]);
      clearDraft();
      setDialog('done');
      setTimeout(() => navigate('/', { replace: true }), 1200);
    } catch {
      // 1단계 성공 + 2단계 실패(네트워크 등) → DRAFT 상태로 보관
      setDialog(draftPost ? 'publish-failed' : null);
    }
  };

  // AI 분석 시작
  const handleAnalyze = async () => {
    if (!content.trim()) return;
    setDialog('analyzing');
    await new Promise<void>((r) => setTimeout(r, 1400));
    const colors = pick3Colors();
    setSuggestedColors(colors);
    setPickedColor(colors[1]);
    setDialog('result');
  };

  // AI 색상 선택 확정
  const handleSelectAiColor = () => {
    if (!pickedColor) return;
    setFinalColor(pickedColor);
    setIsAiMode(false);
    setDialog('confirm');
  };

  if (!initialMode && !finalColor) return null;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 상단 */}
      <header className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
        <BackButton onClick={() => navigate(-1)} />
        <CloseButton onClick={() => navigate(from, { replace: true })} />
      </header>

      {/* 색상 picker / AI 모드 원 */}
      <div className="shrink-0">
        {isAiMode && !finalColor ? (
          <div className="flex justify-center pt-4 pb-6">
            <span
              className="w-16 h-16 rounded-full block"
              style={{
                background: AI_CIRCLE_BG,
                boxShadow: '0 0 0 3px white, 0 0 0 5px #c084fc',
              }}
            />
          </div>
        ) : finalColor ? (
          <div className="py-5">
            <ColorPicker value={finalColor} onChange={setFinalColor} />
          </div>
        ) : null}
      </div>

      {/* 입력 영역 */}
      <div className="flex-1 overflow-y-auto px-6">
        {/* 제목 */}
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          className="w-full text-xl font-bold text-gray-900 placeholder-gray-300 bg-transparent outline-none mb-5 leading-snug"
        />

        {/* 본문 */}
        <textarea
          value={content}
          onChange={(e) => {
            if (e.target.value.length <= MAX_LENGTH) setContent(e.target.value);
          }}
          placeholder="메인 텍스트 자리 300글자 확인 중"
          className="w-full min-h-[200px] text-sm text-gray-700 placeholder-gray-300 bg-transparent outline-none resize-none leading-loose"
        />

        {/* 글자 수 */}
        <div className="flex justify-end pb-4">
          <span className={`text-xs tabular-nums ${remaining <= 30 ? 'text-red-400' : 'text-gray-400'}`}>
            {content.length} / {MAX_LENGTH}
          </span>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex gap-3 px-5 pb-8 pt-3 shrink-0">
        {isEdit && (fetchedStatus === 'DRAFT' || fetchedStatus === 'REJECTED') ? (
          <>
            <button
              onClick={handleEditSaveDraft}
              disabled={!content.trim()}
              className="flex-1 py-3.5 rounded-full text-sm font-semibold text-gray-600 bg-gray-100 disabled:opacity-30 active:scale-[0.98] transition-transform"
            >
              임시저장
            </button>
            <button
              onClick={() => setDialog('confirm')}
              disabled={!content.trim()}
              className="flex-1 py-3.5 rounded-full text-sm font-semibold text-white bg-gray-900 disabled:opacity-30 active:scale-[0.98] transition-transform"
            >
              게시하기
            </button>
          </>
        ) : isEdit ? (
          <button
            onClick={() => setDialog('confirm')}
            disabled={!content.trim() || fetchedStatus === undefined}
            className="flex-1 py-3.5 rounded-full text-sm font-semibold text-white bg-gray-900 disabled:opacity-30 active:scale-[0.98] transition-transform"
          >
            수정 완료
          </button>
        ) : (
          <>
            <button
              onClick={handleDraft}
              className="flex-1 py-3.5 rounded-full text-sm font-semibold text-gray-600 bg-gray-100 active:scale-[0.98] transition-transform"
            >
              임시저장
            </button>
            {isAiMode && !finalColor ? (
              <button
                onClick={handleAnalyze}
                disabled={!content.trim()}
                className="flex-1 py-3.5 rounded-full text-sm font-semibold text-white bg-gray-900 disabled:opacity-30 active:scale-[0.98] transition-transform"
              >
                분석하기
              </button>
            ) : (
              <button
                onClick={() => setDialog('confirm')}
                disabled={!content.trim()}
                className="flex-1 py-3.5 rounded-full text-sm font-semibold text-white bg-gray-900 disabled:opacity-30 active:scale-[0.98] transition-transform"
              >
                게시하기
              </button>
            )}
          </>
        )}
      </div>

      {/* 임시저장 바텀시트 */}
      {dialog === 'draft' && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setDialog(null)} />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white rounded-t-3xl z-50 pb-8">
            {/* 핸들 */}
            <div className="flex justify-center pt-3 pb-4">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            {/* 리스트 항목 */}
            <button
              onClick={async () => {
                if (finalColor && content.trim()) {
                  try {
                    await createPost({ title: title.trim(), content: content.trim(), colorId: COLOR_ID_MAP[finalColor], isPublic: false });
                  } catch { /* 로컬 저장으로 폴백 */ }
                }
                saveDraft(title, content, finalColor);
                navigate(from, { replace: true });
              }}
              className="w-full flex items-center gap-4 px-6 py-3.5 text-sm text-gray-700 active:bg-gray-50"
            >
              <SaveIcon /> 임시저장
            </button>
            <button
              onClick={() => setDialog(null)}
              className="w-full flex items-center gap-4 px-6 py-3.5 text-sm text-gray-700 active:bg-gray-50"
            >
              <BackIcon /> 계속 작성하기
            </button>
            <button
              onClick={() => { clearDraft(); navigate(from, { replace: true }); }}
              className="w-full flex items-center gap-4 px-6 py-3.5 text-sm active:bg-gray-50"
              style={{ color: '#F21A14' }}
            >
              <CancelIcon /> 작성 취소
            </button>
          </div>
        </>
      )}

      {/* 다이얼로그 */}
      {dialog && dialog !== 'draft' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-[430px] px-8">
          <div className="w-full bg-white rounded-3xl overflow-hidden">

            {dialog === 'confirm' && (
              <div className="p-8 text-center">
                <p className="text-lg font-bold text-gray-900 mb-2">{editId && fetchedStatus === 'PUBLISHED' ? '이 글을 수정할까요?' : '이 글을 게시할까요?'}</p>
                <p className="text-sm text-gray-400 mb-8">{editId && fetchedStatus === 'PUBLISHED' ? '수정된 내용으로 업데이트됩니다.' : '게시 후에는 전체 공개로 전환됩니다.'}</p>
                <div className="flex flex-col gap-2">
                  <button onClick={handleSubmit}
                    className="w-full py-3.5 rounded-full text-sm font-semibold text-white bg-gray-900">
                    네
                  </button>
                  <button onClick={() => setDialog(null)}
                    className="w-full py-3.5 rounded-full text-sm font-semibold text-gray-600 bg-gray-100">
                    아니오
                  </button>
                </div>
              </div>
            )}

            {dialog === 'posting' && (
              <div className="p-8 text-center">
                <p className="text-lg font-bold text-gray-900 mb-4">내용을 확인하고 있어요.</p>
                <div className="flex justify-center mb-3"><SpinCheckIcon /></div>
                <p className="text-sm text-gray-400">잠시 후 게시됩니다.<br />부적절한 내용이 감지되면 안내를 드려요.</p>
              </div>
            )}

            {dialog === 'done' && (
              <div className="p-8 text-center">
                <p className="text-lg font-bold text-gray-900 mb-4">{editId && fetchedStatus === 'PUBLISHED' ? '수정되었습니다.' : '피드에 게시 되었습니다.'}</p>
                <div className="flex justify-center"><CheckIcon /></div>
              </div>
            )}

            {dialog === 'publish-failed' && (
              <div className="p-8 text-center">
                <p className="text-lg font-bold text-gray-900 mb-2">게시 중 오류가 발생했어요.</p>
                <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                  글은 임시저장 상태로 보관됐어요.<br />게시글 관리에서 다시 게시해 주세요.
                </p>
                <button
                  onClick={() => { setDialog(null); navigate(from, { replace: true }); }}
                  className="w-full py-3.5 rounded-full text-sm font-semibold text-white bg-gray-900"
                >
                  확인
                </button>
              </div>
            )}

            {dialog === 'rejected' && (
              <div className="p-8 text-center">
                <p className="text-lg font-bold text-gray-900 mb-2">게시할 수 없는 내용이에요</p>
                {rejectedReason && (
                  <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                    사유: {formatModerationReason(rejectedReason)}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      console.log('appeal requested for rejected post', { reason: rejectedReason });
                      window.alert('이의 신청 기능은 준비 중입니다');
                    }}
                    className="flex-1 py-3.5 rounded-full text-sm font-semibold text-gray-600 bg-gray-100"
                  >
                    이의 신청
                  </button>
                  <button
                    onClick={() => { setDialog(null); setRejectedReason(null); }}
                    className="flex-1 py-3.5 rounded-full text-sm font-semibold text-white bg-gray-900"
                  >
                    글 수정하기
                  </button>
                </div>
              </div>
            )}

            {dialog === 'analyzing' && (
              <div className="p-8 text-center">
                <p className="text-lg font-bold text-gray-900 mb-4">글 분석 중 입니다.</p>
                <div className="flex justify-center"><SpinCheckIcon /></div>
              </div>
            )}

            {dialog === 'result' && (
              <div className="p-8 text-center">
                <p className="text-lg font-bold text-gray-900 mb-6">글의 색상을 분석했어요.</p>
                <div className="flex items-center justify-center gap-5 mb-8">
                  {suggestedColors.map((key) => (
                    <button
                      key={key}
                      onClick={() => setPickedColor(key)}
                      className="flex items-center justify-center"
                    >
                      <span
                        className="block w-14 h-14 rounded-full"
                        style={{
                          backgroundColor: COLOR_MAP[key].main,
                          boxShadow: pickedColor === key
                            ? `0 0 0 3px white, 0 0 0 5px ${COLOR_MAP[key].main}`
                            : 'none',
                        }}
                      />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setDialog(null); navigate('/color-select', { replace: true, state: { from, content, title } }); }}
                    className="flex-1 py-3.5 rounded-full text-sm font-semibold text-gray-600 bg-gray-100"
                  >
                    직접 고를래요
                  </button>
                  <button
                    onClick={handleSelectAiColor}
                    disabled={!pickedColor}
                    className="flex-1 py-3.5 rounded-full text-sm font-semibold text-white bg-gray-900 disabled:opacity-30"
                  >
                    선택하기
                  </button>
                </div>
              </div>
            )}

          </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-14 h-14 text-gray-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 12l3 3 5-5" />
    </svg>
  );
}
function SpinCheckIcon() {
  return (
    <svg className="w-14 h-14 text-gray-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" strokeDasharray="40 20" strokeLinecap="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12l3 3 5-5" />
    </svg>
  );
}
// 임시저장 바텀시트 아이콘들
function SaveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
function CancelIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F21A14" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}
function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
