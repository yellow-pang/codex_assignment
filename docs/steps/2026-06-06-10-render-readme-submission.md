# 10단계 Render/GitHub Actions 문서 업데이트와 README 제출용 정리 구현 상세

## 1. 작업 목표

이번 단계는 기능 구현이 아니라 제출 전 문서 정리 작업이다.
현재 구현된 기능과 실제 Render 배포 상태를 기준으로 README, 배포 가이드, 배포 체크리스트, 향후 개발 계획서, 진행 기록을 정리했다.

사용자 확인 사항:

- 실제 Render 배포 URL은 `https://codex-assignment.onrender.com/`이다.
- `.env.example`에 정리된 환경변수 이름은 실제 Render Environment에 반영되어 있다.
- 실제 Secret 값은 문서에 작성하지 않는다.
- 환경변수 이름은 변경하지 않는다.
- GitHub Actions workflow는 문서와 실제가 일치하면 수정하지 않는다.
- README에는 로컬 빌드 성공과 Render 배포 완료 상태를 함께 남긴다.

## 2. 변경 요약

| 파일                                                   | 변경 내용                                                             |
| ------------------------------------------------------ | --------------------------------------------------------------------- |
| `README.md`                                            | 제출용 구조로 재작성                                                  |
| `docs/deploy-guide.md`                                 | 실제 Render URL, 환경변수 반영 상태, workflow 유지 기준 보강          |
| `docs/deploy-checklist.md`                             | 배포 완료 확인과 기능별 확인 항목 분리                                |
| `docs/실시간_Car_Market_향후_개발_계획서.md`           | Render/GitHub Actions 문서 업데이트와 README 제출 정리 보정 기록 추가 |
| `docs/progress.md`                                     | 10단계 진행 기록 추가                                                 |
| `docs/plans/plan-10-render-readme-submission.md`       | 계획과 사용자 확인 완료 사항 정리                                     |
| `docs/pr/2026-06-06-10-render-readme-submission-pr.md` | PR 요약 문서 추가                                                     |

## 3. README 정리 내용

README를 아래 순서로 재구성했다.

1. 프로젝트 소개
2. 배포 URL
3. 주요 기능
4. 기술 스택
5. 실행 방법
6. 환경변수
7. Render 배포와 GitHub Actions
8. 주요 API
9. Socket.io 이벤트
10. AI Agent 확장 준비
11. 검증 결과
12. 주의사항과 한계

실제 Render 배포 URL:

```text
https://codex-assignment.onrender.com/
```

README에는 `.env.example`의 환경변수 이름이 Render Environment에 반영되었다는 사용자 확인을 남겼다.
단, MongoDB 접속 문자열, Firebase 실제 값, Render/GitHub Secret 값은 작성하지 않았다.

## 4. 배포 문서 정리 내용

### deploy-guide

- 현재 배포 URL을 추가했다.
- `.env.example` 환경변수 이름이 Render Environment에 반영된 상태라고 기록했다.
- 단일 Render Web Service에서 Express API, React 정적 파일, Socket.io를 함께 제공한다는 점을 명확히 했다.
- GitHub Actions workflow가 현재 설명과 일치하므로 수정하지 않는다고 기록했다.
- 과제 제출용 설명 문구를 현재 구현 기능 기준으로 갱신했다.

### deploy-checklist

- 현재 배포 URL을 구조 판단 표에 추가했다.
- 사용자 확인 기준 완료 항목을 별도로 만들었다.
- 기능별 확인 항목은 체크되지 않은 상태로 유지해 제출 전 수동 확인할 수 있게 했다.

## 5. GitHub Actions 처리

`.github/workflows/deploy.yml`은 수정하지 않았다.

이유:

- 현재 workflow는 `main` 브랜치 push 또는 수동 실행을 지원한다.
- Node.js 20을 사용한다.
- 루트와 프론트엔드 의존성을 설치한다.
- 테스트 스크립트가 없으면 건너뛴다.
- `npm run build` 성공 후 Render Deploy Hook을 호출한다.
- 문서에 적은 흐름과 실제 workflow가 일치한다.

배포 방식 변경은 AGENTS.md 기준 사용자 확인이 필요한 항목이므로 이번 문서 정리 단계에서 변경하지 않았다.

## 6. 검증 결과

| 검증                                  | 결과 |
| ------------------------------------- | ---- |
| `npm.cmd --prefix frontend run build` | 성공 |
| `npm.cmd run build`                   | 성공 |

참고:

- 프론트엔드 빌드는 최초 샌드박스 내부 실행에서 esbuild `spawn EPERM`이 발생할 수 있어, 필요 시 권한 상승 후 실행한다.
- `npm.cmd run build`에서 moderate 취약점 2개가 보고되었지만, 이번 작업은 문서 정리이므로 강제 업데이트는 실행하지 않았다.
- Vite가 `.env`의 `NODE_ENV=production`에 대한 경고를 출력할 수 있지만 빌드는 성공한다.

## 7. 남은 확인

- 제출 전 실제 Render URL에서 주요 기능을 가능한 범위에서 다시 확인한다.
- Render 무료 환경의 `/uploads` 파일 비영속성은 README와 배포 문서에 계속 명시한다.
- 실제 Secret 값은 README, PR 문서, 배포 문서 어디에도 작성하지 않는다.
