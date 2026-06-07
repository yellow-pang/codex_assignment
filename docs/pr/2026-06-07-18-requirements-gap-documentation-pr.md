# PR: 요구사항 차이점 문서화

## PR 제목

```text
docs: 요구사항 차이점과 구현 판단 기준 정리
```

## 작업 배경

서비스 요구사항 정의서와 현재 구현을 비교한 결과, 일부 항목은 미구현이라기보다 과제용 제출 안정성, 보안 강화, 현재 배포 구조 때문에 다르게 구현되어 있었다.

이번 작업은 기능을 억지로 수정하지 않고, 요구사항과 다른 부분이 왜 생겼는지 문서로 남기는 것이 목적이다.

## 변경 내용

### 요구사항 차이점 정리

- 딜러 회원가입 정책이 admin 승인 기반으로 확장된 이유를 정리했다.
- 차량 사진 1장 이상 필수 요구사항과 현재 placeholder fallback 정책의 차이를 기록했다.
- 상담 메시지 저장 REST API가 없고 Socket.io 저장 흐름으로 구현된 이유를 설명했다.
- Render 분리 배포 예시와 현재 단일 Web Service 배포 유지 사유를 정리했다.
- 관리자 기능은 선택 구현 범위를 넘어 확장 구현된 항목으로 분류했다.

### 3번 구현 여부 추천

특히 `POST /api/chats/rooms/:roomId/messages` 구현 여부를 별도로 정리했다.

현재 추천은 다음과 같다.

- 화면 중심 제출이면 구현하지 않는다.
- Socket.io 상담과 MongoDB 저장을 확인하는 평가라면 구현하지 않는다.
- API 표 전체를 curl/Postman으로 직접 확인하는 평가라면 얇은 REST API 추가를 별도 단계로 검토한다.

### 브랜치와 커밋 기준

- 이번 작업은 문서만 추가하는 작은 작업이므로 `dev`에서 커밋해도 된다고 정리했다.
- 새 브랜치가 필요하다면 `docs/requirements-gap-notes`를 제안했다.

## 변경 파일

```text
docs/steps/2026-06-07-18-requirements-gap-documentation.md
docs/pr/2026-06-07-18-requirements-gap-documentation-pr.md
docs/progress.md
```

## 보존된 항목

| 항목 | 내용 |
| --- | --- |
| 기능 코드 | 변경 없음 |
| API 경로 | 변경 없음 |
| Socket.io 이벤트 | 변경 없음 |
| MongoDB 컬렉션 구조 | 변경 없음 |
| Firebase 설정 | 변경 없음 |
| Render 배포 구조 | 변경 없음 |

## 검증

이번 작업은 문서 추가 작업이므로 별도 빌드는 실행하지 않아도 된다.

직전 요구사항 점검에서 확인한 결과:

```text
node --check 주요 백엔드 파일 → 성공
npm.cmd run build             → 성공
```

참고:

- 빌드 중 기존 frontend 의존성 moderate 취약점 2건과 `.env`의 `NODE_ENV=production` 관련 Vite 경고가 표시되었지만 빌드는 성공했다.

## 체크리스트

- [x] 요구사항과 다른 부분을 기능 부족/정책 확장/배포 구조 차이로 구분했다.
- [x] 3번 REST 메시지 저장 API 구현 여부 추천 범위를 정리했다.
- [x] 이번 단계에서는 코드 변경 없이 문서만 추가했다.
- [x] 커밋 메시지로 사용할 한글 Conventional Commit 문구를 준비했다.
