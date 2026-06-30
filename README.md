# BLEND ON Commerce

성인 취향 라이프스타일 편집샵을 위한 Nuxt 3 + Firebase 기반 커머스 초기 골격입니다. 임시 브랜드명은 `config/brand.ts`와 Nuxt runtime config에서 관리하므로 최종 브랜드명이 바뀌어도 UI와 문서를 한 곳에서 교체할 수 있습니다.

## 기술 스택

- Nuxt 3, Vue 3, TypeScript, Pinia
- Firebase Authentication, Firestore, Storage, Functions
- PortOne Browser SDK + 서버 결제 조회/검증 어댑터
- Vercel 또는 Firebase Hosting 배포 가능 구조

## 설치와 실행

```bash
npm install
npm run dev
```

개발 서버는 기본적으로 `http://localhost:3000`에서 실행됩니다. 운영 기본값은 mock auth/payment 비활성화입니다. 로컬 화면 흐름만 확인해야 할 때는 `.env`에서 `NUXT_PUBLIC_ENABLE_MOCK_AUTH=true`, `NUXT_PUBLIC_ENABLE_MOCK_PAYMENTS=true`를 명시적으로 켭니다.

테스트 계정:

- 고객: `customer@example.com` / 아무 비밀번호
- 관리자: `admin@example.com` / 아무 비밀번호

## 환경변수

`.env.example`를 `.env`로 복사한 뒤 실제 값을 입력합니다.

- `NUXT_PUBLIC_FIREBASE_*`: Firebase Web App 공개 설정
- `NUXT_PUBLIC_PORTONE_STORE_ID`, `NUXT_PUBLIC_PORTONE_CHANNEL_KEY`: PortOne 브라우저 결제창 설정
- `PORTONE_API_SECRET`: 서버 전용 PortOne API secret
- `FIREBASE_SERVICE_ACCOUNT_JSON`: 서버/seed용 Firebase service account JSON
- `ADMIN_INITIAL_EMAIL`: 초기 관리자 이메일

`PORTONE_API_SECRET`와 `FIREBASE_SERVICE_ACCOUNT_JSON`은 절대 `NUXT_PUBLIC_` 접두사를 붙이지 않습니다.

## Firebase 설정

1. Firebase 프로젝트를 만들고 Authentication Email/Password provider를 활성화합니다.
2. Firestore, Storage를 생성합니다.
3. `firestore.rules`, `storage.rules`, `firestore.indexes.json`을 배포합니다.
4. Functions 배포 전 `functions` 폴더에서 `npm install && npm run build`를 확인합니다.
5. 관리자 계정은 custom claims의 `role=admin` 또는 users 문서의 `role`로 구분합니다.

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
firebase deploy --only functions
```

## PortOne 결제 구조

프론트는 pending 주문 생성 후 PortOne 결제창만 호출합니다. 결제 성공 콜백만으로 주문을 완료하지 않고, `/api/payments/verify` 또는 Firebase Function `verifyPortOnePayment`가 PortOne API에서 결제 상태와 금액을 조회한 뒤 주문을 `paid`로 확정합니다.

현재 구현은 테스트/로컬 개발을 위해 명시적 mock payment를 지원합니다. 운영에서는 `NUXT_PUBLIC_ENABLE_MOCK_PAYMENTS=false`, `NUXT_PUBLIC_PORTONE_STORE_ID`, `NUXT_PUBLIC_PORTONE_CHANNEL_KEY`, `PORTONE_API_SECRET`을 설정합니다.

## 성인 확인 구조

초기 버전은 회원가입 단계의 본인확인 영역에서 `/api/adult-verifications/mock`와 `mockAdultVerification` Function을 통해 성인 여부를 1회 확인합니다. 실제 본인확인 API로 교체할 수 있도록 adapter 경계를 분리했습니다.

- 확인 전: 성인 전용 상품 상세, 가격, 구매 버튼 제한
- 확인 후: `users/{uid}.isAdultVerified=true`, `adultVerificationLogs` 기록
- 회원정보 저장: Firebase Auth 가입 후 Firestore `users/{uid}`에 아이디, 이메일, 이름, 연락처, 생년월일, 항목별 약관 동의 여부와 동의 시각 저장
- 소비자 화면: 확인 완료/미완료 상태를 별도 노출하지 않음
- 관리자: 회원 목록에서 확인 상태 확인

## 보안 주의사항

- 주문 생성과 결제 완료 처리는 서버에서 가격, 재고, 성인 확인 상태, 등급을 다시 확인합니다.
- Firestore `orders` 직접 create/update는 차단하고 Admin SDK 경로만 사용합니다.
- Storage 이미지 업로드는 관리자 custom claim 기준으로 제한합니다.
- 의료적 효능, 건강상 안전성을 암시하는 표현은 사용하지 않습니다.
- 비밀번호는 Firestore에 저장하지 않습니다. Firebase Authentication이 검증을 담당하며, 브라우저에는 `sessionStorage` 기반 최소 로그인 상태(`uid`, `loginId`, 이메일, 권한, 등급)만 저장합니다.

## 주요 경로

- 홈: `/`
- 상품: `/products`, `/products/[slug]`
- 장바구니/주문: `/cart`, `/checkout`, `/payment/complete`
- 회원: `/login`, `/signup`, `/mypage`
- 관리자: `/admin`, `/admin/products`, `/admin/products/new`, `/admin/products/[id]`, `/admin/orders`, `/admin/members`, `/admin/grades`, `/admin/categories`, `/admin/banners`

## 배포

Vercel:

```bash
npm run build
vercel
```

Firebase Hosting:

```bash
npm run build
firebase deploy --only hosting
```

Nuxt SSR을 Firebase Hosting으로 배포하려면 Cloud Functions 또는 Cloud Run 어댑터 구성이 추가로 필요합니다. 정적 페이지 위주로 시작한다면 `npm run generate` 후 Hosting 배포도 가능합니다.

## TODO

- 실제 PortOne PG 채널별 결제 옵션 확정
- PortOne 또는 본인확인 provider 성인 확인 adapter 교체
- Firestore transaction 기반 주문 생성/재고 차감 완성
- Firestore transaction 기반 주문 확정/재고 차감과 주문 저장을 Admin SDK로 완성
- 환불/취소 API 연결
- 배송사 송장/픽업/POS/멤버십 연동
- 운영 사업자 정보, 이용약관, 개인정보처리방침 입력
- `firebase-admin` transitive `uuid` moderate advisory 추적 및 안전한 메이저 업데이트 검토

자세한 설계 문서는 `docs/` 폴더를 확인하세요.
