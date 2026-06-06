# 10단계 Render/GitHub Actions 문서 업데이트와 README 제출용 정리 작업 계획

## 1. 작업 배경

현재 프로젝트는 MongoDB Atlas, Firebase Authentication, 차량 사진 업로드, Socket.io 실시간 상담, MongoDB 기반 딜러 온라인 상태까지 구현된 상태다.
AI Agent 확장은 현재 브랜치 기준으로 `handleChatMessage` 분리와 향후 확장 아이디어 문서화 수준이다.
또한 사용자는 `.env.example`이 업데이트될 때마다 실제 Render Environment도 함께 갱신했고, 현재 Render 배포도 완료된 상태라고 확인했다.

이번 단계는 기능 추가가 아니라 제출 전 문서 정리 단계다.
README, Render 배포 가이드, 배포 체크리스트, 향후 개발 계획서를 현재 구현과 배포 상태 기준으로 맞추고, GitHub Actions 흐름이 현재 구조와 일치하는지 문서상 재검토한다.

## 2. 현재 확인 상태

| 항목               | 현재 상태                                                     | 정리 방향                                        |
| ------------------ | ------------------------------------------------------------- | ------------------------------------------------ |
| 브랜치             | `docs/deploy-readme-submission`                               | 문서 정리 브랜치 유지                            |
| 워킹트리           | 깨끗함                                                        | 계획 문서부터 작성                               |
| Render 배포        | 사용자 확인 기준 현재 배포 완료                               | README와 배포 문서에 반영                        |
| Render Environment | `.env.example` 변경 시마다 실제 Render도 갱신됨               | 실제 비밀값 없이 “반영 완료 전제”로 기록         |
| GitHub Actions     | `main` push 또는 수동 실행 시 빌드 후 Render Deploy Hook 호출 | 현재 workflow와 문서 일치 여부 점검              |
| README             | 기능 설명은 있으나 제출용 구조가 짧음                         | 주요 기능, 실행, 환경변수, 배포, 검증, 한계 정리 |
| 향후 개발 계획서   | 일부 오래된 단계 설명 남아 있음                               | 구현 완료/제출 정리 기준으로 기록형 보정         |

## 3. 작업 목표

- README를 제출자가 바로 읽을 수 있는 구조로 정리한다.
- Render Web Service 단일 배포 구조와 현재 배포 완료 상태를 문서화한다.
- `.env.example`과 Render Environment가 동기화되어 있다는 사용자 확인 내용을 문서에 남긴다.
- GitHub Actions workflow의 실제 동작과 배포 문서 설명을 맞춘다.
- 배포 후 확인 항목을 현재 구현된 기능 기준으로 정리한다.
- AI Agent는 실제 API 연동이 아니라 `handleChatMessage` 분리 기반의 향후 확장 아이디어라는 점을 README와 문서에 명확히 남긴다.
- Render 무료 환경의 업로드 파일 비영속성 주의사항을 제출 문서에서 눈에 띄게 정리한다.
- 구현 완료 문서와 PR 요약 문서를 추가한다.

## 4. 예상 변경 파일

| 파일                                                   | 변경 내용                                                                    |
| ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `README.md`                                            | 제출용 소개, 주요 기능, 실행 방법, 환경변수, 배포 상태, 검증, 한계 정리      |
| `docs/deploy-guide.md`                                 | 현재 Render 배포 완료 전제, GitHub Actions 흐름, 환경변수 반영 상태 보강     |
| `docs/deploy-checklist.md`                             | 배포 후 테스트 항목을 현재 구현 기능 기준으로 재정리                         |
| `docs/실시간_Car_Market_향후_개발_계획서.md`           | Render/GitHub Actions 문서 업데이트와 README 제출용 정리 단계 보정 기록 추가 |
| `docs/progress.md`                                     | 10단계 진행 기록 추가                                                        |
| `docs/steps/2026-06-06-10-render-readme-submission.md` | 구현 상세 문서 추가                                                          |
| `docs/pr/2026-06-06-10-render-readme-submission-pr.md` | 이전 PR 문서 양식에 맞춘 PR 요약 추가                                        |

필요한 경우 `.env.example`의 설명 문구만 조정할 수 있다.
단, 환경변수 이름을 추가/변경/삭제하는 것은 사용자 확인 후에만 진행한다.

## 5. 이번 단계에서 하지 않을 일

- Render Secret 또는 GitHub Secret 값을 변경하지 않는다.
- 실제 Render 설정 화면을 조작하지 않는다.
- GitHub Actions workflow의 배포 방식은 변경하지 않는다.
- Render Web Service 단일 배포 구조를 분리 배포로 바꾸지 않는다.
- 새 npm 패키지를 추가하지 않는다.
- 기능 코드를 변경하지 않는다.
- `.env` 실제 값을 문서에 쓰지 않는다.
- 외부 AI API를 연동하지 않는다.

## 6. README 정리 방향

README는 아래 순서로 재구성한다.

1. 프로젝트 소개
2. 배포 상태
3. 주요 기능
4. 기술 스택
5. 실행 방법
6. 환경변수
7. Render 배포와 GitHub Actions
8. 주요 API와 Socket.io 이벤트
9. AI Agent 확장 준비
10. 검증 방법
11. 주의사항과 한계

초보 개발자가 이어서 실행할 수 있도록 명령어와 확인 방법을 짧고 명확하게 작성한다.

## 7. 배포 문서 정리 방향

`docs/deploy-guide.md`와 `docs/deploy-checklist.md`는 아래 기준으로 맞춘다.

- 현재 구조는 Render Web Service 단일 배포다.
- GitHub Actions는 빌드 성공 후 Render Deploy Hook을 호출한다.
- Render Environment는 `.env.example` 기준으로 갱신되어 있으며 현재 배포된 상태라는 사용자 확인을 반영한다.
- `VITE_API_BASE_URL`은 같은 origin 배포에서는 비워둘 수 있다.
- `CLIENT_URL`은 Socket.io CORS 기준으로 사용한다.
- Render 무료 환경에서는 `/uploads` 파일이 영구 보관되지 않을 수 있다.
- 배포 후 검증에는 로그인, 차량 검색, 사진 업로드, 딜러 승인, 상담방 생성, 실시간 메시지, 딜러 온라인 상태를 포함한다.

## 8. 검증 계획

문서 중심 작업이지만 가능한 범위에서 아래 검증을 실행한다.

| 검증 항목           | 명령 또는 방법                        |
| ------------------- | ------------------------------------- |
| 프론트엔드 빌드     | `npm.cmd --prefix frontend run build` |
| 루트 빌드           | `npm.cmd run build`                   |
| 문서 변경 상태 확인 | `git status --short`                  |

기능 코드를 변경하지 않는 계획이므로 `node --check server.js`는 필수는 아니지만, 최종 확인으로 실행할 수 있다.

## 9. 사용자 확인 완료 사항

사용자 확인 결과 아래 기준으로 진행한다.

1. README에 실제 Render 배포 URL을 작성한다.

```text
https://codex-assignment.onrender.com/
```

2. `.env.example`은 현재 Render Environment에 반영된 상태라는 설명을 README와 배포 문서에 남긴다.

단, 실제 Secret 값은 절대 작성하지 않는다.

3. `.env.example`의 환경변수 이름은 변경하지 않는다.

환경변수 이름 변경은 Render 재설정이 필요할 수 있으므로 이번 단계에서는 하지 않는 것을 권장한다.

4. GitHub Actions workflow 파일 `.github/workflows/deploy.yml`은 문서와 실제가 이미 일치하면 수정하지 않는다.

배포 방식 변경은 하지 않는 것을 권장한다.

5. README의 제출용 검증 결과에는 로컬 빌드 성공과 Render 배포 완료 상태를 함께 적는다.

Render 실동작 세부 항목은 사용자가 확인한 항목과 미확인 항목을 구분해 적는 것을 권장한다.

6. PR 문서는 이전 PR 문서 양식에 맞춰 `PR 제목`, `작업 배경`, `변경 내용`, `변경 파일`, `보존된 항목`, `검증`, `남은 리스크`, `체크리스트` 형식으로 작성한다.
