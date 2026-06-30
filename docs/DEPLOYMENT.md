# Deployment

## Vercel

1. 저장소를 Vercel 프로젝트로 연결한다.
2. `.env.example` 기준으로 환경변수를 입력한다.
3. Build command는 `npm run build`를 사용한다.

## Firebase

1. Firebase CLI 로그인 후 프로젝트를 선택한다.
2. Rules와 indexes를 먼저 배포한다.
3. Functions는 `functions` 폴더에서 의존성을 설치하고 빌드한다.
4. Nuxt SSR Hosting은 Functions/Cloud Run 어댑터가 필요하다.

```bash
firebase use <project-id>
firebase deploy --only firestore:rules,firestore:indexes,storage
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

## 운영 전 체크리스트

- 실제 사업자 정보 입력
- 성인 인증 provider 연결
- PortOne live channel 설정
- 환불/취소 API 검증
- Firestore Rules emulator 테스트
- 관리자 custom claim 부여 절차 확정
