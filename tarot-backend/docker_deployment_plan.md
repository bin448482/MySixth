# Docker 容器化部署计划

## 📋 概述

为塔罗牌后端应用创建完整的Docker部署方案，支持开发、测试和生产环境的容器化部署。

## 🎯 部署目标

- **简化部署流程**: 一键启动完整应用环境
- **环境一致性**: 开发、测试、生产环境保持一致
- **可扩展性**: 支持水平扩展和负载均衡
- **数据持久化**: 数据库和文件存储的持久化
- **监控和日志**: 集成日志收集和健康检查

## 📁 需要创建的文件

### 1. 核心容器配置

#### `Dockerfile`
```dockerfile
# 多阶段构建的生产级Dockerfile
FROM python:3.11-slim as builder
FROM python:3.11-slim as runtime
# 包含依赖安装、用户权限、健康检查等
```

#### `docker-compose.yml` (开发环境)
```yaml
# 开发环境配置
services:
  tarot-backend:
    # 代码热重载
    # 开发数据库挂载
    # 调试端口暴露
```

#### `docker-compose.prod.yml` (生产环境)
```yaml
# 生产环境配置
services:
  tarot-backend:
    # 优化的运行时配置
  nginx:
    # 反向代理和负载均衡
  # 可选: Redis缓存
  # 可选: 监控服务
```

### 2. 配置文件

#### `.dockerignore`
```
# 排除不必要的文件
__pycache__/
*.pyc
.git/
.vscode/
tests/
```

#### `nginx/nginx.conf`
```nginx
# Nginx反向代理配置
# 静态文件服务
# 负载均衡配置
```

### 3. 环境配置

#### `.env.docker` (Docker专用环境变量)
```env
# 数据库配置
DATABASE_URL=sqlite:///./data/backend_tarot.db

# 应用配置
DEBUG=False
HOST=0.0.0.0
PORT=8000

# 安全配置
JWT_SECRET_KEY=docker-production-secret-key
ADMIN_PASSWORD=secure-admin-password
```

#### `.env.docker.dev` (开发环境)
```env
# 开发环境专用配置
DEBUG=True
# 其他开发配置
```

### 4. 部署脚本

#### `scripts/build.sh`
```bash
#!/bin/bash
# Docker镜像构建脚本
# 支持不同环境的构建标签
```

#### `scripts/deploy.sh`
```bash
#!/bin/bash
# 生产环境部署脚本
# 包含滚动更新和健康检查
```

#### `scripts/dev-setup.sh`
```bash
#!/bin/bash
# 开发环境快速启动脚本
```

## 🏗️ 部署架构设计

### 开发环境架构
```
┌─────────────────────────────────────┐
│           Docker Desktop            │
├─────────────────────────────────────┤
│  ┌─────────────────────────────────┐│
│  │      tarot-backend:dev          ││
│  │                                 ││
│  │  ├─ FastAPI App (热重载)       ││
│  │  ├─ SQLite DB (挂载卷)         ││
│  │  ├─ 代码挂载 (./:/app)          ││
│  │  └─ 端口: 8000                  ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### 生产环境架构
```
┌─────────────────────────────────────┐
│            Docker Swarm             │
├─────────────────────────────────────┤
│  ┌─────────────────────────────────┐│
│  │         Nginx (反向代理)        ││
│  │         端口: 80/443            ││
│  └─────────────────┬───────────────┘│
│                    │                │
│  ┌─────────────────▼───────────────┐│
│  │      tarot-backend:prod         ││
│  │                                 ││
│  │  ├─ FastAPI App (多实例)       ││
│  │  ├─ SQLite DB (数据卷)         ││
│  │  ├─ 静态文件服务                ││
│  │  └─ 健康检查                    ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │        监控和日志 (可选)        ││
│  │  ├─ Prometheus                  ││
│  │  └─ Grafana                     ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

## 📋 实施步骤

### 阶段1: 基础容器化 (1天)
1. **创建Dockerfile**
   - 基于Python 3.11-slim
   - 优化层缓存和镜像大小
   - 配置用户权限和工作目录
   - 添加健康检查

2. **开发环境配置**
   - 创建docker-compose.yml
   - 配置代码热重载
   - 设置数据卷挂载
   - 环境变量配置

3. **基础测试**
   - 验证容器构建成功
   - 测试应用启动正常
   - 确认API接口可访问

### 阶段2: 生产环境优化 (1天)
1. **生产配置**
   - 创建docker-compose.prod.yml
   - 配置Nginx反向代理
   - 设置数据持久化
   - 优化资源限制

2. **安全加固**
   - 非root用户运行
   - 安全的环境变量管理
   - 网络隔离配置
   - 文件权限优化

3. **性能优化**
   - 多阶段构建优化
   - 静态资源缓存
   - 数据库连接池配置

### 阶段3: 部署脚本和监控 (0.5天)
1. **自动化脚本**
   - 构建脚本 (build.sh)
   - 部署脚本 (deploy.sh)
   - 备份脚本 (backup.sh)

2. **监控和日志**
   - 健康检查配置
   - 日志收集设置
   - 可选监控集成

## 🚀 使用方法

### 开发环境
```bash
# 1. 构建和启动开发环境
docker-compose up --build

# 2. 后台运行
docker-compose up -d

# 3. 查看日志
docker-compose logs -f tarot-backend

# 4. 进入容器调试
docker-compose exec tarot-backend bash

# 5. 停止服务
docker-compose down
```

### 生产环境
```bash
# 1. 构建生产镜像
./scripts/build.sh prod

# 2. 部署到生产环境
./scripts/deploy.sh

# 3. 滚动更新
./scripts/deploy.sh --update

# 4. 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 5. 扩容服务
docker-compose -f docker-compose.prod.yml up -d --scale tarot-backend=3
```

## 🔧 配置选项

### 环境变量配置
| 变量名 | 开发环境默认值 | 生产环境默认值 | 说明 |
|--------|----------------|----------------|------|
| DEBUG | true | false | 调试模式 |
| HOST | 0.0.0.0 | 0.0.0.0 | 监听地址 |
| PORT | 8000 | 8000 | 监听端口 |
| WORKERS | 1 | 4 | 工作进程数 |
| DATABASE_URL | sqlite:///./data/dev.db | sqlite:///./data/prod.db | 数据库连接 |

### 资源限制
| 服务 | CPU限制 | 内存限制 | 说明 |
|------|---------|----------|------|
| tarot-backend | 1.0 | 512MB | 应用服务 |
| nginx | 0.5 | 128MB | 反向代理 |

## 📊 数据管理

### 数据卷配置
```yaml
volumes:
  # 数据库数据持久化
  tarot_db_data:
    driver: local

  # 静态文件存储
  tarot_static_data:
    driver: local

  # 日志文件
  tarot_logs:
    driver: local
```

### 备份策略
```bash
# 自动备份脚本
# 1. 数据库备份
# 2. 静态文件备份
# 3. 配置文件备份
# 4. 定期清理旧备份
```

## 🛡️ 安全考虑

### 容器安全
- 使用非root用户运行应用
- 最小权限原则
- 定期更新基础镜像
- 扫描镜像漏洞

### 网络安全
- 内部网络隔离
- 仅暴露必要端口
- SSL/TLS加密传输
- 防火墙规则配置

### 数据安全
- 敏感数据环境变量化
- 数据卷加密
- 定期数据备份
- 访问权限控制

## 🔍 监控和日志

### 健康检查
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1
```

### 日志配置
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "100m"
    max-file: "5"
    tag: "tarot-backend"
```

### 监控指标
- 应用响应时间
- CPU和内存使用率
- 数据库连接状态
- API请求量和错误率

## 🚨 故障排除

### 常见问题
1. **容器启动失败**
   - 检查端口占用
   - 验证环境变量配置
   - 查看容器日志

2. **数据库连接问题**
   - 确认数据卷挂载
   - 检查数据库文件权限
   - 验证连接字符串

3. **静态文件不可访问**
   - 检查Nginx配置
   - 验证文件路径映射
   - 确认文件权限设置

### 调试命令
```bash
# 查看容器状态
docker-compose ps

# 查看容器日志
docker-compose logs tarot-backend

# 进入容器调试
docker-compose exec tarot-backend bash

# 检查网络连接
docker network ls
docker network inspect tarot-backend_default
```

## 📈 性能优化

### 镜像优化
- 多阶段构建减少镜像大小
- .dockerignore排除不必要文件
- 层缓存优化构建速度
- 基础镜像选择和更新

### 运行时优化
- 合理配置工作进程数
- 数据库连接池优化
- 静态文件缓存策略
- 资源限制和配额

## 📋 部署检查清单

### 部署前检查
- [ ] 环境变量配置完整
- [ ] 数据库迁移脚本准备
- [ ] SSL证书配置(如需要)
- [ ] 防火墙规则设置
- [ ] 备份策略确认

### 部署后验证
- [ ] 应用服务正常启动
- [ ] API接口正常响应
- [ ] 管理后台可访问
- [ ] 数据库连接正常
- [ ] 日志输出正常
- [ ] 健康检查通过

## 🔮 未来扩展

### 微服务拆分准备
- 数据库服务独立
- 缓存服务集成
- 消息队列支持
- API网关配置

### 云原生支持
- Kubernetes配置
- Helm Charts
- CI/CD集成
- 自动扩缩容

---

**预计实施时间**: 2.5个工作日
**技术要求**: Docker, Docker Compose, Nginx基础知识
**推荐环境**: Docker Desktop 4.0+, 至少4GB内存