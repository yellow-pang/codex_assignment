# 17단계 차량 등록 UX, 다중 이미지, 설정, 모던 UI 개선

## 1. 작업 목적

차량 등록 과정에서 정해진 제조사만 선택해야 하는 불편, 상세 화면에서 같은 사진이 반복되는 문제, 재배포 후 이미지가 깨져 보이는 문제를 줄이기 위해 차량 등록/상세/관리자 설정 흐름을 보강했다.

## 2. 코드 변경 요약

| 구분 | 변경 내용 |
| --- | --- |
| 다중 이미지 업로드 | `images` 필드로 최대 8장 업로드를 지원하고, 기존 `image` 단일 필드도 서버에서 호환 처리한다. |
| 이미지 저장 구조 | 기존 대표 이미지 `imageUrl`은 유지하고, 전체 이미지 배열 `imageUrls`를 추가 저장한다. |
| 상세 갤러리 | 상세 화면 썸네일 반복을 제거하고 실제 이미지 개수에 따라 큰 이미지와 썸네일을 표시한다. |
| 이미지 fallback | 목록, 상세, 딜러 화면, 상담 화면에서 이미지 로딩 실패 시 placeholder로 대체한다. |
| 제조사 UX | 제조사는 추천 목록을 유지하되 직접 입력 가능한 datalist 방식으로 변경했다. |
| 숫자 입력 단위 | 연식, 가격, 주행거리 input에 설정값 기반 `step`을 적용한다. |
| 관리자 설정 | `/api/settings/car-form`과 관리자 `차량 등록 설정` 탭을 추가했다. |
| 문서 | README와 배포 문서에 다중 이미지, fallback, Render 파일 비영속성 한계를 반영했다. |

## 3. 백엔드 변경

| 파일 | 내용 |
| --- | --- |
| `backend/config/upload.js` | 업로드 제한을 최대 8장으로 확장하고, 업로드 파일 배열을 URL 배열로 바꾸는 helper를 추가했다. |
| `backend/routes/cars.routes.js` | 등록/수정 라우트를 `upload.fields([{ name: "images" }, { name: "image" }])` 구조로 변경했다. |
| `backend/services/cars.service.js` | 새 이미지가 있으면 `imageUrl`, `imageUrls`를 함께 저장하고, 수정 시 새 이미지가 없으면 기존 이미지를 유지한다. |
| `backend/utils/normalizers.js` | 클라이언트가 보낸 `imageUrls` 조작을 제거하고, 제조사 검증을 2~40자 문자열 기준으로 완화했다. |
| `backend/db.js` | 기본 컬렉션과 index 생성 대상에 `settings` 컬렉션을 추가했다. |
| `backend/services/settings.service.js` | 차량 등록 설정 기본값, 조회, admin 저장 로직을 추가했다. |
| `backend/routes/settings.routes.js` | `GET /api/settings/car-form`, `PATCH /api/settings/car-form` 라우트를 추가했다. |
| `backend/server.js` | settings 라우터를 `/api/settings`에 등록했다. |

## 4. 프론트엔드 변경

| 파일 | 내용 |
| --- | --- |
| `frontend/src/utils/carImages.js` | 대표 이미지 계산과 이미지 로딩 실패 fallback helper를 추가했다. |
| `frontend/src/components/CarForm.jsx` | 제조사 직접 입력, 다중 파일 선택, 미리보기, 숫자 step 적용을 구현했다. |
| `frontend/src/components/CarDetail.jsx` | 실제 이미지 배열 기반 갤러리와 썸네일 선택 UI를 구현했다. |
| `frontend/src/App.jsx` | 차량 등록 설정 조회, 다중 이미지 FormData 전송, 검색 숫자 step 적용을 연결했다. |
| `frontend/src/components/AdminUserPanel.jsx` | 관리자 `차량 등록 설정` 탭과 설정 저장 UI를 추가했다. |
| 이미지 표시 컴포넌트 | 목록, 테이블, 딜러 대시보드, 상담 목록, 상담방 이미지 fallback을 적용했다. |

## 4.1 상담방 이미지 동기화 보강

기존 상담방은 생성 시점의 `imageUrl`을 `chat_rooms` 문서에 저장하므로, 차량 사진 수정 후에도 예전 채팅방에는 이전 이미지가 남을 수 있었다.

이를 보정하기 위해 다음을 추가했다.

- 상담방 목록 조회와 상담방 상세 조회 시 현재 `cars` 문서를 다시 읽어 `imageUrl`, `imageUrls`, `carName`을 최신 값으로 내려준다.
- 차량 수정 후 관련 `chat_rooms` 문서의 `carName`, `imageUrl`, `imageUrls`도 함께 갱신한다.
- 기존 채팅방 문서에 예전 이미지가 남아 있어도 화면 조회 시 현재 차량 대표 이미지로 보정된다.

## 5. 데이터 호환 정책

기존 차량 문서는 `imageUrl` 하나만 있어도 계속 정상 동작한다.
새로 등록하거나 사진을 교체한 차량은 다음처럼 저장된다.

```json
{
  "imageUrl": "/uploads/대표이미지.webp",
  "imageUrls": [
    "/uploads/대표이미지.webp",
    "/uploads/실내이미지.webp"
  ]
}
```

수정 화면에서 새 이미지를 선택하지 않으면 기존 `imageUrl`, `imageUrls`를 유지한다.
새 이미지를 선택하면 선택한 이미지 목록으로 전체 교체한다.

## 6. 관리자 설정 기준

| 설정 | 기본값 | 제한 |
| --- | --- | --- |
| 연식 단위 | 1 | 1~10 |
| 가격 단위 | 100만원 | 1~10,000 |
| 주행거리 단위 | 1,000km | 1~100,000 |
| 최대 사진 개수 | 8장 | 1~8 |

설정은 MongoDB `settings` 컬렉션의 `key: "carForm"` 문서에 저장한다.

## 7. 검증 결과

| 검증 | 결과 |
| --- | --- |
| `node --check backend/server.js` | 성공 |
| `node --check backend/config/upload.js` | 성공 |
| `node --check backend/services/cars.service.js` | 성공 |
| `node --check backend/services/chats.service.js` | 성공 |
| `node --check backend/services/settings.service.js` | 성공 |
| `node --check backend/routes/settings.routes.js` | 성공 |
| `npm.cmd --prefix frontend run build` | 성공 |
| `npm.cmd run build` | 성공 |

참고: 빌드 중 기존 frontend 의존성 moderate 취약점 2건 안내와 `.env`의 `NODE_ENV=production` 관련 Vite 경고가 표시되었지만 빌드는 성공했다.

## 8. 남은 확인

1. 실제 MongoDB/Firebase 환경에서 승인된 딜러로 여러 장의 사진 등록과 수정 전체 교체를 확인한다.
2. admin 계정으로 차량 등록 설정 저장 후 새 등록/수정 화면에 단위가 반영되는지 확인한다.
3. Render 재배포 후 사라진 업로드 이미지가 placeholder로 대체되는지 확인한다.
4. 업로드 사진을 영구 보관하려면 S3 또는 Cloudinary 같은 외부 이미지 스토리지를 별도 단계로 검토한다.
