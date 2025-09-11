# 塔罗牌 App 架构设计文档（MVP 简化版）

---

## 🎯 目标与原则

* **最小可行产品（MVP）**，快速上线验证
* **初期运营压力小**，优先降低开发和运维成本
* **支持 Android / iOS 双平台**
* **支持匿名用户**，无需复杂账户体系
* **提供静态基础解读 + 付费 LLM 动态解读**
* 架构可平滑演进，支持后续扩展

---

## 🧱 架构概览

```
[Expo RN 客户端]
    ↓ HTTPS
[FastAPI 单体后端]
    ├── 卡牌/牌阵/解读 API
    ├── LLM 调用 (LangChain + OpenAI)
    ├── 定时任务 (APScheduler)
    ├── 支付 (Stripe Checkout)
    ├── SQLite / PostgreSQL 单库
    └── 静态资源 (卡牌图片 / JSON)
```

**部署形态**

* 单台云服务器（2C/4G）
* FastAPI（`uvicorn`）+ SQLite 文件数据库
* Nginx + TLS 反向代理
* Expo EAS 构建客户端包

---

## 📱 前端（UI 模块）

* 技术栈：React Native (TypeScript) + Expo
* 使用 EAS Build 构建 Android / iOS 安装包
* 支持 OTA 更新，快速迭代 JS 层逻辑
* 主要界面：
  * 首页（Spread 入口）
  * 卡牌洗牌 / 抽牌 / 翻牌动画
  * 牌阵结果解读页
  * 付费解读入口与支付页

---

## ⚙️ 后端（服务模块）

* 框架：FastAPI（Python）
* 数据库：SQLite（初期），后续可迁移 PostgreSQL
* 定时任务：APScheduler（更新维度、卡牌解读数据）
* LLM 调用：LangChain 封装 OpenAI API
* 支付：Stripe Checkout（Web 页支付 + 回调）
* 静态资源：`/static/` 目录放置卡牌图、解读文案


---

## 📡 API 设计（示例）

| 方法   | 路径                   | 说明                    |
| ---- | -------------------- | --------------------- |
| POST | `/auth/anon`         | 生成匿名用户ID              |
| GET  | `/cards`             | 获取卡牌列表                |
| GET  | `/dimensions`        | 获取维度列表                |
| POST | `/readings`          | 请求一次解读（同步 LLM 调用）     |
| GET  | `/readings/{id}`     | 获取历史解读结果              |
| POST | `/payments/checkout` | 创建 Stripe Checkout 会话 |
| POST | `/webhooks/stripe`   | Stripe 支付回调           |

---

## 🛡️ 安全与隐私（MVP 最低限）

* 强制 HTTPS
* SQLite 文件读写权限限制
* Stripe 回调签名校验
* 基础输入过滤，防止敏感内容传入 LLM

---

## 🚀 部署与运维

* 部署：
  * FastAPI 使用 `systemd` 或 `pm2` 守护
  * Nginx 做反向代理
  * 证书使用 Let's Encrypt 自动更新
* 监控：
  * 简单日志监控（uvicorn 日志 + Stripe webhook 日志）
  * 数据库每日备份（crontab）

---

## 📈 演进路线（按需扩展）

| 触发点     | 升级方向                        |
| ------- | --------------------------- |
| 请求量增大   | 增加 Redis 缓存、Celery 异步任务     |
| 数据量增大   | 迁移到 PostgreSQL              |
| LLM 成本高 | 缓存结果 / prompt 优化 / 降级链路     |
| 架构复杂度上升 | 拆分为 API / Worker / Admin 服务 |

---

## 离线同步架构 (Offline Sync Architecture)

### 同步策略 (Sync Strategy)
- **初始化同步**：首次启动时下载全量数据
- **增量更新**：后端通过推送通知触发更新
- **手动同步**：用户可主动触发同步
- **排除同步**：`user_history` 表不参与同步

### 同步模式 (Sync Modes)
1. 自动后台同步
   - 应用启动时检查更新
   - 网络环境稳定时静默同步
2. 手动同步
   - 用户可在设置中主动触发
   - 提供同步进度和结果反馈

### 同步表 (Sync Tables)
1. `card`
2. `card_style`
3. `dimension`
4. `card_interpretation`
5. `card_interpretation_dimension`
6. `spread`
7. `user`

### 技术实现 (Technical Implementation)
- 客户端本地数据库：SQLite/Realm
- 更新通知：WebSocket / Server-Sent Events
- 数据传输：增量更新，最小化网络负载

### 手动同步用户体验 (Manual Sync User Experience)
- 设置页面添加"立即同步"按钮
- 同步过程中显示进度条
- 提供同步结果通知
  * 成功：显示更新的数据项数量
  * 失败：展示错误信息和重试选项

### 同步流程 (Sync Workflow)
1. 应用启动时执行初始全量同步
2. 后端维护每个表的最后更新时间戳
3. 客户端仅接收增量变更
4. 推送通知触发选择性更新
5. 用户可随时手动触发同步

### API 设计 (API Design)
- `GET /sync/initial`: 获取初始全量数据
- `GET /sync/delta`: 获取增量更新
- `POST /sync/manual`: 手动触发同步
- `WebSocket /sync/updates`: 实时更新推送

### 冲突解决 (Conflict Resolution)
- 服务端版本号优先
- 基于时间戳的更新合并
- 保留最新服务端数据

### 性能与安全 (Performance & Security)
- 压缩数据传输
- 增量更新减少网络负载
- 使用安全加密传输
- 最小化数据传输大小

### 离线能力 (Offline Capabilities)
- 完整本地数据缓存
- 支持离线使用核心功能
- 同步状态实时追踪
- 用户可主动控制同步过程

---

## ✅ 优势

* 架构简单，开发和维护成本极低
* 快速上线，快速迭代
* 适合初期用户量小、团队精简的阶段
* 支持灵活的离线同步机制

---

## 📌 下一步

1. 完成数据库 schema 定义（DDL）
2. 编写后端 API（FastAPI）
3. 搭建 Expo RN 客户端
4. 接入 OpenAI API + Stripe 支付
5. 实现离线同步机制
6. 测试端到端流程