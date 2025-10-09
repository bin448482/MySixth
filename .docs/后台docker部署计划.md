# 后台 Docker 部署计划（draft）

本计划将 tarot-backend（FastAPI）、tarot-admin-web（Next.js）与 Nginx 分为三个容器，通过 Nginx 统一对外提供服务，并满足“在开发环境可直接上传/下载 SQLite 数据库文件 backend_tarot.db”的需求。

## 目标
- 三容器解耦：便于独立构建、发布与回滚。
- 统一入口：Nginx 暴露 80/443，`/api` 反代到 backend，其余走 admin。
- 配置外置：API Key/JWT 等通过环境变量与 Secret 注入。
- 数据持久化：SQLite 挂载卷；提供简便的导入/导出（上传/下载）流程。
- 可迁移到 MCP 云平台：本地用 docker compose 验证，MCP 上按等价编排部署。

## 容器与端口
- backend（FastAPI + Uvicorn）：:8000，对内暴露；健康检查 `/health`。
- admin（Next.js runtime）：:3000，对内暴露；通过 Nginx 对外。
- nginx（反向代理）：:80 对外暴露，生产建议加 TLS(:443)。

## 目录规范（建议新建）
- tarot-backend/Dockerfile
- tarot-admin-web/Dockerfile
- deploy/nginx/nginx.conf
- docker-compose.yml（本地/开发环境）

注：本计划先给出文件草案，待 Review 后再落盘。

## Dockerfile 草案

backend（tarot-backend/Dockerfile）
```
FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
COPY static ./static
# 不把 .env 或数据库打进镜像
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

admin（tarot-admin-web/Dockerfile，多阶段）
```
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
ENV NEXT_PUBLIC_BACKEND_URL=/
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
CMD ["npm", "run", "start"]
```

## Nginx 配置草案（deploy/nginx/nginx.conf）
```
worker_processes auto;
events { worker_connections 1024; }
http {
  sendfile on;
  gzip on;

  upstream backend { server backend:8000; }
  upstream admin   { server admin:3000; }

  server {
    listen 80;

    # 后端 API 反代
    location /api/ {
      proxy_pass http://backend;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 后端静态（如需直出）
    location /static/ { proxy_pass http://backend; }

    # 其余走 Next.js
    location / {
      proxy_pass http://admin;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header Host $host;
    }
  }
}
```

## docker-compose（本地/开发环境）
```
version: "3.9"
services:
  backend:
    build: ./tarot-backend
    env_file: ./tarot-backend/.env
    environment:
      - DATABASE_URL=sqlite:////data/backend_tarot.db
    volumes:
      # 开发环境：把宿主机 DB 直接挂到容器，便于直接维护
      - backend_data:/data
      - ./tarot-backend/static:/app/static:ro
    expose:
      - "8000"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8000/health"]
      interval: 10s
      timeout: 3s
      retries: 5

  admin:
    build: ./tarot-admin-web
    environment:
      - NEXT_PUBLIC_BACKEND_URL=/
    depends_on:
      - backend
    expose:
      - "3000"

  nginx:
    image: nginx:1.25-alpine
    volumes:
      - ./deploy/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "80:80"
    depends_on:
      - backend
      - admin

volumes:
  backend_data:
```

说明：上面用命名卷 `backend_data`，在本地/开发可以改为宿主路径绑定，直接指向 `D:\\0-development\\projects\\MySixth\\tarot-backend\\backend_tarot.db` 所在目录，满足“直接维护”需求。例如：
```
    volumes:
      - D:\\0-development\\projects\\MySixth\\tarot-backend\\:/host-backend:rw
      - /host-backend/backend_tarot.db:/data/backend_tarot.db:rw
```

## 环境变量与 Secret
- backend 关键变量（来自 tarot-backend/.env）
  - `ZHIPUAI_API_KEY` / `OPENAI_API_KEY` / `OPENAI_BASE_URL`
  - `JWT_SECRET_KEY`, `JWT_ALGORITHM`
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`（如启用支付）
  - `DATABASE_URL=sqlite:////data/backend_tarot.db`
- admin 关键变量
  - `NEXT_PUBLIC_BACKEND_URL=/`（通过 Nginx 反代同域 `/api`，避免 CORS）

生产/云环境应通过 MCP Secret 管理器注入，不写死在镜像和仓库。

## 数据库（SQLite）维护方案
目标：在开发环境可直接上传/下载 `backend_tarot.db`。同时考虑运行期安全与一致性。

可选方案（推荐顺序）：
1) 绑定宿主路径（开发本机）：
   - 在 docker-compose 的 backend 容器挂载宿主目录与单个文件（见上文）。
   - 直接在宿主机替换/备份该文件即可（注意应用在写时可能锁表）。

2) docker cp（云/容器内卷）：
   - 下载：`docker cp backend:/data/backend_tarot.db ./backend_tarot.db`
   - 上传：`docker cp ./backend_tarot.db backend:/data/backend_tarot.db`
   - 更安全做法：上传到临时名并原子替换：
     ```
     docker cp ./backend_tarot.db backend:/data/backend_tarot.new
     docker exec backend sh -lc "sqlite3 /data/backend_tarot.new 'PRAGMA integrity_check;' && mv /data/backend_tarot.db /data/backend_tarot.bak && mv /data/backend_tarot.new /data/backend_tarot.db"
     ```
   - 替换前建议将 backend 置为维护模式或短暂停止写入（低流量时段）。

3) 管理端 API（MCP 开发环境）：
   - 新增两个受管理员 JWT 保护的端点（仅开发/内网启用）：
     - GET `/api/v1/admin/db/download`：流式下载当前 DB 文件（支持可选 gzip）。
     - POST `/api/v1/admin/db/upload`（multipart/form-data）：上传到临时文件，做 `PRAGMA integrity_check` 后备份原文件并原子替换。
   - 风险与约束：仅开发环境启用；加请求体大小限制；开启严格鉴权与审计日志。

4) 备份策略
   - 每日/每次发布前备份：`cp /data/backend_tarot.db /data/backup/backend_tarot_YYYYMMDDHHMM.db`。
   - 监控磁盘使用与 WAL 文件大小（如启用 WAL）。

5) 校验与一致性
   - 上传后执行：`sqlite3 /data/backend_tarot.db 'PRAGMA integrity_check;'`，返回 `ok` 为通过。
   - 如启用 WAL 模式：替换时务必 checkpoint：`sqlite3 /data/backend_tarot.db 'PRAGMA wal_checkpoint(TRUNCATE);'`。

## 本地验证流程
- 构建并启动：
  ```
  docker compose build
  docker compose up -d
  ```
- 访问：
  - 后台 Web：http://localhost/
  - 后端 API（健康）：http://localhost/api/health
- 管理 DB（任选其一）：
  - 绑定宿主路径：直接操作 `D:\\...\\backend_tarot.db`。
  - 或 `docker cp` 上传/下载（见上文）。

## MCP 云部署要点
- 使用 MCP 的镜像仓库与应用编排：
  - 构建并推送镜像：
    ```
    docker buildx build --platform linux/amd64 -t <registry>/tarot-backend:<tag> ./tarot-backend --push
    docker buildx build --platform linux/amd64 -t <registry>/tarot-admin-web:<tag> ./tarot-admin-web --push
    # Nginx 可用官方镜像 + 挂载配置，或自制镜像 COPY nginx.conf
    ```
  - 在 MCP 创建 3 个服务或导入 Compose/K8s：
    - backend：注入 .env/Secret，挂载持久卷至 `/data`。
    - admin：`NEXT_PUBLIC_BACKEND_URL=/`。
    - nginx：暴露公网 80/443，配置反代。
- DB 上传/下载（云开发环境）：
  - 若 MCP 支持文件浏览/终端：使用 `docker cp` 或平台的“文件上传/下载”。
  - 若需在线页面操作：启用“管理端 API”方案，仅在开发环境开放。
- 入口与域名：
  - MCP 若有 Ingress/Gateway，可直接在网关层完成 `/api` → backend，`/` → admin 的路由，则 nginx 容器可选。

## 健康检查与监控
- backend：`/health`，返回 200 表示健康。
- nginx：被动健康（可用 200 首页探测）。
- 日志：
  - backend：stdout/stderr；关键 API 已有请求/错误日志。
  - nginx：默认 access/error 日志（可映射卷导出）。

## 回滚策略
- 镜像带 tag 发布；发现异常快速切回上一 tag。
- DB 替换时保留 `.bak`，一键回滚：`mv backend_tarot.bak backend_tarot.db`。

## 安全与合规
- API Key/JWT Secret 永不入库或镜像，使用 Secret 注入。
- 管理端上传/下载 DB 仅在开发环境启用，开启严格鉴权、速率限制与审计。
- 如含用户隐私数据，DB 导出需遵循相应合规（加密/脱敏/访问审批）。

## 待决策项
- 是否采纳“管理端 API”上传/下载 DB 的实现（我可补一版 FastAPI 路由草案）。
- 生产是否保留 nginx 容器，或改用 MCP Ingress 代替。
- SQLite 是否长期用于生产，或迁移 PostgreSQL（便于并发与云备份）。

--
以上为可执行的部署方案草案。确认后我再按本计划落盘相关 Dockerfile、nginx.conf 与 compose 文件，并补充（如需要）DB 上传/下载的后端路由实现。
