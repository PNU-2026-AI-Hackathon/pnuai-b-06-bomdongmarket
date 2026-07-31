# 1단계: Gradle 빌드 (JDK 21)
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# 의존성 캐시 레이어 — 소스 변경 시에도 의존성 재다운로드 방지
COPY gradlew build.gradle settings.gradle ./
COPY gradle gradle
# Windows에서 커밋된 gradlew의 CRLF 개행을 LF로 변환해야 리눅스 컨테이너에서 실행 가능
RUN sed -i 's/\r$//' gradlew && chmod +x gradlew
RUN ./gradlew --no-daemon dependencies > /dev/null 2>&1 || true

COPY src src
RUN ./gradlew --no-daemon bootJar

# 2단계: 실행 (JRE만 포함한 경량 이미지)
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
