# Architecture

## 목표

BLEND ON은 전자담배 관련 디바이스, 소모품, 니코틴 프리 플레이버, 대체 니코틴 상품을 다루지만 외형은 밝은 라이프스타일 편집샵으로 유지한다. 핵심 아키텍처 원칙은 가입 시 1회 성인 확인, 회원 등급, 상품 노출 제한, 서버 검증 결제다.

## 레이어

- UI: Nuxt pages, layouts, reusable components
- State: Pinia stores and Nuxt composables
- Client adapters: Firebase client plugin, PortOne browser SDK composable
- Server boundary: Nuxt server API and Firebase Functions
- Data boundary: Firestore Rules, Storage Rules

## 주요 결정

- 브랜드, 색상, 문구는 `config/brand.ts`에서 관리한다.
- 카테고리와 등급 정책은 `config/catalog.ts`에서 관리한다.
- 상품 권한 판정은 `utils/access.ts`로 모아 프론트 UI가 같은 기준을 사용하게 한다.
- 운영 보안은 프론트 숨김이 아니라 Firestore Rules와 서버 API 검증으로 완성한다.
- 결제 완료는 프론트 콜백을 신뢰하지 않고 서버가 PortOne 결제 조회 후 확정한다.
- 성인 여부는 회원가입 시 1회 확인하고, 소비자 UI에는 확인 상태를 별도 표시하지 않는다. 관리자와 서버 정책에서는 `isAdultVerified`를 계속 사용한다.
- 비밀번호는 Firestore에 저장하지 않는다. Firebase Authentication의 세션 지속성은 브라우저 세션 기준으로 두고, 앱에서 활용하는 최소 로그인 상태(`uid`, `loginId`, 이메일, 권한, 등급)는 `sessionStorage`에 저장한다.
- 디자인 구조는 일반 쇼핑몰형 레퍼런스처럼 상단 유틸 메뉴, 검색 중심 헤더, 큰 배너, 빠른 카테고리, 촘촘한 상품 그리드를 우선한다. 색상과 문구는 BLEND ON 브랜드 설정을 따른다.

## 확장 포인트

- 오프라인 매장 픽업: `pickupType`과 배송 상태에 이미 `store-pickup`, `lounge-pickup`을 포함했다.
- POS 연동: 주문 확정 이벤트 후 별도 integration queue 또는 Functions trigger를 연결한다.
- 멤버십: 현재 `memberPrice` 단일 필드이며, 추후 `gradePrices` 맵으로 확장한다.
