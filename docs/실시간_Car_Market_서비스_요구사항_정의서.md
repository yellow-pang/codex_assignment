# 실시간 Car Market 서비스 요구사항 정의서

## 참고자료:

실시간*Car_Market*서비스*요구사항*정의서.pdf

실시간*Car_Market*서비스*바이브코딩*활용\_매뉴얼.pdf

AI및클라우드활용*주말과제*프롬프트.txt

---

## 1. 프로젝트 개요

### 1.1 프로젝트명

실시간 Car Market 서비스

### 1.2 프로젝트 목적

기존 Car Manager CRUD 앱을 확장하여, 사용자가 중고차 매물을 검색하고 딜러와 실시간 상담할 수 있는 웹 서비스를 구현한다.

자동차 데이터는 MongoDB Atlas에 저장하고, 회원 가입과 로그인은 Firebase Authentication을 사용한다. 차량 등록, 검색, 상세 조회, 사진 업로드, 실시간 상담 기능을 구현한 뒤 Render 클라우드에 배포한다.

### 1.3 핵심 시나리오

사용자는 회원 가입 후 로그인한다.

로그인한 사용자는 등록된 차량 목록을 조회하고, 가격 범위, 제조사, 차량명, 연식 조건으로 원하는 차량을 검색한다.

차량 상세 화면에서는 차량 사진과 상세 정보를 확인하고, 딜러와 실시간 상담을 시작할 수 있다.

딜러 또는 관리자는 차량 정보를 등록하고 수정할 수 있으며, 등록된 차량 데이터는 MongoDB Atlas에 저장된다.

실시간 상담 기능은 Socket.io로 구현하되, 이후 AI Agent가 상담을 보조하거나 자동 응답할 수 있도록 구조를 분리한다.

---

## 2. 사용자 유형

### 2.1 일반 사용자

일반 사용자는 차량을 검색하고 상세 정보를 확인하며, 관심 차량에 대해 딜러와 실시간 상담할 수 있다.

### 2.2 딜러

딜러는 차량을 등록하고, 사용자가 보낸 상담 메시지에 실시간으로 응답할 수 있다.

### 2.3 관리자

관리자는 전체 차량 목록과 상담 현황을 확인할 수 있다. 이번 과제에서는 관리자 기능을 필수로 구현하지 않아도 되며, 딜러 기능으로 대체할 수 있다.

---

## 3. 기술 요구사항

| 구분           | 사용 기술                             |
| -------------- | ------------------------------------- |
| 개발 환경      | GitHub Codespaces                     |
| Frontend       | React, Vite                           |
| Styling        | Tailwind CSS                          |
| Backend        | Node.js, Express                      |
| Database       | MongoDB Atlas                         |
| DB 연동        | MongoDB Client                        |
| Authentication | Firebase Authentication               |
| Realtime       | Socket.io                             |
| Image Upload   | Multer                                |
| Deploy         | Render                                |
| API Test       | curl, Thunder Client, Postman 중 선택 |

---

## 4. 회원 인증 요구사항

### 4.1 Firebase Authentication 사용

회원 가입과 로그인은 Firebase Authentication을 사용한다.

### 4.2 회원 가입

사용자는 이메일과 비밀번호로 회원 가입할 수 있어야 한다.

필수 입력값은 다음과 같다.

| 항목        | 설명                                     |
| ----------- | ---------------------------------------- |
| 이메일      | 로그인 ID로 사용                         |
| 비밀번호    | Firebase Authentication 기준에 맞게 입력 |
| 사용자 이름 | 화면 표시용 이름                         |
| 사용자 유형 | 일반 사용자 또는 딜러                    |

### 4.3 로그인

로그인한 사용자만 차량 상세 조회, 상담 요청, 차량 등록 기능을 사용할 수 있다.

### 4.4 인증 상태 유지

새로고침 후에도 로그인 상태가 유지되어야 한다. React에서는 Firebase의 인증 상태 변경 감지 기능을 사용한다.

### 4.5 사용자 정보 저장

Firebase Authentication은 인증을 담당하고, 추가 사용자 정보는 MongoDB Atlas에 저장한다.

예시 데이터:

```json
{
  "uid": "firebase-user-uid",
  "email": "user@test.com",
  "displayName": "홍길동",
  "role": "buyer",
  "createdAt": "2026-06-04T10:00:00.000Z"
}
```

---

## 5. 차량 데이터 요구사항

### 5.1 차량 데이터 저장

차량 정보는 MongoDB Atlas의 `cars` 컬렉션에 저장한다.

### 5.2 차량 데이터 구조

```json
{
  "name": "Sonata Hybrid",
  "company": "HYUNDAI",
  "price": 2800,
  "year": 2023,
  "type": "sedan",
  "fuel": "hybrid",
  "mileage": 35000,
  "location": "서울",
  "description": "출퇴근용으로 적합한 하이브리드 세단",
  "imageUrl": "/uploads/sonata.jpg",
  "dealerId": "firebase-user-uid",
  "dealerName": "김딜러",
  "createdAt": "2026-06-04T10:00:00.000Z",
  "updatedAt": "2026-06-04T10:00:00.000Z"
}
```

---

## 6. 차량 등록 요구사항

### 6.1 차량 등록

딜러는 로그인 후 차량을 등록할 수 있다.

필수 입력값은 다음과 같다.

| 항목      | 설명                          |
| --------- | ----------------------------- |
| 차량명    | 예: Sonata Hybrid             |
| 제조사    | 예: HYUNDAI                   |
| 가격      | 만원 단위                     |
| 연식      | 예: 2023                      |
| 차종      | sedan, SUV, compact 등        |
| 연료      | gasoline, hybrid, electric 등 |
| 주행거리  | km 단위                       |
| 지역      | 예: 서울, 경기, 부산          |
| 설명      | 차량 특징                     |
| 차량 사진 | 1장 이상                      |

### 6.2 사진 업로드

차량 사진은 `multer`를 사용해 업로드한다. MongoDB에는 이미지 파일 자체가 아니라 이미지 경로 또는 URL을 저장한다.

기본 방식은 Express 서버의 `/uploads` 폴더에 저장하는 방식으로 한다. 단, Render 무료 환경에서는 업로드 파일이 영구 보관되지 않을 수 있으므로 README에 해당 내용을 명시한다.

---

## 7. 차량 검색 요구사항

차량 검색은 단순 검색창 하나로 끝내지 않고, 조건별 검색으로 나눈다.

### 7.1 가격 범위별 검색

사용자는 최소 가격과 최대 가격을 입력하여 차량을 검색할 수 있다.

예시:

```
최소 가격: 1000
최대 가격: 3000
```

API 예시:

```
GET /api/cars/search?minPrice=1000&maxPrice=3000
```

### 7.2 제조사별 검색

사용자는 제조사를 선택하여 차량을 검색할 수 있다.

예시:

```
HYUNDAI
KIA
BMW
BENZ
```

API 예시:

```
GET /api/cars/search?company=HYUNDAI
```

### 7.3 차량명 검색

사용자는 차량명 일부를 입력하여 검색할 수 있다.

예시:

```
Sonata
Tucson
K5
```

API 예시:

```
GET /api/cars/search?keyword=Sonata
```

### 7.4 연식 검색

사용자는 특정 연식 또는 연식 범위로 검색할 수 있다.

예시:

```
2020년 이상
2022년부터 2024년까지
```

API 예시:

```
GET /api/cars/search?minYear=2020&maxYear=2024
```

### 7.5 복합 검색

가격, 제조사, 차량명, 연식 조건은 함께 사용할 수 있어야 한다.

예시:

```
GET /api/cars/search?company=HYUNDAI&minPrice=1000&maxPrice=3000&minYear=2020
```

---

## 8. 차량 목록 및 상세 화면 요구사항

### 8.1 차량 목록 화면

차량 목록은 카드 형태로 출력한다. 차량 카드에는 다음 정보를 표시한다.

```
차량 사진
차량명
제조사
가격
연식
주행거리
지역
[상세 보기] [상담하기]
```

### 8.2 차량 상세 화면

차량 상세 화면에는 다음 정보를 표시한다.

```
차량 사진
차량명
제조사
가격
연식
차종
연료
주행거리
지역
차량 설명
딜러 이름
[딜러와 상담하기]
```

---

## 9. 실시간 상담 요구사항

### 9.1 Socket.io 기반 상담

사용자는 차량 상세 화면에서 딜러와 실시간 상담을 시작할 수 있다.

### 9.2 상담방 생성 기준

상담방은 사용자 ID, 딜러 ID, 차량 ID를 기준으로 생성한다. 상담방 데이터 예시:

```json
{
  "roomId": "carId_buyerId_dealerId",
  "carId": "mongodb-car-object-id",
  "buyerId": "firebase-buyer-uid",
  "dealerId": "firebase-dealer-uid",
  "createdAt": "2026-06-04T10:00:00.000Z"
}
```

### 9.3 메시지 데이터 저장

상담 메시지는 MongoDB Atlas의 `messages` 컬렉션에 저장한다.

```json
{
  "roomId": "carId_buyerId_dealerId",
  "senderId": "firebase-user-uid",
  "senderRole": "buyer",
  "message": "이 차량 아직 판매 중인가요?",
  "createdAt": "2026-06-04T10:00:00.000Z"
}
```

### 9.4 실시간 이벤트

Socket.io 이벤트는 다음 이름을 사용한다.

| 이벤트명          | 설명                  |
| ----------------- | --------------------- |
| `join-room`       | 상담방 입장           |
| `send-message`    | 메시지 전송           |
| `receive-message` | 메시지 수신           |
| `leave-room`      | 상담방 나가기         |
| `dealer-online`   | 딜러 접속 상태 알림   |
| `dealer-offline`  | 딜러 미접속 상태 알림 |

### 9.5 상담 화면

상담 화면에는 다음 요소가 있어야 한다.

```
차량명
딜러 이름
상담 메시지 목록
메시지 입력창
[전송] 버튼
```

사용자가 메시지를 보내면 화면에 즉시 표시되고, 상대방 화면에도 실시간으로 표시되어야 한다.

---

## 10. AI Agent 확장 준비 요구사항

이번 과제에서 AI Agent를 직접 구현하지는 않는다. 다만 상담 기능은 나중에 AI Agent로 확장할 수 있도록 구조를 분리한다.

### 10.1 상담 응답 처리 함수 분리

메시지를 처리하는 로직은 별도 함수로 분리한다.

```jsx
async function handleDealerResponse({ roomId, message, user, car }) {
  // 현재는 딜러에게 메시지 전달
  // 이후 AI Agent 자동 응답으로 확장 가능
}
```

### 10.2 AI Agent 확장 시나리오

향후 확장 방향은 다음과 같다.

```
1. 사용자가 차량에 대해 질문한다.
2. 서버는 차량 정보와 상담 메시지를 함께 확인한다.
3. 딜러가 온라인이면 딜러에게 메시지를 전달한다.
4. 딜러가 오프라인이면 AI Agent가 기본 답변을 생성한다.
5. AI Agent 답변은 상담방에 메시지로 저장된다.
```

### 10.3 LLM 연동 대비 데이터

AI Agent가 사용할 수 있도록 차량 데이터와 상담 메시지 데이터는 명확하게 저장한다.

AI Agent가 참고할 데이터는 다음과 같다.

```
차량명
제조사
가격
연식
주행거리
지역
차량 설명
이전 상담 메시지
사용자 질문
```

---

## 11. Backend API 요구사항

### 11.1 차량 API

| 기능           | Method | URL                |
| -------------- | ------ | ------------------ |
| 차량 목록 조회 | GET    | `/api/cars`        |
| 차량 상세 조회 | GET    | `/api/cars/:id`    |
| 차량 등록      | POST   | `/api/cars`        |
| 차량 수정      | PUT    | `/api/cars/:id`    |
| 차량 삭제      | DELETE | `/api/cars/:id`    |
| 차량 검색      | GET    | `/api/cars/search` |

### 11.2 사용자 API

| 기능             | Method | URL                  |
| ---------------- | ------ | -------------------- |
| 사용자 정보 저장 | POST   | `/api/users`         |
| 내 정보 조회     | GET    | `/api/users/me`      |
| 딜러 목록 조회   | GET    | `/api/users/dealers` |

### 11.3 상담 API

| 기능             | Method | URL                                 |
| ---------------- | ------ | ----------------------------------- |
| 상담방 생성      | POST   | `/api/chats/rooms`                  |
| 내 상담방 목록   | GET    | `/api/chats/rooms`                  |
| 상담 메시지 조회 | GET    | `/api/chats/rooms/:roomId/messages` |
| 메시지 저장      | POST   | `/api/chats/rooms/:roomId/messages` |

---

## 12. Frontend 화면 요구사항

### 12.1 로그인 화면

Firebase Authentication을 사용하여 이메일과 비밀번호로 로그인한다.

### 12.2 회원 가입 화면

회원 가입 시 사용자 유형을 선택한다.

```
일반 사용자
딜러
```

### 12.3 차량 목록 화면

검색 조건 영역과 차량 카드 목록을 함께 보여준다. 검색 조건은 다음과 같이 구분한다.

```
차량명 검색
제조사 선택
최소 가격
최대 가격
최소 연식
최대 연식
[검색] [초기화]
```

### 12.4 차량 등록 화면

딜러만 접근할 수 있다. 차량 정보와 사진을 입력해 등록한다.

### 12.5 차량 상세 화면

차량 상세 정보와 상담 버튼을 제공한다.

### 12.6 상담 화면

Socket.io를 사용한 실시간 채팅 화면을 구현한다.

---

## 13. Render 배포 요구사항

### 13.1 Backend 배포

Express 서버는 Render Web Service로 배포한다. Render 환경 변수에는 다음 값을 등록한다.

```
MONGODB_URI=MongoDB Atlas 접속 문자열
DB_NAME=car_market
COLLECTION_CARS=cars
COLLECTION_USERS=users
COLLECTION_MESSAGES=messages
NODE_ENV=production
CLIENT_URL=React 배포 주소
```

### 13.2 Frontend 배포

React 앱은 Render Static Site로 배포한다. React에서는 API 서버 주소를 환경 변수로 관리한다.

```
VITE_API_BASE_URL=https://본인-api서버.onrender.com
```

### 13.3 Socket.io 배포

Render에 배포된 Express 서버에서 Socket.io도 함께 실행한다. 클라이언트에서는 로컬 주소가 아니라 Render 서버 주소로 Socket.io에 연결한다.

```jsx
const socket = io(import.meta.env.VITE_API_BASE_URL);
```

---

## 14. 제출물

제출물은 다음 네 가지로 한다.

```
1. GitHub 저장소 주소
2. Render 배포 주소
3. 실행 화면 캡처
   - 로그인 또는 회원 가입 화면
   - 차량 검색 화면
   - 차량 상세 화면
   - 실시간 상담 화면
4. README.md
```

README에는 다음 내용을 포함한다.

```
프로젝트 소개
주요 기능
실행 방법
MongoDB Atlas 설정 방법
Firebase Authentication 설정 방법
Socket.io 이벤트 목록
Render 배포 주소
AI Agent 확장 아이디어
```

---

## 15. 최종 구현 범위

이번 주말 과제에서 반드시 완성할 범위는 다음과 같다.

```
1. Firebase 회원 가입 및 로그인
2. MongoDB Atlas 차량 데이터 저장
3. 가격, 제조사, 차량명, 연식 검색
4. 차량 사진 업로드 및 목록 출력
5. 차량 상세 화면
6. Socket.io 기반 딜러 상담
7. Render 배포
8. AI Agent 확장을 고려한 상담 구조 정리
```

이번 과제는 기존 Car Manager를 다시 만드는 작업이 아니다. 기존 자동차 관리 앱을 실제 서비스에 가까운 구조로 확장하는 것이 목표다.

---

# 와이어 프레임

!ChatGPT Image 2026년 6월 4일 오후 09_57_35.png

---

# 바이브 코딩 활용 매뉴얼: 실시간 Car Market 서비스

## 1. 이 과제의 진행 방식

이번 과제는 처음부터 모든 코드를 직접 외워서 작성하는 과제가 아니다. 수강생은 요구사항을 이해하고, AI에게 작업 단위를 나누어 요청하면서 결과물을 완성한다. 단, AI가 만든 코드를 그대로 믿으면 안 된다. AI는 코드를 빠르게 만들어 주는 도구이고, 최종 확인은 개발자가 해야 한다.

이번 과제의 목표는 다음과 같다.

```
Firebase 회원 인증
MongoDB Atlas 차량 데이터 저장
차량 검색
사진 업로드
Socket.io 실시간 상담
Render 배포
AI Agent 확장 준비
```

---

## 2. 작업 순서

이번 과제는 아래 순서로 진행한다.

```
1단계. 프로젝트 구조 확인
2단계. Firebase 회원 가입과 로그인 구현
3단계. MongoDB Atlas 연동
4단계. 차량 등록과 사진 업로드 구현
5단계. 차량 검색 기능 구현
6단계. 차량 상세 화면 구현
7단계. Socket.io 실시간 상담 구현
8단계. AI Agent 확장 구조 정리
9단계. Render 배포
10단계. README 정리
```

한 번에 전체 기능을 요청하지 않는다. AI에게는 반드시 작은 단위로 나누어 요청한다.

---

## 3. AI에게 요청하기 전 준비할 내용

AI에게 바로 “전체 프로젝트 만들어줘”라고 요청하면 코드가 복잡해지고 오류를 찾기 어렵다.

먼저 현재 프로젝트 상태를 정리한다.

### 3.1 현재 프로젝트 설명

AI에게 다음 내용을 먼저 알려준다.

```
현재 프로젝트는 React + Vite 프론트엔드와 Node.js Express 백엔드로 구성되어 있다.
개발 환경은 GitHub Codespaces이다.
스타일은 Tailwind CSS를 사용한다.
데이터베이스는 MongoDB Atlas를 사용한다.
회원 인증은 Firebase Authentication을 사용한다.
실시간 상담은 Socket.io로 구현한다.
배포는 Render에 할 예정이다.
```

### 3.2 기존 폴더 구조 확인

터미널에서 먼저 폴더 구조를 확인한다.

```bash
ls
find . -maxdepth 2 -type f
```

AI에게 현재 구조를 알려줄 때는 다음처럼 요청한다.

```
다음은 내 프로젝트 폴더 구조야.
이 구조를 기준으로 Firebase Auth, MongoDB Atlas, Socket.io를 단계적으로 붙이고 싶어.
먼저 어떤 파일을 수정해야 하는지 작업 순서만 정리해줘.

[폴더 구조 붙여넣기]
```

---

## 4. Firebase 회원 인증 구현

### 4.1 목표

사용자가 이메일과 비밀번호로 회원 가입하고 로그인할 수 있게 한다.

회원 유형은 일반 사용자와 딜러로 나눈다.

### 4.2 AI 요청 프롬프트

```
React + Vite 프로젝트에 Firebase Authentication을 붙이고 싶어.

요구사항은 다음과 같아.

1. 이메일/비밀번호 회원 가입
2. 이메일/비밀번호 로그인
3. 로그인 상태 유지
4. 로그아웃
5. 회원 가입 시 사용자 유형 선택: 일반 사용자 또는 딜러
6. 로그인한 사용자 정보는 전역에서 사용할 수 있게 구성

현재 프로젝트는 React + Vite + Tailwind CSS를 사용하고 있어.
필요한 설치 명령어, .env 설정, firebase.js 파일 구성, Login.jsx, Register.jsx 예시를 단계별로 만들어줘.
```

### 4.3 확인할 것

구현 후 반드시 확인한다.

```
회원 가입이 되는가?
로그인이 되는가?
새로고침 후에도 로그인 상태가 유지되는가?
로그아웃이 되는가?
Firebase 콘솔에 사용자가 등록되는가?
```

---

## 5. MongoDB Atlas 연동

### 5.1 목표

차량 정보와 상담 메시지를 MongoDB Atlas에 저장한다.

### 5.2 AI 요청 프롬프트

```
Express 서버에서 MongoDB Atlas를 MongoClient로 연결하고 싶어.

요구사항은 다음과 같아.

1. .env의 MONGODB_URI를 사용한다.
2. DB 이름은 car_market으로 한다.
3. cars, users, chat_rooms, messages 컬렉션을 사용할 예정이다.
4. MongoClient 연결 코드는 별도 파일로 분리한다.
5. 서버 시작 시 MongoDB 연결 여부를 콘솔에 출력한다.
6. 연결 실패 시 원인을 확인할 수 있게 에러 메시지를 출력한다.

server 폴더 기준으로 필요한 파일 구조와 코드를 만들어줘.
```

### 5.3 환경 변수 예시

```
PORT=3000
MONGODB_URI=본인의 MongoDB Atlas 접속 문자열
DB_NAME=car_market
CLIENT_URL=http://localhost:5173
```

### 5.4 확인할 것

```
서버 실행 시 MongoDB 연결 성공 메시지가 나오는가?
접속 문자열을 코드에 직접 쓰지 않았는가?
.env 파일이 GitHub에 올라가지 않도록 .gitignore에 포함했는가?
```

---

## 6. 차량 등록과 사진 업로드

### 6.1 목표

딜러가 차량 정보를 등록하고 사진을 함께 업로드할 수 있게 한다.

### 6.2 차량 데이터 구조

```json
{
  "name": "Sonata Hybrid",
  "company": "HYUNDAI",
  "price": 2800,
  "year": 2023,
  "type": "sedan",
  "fuel": "hybrid",
  "mileage": 35000,
  "location": "서울",
  "description": "출퇴근용으로 적합한 하이브리드 세단",
  "imageUrl": "/uploads/sonata.jpg",
  "dealerId": "firebase-user-uid",
  "dealerName": "김딜러"
}
```

### 6.3 AI 요청 프롬프트

```
Express 서버에 차량 등록 API를 만들고 싶어.

요구사항은 다음과 같아.

1. POST /api/cars
2. multipart/form-data 방식으로 차량 정보와 사진을 함께 받는다.
3. 사진 업로드는 multer를 사용한다.
4. 업로드된 사진은 uploads 폴더에 저장한다.
5. MongoDB cars 컬렉션에는 차량 정보와 imageUrl을 저장한다.
6. imageUrl은 React에서 바로 보여줄 수 있는 경로로 저장한다.
7. createdAt, updatedAt도 함께 저장한다.

필요한 설치 명령어, Express 설정, route 코드, React 등록 폼 예시를 만들어줘.
```

### 6.4 확인할 것

```
사진 없이 등록했을 때 오류가 나지 않는가?
사진을 등록하면 uploads 폴더에 파일이 생기는가?
MongoDB에 imageUrl이 저장되는가?
React 차량 카드에 사진이 보이는가?
```

---

## 7. 차량 검색 기능

### 7.1 목표

사용자가 원하는 차량을 조건별로 찾을 수 있게 한다.

검색 조건은 다음과 같다.

```
차량명 검색
제조사별 검색
가격 범위 검색
연식 범위 검색
```

### 7.2 AI 요청 프롬프트

```
MongoDB cars 컬렉션을 기준으로 차량 검색 API를 만들고 싶어.

검색 조건은 다음과 같아.

1. keyword: 차량명 검색
2. company: 제조사 검색
3. minPrice, maxPrice: 가격 범위 검색
4. minYear, maxYear: 연식 범위 검색

하나의 API에서 복합 검색이 가능해야 해.

API는 다음 주소로 만들고 싶어.

GET /api/cars/search

예:
GET /api/cars/search?keyword=sonata&company=HYUNDAI&minPrice=1000&maxPrice=3000&minYear=2020

MongoDB 쿼리를 동적으로 구성하는 Express 코드를 만들어줘.
React 검색 폼과 검색 결과 출력 예시도 함께 만들어줘.
```

### 7.3 확인할 것

```
차량명 일부만 입력해도 검색되는가?
제조사만 선택해도 검색되는가?
가격 최소값과 최대값이 적용되는가?
연식 범위가 적용되는가?
여러 조건을 함께 넣어도 정상 검색되는가?
```

---

## 8. 차량 상세 화면

### 8.1 목표

차량을 클릭하면 상세 정보를 확인하고 상담을 시작할 수 있게 한다.

### 8.2 AI 요청 프롬프트

```
React에서 차량 상세 화면을 만들고 싶어.

요구사항은 다음과 같아.

1. URL은 /cars/:id 형태로 사용한다.
2. Express API GET /api/cars/:id에서 차량 상세 정보를 가져온다.
3. 차량 사진, 차량명, 제조사, 가격, 연식, 차종, 연료, 주행거리, 지역, 설명, 딜러 이름을 출력한다.
4. 하단에 "딜러와 상담하기" 버튼을 둔다.
5. 버튼을 누르면 상담방을 만들고 채팅 화면으로 이동한다.

React Router 기준으로 필요한 컴포넌트와 API 호출 코드를 만들어줘.
```

### 8.3 확인할 것

```
목록에서 상세 화면으로 이동되는가?
새로고침해도 상세 정보가 유지되는가?
잘못된 차량 ID로 접근했을 때 오류 화면이 나오는가?
상담하기 버튼이 동작하는가?
```

---

## 9. Socket.io 실시간 상담

### 9.1 목표

사용자와 딜러가 차량 상세 화면에서 실시간으로 상담할 수 있게 한다.

### 9.2 상담 시나리오

```
1. 사용자가 차량 상세 화면에서 상담하기 버튼을 누른다.
2. 서버는 차량 ID, 사용자 ID, 딜러 ID를 기준으로 상담방을 만든다.
3. 사용자는 상담방에 입장한다.
4. 메시지를 보내면 상대방 화면에 실시간으로 표시된다.
5. 메시지는 MongoDB messages 컬렉션에 저장된다.
6. 나중에 다시 들어와도 이전 메시지를 볼 수 있다.
```

### 9.3 AI 요청 프롬프트

```
Express 서버와 React 클라이언트에 Socket.io 실시간 채팅 기능을 붙이고 싶어.

요구사항은 다음과 같아.

1. 서버는 Express와 같은 포트에서 Socket.io를 실행한다.
2. 사용자는 roomId 기준으로 상담방에 입장한다.
3. 클라이언트가 send-message 이벤트를 보내면 서버는 메시지를 MongoDB messages 컬렉션에 저장한다.
4. 저장 후 같은 방의 사용자에게 receive-message 이벤트를 보낸다.
5. 상담방 입장 이벤트 이름은 join-room으로 한다.
6. 메시지 전송 이벤트 이름은 send-message로 한다.
7. 메시지 수신 이벤트 이름은 receive-message로 한다.
8. React에서는 채팅 메시지 목록, 입력창, 전송 버튼을 만든다.

서버 코드와 React ChatRoom.jsx 예시를 단계별로 만들어줘.
```

### 9.4 확인할 것

```
브라우저 두 개를 열고 메시지가 실시간으로 오가는가?
상담방이 다르면 메시지가 섞이지 않는가?
메시지가 MongoDB에 저장되는가?
새로고침 후 이전 메시지를 다시 불러오는가?
```

---

## 10. AI Agent 확장 준비

### 10.1 목표

이번 과제에서는 AI Agent를 완성하지 않아도 된다. 다만 상담 구조는 나중에 AI Agent가 끼어들 수 있게 만들어 둔다.

### 10.2 AI 요청 프롬프트

```
현재 Socket.io 채팅 기능이 있어.
이 기능을 나중에 AI Agent 상담으로 확장하고 싶어.

요구사항은 다음과 같아.

1. 사용자가 보낸 메시지를 handleChatMessage 함수에서 처리한다.
2. 현재는 메시지를 딜러에게 전달한다.
3. 나중에는 딜러가 오프라인이면 AI Agent가 답변할 수 있게 구조를 분리한다.
4. AI Agent가 참고할 수 있도록 차량 정보, 사용자 질문, 이전 메시지를 함께 가져오는 구조를 만든다.
5. 지금은 실제 OpenAI API 호출은 하지 않는다.
6. 대신 generateAgentReply라는 빈 함수를 만들어 두고, 나중에 교체할 수 있게 한다.

기존 Socket.io 코드에 이 구조를 반영하는 예시를 만들어줘.
```

### 10.3 코드 구조 예시

```jsx
async function handleChatMessage({ roomId, senderId, message }) {
  // 1. 메시지 저장
  // 2. 상담방 정보 조회
  // 3. 차량 정보 조회
  // 4. 딜러 온라인 여부 확인
  // 5. 현재는 딜러에게 전달
  // 6. 이후 AI Agent 응답으로 확장
}

async function generateAgentReply({ car, messages, userMessage }) {
  // 다음 수업에서 OpenAI API 또는 온디바이스 AI Agent로 교체
}
```

---

## 11. Render 배포

### 11.1 목표

Express 서버와 React 앱을 Render에 배포한다.

### 11.2 AI 요청 프롬프트

```
React + Vite 프론트엔드와 Express 백엔드를 Render에 배포하려고 해.

현재 구조는 다음과 같아.

client: React + Vite
server: Express + MongoDB Atlas + Socket.io

요구사항은 다음과 같아.

1. server는 Render Web Service로 배포한다.
2. client는 Render Static Site로 배포한다.
3. server의 환경 변수에는 MONGODB_URI, DB_NAME, CLIENT_URL을 등록한다.
4. client의 환경 변수에는 VITE_API_BASE_URL을 등록한다.
5. Socket.io도 Render 서버 주소로 연결한다.
6. CORS 설정도 배포 주소 기준으로 수정한다.

Render 배포 절차와 필요한 설정값을 단계별로 정리해줘.
```

### 11.3 확인할 것

```
Render 서버 주소로 API 호출이 되는가?
React 배포 주소에서 로그인과 검색이 되는가?
Socket.io 채팅이 배포 환경에서도 동작하는가?
환경 변수가 GitHub에 노출되지 않았는가?
```

---

## 12. 오류가 났을 때 AI에게 묻는 방법

오류가 나면 “안 돼요”라고만 묻지 않는다. 아래 네 가지를 함께 붙여서 질문한다.

```
1. 내가 하려던 작업
2. 실행한 명령어
3. 오류 메시지 전체
4. 관련 코드 일부
```

### 예시

```
MongoDB Atlas에 연결하려고 했는데 서버 실행 시 오류가 납니다.

실행한 명령어:
npm run dev

오류 메시지:
[오류 메시지 전체 붙여넣기]

관련 코드:
[db.js 또는 server.js 코드 붙여넣기]

.env 설정에서 MONGODB_URI는 등록했습니다.
이 오류의 원인과 수정 방법을 단계별로 알려주세요.
```

---

## 13. AI가 만든 코드 검토 기준

AI가 코드를 만들어 주면 다음 항목을 직접 확인한다.

```
1. 내가 요청한 기능만 구현했는가?
2. 기존 파일 구조를 크게 망가뜨리지 않았는가?
3. 환경 변수를 코드에 직접 쓰지 않았는가?
4. import 경로가 맞는가?
5. 서버와 클라이언트 주소가 맞는가?
6. MongoDB 컬렉션 이름이 일관되는가?
7. Firebase uid를 사용자 식별값으로 사용하고 있는가?
8. Socket.io 이벤트 이름이 서버와 클라이언트에서 같은가?
9. 실행 후 콘솔 오류가 없는가?
10. 브라우저 새로고침 후에도 주요 기능이 유지되는가?
```

---

## 14. 주말 작업 추천 순서

### 1일 차

```
오전: Firebase 회원 가입 / 로그인
오후: MongoDB Atlas 연동
저녁: 차량 등록 + 사진 업로드
```

### 2일 차

```
오전: 차량 검색 + 차량 상세 화면
오후: Socket.io 상담
저녁: Render 배포 + README 정리
```

막히는 부분이 있으면 전체를 다시 만들려고 하지 말고, 해당 기능만 분리해서 AI에게 질문한다.

---

## 15. README에 반드시 적을 내용

```
프로젝트 소개
사용 기술
실행 방법
환경 변수 설정
Firebase Authentication 설정
MongoDB Atlas 설정
차량 검색 기능
사진 업로드 기능
Socket.io 상담 기능
Render 배포 주소
AI Agent 확장 계획
```

README는 길게 쓰지 않아도 된다. 다른 사람이 프로젝트를 실행할 수 있을 정도로만 명확하게 정리한다.

---

## 16. 최종 점검

제출 전 아래 항목을 확인한다.

```
회원 가입이 되는가?
로그인이 되는가?
차량 등록이 되는가?
사진이 보이는가?
차량명 검색이 되는가?
제조사 검색이 되는가?
가격 범위 검색이 되는가?
연식 검색이 되는가?
차량 상세 화면이 열리는가?
상담 메시지가 실시간으로 오가는가?
상담 메시지가 MongoDB에 저장되는가?
Render 배포 주소에서 접속되는가?
README가 작성되어 있는가?
```

이번 과제의 핵심은 완벽한 서비스를 만드는 것이 아니다. 기존 CRUD 앱을 실제 서비스 구조로 확장해 보는 것이다. AI는 코드를 대신 작성해 줄 수 있지만, 기능의 흐름을 이해하고 검증하는 일은 개발자의 몫이다.
