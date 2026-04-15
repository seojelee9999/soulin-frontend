# 스며듦 (Soul-In) — 감정 공유 앱 프론트엔드

## 프로젝트 개요
짧은 감정 글(300자)을 색상으로 분류하여 공유하는 모바일 웹 앱.
색상이 감정의 언어 역할을 한다.

## 기술 스택
- React 19 + TypeScript
- Tailwind CSS v3
- React Router v7
- Context API (전역 상태)
- Axios (HTTP 클라이언트, 현재는 mock)
- Vite

## 화면 목록
| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/` | FeedPage | 색상 탭 필터 + 글 카드 목록 |
| `/color-select` | ColorSelectPage | 글 작성 전 색상 선택 (12종 + AI) |
| `/write` | WritePage | 300자 제한 글 작성 + 임시저장 |
| `/post/:id` | PostDetailPage | 게시글 상세 + 공감하기 바텀시트 |
| `/bookmark` | BookmarkPage | 북마크 목록 |
| `/mypage` | MyPage | 마이페이지 |

## 색상 12종
`red` `orange` `yellow` `lime` `green` `cyan` `blue` `navy` `purple` `pink` `gray` `black`

각 색상은 `COLOR_MAP`(types/color.ts)에서 hex값과 라벨 관리.

## 공감 카테고리 & 문장
```
공감: 나도 그래 / 완전 공감해 / 어떤 기분인지 알아 / 나도 그런 적 있어 / 너를 이해해
응원: 널 응원해 / 가보자구! / 할 수 있어 / 잘하고 있어 / 끝까지 해보자
위로: 괜찮아 / 토닥토닥 / 기다릴게 / 힘들었겠다 / 최선을 다했네
지지: 너를 믿어 / 네 선택을 존중해 / 리스펙👍 / 충분히 멋져🌟 / 있는 그대로도 좋아
```

## 레이아웃 원칙
- 모바일 앱 느낌: 최대 너비 **430px**, 중앙 정렬
- 하단 네비게이션 바 고정
- 상단 색상 탭은 수평 스크롤

## 디렉터리 구조
```
src/
├── api/          # axios 인스턴스 + mock 인터셉터
├── components/
│   ├── common/   # TopBar, BottomNav, ColorBadge, etc.
│   ├── feed/     # PostCard, ColorTabBar
│   ├── post/     # EmpathyBottomSheet, EmpathyItem
│   ├── write/    # CharCounter, DraftBanner
│   ├── bookmark/ # BookmarkCard
│   └── mypage/   # ProfileHeader, StatRow
├── context/      # AppContext (auth, draft, bookmarks)
├── data/         # mockPosts, mockUser, mockBookmarks
├── hooks/        # usePost, useFeed, useEmpathy, useDraft
├── pages/        # 화면 컴포넌트
└── types/        # Post, Color, Empathy, User
```

## 개발 규칙
- 백엔드 미연동: `src/api/mock.ts` 인터셉터로 axios 요청을 mock 데이터로 응답
- 임시저장은 `localStorage` 사용
- 북마크 상태는 Context에서 관리
- Tailwind 클래스 직접 사용, styled-components 사용 안 함
- 컴포넌트 파일명: PascalCase
