# Docker 실행 가이드 (봄동마켓)

로컬에 **Java / Node / MySQL 설치 없이** Docker Desktop만 있으면 전체 스택이 뜹니다.

## 빠른 시작

```bash
cp .env.example .env      # 최초 1회 (placeholder를 실제 로컬 값으로 교체)
docker compose up -d --build
```

| 서비스 | 주소 | 비고 |
|--------|------|------|
| 백엔드 API | http://localhost:8080/api | Spring Boot |
| 프론트엔드 | http://localhost:5173 | React 빌드본 (nginx) |
| MySQL | localhost:**3307** | 로컬 MySQL(3306)과 충돌 방지용 포트. root / `.env`의 `DB_PASSWORD` |

## 자주 쓰는 명령어

```bash
docker compose up -d --build   # 코드 수정 후 재빌드 + 재시작
docker compose logs -f backend # 백엔드 로그 보기
docker compose down            # 중지 (DB 데이터는 볼륨에 유지됨)
docker compose down -v         # 중지 + DB 볼륨 삭제 (초기화)
```

## 데이터는 어디에 저장되나?

MySQL 데이터는 Docker **named volume** `farmbroker-mysql-data`에 저장됩니다.
컨테이너를 지웠다 다시 띄워도 데이터가 유지됩니다. 단, **볼륨은 각자의 컴퓨터 안에 있는 것**이라
그 자체로 다른 컴퓨터와 공유되지는 않습니다.

팀원끼리 같은 데이터를 보려면 → [db/init/README.md](db/init/README.md) 참고
(덤프를 `db/init/`에 커밋하면 다른 팀원이 최초 실행 시 자동으로 주입받습니다.)

## 백엔드 개발은 기존처럼 로컬로 하고 DB만 컨테이너로 쓰고 싶다면

```bash
docker compose up -d db
```

`application.yml`은 루트 `.env`를 읽습니다. 백엔드를 IntelliJ나 Gradle로 직접 실행할 때는
`.env`의 Docker용 DB 호스트 `db:3306`을 호스트용 `localhost:3307`로 변경합니다:

```
DB_URL=jdbc:mysql://localhost:3307/farmbroker?serverTimezone=Asia/Seoul&characterEncoding=UTF-8
```

DB/JWT/Gemini 값을 포함한 실제 `.env`는 Git에서 제외되며, 저장소의 `application.yml`에는
환경변수 참조와 비민감 기본값만 유지됩니다.
