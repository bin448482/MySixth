# 塔罗牌应用全栈开发指南 (CLAUDE.md)

## 📱 项目概述

**塔罗牌应用** 是一个全栈的跨平台塔罗牌应用，采用 Expo React Native + FastAPI 架构，提供塔罗牌抽牌、解读和付费AI解读服务。

### 项目结构
```
MySixth/
├── .docs/                           # 项目文档
│   ├── tarot_app_architecture_design.md
│   └── tarot_db_design.md
├── my-tarot-app/                    # 前端应用 (Expo React Native)
│   ├── app/                         # 页面路由
│   ├── components/                  # 组件库
│   │   ├── home/                    # 首页组件
│   │   ├── common/                  # 通用组件
│   │   └── reading/                 # 占卜组件
│   └── CLAUDE.md                    # 前端开发指南
└── CLAUDE.md                        # 本文档
```

### 核心功能
- 匿名用户支持（无需注册）
- 神秘塔罗风格首页设计
- 完整占卜流程（5个步骤）
- 静态基础解读 + 付费LLM动态解读
- 离线同步机制
- 跨平台支持（Android/iOS）

## 🛠️ 技术栈总览

### 前端 (my-tarot-app/)
- **框架**: Expo React Native ~54.0.1
- **语言**: TypeScript ~5.9.2
- **导航**: Expo Router ~6.0.0 + React Navigation 7.x
- **本地数据库**: SQLite (Expo SQLite)
- **构建**: EAS Build

### 后端 (待开发)
- **框架**: FastAPI (Python)
- **数据库**: SQLite (初期) → PostgreSQL (扩展)
- **LLM集成**: LangChain + OpenAI API
- **支付**: Stripe Checkout
- **定时任务**: APScheduler
- **部署**: 单体服务器 + Nginx

## 🌐 多语言与国际化

### 字体方案

#### 推荐字体配置
- **中文字体**: 思源宋体（Noto Serif SC）
  - 开源免费，支持完整中文字符集
  - 版权友好，适合商业使用
  - 多平台兼容性良好

- **英文字体**: Source Serif Pro
  - 与思源字体系列搭配协调
  - 优秀的可读性和美观性
  - 支持多种字重

#### 技术实现
```typescript
// 跨平台字体配置
fontFamily: Platform.select({
  ios: 'Noto Serif SC',
  android: 'Noto Serif SC',
  web: '"Source Serif Pro", "Noto Serif SC", serif'
})

// 字体加载策略
import {
  NotoSerifSC_400Regular,
  NotoSerifSC_700Bold,
} from '@expo-google-fonts/noto-serif-sc';

export function useFonts() {
  const [fontsLoaded] = useFonts({
    NotoSerifSC_400Regular,
    NotoSerifSC_700Bold,
  });
  return fontsLoaded;
}
```

#### 多语言排版优化
- **字间距调整**: `letterSpacing: 1-2`
- **行高优化**: `lineHeight: 1.4-1.6`
- **响应式字号**: 根据平台和屏幕尺寸调整
- **字重映射**: 确保中英文字重视觉一致性

### 国际化支持

#### 语言支持计划
1. **第一阶段**: 简体中文（zh-CN）
2. **第二阶段**: 繁体中文（zh-TW）
3. **第三阶段**: 英语（en-US）
4. **扩展阶段**: 日语（ja-JP）、韩语（ko-KR）

#### 技术实现
```typescript
// i18n 配置示例
import { I18n } from 'i18n-js';

const i18n = new I18n({
  'zh-CN': require('./locales/zh-CN.json'),
  'zh-TW': require('./locales/zh-TW.json'),
  'en-US': require('./locales/en-US.json'),
});

// 字体回退策略
const getFontFamily = (locale: string) => {
  switch (locale) {
    case 'zh-CN':
    case 'zh-TW':
      return 'Noto Serif SC';
    case 'ja-JP':
      return 'Noto Serif JP';
    default:
      return 'Source Serif Pro';
  }
};
```

#### 本地化内容
- **卡牌名称**: 支持多语言卡牌名称
- **解读内容**: 多语言解读文本
- **界面文案**: 完整的UI文案本地化
- **日期格式**: 符合各地区习惯的日期显示

### 性能优化

#### 字体加载优化
- **预加载**: 应用启动时预加载核心字体
- **按需加载**: 根据语言按需加载对应字体
- **缓存机制**: 字体文件本地缓存
- **回退策略**: 字体加载失败时的降级方案

#### 内容优化
- **文本压缩**: 多语言文本资源压缩
- **懒加载**: 非核心语言内容懒加载
- **增量更新**: 语言包增量更新机制

### 文化适配

#### 视觉设计适配
- **阅读方向**: 支持从右到左的语言（阿拉伯语等）
- **色彩文化**: 考虑不同文化对颜色的理解
- **图标语义**: 确保图标在不同文化中的含义一致

#### 功能适配
- **占卜文化**: 适应不同地区的占卜文化差异
- **支付方式**: 支持各地区主流支付方式
- **法律合规**: 符合各地区相关法律法规

## 🏗️ 整体架构

```
[Expo RN 客户端 (my-tarot-app/)]
    ├── 首页 (神秘塔罗风格)
    ├── 占卜流程 (5步骤)
    ├── 历史记录
    ├── 卡牌说明
    └── 系统说明
    ↓ HTTPS
[FastAPI 单体后端 (待开发)]
    ├── 卡牌/牌阵/解读 API
    ├── LLM 调用 (LangChain + OpenAI)
    ├── 定时任务 (APScheduler)
    ├── 支付 (Stripe Checkout)
    ├── SQLite / PostgreSQL 单库
    └── 静态资源 (卡牌图片 / JSON)
```

**部署形态 (生产环境)**
- 单台云服务器（2C/4G）
- FastAPI（`uvicorn`）+ SQLite 文件数据库
- Nginx + TLS 反向代理
- Expo EAS 构建客户端包

## 📊 数据库设计

### 核心表结构

#### 1. `card` 表 - 卡牌基础信息
存储塔罗牌的核心属性。

| 字段名     | 类型           | 描述                           |
|------------|----------------|--------------------------------|
| id         | INTEGER (PK)   | 唯一牌ID                       |
| name       | TEXT           | 牌名称（如「愚者」）           |
| arcana     | TEXT           | 大牌/小牌（Major/Minor）       |
| suit       | TEXT           | 花色（小牌适用）               |
| number     | INTEGER        | 牌序号                         |
| image_url  | TEXT           | 默认图像URL                    |
| style_id   | INTEGER (FK)   | 默认使用的牌面风格             |
| deck       | TEXT           | 所属塔罗牌套牌（如Rider-Waite, Thoth）|

#### 2. `card_style` 表 - 牌面风格
管理不同风格的卡牌图像。

| 字段名          | 类型           | 描述                           |
|-----------------|----------------|--------------------------------|
| id              | INTEGER (PK)   | 风格唯一标识                   |
| name            | TEXT           | 风格名称                       |
| image_base_url  | TEXT           | 图像基础路径                   |

#### 3. `dimension` 表 - 解读维度定义
提供可配置的解读维度。

| 字段名      | 类型           | 描述                           |
|-------------|----------------|--------------------------------|
| id          | INTEGER (PK)   | 维度唯一标识                   |
| name        | TEXT           | 维度名称（如：情感-时间线）    |
| category    | TEXT           | 类别（如：情感、事业、健康）   |
| description | TEXT           | 维度详细描述                   |
| aspect      | TEXT           | 维度的具体子项（可选）         |
| aspect_type | TEXT           | 子项的类型或分类（可选）       |

#### 4. `card_interpretation` 表 - 牌意主表
存储卡牌解读的基本信息。

| 字段名      | 类型           | 描述                           |
|-------------|----------------|--------------------------------|
| id          | INTEGER (PK)   | 解释唯一标识                   |
| card_id     | INTEGER (FK)   | 对应的卡牌ID                   |
| direction   | TEXT           | 正位 / 逆位                    |
| summary     | TEXT           | 简要牌意                       |
| detail      | TEXT           | 详细说明（可选）               |

#### 5. `card_interpretation_dimension` 表 - 牌意维度关联
支持多维度、细粒度的卡牌解读。

| 字段名            | 类型           | 描述                           |
|-------------------|----------------|--------------------------------|
| id                | INTEGER (PK)   | 关联唯一标识                   |
| interpretation_id | INTEGER (FK)   | 关联到 card_interpretation.id  |
| dimension_id      | INTEGER (FK)   | 关联到 dimension.id            |
| aspect            | TEXT           | 具体维度子项（从dimension复制）|
| aspect_type       | TEXT           | 子项的类型或分类（从dimension复制）|
| content           | TEXT           | 该维度下的解读文字             |

#### 6. `spread` 表 - 牌阵定义
定义不同类型的塔罗牌阵。

| 字段名        | 类型           | 描述                           |
|---------------|----------------|--------------------------------|
| id            | INTEGER (PK)   | 牌阵唯一标识                   |
| name          | TEXT           | 牌阵名称                       |
| description   | TEXT           | 牌阵描述                       |
| card_count    | INTEGER        | 牌阵所需卡牌数量               |

#### 7. `user_history` 表 - 用户历史记录
记录用户的占卜历史。

| 字段名              | 类型           | 描述                           |
|---------------------|----------------|--------------------------------|
| id                  | INTEGER (PK)   | 记录唯一标识                   |
| user_id             | TEXT           | 用户ID（可匿名）               |
| timestamp           | DATETIME       | 记录时间                       |
| spread_id           | INTEGER (FK)   | 使用的牌阵ID                   |
| card_ids            | TEXT (JSON)    | 抽到的卡牌ID数组               |
| interpretation_mode | TEXT           | 解读方式（default/ai）         |
| result              | TEXT (JSON)    | 解读结果（结构可自定义）       |

## 🔌 API 设计规范

### 核心接口

| 方法   | 路径                   | 说明                    |
| ---- | -------------------- | --------------------- |
| POST | `/auth/anon`         | 生成匿名用户ID              |
| GET  | `/cards`             | 获取卡牌列表                |
| GET  | `/dimensions`        | 获取维度列表                |
| POST | `/readings`          | 请求一次解读（同步 LLM 调用）     |
| GET  | `/readings/{id}`     | 获取历史解读结果              |
| POST | `/payments/checkout` | 创建 Stripe Checkout 会话 |
| POST | `/webhooks/stripe`   | Stripe 支付回调           |

### 离线同步API

| 方法   | 路径                   | 说明                    |
| ---- | -------------------- | --------------------- |
| GET  | `/sync/initial`      | 获取初始全量数据              |
| GET  | `/sync/delta`        | 获取增量更新                |
| POST | `/sync/manual`       | 手动触发同步                |
| WebSocket | `/sync/updates`  | 实时更新推送               |

## 🔄 离线同步架构

### 同步策略
- **初始化同步**: 首次启动时下载全量数据
- **增量更新**: 后端通过推送通知触发更新
- **手动同步**: 用户可主动触发同步
- **排除同步**: `user_history` 表不参与同步

### 同步模式
1. **自动后台同步**
   - 应用启动时检查更新
   - 网络环境稳定时静默同步
2. **手动同步**
   - 用户可在设置中主动触发
   - 提供同步进度和结果反馈

### 同步表
需要同步的表：
1. `card`
2. `card_style`
3. `dimension`
4. `card_interpretation`
5. `card_interpretation_dimension`
6. `spread`
7. `user`

### 技术实现
- **客户端本地数据库**: SQLite/Realm
- **更新通知**: WebSocket / Server-Sent Events
- **数据传输**: 增量更新，最小化网络负载

### 冲突解决
- 服务端版本号优先
- 基于时间戳的更新合并
- 保留最新服务端数据

## 🛡️ 安全与隐私

### MVP 安全要求
- 强制 HTTPS
- SQLite 文件读写权限限制
- Stripe 回调签名校验
- 基础输入过滤，防止敏感内容传入 LLM

### 数据隐私
- 支持匿名用户，降低隐私风险
- 用户历史数据可选择性清除
- 最小化数据收集原则

## 🚀 部署与运维

### 客户端部署
- **构建**: 使用 EAS Build 构建原生应用
- **更新**: 支持 OTA 更新，快速迭代JS层逻辑
- **发布**: Android APK + iOS IPA 双平台发布

### 服务端部署
- **环境**: 单台云服务器（2C/4G）
- **服务**: FastAPI + uvicorn + systemd/pm2 守护
- **代理**: Nginx + TLS 反向代理
- **证书**: Let's Encrypt 自动更新

### 监控
- 简单日志监控（uvicorn 日志 + Stripe webhook 日志）
- 数据库每日备份（crontab）

## 📈 演进路线

| 触发点     | 升级方向                        |
| ------- | --------------------------- |
| 请求量增大   | 增加 Redis 缓存、Celery 异步任务     |
| 数据量增大   | 迁移到 PostgreSQL              |
| LLM 成本高 | 缓存结果 / prompt 优化 / 降级链路     |
| 架构复杂度上升 | 拆分为 API / Worker / Admin 服务 |

## 🎨 首页设计与架构

### 🏠 首页视觉设计

#### 设计理念
- **神秘塔罗风格**：营造神秘、优雅的塔罗牌占卜氛围
- **色彩方案**：深蓝黑色背景 + 金色强调 + 深紫色卡片
- **视觉层次**：主标题 → 应用声明 → 功能导航 → 装饰元素

#### 页面布局
```
┌─────────────────────────────────────┐
│  状态栏区域                          │
├─────────────────────────────────────┤
│  主标题：神秘塔罗牌 + 副标题         │
├─────────────────────────────────────┤
│  应用声明卡片（4行声明文字）          │
├─────────────────────────────────────┤
│  导航网格（2x2）：                  │
│  🔮开始占卜  📜占卜历史              │
│  🎴卡牌说明  ⚙️系统说明              │
├─────────────────────────────────────┤
│  底部装饰（塔罗符号）                │
└─────────────────────────────────────┘
```

#### 核心组件架构
```
components/home/
├── HeroSection.tsx          # 主标题区域（星空背景 + 渐变文字）
├── DeclarationCard.tsx      # 应用声明卡片（玻璃拟态效果）
├── NavigationGrid.tsx       # 导航网格（2x2布局，图标+文字）
├── DecorativeSymbols.tsx    # 装饰元素（旋转塔罗符号）
└── styles.ts               # 首页专用样式系统
```

#### 交互体验
- **进入动画**：背景渐变 → 标题滑入 → 卡片缩放 → 导航依次淡入
- **交互反馈**：按钮悬停上浮、点击缩放、图标旋转动画
- **视觉特效**：星空粒子背景、卡片发光边框、渐变色彩

### 📁 组件库架构

#### 组件分类
```
components/
├── home/                   # 首页专属组件
│   ├── HeroSection.tsx     # 主视觉区域
│   ├── DeclarationCard.tsx # 声明卡片
│   ├── NavigationGrid.tsx  # 导航网格
│   └── DecorativeSymbols.tsx # 装饰元素
├── common/                 # 通用组件
│   ├── AnimatedCard.tsx    # 动画卡片（3D翻转）
│   ├── GradientBackground.tsx # 渐变背景
│   ├── MysticalIcon.tsx    # 神秘图标（塔罗符号）
│   ├── AnimatedButton.tsx  # 动画按钮
│   ├── GlassCard.tsx       # 玻璃卡片效果
│   └── ParticleBackground.tsx # 粒子背景
└── reading/                # 占卜流程组件
    ├── TypeSelector.tsx    # 占卜类型选择器
    ├── CategorySelector.tsx # 类别选择器
    ├── CardDeck.tsx        # 卡牌展示
    ├── CardFlip.tsx        # 卡牌翻转动画
    ├── CardSpread.tsx      # 牌阵布局
    ├── Interpretation.tsx  # 解读展示
    └── ReadingProgress.tsx # 进度指示器
```

#### 设计系统
- **色彩系统**：深蓝黑背景 + 金色强调 + 深紫卡片
- **字体层级**：serif标题 + system正文 + 淡紫辅助文字
- **动画时间**：fast(200ms) / normal(300ms) / slow(500ms)
- **空间系统**：xs(4px) / sm(8px) / md(16px) / lg(24px) / xl(32px)

### 🧭 路由架构

#### 页面结构
```
app/
├── index.tsx              # 首页（声明页面 + 主导航）
├── (reading)/            # 占卜流程路由组
│   ├── _layout.tsx       # 占卜流程布局
│   ├── type.tsx          # 步骤1：选择占卜类型
│   ├── category.tsx      # 步骤2：选择占卜类别
│   ├── draw.tsx          # 步骤3：抽牌页面
│   ├── basic.tsx         # 步骤4：基础解读
│   └── deep.tsx          # 步骤5：深度解读
├── history/              # 占卜历史
├── cards/                # 卡牌说明
└── settings/             # 系统说明
```

## 🎯 MVP 开发优先级

### 第一阶段 - 首页设计与框架
1. 首页视觉设计与组件架构
2. 神秘塔罗风格UI实现
3. 通用组件库开发（动画、渐变、粒子效果）
4. 页面路由与导航结构

### 第二阶段 - 占卜流程开发
1. 占卜类型选择页面（离线/AI）
2. 占卜类别选择页面（情感/事业/健康等）
3. 抽牌页面（三牌阵动画）
4. 基础解读页面（牌意展示）
5. 深度解读页面（系统分析）

### 第三阶段 - 功能完善
1. 数据库设计和初始数据
2. 基础 FastAPI 后端 API
3. 离线同步机制
4. 付费 LLM 解读集成
5. Stripe 支付集成
6. 用户历史记录

### 第三阶段 - 功能完善
1. 数据库设计和初始数据
2. 基础 FastAPI 后端 API
3. 离线同步机制
4. 付费 LLM 解读集成
5. Stripe 支付集成
6. 用户历史记录

### 第四阶段 - 优化迭代
1. 性能优化和缓存
2. UI/UX 优化
3. 更多牌阵和解读维度
4. 部署和监控完善

## 💡 开发指导原则

### 对 Claude 的指导
1. **首页优先**: 优先实现神秘塔罗风格首页，建立视觉基调
2. **组件化开发**: 严格按照组件库架构开发，保持代码复用性
3. **视觉一致性**: 遵循色彩系统和设计规范，确保视觉统一
4. **动画流畅**: 所有交互动画要流畅自然，营造神秘氛围
5. **架构一致性**: 严格按照架构文档的设计模式开发
6. **数据库优先**: 所有数据操作都要符合数据库设计文档
7. **MVP 优先**: 避免过度设计，优先实现核心功能
8. **离线优先**: 考虑网络状况不佳的场景，设计要支持离线使用
9. **类型安全**: 前后端都要确保类型定义正确

### 开发最佳实践
- **前端**: 遵循 React Native 和 TypeScript 最佳实践
- **后端**: 遵循 FastAPI 和 Python 最佳实践
- **数据库**: 保持数据一致性和完整性
- **API**: RESTful 设计，清晰的错误处理
- **安全**: 最小权限原则，输入验证

### 常见开发场景
- **新增卡牌解读维度** → 修改 `dimension` 表和相关API
- **新增牌阵类型** → 修改 `spread` 表和前端选择界面  
- **优化解读算法** → 修改后端LLM调用逻辑
- **添加新的卡牌风格** → 修改 `card_style` 表和图片资源

---

*此文档基于 `.docs/tarot_app_architecture_design.md` 和 `.docs/tarot_db_design.md` 编写，用于指导全栈开发工作。*