# BLEND ON Commerce

성인 취향 라이프스타일 편집샵을 위한 Nuxt 3 + Firebase 기반 커머스 초기 골격입니다. 임시 브랜드명은 `config/brand.ts`와 Nuxt runtime config에서 관리하므로 최종 브랜드명이 바뀌어도 UI와 문서를 한 곳에서 교체할 수 있습니다.

## 기술 스택

- Nuxt 3, Vue 3, TypeScript, Pinia
- Firebase Authentication, Firestore, Storage, Functions
- 주문 접수 후 카드 SMS 결제 안내/계좌이체 안내 기반 결제 운영
- Vercel 또는 Firebase Hosting 배포 가능 구조

## 설치와 실행

```bash
npm install
npm run dev
```

개발 서버는 기본적으로 `http://localhost:3000`에서 실행됩니다. 로그인, 회원, 상품, 주문, 공지, 배너 관리는 Firebase Auth/Firestore/Storage 실서버 설정을 기준으로 동작합니다.

테스트 계정은 Firebase Authentication에 직접 생성하고, Firestore `users/{uid}` 문서의 `role`을 `admin` 또는 `owner`로 설정해야 관리자에 접근할 수 있습니다.

## 환경변수

`.env.example`를 `.env`로 복사한 뒤 실제 값을 입력합니다.

- `NUXT_PUBLIC_FIREBASE_*`: Firebase Web App 공개 설정
- `FIREBASE_SERVICE_ACCOUNT_JSON`: 서버/seed용 Firebase service account JSON
- `ADMIN_INITIAL_EMAIL`: 초기 관리자 이메일
- `APICK_AUTH_KEY`: APick 주민등록증 진위확인 API 인증키
- `SMS_WEBHOOK_URL`, `SMS_WEBHOOK_SECRET`, `SMS_SENDER_NUMBER`: 관리자 수동 회원 등록 안내 문자 발송 웹훅 설정

`FIREBASE_SERVICE_ACCOUNT_JSON`, `APICK_AUTH_KEY`, `SMS_WEBHOOK_SECRET`은 절대 `NUXT_PUBLIC_` 접두사를 붙이지 않습니다.

## Firebase 설정

1. Firebase 프로젝트를 만들고 Authentication Email/Password provider를 활성화합니다.
2. Firestore, Storage를 생성합니다.
3. `firestore.rules`, `storage.rules`, `firestore.indexes.json`을 배포합니다.
4. Functions 배포 전 `functions` 폴더에서 `npm install && npm run build`를 확인합니다.
5. 관리자 계정은 Firestore `users/{uid}.role`과 Firebase Auth custom claims의 `role`로 구분합니다. Storage 업로드 권한은 custom claim을 사용하므로 관리자 이미지 업로드 전 claim을 설정해야 합니다.

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
firebase deploy --only functions
```

관리자 custom claim 설정:

```bash
ADMIN_EMAIL=admin@example.com ADMIN_ROLE=owner npm run admin:claim
```

실행 후 해당 관리자는 로그아웃 후 다시 로그인해야 새 custom claim이 ID token에 반영됩니다.

## 결제 운영 구조

주문서는 서버에서 상품 가격, 배송비, 회원 등급, 구매 권한을 다시 계산한 뒤 주문을 `ready` 상태로 접수합니다. 결제수단은 `신용/체크카드`와 `계좌이체`만 사용합니다.

- 신용/체크카드: 운영자가 P플 SMS 결제 안내를 영업시간 내 문자로 발송합니다.
- 계좌이체: 쇼핑몰 설정의 사업자 계좌를 주문서, 주문 완료, 주문 내역에 표시합니다.
- 결제 기한은 주문 접수 시점부터 24시간입니다.
- 입금/결제 확인 후 관리자가 주문 관리에서 결제 상태를 `paid`로 변경합니다.

## 성인 확인 구조

회원가입 단계에서 `성인 인증하기` 버튼으로 APick 주민등록증 진위확인 API를 호출해 유효한 주민등록증인지 확인하고, 주민등록번호 기준 만 19세 이상인 경우에만 가입을 진행할 수 있습니다. 서버는 30분짜리 가입 인증 토큰을 발급하며, 최종 가입 시 이 토큰을 검증하고 1회 소비합니다. 주민등록번호와 발급일자는 진위확인 요청에만 사용하고 Firestore에 저장하지 않습니다.

- 확인 전: 성인 전용 상품 상세, 가격, 구매 버튼 제한
- 확인 후: `users/{uid}.isAdultVerified=true`, `adultVerificationLogs` 기록
- 회원정보 저장: 서버가 APick 확인 토큰을 검증한 후 Firebase Auth 계정과 Firestore `users/{uid}` 문서를 생성하고, 아이디, 이메일, 이름, 연락처, 생년월일, 항목별 약관 동의 여부와 동의 시각을 저장
- 소비자 화면: 확인 완료/미완료 상태를 별도 노출하지 않음
- 관리자: 회원 목록에서 확인 상태 확인
- 관리자 수동 등록: 성인 인증을 `admin-manual`로 기록하고, 임시 비밀번호 안내 SMS를 발송한 뒤 최초 로그인 시 비밀번호 변경을 요구

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
- 관리자: `/admin`, `/admin/products`, `/admin/products/new`, `/admin/products/[id]`, `/admin/orders`, `/admin/members`, `/admin/grades`, `/admin/categories`, `/admin/notices`, `/admin/banners`

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

- 본인확인 provider 장애/실패 대응 운영 정책 확정
- Firestore transaction 기반 주문 생성/재고 차감 완성
- Firestore transaction 기반 주문 확정/재고 차감과 주문 저장을 Admin SDK로 완성
- 환불/취소 API 연결
- 배송사 송장/픽업/POS/멤버십 연동
- 운영 사업자 정보, 이용약관, 개인정보처리방침 입력
- `firebase-admin` transitive `uuid` moderate advisory 추적 및 안전한 메이저 업데이트 검토

자세한 설계 문서는 `docs/` 폴더를 확인하세요.
