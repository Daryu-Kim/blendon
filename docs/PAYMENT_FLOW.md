# Payment Flow

## 흐름

1. 사용자가 주문서를 작성한다.
2. 서버가 상품 가격, 재고, 성인 인증, 등급을 다시 확인한다.
3. 서버가 pending 주문과 `paymentId`를 생성한다.
4. 프론트가 PortOne Browser SDK로 결제창을 호출한다.
5. 프론트가 결제 결과의 `paymentId`를 서버 검증 API로 보낸다.
6. 서버가 PortOne API로 실제 결제 상태와 금액을 조회한다.
7. 금액과 상태가 맞으면 주문을 `paid`로 확정하고 재고를 차감한다.
8. 실패하면 주문을 `failed`로 표시한다.

## 보안 원칙

- 클라이언트 결제 성공 콜백만으로 주문을 완료하지 않는다.
- 클라이언트가 보낸 상품 가격이나 총액을 신뢰하지 않는다.
- `PORTONE_API_SECRET`은 서버 환경변수로만 사용한다.

## 구현 위치

- 브라우저 호출: `composables/usePortOnePayment.ts`
- Nuxt 서버 검증: `server/api/payments/verify.post.ts`
- Firebase Functions 검증: `functions/src/index.ts`

## PortOne 전자결제 신청 전 공개 페이지

전자결제 심사 전 아래 항목은 웹사이트 푸터에서 접근 가능해야 한다.

- 사업자 정보: `/business-info`
- 이용약관: `/terms`
- 개인정보처리방침: `/privacy`
- 취소/환불 및 청약철회 정책: `/refund-policy`

현재 사업자 정보는 `config/legal.ts`의 임시값을 사용한다. 실제 신청 전 사업자등록증, 통신판매업 신고증, 고객센터 정보와 일치하도록 교체해야 한다.

PortOne SDK/API 세부 파라미터는 공식 문서를 기준으로 채널별 설정을 확정해야 한다.
