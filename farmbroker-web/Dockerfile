# 1단계: Vite 빌드
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Vite는 VITE_* 값을 빌드 시점에 번들에 박아 넣는다. 컨테이너 안에는 저장소 루트 .env가 없으므로
# compose가 호스트 .env에서 읽은 값을 build arg로 넘겨준다.
# 값을 바꾼 뒤에는 이미지를 다시 빌드해야 반영된다(docker compose up --build).
# 비워 두면 주소 검색은 그대로 동작하고 지도 영역만 안내 문구로 대체된다.
ARG VITE_KAKAO_MAP_APP_KEY=
ENV VITE_KAKAO_MAP_APP_KEY=$VITE_KAKAO_MAP_APP_KEY

RUN npm run build

# 2단계: nginx로 정적 파일 서빙
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
