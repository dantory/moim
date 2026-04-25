# 도메인 모델 초안

## 1. 목적

현재 구조는 `User`, `Meeting`, `MeetingParticipant` 중심이라 모임 탐색과 참여까지는 빠르게 만들 수 있다.

하지만 아래 기능이 붙기 시작하면 현재 모델로는 한계가 빠르게 온다.

- 회원 승인
- 운영진 역할 분리
- 출결 관리
- 게스트 관리
- 회비 관리
- 장부 관리
- 반복 일정 운영

따라서 중기적으로는 `Meeting` 하나가 모든 책임을 가지는 구조에서 벗어나 `Club`과 `Event`를 분리하는 방향으로 가는 것이 맞다.

---

## 2. 현재 모델의 한계

### 현재 구조

- `User`
- `Meeting`
- `MeetingParticipant`

### 문제점

#### 1) 지속 모임과 단일 일정이 구분되지 않음

지금의 `Meeting`은 아래를 동시에 의미한다.

- 동호회 자체
- 특정 날짜의 모임 일정
- 회원이 참여하는 이벤트

이렇게 되면 같은 동호회가 매주 활동하는 구조를 표현하기 어렵다.

#### 2) 회원 상태 관리가 어려움

운영자는 회원을 아래처럼 구분하고 싶다.

- 가입 신청자
- 정회원
- 휴식 회원
- 탈퇴 회원
- 운영진

현재는 단순 참가 기록만 있어서 “회원”을 관리하기 어렵다.

#### 3) 출결/게스트/회비의 기준 단위가 없음

- 출결은 `Event` 단위로 붙어야 한다.
- 회비는 `Club` 또는 `Membership` 단위로 붙어야 한다.
- 게스트는 `Club`과 `Event` 둘 다와 연결될 수 있어야 한다.

현재 구조에서는 이런 구분이 자연스럽지 않다.

---

## 3. 추천 도메인 구조

### 핵심 개념

#### `Club`

지속적으로 운영되는 동호회 또는 모임 조직

예시

- 성수 배드민턴 클럽
- 분당 테니스 크루

#### `Event`

특정 날짜에 열리는 실제 운동 일정

예시

- 4월 10일 저녁 배드민턴 정모
- 4월 13일 토요 테니스 경기

#### `Membership`

사용자와 클럽의 관계

예시

- 가입 신청 중
- 정회원
- 운영진
- 휴식 회원

#### `Attendance`

특정 이벤트에서의 출석 기록

#### `GuestVisit`

게스트가 어떤 이벤트에 몇 번 참석했는지에 대한 기록

#### `MembershipFee`

회비 납부 상태

#### `LedgerEntry`

실제 입금/출금 장부

---

## 4. 권장 엔티티

### 4.1 User

기존 사용자 계정

추가 고려 필드

- `birthYear`
- `gender`
- `skillLevel`
- `preferredSports`
- `homeRegion`
- `profileVisibility`

### 4.2 Club

실제 운영 단위

핵심 필드 예시

- `id`
- `name`
- `slug`
- `sportType`
- `description`
- `homeRegion`
- `locationName`
- `latitude`
- `longitude`
- `joinPolicy`
  - `instant`
  - `approval`
- `monthlyFee`
- `memberCount`
- `activityLevel`
- `status`
  - `active`
  - `paused`
  - `archived`
- `createdBy`

### 4.3 Membership

유저와 클럽의 관계

핵심 필드 예시

- `id`
- `clubId`
- `userId`
- `role`
  - `owner`
  - `manager`
  - `member`
- `status`
  - `pending`
  - `active`
  - `resting`
  - `left`
  - `rejected`
- `joinedAt`
- `approvedAt`
- `nicknameInClub`
- `memo`

### 4.4 Event

특정 날짜의 운동 일정

핵심 필드 예시

- `id`
- `clubId`
- `title`
- `description`
- `eventType`
  - `regular`
  - `lesson`
  - `tournament`
  - `guest_day`
- `startsAt`
- `endsAt`
- `locationName`
- `latitude`
- `longitude`
- `capacity`
- `guestCapacity`
- `status`
  - `open`
  - `full`
  - `closed`
  - `finished`
- `createdBy`

### 4.5 EventParticipation

이벤트 참여 신청/참여 상태

핵심 필드 예시

- `eventId`
- `userId`
- `status`
  - `joined`
  - `waitlisted`
  - `cancelled`
  - `checked_in`

### 4.6 Attendance

이벤트 실제 출결

핵심 필드 예시

- `eventId`
- `membershipId`
- `attendanceStatus`
  - `present`
  - `late`
  - `absent`
  - `guest`
- `checkedAt`
- `note`

### 4.7 GuestVisit

게스트 운영 기록

핵심 필드 예시

- `id`
- `clubId`
- `eventId`
- `name`
- `phoneOrToken`
- `visitCount`
- `invitedByMembershipId`
- `memo`

### 4.8 MembershipFee

회비 납부 상태

핵심 필드 예시

- `id`
- `clubId`
- `membershipId`
- `month`
- `amount`
- `status`
  - `paid`
  - `unpaid`
  - `partial`
  - `waived`
- `paidAt`
- `note`

### 4.9 LedgerEntry

모임 장부 기록

핵심 필드 예시

- `id`
- `clubId`
- `type`
  - `income`
  - `expense`
- `category`
- `amount`
- `description`
- `receiptImageUrl`
- `recordedBy`
- `occurredAt`

---

## 5. 관계 구조

핵심 관계는 아래처럼 가져가는 것이 자연스럽다.

- `User 1:N Membership`
- `Club 1:N Membership`
- `Club 1:N Event`
- `Event 1:N EventParticipation`
- `Membership 1:N Attendance`
- `Event 1:N Attendance`
- `Club 1:N MembershipFee`
- `Club 1:N LedgerEntry`
- `Event 1:N GuestVisit`

---

## 6. 권장 구현 순서

모든 모델을 한 번에 넣지 말고 아래 순서로 나누는 것이 안전하다.

### 1단계

- `Club`
- `Membership`
- `Event`
- `EventParticipation`

이 단계에서 탐색, 참여, 내 모임, 운영자 기본 화면까지 가능하다.

### 2단계

- `Attendance`
- `GuestVisit`

이 단계에서 운영자 핵심 편의가 생긴다.

### 3단계

- `MembershipFee`
- `LedgerEntry`

이 단계에서 운영 도구로서의 가치가 강해진다.

### 4단계

- `PartnerPost`
- `Feedback`
- `MatchPreference`

이 단계는 스포츠 특화 확장이다.

---

## 7. 현재 코드와의 연결 전략

현재 `Meeting`은 당분간 아래처럼 해석할 수 있다.

- 임시 `Event`
- 단, 클럽 개념이 없는 단순 일정형 모임

즉, 바로 전면 교체하기보다 아래 순서가 현실적이다.

1. `Meeting` 유지
2. `Club`과 `Membership` 추가
3. 신규 기능은 `Club/Event` 기준으로 작성
4. 기존 `Meeting`을 점진적으로 `Event`로 이전

---

## 8. 결론

장기적으로는 `Meeting 중심 앱`이 아니라 `Club 중심 플랫폼`으로 가야 한다.

정리하면:

- 탐색은 `Club` 중심
- 실제 일정은 `Event` 중심
- 사람 관계는 `Membership` 중심
- 운영 데이터는 `Attendance`, `GuestVisit`, `MembershipFee`, `LedgerEntry` 중심

이 구조가 되어야 출결, 회비, 게스트, 운영 승인, 신뢰도 지표가 모두 자연스럽게 연결된다.
