# PR: 차량 등록과 사진 업로드 기능 추가

## PR 제목

```text
feat: 차량 사진 업로드 기능 추가
```

## 작업 배경

`docs/실시간_Car_Market_향후_개발_계획서.md`의 4단계 차량 등록과 사진 업로드 항목에 따라, 차량 등록 데이터 구조를 신규 요구사항 기준으로 확장했다.

기존 차량 등록은 JSON 방식으로 이름, 제조사, 연식, 가격만 저장했다.
신규 요구사항에서는 딜러가 차량 사진과 차종, 연료, 주행거리, 지역, 설명을 함께 등록할 수 있어야 하므로 서버와 프론트엔드를 `multipart/form-data` 흐름으로 변경했다.

## 변경 내용

- 루트 의존성에 `multer`를 추가했다.
- 서버 시작 시 `uploads/` 폴더가 없으면 자동 생성하도록 했다.
- Express에서 `/uploads` 정적 경로를 제공하도록 했다.
- 업로드 사진은 5MB 이하의 `jpg`, `jpeg`, `png`, `webp` 파일만 허용하도록 검증했다.
- `POST /api/cars`에서 차량 정보와 사진을 `multipart/form-data`로 함께 받도록 변경했다.
- `PUT /api/cars/:id`에서도 사진 교체를 지원하도록 변경했다.
- 새 사진 없이 차량을 수정하면 기존 `imageUrl`을 유지하도록 했다.
- 차량 등록/수정 폼에 차종, 연료, 주행거리, 지역, 설명, 사진 입력을 추가했다.
- 프론트엔드 등록/수정 요청을 `FormData`로 전환했다.
- 차량 목록에 썸네일, 주행거리, 지역을 표시했다.
- 차량 상세 화면에 큰 사진, 상세 스펙, 차량 설명을 표시했다.
- 사진 없는 차량은 `/uploads/default-car.png` 기본 이미지 경로를 사용하도록 했다.
- README와 Render 배포 문서에 업로드 파일 비영속성 주의사항을 추가했다.
- 4단계 계획 문서, 상세 Step 문서, 진행 기록, PR 문서를 추가했다.

## 변경 파일

```text
.gitignore
README.md
docs/deploy-checklist.md
docs/deploy-guide.md
docs/plans/plan-04-car-photo-upload.md
docs/progress.md
docs/pr/2026-06-05-04-car-photo-upload-pr.md
docs/steps/2026-06-05-04-car-photo-upload.md
docs/실시간_Car_Market_향후_개발_계획서.md
frontend/src/App.jsx
frontend/src/components/CarDetail.jsx
frontend/src/components/CarForm.jsx
frontend/src/components/CarTable.jsx
package-lock.json
package.json
server.js
```

## 검증

```text
node --check server.js
npm.cmd run build
npm.cmd start
```

검증 결과:

- `cmd.exe /c node --check server.js`: 성공
- `npm.cmd run build`: 성공
- `npm.cmd start`: MongoDB 연결까지 성공했지만 3000번 포트가 이미 사용 중이라 `EADDRINUSE`로 종료됨
- 임시 포트 `3101` 실행: 제한 시간 안에 종료되지 않아 포트 충돌 없이 서버가 계속 실행되는 상태로 확인됨

## 남은 리스크

- 실제 사진 업로드 API 검증은 사진 샘플 파일을 준비한 뒤 브라우저 또는 curl로 추가 확인해야 한다.
- 기본 이미지 파일은 `uploads/default-car.png` 위치에 두어야 한다.
- Render 무료 환경에서는 `uploads/`에 저장된 사진이 영구 보관되지 않을 수 있다.
- 수정 시 새 사진을 올려도 기존 사진 파일을 자동 삭제하지 않는다.
- Firebase 인증과 딜러 권한 체크는 아직 구현되지 않았으므로 현재 화면에서는 누구나 등록/수정 버튼에 접근할 수 있다.
- 차량 목록 전체 카드형 UI와 daisyUI 제거는 이번 단계 범위가 아니다.

## 체크리스트

- [x] 작업 전 브랜치와 변경 상태를 확인했다.
- [x] 관련 요구사항 문서와 현재 코드를 확인했다.
- [x] 구현 전 계획 문서를 작성하고 사용자 확인을 받았다.
- [x] `multer`를 설치했다.
- [x] `/uploads` 정적 경로를 추가했다.
- [x] 차량 등록 API를 `multipart/form-data`로 확장했다.
- [x] 차량 수정 API에서 사진 교체를 지원했다.
- [x] 등록/수정 폼에 상세 필드와 사진 입력을 추가했다.
- [x] 목록과 상세 화면에서 차량 이미지를 출력했다.
- [x] Render 업로드 파일 비영속성 주의사항을 문서화했다.
- [x] 서버 JS 문법 검사를 실행했다.
- [x] 빌드를 실행했다.
- [ ] 사진 샘플 파일로 사진 업로드 API를 확인한다.
- [ ] 기본 이미지 파일이 `uploads/default-car.png` 위치에 있는지 확인한다.
- [ ] PR 생성 전 사용자가 커밋한다.
