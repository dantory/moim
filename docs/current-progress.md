# 현재 진행 상황 기록

## 1. 목적

이 문서는 지금까지 구현된 기능과, 다음 세션에서 이어서 해야 할 작업을 빠르게 파악하기 위한 작업 기록이다.

다음에 개발을 재개할 때 이 문서를 먼저 읽고 시작한다.

---

## 2. 현재까지 구현된 내용

### 2.1 공통 구조 정리

완료

- 모임 카테고리, 생성/수정/조회 검증 스키마를 공용화했다.
- 목록 조회/거리 필터 로직을 서비스 계층으로 분리했다.
- 수정 API 계약을 `PUT/PATCH` 모두 허용하도록 정리했다.
- 폼에서 위치 좌표를 다루는 방식을 안정화했다.
- 참여 인원 처리 로직을 트랜잭션 기반으로 보강했다.

관련 파일

- `lib/meeting-schema.ts`
- `lib/meeting-service.ts`
- `app/api/meetings/route.ts`
- `app/api/meetings/[id]/route.ts`
- `app/api/meetings/[id]/join/route.ts`
- `app/components/meetings/MeetingForm.tsx`

### 2.2 제품/설계 문서화

완료

- 서비스 방향 정리
- 도메인 모델 초안
- MVP IA 및 핵심 플로우
- 2주 로드맵

관련 문서

- `docs/product-direction.md`
- `docs/domain-model-draft.md`
- `docs/mvp-ia-and-flows.md`
- `docs/two-week-roadmap.md`

### 2.3 사용자 재방문 흐름

완료

- `내 활동` 페이지 추가
- 내가 만든 모임, 참여 중인 모임, 예정 일정 확인 가능
- 헤더에 `내 활동` 진입 링크 추가

관련 파일

- `app/me/page.tsx`
- `app/components/ui/Header.tsx`

### 2.4 운영자 진입점

완료

- 운영자 대시보드 초안 추가
- 모임 상세에서 모임장만 `운영보기` 버튼 노출

관련 파일

- `app/meetings/[id]/admin/page.tsx`
- `app/meetings/[id]/page.tsx`

### 2.5 출결 기능

완료

- `MeetingAttendance` 모델 추가
- 출결 상태: `PRESENT`, `LATE`, `ABSENT`
- 운영자 전용 출결 관리 페이지 추가
- 참여자별 출결 상태 저장/수정/초기화 가능
- 대시보드에 출결 요약 반영

관련 파일

- `prisma/schema.prisma`
- `prisma/migrations/20260408124500_add_meeting_attendance/migration.sql`
- `app/api/meetings/[id]/attendance/route.ts`
- `app/meetings/[id]/attendance/page.tsx`
- `app/meetings/[id]/attendance/AttendanceManager.tsx`
- `lib/attendance.ts`

### 2.6 게스트 기능

완료

- `MeetingGuest` 모델 추가
- 운영자 전용 게스트 관리 페이지 추가
- 게스트 등록/삭제 가능
- 연락처/메모 저장 가능
- 대시보드에 게스트 수 요약 반영

관련 파일

- `prisma/schema.prisma`
- `prisma/migrations/20260408132000_add_meeting_guest/migration.sql`
- `app/api/meetings/[id]/guests/route.ts`
- `app/meetings/[id]/guests/page.tsx`
- `app/meetings/[id]/guests/GuestManager.tsx`

### 2.7 회비 상태 기능

완료

- `MeetingFee` 모델 추가
- 회비 상태: `UNPAID`, `PAID`, `WAIVED`
- 운영자 전용 회비 상태 관리 페이지 추가
- 참여자별 회비 상태 저장/수정/초기화 가능
- 메모 저장 가능
- 대시보드에 회비 상태 요약 반영

관련 파일

- `prisma/schema.prisma`
- `prisma/migrations/20260408135500_add_meeting_fee/migration.sql`
- `app/api/meetings/[id]/fees/route.ts`
- `app/meetings/[id]/fees/page.tsx`
- `app/meetings/[id]/fees/FeeManager.tsx`
- `lib/meeting-fee.ts`

---

## 3. 현재 상태 요약

지금은 `Meeting` 중심 구조 안에서 MVP 운영 기능의 핵심 3축이 들어간 상태다.

- 출결
- 게스트
- 회비 상태

즉, 현재 앱은 아래 수준까지 와 있다.

- 모임 탐색
- 모임 생성/수정/참여
- 내 활동 확인
- 운영자 대시보드
- 출결 관리
- 게스트 관리
- 회비 상태 관리

---

## 4. 아직 남아 있는 핵심 작업

### 우선순위 1. 운영자 대시보드 고도화

아직 대시보드는 진입점 수준이다.

다음에 보강할 것

- 출결/게스트/회비를 한눈에 보는 통합 요약
- 관리가 필요한 참여자 강조
  - 미납
  - 미체크 출결
- 오늘 운영 체크리스트 정리

### 우선순위 2. 모임 상세 신뢰 정보 강화

지금 상세 페이지에는 운영 판단 정보가 부족하다.

추가할 것

- 모집 상태
- 최근 출석 인원 요약
- 회비 유무/운영 방식
- 대상 연령대 자리
- 가입 방식 자리

### 우선순위 3. 내 활동 페이지 확장

지금은 모임 목록 중심이다.

추가할 것

- 최근 출결 상태
- 참여 중 모임의 회비 상태
- 운영 중 모임의 관리 알림

### 우선순위 4. 통합 운영 보기

출결, 게스트, 회비는 각각 페이지가 생겼지만 운영자는 한 번에 보고 싶어할 가능성이 높다.

추가할 것

- 운영자 대시보드에서 미납자, 미출결자, 게스트 현황을 바로 확인
- 상세 액션 링크를 줄이고 “지금 필요한 조치”를 중심으로 재구성

---

## 5. 구조적으로 다음에 꼭 해야 할 일

현재는 `Meeting` 중심 구조를 유지한 상태다.

장기적으로는 아래 구조로 전환해야 한다.

- `Club`
- `Membership`
- `Event`
- `Attendance`
- `GuestVisit`
- `MembershipFee`

중요

지금은 기능 검증이 우선이므로 `Meeting` 구조를 유지하고 있다.
다만 운영 기능이 더 붙기 전에 `Club/Event` 전환 설계를 실제 스키마 수준으로 시작해야 한다.

---

## 6. 다음 세션에서 바로 시작할 추천 작업

가장 추천하는 다음 시작점은 아래다.

### 추천 작업 순서

1. 운영자 대시보드 고도화
2. 모임 상세 신뢰 정보 강화
3. 내 활동 페이지에 운영 상태 반영
4. 이후 `Club/Event` 전환 설계 착수

### 다음 턴 첫 작업으로 적합한 구체 작업

- 운영자 대시보드에서
  - 미납자 수
  - 미체크 출결 수
  - 게스트 수
  - 바로 조치해야 할 참여자 목록
  를 한 화면에 요약

이 작업이 끝나면 현재까지 만든 출결/게스트/회비 기능이 따로 노는 상태에서 벗어나 실제 운영 도구처럼 보이기 시작한다.

---

## 7. DB 관련 주의사항

최근 추가한 마이그레이션

- `20260408124500_add_meeting_attendance`
- `20260408132000_add_meeting_guest`
- `20260408135500_add_meeting_fee`

주의

- 코드상으로는 구현 완료 상태다.
- 실제 환경에서 사용하려면 DB에 마이그레이션을 적용해야 한다.
- Prisma Client는 이미 재생성 완료했다.

---

## 8. 검증 상태

현재 마지막 기준으로 아래 검증은 통과했다.

- `npm run db:generate`
- `npm run lint`
- `npm run build`

---

## 9. 한 줄 결론

현재 앱은 `탐색 가능한 모임 서비스`를 넘어서 `운영 가능한 초기 스포츠 모임 관리 도구`까지 확장된 상태다.

다음에는 새로운 기능을 더 넓게 추가하기보다, 이미 만든 출결/게스트/회비를 운영자 대시보드와 상세 페이지에 더 잘 통합하는 작업을 먼저 진행하는 것이 맞다.
