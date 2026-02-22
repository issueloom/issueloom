# 변경 이력

[English](./CHANGELOG.md)

## [0.2.0] - 2026-02-22

피드백 반영 업데이트.

### Bug Fixes

- **줄바꿈 정규화**: MCP 도구 호출 시 `\\n` 리터럴이 저장되던 문제 수정
  - `validation.js`에 `normalizeNewlines()` 추가
  - `description`, `content` 필드 저장 전 자동 정규화
  - LLM 에이전트의 JSON 구성 오류를 서버에서 보정하는 입력 정규화 성격

### New Features

- **`bulk_update_issues` MCP 도구 추가**: 여러 이슈의 상태를 일괄 변경
  - 사전 검증 방식: 실행 전 모든 이슈 번호를 확인, 유효하지 않은 건이 있으면 변경 없이 에러 반환
  - 전체 유효 시 트랜잭션으로 일괄 처리
  - 이터레이션 마무리 시 다수 이슈를 한 번에 resolved 처리하는 용도

- **블로킹 의존 관계 표시**: 기존 `blocks` relation_type 데이터를 목록/요약에 노출
  - `list_issues` 응답에 `blocked_by` 이슈 번호 배열 추가
  - `get_summary` 응답에 "현재 블로킹된 이슈" 섹션 추가
  - 웹 뷰어 목록 페이지에 블로킹 상태 아이콘/뱃지 표시

- **웹 뷰어 관계 관리**: 이슈 상세 페이지에서 관계 추가/삭제 기능
  - 관계 추가/삭제 API 엔드포인트 추가
  - 이슈 상세 페이지 UI에서 관계 관리 가능 (디렉터 보조 수단)

- **웹 뷰어 범례에 Blocked 설명 추가**: Legend 컴포넌트 Status 섹션에 Blocked 뱃지 및 설명 추가
  - Blocked 뱃지 사이즈를 다른 Status 뱃지와 동일하게 통일
  - 범례와 이슈 목록에서의 정렬(vertical-align) 보정
  - 범례에서 마우스 오버 시 이슈 목록에서의 동작 안내 툴팁 표시

## [0.1.0] - 2026-02-20

초기 릴리스.

### Features

- **DB + MCP 서버 (Phase 1)**: SQLite WAL 모드, 8개 MCP 도구
  - init_tracker, create_issue, list_issues, get_issue, update_issue, add_comment, link_issues, get_summary
- **웹 뷰어 백엔드 (Phase 2)**: Express API 7개 엔드포인트
- **웹 뷰어 프론트엔드 (Phase 3)**: React 19 + Vite 6, Dashboard/IssueList/IssueDetail
- **패키징 (Phase 4)**: npm 배포용 구성 완료

### Security

- SQL 인젝션 방지 (파라미터 바인딩 필수)
- Stored Prompt Injection 방지 (데이터 프레이밍)
- 웹 뷰어: Host 검증, CSRF 토큰, XSS 방지
- DB 경로 Path Traversal 차단
