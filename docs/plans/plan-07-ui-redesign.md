# 7단계 UI 전면 개선 작업 계획

## 1. 작업 배경

6단계까지 서비스 핵심 기능(차량 CRUD, Firebase 인증, 역할 관리, 차량 상세 URL, 상담방 생성)이 완성되었다.
현재 UI는 daisyUI를 기반으로 구성되어 있으며, AGENTS.md 지침에 따라 순수 Tailwind CSS 기반의 Modern Car Marketplace 스타일로 전면 개선한다.

참고 자료:

- `docs/실시간_Car_Market_UI_개선_분석_보고서.md` — 화면별 적용 방향 정의
- `docs/images/확장_계획_디자인.png` — 목표 디자인 시안

---

## 2. 현재 UI 상태 요약

| 파일                     | 현재 daisyUI 클래스                                                                                                                  | 개선 방향                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `Header.jsx`             | `navbar`, `btn`, `btn-ghost`, `btn-primary`, `btn-sm`, `btn-outline`                                                                 | 마켓 서비스형 상단 내비게이션으로 재작성                                                         |
| `App.jsx` (목록 렌더링)  | `card`, `card-body`, `input input-bordered`, `btn btn-primary`                                                                       | Hero + 검색 패널 + 카드 그리드로 전환                                                            |
| `CarTable.jsx`           | `table`, `table-zebra`, `badge badge-info`, `btn btn-xs`                                                                             | 일반 사용자용 → 카드 그리드(`CarCardGrid.jsx`)로 분리. 딜러/관리자 테이블은 순수 Tailwind로 유지 |
| `CarDetail.jsx`          | `card`, `card-body`, `card-title`, `badge`, `btn btn-primary`, `btn-outline`, `btn-warning`, `btn-error`                             | 큰 이미지 + 스펙 그리드 + 딜러 CTA 패널                                                          |
| `CarForm.jsx`            | `card`, `card-body`, `form-control`, `label`, `input input-bordered`, `select select-bordered`, `alert alert-error`                  | 섹션 분리 딜러 등록 폼                                                                           |
| `LoginForm.jsx`          | `card`, `card-body`, `card-title`, `alert alert-error`, `form-control`, `input input-bordered`, `btn`                                | 중앙 정렬 인증 카드                                                                              |
| `RegisterForm.jsx`       | `card`, `card-body`, `card-title`, `alert`, `form-control`, `input input-bordered`, `btn`                                            | 역할 선택(buyer/dealer) 카드형 라디오 포함                                                       |
| `DeleteConfirmModal.jsx` | `modal`, `modal-open`, `modal-box`, `modal-action`, `btn`                                                                            | 순수 Tailwind fixed overlay + dialog 패널                                                        |
| `AdminUserPanel.jsx`     | `card`, `card-body`, `alert`, `badge badge-outline`, `table table-zebra`, `btn btn-xs`, `tabs tabs-boxed`, `loading loading-spinner` | 대시보드 요약 카드 + 탭 + 테이블 전체 순수 Tailwind                                              |
| `AlertMessage.jsx`       | 별도 확인 필요                                                                                                                       | 상태 배너 스타일 적용                                                                            |

### 아직 없는 화면 (신규 구현 필요)

| 화면               | 설명                                             |
| ------------------ | ------------------------------------------------ |
| `CarCardGrid.jsx`  | 일반 사용자 차량 목록 — 카드 그리드 형태         |
| `ChatRoomList.jsx` | 상담방 목록 — 차량 썸네일 + 마지막 메시지        |
| `ChatRoom.jsx`     | 실시간 채팅 화면 — Socket.io 연결, 메시지 말풍선 |

> ChatRoomList와 ChatRoom은 이번 UI 개선 범위에 포함하되, Socket.io 실시간 연결 로직은 8단계(Socket.io 실시간 상담)에서 완성한다. 이번 단계에서는 UI 구조와 REST API 기반 이전 메시지 조회까지 구현한다.

---

## 3. 디자인 시안 분석 (확장*계획*디자인.png 기준)

### 3.1 공통 색상 및 타이포그래피 방향

| 항목                       | 값                                                                                        |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| 주요 색상                  | 파란색 계열 (`blue-600` / `#2563eb`)                                                      |
| 강조 텍스트 (가격)         | `blue-600`, `font-bold`, `text-2xl`                                                       |
| 배경                       | 흰색 (`bg-white`), 연한 회색 (`bg-gray-50`)                                               |
| 경계선                     | `border-gray-200`                                                                         |
| 본문 텍스트                | `text-gray-700`                                                                           |
| 보조 텍스트                | `text-gray-400`                                                                           |
| badge (제조사, 연료, 차종) | `inline-flex`, `rounded-full`, `bg-blue-50`, `text-blue-700`, `text-xs`, `px-2`, `py-0.5` |

### 3.2 화면별 레이아웃 설명

#### 메인(목록) 화면 — 데스크톱 기준

```
[Header] CAR MARKET 로고 | 차량검색 상담방 딜러관리 관리자 | 로그인 회원가입

[Hero]
  좌: 내 조건에 맞는 중고차를 찾아보세요 (h1)
      설명 문구
      [검색 패널]
        차량명 입력 | 제조사 select | 최소 가격 select | 최대 가격 select
        최소 연식 select | 최대 연식 select
        [초기화] [검색하기]
  우: 차량 이미지

[추천 매물]
  카드 그리드 (3~4열)
    [차량 이미지 + 회사 badge]
    차량명
    가격 (파란색 강조)
    연식 아이콘 | 주행거리 아이콘 | 지역 아이콘
    연료 badge | 차종 badge
    [상세 보기] [상담하기]
```

#### 차량 상세 화면

```
[Breadcrumb] 홈 > 차량 검색 > 차량 상세

[본문 2열 레이아웃]
  좌 (60%): 큰 차량 이미지 + 썸네일 리스트
  우 (40%): 차량명 | 가격 강조
            제조사 badge | 변속기 badge | 연료 badge
            스펙 그리드 (연식, 주행거리, 변속기, 배기량, 색상)
            차량 설명

  [딜러 정보 카드]
    딜러 이름 | 별점 | 지역
    [딜러와 상담하기] [전화 문의]
```

#### 로그인 화면

```
[중앙 카드]
  Car Market 로고 (상단 중앙)
  이메일 / 비밀번호 입력
  로그인 버튼
  계정이 없으신가요? 회원가입 링크
```

#### 회원가입 화면

```
[중앙 카드]
  회원가입 제목
  이메일 / 비밀번호 / 사용자 이름 입력
  사용자 유형 선택:
    [일반 사용자 (buyer) 아이콘 카드] [딜러 (dealer) 아이콘 카드]
  회원가입 버튼
  이미 계정이 있으신가요? 로그인 링크
```

> 현재 RegisterForm은 role을 `buyer`로 고정한다. 회원가입 시 `buyer`/`dealer` 선택 UI를 추가하되, register 함수에 role을 전달하는 방식은 AuthContext 로직을 유지한다.

#### 차량 등록/수정 폼

```
[카드 영역]
  섹션 1: 기본 정보 — 이름
  섹션 2: 차량 스펙 — 제조사(select), 차종(select), 연식(number)
  섹션 3: 판매 정보 — 가격, 주행거리, 지역
  섹션 4: 사진 업로드 — 파일 선택 + 미리보기
  섹션 5: 상세 설명 — textarea
  [취소] [다음 / 저장]
```

#### 상담방 목록 화면 (ChatRoomList.jsx)

```
[목록 영역]
  상담 검색 입력창
  [상담방 아이템]
    차량 썸네일 | 차량명 + 딜러명 | 마지막 메시지 + 시간
    읽지 않은 메시지 badge (있을 경우)
```

#### 채팅 화면 (ChatRoom.jsx)

```
[상단] 차량명 + 딜러명 + 온라인 상태 표시
[메시지 목록]
  우측 (내 메시지): 파란 말풍선
  좌측 (상대 메시지): 회색 말풍선
[하단] 메시지 입력창 + 전송 버튼
```

#### 관리자 화면

```
[사이드바] 대시보드 | 차량 관리 | 사용자 관리 | 상담 현황 | 설정
[메인 영역]
  요약 카드: 총 차량 | 총 사용자 | 상담 진행 중 | 오늘 가입
  최근 상담 테이블
  사용자 목록 테이블 (탭 전환)
```

---

## 4. 구현 순서

### 작업 단위 분류

| 순서 | 작업                                  | 영향 컴포넌트                        | 비고                                 |
| ---- | ------------------------------------- | ------------------------------------ | ------------------------------------ |
| 1    | 공통 Tailwind 스타일 클래스 패턴 정의 | `style.css`                          | CSS 변수 및 공통 utility 정의        |
| 2    | Header 재작성                         | `Header.jsx`                         | 마켓 서비스형 헤더                   |
| 3    | 차량 카드 그리드 컴포넌트 신규 생성   | `CarCardGrid.jsx`                    | 일반 사용자 목록 전용                |
| 4    | App.jsx 목록 화면 개선                | `App.jsx`                            | Hero + 검색 패널 + CarCardGrid       |
| 5    | CarDetail 재작성                      | `CarDetail.jsx`                      | 이미지 + 스펙 그리드 + 딜러 CTA      |
| 6    | LoginForm 재작성                      | `LoginForm.jsx`                      | 중앙 정렬 인증 카드                  |
| 7    | RegisterForm 재작성                   | `RegisterForm.jsx`                   | 역할 선택 카드형 라디오 추가         |
| 8    | CarForm 재작성                        | `CarForm.jsx`                        | 섹션 분리 딜러 등록 폼               |
| 9    | DeleteConfirmModal 재작성             | `DeleteConfirmModal.jsx`             | 순수 Tailwind 모달                   |
| 10   | AdminUserPanel 재작성                 | `AdminUserPanel.jsx`                 | 사이드바 + 대시보드                  |
| 11   | ChatRoomList 신규 구현                | `ChatRoomList.jsx`                   | 상담방 목록 UI + API 연결            |
| 12   | ChatRoom 신규 구현                    | `ChatRoom.jsx`                       | 채팅 화면 UI + REST 기반 이전 메시지 |
| 13   | daisyUI 설정 제거                     | `tailwind.config.js`, `package.json` | 패키지 제거 후 빌드 확인             |

---

## 5. 영향 범위 및 보존 원칙

### 변경하지 않는 것

| 항목                  | 이유                                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| Firebase 인증 로직    | `AuthContext.jsx` 내부 로직 그대로 유지                                                              |
| Express API 경로      | `/api/cars`, `/api/users`, `/api/chats` 유지                                                         |
| Socket.io 이벤트 이름 | `join-room`, `send-message`, `receive-message`, `leave-room`, `dealer-online`, `dealer-offline` 유지 |
| MongoDB 데이터 구조   | 컬렉션 구조 변경 없음                                                                                |
| React Router 경로     | `/`, `/cars/:id`, `/chats/:roomId`, `/login`, `/register`, `/admin` 유지                             |
| 서버 비즈니스 로직    | `server.js`, `db.js` 내부 로직 변경 없음                                                             |

### RegisterForm role 처리 방식

현재 `RegisterForm`은 register 함수에 `role: "buyer"`를 고정으로 전달한다.
디자인 시안에서 회원가입 시 `buyer`/`dealer` 선택을 요구하므로, RegisterForm의 form state에 `role` 필드를 추가하고 register 함수에 전달하는 방식으로 변경한다.
`AuthContext.jsx`의 register 함수는 이미 role을 파라미터로 받으므로 추가 수정 없이 연결된다.

---

## 6. 신규 백엔드 API 확인

### ChatRoomList에 필요한 API

현재 `POST /api/chats/rooms`(상담방 생성)는 구현되어 있다. 목록 조회를 위해 아래 API가 필요하다.

| 기능           | Method | URL                | 파라미터      | 비고                      |
| -------------- | ------ | ------------------ | ------------- | ------------------------- |
| 내 상담방 목록 | `GET`  | `/api/chats/rooms` | `uid` (query) | 본인 uid 기준 상담방 목록 |

이 API는 `server.js`에 추가한다. 기존 chat_rooms 컬렉션에서 `buyerId` 또는 `dealerId`가 uid와 일치하는 방 목록을 반환한다.

### ChatRoom에 필요한 API

| 기능             | Method | URL                                 | 파라미터        | 비고                                 |
| ---------------- | ------ | ----------------------------------- | --------------- | ------------------------------------ |
| 이전 메시지 조회 | `GET`  | `/api/chats/rooms/:roomId/messages` | `roomId` (path) | messages 컬렉션에서 roomId 기준 조회 |

이 API도 `server.js`에 추가한다.

---

## 7. 반응형 기준

| 구간                      | 레이아웃 변화                                  |
| ------------------------- | ---------------------------------------------- |
| `< 640px` (모바일)        | 헤더 햄버거 메뉴, Hero 1열, 카드 1열, 상세 1열 |
| `640px ~ 1024px` (태블릿) | 카드 2열, 상세 2열 (이미지 위 + 스펙 아래)     |
| `>= 1024px` (데스크톱)    | 카드 3~4열, 상세 2열 (이미지 좌 + 스펙 우)     |

---

## 8. 검증 기준

각 단계 완료 시 아래 항목을 확인한다.

- `npm.cmd --prefix frontend run build` 빌드 오류 없음
- 기존 API 호출 정상 동작 (차량 목록, 검색, 상세, 등록, 수정, 삭제)
- Firebase 로그인/회원가입/로그아웃 동작
- 딜러 신청, 관리자 역할 승인 동작
- 모바일 375px 기준 레이아웃 확인
- daisyUI class가 코드에 남아 있지 않은지 확인

---

## 9. 리스크

| 리스크                                                                    | 대응 방안                                                                                                                            |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| ChatRoom 신규 구현 시 Socket.io 연결이 없으면 메시지 전송이 동작하지 않음 | REST 기반 이전 메시지 조회와 UI 구조만 완성하고, Socket.io 연결은 8단계로 명시                                                       |
| RegisterForm에서 dealer 역할로 가입 시 바로 딜러 권한이 부여될 수 있음    | 회원가입 role이 `dealer`여도 dealerStatus를 `pending`으로 저장해 관리자 승인을 받도록 유지. AuthContext register 함수 동작 확인 필요 |
| daisyUI 제거 후 빌드 오류                                                 | 모든 daisyUI class 교체가 완료된 것을 확인한 뒤 패키지 제거                                                                          |

---

## 10. 작업 이후 문서화

- `docs/steps/step-07-ui-redesign.md` 작성
- `docs/pr/pr-07-ui-redesign.md` 작성
- `docs/progress.md` 갱신
