# 모임 관리 프로토타입 구현 계획

## 개요
Next.js 15 기반의 모임 관리 프로토타입 애플리케이션

## 요구사항
- 모임 목록 보기 (카드 형태, 필터링/검색)
- 모임 생성 (제목, 설명, 카테고리, 최대 인원, 날짜)
- 모임 상세 보기 (참여자 목록, 설명)
- 모임 참여/탈퇴 기능
- 간단한 사용자 인증 (이메일/비밀번호)

## 기술 스택
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM + SQLite
- NextAuth.js v5 (Auth.js)
- React Hook Form + Zod (폼 검증)
- bcryptjs (비밀번호 해싱)

## 데이터 모델

### 1. User (사용자)
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String    // bcrypt 해시된 비밀번호
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  meetings      Meeting[] // 생성한 모임
  participations MeetingParticipant[] // 참여하는 모임
}
```

### 2. Meeting (모임)
```prisma
model Meeting {
  id          String   @id @default(cuid())
  title       String
  description String?
  category    String   // 운영, 개발, 디자인, 기타
  maxParticipants Int @default(10)
  date        DateTime
  location    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  creatorId   String
  creator     User     @relation(fields: [creatorId], references: [id])
  participants MeetingParticipant[]
}
```

### 3. MeetingParticipant (모임 참여자 - 다대다 관계)
```prisma
model MeetingParticipant {
  id        String   @id @default(cuid())
  meetingId String
  userId    String
  joinedAt  DateTime @default(now())
  meeting   Meeting  @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([meetingId, userId])
}
```

## 페이지 구조

| 경로 | 설명 | 인증 필요 |
|------|------|----------|
| / | 모임 목록 (홈) | 선택적 |
| /meetings/new | 모임 생성 | 예 |
| /meetings/[id] | 모임 상세 | 선택적 (참여는 인증 필요) |
| /meetings/[id]/edit | 모임 수정 | 예 (생성자만) |
| /auth/signin | 로그인 | 아니오 |
| /auth/register | 회원가입 | 아니오 |

## API 라우트

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | /api/auth/register | 회원가입 | 아니오 |
| GET | /api/meetings | 모임 목록 (필터, 검색, 페이지네이션) | 선택적 |
| POST | /api/meetings | 모임 생성 | 예 |
| GET | /api/meetings/[id] | 모임 상세 | 선택적 |
| PATCH | /api/meetings/[id] | 모임 수정 | 예 (생성자만) |
| DELETE | /api/meetings/[id] | 모임 삭제 | 예 (생성자만) |
| POST | /api/meetings/[id]/join | 모임 참여 | 예 |
| DELETE | /api/meetings/[id]/join | 모임 탈퇴 | 예 |
| GET | /api/auth/[...nextauth] | NextAuth 핸들러 | - |

## 컴포넌트 구조

```
app/
├── page.tsx                    # 모임 목록 페이지
├── layout.tsx                  # 루트 레이아웃
├── globals.css                 # 전역 스타일
├── meetings/
│   ├── new/
│   │   └── page.tsx            # 모임 생성 페이지
│   └── [id]/
│       ├── page.tsx            # 모임 상세 페이지
│       └── edit/
│           └── page.tsx        # 모임 수정 페이지
├── auth/
│   ├── signin/
│   │   └── page.tsx            # 로그인 페이지
│   └── register/
│       └── page.tsx            # 회원가입 페이지
├── api/
│   ├── auth/
│   │   ├── register/
│   │   │   └── route.ts        # 회원가입 API
│   │   └── [...nextauth]/
│   │       └── route.ts        # NextAuth 설정
│   └── meetings/
│       ├── route.ts            # 모임 목록/생성 API
│       └── [id]/
│           ├── route.ts        # 모임 상세/수정/삭제 API
│           └── join/
│               └── route.ts    # 참여/탈퇴 API
├── components/
│   ├── meetings/
│   │   ├── MeetingCard.tsx     # 모임 카드 컴포넌트
│   │   ├── MeetingList.tsx     # 모임 목록 컴포넌트
│   │   ├── MeetingForm.tsx     # 모임 생성/수정 폼
│   │   └── MeetingFilter.tsx   # 필터/검색 컴포넌트
│   ├── auth/
│   │   ├── SignInForm.tsx      # 로그인 폼
│   │   └── SignUpForm.tsx      # 회원가입 폼
│   └── ui/
│       ├── Button.tsx          # 공용 버튼
│       ├── Input.tsx           # 공용 입력
│       ├── Card.tsx            # 공용 카드
│       └── Header.tsx          # 헤더/네비게이션
├── lib/
│   ├── prisma.ts               # Prisma 클라이언트
│   ├── auth.ts                 # NextAuth 설정
│   └── utils.ts                # 유틸리티 함수
└── types/
    └── index.ts                # TypeScript 타입 정의
```

## 구현 단계

### Phase 1: 프로젝트 초기화
**목표**: Next.js 15 프로젝트 생성 및 기본 설정

**태스크**:
- [ ] `npx create-next-app@latest`로 프로젝트 생성 (TypeScript, Tailwind, ESLint, App Router 선택)
- [ ] `.gitignore`에 `.env`, `*.db` 추가 확인
- [ ] 개발 서버 실행 확인 (`npm run dev`)

**QA 시나리오**:
| 절차 | 기대 결과 | 검증 방법 |
|------|----------|----------|
| `npm run dev` 실행 | 개발 서버가 3000번 포트에서 시작 | 브라우저에서 `http://localhost:3000` 접속 시 Next.js 기본 페이지 표시 |
| `npm run build` 실행 | 빌드가 오류 없이 완료 | `next build`가 성공 메시지 출력 |

---

### Phase 2: 데이터베이스 설정
**목표**: Prisma ORM 설정 및 데이터베이스 스키마 정의

**태스크**:
- [ ] `npm install prisma @prisma/client`
- [ ] `npx prisma init` 실행 (SQLite 선택)
- [ ] `prisma/schema.prisma`에 User, Meeting, MeetingParticipant 모델 정의
- [ ] `npm install bcryptjs` 및 `@types/bcryptjs`
- [ ] `npx prisma migrate dev --name init` 실행
- [ ] `lib/prisma.ts`에 Prisma 클라이언트 싱글톤 생성

**QA 시나리오**:
| 절차 | 기대 결과 | 검증 방법 |
|------|----------|----------|
| `npx prisma db pull` | 스키마가 데이터베이스와 일치 | 오류 없이 완료 |
| `npx prisma studio` 실행 | Prisma Studio가 5555번 포트에서 시작 | 브라우저에서 `http://localhost:5555` 접속 시 모델 표시 |
| Prisma Studio에서 User 생성 | 레코드가 생성됨 | User 테이블에 새 레코드 표시 |

---

### Phase 3: 인증 시스템
**목표**: NextAuth.js v5 설정 및 회원가입/로그인 구현

**태스크**:
- [ ] `npm install next-auth@beta` (v5)
- [ ] `lib/auth.ts`에 NextAuth 설정 (Credentials Provider)
- [ ] `app/api/auth/[...nextauth]/route.ts`에 핸들러 생성
- [ ] `app/api/auth/register/route.ts`에 회원가입 API 구현 (bcrypt로 비밀번호 해싱)
- [ ] `middleware.ts`에 인증 미들웨어 설정 (보호된 라우트: /meetings/new, /meetings/*/edit)

**QA 시나리오**:
| 절차 | 기대 결과 | 검증 방법 |
|------|----------|----------|
| curl로 POST /api/auth/register (email: test@test.com, password: 123456, name: 테스트) | 201 Created, 사용자 생성 | Prisma Studio에서 User 테이블에 레코드 확인 |
| 브라우저에서 /auth/signin 접속 후 잘못된 비밀번호로 로그인 시도 | 로그인 실패 메시지 표시 | "이메일 또는 비밀번호가 일치하지 않습니다" 메시지 확인 |
| 브라우저에서 /meetings/new 접속 (로그인 안 된 상태) | /auth/signin으로 리다이렉트 | URL이 /auth/signin으로 변경됨 |
| 브라우저에서 /meetings/new 접속 (로그인 된 상태) | 모임 생성 폼 표시 | 페이지 정상 로드, 폼 요소 확인 |

---

### Phase 4: API 구현
**목표**: 모임 관련 REST API 구현

**태스크**:
- [ ] `app/api/meetings/route.ts`: GET (목록), POST (생성) - POST는 세션 검증 필요
- [ ] `app/api/meetings/[id]/route.ts`: GET (상세), PATCH (수정), DELETE (삭제) - PATCH/DELETE는 생성자 권한 검증
- [ ] `app/api/meetings/[id]/join/route.ts`: POST (참여), DELETE (탈퇴) - 세션 검증 및 인원 제한 검증
- [ ] 각 API에서 auth()로 세션 확인, 생성자 권한 검증 (PATCH, DELETE)
- [ ] 참여자 수 제한 검증 (POST /join)

**QA 시나리오**:
| 절차 | 기대 결과 | 검증 방법 |
|------|----------|----------|
| curl로 GET /api/meetings | 모임 목록 JSON 반환 | 상태 코드 200, JSON 배열 응답 확인 |
| curl로 POST /api/meetings (인증 쿠키 포함, 제목/설명/카테고리/날짜 포함) | 201 Created, 모임 생성 | Prisma Studio에서 Meeting 테이블에 레코드 확인 |
| curl로 POST /api/meetings (인증 없음) | 401 Unauthorized | 응답에 "Unauthorized" 메시지 확인 |
| curl로 PATCH /api/meetings/:id (생성자의 세션 쿠키 포함, 제목 변경) | 200 OK, 모임 수정 | Prisma Studio에서 해당 레코드의 title 필드 변경 확인 |
| curl로 PATCH /api/meetings/:id (비생성자의 세션 쿠키 포함) | 403 Forbidden | 응답에 "Forbidden" 메시지 확인 |
| curl로 POST /api/meetings/:id/join (인증 쿠키 포함) | 200 OK, 참여 완료 | Prisma Studio에서 MeetingParticipant 레코드 생성 확인 |
| curl로 POST /api/meetings/:id/join (maxParticipants 초과 상태) | 400 Bad Request | 응답에 "인원이 초과되었습니다" 메시지 확인 |

---

### Phase 5: UI 구현
**목표**: 모든 페이지 및 컴포넌트 구현

**태스크**:
- [ ] `components/ui/`: Button, Input, Card, Header 컴포넌트
- [ ] `app/layout.tsx`: 루트 레이아웃 (Header 포함)
- [ ] `app/page.tsx`: 모임 목록 페이지 (MeetingList, MeetingFilter, MeetingCard)
- [ ] `app/meetings/new/page.tsx`: 모임 생성 페이지 (MeetingForm)
- [ ] `app/meetings/[id]/page.tsx`: 모임 상세 페이지 (참여자 목록, 참여/탈퇴 버튼)
- [ ] `app/meetings/[id]/edit/page.tsx`: 모임 수정 페이지
- [ ] `app/auth/signin/page.tsx`: 로그인 페이지 (SignInForm)
- [ ] `app/auth/register/page.tsx`: 회원가입 페이지 (SignUpForm)
- [ ] React Hook Form + Zod로 폼 검증 구현

**QA 시나리오**:
| 절차 | 기대 결과 | 검증 방법 |
|------|----------|----------|
| `/` 접속 | 모임 목록 표시 | MeetingCard 컴포넌트들이 그리드로 표시 |
| 검색어 입력 | 필터링된 결과 표시 | 검색어가 제목/설명에 포함된 모임만 표시 |
| `/meetings/new` 폼 제출 | 모임 생성 후 상세 페이지로 이동 | 리다이렉트 및 성공 메시지 확인 |
| `/meetings/:id` 접속 | 모임 상세 정보 표시 | 제목, 설명, 참여자 목록, 참여 버튼 표시 |
| 참여 버튼 클릭 | 참여 완료, 참여자 목록 업데이트 | UI에 즉시 반영, DB 확인 |
| `/auth/register` 폼 제출 | 회원가입 후 로그인 페이지로 이동 | 성공 메시지 표시 |
| `/auth/signin` 폼 제출 | 로그인 후 홈으로 이동 | 세션 생성 확인 (Header에 사용자 이름 표시) |
| 유효하지 않은 폼 제출 | 에러 메시지 표시 | Zod 검증 에러가 각 필드 아래에 표시 |

---

### Phase 6: 최종 검증
**목표**: 모든 요구사항 충족 확인 및 빌드 검증

**태스크**:
- [ ] `npm run build` 실행 (프로덕션 빌드)
- [ ] `npm start`로 프로덕션 서버 테스트
- [ ] E2E 시나리오 테스트

**QA 시나리오**:
| 절차 | 기대 결과 | 검증 방법 |
|------|----------|----------|
| 브라우저에서 /auth/register 접속 → email: e2e@test.com, password: test123, name: E2E 입력 → 회원가입 버튼 클릭 | /auth/signin으로 리다이렉트, "회원가입이 완료되었습니다" 메시지 | URL이 /auth/signin으로 변경됨, 성공 메시지 텍스트 확인 |
| /auth/signin에서 방금 생성한 계정으로 로그인 | 홈(/)으로 리다이렉트, Header에 "E2E" 사용자 이름 표시 | URL이 /로 변경됨, Header에 사용자 이름 텍스트 확인 |
| /meetings/new 접속 → 제목: "E2E 테스트 모임", 카테고리: "개발", 날짜: 내일, 최대인원: 2 입력 → 생성 버튼 클릭 | 모임 상세 페이지로 리다이렉트, 생성된 모임 정보 표시 | URL 패턴 /meetings/[id] 확인, 페이지에 제목 "E2E 테스트 모임" 표시 |
| 모임 상세 페이지에서 "참여하기" 버튼 클릭 | 버튼이 "탈퇴하기"로 변경, 참여자 목록에 "E2E" 추가 | 버튼 텍스트 변경 확인, 참여자 목록에 사용자 이름 확인 |
| Prisma Studio에서 해당 모임의 creatorId 확인 → 다른 사용자로 로그인 → 같은 모임 상세 페이지 접속 | "참여하기" 버튼 표시 (아직 참여 안 함) | 버튼 텍스트 "참여하기" 확인 |
| 두 번째 사용자로 "참여하기" 클릭 | 참여 완료, 참여자 수 2/2 표시 | 참여자 목록에 2명 표시 |
| 세 번째 사용자로 같은 모임 접속 → "참여하기" 클릭 | "인원이 초과되었습니다" 에러 메시지 | 에러 메시지 텍스트 확인, 참여자 목록 변화 없음 확인 |
| 모임 생성자로 로그인 → /meetings/[id]/edit 접속 → 제목을 "수정된 모임"으로 변경 → 저장 | 모임 상세 페이지로 리다이렉트, 제목 변경됨 | URL이 /meetings/[id]로 변경, 제목 "수정된 모임" 확인 |
| 모임 상세 페이지에서 "삭제" 버튼 클릭 → 확인 | 홈(/)으로 리다이렉트, 모임 목록에서 해당 모임 사라짐 | URL이 /로 변경, 모임 카드 목록에서 "수정된 모임" 없음 확인 |
| `npm run build` | 빌드 성공, 정적 파일 생성 | 터미널에서 "Build completed" 메시지, `.next/` 폴
더에 파일 생성 확인 |
| 브라우저 DevTools Lighthouse 탭에서 Performance 검사 | 성능 점수 70 이상 | Lighthouse 결과에서 Performance 점수 70+ 확인 |

## 검증 기준

1. **회원가입/로그인**: 사용자는 이메일/비밀번호로 회원가입하고 로그인할 수 있다
2. **모임 생성**: 인증된 사용자는 모임을 생성할 수 있다
3. **모임 목록**: 모든 사용자는 모임 목록을 볼 수 있다 (필터링/검색 지원)
4. **모임 참여/탈퇴**: 인증된 사용자는 모임에 참여하거나 탈퇴할 수 있다 (인원 제한 준수)
5. **모임 수정/삭제**: 모임 생성자만 모임을 수정/삭제할 수 있다
6. **타입 안전성**: 모든 API와 컴포넌트가 TypeScript 타입 체크를 통과한다
7. **빌드 성공**: `npm run build`가 오류 없이 완료된다
