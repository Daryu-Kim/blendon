# Admin Guide

## 접근

관리자 페이지는 `/admin` 하위에 있다. `manager`, `admin`, `owner` 권한만 접근할 수 있다. 운영에서는 Firebase custom claims의 `role`을 우선 사용한다.

## 화면

- `/admin`: 주문, 매출, 재고, 회원 인증 요약
- `/admin/products`: 상품 등록, 수정, 숨김, soft delete, 가격/재고/권한 관리
- `/admin/orders`: 주문 상태, 배송 상태 변경
- `/admin/members`: 등급, 포인트, 권한, 성인 인증 상태 확인
- `/admin/categories`: 카테고리 depth, 순서, 성인 전용 여부 관리
- `/admin/banners`: 홈 배너와 콘텐츠 관리

## 운영 주의

상품 삭제는 기본적으로 `status=deleted` soft delete를 사용한다. 결제 및 주문 데이터는 감사 추적을 위해 직접 삭제하지 않는다.
