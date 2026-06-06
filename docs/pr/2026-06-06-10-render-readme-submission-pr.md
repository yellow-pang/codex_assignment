# PR: Render/GitHub Actions 문서와 README 제출용 정리

## PR 제목

```text
docs: Render 배포 문서와 README 제출용 정리
```

## 작업 배경

MongoDB Atlas, Firebase Authentication, 차량 사진 업로드, Socket.io 실시간 상담, 딜러 온라인 상태까지 구현된 상태에서 제출용 README와 배포 문서를 현재 상태 기준으로 정리할 필요가 있었다.

사용자는 `.env.example`이 업데이트될 때마다 실제 Render Environment도 갱신했으며, 현재 Render 배포가 완료된 상태라고 확인했다.
이번 PR은 실제 배포 구조를 바꾸지 않고, 문서만 제출 기준으로 정리한다.

## 변경 내용

### README 제출용 정리

- README를 제출자가 바로 읽을 수 있는 구조로 재작성했다.
- 실제 Render 배포 URL을 추가했다.
- 주요 기능, 기술 스택, 실행 방법, 환경변수, Render 배포, GitHub Actions, 주요 API, Socket.io 이벤트, AI Agent 확장 준비, 검증 결과, 주의사항을 정리했다.
- `.env.example`의 환경변수 이름이 Render Environment에 반영된 상태라고 기록했다.
- 실제 Secret 값은 작성하지 않았다.

### 배포 가이드 정리

- `docs/deploy-guide.md`에 실제 Render 배포 URL을 추가했다.
- 단일 Render Web Service에서 Express API, React 정적 파일, Socket.io를 함께 제공한다는 점을 보강했다.
- GitHub Actions workflow가 문서와 일치하므로 수정하지 않는다고 기록했다.
- 과제 제출용 설명 문구를 현재 구현 기능 기준으로 갱신했다.

### 배포 체크리스트 정리

- `docs/deploy-checklist.md`에 현재 배포 URL을 추가했다.
- 사용자 확인 기준 완료 항목과 기능별 확인 항목을 분리했다.
- Render Environment가 `.env.example` 기준으로 반영된 상태라고 기록했다.

### 향후 개발 계획서와 진행 기록

- `docs/실시간_Car_Market_향후_개발_계획서.md`의 Render/GitHub Actions 문서 업데이트와 README 제출용 정리 단계에 보정 기록을 추가했다.
- `docs/progress.md`에 10단계 진행 기록을 추가했다.
- Plan 문서와 Step 문서를 추가했다.

## 변경 파일

```text
README.md
docs/deploy-guide.md
docs/deploy-checklist.md
docs/실시간_Car_Market_향후_개발_계획서.md
docs/progress.md
docs/plans/plan-10-render-readme-submission.md
docs/steps/2026-06-06-10-render-readme-submission.md
docs/pr/2026-06-06-10-render-readme-submission-pr.md
```

## 보존된 항목

| 항목                              | 이유                                                      |
| --------------------------------- | --------------------------------------------------------- |
| 기능 코드                         | 이번 작업은 문서 정리 단계                                |
| `.env.example` 환경변수 이름      | Render Environment에 이미 반영된 상태이므로 변경하지 않음 |
| `.github/workflows/deploy.yml`    | 문서와 실제 workflow가 일치하므로 변경하지 않음           |
| Render Web Service 단일 배포 구조 | 현재 배포 구조 유지                                       |
| Secret 값                         | 문서에 실제 비밀값을 작성하지 않음                        |

## 검증

실행 완료:

```text
npm.cmd --prefix frontend run build
npm.cmd run build
```

결과:

```text
성공
```

참고:

- `npm.cmd run build`에서 moderate 취약점 2개가 보고되었지만, 강제 업데이트는 이번 범위에서 제외했다.
- Vite가 `.env`의 `NODE_ENV=production`에 대해 경고를 출력했지만 빌드는 성공했다.
- Render 배포 완료와 환경변수 반영 상태는 사용자 확인 기준으로 문서화했다.

## 남은 리스크

- 실제 Secret 값은 문서화하지 않았으므로, 운영 환경 문제는 Render Environment에서 직접 확인해야 한다.
- Render 무료 환경에서는 `/uploads` 파일이 재배포 또는 서버 재시작 후 유지되지 않을 수 있다.
- 제출 전 실제 Render URL에서 로그인, 차량 검색, 사진 업로드, 상담 기능을 가능한 범위에서 최종 확인해야 한다.

## 체크리스트

- [x] 작업 전 브랜치와 변경 상태를 확인했다.
- [x] 구현 전 계획 문서를 작성하고 사용자 확인을 받았다.
- [x] README에 실제 Render 배포 URL을 추가했다.
- [x] `.env.example`과 Render Environment 반영 상태를 문서화했다.
- [x] 실제 Secret 값은 문서에 작성하지 않았다.
- [x] 환경변수 이름을 변경하지 않았다.
- [x] GitHub Actions workflow 파일을 변경하지 않았다.
- [x] 배포 가이드를 현재 구현 기준으로 정리했다.
- [x] 배포 체크리스트를 현재 구현 기준으로 정리했다.
- [x] 향후 개발 계획서에 보정 기록을 추가했다.
- [x] 프론트엔드 빌드를 실행했다.
- [x] 루트 빌드를 실행했다.
- [ ] 제출 전 실제 Render URL에서 주요 기능을 최종 확인한다.
- [ ] PR 생성 전 사용자가 커밋한다.
