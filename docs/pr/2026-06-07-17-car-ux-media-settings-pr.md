# PR: 차량 등록 UX, 다중 이미지, 설정, 모던 UI 개선

## PR 제목

```text
feat: 차량 등록 UX와 다중 이미지 갤러리 개선
```

## 작업 배경

차량 등록 시 제조사가 고정 선택지로 제한되고, 상세 화면에서 같은 이미지가 썸네일로 반복되어 매물 신뢰도가 떨어지는 문제가 있었다.
또한 Render 무료 환경에서는 재배포 후 `/uploads` 파일이 사라질 수 있어 깨진 이미지가 그대로 보일 수 있었다.

이번 작업은 기존 단일 Render Web Service 구조와 `/uploads` 저장 방식을 유지하면서, 차량 등록 UX와 이미지 표시 안정성을 우선 개선했다.

## 변경 내용

### 차량 다중 이미지 업로드

- 등록/수정 API에서 `images` 필드 최대 8장 업로드를 지원한다.
- 기존 `image` 단일 필드는 서버에서 호환 처리한다.
- MongoDB `cars` 문서에 대표 이미지 `imageUrl`과 전체 이미지 배열 `imageUrls`를 함께 저장한다.
- 수정 시 새 이미지를 선택하지 않으면 기존 이미지를 유지하고, 새 이미지를 선택하면 전체 교체한다.

### 상세 갤러리 개선

- 상세 화면에서 같은 사진 4장을 반복하던 구조를 제거했다.
- 실제 이미지 개수에 따라 대표 이미지와 썸네일을 표시한다.
- 썸네일 클릭 시 큰 이미지가 바뀐다.

### 이미지 fallback 강화

- 차량 목록, 테이블, 딜러 대시보드, 상담 목록, 상담방, 상세 화면에 이미지 로딩 실패 fallback을 적용했다.
- 이미지가 없거나 재배포 후 파일이 사라져도 `/uploads/default-car.png`로 대체한다.

### 차량 등록 폼 UX 개선

- 제조사는 추천 목록을 유지하면서 직접 입력 가능한 datalist 방식으로 변경했다.
- 가격, 주행거리, 연식 입력에 설정값 기반 `step`을 적용했다.
- 다중 파일 선택 후 미리보기를 제공한다.

### 관리자 설정 추가

- `GET /api/settings/car-form`으로 차량 등록 설정을 조회한다.
- admin만 `PATCH /api/settings/car-form`으로 설정을 저장할 수 있다.
- 관리자 화면에 `차량 등록 설정` 탭을 추가했다.
- 설정은 MongoDB `settings` 컬렉션에 `key: "carForm"` 문서로 저장한다.

### 문서 갱신

- README, 배포 가이드, 배포 체크리스트에 다중 이미지와 fallback 정책을 반영했다.
- Render 무료 환경에서는 업로드 파일이 영구 보관되지 않는다는 한계를 유지해서 안내했다.

## 변경 파일

```text
backend/config/upload.js
backend/db.js
backend/routes/cars.routes.js
backend/routes/settings.routes.js
backend/server.js
backend/services/cars.service.js
backend/services/collections.js
backend/services/settings.service.js
backend/utils/normalizers.js
frontend/src/App.jsx
frontend/src/components/AdminUserPanel.jsx
frontend/src/components/CarCardGrid.jsx
frontend/src/components/CarDetail.jsx
frontend/src/components/CarForm.jsx
frontend/src/components/CarTable.jsx
frontend/src/components/ChatRoom.jsx
frontend/src/components/ChatRoomList.jsx
frontend/src/components/DealerDashboard.jsx
frontend/src/utils/carImages.js
README.md
docs/deploy-guide.md
docs/deploy-checklist.md
docs/plans/plan-17-car-ux-media-settings.md
docs/steps/2026-06-07-17-car-ux-media-settings.md
docs/pr/2026-06-07-17-car-ux-media-settings-pr.md
docs/progress.md
```

## 보존된 항목

| 항목 | 내용 |
| --- | --- |
| Render 배포 구조 | 단일 Web Service 유지 |
| API 기본 경로 | 기존 `/api/cars`, `/api/users`, `/api/chats` 유지 |
| Socket.io 이벤트 이름 | 변경 없음 |
| Firebase 프로젝트 설정 | 변경 없음 |
| 외부 이미지 스토리지 | 도입하지 않음 |
| 업로드 파일 형식 | jpg/jpeg/png/webp 유지 |
| 파일 크기 | 파일당 5MB 유지 |

## 검증

```text
node --check backend/server.js                    → 성공
node --check backend/config/upload.js             → 성공
node --check backend/services/cars.service.js     → 성공
node --check backend/services/settings.service.js → 성공
node --check backend/routes/settings.routes.js    → 성공
npm.cmd --prefix frontend run build               → 성공
npm.cmd run build                                  → 성공
```

참고:

- 빌드 중 기존 frontend 의존성 moderate 취약점 2건 안내와 `.env`의 `NODE_ENV=production` 관련 Vite 경고가 표시되었지만 빌드는 성공했다.
- 실제 MongoDB/Firebase 환경에서 다중 이미지 업로드와 관리자 설정 저장은 추가 확인이 필요하다.
