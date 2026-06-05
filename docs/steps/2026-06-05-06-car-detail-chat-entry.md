# 2026-06-05 6단계 차량 상세와 상담 진입 상세 설명

## 이 문서의 목표

이번 단계에서는 차량 상세 화면을 URL 기반으로 전환하고, 상세 화면에서 상담방을 만들 수 있는 진입 흐름을 추가했다.

이 문서는 다음 내용을 처음 보는 사람이 이해할 수 있게 정리한다.

- 왜 React Router를 도입했는지
- `/cars/:id` 상세 URL이 어떻게 새로고침을 견디는지
- `POST /api/chats/rooms`가 어떤 기준으로 상담방을 만드는지
- `/chats/:roomId` 준비 화면이 7단계 Socket.io 상담과 어떻게 이어지는지

## 한 줄 요약

차량 상세를 `/cars/:id` URL로 직접 열 수 있게 만들고, 로그인한 사용자가 상세 화면의 `딜러와 상담하기` 버튼으로 MongoDB `chat_rooms` 상담방을 생성한 뒤 `/chats/:roomId` 준비 화면으로 이동하도록 했다.

## 작업 전 상태

5단계와 5-1단계까지 진행된 상태에서는 Firebase 로그인, MongoDB 사용자 프로필, 승인된 딜러 권한, 차량 사진 업로드가 구현되어 있었다.
하지만 상세 화면은 React 상태인 `selectedCar`에 의존하고 있어 새로고침이나 URL 공유에 약했다.

| 기능 | 기존 상태 | 한계 |
| --- | --- | --- |
| 차량 상세 | 목록에서 선택한 `selectedCar`로 표시 | 직접 URL 접근 불가 |
| 상세 조회 API | `GET /api/cars/:id` 존재 | 프론트 URL과 직접 연결되지 않음 |
| 라우팅 | React Router 없음 | `/cars/:id`, `/chats/:roomId` 구성 불가 |
| 상담방 | API 없음 | 상담 버튼을 실제 데이터와 연결 불가 |

## 변경한 파일 요약

| 파일 | 변경 이유 |
| --- | --- |
| `server.js` | `/api/chats/rooms` 상담방 생성 API 추가 |
| `frontend/src/main.jsx` | `BrowserRouter` 적용 |
| `frontend/src/App.jsx` | URL 라우팅, 상세 API 재조회, 상담방 생성 후 이동 흐름 추가 |
| `frontend/src/components/CarDetail.jsx` | 딜러 정보 영역과 `딜러와 상담하기` 버튼 추가 |
| `docs/plans/plan-06-car-detail-chat-entry.md` | 사용자 확인 결과 반영 |
| `docs/progress.md` | 6단계 진행 기록 추가 |
| `docs/pr/2026-06-05-06-car-detail-chat-entry-pr.md` | PR 요약 문서 추가 |
| `README.md` | 상세 URL과 상담방 생성 안내 추가 |
| `docs/deploy-guide.md` | 배포 후 확인 항목 보강 |
| `docs/deploy-checklist.md` | 상세/상담 진입 확인 항목 추가 |
| `docs/실시간_Car_Market_향후_개발_계획서.md` | 6단계 상태 보정 |

`react-router-dom` 의존성은 사용자가 직접 아래 명령어로 설치한다.

```bash
npm.cmd --prefix frontend install react-router-dom
```

## 서버 변경 내용

### 1. 상담방 컬렉션 접근

`db.js`에 이미 준비된 `chat_rooms` 컬렉션을 사용하기 위해 `server.js`에 `getChatRoomsCollection()` 함수를 추가했다.

```js
function getChatRoomsCollection() {
  return getCollection("chatRooms");
}
```

### 2. 상담방 생성 API

새 API:

```http
POST /api/chats/rooms
```

요청 예시:

```json
{
  "carId": "mongodb-car-object-id",
  "buyerId": "firebase-user-uid"
}
```

서버는 클라이언트가 보낸 딜러 정보를 믿지 않는다.
`carId`로 차량을 조회하고, 차량 문서에 저장된 `dealerId`, `dealerName`, `name`, `imageUrl`을 사용해 상담방을 만든다.

### 3. 상담방 생성 기준

상담방 ID는 요구사항에 맞춰 아래 조합으로 만든다.

```text
carId_buyerId_dealerId
```

같은 사용자가 같은 차량의 같은 딜러에게 다시 상담을 시작하면 새 문서를 만들지 않고 기존 상담방을 갱신해서 반환한다.

저장 데이터 예시:

```json
{
  "roomId": "carId_buyerId_dealerId",
  "carId": "carId",
  "buyerId": "buyerUid",
  "buyerName": "구매자",
  "dealerId": "dealerUid",
  "dealerName": "딜러",
  "carName": "Sonata Hybrid",
  "imageUrl": "/uploads/sample.jpg",
  "createdAt": "2026-06-05T00:00:00.000Z",
  "updatedAt": "2026-06-05T00:00:00.000Z"
}
```

### 4. 권한과 검증

상담방 생성은 로그인한 모든 사용자에게 열어 둔다.
즉 `buyer`, `dealer`, `admin` 모두 만들 수 있다.

다만 서버는 아래 조건을 검증한다.

| 조건 | 응답 |
| --- | --- |
| `carId` 없음 | `400` |
| `buyerId` 없음 | `400` |
| MongoDB `users`에 사용자 없음 | `404` |
| 차량 없음 | `404` |
| 차량에 `dealerId` 없음 | `400` |
| 요청자 UID와 차량 딜러 UID가 같음 | `400` |

자기 자신과 상담방을 만드는 흐름은 이번 단계에서 차단했다.

## 프론트엔드 변경 내용

### 1. BrowserRouter 적용

`frontend/src/main.jsx`에서 `AuthProvider` 바깥에 `BrowserRouter`를 감쌌다.

이 구조로 `App.jsx` 내부에서 `useNavigate`, `useParams`, `Routes`, `Route`를 사용할 수 있다.

### 2. 라우트 구성

이번 단계에서 연결한 주요 URL은 아래와 같다.

| URL | 화면 |
| --- | --- |
| `/` | 차량 목록, 등록, 수정 흐름 |
| `/cars/:id` | 차량 상세 |
| `/chats/:roomId` | 상담 준비 화면 |
| `/login` | 로그인 |
| `/register` | 회원가입 |
| `/admin` | 관리자 화면 |

차량 등록과 수정은 기존 상태 기반 화면을 유지했다.
목록, 상세, 로그인, 회원가입, 관리자, 상담 준비 화면만 URL과 직접 연결했다.

### 3. 상세 URL 재조회

`/cars/:id` 화면에 들어가면 URL의 `id`로 `GET /api/cars/:id`를 호출한다.

이 방식 때문에 목록에서 상세로 이동한 경우뿐 아니라, 아래 상황도 처리할 수 있다.

```text
1. 상세 화면에서 새로고침
2. /cars/:id URL 직접 입력
3. 다른 사람에게 상세 URL 공유
```

로그인하지 않은 사용자가 상세 URL에 접근하면 로그인 화면으로 이동한다.

### 4. 딜러 정보와 상담 버튼

`CarDetail.jsx`에 담당 딜러 영역을 추가했다.

표시 내용:

```text
담당 딜러
딜러 이름
[딜러와 상담하기]
```

차량에 `dealerId`가 없으면 상담 버튼은 비활성화된다.

### 5. 상담 준비 화면

상담방 생성에 성공하면 `/chats/:roomId`로 이동한다.

이번 단계에서는 실시간 메시지를 아직 구현하지 않으므로, 이 화면은 아래 정보만 표시한다.

```text
상담방 ID
차량명
딜러 이름
상담 요청자
```

7단계에서 이 화면을 Socket.io 채팅 화면으로 확장한다.

## 검증 방법

짧게 끝나는 서버 문법 확인은 진행했다.

```bash
cmd.exe /c node --check server.js
```

결과:

```text
성공
```

사용자가 직접 실행할 명령어:

```bash
npm.cmd --prefix frontend install react-router-dom
npm.cmd --prefix frontend run build
npm.cmd run build
npm.cmd start
```

실제 환경변수 등록 후 확인할 흐름:

```text
1. 로그인한다.
2. 차량 목록에서 상세 버튼을 누른다.
3. /cars/:id URL로 이동되는지 확인한다.
4. 상세 화면에서 새로고침해도 차량 정보가 다시 보이는지 확인한다.
5. 딜러와 상담하기 버튼을 누른다.
6. /chats/:roomId 준비 화면으로 이동하는지 확인한다.
7. MongoDB chat_rooms 컬렉션에 상담방 문서가 저장되는지 확인한다.
8. 차량 딜러 본인이 자기 차량에서 상담하기를 누르면 차단되는지 확인한다.
```

## 이번 단계에서 하지 않은 것

- Socket.io 서버와 클라이언트 연결은 아직 하지 않았다.
- 실시간 메시지 송수신은 아직 하지 않았다.
- `messages` 컬렉션 저장은 아직 하지 않았다.
- 상담방 목록 화면은 아직 만들지 않았다.
- Firebase Admin SDK와 서버 토큰 검증은 도입하지 않았다.
- daisyUI 제거와 차량 목록 카드형 UI 전면 개편은 진행하지 않았다.

## 남은 리스크

- `react-router-dom` 설치 전에는 프론트엔드 빌드가 실패한다.
- 실제 Firebase와 MongoDB 환경변수가 있어야 상담방 생성 실동작을 확인할 수 있다.
- `/chats/:roomId`는 아직 준비 화면이므로 실시간 채팅은 7단계에서 구현해야 한다.

## 다음 단계

1. 사용자가 `react-router-dom`을 설치한다.
2. 프론트엔드 빌드와 루트 빌드를 확인한다.
3. 실제 로그인 상태에서 상세 URL과 상담방 생성을 확인한다.
4. 7단계에서 Socket.io 실시간 상담을 구현한다.
