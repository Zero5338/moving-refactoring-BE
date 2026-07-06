# ---- 1단계: 빌드 ----
FROM node:20.18.1-alpine AS builder

WORKDIR /app

# package.json만 먼저 복사해서 의존성 캐시 활용
COPY package*.json ./
COPY prisma ./prisma/

# 의존성 설치 (postinstall에서 prisma generate 자동 실행됨)
RUN npm install

# 소스코드 전체 복사
COPY . .

# TypeScript 빌드 (tsc)
RUN npx tsc

# tsc-alias 경로 치환 실행
RUN npx tsc-alias

# ---- 2단계: 실행 ----
FROM node:20.18.1-alpine AS runner

WORKDIR /app

# 빌드 결과물과 필요한 파일만 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# 포트 오픈 (백엔드 포트에 맞게 수정)
EXPOSE 8080

# prisma migrate 후 서버 시작
CMD ["sh", "-c", "npx prisma migrate deploy && node ./dist/app.js"]
