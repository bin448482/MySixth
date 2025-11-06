# 应用发布 API 设计方案

> 目标：为 `tarot-admin-web` 中的发布管理页与客户端下载门户提供完善的后台接口与数据能力。

## 1. 背景与需求来源

- 管理员通过后台“应用发布管理”界面上传最新版 APK，并查看当前在线版本的元数据。（参见 `tarot-admin-web/src/app/app-release/page.tsx:77` 获取最新版本、`tarot-admin-web/src/app/app-release/page.tsx:147` 执行上传）
- 对外的“客户端发布门户”需要无登录即可展示最新版本信息与下载链接。（参见 `tarot-admin-web/src/app/client-portal/page.tsx:63`）
- 现有后端尚未提供应用发布相关的数据模型与接口，需要新建一组 API、数据库表以及文件存储策略。

## 2. 功能范围

1. **文件上传**：管理员上传 `.apk` 文件（≤300MB），填写版本号、构建号、发布说明、更新日志链接。
2. **版本发布管理**：保存历史记录，仅将最新版本标记为“上线版本”，返回下载链接等元信息。
3. **公开查询**：客户端门户可匿名访问最新发布信息。
4. **元数据维护**：保存上传人、校验值（SHA256）、文件大小、发布时间等信息，供前端展示与审计。

## 3. 数据模型设计

新增 `app_releases` 表（SQLAlchemy 模型 `AppRelease`）：

| 字段             | 类型 / 约束                      | 说明 |
|------------------|----------------------------------|------|
| `id`             | `Integer`, PK                    | 主键 |
| `version`        | `String(50)`, not null           | 语义化版本号，例 `1.2.3` |
| `build_number`   | `String(50)`, nullable           | 构建号，例 `10203` |
| `release_notes`  | `Text`, nullable                 | 发布备注 |
| `notes_url`      | `String(255)`, nullable          | 外部更新日志链接（可选） |
| `file_name`      | `String(255)`, not null          | 服务器保存的文件名 |
| `file_size`      | `Integer`, not null              | 字节数 |
| `checksum_sha256`| `String(64)`, not null           | APK 的 SHA256 校验值 |
| `download_url`   | `String(255)`, not null          | 对外可访问的下载地址（建议存储为 `/static/app-releases/<file>` 相对路径） |
| `uploaded_by`    | `String(50)`, nullable           | 管理员用户名 |
| `uploaded_at`    | `DateTime`, default `utcnow`     | 上传时间 |
| `is_active`      | `Boolean`, default `False`, idx  | 是否为当前上线版本 |

实现要点：

- 新文件存储在 `static/app-releases/` 目录，文件名建议为 `YYYYMMDDHHMMSS_version_build.apk`，避免覆盖。
- 上传后将所有旧记录 `is_active` 置为 `False`，新的记录设为 `True`，保证“唯一上线版本”语义。
- `download_url` 存储为相对路径，如 `/static/app-releases/<filename>`，由 Nginx/Next.js 前端通过 `NEXT_PUBLIC_BACKEND_URL` 拼接成完整地址。

## 4. API 设计

| 接口 | 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|------|
| 获取最新版本（公开） | `GET` | `/api/v1/app-release/latest` | 无 | 客户端门户使用 |
| 获取最新版本（后台） | `GET` | `/api/v1/admin/app-release/latest` | Admin JWT | 后台管理页加载数据 |
| 上传新版本 | `POST` | `/api/v1/admin/app-release` | Admin JWT | 上传 APK 与元信息 |
| 历史记录（可选扩展） | `GET` | `/api/v1/admin/app-release/history` | Admin JWT | 返回分页历史版本列表 |

### 4.1 公共最新版本 `GET /api/v1/app-release/latest`

- **返回示例**

```jsonc
{
  "success": true,
  "release": {
    "id": 12,
    "version": "1.4.0",
    "build_number": "10400",
    "release_notes": "✨ 新增凯尔特十字抽牌流程",
    "notes_url": "https://example.com/tarot/release-notes/1.4.0",
    "download_url": "/static/app-releases/20250301_140_10400.apk",
    "file_size": 128734912,
    "checksum": "4c1b7a...",
    "uploaded_by": "admin",
    "uploaded_at": "2025-03-01T11:23:45Z"
  }
}
```

- **说明**
  - 响应字段命名与前端 `AppRelease` 类型对齐。
  - 如无记录，返回 `{"success": true, "release": null}`。
  - 保留兼容字段：同时返回 `data` 与 `release`（前端 `appReleaseApi.getLatestRelease` 会尝试两者）。

### 4.2 后台最新版本 `GET /api/v1/admin/app-release/latest`

- 与公开接口返回完全一致，但需通过 `require_admin` 依赖校验 JWT。
- 失败时统一返回 `401`/`403` 并清除前端 token。

### 4.3 上传新版本 `POST /api/v1/admin/app-release`

- **请求**：`multipart/form-data`
  - `apk_file` (`UploadFile`, required) — 支持别名 `file` 以兼容前端双字段上传。
  - `version` (`str`, required) — 语义化版本号，正则建议 `^[0-9A-Za-z._-]{1,50}$`。
  - `build_number` (`str`, optional) — 纯数字或短字符串。
  - `release_notes` (`str`, optional, ≤1000` 字`).
  - `description` (`str`, optional) — 与 `release_notes` 等价，保留兼容。
  - `notes_url` (`str`, optional) — 有效 URL。

- **处理流程**
  1. 校验文件扩展名为 `.apk`，读取头部确保 `application/vnd.android.package-archive`；限制大小 ≤ 300MB。
  2. 计算 SHA256、文件大小，生成目标文件名并保存至 `static/app-releases/`。
  3. 事务内：将旧记录 `is_active=False`，插入新记录 `is_active=True`。
  4. 使用 `request.state.admin_username` 或 `current_admin` 填充 `uploaded_by`。
  5. 返回最新记录。

- **返回示例**

```jsonc
{
  "success": true,
  "message": "上传成功",
  "release": {
    "...": "..."
  }
}
```

- **错误码**
  - `400`: 参数无效、缺少文件、版本号重复（可选校验）、文件大小超限、非 APK。
  - `415`: MIME 类型不符合预期。
  - `500`: 存储/数据库错误（需记录日志）。

### 4.4 历史记录（可选）`GET /api/v1/admin/app-release/history`

- Query：`page`（默认1）、`size`（默认20，最大100）。
- 返回 `{"success": true, "items": [...], "total": 5, "page": 1, "size": 20}`。
- 便于后续在后台增加历史版本列表或回滚能力。

## 5. 验证与安全

- 上传接口仅允许 Admin JWT；依赖 `app.utils.admin_auth.require_admin`。
- 存储路径由配置项控制：新增 `APP_RELEASE_STORAGE_DIR`（默认 `static/app-releases`）与 `APP_RELEASE_BASE_URL`（默认 `/static/app-releases`）。
- 上传完成后需清理旧文件（可选）：若希望节省空间，可在新版本上线后删除旧文件，或另增后台按钮手动清理。
- 对外下载走 Nginx 静态目录映射，确保未登录用户也可访问。

## 6. 代码结构调整建议

| 目录 | 变更 | 说明 |
|------|------|------|
| `app/models/app_release.py` | 新增 | 定义 SQLAlchemy 模型 |
| `app/models/__init__.py` | 更新 | 暴露 `AppRelease` |
| `app/database.py` | 更新 | 将 `AppRelease.__table__` 纳入 `create_tables` / `drop_tables` |
| `app/schemas/app_release.py` | 新增 | 请求/响应 Pydantic 模型 |
| `app/services/app_release_service.py` | 新增 | 封装上传、查询逻辑（文件保存、数据库操作） |
| `app/api/app_release.py` | 新增 | FastAPI 路由，挂载到 `/api/v1` 与 `/api/v1/admin` |
| `app/main.py` | 更新 | 注册新路由 |
| `migrations/versions/*` | 新增 | Alembic 迁移创建 `app_releases` 表 |
| `config/settings` | 更新 | 新增存储目录、大小限制配置项 |
| `tests/api/test_app_release.py` | 新增 | 单元/集成测试（可使用 `TestClient` + 临时文件） |

## 7. 测试策略

1. **单元测试**：`AppReleaseService` 文件保存、校验、数据库写入逻辑（Mock 文件流）。
2. **集成测试**：使用 FastAPI `TestClient`，覆盖上传成功/失败、匿名获取最新版本等场景。
3. **端到端（可选）**：结合 `tarot-admin-web` 的 Playwright 预留脚本，模拟管理员上传并在客户端门户验证显示。
4. **回归检查**：确认未登录访问 `/api/v1/app-release/latest` 返回 200，登录状态上传后返回 200 且前端页面显示更新的信息。

## 8. 后续扩展

- 支持多平台包（Android APK、AAB、iOS TestFlight 链接）时，可增加 `platform` 字段并扩展上传表单。
- 增加签名校验与自动化扫描（比如使用 Google Play API）以提升安全性。
- 在客户端门户中展示历史版本或差分更新说明。

---

如需进一步细化实现步骤或迁移脚本，请在确认设计后再补充详细任务清单。*** End Patch
