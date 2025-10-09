# 开发环境 Docker 测试验证（draft）

本指南用于在本机用 Docker 验证 tarot-backend（FastAPI）、tarot-admin-web（Next.js）与 Nginx 三容器方案，并在开发环境便捷维护 SQLite 数据库 `backend_tarot.db`。

提示：若尚未创建 Dockerfile/nginx.conf/docker-compose，请先按《后台docker部署计划.md》落盘对应文件，再执行下列步骤。

## 目标
- 本机一键启动三容器，通过 Nginx 统一访问（http://localhost/）。
- 管理后台可登录、调用后端 API；`/api/health` 返回正常。
- 数据库文件使用宿主机绑定，直接替换/备份 `D:\0-development\projects\MySixth\tarot-backend\backend_tarot.db`。

## 前置条件
- 已安装并启动 Docker Desktop。
- 本机 80 端口空闲（如被占用，后续将端口改成 `8080:80`）。
- 项目结构：在仓库根目录执行以下命令。

## 准备后端环境变量
在 `tarot-backend` 目录生成 `.env`（可从 `.env.example` 复制）：
```
Copy-Item -Path D:\0-development\projects\MySixth\tarot-backend\.env.example -Destination D:\0-development\projects\MySixth\tarot-backend\.env -Force
```
最少需设置（示例）：
```
# tarot-backend/.env
JWT_SECRET_KEY=dev-secret-key
DEBUG=true
# 若要测 LLM/支付，再补充对应 Key
```

## 准备 docker-compose（开发绑定宿主 DB）
在仓库根目录的 `docker-compose.yml` 中为 backend 使用宿主机 DB 文件绑定：
```
services:
  backend:
    build: ./tarot-backend
    env_file: ./tarot-backend/.env
    environment:
      - DATABASE_URL=sqlite:////data/backend_tarot.db
    volumes:
      - "D:\\0-development\\projects\\MySixth\\tarot-backend\\backend_tarot.db:/data/backend_tarot.db:rw"
      - ./tarot-backend/static:/app/static:ro
    expose:
      - "8000"

  admin:
    build: ./tarot-admin-web
    environment:
      - NEXT_PUBLIC_BACKEND_URL=/
    depends_on: [backend]
    expose:
      - "3000"

  nginx:
    image: nginx:1.25-alpine
    volumes:
      - ./deploy/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "80:80"   # 如 80 被占用，改为 "8080:80"
    depends_on: [backend, admin]
```

## 启动与构建
在仓库根目录执行：
```
docker compose build
docker compose up -d
```
如端口占用：
- 将上文 `"80:80"` 改成 `"8080:80"`，启动后访问使用 `http://localhost:8080/`。

## 功能验证
- 打开后台 Web：
  - http://localhost/ （或 `http://localhost:8080/`）
- 健康检查：
  - 浏览器访问 http://localhost/api/health 应返回形如：`{"status":"healthy",...}`
  - PowerShell：
    ```
    Invoke-RestMethod http://localhost/api/health
    ```
- 管理登录：
  - 在 UI `{/login}` 使用 `.env` 中的 `ADMIN_USERNAME` / `ADMIN_PASSWORD`（未设置则使用应用默认）。
- 前后端联通：
  - 页面能正常加载用户/兑换码列表；或在浏览器 Network/Console 观察 API 调用为 `200`。

## 数据库维护（开发环境）
由于已绑定宿主机文件，可直接替换或备份 `backend_tarot.db`。

1) 替换数据库（推荐在低写入时段）
```
docker compose stop backend
# 替换宿主机文件（示例：用新文件覆盖）
Copy-Item -Path D:\temp\new_backend_tarot.db -Destination D:\0-development\projects\MySixth\tarot-backend\backend_tarot.db -Force

docker compose start backend
# 校验完整性
$container = (docker compose ps -q backend)
docker exec $container sh -lc "sqlite3 /data/backend_tarot.db 'PRAGMA integrity_check;'"
```

2) 快速备份当前 DB
```
Copy-Item -Path D:\0-development\projects\MySixth\tarot-backend\backend_tarot.db -Destination D:\0-development\projects\MySixth\tarot-backend\backup_backend_tarot_$(Get-Date -Format yyyyMMdd_HHmm).db
```

3) 若未使用宿主文件绑定（改用卷）时的上传/下载
- 获取容器名：`docker compose ps` 或 `docker ps`
- 下载：
  ```
  docker cp <backend容器名>:/data/backend_tarot.db .\backend_tarot.db
  ```
- 上传并原子替换：
  ```
  docker cp .\backend_tarot.db <backend容器名>:/data/backend_tarot.new
  docker exec <backend容器名> sh -lc "sqlite3 /data/backend_tarot.new 'PRAGMA integrity_check;' && mv /data/backend_tarot.db /data/backend_tarot.bak && mv /data/backend_tarot.new /data/backend_tarot.db"
  ```

## 日志与排障
- 查看实时日志：
```
docker compose logs -f backend
docker compose logs -f admin
docker compose logs -f nginx
```
- 重新构建并启动：
```
docker compose build --no-cache backend admin
docker compose up -d --force-recreate
```
- 常见问题：
  - 端口占用：改 `ports` 映射为 `8080:80`。
  - CORS：已同域反代；确保 `NEXT_PUBLIC_BACKEND_URL=/`。
  - 依赖安装慢：首次构建时间较长，后续利用缓存会加速。

## 清理环境
```
docker compose down -v
```
这将停止并移除容器、网络，并删除命名卷（如使用了命名卷）。如使用宿主机 DB 绑定，不会删除你的 `backend_tarot.db`。

--
如需，我可以将上述 compose 片段与配置直接合并到现有 `docker-compose.yml` 并为你一键启动验证。
