# db/init — MySQL 시드 데이터

이 폴더의 `*.sql` 파일은 **MySQL 컨테이너가 최초로 뜰 때(볼륨이 비어 있을 때) 한 번만** 자동 실행됩니다.
팀원끼리 같은 데이터를 보려면 여기에 덤프 파일을 커밋하면 됩니다.

## 내 데이터를 팀에 공유하기 (덤프 뜨기)

```bash
docker exec farmbroker-db sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" farmbroker' > db/init/01-seed.sql
git add db/init/01-seed.sql && git commit -m "chore: update db seed"
```

## 다른 팀원이 그 데이터를 받기

```bash
git pull
docker compose down -v   # ⚠️ 기존 DB 볼륨 삭제 (내 로컬 데이터 사라짐)
docker compose up -d     # 새 볼륨 생성 → 시드 SQL 자동 실행
```
