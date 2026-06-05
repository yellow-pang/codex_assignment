# 6단계 차량 상세와 상담 진입 작업 계획

## 1. 작업 배경

5단계 Firebase 인증과 5-1단계 관리자 역할/딜러 승인으로 로그인 사용자, 승인된 딜러, 차량 등록자 정보를 구분할 수 있게 되었다.

현재 차량 상세 화면은 React 상태의 `selectedCar`를 기준으로 표시된다. 목록에서 상세 버튼을 눌렀을 때는 동작하지만, `/cars/:id` 같은 고유 URL이 없기 때문에 새로고침하거나 상세 링크를 직접 공유하면 상세 정보를 다시 불러올 수 없다.

또한 요구사항의 핵심 흐름인 "차량 상세 화면에서 딜러와 상담하기" 진입 API가 아직 없다. 7단계 Socket.io 실시간 상담 전에, 차량 ID, 구매자 UID, 딜러 UID를 기준으로 상담방을 만들 수 있는 REST API와 프론트엔드 진입 흐름을 먼저 준비한다.

| 현재 기능 | 현재 상태 | 한계 |
| --- | --- | --- |
| 차량 상세 화면 | `selectedCar` 상태 기반 | 새로고침, 직접 URL 접근 불가 |
| 상세 API | `GET /api/cars/:id` 구현됨 | 프론트 상세 URL과 직접 연결되지 않음 |
| 라우팅 | React Router 미도입 | `/cars/:id` URL 사용 불가 |
| 상담방 API | 없음 | 상담 시작 버튼을 실제 데이터와 연결할 수 없음 |
| 상담 화면 | 미구현 | 7단계 Socket.io에서 구현 예정 |

## 2. 작업 목표

- React Router를 도입해 `/cars/:id` 상세 URL을 지원한다.
- 목록의 상세 버튼이 상태 전환이 아니라 상세 URL 이동으로 동작하게 한다.
- `/cars/:id`로 직접 접근하거나 새로고침해도 `GET /api/cars/:id`로 상세 정보를 다시 조회한다.
- 잘못된 차량 ID 또는 없는 차량 ID 접근 시 사용자에게 오류 상태를 보여준다.
- 상세 화면에 딜러 이름과 `딜러와 상담하기` 버튼을 배치한다.
- 로그인한 사용자만 상담방 생성을 요청할 수 있게 한다.
- `POST /api/chats/rooms` API를 추가해 차량 ID, 구매자 UID, 딜러 UID 기준 상담방을 생성하거나 기존 상담방을 재사용한다.
- 상담방 데이터는 MongoDB `chat_rooms` 컬렉션에 저장한다.
- 7단계 Socket.io 채팅 화면으로 자연스럽게 이어질 수 있도록 `roomId` 응답 구조를 정리한다.

## 3. 백엔드 구현 계획

### 3.1 상담 라우터 추가

`server.js`에 `/api/chats` 라우터를 추가한다.

이번 단계에서 우선 구현할 API:

| 기능 | Method | URL | 설명 |
| --- | --- | --- | --- |
| 상담방 생성 또는 재사용 | `POST` | `/api/chats/rooms` | 차량, 구매자, 딜러 기준 상담방 생성 |

요청 예시:

```json
{
  "carId": "mongodb-car-object-id",
  "buyerId": "firebase-buyer-uid"
}
```

서버는 `carId`로 차량을 조회해 차량에 저장된 `dealerId`, `dealerName`, 차량명을 상담방에 함께 저장한다. 클라이언트가 보낸 딜러 정보는 신뢰하지 않는다.

### 3.2 상담방 생성 기준

상담방은 요구사항 기준대로 차량 ID, 구매자 UID, 딜러 UID 조합으로 만든다.

권장 `roomId` 형식:

```text
carId_buyerId_dealerId
```

저장 예시:

```json
{
  "roomId": "carId_buyerId_dealerId",
  "carId": "mongodb-car-object-id",
  "buyerId": "firebase-buyer-uid",
  "dealerId": "firebase-dealer-uid",
  "carName": "Sonata Hybrid",
  "dealerName": "김딜러",
  "createdAt": "2026-06-05T00:00:00.000Z",
  "updatedAt": "2026-06-05T00:00:00.000Z"
}
```

같은 구매자가 같은 차량의 같은 딜러에게 다시 상담을 시작하면 새 상담방을 중복 생성하지 않고 기존 상담방을 반환한다.

### 3.3 입력 검증과 권한 기준

기본 검증:

| 항목 | 처리 |
| --- | --- |
| `carId` 없음 | `400` |
| `buyerId` 없음 | `400` |
| 차량 없음 | `404` |
| 차량에 `dealerId` 없음 | `400` |
| 구매자 UID와 딜러 UID가 같음 | `400` 또는 사용자 확인 후 허용 여부 결정 |

현재 프로젝트는 Firebase Admin SDK로 ID 토큰을 검증하지 않는다. 이번 단계도 기존 인증 정책과 동일하게 클라이언트가 전달한 Firebase UID를 MongoDB `users` 컬렉션에서 조회해 사용자 존재 여부를 확인한다.

구매자 기준은 우선 로그인된 MongoDB 사용자라면 허용하는 방향을 제안한다. 즉 `buyer`, `dealer`, `admin` 모두 차량 상담방 생성 자체는 가능하게 할 수 있다. 다만 본인 차량에 자기 자신으로 상담방을 만드는 흐름은 막는 편이 자연스럽다.

### 3.4 상담방 컬렉션 접근 함수

`db.js`는 이미 `chat_rooms` 컬렉션을 준비하는 구조이므로, `server.js`에서 아래와 같은 접근 함수를 추가한다.

```js
function getChatRoomsCollection() {
  return getCollection("chat_rooms");
}
```

## 4. 프론트엔드 구현 계획

### 4.1 React Router 도입

프론트엔드에 `react-router-dom`을 추가한다.

예상 명령:

```bash
npm.cmd --prefix frontend install react-router-dom
```

네트워크 설치가 필요하다. 샌드박스 네트워크 제한으로 실패하면 사용자 승인 요청 후 다시 진행한다.

라우팅 초안:

| URL | 화면 |
| --- | --- |
| `/` | 차량 목록 |
| `/cars/:id` | 차량 상세 |
| `/login` | 로그인 |
| `/register` | 회원가입 |
| `/admin` | 관리자 화면 |

현재 `currentView` 기반 구조를 한 번에 대규모로 갈아엎지 않고, 필요한 범위부터 URL과 연결한다. 목록, 상세, 로그인, 회원가입, 관리자 화면을 우선 라우트로 매핑하고, 차량 등록/수정은 기존 상태 기반 흐름을 유지할 수 있다.

### 4.2 상세 화면 데이터 조회

`/cars/:id` 화면에서는 URL 파라미터의 `id`를 읽어 `GET /api/cars/:id`를 호출한다.

처리 상태:

| 상태 | 화면 처리 |
| --- | --- |
| 로딩 중 | 로딩 표시 |
| 조회 성공 | 차량 상세 출력 |
| `404` | 차량을 찾을 수 없음 안내 |
| 기타 오류 | 오류 메시지 표시 후 목록 이동 버튼 제공 |

목록에서 이미 차량 데이터를 가지고 있더라도, 상세 URL의 기준 데이터는 API 응답으로 삼는다. 이렇게 해야 새로고침과 직접 접근이 안정적으로 동작한다.

### 4.3 상세 화면 CTA 추가

`CarDetail.jsx`에 딜러 정보 영역과 `딜러와 상담하기` 버튼을 추가한다.

표시 정보:

| 항목 | 데이터 |
| --- | --- |
| 딜러 이름 | `car.dealerName` |
| 딜러 UID | 화면에는 노출하지 않음 |
| 상담 버튼 | 로그인 사용자에게만 실제 요청 허용 |

비로그인 사용자가 상담 버튼을 누르면 로그인 화면으로 이동하고 안내 메시지를 표시한다.

### 4.4 상담방 생성 흐름

상담 버튼 클릭 시 프론트엔드는 아래 요청을 보낸다.

```http
POST /api/chats/rooms
Content-Type: application/json
```

```json
{
  "carId": "car._id",
  "buyerId": "userProfile.uid"
}
```

성공 응답 예시:

```json
{
  "roomId": "carId_buyerId_dealerId",
  "carId": "carId",
  "buyerId": "buyerUid",
  "dealerId": "dealerUid",
  "carName": "Sonata Hybrid",
  "dealerName": "김딜러"
}
```

이번 6단계에서는 상담방 생성까지만 실제 데이터로 연결한다. 상담 화면과 메시지 송수신은 7단계 Socket.io에서 구현한다.

상담방 생성 후 화면 전환은 사용자 확인 후 아래 중 하나로 정한다.

| 선택지 | 설명 |
| --- | --- |
| A안 | 상담방 생성 성공 메시지만 표시하고 상세 화면에 머문다. |
| B안 | `/chats/:roomId` 경로로 이동하되, 7단계 전까지는 기본 상담 준비 화면만 표시한다. |

7단계 연결성을 고려하면 B안을 권장한다.

## 5. 예상 변경 파일

구현 승인 후 예상 변경 파일은 다음과 같다.

| 파일 | 변경 내용 |
| --- | --- |
| `server.js` | `/api/chats/rooms` API, 상담방 생성 로직 추가 |
| `frontend/package.json` | `react-router-dom` 의존성 추가 |
| `frontend/package-lock.json` | 의존성 lockfile 갱신 |
| `frontend/src/main.jsx` | Router Provider 또는 BrowserRouter 적용 |
| `frontend/src/App.jsx` | URL 라우팅 기반 화면 연결, 상세 조회 흐름 조정 |
| `frontend/src/components/CarDetail.jsx` | 딜러 정보와 상담 CTA 추가 |
| `frontend/src/components/CarTable.jsx` | 상세 버튼을 `/cars/:id` 이동 흐름으로 연결 |
| `docs/progress.md` | 6단계 작업 기록 추가 |
| `docs/steps/2026-06-05-06-car-detail-chat-entry.md` | 구현 상세 문서 추가 |
| `docs/pr/2026-06-05-06-car-detail-chat-entry-pr.md` | PR 요약 문서 추가 |
| `docs/실시간_Car_Market_향후_개발_계획서.md` | 6단계 완료 상태 보정 |

필요 시 `README.md`, `docs/deploy-guide.md`, `docs/deploy-checklist.md`에는 상담방 생성 API와 배포 후 확인 항목을 최소 범위로 보강한다.

## 6. 검증 계획

가능한 범위에서 아래 검증을 진행한다.

| 검증 항목 | 명령 또는 방법 |
| --- | --- |
| 서버 문법 확인 | `node --check server.js` |
| 프론트엔드 빌드 | `npm.cmd --prefix frontend run build` |
| 루트 빌드 | `npm.cmd run build` |
| 상세 URL 확인 | `/cars/:id` 직접 접근 후 상세 조회 확인 |
| 새로고침 확인 | 상세 화면에서 새로고침 후 데이터 유지 확인 |
| 잘못된 ID 확인 | 없는 차량 ID 접근 시 오류 안내 확인 |
| 상담방 생성 API | `POST /api/chats/rooms` 응답과 MongoDB `chat_rooms` 저장 확인 |

실제 MongoDB Atlas와 Firebase 환경변수가 필요하므로, 로컬 `.env` 값이 유효하지 않거나 서버 실행이 제한되면 문법 확인과 빌드까지 진행하고 남은 실동작 검증 항목을 별도로 보고한다.

## 7. 이번 단계에서 하지 않을 일

- Socket.io 서버와 클라이언트 연결은 7단계에서 진행한다.
- 실시간 메시지 송수신과 `messages` 컬렉션 저장은 7단계에서 진행한다.
- AI Agent 응답 구조는 8단계에서 진행한다.
- Firebase Admin SDK와 서버 토큰 검증은 이번 단계에 도입하지 않는다.
- Render Web Service 단일 배포 구조는 변경하지 않는다.
- 차량 목록 카드형 UI 전면 개편과 daisyUI 제거는 별도 UI 단계에서 진행한다.
- 외부 이미지 스토리지나 외부 AI API는 도입하지 않는다.

## 8. 사용자 확인 필요 사항

아래 방향으로 사용자 확인이 완료되었다.

1. `react-router-dom` 의존성 추가는 필요하지만, 권한 문제를 피하기 위해 사용자가 직접 아래 명령어를 실행한다.

```bash
npm.cmd --prefix frontend install react-router-dom
```

2. 상담방 생성 후에는 B안으로 진행한다. 즉 `/chats/:roomId`로 이동하고, 7단계 전까지는 기본 상담 준비 화면을 표시한다.
3. 상담방 생성 권한은 로그인한 모든 사용자에게 열어 둔다. `buyer`, `dealer`, `admin` 모두 상담방을 만들 수 있다.
4. 다만 자기 자신과 상담방을 만드는 흐름은 서버에서 차단한다.
5. 추적이 쉽도록 `progress`, `steps`, `pr`, 향후 개발 계획서, README, 배포 가이드, 배포 체크리스트를 함께 갱신한다.
6. 2분 이상 걸릴 수 있는 빌드와 서버 실행, 권한 문제로 실행이 어려운 명령은 사용자가 직접 실행한다.
