# AWS Elastic Beanstalk 배포 가이드

## 사전 준비사항

### 1. AWS CLI 설정

```bash
# AWS CLI 로그인 (SSO 또는 IAM credentials)
aws sso login
# 또는
aws configure

# 계정 확인
aws sts get-caller-identity
```

### 2. GitHub Secrets 설정

GitHub Repository → Settings → Secrets and variables → Actions → New repository secret

다음 secrets를 추가하세요:

| Secret Name | 설명 | 예시 |
|------------|------|------|
| `AWS_ACCESS_KEY_ID` | AWS Access Key | AKIA... |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Key | ... |
| `AWS_REGION` | AWS 리전 | ap-northeast-2 |
| `EB_APPLICATION_NAME` | Beanstalk 앱 이름 | my-nextjs-app |
| `EB_ENVIRONMENT_NAME` | Beanstalk 환경 이름 | my-nextjs-env |
| `NEXTAUTH_SECRET` | NextAuth Secret | (랜덤 문자열) |
| `NEXTAUTH_URL` | NextAuth URL | https://...elasticbeanstalk.com |
| `DATABASE_URL` | PostgreSQL 연결 문자열 | postgresql://... |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | ... |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | ... |

### 3. RDS PostgreSQL 데이터베이스 생성

```bash
# AWS Console 또는 CLI로 RDS 인스턴스 생성
aws rds create-db-instance \
  --db-instance-identifier my-nextjs-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --allocated-storage 20 \
  --master-username dbadmin \
  --master-user-password YOUR_PASSWORD \
  --vpc-security-group-ids sg-xxxxxxxx \
  --availability-zone ap-northeast-2a

# 연결 문자열 형식:
# postgresql://dbadmin:PASSWORD@HOST:5432/dbname?schema=public
```

### 4. Elastic Beanstalk 환경 생성

```bash
# Elastic Beanstalk 애플리케이션 생성
eb init -p "Node.js 20" my-nextjs-app --region ap-northeast-2

# 환경 생성 (단일 인스턴스)
eb create my-nextjs-env \
  --single \
  --instance-type t3.micro \
  --envvars NODE_ENV=production,NEXTAUTH_SECRET=your-secret

# 또는 AWS Console에서 생성:
# 1. Elastic Beanstalk → Create Application
# 2. Platform: Node.js 20
# 3. Preset: Single instance (free tier eligible)
# 4. Service role: aws-elasticbeanstalk-service-role
# 5. EC2 instance profile: aws-elasticbeanstalk-ec2-role
```

### 5. IAM 역할 설정

**EC2 인스턴스 프로파일** (`aws-elasticbeanstalk-ec2-role`)에 다음 권한 추가:
- AWSElasticBeanstalkWebTier
- AWSElasticBeanstalkMulticontainerDocker
- AWSElasticBeanstalkWorkerTier

**서비스 역할** (`aws-elasticbeanstalk-service-role`)에 다음 권한 추가:
- AWSElasticBeanstalkManagedUpdatesCustomerRolePolicy

## 배포 방법

### 자동 배포 (GitHub Actions)

1. `main` 또는 `master` 브랜치에 push
2. GitHub Actions 자동 실행
3. 빌드 → 테스트 → Beanstalk 배포

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

### 수동 배포 (AWS CLI)

```bash
# 의존성 설치 및 빌드
npm ci
npx prisma generate
npm run build

# 배포 패키지 생성
zip -r deploy.zip .next prisma .ebextensions package*.json Procfile public

# Beanstalk에 업로드 및 배포
aws elasticbeanstalk create-application-version \
  --application-name my-nextjs-app \
  --version-label "v-$(date +%s)" \
  --source-bundle S3Bucket=my-bucket,S3Key=deploy.zip

aws elasticbeanstalk update-environment \
  --environment-name my-nextjs-env \
  --version-label "v-$(date +%s)"

# 또는 eb CLI 사용
eb deploy
```

## 환경 변수 관리

### Beanstalk Console에서 설정

1. Elastic Beanstalk → 환경 선택 → Configuration
2. Software → Edit
3. Environment Properties에 추가:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

### CLI로 설정

```bash
eb setenv DATABASE_URL="postgresql://..." NEXTAUTH_SECRET="..."
```

## 주요 파일 설명

| 파일/디렉토리 | 설명 |
|-------------|------|
| `.ebextensions/01_nodejs.config` | Node.js 및 Nginx 설정 |
| `.ebextensions/02_packages.config` | PostgreSQL 클라이언트 설치 |
| `.ebextensions/03_postdeploy.config` | 배포 후 Prisma 마이그레이션 실행 |
| `Procfile` | 프로세스 정의 (web: npm run start) |
| `.github/workflows/deploy.yml` | GitHub Actions CI/CD 파이프라인 |
| `next.config.ts` | Next.js standalone 출력 설정 |
| `prisma/schema.prisma` | PostgreSQL용 Prisma 스키마 |
| `app/api/health/route.ts` | Beanstalk Health Check 엔드포인트 |

## 트러블슈팅

### 로그 확인

```bash
# Beanstalk 로그 다운로드
eb logs

# 또는 AWS Console → Logs → Request Logs
```

### 일반적인 문제

1. **빌드 실패**
   - Node.js 버전 확인 (20 필요)
   - `npm ci`가 정상 실행되는지 확인

2. **데이터베이스 연결 실패**
   - RDS 보안 그룹에서 Beanstalk 인바운드 허용 확인
   - DATABASE_URL 형식 확인

3. **Prisma 마이그레이션 실패**
   - RDS 인스턴스가 available 상태인지 확인
   - 마이그레이션 파일이 prisma/migrations/에 있는지 확인

4. **Health Check 실패**
   - `/api/health` 엔드포인트가 200 응답하는지 확인
   - Nginx 설정 확인

### 데이터베이스 마이그레이션 수동 실행

```bash
# Beanstalk 환경에 SSH 접속
eb ssh

# 앱 디렉토리로 이동
cd /var/app/current

# Prisma 마이그레이션 실행
npx prisma migrate deploy

# Prisma Client 재생성
npx prisma generate
```

## 비용 최적화

- **단일 인스턴스**: 개발/테스트용 (t3.micro)
- **로드 밸런서**: 프로덕션용 (비용 증가)
- **RDS**: db.t3.micro (프리티어 가능)
- **CloudWatch**: 로그 보관 기간 조정으로 비용 절감

## 보안 권장사항

1. **데이터베이스**: RDS를 private 서브넷에 배치
2. **환경 변수**: 민감한 값은 AWS Secrets Manager 사용
3. **HTTPS**: ACM 인증서로 HTTPS 강제
4. **보안 그룹**: 최소 권한 원칙 적용
