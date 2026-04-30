# 스며듦(Soul-In) 프론트엔드 규칙 정리

본 문서는 `soulin-frontend-main` 코드베이스를 정적 분석하여 추출한 **실제로 적용 중인** 컨벤션을 정리한다.
새로운 코드는 가급적 아래 규칙을 따라 작성한다.

> 도메인/화면 개요는 루트의 `CLAUDE.md`를, 진행 중인 기술 부채는 `docs/refactoring-backlog.md`를 참고.

---

## 1. 기술 스택 / 빌드 환경

| 항목 | 버전·설정 |
|------|-----------|
| React | 19 (StrictMode 활성, JSX runtime: `react-jsx`) |
| TypeScript | `~6.0.2`, `verbatimModuleSyntax`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `erasableSyntaxOnly` |
| 번들러 | Vite 8 (`@vitejs/plugin-react`), dev 서버 포트 **5174 / strictPort** |
| 스타일 | Tailwind CSS v3 + PostCSS + Autoprefixer |
| 라우터 | React Router v7 (`BrowserRouter`) |
| HTTP | axios 1.x (mock 인터셉터 포함) |
| 캡처 | `html2canvas` (필요 시점에 dynamic import) |
| 린트 | ESLint 9 + `typescript-eslint` + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh` (`vite` config) |

### 1.1 TypeScript Project References (composite 빌드)

- 루트 `tsconfig.json`은 빈 껍데기, **`tsconfig.app.json`(src 대상)** 과 **`tsconfig.node.json`(vite.config.ts 대상)** 두 개를 references로 분리.
- 따라서 빌드 명령은 `tsc -b`(build mode). 단일 `tsc`로 호출하지 않는다.
- 새 tsconfig 파일을 추가하면 루트 `references`에도 등록한다.

### 1.2 타입 체크 시점 / 명령

- **Vite는 타입 체크를 하지 않는다.** `npm run dev` 중에는 타입 오류가 잡히지 않으므로 PR 전 반드시 `npm run build`(=`tsc -b && vite build`) 통과를 확인.
- `npm run lint`(`eslint .`)도 함께 통과시킨다. lint 무시 대상은 **`dist`** 만.
- 사용 가능한 npm scripts: `dev`, `build`, `lint`, `preview` (테스트 스크립트 없음).

### 1.3 의도적으로 도입하지 않는 것 (Non-goals)

다음은 **의도적으로 미도입**한 영역이다. 도입 결정은 팀 합의가 필요하다.

| 영역 | 현 상태 | 대체 방식 |
|------|---------|-----------|
| 데이터 페칭 라이브러리 | React Query / SWR 모두 없음 | `useState + useEffect + cancelled` 플래그 |
| 전역 상태 라이브러리 | Redux / Zustand / Recoil 없음 | Context API (도메인별 분리) |
| 테스트 프레임워크 | Vitest / Jest 없음 | (수동 QA) |
| Error Boundary | 없음 | catch 후 `console.error` + 로컬 에러 state |
| SSR / RSC | 미지원 (CSR 전용) | `localStorage`를 모듈 최상단에서 직접 호출, `typeof window` 가드 없음 |
| CSS-in-JS | styled-components / Emotion 없음 | Tailwind + 필요 시 inline `style` |
| 코드 스플리팅 | 페이지 단위 lazy 분할 없음 | App.tsx에서 모든 페이지 정적 import (예외: `html2canvas` dynamic import) |

---

## 2. 디렉터리 구조

```
src/
├── api/             # axios client + 도메인별 API 모듈 + mock 어댑터
│   ├── client.ts    # axios 인스턴스, 토큰/401·403 인터셉터
│   ├── mock.ts      # VITE_USE_MOCK=true일 때만 활성화
│   ├── auth.ts      # 로그인/회원가입/로그아웃
│   ├── posts.ts     # 글 CRUD + 공감 + 북마크 + AI 색상 + normalizePost
│   ├── users.ts     # /users/me, 내 글, 비밀번호 변경
│   ├── user.ts      # users.ts 재export(구 경로 호환)
│   ├── reactions.ts # 공감 타입/요약/상세
│   └── colors.ts    # 컬러 마스터
├── assets/          # 정적 이미지
├── components/
│   ├── common/      # TopBar, BottomNav, BackButton, ColorDot, RainbowBackground
│   ├── feed/        # PostCard, ColorTabBar
│   ├── post/        # EmpathyBottomSheet
│   └── write/       # ColorPicker
├── constants/       # moderation 등 도메인 상수
├── context/         # AuthContext, BookmarkContext, DraftContext, FeedContext
├── data/            # mockPosts, mockUser (+ index barrel)
├── pages/           # 라우트별 화면 컴포넌트
├── types/           # color, post, empathy, user, colorMode (+ index barrel)
├── App.tsx          # Provider 합성 + Routes
├── main.tsx         # React 진입점 (StrictMode + createRoot)
├── index.css        # Tailwind + 전역 base + RainbowBackground 전용 keyframes
└── App.css          # (Vite 템플릿 잔존, 사용처 없음)
```

규칙:
- 컴포넌트 파일명은 **PascalCase.tsx**, 그 외 모듈은 **camelCase.ts**.
- 디렉터리는 모두 **소문자**(`components/common`, `api`, `types` …).
- `pages/` 하위 화면 파일은 **`{도메인}Page.tsx`** 네이밍 (`FeedPage`, `WritePage`, `PostDetailPage` …).
- `types/`와 `data/`는 **barrel export(`index.ts`)** 통해 노출. 외부에서는 `from '../types'` 한 줄로 import.
- `hooks/`, `utils/` 폴더는 현재 없다 — 동일 컴포넌트 파일 내부에 helper(`formatDate` 등)를 두거나, Context의 custom hook(`useAuth`)으로 노출한다.

---

## 3. 라우팅 / 화면 구조

### 3.1 라우트 정의 (`src/App.tsx`)

| 경로 | 컴포넌트 | 보호 | 하단 탭바 |
|------|----------|------|-----------|
| `/login`, `/signup` | LoginPage / SignUpPage | 공개 | 숨김 |
| `/` | FeedPage | 인증 | 표시 |
| `/color-select` | ColorSelectPage | 인증 | 숨김 |
| `/write`, `/write/:postId` | WritePage | 인증 | 숨김 |
| `/post/:id` | PostDetailPage | 인증 | 숨김 |
| `/bookmark` | BookmarkPage | 인증 | 표시 |
| `/mypage` | MyPage | 인증 | 표시 |
| `/profile-edit`, `/change-password`, `/posts-manage` | 마이페이지 하위 | 인증 | 숨김 |
| `/reactions-summary`, `/reactions-summary/:postId` | 공감 통계 | 인증 | 숨김 |

- **인증 가드**는 `App.tsx`의 `Layout`에서 일괄 처리. `isLoggedIn === false` 이고 `/login`·`/signup`이 아니면 `<Navigate to="/login" replace />`.
- **하단 네비게이션 노출 여부**는 `NO_TAB_PATHS` 상수 + `pathname.startsWith('/post/' | '/reactions-summary' | '/write/')`로 판단. 새 화면 추가 시 두 곳 중 하나에 등록.

### 3.2 화면 레이아웃 원칙

- 모바일 앱 컨테이너: **`max-w-[430px]` 중앙 정렬, 흰 배경, 그림자**(`shadow-2xl`).
- 화면 높이는 `min-h-svh` / `h-full` / `100dvh` 사용 (모바일 안전 영역 고려).
- 상단 헤더는 `header` 태그, `shrink-0`로 고정. 본문은 `flex-1 overflow-y-auto`.
- 스크롤 영역은 보통 **`scrollbar-none` 유틸리티**(index.css에서 정의)와 함께 사용.
- iOS 안전 영역은 `pb-safe` 유틸리티 사용.

### 3.3 `navigate` 사용 컨벤션

- **흐름 종료 후 이동**(로그인 성공, 게시 완료, 삭제 후 등)은 항상 **`{ replace: true }`** — 뒤로가기로 이전 화면으로 못 돌아가게.
- **멀티스텝 데이터 전달**은 **`location.state`** 로 한다. 일관되게 사용하는 키:
  - `from`: 진입 경로 추적. `const from = locState?.from ?? '/';` 패턴으로 X(닫기) 버튼이 진입한 곳으로 돌아가게.
  - `content`, `title`: 작성 중인 본문/제목 보존(ColorSelectPage ↔ WritePage).
  - `editId`, `draftId`: 수정/임시저장 식별자.
  - `colorMode`, `initialColor`: 선택 색상 prefill.
- **본인 글 진입 분기**도 `location.state.from === 'posts-manage'` 휴리스틱 사용 (`PostDetailPage` 참고). 추후 `userId` 비교로 대체 예정 — `docs/refactoring-backlog.md` 참고.

### 3.4 멀티스텝 화면 패턴

- 한 페이지 안에서 단계 전환이 필요하면 **`useState<1 | 2>(1)`** 같이 좁은 union 타입으로 step state를 관리 (`SignUpPage`).
- **회원가입 → 자동 로그인 → 피드 진입** 흐름:
  ```ts
  await apiSignup({ email, password, userName });
  const data = await apiLogin({ email, password });
  login({ userName: data.userName, userId: data.userId });
  navigate('/', { replace: true });
  ```
  새 가입/온보딩 플로우 추가 시 동일 패턴을 따른다.

---

## 4. 컴포넌트 코딩 컨벤션

### 4.1 시그니처 / Export

- **`export default function ComponentName(props: Props) { ... }`** 가 표준. (named export는 hook/Provider 정도에만 사용)
- Props 타입은 같은 파일 상단에 **`interface Props { ... }`** 로 선언.
- 외부에 함께 노출할 타입은 **`export interface XxxRequest`** 처럼 `interface` 키워드 사용.
- `import type { ... }`로 type-only import 명시 (`verbatimModuleSyntax` 강제).
- React import는 **default import 금지**, 필요한 hook/타입만 named import (`import { useState, type ReactNode } from 'react'`).

```tsx
import type { ReactNode } from 'react';

interface Props {
  title?: string;
  left?: ReactNode;
  right?: ReactNode;
}

export default function TopBar({ title, left, right }: Props) {
  return ( /* ... */ );
}
```

### 4.2 페이지 내부 보조 컴포넌트

- 한 페이지에서만 쓰이는 입력/버튼/카드 컴포넌트(`InputField`, `NextButton`, `ManageCard`, `DraftCard` …)는 **같은 파일 안에 함수로 선언**하고 export하지 않는다.
- 한 줄짜리 SVG 아이콘 함수(`KebabIcon`, `XIcon` …)도 동일 — 파일 하단에 모아둔다.
- 두 곳 이상에서 재사용되는 컴포넌트만 `components/common/`로 승격 (`BackButton`, `TopBar`, `BottomNav`, `ColorDot`, `RainbowBackground`).

### 4.3 비동기 데이터 페칭 (`cancelled` 플래그 패턴)

데이터 페칭은 **`useState + useEffect` + `let cancelled = false;`** 가 표준. AbortController는 사용하지 않는다.

```tsx
useEffect(() => {
  let cancelled = false;
  setLoading(true);
  fetchSomething()
    .then((res) => { if (!cancelled) setData(res); })
    .catch(() => { if (!cancelled) setError(true); })
    .finally(() => { if (!cancelled) setLoading(false); });
  return () => { cancelled = true; };
}, [deps]);
```

적용처: `MyPage`, `WritePage`(`fetchMyPost`), `PostManagePage`, `ReactionsSummaryPage`, `ReactionsDetailPage` 등.

### 4.4 다이얼로그 / 시트 상태 관리

- **여러 개의 다이얼로그가 있는 화면**은 boolean 여러 개 대신 **단일 union state**로 관리한다.
  ```ts
  type DialogType =
    | 'draft' | 'confirm' | 'posting' | 'done'
    | 'publish-failed' | 'rejected' | 'analyzing' | 'result' | null;
  const [dialog, setDialog] = useState<DialogType>(null);
  ```
  (`WritePage` 참고)
- **시트 타겟이 여러 종류**일 때는 boolean + 별도 데이터 state 대신 **discriminated union**을 우선한다. 분기마다 필요한 필드가 다를 때 타입 안전하게 처리할 수 있다.
  ```ts
  type SheetTarget =
    | { kind: 'published'; post: Post }
    | { kind: 'draft-post'; post: Post }
    | { kind: 'draft-local'; draft: PostDraft }
    | { kind: 'rejected'; post: Post }
    | null;
  ```
  (`PostManagePage:11-24` 참고. `ColorMode`(§6.2)와 동일 패턴.)
- 단일 시트/모달은 boolean (`sheetOpen`, `confirmOpen`) 사용 (`PostDetailPage`, `PostManagePage`).
- 토스트는 setTimeout으로 자동 닫기 (`1600~2000ms`), state는 boolean 또는 string 메시지. 일반 확인용은 1600ms, 삭제 완료처럼 강조가 필요한 토스트는 2000ms 권장.

### 4.5 옵티미스틱 업데이트 + 롤백

상태 변경 API 호출은 **선반영 → 실패 시 원복** 패턴을 우선한다.

- Set/객체/배열은 **항상 새 인스턴스**로 갱신:
  ```ts
  setBookmarkedIds((prev) => {
    const next = new Set(prev);
    hadIt ? next.delete(postId) : next.add(postId);
    return next;
  });
  ```
- 이전 값을 별도 변수에 보관해두고 catch에서 `setX(previous)` 로 복구.
- **삭제 옵티미스틱**은 제거된 항목 자체를 보관해두고 실패 시 같은 위치(보통 맨 앞)에 복원한다.
  ```ts
  const removed = posts.find((p) => p.id === id);
  setPosts((prev) => prev.filter((p) => p.id !== id));
  try { await deletePost(id); }
  catch { if (removed) setPosts((prev) => [removed, ...prev]); }
  ```
  (`PostManagePage.deletePost` 참고)
- 적용처: `BookmarkContext.toggleBookmark`, `PostDetailPage.handleCancelEmpathy`, `PostManagePage.deletePost`.

### 4.6 ESLint 예외 정책

- `eslint-disable-next-line` 사용은 **예외적**. 현재 코드베이스 전체에 1곳(`WritePage:86`)만 존재.
- 허용 사례: 마운트 시 1회만 실행되어야 하는 부수효과(`titleRef.current?.focus()`, `clearDraft(draftId)`) 때문에 `react-hooks/exhaustive-deps`를 비활성화한 경우.
- 새로 disable이 필요하면 **사유를 한국어 주석으로 함께** 단다.

### 4.7 미사용 변수 명시적 우회

- TS `noUnusedLocals`/`noUnusedParameters`가 켜져 있어 임시로 보존하고 싶은 식별자는 **`void colorKey;`** 처럼 명시적으로 소비한다 (`ReactionsDetailPage` 참고).
- 단순 `// eslint-disable-next-line no-unused-vars`보다 의도가 명확하므로 이쪽을 선호.

### 4.8 주석 스타일

- 한국어 주석. 섹션 구분은 `// ── 제목 ──────────────` 또는 `/* ── 제목 ── */` 패턴.
- "왜" 위주 주석. 단순 설명("// state 정의") 같은 군더더기는 지양.

### 4.9 이벤트 전파 제어

- 카드/리스트 항목이 클릭 가능한 동시에 내부에 별도 인터랙션(케밥 메뉴, 보조 버튼)을 가질 때 **자식 핸들러에서 `e.stopPropagation()`** 으로 부모 onClick을 차단한다.
  ```tsx
  <button onClick={(e) => { e.stopPropagation(); onKebab(); }}>...</button>
  ```
  적용처: `PostManagePage:437,483`(케밥), `BookmarkPage:76`(외부 클릭 차단).
- 시트 dim 영역은 `onClick={onClose}`로 두고, 본체는 별도 컨테이너에 두어 dim 클릭으로만 닫히게 한다 — 본체 onClick에서 stopPropagation을 따로 걸 필요 없음(같은 부모가 아니므로).

### 4.10 가로 스크롤 / 스냅 패턴

- 가로 카루셀(색상 탭, ColorPicker)은 **CSS scroll-snap + `scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })`** 조합을 표준으로 한다.
  ```tsx
  <div style={{ overflowX: 'auto', scrollSnapType: 'x mandatory' }}>
    {items.map(... <button style={{ scrollSnapAlign: 'center' }} />)}
  </div>
  ```
  - 활성 항목 변경 시 `el.scrollIntoView(...)`로 가운데 스냅 (`ColorTabBar:21`, `ColorPicker:38,89`).
  - 무한 루프(예: ColorPicker 3-set 복제 + settle 시점 silent jump)가 필요하면 `behavior: 'auto'`로 점프하고 디바운스 ref(`settleTimeoutRef`)로 race condition을 방지한다.
- 스크롤바는 가급적 **`scrollbar-none` 유틸리티**(index.css)로 숨긴다.

### 4.11 접근성(최소) 정책

현재 a11y는 **최소 수준**으로만 적용한다. 새 컴포넌트도 동일 기준을 따른다.

- 아이콘만 있는 버튼/색상 버튼에는 **`aria-label`** 을 단다 (`ColorPicker:123`, `ColorTabBar`, `EmpathyBottomSheet`).
- 장식용 요소(`RainbowBackground` 등)는 **`aria-hidden="true"`** (`RainbowBackground.tsx:22`).
- 그 외 `role`, `tabIndex`, focus trap, 키보드 ESC 닫기, body scroll lock 등은 **현재 도입하지 않음**. 도입 결정은 팀 합의가 필요(§1.3 Non-goals와 동일 정책).

### 4.12 중복 helper(formatDate 등)

- 동일 시그니처의 헬퍼가 **2곳 이상**에서 중복되면 그대로 두지 말고 `docs/refactoring-backlog.md`에 등록한다.
- 현재 알려진 중복: `formatDate(iso)` — `PostCard:9`, `PostDetailPage:13`, `PostManagePage:26`, `ReactionsDetailPage`. 추후 `utils/date.ts`(또는 동등 위치)로 통합 예정.
- 새로 helper를 만들 때는 같은 파일 안 1회용으로 충분한지, 아니면 처음부터 공용 모듈에 두어야 하는지 판단한다.

---

## 5. 스타일링 규칙

### 5.1 Tailwind 우선

- **Tailwind 클래스 직접 사용**. `styled-components`, CSS module은 도입하지 않는다.
- 전역 CSS는 `src/index.css`에만 작성하며, 다음 용도에 한함:
  - Tailwind 디렉티브 (`@tailwind base/components/utilities`)
  - body/font 등 base 스타일
  - 커스텀 유틸리티 (`scrollbar-none`, `pb-safe`)
  - `RainbowBackground`용 keyframes/.color-orb 정의
- `App.css`는 Vite 템플릿 잔존 파일이며 **사용 금지**(import되지 않음).

### 5.2 inline `style` 사용 기준

Tailwind만으로 표현이 어렵거나 디자인 토큰이 동적인 경우 inline style을 허용한다.
inline style의 픽셀 값은 **단위 없는 숫자 리터럴**(예: `width: 26`)로 작성 — TS/React가 px로 해석.

| 사용 케이스 | 예시 |
|------------|------|
| 도메인 색상(hex) 적용 | `style={{ backgroundColor: COLOR_MAP[key].main }}` |
| 피그마에서 받은 정밀 픽셀 값 | `style={{ width: 26, height: 26 }}` |
| 동적 그림자 / 박스섀도 | `boxShadow: \`0 0 0 2px white, 0 0 0 4px ${main}\`` |
| z-index, 배경 그라데이션 | `style={{ background: 'conic-gradient(...)' }}` |

### 5.3 자주 쓰는 클래스 패턴

| 패턴 | 클래스 |
|------|--------|
| 모바일 컨테이너 | `w-full max-w-[430px] min-h-svh bg-white` |
| 버튼 active 인터랙션 (대형) | `active:scale-[0.98] transition-transform` — PostCard, CTA 버튼 등 |
| 버튼 active 인터랙션 (정밀) | `active:scale-[0.985] transition-transform` — 게시글 큰 카드 등 |
| 버튼 active 인터랙션 (아이콘) | `active:scale-90 transition-transform` — 케밥/북마크 같은 작은 아이콘 버튼 |
| 1·3줄 말줄임 | `line-clamp-1`, `line-clamp-3` |
| 바텀시트 dim | `fixed inset-0 bg-black/30 z-40` |
| 바텀시트 본체 | `fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white rounded-t-3xl z-50 pb-8` |
| 다이얼로그 컨테이너 | `fixed inset-0 z-50 flex items-center justify-center bg-black/40` 안에 `bg-white rounded-3xl p-8 text-center` |
| 핸들 바 | `w-10 h-1 rounded-full bg-gray-200` |
| 하단 고정 CTA | `fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-5 pb-8 pt-3 bg-white` |
| 토스트 | `fixed left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full text-sm text-white` (배경 `rgba(0,0,0,0.75)`) |

> 바텀시트는 **dim과 본체를 항상 한 쌍의 형제 요소**로 렌더한다(별도 portal/Provider 없음). dim에 `onClick={close}` 만 걸고 본체에는 핸들러를 두지 않는 것이 표준 (`EmpathyBottomSheet.tsx:41-44`).

### 5.4 디자인 토큰 (사실상의 표준값)

코드 전반에서 반복되는 inline 수치를 토큰처럼 사용한다. 하드코딩 시 같은 값을 따른다.

**텍스트 색상**

| 용도 | hex |
|------|-----|
| 본문 (회색) | `#5e5e5e` |
| 메타 (날짜, 보조 라벨) | `#757575` / `#8a8a8a` / `#aaaeb3` |
| 제목 / 본문 강조 | `#131416` / `#222222` / `#000000` |
| 라벨 | `#131416` |
| 위험 / 삭제 / 반려 | `#F21A14` (= `COLOR_MAP.red.main`) |

**입력 필드 / 버튼 토큰** (`LoginPage`, `SignUpPage`, `ChangePasswordPage`, `ColorSelectPage` 공통)

| 항목 | 값 |
|------|-----|
| 입력 height | 44 |
| 입력 borderRadius | 8 (또는 변경 폼은 10) |
| 입력 border | `1px solid #d8d8d8` (또는 비밀번호 입력은 `background: #eeeeee`) |
| CTA 버튼 height | 44 |
| CTA 버튼 borderRadius | 30 또는 91 |
| CTA 활성색 | bg `#000000` / `#131416`, text `#ffffff` |
| CTA 비활성색 | bg `#e6e6e6`, text `#000000` / `#131416` |
| CTA fontSize / weight | 16 / 500 |

**카드 토큰**

| 카드 종류 | 스타일 |
|-----------|--------|
| PostCard (피드) | `bg-white`, `borderRadius: 15`, `shadow-[0_2px_16px_rgba(0,0,0,0.04)]` |
| BookmarkCard / ManageCard / DraftCard | `borderRadius: 15`, `background: '#f8f8f8'` |
| RejectedCard | `borderRadius: 15`, `background: '#fff5f5'`, `border: '1px solid #fde0df'`, 사유 박스 `color: '#c0392b'` / `bg: '#fce8e8'` |

### 5.5 폰트

- `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif` (index.css의 body 정의).
- 모든 페이지에 동일 적용 — 별도 폰트 패밀리 지정 금지.

### 5.6 z-index 계층

코드 전반에서 사용 중인 z-index는 **40과 50 두 값뿐**이다. 새 오버레이/플로팅 요소도 같은 규칙을 따른다.

| 값 | 용도 |
|----|------|
| `z-40` | 바텀시트 dim, 모달 배경 dim |
| `z-50` | 시트/다이얼로그 본체, 토스트, BottomNav (`bg-white`로 dim 위에 떠 있음) |

규칙:
- **dim과 본체가 같은 z-50일 때**도 마크업 순서상 본체가 dim 뒤에 오므로 정상 노출된다 (`PostDetailPage`의 다이얼로그 패턴: 단일 컨테이너 `z-50`에 dim + 콘텐츠 동시 배치).
- 임의로 `z-30`/`z-60`/`z-[999]` 같은 값을 만들지 않는다. 더 깊은 계층이 필요하면 먼저 팀과 협의.
- React Portal은 사용하지 않는다 — 모든 시트/모달은 페이지 컴포넌트가 같은 트리에서 렌더한다.

---

## 6. 색상 시스템 (도메인 핵심)

### 6.1 단일 진실 공급원: `src/types/color.ts`

- **12종 ColorKey**: `red, orange, yellow, lime, green, cyan, blue, navy, purple, pink, gray, black`.
- **COLOR_KEYS**: 위 순서를 보장하는 배열. 백엔드 `colorId = index + 1`.
- **COLOR_ID_MAP**: `ColorKey → number` (요청 body 보낼 때 사용).
- **COLOR_MAP**: 각 키마다 `{ label, main(진한 hex), soft(흐린 hex) }`.

규칙:
- 색상 추가/순서 변경은 **금지** (백엔드 `/colors`와 1:1 매핑).
- 컴포넌트에서는 `COLOR_KEYS.map(...)`로 순회. 직접 배열 리터럴을 만들지 않는다.
- "전체" 탭/AI 모드 등 12색 외 요소는 별도 그라데이션 상수(`RAINBOW_GRADIENT`, `AI_CIRCLE_BG`)로 정의.
- 도메인 색상 hex를 **임의로 하드코딩 금지** — 위험·삭제용 `#F21A14`만 예외.

### 6.2 ColorMode

```ts
export type ColorMode =
  | { kind: 'color'; color: ColorKey }
  | { kind: 'ai' };
```

작성 플로우(`ColorSelectPage` → `WritePage`)에서 router state로 전달.

---

## 7. API 레이어 규칙

### 7.1 axios 인스턴스 (`api/client.ts`)

- baseURL: `import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'`.
- `Content-Type: application/json`, timeout 10s.
- 요청 인터셉터: `/auth/login`, `/auth/signup`을 제외한 모든 요청에 `Authorization: Bearer {soul_in_token}` 자동 부착.
- 응답 인터셉터:
  - `401` → 모든 인증 관련 localStorage 키 삭제 + `/login`으로 강제 이동.
  - `403` → console.error만, 자동 로그아웃하지 않음.

### 7.2 도메인별 모듈

- 한 도메인 = 한 파일(`posts.ts`, `users.ts`, `reactions.ts` …). 새 엔드포인트는 적절한 모듈에 추가한다.
- 함수는 **`export const fetchXxx = (): Promise<T> => client.get<T>('/...').then(r => r.data);`** 형식의 화살표 + then 체인.
- 요청/응답 타입은 같은 파일에 `export interface XxxRequest`, `export interface XxxResponse`로 선언.
- 백엔드 응답 → 프론트 모델 변환은 **normalizer 함수**로 격리 (`posts.ts`의 `normalizePost`).
- 새 도메인은 `api/{domain}.ts`로 만들고, 외부에는 함수 단위로만 노출 (Context/페이지에서 직접 import).

### 7.3 모킹

- 환경변수 **`VITE_USE_MOCK=true`** 일 때만 `client.defaults.adapter`를 `api/mock.ts`가 덮어쓴다.
- 새 mock 라우트 추가 시 **더 구체적인 경로(`/posts/:id`)를 일반 경로(`/posts`)보다 위에** 배치할 것 (mock.ts 주석 참고).
- mock과 실제 API가 같은 응답 스키마를 갖도록 유지한다.
- mock 데이터에서 **본인 글**은 `authorId='u1'`, `userId=1`, `authorNickname='나'`로 통일 (`mockUser`와 일치).

### 7.4 인증 토큰 / localStorage 키

| 키 | 의미 |
|----|------|
| `soul_in_token` | accessToken |
| `soul_in_refresh_token` | refreshToken |
| `soul_in_auth` | `'true' | null` 로그인 여부 캐시 |
| `soul_in_user_name` | 닉네임 캐시 |
| `soul_in_user_id` | userId(숫자) 캐시 |
| `soul_in_drafts` | 임시저장 글 배열(JSON) |

규칙:
- localStorage 키는 항상 **`soul_in_` prefix** 사용.
- 새 키 추가 시 `AuthContext.logout()`과 `client.ts`의 401 핸들러 정리 목록에 함께 추가한다.
- 키는 가능하면 **모듈 상수로 선언**(`const DRAFTS_KEY = 'soul_in_drafts';`) — `DraftContext` 패턴.
- **`JSON.parse`는 반드시 `try/catch`** 로 감싸서 손상된 값 대비 (`DraftContext.loadDrafts` 참고).

### 7.5 무거운 의존성은 dynamic import

- 사용 시점이 명확하고 무거운 라이브러리는 **함수 내부에서 `await import()`** 로 로드한다.
  ```ts
  const { default: html2canvas } = await import('html2canvas');
  ```
- 적용처: `PostDetailPage.handleDownload` (이미지 캡처는 사용자가 메뉴 진입한 시점에만 필요).
- 새 무거운 라이브러리 추가 시 동일 정책 검토.

---

## 8. 상태 관리 (Context API)

전역 상태는 4개의 Context로 분리한다. App.tsx에서 다음 순서로 합성:

```tsx
<AuthProvider>
  <BookmarkProvider>
    <DraftProvider>
      <FeedProvider>{children}</FeedProvider>
    </DraftProvider>
  </BookmarkProvider>
</AuthProvider>
```

| Context | 책임 |
|---------|------|
| `AuthContext` | `isLoggedIn`, `userName`, `userId`, `login()`, `logout()`. 마운트 시 `fetchMe()`로 토큰 검증 (5xx/네트워크 에러는 유지, 401/403만 logout) |
| `BookmarkContext` | `bookmarkedIds: Set<string>`, 토글 + 서버 동기화(낙관적 업데이트 + rollback). 로그인 상태 변경 시 자동 refresh |
| `DraftContext` | `drafts: PostDraft[]`, `localStorage('soul_in_drafts')` 동기화 |
| `FeedContext` | 피드 글 캐시 (`feedPosts`, `updatePost`, `removePost`) |

규칙:
- 컨텍스트는 `createContext<Value | null>(null)`로 선언, 커스텀 훅(`useXxx`)에서 null 체크 후 `throw`.
- `value`는 항상 `useMemo`로, 액션은 `useCallback`으로 감싸 리렌더 폭증 방지.
- 파생값도 `useMemo`(예: `DraftContext`의 `draft = drafts[0] ?? null`).
- Provider 컴포넌트와 훅은 **같은 파일에서 named export**.
- 새 전역 상태가 필요하면 새 Context 파일 추가 + App.tsx 합성에 등록 (Redux/Zustand 등 라이브러리는 도입하지 않음).

---

## 9. 도메인 규칙 — 글 / 공감 / 모더레이션

### 9.1 글(Post) 상태

- `PostStatus`: `'PUBLISHED' | 'DRAFT' | 'PENDING' | 'REJECTED'`. 없으면 PUBLISHED 간주.
- 신규 게시 플로우: **createPost(DRAFT 생성) → publishPost(검열 통과 시 PUBLISHED, 실패 시 REJECTED)** 2단계.
- 2단계 실패 시 글은 DRAFT로 보존되고 `'publish-failed'` 다이얼로그를 띄운다.
- `REJECTED` 게시글은 `moderationReason`(콤마 구분 영문 코드)을 가지며 `constants/moderation.ts`의 `formatModerationReason()`으로 한국어 표시.

### 9.2 공감(Empathy)

- 공감 옵션은 **`src/types/empathy.ts`의 `EMPATHY_OPTIONS`** 가 단일 소스.
- 카테고리: `공감 | 응원 | 위로 | 지지` (Korean literal type).
- 텍스트는 백엔드 `GET /reaction-types` 응답과 **항상 동기화**. 임의 변경 금지(파일 내 주석에 명시).
- 보내는 reactionTypeId는 `REACTION_TYPE_ID_MAP[sentence.text]`로 자동 산출.

### 9.3 모더레이션 사유 매핑

`constants/moderation.ts`의 `MODERATION_REASON_KO` 사전 사용. 새 사유 코드가 추가되면 사전에 추가하여 한국어로 노출되게 한다.

### 9.4 입력 길이 / sanitize 규칙

| 필드 | 규칙 | 위치 |
|------|------|------|
| 본문(content) | 최대 300자, 입력 단계에서 컷 (`if (e.target.value.length <= MAX_LENGTH)`) | WritePage |
| 닉네임 | 2~10자, 입력 단계에서 길이 컷 | SignUpPage, ProfileEditPage |
| 이메일 | 공백 자동 제거(`replace(/\s+/g, '')`) + `onKeyDown` Space 차단 + `onPaste` 공백 제거 | LoginPage, SignUpPage |
| 비밀번호 | 로그인 6자 이상, 변경 시 8자 이상 | LoginPage, SignUpPage, ChangePasswordPage |

`SignUpPage`의 `InputField` 컴포넌트가 `sanitize`/`blockSpace` props로 위 규칙을 캡슐화 — 신규 입력 폼은 같은 패턴으로 재사용 검토.

---

## 10. UI 상태 패턴 — 로딩 / 빈 / 에러

페이지 단위 상태 표현은 다음 표준을 따른다.

| 상태 | 마크업 패턴 | 메시지 컨벤션 |
|------|------------|--------------|
| **로딩** | `<div className="flex items-center justify-center h-40 text-sm text-gray-400">...</div>` | `"불러오는 중..."` |
| **빈 상태** | `<div className="flex flex-col items-center ...gap-2"><span className="text-3xl">🌱</span><p className="text-sm text-gray-400">...</p></div>` | `"아직 ... 없어요"` (이모지 🌱·🌫·🌫️ 동반 가능) |
| **에러** | 빈 상태와 동일한 마크업, 메시지만 변경 | `"... 불러오지 못했어요"` |
| **에러 + 액션** | `PostDetailPage`처럼 `돌아가기` 같은 underline 텍스트 버튼 추가 | — |
| **토스트** | 5.3절 토스트 클래스 + `setTimeout 1600~2000ms` 자동 닫기 | 동작 결과 동사형 (`"저장되었습니다"`, `"링크가 복사되었습니다"`) |

페이지 내부에서 빈/로딩/에러를 자주 분기한다면 `PostManagePage`처럼 **`<Empty/>`, `<Loading/>`, `<ErrorState/>`** 작은 함수 컴포넌트로 분리.

---

## 11. 환경 변수

`.env`, `.env.production` 모두 다음 두 키만 사용한다.

| 키 | 의미 |
|----|------|
| `VITE_API_BASE_URL` | API base URL (기본 `https://api.soulin.xyz`) |
| `VITE_USE_MOCK` | `'true'`이면 axios mock 어댑터 활성화 |

규칙:
- 환경변수는 **`VITE_` prefix** 만 클라이언트 노출 가능.
- 비밀값(토큰, 시크릿)은 절대 `.env`에 두지 않는다.
- 새 변수 추가 시 두 파일과 `client.ts` 기본값을 함께 갱신한다.

---

## 12. 로깅 / `console` 사용 정책

- **`console.error`** 만 production 코드에 잔존 가능. 사용처는 catch 블록 한정.
  - 메시지 포맷: `\`<도메인 동작> failed\`` + error 객체 (예: `console.error('sendEmpathy failed', err)`).
- **`console.log`** 는 미구현 placeholder (예: `WritePage`의 이의 신청 알림)에 한해 임시 허용. 실제 알림은 가능한 한 toast/다이얼로그로 대체할 것.
- **`window.alert`** 는 임시 placeholder만 사용. 새 코드는 다이얼로그 컴포넌트로 대체한다.
- 로그/오류 메시지에는 토큰·비밀번호·이메일 본문 등 **민감정보를 절대 포함하지 않는다**.

---

## 13. 배포

- `deploy.sh`: `npm install && npm run build` → `dist/`를 rsync로 서버 전송.
- 배포 대상 Nginx 설정은 별도 관리(서버 정보는 스크립트 안에서 수정).
- 빌드 산출물(`dist/`)과 `node_modules/`는 git ignore.
- `.claude/`(로컬 Claude Code 설정), `.vscode/` 사용자 설정도 git ignore.

---

## 14. 기술 부채 / 리팩토링 운영 문화

`docs/refactoring-backlog.md`에 발견된 부채를 다음 형식으로 누적 기록한다.

- 발견 일자(YYYY-MM-DD) + 짧은 제목.
- **위치**: `파일:라인` 형태로 명시.
- **현상 / 왜 문제인가 / 리팩토링 제안** 3섹션.
- 작업량이 큰 항목은 **Phase 1(즉시 가능) / Phase 2(일정 협의)** 로 분류.
- 백엔드 의존이 있는 항목은 **선행 조건**과 **백엔드 담당자**를 명시.

부채를 직접 고치지 않더라도 **발견 즉시 backlog에 기록**한다.

---

## 15. 코드 추가 시 체크리스트

신규 화면/기능을 만들 때 다음을 점검한다.

- [ ] 컴포넌트 파일은 PascalCase, default export, `interface Props` 패턴인가?
- [ ] `import type`으로 type-only import를 명시했는가? React default import를 쓰지 않았는가?
- [ ] 도메인 색상은 `COLOR_MAP`을 통해서만 사용했는가?
- [ ] 새 라우트라면 `App.tsx`의 `<Routes>`와 `NO_TAB_PATHS`(필요 시)에 등록했는가?
- [ ] 인증 필요 화면이라면 `Layout`의 가드가 동작하도록 별도 분기 없이 두었는가?
- [ ] `navigate`는 흐름 종료 시 `replace: true`, 데이터 전달은 `state`로 했는가?
- [ ] 비동기 페치는 `cancelled` 플래그 패턴을 따랐는가?
- [ ] 다이얼로그가 여럿이면 단일 union state로 묶었는가? 시트 타겟이 여러 종류면 discriminated union을 썼는가?
- [ ] 상태 변경 API는 옵티미스틱 + 롤백을 검토했는가? 삭제는 제거된 항목을 보관했다가 실패 시 복원하는가? Set/객체는 새 인스턴스로 만들었는가?
- [ ] 카드 안의 보조 버튼은 `e.stopPropagation()`으로 부모 onClick을 차단했는가?
- [ ] 가로 카루셀이라면 scroll-snap + `scrollIntoView({ inline: 'center' })` 패턴을 따랐는가?
- [ ] 시트/모달은 dim(`z-40`)과 본체(`z-50`)를 한 쌍으로 렌더했는가? 임의 z-index를 만들지 않았는가?
- [ ] 아이콘만 있는 버튼에 `aria-label`을, 장식 요소에 `aria-hidden`을 달았는가?
- [ ] 동일 helper(formatDate 등)가 2곳 이상 중복되면 backlog에 등록했는가?
- [ ] 빈/로딩/에러 상태를 10절 표준 메시지로 표현했는가?
- [ ] 입력 폼은 9.4절의 sanitize/길이 규칙을 따랐는가?
- [ ] 새 API는 `api/{domain}.ts`에 추가하고, 응답이 백엔드 모델과 다르면 normalizer를 거쳤는가?
- [ ] mock이 필요하다면 `api/mock.ts`에도 동일 응답을 추가했는가? (구체적 라우트가 위에 오도록)
- [ ] localStorage 키는 `soul_in_` prefix를 사용했고, 모듈 상수로 선언했고, 로그아웃 정리 목록에 추가했는가?
- [ ] `JSON.parse`는 `try/catch`로 감쌌는가?
- [ ] 무거운 라이브러리라면 dynamic import를 검토했는가?
- [ ] 전역 상태가 필요하다면 새 Context를 만들고 `App.tsx`에 합성했는가? value는 useMemo, 액션은 useCallback?
- [ ] 바텀시트/다이얼로그/토스트는 5.3절의 패턴을 재사용했는가?
- [ ] 카드/입력/버튼은 5.4절 디자인 토큰을 따랐는가?
- [ ] `console.log` / `window.alert`이 production 경로에 남아있지 않은가?
- [ ] `eslint-disable`을 추가했다면 사유 주석을 달았는가?
- [ ] `npm run lint` / `npm run build`(=`tsc -b && vite build`) 통과하는가?
