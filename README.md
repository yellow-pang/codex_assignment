# 실시간 Car Market

React + Vite 프론트엔드와 Node.js + Express 백엔드로 구성한 실시간 Car Market 과제 프로젝트입니다.
차량 데이터는 MongoDB Atlas에 저장하고, Render Web Service 단일 배포 구조를 기준으로 개발합니다.

## 실행 방법

서버 실행:

```bash
npm install
npm start
```

React 프론트엔드 개발 서버 실행:

```bash
cd frontend
npm install
npm run dev
```

React 코드는 `/api/*` 상대 경로로 요청하고, Vite 개발 서버에서는 프록시가 Express 서버로 요청을 전달합니다.

6단계 차량 상세 URL 기능부터는 React Router가 필요합니다. 권한 문제로 의존성 설치를 직접 진행할 때는 루트 폴더에서 아래 명령어를 실행합니다.

```bash
npm.cmd --prefix frontend install react-router-dom
```

## 환경 변수

루트 `.env` 또는 Render Environment에 MongoDB와 Firebase 값을 등록합니다.

```text
MONGODB_URI=MongoDB Atlas 접속 문자열
DB_NAME=car_market
COLLECTION_CARS=cars
COLLECTION_USERS=users
COLLECTION_CHAT_ROOMS=chat_rooms
COLLECTION_MESSAGES=messages
INITIAL_ADMIN_EMAILS=admin@example.com
VITE_FIREBASE_API_KEY=Firebase Web API key
VITE_FIREBASE_AUTH_DOMAIN=프로젝트ID.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=Firebase 프로젝트 ID
VITE_FIREBASE_APP_ID=Firebase 웹 앱 ID
VITE_API_BASE_URL=별도 API 서버 주소가 필요할 때만 입력
```

Firebase 콘솔에서는 Authentication의 이메일/비밀번호 제공자를 활성화해야 합니다.

## 인증과 권한

- 회원가입과 로그인은 Firebase Authentication을 사용합니다.
- 회원가입한 사용자는 기본적으로 `buyer`로 생성됩니다.
- 추가 사용자 정보는 MongoDB `users` 컬렉션에 저장합니다.
- 차량 목록은 비로그인 사용자도 볼 수 있습니다.
- 차량 상세, 등록, 수정, 삭제는 로그인 후 사용할 수 있습니다.
- 차량 상세는 `/cars/:id` URL로 접근하며, 새로고침해도 `GET /api/cars/:id`로 상세 정보를 다시 조회합니다.
- 딜러 권한은 일반 사용자가 신청하고 admin이 승인합니다.
- 차량 등록은 승인된 딜러만 가능하고, 수정과 삭제는 차량을 등록한 딜러 본인만 가능합니다.
- 최초 admin 계정은 `INITIAL_ADMIN_EMAILS`에 등록한 이메일로 회원가입하면 자동 지정됩니다.
- MongoDB 사용자 프로필 저장이 실패하면 방금 생성한 Firebase 계정 삭제 보정을 시도합니다.
- 차량 상세 화면의 `딜러와 상담하기` 버튼은 `POST /api/chats/rooms`로 상담방을 만들고 `/chats/:roomId` 준비 화면으로 이동합니다.
- 자기 자신과 상담방을 만드는 요청은 서버에서 차단합니다.
- `/chats/:roomId`에서는 Socket.io로 메시지를 전송하고, 서버는 MongoDB `messages` 컬렉션에 저장한 뒤 같은 상담방에 실시간으로 전달합니다.
- 딜러 온라인 상태는 MongoDB `users` 문서의 `dealerOnline`, `dealerSocketIds`, `dealerConnectedAt`, `dealerLastSeenAt` 필드로 관리합니다.
- 서버 재시작 시 이전 Socket.io 연결은 유효하지 않으므로 시작 과정에서 딜러 온라인 상태를 오프라인으로 정리합니다.
- AI Agent는 아직 실제 외부 API와 연결하지 않습니다. 서버는 이후 확장을 위해 상담방, 차량 정보, 최근 메시지, 사용자 질문, 딜러 온라인 상태를 묶는 context 구조와 `generateAgentReply` placeholder만 준비합니다.

## 자동차 API 사용 예시

전체 자동차 목록 조회:

```bash
curl http://localhost:3000/api/cars
```

복합 검색:

```bash
curl "http://localhost:3000/api/cars/search?keyword=sonata&company=HYUNDAI&minPrice=1000&maxPrice=3000&minYear=2020"
```

차량 등록과 사진 업로드:

```bash
curl -X POST http://localhost:3000/api/cars \
  -F "name=Sonata Hybrid" \
  -F "company=HYUNDAI" \
  -F "year=2023" \
  -F "price=2800" \
  -F "type=sedan" \
  -F "fuel=hybrid" \
  -F "mileage=35000" \
  -F "location=서울" \
  -F "description=출퇴근용으로 적합한 하이브리드 세단" \
  -F "dealerId=Firebase 딜러 UID" \
  -F "image=@./sample-car.jpg"
```

사진 없이도 차량 등록은 가능합니다. 사진이 없는 차량은 `/uploads/default-car.png`를 기본 이미지 경로로 사용합니다.
기본 이미지를 사용하려면 `uploads/default-car.png` 위치에 이미지 파일을 추가하면 됩니다.

상담방 생성:

```bash
curl -X POST http://localhost:3000/api/chats/rooms \
  -H "Content-Type: application/json" \
  -d "{\"carId\":\"차량 ObjectId\",\"buyerId\":\"Firebase 사용자 UID\"}"
```

상담방 상세과 이전 메시지 조회:

```bash
curl http://localhost:3000/api/chats/rooms/상담방ID
curl http://localhost:3000/api/chats/rooms/상담방ID/messages
```

실시간 메시지 송수신은 브라우저의 `/chats/:roomId` 화면에서 Socket.io 이벤트 `join-room`, `send-message`, `receive-message`, `leave-room`, `dealer-online`, `dealer-offline`으로 동작합니다.

AI Agent 확장 준비:

- `handleChatMessage`는 사용자 메시지를 저장한 뒤 AI Agent가 참고할 상담 context를 만들 수 있는 구조를 갖습니다.
- context에는 차량 정보, 최근 상담 메시지 20개, 사용자 질문, 딜러 온라인 상태만 포함합니다.
- `generateAgentReply`는 현재 `null`을 반환하므로 기존 상담 동작을 바꾸지 않습니다.
- 이후 실제 AI API를 붙일 때는 `generateAgentReply` 내부를 교체하고, 응답 저장/전송 흐름을 활성화하면 됩니다.

## 사진 업로드 주의사항

- 차량 사진은 `multer`로 처리하고 서버의 `uploads/` 폴더에 저장합니다.
- 허용 형식은 `jpg`, `jpeg`, `png`, `webp`입니다.
- 파일 크기는 최대 5MB입니다.
- Render 무료 환경에서는 서버 파일 시스템에 저장된 업로드 파일이 재배포 또는 인스턴스 재시작 후 유지되지 않을 수 있습니다.
- 장기 운영이 필요하면 S3, Cloudinary 같은 외부 이미지 스토리지 도입을 검토해야 합니다.

## 빌드

```bash
npm run build
```
