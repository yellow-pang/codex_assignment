# 17단계 차량 등록 UX, 다중 이미지, 설정, 모던 UI 개선 계획

## 1. 문서 목적

이번 17단계는 차량 등록과 상세 화면에서 사용자가 느끼는 불편을 줄이고, 재배포 후 이미지 깨짐 문제를 완화하며, 숫자 입력 단위와 화면 디자인을 더 현대적으로 정리하기 위한 계획이다.

이 문서는 코드 수정 전 사용자 확인을 받기 위한 계획 문서다.
코드 수정은 아래 확인 필요 항목에 대한 사용자 승인 후 진행한다.

## 2. 현재 작업 상태

| 항목 | 내용 |
| --- | --- |
| 현재 브랜치 | `feat/car-ux-media-settings` |
| 미커밋 변경 | 계획 작성 전 기준 없음 |
| 작업 성격 | 차량 등록 UX, 다중 이미지 업로드, 이미지 fallback, 관리자 설정, UI 개선 |
| 코드 수정 여부 | 이 문서 작성 단계에서는 코드 수정 없음 |
| 배포 방향 | Render Web Service 단일 배포 유지 |
| API 경로 | 기존 `/api/cars`, `/api/users`, `/api/chats` 유지 |
| Socket.io 이벤트 이름 | 기존 `join-room`, `send-message`, `receive-message`, `leave-room`, `dealer-online`, `dealer-offline` 유지 |
| MongoDB 컬렉션 구조 | 기존 컬렉션 유지, 필요 시 `cars` 문서에 이미지 배열과 설정 컬렉션 후보 추가 |

## 3. 확인한 문서와 파일

| 구분 | 확인 대상 | 확인 내용 |
| --- | --- | --- |
| 저장소 규칙 | `AGENTS.md` | 중간 이상 작업은 계획 문서 작성 후 사용자 확인 필요 |
| 요구사항 | `docs/실시간_Car_Market_서비스_요구사항_정의서.md` | 차량 사진 1장 이상, `multer`, `/uploads`, Render 무료 환경 업로드 비영속성 확인 |
| 기존 요구사항 | `docs/requirements.md` | 초기 CRUD 기준은 단순 차량명, 제조사, 연식, 가격 중심임 |
| 개발 계획 | `docs/실시간_Car_Market_향후_개발_계획서.md` | 현재 MongoDB, Firebase, Socket.io, 사진 업로드는 구현 상태로 정리됨 |
| UI 분석 | `docs/실시간_Car_Market_UI_개선_분석_보고서.md` | Modern Car Marketplace, 순수 Tailwind CSS, 차량 목록/상세/등록 화면 개선 방향 확인 |
| 진행 기록 | `docs/progress.md` | 16단계까지 검증/중복 요청 방어와 Tailwind UI 보강 완료 |
| 배포 문서 | `docs/deploy-guide.md`, `docs/deploy-checklist.md` | `/uploads`는 Render 무료 환경에서 사라질 수 있고 외부 스토리지 검토가 필요함 |
| CI/CD | `.github/workflows/deploy.yml` | 루트 빌드 후 Render Deploy Hook 호출 구조 유지 |
| 업로드 설정 | `backend/config/upload.js`, `backend/routes/cars.routes.js` | 현재 `upload.single("image")`, 파일 1장 제한, `image` 필드만 허용 |
| 차량 서비스 | `backend/services/cars.service.js`, `backend/utils/normalizers.js` | 현재 차량 문서는 `imageUrl` 단일 값 중심, 제조사/차종/연료는 허용 목록 검증 |
| 프론트 폼 | `frontend/src/components/CarForm.jsx` | 제조사/차종/연료는 select 중심, 사진 1장만 선택, 숫자 input step 미지정 |
| 상세 화면 | `frontend/src/components/CarDetail.jsx` | 큰 이미지와 썸네일 4칸이 모두 같은 `imageUrl`을 반복 사용 |
| 목록/관리 화면 | `CarCardGrid.jsx`, `CarTable.jsx`, `DealerDashboard.jsx`, `ChatRoomList.jsx`, `ChatRoom.jsx` | 여러 화면에서 `car.imageUrl || /uploads/default-car.png` 패턴 사용 |

## 4. 현재 문제 요약

| 문제 | 현재 상태 | UX 영향 |
| --- | --- | --- |
| 정해진 제조사만 등록 가능 | 서버 `allowedCompanies`, 프론트 select가 제한 | 사용자가 수입차/기타 브랜드를 등록하기 어려움 |
| 상세 썸네일이 같은 사진 반복 | `CarDetail.jsx`에서 `[0, 1, 2, 3]`에 같은 `imageUrl` 사용 | 실제 사진이 여러 장 있는 것처럼 보이나 모두 같아 신뢰도가 떨어짐 |
| 사진 업로드 1장 제한 | `upload.single("image")`, `limits.files: 1` | 외관/실내/계기판 등 매물 판단에 필요한 사진을 담기 어려움 |
| 재배포 후 이미지 깨짐 | Render 무료 환경의 업로드 파일 비영속성 | 기존 차량 이미지 경로가 남아도 파일이 사라지면 깨진 이미지 표시 |
| 숫자 입력 단위 불편 | 연식/가격/주행거리 input에 목적별 `step` 없음 | 가격과 주행거리 입력이 오래 걸리고 실수 가능성이 높음 |
| 관리자 설정 부재 | 숫자 단위/선택지 설정 화면 없음 | 운영자가 서비스 정책을 화면에서 조정하기 어려움 |
| UI가 보편적인 관리형 느낌 | 일부 화면은 card/form/table 중심 | 자동차 마켓다운 고급감과 이미지 중심성이 약함 |

## 5. 문서와 실제 구현 차이

| 항목 | 문서 또는 요구사항 | 실제 코드 | 17단계 판단 |
| --- | --- | --- | --- |
| 차량 사진 | 1장 이상 업로드 필요 | `image` 1장만 처리 | 다중 업로드로 보강 필요 |
| 이미지 저장 | 1차는 `/uploads`, 운영은 외부 스토리지 검토 | `/uploads`만 사용 | fallback은 즉시 보강, 외부 스토리지는 사용자 승인 필요 |
| 제조사 검색 | 요구사항 예시는 선택형 제조사 | 실제 등록도 허용 목록만 통과 | 등록은 선택 + 직접 입력을 허용하는 방향 추천 |
| UI 개선 | Modern Car Marketplace 지향 | 이미 Tailwind지만 상세 갤러리와 폼 UX는 제한적 | 화면 단위 점진 개선 추천 |
| 관리자 기능 | 관리자 화면 존재 | 입력 단위 설정 기능 없음 | 설정 컬렉션/API 추가 여부 확인 필요 |

## 6. 구현 목표

1. 차량 등록/수정에서 제조사 등 선택 항목을 더 유연하게 입력할 수 있게 한다.
2. 차량 사진을 여러 장 업로드하고 MongoDB 차량 문서에 대표 이미지와 이미지 목록을 함께 저장한다.
3. 상세 화면에서 사진 개수에 따라 큰 이미지, 썸네일, 그리드 UI가 자연스럽게 바뀌도록 개선한다.
4. 이미지 파일이 사라지거나 로딩 실패해도 깨진 이미지 대신 기본 placeholder를 보여준다.
5. 연식, 가격, 주행거리 숫자 입력에 적절한 `min`, `max`, `step`을 적용한다.
6. 관리자 설정으로 숫자 입력 단위와 선택지 정책을 관리할 수 있는 1차 구조를 만든다.
7. 차량 등록/상세/목록 중심 UI를 더 이미지 중심의 모던 마켓 스타일로 다듬는다.
8. Render 무료 환경의 업로드 비영속성 한계와 이번 해결 범위를 문서에 명확히 남긴다.

## 7. 백엔드 변경 계획

### 7.1 차량 선택 항목 유연화

추천 구현 위치:

| 파일 | 계획 |
| --- | --- |
| `backend/utils/normalizers.js` | 제조사 검증을 허용 목록 전용에서 `2~40자 문자열` 허용으로 완화 |
| `backend/services/cars.service.js` | 기존 `normalizeCarInput` 흐름 유지, `company`는 trim 후 대문자 저장 |
| `frontend/src/components/CarForm.jsx` | select + 직접 입력 또는 datalist 방식으로 변경 |

추천 방향:

- 제조사는 기존 추천 목록을 보여주되 직접 입력도 허용한다.
- 서버는 제조사 값을 무조건 기존 목록에 제한하지 않고 길이/문자열 기준으로 검증한다.
- 차종과 연료도 UX상 직접 입력이 필요하면 같은 방식으로 확장할 수 있으나, 1차 추천은 제조사부터 완화한다.

주의:

- 검색 필터의 제조사 선택지는 기존 목록 + 실제 등록된 제조사 후보를 보여줄 수 있다.
- 실제 등록된 제조사 후보 조회 API를 새로 만들면 API 표면이 늘어나므로 사용자 확인 후 진행한다.

### 7.2 다중 이미지 업로드

추천 구현 위치:

| 파일 | 계획 |
| --- | --- |
| `backend/config/upload.js` | `upload.array("images", maxCarImageCount)` 추가 또는 기존 `upload` 설정 확장 |
| `backend/routes/cars.routes.js` | `upload.single("image")`에서 `upload.array("images", 8)` 중심으로 전환, 기존 `image` 필드 호환 검토 |
| `backend/services/cars.service.js` | `imageUrls` 배열 저장, 대표 이미지 `imageUrl`은 첫 번째 이미지로 유지 |
| `backend/utils/normalizers.js` | 클라이언트가 임의로 보낸 `imageUrls` 조작 방지 |
| `frontend/src/components/CarForm.jsx` | `multiple` 파일 선택, 선택한 파일 목록/미리보기 표시 |

추천 데이터 형태:

```json
{
  "imageUrl": "/uploads/xxx-main.jpg",
  "imageUrls": [
    "/uploads/xxx-main.jpg",
    "/uploads/xxx-side.jpg",
    "/uploads/xxx-interior.jpg"
  ]
}
```

호환 기준:

- 기존 차량은 `imageUrls`가 없어도 `imageUrl` 하나로 정상 표시한다.
- 새 차량은 `imageUrls`를 저장하고 `imageUrl`은 목록/상담방 대표 이미지 호환을 위해 유지한다.
- 수정 시 새 사진을 선택하지 않으면 기존 사진 배열을 유지한다.

추천 제한:

| 항목 | 추천값 |
| --- | --- |
| 최대 이미지 수 | 8장 |
| 파일 1개 크기 | 기존 5MB 유지 |
| 허용 형식 | jpg, jpeg, png, webp 유지 |
| 업로드 필드 | 새 구조는 `images`, 기존 호환은 `image` 검토 |

### 7.3 이미지 fallback과 깨짐 방지

추천 구현 위치:

| 파일 | 계획 |
| --- | --- |
| `frontend/src/components/CarDetail.jsx` | `onError` fallback, 이미지 배열 정규화 helper 적용 |
| `CarCardGrid.jsx`, `CarTable.jsx`, `DealerDashboard.jsx`, `ChatRoomList.jsx`, `ChatRoom.jsx` | 공통 fallback 패턴 적용 |
| `frontend/src/App.jsx` 또는 별도 helper | 이미지 URL 정규화 함수 후보 |
| `README.md`, `docs/deploy-guide.md`, `docs/deploy-checklist.md` | Render 파일 비영속성과 fallback 범위 문서화 |

1차 해결 범위:

- 이미지 경로가 비어 있거나 브라우저 로딩 실패 시 `/uploads/default-car.png` 또는 `/uploads/pre-default-car.png`로 대체한다.
- 상세 화면 썸네일은 실제 이미지가 있는 개수만 표시한다.
- 업로드 파일이 사라진 경우에도 화면이 깨져 보이지 않게 한다.

근본 해결 범위:

- 재배포 후에도 사용자가 업로드한 실제 사진을 유지하려면 S3, Cloudinary 같은 외부 이미지 스토리지가 필요하다.
- 외부 스토리지 도입은 환경변수, 패키지, 저장 방식이 바뀌므로 이번 문서의 사용자 확인 후 별도 범위로 진행한다.

### 7.4 관리자 설정 API와 저장 구조

추천 구현 위치:

| 파일 | 계획 |
| --- | --- |
| `backend/services/settings.service.js` | 설정 조회/수정 서비스 추가 후보 |
| `backend/routes/settings.routes.js` | `/api/settings`, `/api/settings/car-form` 후보 |
| `backend/server.js` | settings 라우터 등록 |
| `backend/services/collections.js` | `settings` 컬렉션 helper 추가 후보 |
| `backend/middleware/auth.js` | 설정 수정은 `requireAdmin` 적용 |

추천 저장 형태:

```json
{
  "key": "carForm",
  "priceStep": 100,
  "mileageStep": 1000,
  "yearStep": 1,
  "maxImageCount": 8,
  "updatedAt": "2026-06-07T00:00:00.000Z",
  "updatedBy": "admin-uid"
}
```

추천 기본값:

| 설정 | 기본값 | 설명 |
| --- | --- | --- |
| `yearStep` | `1` | 연식은 1년 단위 |
| `priceStep` | `100` | 가격은 100만원 단위 |
| `mileageStep` | `1000` | 주행거리는 1,000km 단위 |
| `maxImageCount` | `8` | 차량 사진 최대 8장 |

주의:

- 새 `settings` 컬렉션 추가는 큰 구조 변경은 아니지만 관리자 설정 저장 구조가 생기므로 사용자 확인 후 진행한다.
- 설정 API를 만들지 않는 단기안은 프론트 상수로 `step`만 적용하는 방식이다.

### 7.5 외부 이미지 스토리지 후보

이번 작업의 선택지:

| 선택지 | 설명 | 장점 | 단점 |
| --- | --- | --- | --- |
| A. `/uploads` 유지 + fallback 강화 | 현재 구조 유지 | 변경이 작고 빠름 | 재배포 후 실제 업로드 사진은 사라질 수 있음 |
| B. 외부 스토리지 도입 | S3/Cloudinary 등 사용 | 재배포 후 사진 유지 | 환경변수, 패키지, 업로드 로직 변경 필요 |

추천:

- 이번 17단계 1차 구현은 A를 진행한다.
- B는 운영 품질을 위해 필요하지만, AGENTS.md 기준 외부 이미지 스토리지 도입은 사용자 확인 후 별도 단계로 진행한다.

## 8. 프론트엔드 변경 계획

### 8.1 차량 등록/수정 폼 UX

추천 구현 위치:

| 파일 | 계획 |
| --- | --- |
| `frontend/src/components/CarForm.jsx` | 제조사 직접 입력, 숫자 step, 다중 이미지 선택/미리보기, 업로드 개수 안내 |
| `frontend/src/App.jsx` | FormData 생성 시 `images` 배열 전송 |
| `frontend/src/style.css` | 공통 input/file/preview class 보강 |

세부 계획:

- 제조사는 추천 버튼 또는 datalist를 제공하고 직접 입력도 가능하게 한다.
- 숫자 입력은 설정값 또는 기본값을 사용해 `step`을 지정한다.
- 다중 파일 선택 후 썸네일 미리보기를 제공한다.
- 최대 개수와 파일 크기 안내를 폼 안에서 명확히 보여준다.
- 수정 화면에서는 기존 이미지 목록을 보여주고, 새 이미지를 선택하지 않으면 기존 이미지를 유지한다.

### 8.2 차량 상세 갤러리

추천 구현 위치:

| 파일 | 계획 |
| --- | --- |
| `frontend/src/components/CarDetail.jsx` | 대표 이미지 선택 상태, 썸네일 목록, 이미지 개수별 그리드 |

이미지 개수별 UI:

| 이미지 개수 | UI |
| --- | --- |
| 0장 | 큰 placeholder 1개 표시 |
| 1장 | 큰 이미지 1개만 표시, 반복 썸네일 제거 |
| 2~4장 | 큰 이미지 + 실제 썸네일 개수만 표시 |
| 5장 이상 | 큰 이미지 + 썸네일 4~6개, 초과 개수 표시 후보 |

추가 UX:

- 썸네일 클릭 시 큰 이미지가 바뀐다.
- 이미지 로딩 실패 시 해당 칸만 placeholder로 바꾼다.
- 모바일에서는 가로 스크롤 썸네일 또는 2열 그리드로 표시한다.

### 8.3 목록/상담/관리 화면 이미지 안정화

추천 구현 위치:

| 파일 | 계획 |
| --- | --- |
| `CarCardGrid.jsx` | 대표 이미지 fallback 적용 |
| `CarTable.jsx` | 대표 이미지 fallback 적용 |
| `DealerDashboard.jsx` | 대표 이미지 fallback 적용 |
| `ChatRoomList.jsx`, `ChatRoom.jsx` | 상담방 차량 이미지 fallback 적용 |

기준:

- 우선순위는 `imageUrls[0]` → `imageUrl` → 기본 placeholder다.
- 이미지 로딩 실패 시 `event.currentTarget.src`를 placeholder로 바꾼다.

### 8.4 관리자 설정 화면

추천 구현 위치:

| 파일 | 계획 |
| --- | --- |
| `frontend/src/components/AdminUserPanel.jsx` 또는 신규 `AdminSettingsPanel.jsx` | 입력 단위 설정 UI 추가 |
| `frontend/src/App.jsx` | 설정 조회/저장 API 연결 |

추천 UI:

- 관리자 화면 안에 `차량 등록 설정` 섹션을 추가한다.
- 가격 단위, 주행거리 단위, 최대 이미지 개수를 숫자 input으로 관리한다.
- 설정 저장 버튼은 admin만 사용 가능하게 한다.
- 설정 조회 실패 시 기본값을 사용하고 안내 메시지를 표시한다.

주의:

- 관리자 설정 기능은 새 API와 새 컬렉션이 필요할 수 있으므로 사용자 승인 후 진행한다.

### 8.5 모던 UI 개선

추천 적용 범위:

| 화면 | 개선 방향 |
| --- | --- |
| 차량 목록 | 카드 이미지 비중 확대, 가격/스펙 시각 계층 강화 |
| 차량 상세 | 갤러리 중심 레이아웃, CTA와 스펙 영역 정돈 |
| 차량 등록 | 섹션형 폼 유지하되 파일 업로드 영역을 더 고급스럽게 개선 |
| 관리자 | 설정 섹션은 업무형 테이블/폼 톤 유지 |

이번 단계 기준:

- 순수 Tailwind CSS와 기존 `c-*` 유틸리티를 활용한다.
- daisyUI class는 사용하지 않는다.
- 색상 체계는 기존 blue/slate 기반을 유지하되 자동차 이미지가 더 돋보이도록 여백, 테두리, hover, shadow를 정리한다.
- 전체 대규모 리브랜딩은 하지 않고 차량 등록/상세/이미지 관련 화면을 우선 개선한다.

## 9. 변경하지 않을 항목

| 항목 | 처리 |
| --- | --- |
| Render Web Service 단일 배포 구조 | 유지 |
| API 기본 경로 | 유지 |
| Socket.io 이벤트 이름 | 유지 |
| Firebase 프로젝트 설정 | 변경하지 않음 |
| GitHub Actions 배포 방식 | 변경하지 않음 |
| MongoDB 기존 컬렉션 대규모 재설계 | 진행하지 않음 |
| 실제 DB 데이터 삭제 또는 초기화 | 진행하지 않음 |
| OpenAI 등 실제 AI Agent API 연동 | 진행하지 않음 |

## 10. 작업 순서

1. 사용자 확인 항목에 대한 승인 내용을 확정한다.
2. 차량 이미지 데이터 정책을 `imageUrl` + `imageUrls` 호환 방식으로 확정한다.
3. `backend/config/upload.js`와 차량 라우터를 다중 이미지 업로드 기준으로 보강한다.
4. 차량 생성/수정 서비스에서 `imageUrls` 배열과 대표 `imageUrl`을 저장한다.
5. 제조사 검증을 직접 입력 허용 기준으로 완화한다.
6. 프론트 `CarForm`에서 제조사 직접 입력, 숫자 step, 다중 이미지 선택/미리보기를 구현한다.
7. `App.jsx`의 FormData 전송을 다중 이미지 필드 기준으로 보강한다.
8. `CarDetail` 갤러리를 이미지 개수별 UI로 개선한다.
9. 목록/상담/관리 화면의 이미지 fallback을 공통 기준으로 정리한다.
10. 사용자 승인 시 관리자 설정 API와 화면을 추가한다.
11. `README.md`, `docs/deploy-guide.md`, `docs/deploy-checklist.md`에 이미지 비영속성/fallback/다중 업로드 내용을 갱신한다.
12. 구현 완료 문서 `docs/steps/2026-06-07-17-car-ux-media-settings.md`를 작성한다.
13. PR 요약 문서 `docs/pr/2026-06-07-17-car-ux-media-settings-pr.md`를 작성한다.
14. `docs/progress.md`에 17단계 결과를 기록한다.

## 11. 리스크와 대응

| 리스크 | 대응 |
| --- | --- |
| 기존 차량에는 `imageUrls`가 없음 | `imageUrl` 단일 값과 완전 호환되도록 이미지 정규화 helper 사용 |
| Render 재배포 후 실제 업로드 사진이 사라짐 | fallback으로 깨진 UI는 막고, 실제 영구 보관은 외부 스토리지 별도 승인 후 처리 |
| 다중 이미지 업로드로 용량과 요청 시간이 증가 | 최대 8장, 파일당 5MB 유지, 오류 메시지 명확화 |
| 관리자 설정 API 추가로 범위가 커짐 | 기본 step 상수 적용과 관리자 설정 API를 분리 승인 |
| 제조사 직접 입력 허용으로 값이 제각각 저장됨 | trim, 대문자, 길이 검증으로 최소 정규화 |
| 수정 화면에서 기존 이미지 삭제/순서 변경까지 포함하면 복잡해짐 | 1차는 새 이미지 선택 시 전체 교체, 기존 유지 지원을 추천 |
| UI 개선이 대규모 리브랜딩으로 커질 수 있음 | 차량 등록/상세/이미지 관련 화면을 우선 범위로 제한 |

## 12. 검증 기준

| 검증 | 기준 |
| --- | --- |
| 서버 문법 확인 | 수정한 `backend/**/*.js`에 대해 `node --check` 성공 |
| 프론트 빌드 | `npm.cmd --prefix frontend run build` 성공 |
| 루트 빌드 | `npm.cmd run build` 성공 |
| 제조사 직접 입력 | 기존 목록 밖 제조사도 길이 기준을 통과하면 등록 가능 |
| 다중 이미지 등록 | 2장 이상 업로드 시 `imageUrls` 배열과 대표 `imageUrl` 저장 |
| 기존 차량 호환 | `imageUrls`가 없는 기존 차량도 목록/상세/상담 화면에서 정상 표시 |
| 상세 갤러리 | 이미지 개수에 따라 반복 썸네일 없이 표시 |
| 이미지 fallback | 없는 파일 URL이나 깨진 이미지가 placeholder로 대체 |
| 숫자 입력 step | 연식/가격/주행거리 입력 단위가 목적에 맞게 적용 |
| 관리자 설정 | 승인 시 admin만 입력 단위와 최대 이미지 수 저장 가능 |
| 문서 검증 | README/배포 문서/Step/PR/progress에 변경 내용 반영 |

실제 MongoDB/Firebase 환경에서의 API 실동작 검증은 로컬 `.env` 준비 여부에 따라 제한될 수 있다.

## 13. 코드 수정 전 확인 질문

아래 방향으로 진행해도 되는지 확인이 필요하다.

1. 차량 이미지는 기존 `imageUrl`을 대표 이미지로 유지하고, 새 필드 `imageUrls` 배열을 추가하는 호환 방식으로 진행해도 되는가?
2. 다중 이미지 업로드는 최대 8장, 파일당 5MB, jpg/jpeg/png/webp 유지로 진행해도 되는가?
3. 수정 화면에서 새 이미지를 선택하면 기존 이미지 목록을 전체 교체하고, 선택하지 않으면 기존 이미지를 유지하는 1차 정책으로 진행해도 되는가?
4. 제조사는 기존 추천 목록을 유지하되 직접 입력도 허용하고, 서버 검증은 `2~40자` 문자열 기준으로 완화해도 되는가?
5. 가격 입력 단위는 기본 `100만원`, 주행거리는 `1,000km`, 연식은 `1년`, 최대 사진 개수는 `8장`을 기본값으로 해도 되는가?
6. 관리자 설정을 위해 새 `settings` 컬렉션과 `/api/settings` 계열 API를 추가해도 되는가? 보수적인 대안은 이번 단계에서 프론트/서버 상수만 적용하는 방식이다.
7. 재배포 후 이미지 깨짐의 1차 해결은 placeholder fallback 강화로 진행하고, S3/Cloudinary 같은 외부 이미지 스토리지는 별도 작업으로 미뤄도 되는가?
8. UI 개선 범위는 차량 등록 폼, 차량 상세 갤러리, 이미지가 보이는 목록/상담/딜러 화면의 안정화와 모던화로 제한해도 되는가?

## 14. 이번 계획의 결론

17단계의 핵심은 “차량을 더 자유롭게 등록하고, 사진은 실제 개수만큼 신뢰감 있게 보여주며, 깨진 이미지는 사용자에게 노출하지 않는다”는 것이다.

사용자 승인 후에는 위 순서대로 구현하고, 검증 결과와 한글 Conventional Commit 메시지를 함께 정리한다.
