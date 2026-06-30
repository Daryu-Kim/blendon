# Adult Verification

## 현재 구조

초기 버전은 회원가입 단계에서 mock provider로 성인 여부를 1회 확인한다. 소비자 화면에는 성인 확인 완료/미완료 상태를 별도 배지나 마이페이지 항목으로 노출하지 않는다.

- Nuxt API: `server/api/adult-verifications/mock.post.ts`
- Firebase Functions: `mockAdultVerification`
- UI: `/signup`, `AdultGate`
- Fallback UI: `/adult-verification`은 기존 미확인 계정 보정용이며 일반 내비게이션에는 노출하지 않는다.

## 정책

- 회원가입 시 생년월일을 입력하고 성인 여부를 확인한다.
- 성인 확인은 계정당 1회만 수행한다.
- 확인 전 성인 전용 상품 상세, 가격, 구매 버튼 제한
- 확인 성공 시 `users/{uid}.isAdultVerified=true`
- 인증 로그는 `adultVerificationLogs`에 기록

## 실제 provider 교체

PortOne 본인인증 또는 다른 본인확인 API를 붙일 때는 회원가입 단계의 mock adapter를 교체한다. 프론트는 provider 결과를 직접 신뢰하지 않고 서버가 인증 결과를 조회하거나 서명 검증 후 사용자 문서를 갱신한다.
