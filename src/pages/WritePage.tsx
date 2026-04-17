import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { COLOR_MAP, COLOR_KEYS, type ColorKey } from '../types';
import { useApp } from '../context/AppContext';
import { createPost } from '../api/posts';

const MAX_LENGTH = 300;

// AI 원 그라데이션
const AI_CIRCLE_BG =
  'radial-gradient(circle at 30% 30%, #fce4ec, #e8f4fd 40%, #e8faf5 70%, #fef9e7)';

type DialogType = 'restore' | 'draft' | 'confirm' | 'posting' | 'done' | 'analyzing' | 'result' | null;

function pick3Colors(): ColorKey[] {
  return [...COLOR_KEYS].sort(() => Math.random() - 0.5).slice(0, 3) as ColorKey[];
}

export default function WritePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locState = location.state as { from?: string; content?: string; title?: string; draftId?: string } | null;
  const from: string = locState?.from ?? '/';
  const { selectedColor, isAiMode, setSelectedColor, setIsAiMode, drafts, draft, saveDraft, clearDraft, setFeedPosts, feedPosts } = useApp();

  const [title, setTitle] = useState(locState?.title ?? '');
  const [content, setContent] = useState(locState?.content ?? '');
  const [dialog, setDialog] = useState<DialogType>(null);
  const [suggestedColors, setSuggestedColors] = useState<ColorKey[]>([]);
  const [pickedColor, setPickedColor] = useState<ColorKey | null>(null);
  // finalColor: 선택된 색 (AI 분석 완료 후 또는 직접 선택)
  const [finalColor, setFinalColor] = useState<ColorKey | null>(selectedColor);

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAiMode && !selectedColor && !finalColor) navigate('/color-select', { replace: true });
  }, [isAiMode, selectedColor, finalColor, navigate]);

  useEffect(() => {
    // 임시저장 목록에서 진입: 해당 draft 제거(편집 후 새로 저장되므로)
    if (locState?.draftId) {
      clearDraft(locState.draftId);
      titleRef.current?.focus();
      return;
    }
    // AI 흐름 복귀(locState.content 있음)거나 저장된 draft 없으면 바로 포커스
    if (locState?.content || drafts.length === 0) {
      titleRef.current?.focus();
      return;
    }
    // draft 존재 → 복원 확인 팝업
    setDialog('restore');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const colorInfo = finalColor ? COLOR_MAP[finalColor] : null;
  const remaining = MAX_LENGTH - content.length;

  const handleDraft = () => {
    setDialog('draft');
  };

  // 일반 게시
  const handleSubmit = async () => {
    const color = finalColor;
    if (!color || !content.trim()) return;
    setDialog('posting');
    try {
      const newPost = await createPost({ title: title.trim(), content: content.trim(), color });
      setFeedPosts([newPost, ...feedPosts]);
      clearDraft();
      setIsAiMode(false);
      setSelectedColor(null);
      setDialog('done');
      setTimeout(() => navigate('/', { replace: true }), 1200);
    } catch {
      setDialog(null);
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

  if (!isAiMode && !selectedColor && !finalColor) return null;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 상단 */}
      <header className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-500"><ChevronLeft /></button>
        <button onClick={() => navigate(from)} className="p-1 text-gray-500"><XIcon /></button>
      </header>

      {/* 색상 원 — 중앙 */}
      <div className="flex justify-center pt-4 pb-6 shrink-0">
        {finalColor && colorInfo ? (
          <span
            className="w-16 h-16 rounded-full block"
            style={{
              backgroundColor: colorInfo.hex,
              boxShadow: `0 0 0 3px white, 0 0 0 5px ${colorInfo.hex}`,
            }}
          />
        ) : (
          <span
            className="w-16 h-16 rounded-full block"
            style={{
              background: AI_CIRCLE_BG,
              boxShadow: '0 0 0 3px white, 0 0 0 5px #c084fc',
            }}
          />
        )}
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
              onClick={() => { saveDraft(title, content, finalColor); navigate(from); }}
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
              onClick={() => { clearDraft(); navigate(from); }}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
          <div className="w-full bg-white rounded-3xl overflow-hidden">

            {dialog === 'restore' && (
              <div className="p-8 text-center">
                <p className="text-lg font-bold text-gray-900 mb-2">이전에 작성하던 글이 있어요.</p>
                <p className="text-sm text-gray-400 mb-8">이어서 작성할까요?</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setTitle(draft?.title ?? '');
                      setContent(draft?.content ?? '');
                      if (draft?.color) setFinalColor(draft.color);
                      setDialog(null);
                      titleRef.current?.focus();
                    }}
                    className="w-full py-3.5 rounded-full text-sm font-semibold text-white bg-gray-900"
                  >
                    이어서 작성하기
                  </button>
                  <button
                    onClick={() => { clearDraft(); setDialog(null); titleRef.current?.focus(); }}
                    className="w-full py-3.5 rounded-full text-sm font-semibold text-gray-600 bg-gray-100"
                  >
                    새로 작성하기
                  </button>
                </div>
              </div>
            )}

            {dialog === 'confirm' && (
              <div className="p-8 text-center">
                <p className="text-lg font-bold text-gray-900 mb-2">이 글을 게시할까요?</p>
                <p className="text-sm text-gray-400 mb-8">게시 후에는 전체 공개로 전환됩니다.</p>
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
                <p className="text-lg font-bold text-gray-900 mb-4">피드에 게시 되었습니다.</p>
                <div className="flex justify-center"><CheckIcon /></div>
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
                          backgroundColor: COLOR_MAP[key].hex,
                          boxShadow: pickedColor === key
                            ? `0 0 0 3px white, 0 0 0 5px ${COLOR_MAP[key].hex}`
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
      )}
    </div>
  );
}

function ChevronLeft() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
}
function XIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
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
