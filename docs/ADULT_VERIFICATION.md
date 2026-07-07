# Adult Verification

## 현재 구조

회원가입 단계에서 `성인 인증하기` 버튼으로 APick 주민등록증 진위확인 API를 호출해 성인 여부를 1회 확인한다. 소비자 화면에는 성인 확인 완료/미완료 상태를 별도 배지나 마이페이지 항목으로 노출하지 않는다.

- 회원가입 전 인증 API: `server/api/auth/signup-verification.post.ts`
- 회원가입 API: `server/api/auth/signup.post.ts`
- 가입 인증 토큰 저장소: `signupAdultVerifications`
- 기존 계정 보정 API: `server/api/adult-verifications/identity-card.post.ts`
- APick 연동 유틸: `server/utils/identity-card-verification.ts`
- UI: `/signup`, `/adult-verification`, `AdultGate`

## 정책

- 회원가입 시 이름, 주민등록번호, 주민등록증 발급일자로 진위확인을 먼저 진행한다.
- APick 진위확인 결과가 성공이고 주민등록번호 기준 만 19세 이상일 때 서버가 30분짜리 가입 인증 토큰을 발급한다.
- 최종 회원가입 API는 가입 인증 토큰을 검증하고 1회 소비한 뒤 계정을 생성한다.
- 주민등록번호와 발급일자는 APick 요청에만 사용하고 Firestore에 저장하지 않는다.
- 확인 전 성인 전용 상품 상세, 가격, 구매 버튼을 제한한다.
- 확인 성공 시 `users/{uid}.isAdultVerified=true`로 저장한다.
- 인증 로그는 `adultVerificationLogs`에 provider, 상태, 생년월일, 요청/완료 시각만 기록한다.

## 환경변수

- `APICK_AUTH_KEY`: APick API 호출 시 `CL_AUTH_KEY` 헤더로 사용하는 서버 전용 인증키

`APICK_AUTH_KEY`는 브라우저에 노출하면 안 되며 `NUXT_PUBLIC_` 접두사를 붙이지 않는다.
