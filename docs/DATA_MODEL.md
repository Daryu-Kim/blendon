# Data Model

Firestore 문서는 운영자가 직접 입력해도 일관성을 유지할 수 있도록 필드명을 코드 타입과 동일하게 둔다. 클라이언트가 가격, 성인 인증, 결제 완료, 재고 차감을 단독 확정하지 않는다.

## Collections

### `users/{uid}`

회원 기본 정보와 권한을 저장한다. 비밀번호는 Firestore에 저장하지 않고 Firebase Authentication이 관리한다.

| Field                           | Type                  | Notes                                            |
| ------------------------------- | --------------------- | ------------------------------------------------ |
| `uid`                           | string                | Firebase Auth UID                                |
| `loginId`                       | string                | 쇼핑몰 로그인 아이디/조회 키                     |
| `email`                         | string                | Firebase Auth 이메일                             |
| `displayName`                   | string                | 이름 또는 표시명                                 |
| `phoneNumber`                   | string                | 본인확인/연락처                                  |
| `birthDate`                     | string                | `YYYY-MM-DD`                                     |
| `isAdultVerified`               | boolean               | 서버 인증 결과만 반영                            |
| `adultVerifiedAt`               | timestamp/string/null | 성인 인증 완료 시각                              |
| `adultVerificationProvider`     | string/null           | `portone`, `external` 등                         |
| `userGrade`                     | string                | `gradeBenefits/{gradeCode}` 참조                 |
| `role`                          | string                | `customer`, `staff`, `manager`, `admin`, `owner` |
| `availablePoint`                | number                | 사용 가능 포인트                                 |
| `totalPurchaseAmount`           | number                | 누적 구매액                                      |
| `defaultAddress`                | map/null              | `zipCode`, `address1`, `address2`                |
| `termsAgreement.service`        | map                   | `{ accepted, agreedAt }`                         |
| `termsAgreement.privacy`        | map                   | `{ accepted, agreedAt }`                         |
| `termsAgreement.refund`         | map                   | `{ accepted, agreedAt }`                         |
| `termsAgreement.marketing`      | map                   | 선택 동의                                        |
| `termsAgreement.nightMarketing` | map                   | 심야 혜택 알림 선택 동의                         |
| `termsAgreement.agreedAt`       | timestamp/string/null | 필수 약관 일괄 동의 시각                         |
| `adminMemo`                     | string                | 관리자 전용 메모                                 |
| `createdAt`                     | timestamp/string      | 생성 시각                                        |
| `updatedAt`                     | timestamp/string      | 수정 시각                                        |

### `gradeBenefits/{gradeCode}`

회원 등급 메뉴와 혜택가 계산 기준을 Firestore에서 관리한다. `BASIC`, `VIP` 같은 코드는 예시일 뿐이며, 운영자가 관리자에서 새 등급 코드를 직접 생성한다.

| Field                    | Type             | Notes                 |
| ------------------------ | ---------------- | --------------------- |
| `id`                     | string           | 문서 ID와 동일        |
| `gradeCode`              | string           | 운영자가 생성하는 등급 코드 |
| `internalCode`           | string           | 내부 운영 코드             |
| `level`                  | number           | 권한 비교용 숫자. 높을수록 상위 등급 |
| `label`                  | string           | 화면 표시명           |
| `discountRate`           | number           | 회원가 기준 할인율    |
| `pointRate`              | number           | 적립률                |
| `minPurchaseAmount`      | number           | 승급 기준 구매액      |
| `freeShippingThreshold`  | number           | 무료배송 기준         |
| `isVisible`              | boolean          | 관리자/회원 화면 노출 |
| `order`                  | number           | 정렬                  |
| `createdAt`, `updatedAt` | timestamp/string | 시각                  |

### `categories/{categoryId}`

카테고리 메뉴를 Firestore에서 관리한다.

| Field                | Type        | Notes              |
| -------------------- | ----------- | ------------------ |
| `id`                 | string      | 문서 ID와 동일     |
| `name`               | string      | 카테고리명         |
| `slug`               | string      | URL/검색용         |
| `parentId`           | string/null | 상위 카테고리      |
| `depth`              | number      | 1~3 권장           |
| `order`              | number      | 정렬               |
| `isVisible`          | boolean     | 노출 여부          |
| `minUserGradeToView` | string      | 최소 열람 등급     |
| `adultOnly`          | boolean     | 성인 전용 카테고리 |

### `products/{productId}`

상품 노출, 가격, 권한, 이미지, 재고를 관리한다. 성인 전용 또는 등급 제한 상품은 Firestore Rules와 서버 주문 검증에서도 차단한다.

| Field                                  | Type             | Notes                                                                                 |
| -------------------------------------- | ---------------- | ------------------------------------------------------------------------------------- |
| `id`                                   | string           | 문서 ID와 동일                                                                        |
| `name`                                 | string           | 상품명                                                                                |
| `slug`                                 | string           | 상품 상세 URL                                                                         |
| `shortDescription`                     | string           | 목록 문구                                                                             |
| `description`                          | string           | 상세 설명                                                                             |
| `categoryIds`                          | string[]         | 연결 카테고리                                                                         |
| `brandName`                            | string           | 가상/입점 브랜드명                                                                    |
| `thumbnailUrl`                         | string           | Storage 다운로드 URL 권장                                                             |
| `imageUrls`                            | string[]         | 갤러리 이미지                                                                         |
| `detailImageUrls`                      | string[]         | 상세페이지 이미지                                                                     |
| `basePrice`                            | number           | 비회원 기준가                                                                         |
| `memberPrice`                          | number           | 회원 기준가                                                                           |
| `compareAtPrice`                       | number/null      | 정가/할인 전 가격                                                                     |
| `gradePrices`                          | map              | 등급별 고정가, 예: `{ VIP_2026: 21000 }`                                              |
| `stock`                                | number           | 총 재고                                                                               |
| `options`                              | array            | `optionId`, `optionName`, `optionCode`, `additionalPrice`, `stock`, `isActive`        |
| `badges`                               | string[]         | 카드 배지                                                                             |
| `tags`                                 | string[]         | 검색/추천 태그                                                                        |
| `flavorProfile`                        | map              | `sweetness`, `coolness`, `body`, `mood`, `notes`                                      |
| `deviceType`                           | string           | `starter`, `compact`, `high-power`, `all-in-one`, `replaceable`, `consumable`, `none` |
| `nicotineType`                         | string           | `nicotine-free`, `alternative-nicotine`, `none`, `not-applicable`                     |
| `isNicotineFree`                       | boolean          | 니코틴 프리 여부                                                                      |
| `isAlternativeNicotine`                | boolean          | 대체 니코틴 여부                                                                      |
| `isAdultOnly`                          | boolean          | 성인 전용 여부                                                                        |
| `isVisible`                            | boolean          | 목록 노출 여부                                                                        |
| `minUserGradeToView`                   | string           | 최소 열람 등급                                                                        |
| `minUserGradeToBuy`                    | string           | 최소 구매 등급                                                                        |
| `isPriceHiddenBeforeLogin`             | boolean          | 비로그인 가격 숨김                                                                    |
| `isPriceHiddenBeforeAdultVerification` | boolean          | 성인 확인 전 가격 숨김                                                                |
| `viewRoles`, `buyRoles`                | string[]         | 향후 staff/manager 전용 상품 확장                                                     |
| `status`                               | string           | `draft`, `active`, `hidden`, `soldOut`, `deleted`                                     |
| `seoTitle`, `seoDescription`           | string           | 상품 상세 SEO 타이틀/설명                                                            |
| `seoKeywords`                          | string[]         | 상품 상세 SEO 키워드                                                                  |
| `ogImageUrl`                           | string           | 상품 공유 이미지                                                                       |
| `canonicalUrl`                         | string           | 상품 canonical URL. 비어 있으면 `/products/{slug}` 사용                              |
| `adminMemo`                            | string           | 관리자 메모                                                                           |
| `createdAt`, `updatedAt`               | timestamp/string | 시각                                                                                  |

### `orders/{orderId}`

주문은 서버 API가 생성하고 결제 검증 후 확정한다.

| Field                                            | Type                  | Notes                                                                   |
| ------------------------------------------------ | --------------------- | ----------------------------------------------------------------------- |
| `id`, `orderNo`, `userId`                        | string                | 식별자                                                                  |
| `items`                                          | array                 | `OrderItem` 스냅샷                                                      |
| `subtotalAmount`                                 | number                | 서버 계산 상품 합계                                                     |
| `deliveryFee`                                    | number                | 배송 주문일 때만 부과                                                   |
| `discountAmount`                                 | number                | 쿠폰/프로모션 확장용                                                    |
| `pointUsed`                                      | number                | 결제금액의 최대 10%                                                     |
| `totalAmount`                                    | number                | 최종 결제 금액                                                          |
| `paymentStatus`                                  | string                | `pending`, `ready`, `paid`, `failed`, `canceled`, `refunded`            |
| `paymentMethod`                                  | string                | `card`, `transfer`, `virtual-account`, `mobile`, `kakaopay`, `naverpay` |
| `orderStatus`                                    | string                | 주문 처리 상태                                                          |
| `deliveryStatus`                                 | string                | 배송/픽업 상태                                                          |
| `claimStatus`                                    | string                | 취소/교환/환불 상태                                                     |
| `paymentProvider`                                | string                | 현재 `portone`                                                          |
| `portonePaymentId`, `portoneImpUid`, `paymentId` | string/null           | 결제 식별자                                                             |
| `recipientName`, `recipientPhone`                | string                | 수령 정보                                                               |
| `address`                                        | map                   | 배송 주문일 때 입력                                                     |
| `deliveryMemo`                                   | string                | 배송 주문일 때 입력                                                     |
| `pickupType`                                     | string                | `delivery`, `store-pickup`, `lounge-pickup`                             |
| `adminMemo`                                      | string                | 관리자 메모                                                             |
| `createdAt`, `updatedAt`, `paidAt`               | timestamp/string/null | 시각                                                                    |

### `cartItems/{cartItemId}`

운영에서는 사용자 장바구니 동기화를 위해 사용할 수 있다. 현재 프론트는 로컬 장바구니를 사용하며 서버 주문 생성 시 재검증한다.

| Field                                   | Type             |
| --------------------------------------- | ---------------- |
| `id`, `userId`, `productId`, `optionId` | string           |
| `quantity`                              | number           |
| `createdAt`, `updatedAt`                | timestamp/string |

### `banners/{bannerId}`

| Field                                                          | Type                                  |
| -------------------------------------------------------------- | ------------------------------------- |
| `id`, `title`, `subtitle`, `imageUrl`, `buttonText`, `linkUrl` | string                                |
| `isActive`                                                     | boolean                               |
| `order`                                                        | number                                |
| `placement`                                                    | `home-main`, `home-section`, `notice` |

### `notices/{noticeId}`

| Field                    | Type             |
| ------------------------ | ---------------- |
| `id`, `title`            | string           |
| `content`                | string           |
| `isPinned`               | boolean          |
| `createdAt`, `updatedAt` | timestamp/string |

### `noticePopups/{popupId}`

사이트 진입 시 오버레이 모달로 노출되는 공지 팝업이다. 관리자만 작성/수정/삭제 가능하고, 소비자는 활성 팝업만 읽는다.

| Field                    | Type                         | Notes                                  |
| ------------------------ | ---------------------------- | -------------------------------------- |
| `id`, `title`, `content` | string                       | 식별자, 제목, Toast UI Markdown 본문   |
| `imageUrl`               | string                       | 팝업 상단 이미지                       |
| `linkUrl`, `buttonText`  | string                       | 연결 링크와 버튼 문구                  |
| `placement`              | `main`, `all`                | 메인 접속 또는 전체 페이지             |
| `isActive`               | boolean                      | 활성 여부                              |
| `dismissMode`            | `session`, `today`, `none`   | 닫기 유지 방식                         |
| `startsAt`, `endsAt`     | timestamp/string/null        | 노출 기간                              |
| `order`                  | number                       | 노출 순서                              |
| `createdAt`, `updatedAt` | timestamp/string             | 시각                                   |

### `inquiries/{inquiryId}`

| Field                              | Type                            |
| ---------------------------------- | ------------------------------- |
| `id`, `userId`, `title`, `content` | string                          |
| `status`                           | `waiting`, `answered`, `closed` |
| `answer`                           | string/null                     |
| `createdAt`, `answeredAt`          | timestamp/string/null           |

### `adultVerificationLogs/{logId}`

클라이언트 직접 쓰기는 금지한다. 서버 API 또는 Firebase Functions가 기록한다.

| Field                       | Type                              |
| --------------------------- | --------------------------------- |
| `id`, `userId`              | string                            |
| `provider`                  | `portone`, `external`, `mock`     |
| `status`                    | `requested`, `verified`, `failed` |
| `birthDate`                 | string                            |
| `requestedAt`, `verifiedAt` | timestamp/string/null             |
| `reason`                    | string                            |

### `siteSettings/global`

카페24 관리자 기본 설정에 해당하는 쇼핑몰 운영 정보다. 이 프로젝트는 성인 전용 쇼핑몰이므로 `adultOnly`와 `hideAdultVerificationStatusOnConsumer`는 기본적으로 `true`로 유지한다.

| Field                                      | Type    |
| ------------------------------------------ | ------- |
| `mallName`, `mallDescription`              | string  |
| `adultOnly`                                | boolean |
| `requireAdultVerificationToBrowse`         | boolean |
| `hideAdultVerificationStatusOnConsumer`    | boolean |
| `businessName`, `representativeName`       | string  |
| `businessRegistrationNumber`               | string  |
| `mailOrderSalesNumber`                     | string  |
| `businessAddress`                          | string  |
| `customerCenterPhone`, `customerCenterEmail` | string |
| `updatedAt`                                | timestamp/string |

### `siteSettings/seo`

사이트 공통 SEO/공유 메타 설정이다. 상품 상세는 상품별 SEO 필드가 우선한다.

| Field                                      | Type     |
| ------------------------------------------ | -------- |
| `defaultTitle`, `titleTemplate`            | string   |
| `defaultDescription`, `defaultKeywords`    | string/string[] |
| `ogTitle`, `ogDescription`, `ogImageUrl`   | string   |
| `canonicalBaseUrl`                         | string   |
| `robots`                                   | string   |
| `updatedAt`                                | timestamp/string |

### `storeSettings/{settingId}`

브랜드명, 사업자 정보, 배송비, 픽업 지점, 약관 버전 같은 운영 설정 확장용 컬렉션이다.

### `adminAuditLogs/{logId}`

관리자 변경 이력을 남기는 확장용 컬렉션이다. 생성 후 수정/삭제하지 않는다.

## Storage Paths

| Path                    | Purpose          | Rule                       |
| ----------------------- | ---------------- | -------------------------- |
| `products/thumbnails/*` | 상품 대표 이미지 | 관리자만 업로드, 공개 읽기 |
| `products/details/*`    | 상품 상세 이미지 | 관리자만 업로드, 공개 읽기 |
| `products/descriptions/*` | 상품 상세 설명 삽입 이미지 | 관리자만 업로드, 공개 읽기 |
| `products/seo/*`        | 상품 SEO/공유 이미지 | 관리자만 업로드, 공개 읽기 |
| `banners/*`             | 배너 이미지      | 관리자만 업로드, 공개 읽기 |
| `notices/*`             | 공지사항 본문 이미지 | 관리자만 업로드, 공개 읽기 |
| `notice-popups/*`       | 공지 팝업 이미지/본문 이미지 | 관리자만 업로드, 공개 읽기 |
| `seo/*`                 | 사이트 공통 SEO 이미지 | 관리자만 업로드, 공개 읽기 |
| `uploads/*`             | 임시/공통 이미지 | 관리자만 업로드, 공개 읽기 |

## Server Boundaries

- 주문 생성은 서버가 `users`, `products`를 다시 읽고 가격, 등급, 성인 인증, 재고, 포인트 한도를 검증한다.
- 포인트 사용은 `subtotalAmount + deliveryFee - discountAmount`의 최대 10%다.
- 결제 완료는 PortOne API 조회 금액과 주문 금액이 일치할 때만 `paid`로 확정한다.
- 성인 인증 완료 필드는 클라이언트가 직접 수정하지 않는다.
