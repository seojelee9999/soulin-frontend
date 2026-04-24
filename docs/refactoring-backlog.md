# Refactoring Backlog

## 2026-04-22 강사 피드백 기반 진단

대상 파일: `src/context/AppContext.tsx`  
진단 배경: AppContext에 인증/북마크/피드/임시저장/색상선택/AI모드 6개 도메인이 단일 Context에 혼재한다는 피드백.

---

### 문제 1 — Context value 객체가 useMemo로 감싸지지 않음

**`Phase 1`** (도메인 분리 전 즉시 적용 가능)

**위치:** `src/context/AppContext.tsx:127-148`

**현재 코드:**
```tsx
<AppContext.Provider
  value={{   // ← 렌더마다 새 객체 리터럴 생성
    isLoggedIn, userName, login, logout,
    bookmarkedIds, toggleBookmark,
    ...
  }}
>
```

**왜 문제인가:**
React Context는 value를 `Object.is`로 비교한다. value가 항상 새 객체이므로, AppProvider 내 어떤 state라도 변경되면 (`isAiMode`, `selectedColor` 포함) `useApp()`을 호출하는 모든 컴포넌트가 무조건 리렌더된다. 현재 소비자는 FeedPage, WritePage, PostDetailPage, BookmarkPage, MyPage, ColorSelectPage 등 사실상 전체 앱이다.

**리팩토링 제안:**
```tsx
const value = useMemo(() => ({
  isLoggedIn, userName, login, logout,
  bookmarkedIds, toggleBookmark,
  feedPosts, setFeedPosts, updatePost,
  drafts, draft, saveDraft, clearDraft,
  selectedColor, setSelectedColor,
  isAiMode, setIsAiMode,
}), [
  isLoggedIn, userName, login, logout,
  bookmarkedIds, toggleBookmark,
  feedPosts, setFeedPosts, updatePost,
  drafts, draft, saveDraft, clearDraft,
  selectedColor, setSelectedColor,
  isAiMode, setIsAiMode,
]);
```

단, useMemo만으로는 "어떤 state가 바뀌면 관련 없는 소비자도 리렌더" 문제는 해결 안 된다. 이건 문제 2(컨텍스트 분리)로 해결해야 한다.

---

### 문제 2 — 6개 도메인이 단일 Context에 혼재 (핵심 문제)

**`Phase 2`** (도메인 분리 — 작업량 큼, 단계적으로 진행)

**위치:** `src/context/AppContext.tsx:5-34` (인터페이스), 전체 AppProvider

**현재 도메인 혼재:**

| 도메인 | 상태/함수 | 실제 소비자 |
|--------|-----------|-------------|
| 인증 | `isLoggedIn`, `userName`, `login`, `logout` | MyPage, Layout(App.tsx) |
| 북마크 | `bookmarkedIds`, `toggleBookmark` | PostDetailPage, BookmarkPage, FeedPage |
| 피드 캐시 | `feedPosts`, `setFeedPosts`, `updatePost` | FeedPage, WritePage |
| 임시저장 | `drafts`, `draft`, `saveDraft`, `clearDraft` | WritePage |
| 색상 선택 | `selectedColor`, `setSelectedColor` | ColorSelectPage, WritePage |
| AI 모드 | `isAiMode`, `setIsAiMode` | WritePage |

**왜 문제인가:**
`isAiMode`가 토글될 때마다(글 작성 중 자주 발생) `useApp()`을 쓰는 MyPage, BookmarkPage, PostDetailPage가 모두 리렌더된다. 이들은 `isAiMode`와 전혀 관계 없다. Context는 선택적 구독(selective subscription)을 지원하지 않아서, 값 객체의 reference가 바뀌면 모든 소비자가 리렌더된다.

**리팩토링 제안 — 도메인별 분리:**
```
AuthContext     → isLoggedIn, userName, login, logout
BookmarkContext → bookmarkedIds, toggleBookmark
FeedContext     → feedPosts, setFeedPosts, updatePost
DraftContext    → drafts, draft, saveDraft, clearDraft
WriteFlowContext (또는 router state) → selectedColor, isAiMode
```

분리하면 `isAiMode`가 바뀌어도 `AuthContext`만 쓰는 MyPage는 리렌더되지 않는다.

---

### 문제 3 — 글 작성 플로우 임시 상태가 전역 Context에 상주

**`Phase 2`** (문제 2 작업 시 함께 처리)

**위치:** `src/context/AppContext.tsx:28-33`

```tsx
// 색상 선택 (작성 플로우)
selectedColor: ColorKey | null;
setSelectedColor: (color: ColorKey | null) => void;

// AI 모드 여부
isAiMode: boolean;
setIsAiMode: (v: boolean) => void;
```

**왜 문제인가:**
`selectedColor`와 `isAiMode`는 color-select → write 멀티스텝 플로우에만 필요한 일시적 UI 상태다. 사용 후 수동으로 reset(`setSelectedColor(null)`, `setIsAiMode(false)`)하지 않으면 다음 진입 시 stale state가 남는다. 실제로 WritePage 여러 곳에서 수동 reset이 필요하다.

**리팩토링 제안:**
이미 `location.state`로 title/content를 전달하는 패턴이 있다. selectedColor도 같은 방식으로:
```tsx
// ColorSelectPage
navigate('/write', { state: { color: selected, editId, ... } });

// WritePage
const { color } = useLocation().state ?? {};
```
전역 Context에서 두 필드를 제거하면 AppProvider 렌더 트리거가 그만큼 줄어든다.

---

### 문제 4 — `draft: drafts[0] ?? null` 인라인 파생값

**`Phase 1`** (즉시 적용 가능, 변경량 적음)

**위치:** `src/context/AppContext.tsx:140`

```tsx
value={{
  ...
  draft: drafts[0] ?? null,   // ← 렌더마다 재계산
  ...
}}
```

**왜 문제인가:**
useMemo 없이 value 객체 안에서 파생값을 계산하므로 렌더마다 재계산된다. 현재는 배열 인덱스 접근이라 비용이 거의 없지만, 값이 달라지지 않아도 reference가 달라지는 경우(`drafts` 배열이 동일해도 새 객체로 평가될 때) useMemo가 없으면 소비자를 불필요하게 깨울 수 있다.

**리팩토링 제안:**
```tsx
const draft = useMemo(() => drafts[0] ?? null, [drafts]);
```

---

### 문제 5 — `toggleBookmark`가 북마크·피드 두 도메인을 동시에 변경

**`Phase 2`** (문제 2 도메인 분리와 함께 해결)

**위치:** `src/context/AppContext.tsx:81-93`

```tsx
const toggleBookmark = useCallback((postId: string) => {
  setBookmarkedIds(...);    // 북마크 도메인
  setFeedPostsState(...);   // 피드 도메인도 같이 수정
}, []);
```

**왜 문제인가:**
북마크 도메인과 피드 도메인이 결합(coupling)돼 있다. PostDetailPage에서 북마크를 토글하면 `feedPosts`가 변경되고, FeedPage도 리렌더를 받는다. Context를 분리하더라도 이 커플링이 남아있으면 FeedContext 소비자도 함께 리렌더된다.

**리팩토링 제안:**
`feedPosts` 내 `isBookmarked` 필드를 source of truth로 쓰지 않고, 렌더 시점에 `bookmarkedIds.has(p.id)`로 파생시키는 방식으로 전환하면 `setFeedPostsState` 호출 없이 북마크 동기화가 가능하다. `FeedContext`와 `BookmarkContext`가 분리되면 이 접근이 자연스럽게 된다.

---

### 문제 6 — `setSelectedColor`, `setIsAiMode` 가 raw setter로 노출

**`Phase 1`** (즉시 적용 가능)

**위치:** `src/context/AppContext.tsx:29-33`

**왜 문제인가:**
`Dispatch<SetStateAction<T>>` 타입의 raw setter를 Context API로 노출하면 소비자가 구현 내부에 직접 접근하는 셈이다. 나중에 setter에 부수 로직(예: analytics 이벤트, validation)을 추가하고 싶을 때 Context 인터페이스를 바꿔야 해서 소비자가 모두 영향을 받는다.

**리팩토링 제안:**
```tsx
// 인터페이스: Dispatch 대신 구체적인 함수 타입
setSelectedColor: (color: ColorKey | null) => void;
setIsAiMode: (v: boolean) => void;

// 구현: useCallback으로 래핑
const setSelectedColor = useCallback((color: ColorKey | null) => {
  setSelectedColorState(color);
}, []);
```
현재 `setSelectedColor`는 React가 보장하는 stable reference이므로 실질적 성능 문제는 없지만, 인터페이스 안정성 측면에서 useCallback 래핑이 낫다.

---

## 작업 순서 요약

### Phase 1 — 현 Context 구조 유지, 즉시 적용 가능

| # | 문제 | 파일 | 변경량 |
|---|------|------|--------|
| 1 | value 객체 useMemo 감싸기 | AppContext.tsx | 소 |
| 4 | draft 파생값 useMemo | AppContext.tsx | 소 |
| 6 | raw setter useCallback 래핑 | AppContext.tsx | 소 |

### Phase 2 — Context 도메인 분리 (일정 협의 후 진행)

| # | 문제 | 작업 내용 | 영향 파일 수 |
|---|------|-----------|--------------|
| 2 | 6개 도메인 → 4개 Context 분리 | AppContext 분할, 각 소비자 import 수정 | 10+ |
| 3 | selectedColor/isAiMode → router state | AppContext 제거, ColorSelectPage·WritePage 수정 | 3 |
| 5 | toggleBookmark 커플링 제거 | bookmarkedIds를 유일한 소스로 전환 | 2 |

> Phase 2는 소비자 파일을 일괄 수정해야 하므로, 기능 개발이 잠잠한 시점에 브랜치 분리 후 진행 권장.
