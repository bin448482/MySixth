# 塔罗牌Web管理系统开发文档 (CLAUDE.md)

## 📖 项目简介

**塔罗牌Web管理系统** 是一个基于 Next.js + Ant Design 的现代化管理后台，完全替代原有的FastAPI Jinja2模板系统，提供更好的用户体验。

## 🎯 核心目标

- **功能完整性**: 完全保留原有的仪表板、用户管理、兑换码管理、订单管理功能
- **技术现代化**: 从传统模板系统升级到现代React技术栈
- **用户体验**: 提供流畅的SPA体验和实时数据更新

## 🛠️ 技术栈

### 前端框架
- **Next.js 15.5.4**: App Router + React 19 + TypeScript
- **Ant Design 6.x**: 企业级UI组件库，神秘塔罗风格主题
- **@ant-design/charts**: 基于G2的图表库，用于数据可视化
- **Zustand**: 轻量级状态管理（预留）
- **SWR**: 数据获取和缓存（预留）

### 开发工具
- **TypeScript 5**: 类型安全
- **ESLint**: 代码质量
- **Tailwind CSS 4**: 样式框架（与Ant Design并用）

## 📁 项目结构

```
tarot-admin-web/
├── src/
│   ├── app/                    # Next.js App Router页面
│   │   ├── page.tsx           # 主页（重定向逻辑）
│   │   ├── login/             # 登录页面
│   │   ├── dashboard/         # 仪表板
│   │   ├── users/             # 用户管理
│   │   ├── redeem-codes/      # 兑换码管理
│   │   └── orders/            # 订单管理
│   ├── components/            # 组件库
│   │   └── layout/            # 布局组件
│   │       └── AdminLayout.tsx # 主布局
│   ├── lib/                   # 核心库
│   │   ├── api-client.ts      # API客户端
│   │   └── api.ts             # API服务层
│   ├── types/                 # TypeScript类型定义
│   │   └── index.ts           # 全局类型
│   └── styles/                # 样式配置
│       └── theme.ts           # Ant Design主题
├── .env.local                 # 环境配置
├── next.config.ts             # Next.js配置
├── tsconfig.json              # TypeScript配置
└── package.json               # 依赖管理
```

## 🔌 API集成设计

### 后端兼容性
- **完全兼容**: 直接复用现有FastAPI接口，无需修改后端代码
- **认证机制**: 支持JWT + Cookie双重认证
- **数据格式**: 保持与原系统完全一致的请求/响应格式

### API客户端架构
```typescript
// API客户端 (src/lib/api-client.ts)
class ApiClient {
  private instance: AxiosInstance;

  // 自动处理认证
  // 自动重试和错误处理
  // 支持Cookie和Bearer Token
}

// API服务层 (src/lib/api.ts)
export const authApi = { login, getProfile, logout };
export const usersApi = { getUsers, adjustCredits, deleteUser };
export const redeemCodesApi = { getRedeemCodes, generateRedeemCodes };
export const dashboardApi = { getMetrics, getChartData };
```

## 🎨 用户界面设计

### 主题配置
```typescript
// 塔罗牌神秘风格主题 (src/styles/theme.ts)
export const tarotTheme: ThemeConfig = {
  token: {
    colorPrimary: '#6B46C1',      // 深紫色主色调
    colorBgContainer: '#FFFFFF',   // 容器背景
    colorBgLayout: '#F8FAFC',     // 布局背景
    fontFamily: 'Inter',          // 现代字体
    borderRadius: 8,              // 圆角设计
  },
  components: {
    Layout: { siderBg: '#1E293B' }, // 深色侧边栏
    Menu: { darkItemSelectedBg: '#6B46C1' },
    Table: { headerBg: '#F8FAFC' },
  }
};
```

### 响应式布局
- **移动端适配**: 自动收缩侧边栏，触摸友好的交互
- **多屏幕支持**: 从手机到4K显示器的完美适配
- **加载状态**: 全局Spin组件和骨架屏


## 📊 功能模块详解

### 1. 仪表板 (Dashboard)
**文件位置**: `src/app/dashboard/page.tsx`

**核心功能**:
- 关键指标卡片（总用户数、收入、活跃用户、今日订单）
- 收入趋势图表（基于@ant-design/charts）
- 最近活动列表
- 系统状态监控

**特色设计**:
- 实时数据刷新
- 彩色进度指示器
- 响应式图表布局

### 2. 用户管理 (Users)
**文件位置**: `src/app/users/page.tsx`

**核心功能**:
- 分页用户列表（支持筛选：ID、邮箱状态、积分、注册时间）
- 用户详情弹窗（包含交易记录）
- 积分调整功能（支持增减、原因记录）
- 用户删除（级联删除相关数据）
- 数据导出（CSV格式）

**高级特性**:
- 用户ID一键复制
- 实时统计卡片
- 批量操作（预留）

### 3. 兑换码管理 (Redeem Codes)
**文件位置**: `src/app/redeem-codes/page.tsx`

**核心功能**:
- 兑换码列表（状态筛选、批次筛选、代码搜索）
- 批量生成兑换码（自定义数量、积分值、有效期、批次名称）
- 状态管理（启用/禁用/过期）
- 使用统计和进度条
- 详情查看和导出

**智能特性**:
- 16位防重复代码生成
- 批次管理和统计
- 使用率可视化

### 4. 订单管理 (Orders)
**文件位置**: `src/app/orders/page.tsx`

**当前状态**: 占位页面，显示"功能开发中"
**计划功能**: Google Play支付订单、兑换码使用记录、交易流水

### 5. 邮箱验证 (Verify Email)
**文件位置**: `src/app/verify-email/page.tsx`

**核心功能**:
- 根据查询参数获取 `installation_id`，调用 `/api/v1/auth/email/status` 显示邮箱绑定状态
- 支持匿名用户提交邮箱并触发验证邮件，按钮带 60 秒冷却提示
- 邮箱验证成功后开放兑换码充值入口，并提供购买积分套餐快捷链接

**界面结构**:
- 全屏渐变背景 + 居中毛玻璃卡片，`viewState` 切换不同提示视图
- 未验证状态下展示邮箱表单、安装 ID、验证引导；已发送状态附带“刷新状态”操作
- 已验证状态下展示绿色成功提示、兑换码表单（自动转大写 + 正则校验）及客服邮箱

**交互细节**:
- 所有接口调用经 `authApi` 统一处理，成功/失败均通过 `App.useApp().message` 提示
- `resendCooldown` 倒计时逻辑禁用按钮，完成验证后可手动刷新状态
- 兑换成功后清空表单字段，预留刷新仪表板或本地缓存的扩展点

## 🔐 认证与安全

### 认证流程
1. **登录页面**: 美观的渐变背景 + 毛玻璃效果卡片
2. **JWT处理**: 自动存储到localStorage，API请求自动携带
3. **会话管理**: 过期自动跳转登录，刷新token机制
4. **退出登录**: 清理本地数据，重定向到登录页

### 安全特性
- **HTTPS强制**: 生产环境强制HTTPS
- **XSS防护**: React内置防护 + 输入验证
- **CSRF防护**: SameSite Cookie + Token验证
- **权限控制**: 路由级别的认证检查

## 🚀 部署与运维

### 开发环境
```bash
# 启动开发服务器
npm run dev  # http://localhost:3000

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### 环境配置
```bash
# .env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:8001
NEXT_PUBLIC_APP_NAME=塔罗牌应用管理后台
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 生产部署
- **Vercel部署**: 一键部署，自动CI/CD
- **Docker部署**: 容器化部署，易于扩展
- **Nginx代理**: 反向代理，负载均衡

## 🧪 测试策略

### 计划测试类型
1. **单元测试**: Jest + React Testing Library
2. **集成测试**: API调用和组件交互
3. **E2E测试**: Playwright 自动化测试
4. **性能测试**: Lighthouse CI

## 📈 性能优化

### 已实现优化
- **按需加载**: Ant Design组件按需导入
- **代码分割**: Next.js自动代码分割
- **图片优化**: Next.js Image组件优化
- **缓存策略**: SWR数据缓存（预留）

### 未来优化
- **虚拟滚动**: 大数据量表格优化
- **懒加载**: 图片和组件懒加载
- **CDN加速**: 静态资源CDN分发
- **PWA支持**: 离线功能和推送通知

## 🔄 与原系统对比

### 技术架构升级
| 方面 | 原系统 (FastAPI + Jinja2) | 新系统 (Next.js + Ant Design) |
|------|---------------------------|-------------------------------|
| 前端技术 | 服务端渲染模板 | React SPA |
| 交互体验 | 页面刷新 | 无刷新操作 |
| 数据更新 | 手动刷新 | 实时更新 |
| 移动端 | 响应性差 | 完美适配 |
| 开发效率 | 模板维护复杂 | 组件化开发 |

### 功能保持度
- ✅ **100%保留**: 所有原有功能完全保留
- ✅ **API兼容**: 无需修改后端代码
- ✅ **数据一致**: 完全相同的数据格式
- ✅ **认证兼容**: 支持原有JWT认证

## 🌟 项目亮点

### 1. 零后端改动
- 完全复用现有FastAPI接口
- 保持原有认证机制
- 数据格式100%兼容

### 2. 现代化体验
- React 19 + Next.js 15最新技术栈
- Ant Design企业级组件库
- 流畅的SPA交互体验

### 3. 企业级品质
- TypeScript类型安全
- 完整的错误处理
- 响应式设计
- 可扩展架构

## 🔮 未来规划

### 短期目标 (1-2周)
- [ ] 完善订单管理功能
- [ ] 添加单元测试覆盖
- [ ] 添加更多图表类型

### 中期目标 (1-2月)
- [ ] 实现PWA支持
- [ ] 添加暗色主题
- [ ] 支持多语言

### 长期目标 (3-6月)
- [ ] 微前端架构重构
- [ ] 实时协作功能
- [ ] 高级数据分析
- [ ] 移动端App

## 🤝 开发规范

### 代码规范
- **TypeScript**: 严格类型检查，禁用any
- **ESLint**: 统一代码风格
- **Prettier**: 自动代码格式化
- **命名约定**: PascalCase组件，camelCase变量

### 组件开发
- **单一职责**: 每个组件只负责一个功能
- **Props类型**: 严格定义Props接口
- **错误边界**: 组件级错误处理
- **性能优化**: 合理使用React.memo

### API集成
- **错误处理**: 统一错误处理机制
- **加载状态**: 所有异步操作显示加载状态
- **重试机制**: 网络请求自动重试
- **缓存策略**: 合理的数据缓存

---

## 📞 技术支持

### 开发团队
- **架构设计**: Claude AI Assistant
- **技术栈**: Next.js + Ant Design
- **开发周期**: 5-7个工作日
- **维护模式**: 持续迭代

### 文档更新
本文档随项目迭代持续更新，记录所有重要的架构决策和实现细节。

---

*塔罗牌Web管理系统 - 现代化管理后台的完美实现* 🔮✨