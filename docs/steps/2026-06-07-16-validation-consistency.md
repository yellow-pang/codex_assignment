# 16단계 입력 검증, 정합성, 동시성, 중복 요청 방지

## 1. 작업 목적

15단계에서 서버가 Firebase ID Token을 검증하고 인증 사용자 기준으로 권한을 판단하도록 바꿨다.
이번 16단계는 로그인한 사용자라도 잘못된 값, 너무 긴 값, 공백 메시지, 빠른 반복 클릭, 동시에 들어오는 상담 메시지 때문에 데이터가 어긋나지 않도록 보강했다.

비전공자 기준으로 풀어 말하면 다음과 같다.

- 프론트 1차 검증: 사용자가 버튼을 누르기 전에 빠르게 안내한다.
- 백엔드 최종 검증: API 도구로 직접 요청해도 서버가 한 번 더 막는다.
- 중복 요청 방어: 버튼을 빠르게 여러 번 눌러도 같은 요청이 반복 저장되지 않게 막는다.
- 정렬 기준 정리: 메시지가 거의 동시에 저장되어도 일정한 순서로 조회한다.

## 2. 코드 변경 요약

| 구분           | 변경 내용                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| 차량 검증      | 차량명, 제조사, 연식, 가격, 차종, 연료, 주행거리, 지역, 설명의 서버 검증을 추가했다.                               |
| 사용자 검증    | 사용자 이름 길이와 역할/딜러 상태 조합 검증을 보강했다.                                                            |
| 채팅 검증      | 공백 메시지와 1000자 초과 메시지를 저장하지 않도록 했다.                                                           |
| 중복 요청 방어 | 서버 메모리 TTL 기준으로 차량, 상담방, 메시지, 딜러 신청, 역할 변경 반복 요청을 차단했다.                          |
| MongoDB index  | `users.uid`, `chat_rooms.roomId` unique index와 상담방/메시지 조회용 일반 index 생성 로직을 추가했다.              |
| 메시지 정렬    | 메시지 조회는 `createdAt`, `_id` 오름차순으로 정렬한다.                                                            |
| 업로드 점검    | 기존 5MB, jpg/jpeg/png/webp 정책을 유지하고 파일 1장 제한 오류 메시지를 보강했다.                                  |
| 프론트 UX      | 차량 등록/수정/삭제, 검색, 상담방 생성, 딜러 신청, 역할 변경, 메시지 전송 버튼의 loading/disabled 처리를 추가했다. |

## 3. 백엔드 검증 기준

### 3.1 차량 등록/수정

| 필드          | 기준                                                        |
| ------------- | ----------------------------------------------------------- |
| `name`        | 필수, 2~80자                                                |
| `company`     | `HYUNDAI`, `KIA`, `RENAULT`, `GENESIS`, `CHEVROLET` 중 하나 |
| `year`        | 1900 이상 현재 연도 이하 정수                               |
| `price`       | 0보다 크고 100000 이하 숫자                                 |
| `type`        | `sedan`, `SUV`, `compact`, `hatchback`, `truck` 중 하나     |
| `fuel`        | `gasoline`, `diesel`, `hybrid`, `electric`, `LPG` 중 하나   |
| `mileage`     | 0 이상 2000000 이하 숫자                                    |
| `location`    | 필수, 2~40자                                                |
| `description` | 필수, 10~1000자                                             |

검증 실패 시 서버는 `400` 상태와 `{ message }` 응답을 반환한다.

### 3.2 사용자 프로필과 역할 변경

- 사용자 이름은 2~40자로 제한한다.
- 역할은 `buyer`, `dealer`, `admin`만 허용한다.
- 딜러 상태는 `none`, `pending`, `approved`, `rejected`만 허용한다.
- `dealer` 역할은 `approved` 상태와 함께 저장해야 한다.
- `admin` 역할은 딜러 상태를 `none`으로 저장해야 한다.
- `buyer`는 `approved` 딜러 상태로 저장할 수 없다.
- 자기 자신의 admin 권한 해제 방어는 유지한다.

### 3.3 상담 메시지

- trim 후 빈 문자열이면 저장하지 않는다.
- 1000자 초과 메시지는 잘라 저장하지 않고 오류로 차단한다.
- 같은 상담방, 같은 사용자, 같은 본문이 1.5초 안에 반복되면 중복 전송으로 차단한다.

## 4. 중복 요청 방어 방식

`backend/utils/requestGuard.js`를 추가했다.

이 파일은 서버 메모리에 짧은 TTL을 둔 key를 저장한다.
같은 사용자가 같은 작업을 너무 빠르게 다시 요청하면 `429` 오류를 낸다.

적용 범위:

| 작업             | TTL   |
| ---------------- | ----- |
| 차량 등록        | 3초   |
| 차량 수정        | 3초   |
| 차량 삭제        | 3초   |
| 상담방 생성      | 3초   |
| 상담 메시지 전송 | 1.5초 |
| 딜러 신청        | 3초   |
| 관리자 역할 변경 | 2초   |

주의:

- 현재 Render 단일 Web Service 기준에 맞는 1차 방어다.
- 서버가 재시작되면 메모리 guard 기록은 사라진다.
- 여러 서버 인스턴스로 확장하면 Redis나 DB 기준 idempotency key를 별도로 검토해야 한다.

## 5. MongoDB index 정책

서버 시작 후 컬렉션 준비 단계에서 아래 index 생성을 시도한다.

| 컬렉션       | index                                 | unique | 목적                           |
| ------------ | ------------------------------------- | ------ | ------------------------------ |
| `users`      | `{ uid: 1 }`                          | 예     | Firebase UID 중복 사용자 방지  |
| `chat_rooms` | `{ roomId: 1 }`                       | 예     | 같은 상담방 중복 생성 방지     |
| `chat_rooms` | `{ buyerId: 1, updatedAt: -1 }`       | 아니오 | 구매자 상담방 목록 조회 보조   |
| `chat_rooms` | `{ dealerId: 1, updatedAt: -1 }`      | 아니오 | 딜러 상담방 목록 조회 보조     |
| `messages`   | `{ roomId: 1, createdAt: 1, _id: 1 }` | 아니오 | 이전 메시지 조회와 정렬 안정화 |
| `cars`       | `{ createdAt: -1, _id: -1 }`          | 아니오 | 차량 목록 정렬 보조            |

기존 DB에 중복 `uid` 또는 `roomId`가 있으면 unique index 생성이 실패할 수 있다.
이 경우 서버는 바로 종료하지 않고 경고 로그를 남긴다.
중복 데이터 정리는 별도 사용자 확인 후 진행해야 한다.

## 6. 프론트엔드 변경 요약

| 파일                                             | 변경 내용                                                                                             |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `frontend/src/App.jsx`                           | `pendingAction` 상태를 추가해 검색, 차량 등록/수정/삭제, 상담방 생성, 딜러 신청 중복 클릭을 방지했다. |
| `frontend/src/components/CarForm.jsx`            | 저장 중에는 취소/저장 버튼을 비활성화하고 차량명/지역/설명 길이 검증을 서버 기준에 맞췄다.            |
| `frontend/src/components/DeleteConfirmModal.jsx` | 삭제 중에는 오버레이 닫기와 삭제 버튼 재클릭을 막는다.                                                |
| `frontend/src/components/CarCardGrid.jsx`        | 상담방 준비 중 버튼 문구와 중복 클릭 방지를 추가했다.                                                 |
| `frontend/src/components/CarDetail.jsx`          | 상세 화면의 상담 버튼에 준비 중 상태를 표시한다.                                                      |
| `frontend/src/components/Header.jsx`             | 딜러 신청 중 버튼을 비활성화하고 문구를 바꾼다.                                                       |
| `frontend/src/components/AdminUserPanel.jsx`     | 사용자별 역할 변경 처리 중 상태를 추가했다.                                                           |
| `frontend/src/components/ChatRoom.jsx`           | 메시지 전송 중 상태와 1000자 초과 1차 검증을 추가했다.                                                |

## 7. 변경한 주요 파일

| 파일                                | 내용                                                 |
| ----------------------------------- | ---------------------------------------------------- |
| `backend/utils/normalizers.js`      | 차량/사용자/역할/메시지 검증 기준 추가               |
| `backend/utils/requestGuard.js`     | 서버 메모리 TTL 중복 요청 guard 추가                 |
| `backend/services/cars.service.js`  | 차량 검증과 중복 등록/수정/삭제 방어                 |
| `backend/services/users.service.js` | 딜러 신청/역할 변경 중복 방어와 역할 조합 검증       |
| `backend/services/chats.service.js` | 상담방 생성/메시지 전송 중복 방어와 메시지 정렬 보강 |
| `backend/db.js`                     | MongoDB index 생성 로직 추가                         |
| `backend/config/upload.js`          | 파일 1장 제한과 업로드 오류 메시지 보강              |
| `frontend/src/App.jsx`              | 주요 요청 pending 상태 추가                          |
| `frontend/src/components/*.jsx`     | 버튼 loading/disabled와 1차 검증 보강                |

## 8. 검증 결과

| 명령어                                           | 결과 |
| ------------------------------------------------ | ---- |
| `node --check backend/db.js`                     | 성공 |
| `node --check backend/config/upload.js`          | 성공 |
| `node --check backend/utils/normalizers.js`      | 성공 |
| `node --check backend/utils/requestGuard.js`     | 성공 |
| `node --check backend/services/cars.service.js`  | 성공 |
| `node --check backend/services/users.service.js` | 성공 |
| `node --check backend/services/chats.service.js` | 성공 |
| `node --check backend/sockets/chat.socket.js`    | 성공 |
| `node --check backend/routes/cars.routes.js`     | 성공 |
| `node --check backend/routes/users.routes.js`    | 성공 |
| `node --check backend/routes/chats.routes.js`    | 성공 |
| `node --check backend/server.js`                 | 성공 |
| `npm.cmd --prefix frontend run build`            | 성공 |
| `npm.cmd run build`                              | 성공 |

빌드 중 기존과 같은 Vite 경고가 표시되었다.

```text
NODE_ENV=production is not supported in the .env file.
```

이 경고는 빌드 실패가 아니며, `.env`에 `NODE_ENV=production`이 있을 때 Vite가 안내하는 메시지다.

루트 통합 빌드 과정에서 프론트엔드 의존성 moderate 취약점 2건이 보고되었다.
이번 단계에서는 강제 업데이트가 기능 파급을 만들 수 있어 `npm audit fix --force`는 실행하지 않았다.

## 9. 남은 확인

실제 Firebase Admin 서비스 계정과 MongoDB Atlas 환경이 있어야 아래 항목을 확인할 수 있다.

1. 기존 DB에 중복 `users.uid` 또는 `chat_rooms.roomId`가 없어 unique index가 생성되는지 확인한다.
2. 잘못된 차량 입력으로 `POST /api/cars`, `PUT /api/cars/:id` 요청 시 `400`이 반환되는지 확인한다.
3. 같은 차량 등록/수정/삭제 요청을 빠르게 반복하면 `429`가 반환되는지 확인한다.
4. 상담방 생성 버튼을 빠르게 반복해도 상담방이 중복 생성되지 않는지 확인한다.
5. 채팅에서 공백 메시지, 1000자 초과 메시지, 짧은 시간 동일 메시지가 차단되는지 확인한다.
6. 관리자 화면에서 같은 사용자 역할 변경 버튼을 반복 클릭해도 한 번만 처리되는지 확인한다.
7. 차량 사진을 2개 이상 또는 허용되지 않은 형식으로 업로드할 때 `400` 응답이 나오는지 확인한다.

## 10. 커밋 전 확인

커밋 전 사용자가 확인할 것:

1. 실제 Secret 값이 문서나 코드에 들어가지 않았는지 확인한다.
2. `.env` 파일이 커밋 대상에 없는지 확인한다.
3. MongoDB Atlas 로그 또는 앱 로그에서 index 생성 실패 경고가 없는지 확인한다.
4. 실환경에서 차량 등록, 상담방 생성, 메시지 전송을 한 번씩 직접 확인한다.
