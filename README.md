# WAVEON

OTT 서비스 콘텐츠 소개 랜딩페이지 — 애니메이션, 영화, 드라마를 한곳에서 탐색할 수 있는 다크 시네마틱 스타일의 반응형 웹사이트입니다.

---

## 주요 기능

| 기능 | 설명 |
|---|---|
| Hero 자동 슬라이드 | 6초 간격으로 강조 콘텐츠 자동 전환, 인디케이터 클릭으로 수동 이동 |
| 햄버거 메뉴 | 모바일에서 햄버거 버튼으로 메뉴 열기/닫기 |
| 예고편 모달 | YouTube 임베드 iframe 팝업, ESC 키 및 배경 클릭으로 닫기 |
| 콘텐츠 상세 모달 | 카드 클릭 시 상세 정보 모달 표시 |
| 내 리스트 담기 | localStorage 기반 상태 저장, 버튼 토글 |
| 추천 탭 필터 | 전체 / 인기 / 애니메이션 / 영화 탭 전환 |
| 추천 슬라이더 | 좌우 버튼으로 가로 스크롤 이동 |
| 헤더 스크롤 효과 | 스크롤 시 반투명 sticky 헤더로 전환 |
| 네비 하이라이트 | 현재 섹션에 맞게 메뉴 항목 활성화 |
| 스크롤 탑 버튼 | 500px 이상 스크롤 시 표시, 클릭 시 최상단 이동 |
| 토스트 알림 | 모든 버튼 클릭에 피드백 메시지 표시 |
| Supabase 연동 | 콘텐츠 데이터를 Supabase REST API로 불러오기 |
| 폴백 처리 | DB 연결 실패 시 더미 데이터로 자동 전환 |

---

## 페이지 구성

1. **Header / Navigation** — 로고, 메뉴, CTA 버튼, 햄버거 메뉴
2. **Hero Section** — 강조 콘텐츠 자동 슬라이드, 시청/예고편/리스트 버튼
3. **Main Contents** — 인기 콘텐츠 카드 그리드 (hover 확대 + 액션)
4. **Detail Introduction** — 대표 콘텐츠 메타정보 상세 소개 + 강조 배너
5. **Recommended Contents** — 탭 필터 + 가로 슬라이더 추천 카드
6. **Pricing** — 요금제 3종 (BASIC / STANDARD / PREMIUM)
7. **Footer** — 서비스 링크, SNS, 저작권

---

## 반응형 기준

| 구간 | 범위 | 레이아웃 |
|---|---|---|
| 데스크톱 | 1200px 이상 | 콘텐츠 카드 4열, Hero 좌우 분할, 충분한 여백 |
| 태블릿 | 768px ~ 1199px | 콘텐츠 카드 2~3열, 간격 축소 |
| 모바일 | 767px 이하 | 콘텐츠 카드 1~2열, 햄버거 메뉴, 세로 레이아웃 |

---

## 기술 스택

- **HTML5** — 시맨틱 마크업
- **CSS3** — CSS 변수, Grid, Flexbox, 반응형, 애니메이션
- **JavaScript (Vanilla)** — Supabase REST API 호출, DOM 조작, 인터랙션
- **Supabase** — PostgreSQL 기반 백엔드 (contents 테이블)
- **Google Fonts** — Noto Sans KR, Bebas Neue

---

## 실행 방법

```bash
# 저장소 클론
git clone https://github.com/gwajeyong325-cell/waveon.git
cd waveon

# 라이브 서버로 실행 (VS Code Live Server 플러그인 권장)
# 또는
npx serve .
```

브라우저에서 `http://localhost:3000` 접속

### GitHub Pages에서 확인
배포된 URL: `https://gwajeyong325-cell.github.io/waveon/`

---

## Supabase DB 구조

| 테이블 | 설명 |
|---|---|
| `contents` | 콘텐츠 정보 (제목, 설명, 장르, 썸네일, 예고편 등) |
| `users` | 사용자 정보 |
| `watchlist` | 내 리스트 |
| `watch_history` | 시청 기록 |
| `recommendations` | 개인화 추천 목록 |
| `reviews` | 리뷰 및 평점 |

---

## 폴더 구조

```
wave_on/
├── index.html          # HTML 구조
├── css/
│   └── style.css       # 모든 스타일
├── js/
│   └── script.js       # 모든 인터랙션 + Supabase 연동
└── README.md
```
