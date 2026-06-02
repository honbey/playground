# Mindustry Logic

Mindustry 的 Logic 逻辑编辑体验太糟糕了，用文本编辑器又很不方便验证语法和跳转，于是 GitHub 搜到到 Star 数最多的相关的两个项目：[`Mindcode`](https://github.com/cardillan/mindcode) 和 [`MlogJS`](https://github.com/mlogjs/mlogjs) ，各有优势。

## Memo
1. With some tests, i found the range of itemTake/Drop is about 9.
经过一些测试，我发现 itemTake/Drop 的距离大概是 9。

## Mindcode

### Install - Environment: codercom/code-server (Docker Container)

1. Install OpenJDK and PostgreSQL
```bash
sudo apt update
sudo apt upgrade -y
sudo apt install default-jdk postgresql -y
sudo su postgres -c '/usr/lib/postgresql/15/bin/initdb -D /var/lib/postgresql/15/main --auth-local peer --auth-host scram-sha-256 --no-instructions'
sudo su postgres -c '/usr/lib/postgresql/15/bin/createdb'
sudo su postgres -c '/usr/lib/postgresql/15/bin/postgres -D /var/lib/postgresql/15/main'
```

2. Create Database
```sql
CREATE DATABASE mindcode_development;
CREATE USER mindcode WITH PASSWORD 'mindcode';
GRANT ALL PRIVILEGES ON DATABASE mindcode_development TO mindcode
```

3. Compile
```bash
cd ~/mindcode
./mvnw install -Dmaven.test.skip
```

### Install - macOS (with Homebrew)
1. Install OpenJDK and PostgreSQL
```bash
brew install openjdk PostgresSQL
```

2. Create Database
```bash
/opt/homebrew/opt/postgresql@14/bin/postgres -D /opt/homebrew/var/postgresql@14
psql
```

```sql
CREATE DATABASE mindcode_development;
CREATE USER mindcode WITH PASSWORD 'mindcode';
GRANT ALL PRIVILEGES ON DATABASE mindcode_development TO mindcode
```

3. Compile
```bash
cd ~/mindcode
./mvnw install -Dmaven.test.skip
```

4. Usage
```bash
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost/mindcode_development
export SPRING_DATASOURCE_USERNAME=mindcode
export SPRING_DATASOURCE_PASSWORD=mindcode

/path/mindcode/bin/mcc cm -c -e 1000 -g AUTO example.mnd
```
