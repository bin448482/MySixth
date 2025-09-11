# 塔罗牌应用前端开发指南 (CLAUDE.md)

## 📱 项目信息

**my-tarot-app** 是塔罗牌应用的 Expo React Native 前端客户端，支持 Android/iOS 双平台。

### 技术栈
- **框架**: Expo React Native ~54.0.1
- **语言**: TypeScript ~5.9.2
- **导航**: Expo Router ~6.0.0
- **动画**: React Native Reanimated ~4.1.0
- **构建**: EAS Build

## 📁 项目结构

```
my-tarot-app/
├── app/                    # Expo Router 页面
├── components/             # 可复用组件
├── constants/              # 常量定义
├── hooks/                  # 自定义 Hooks
├── assets/                 # 静态资源
├── scripts/                # 构建脚本
├── package.json           # 依赖配置
├── app.json              # Expo 配置
├── tsconfig.json         # TypeScript 配置
└── CLAUDE.md             # 本文档
```

## 🛠️ 开发命令

```bash
# 启动开发服务器
npm start

# 平台特定启动
npm run android    # Android 模拟器/设备
npm run ios        # iOS 模拟器/设备  
npm run web        # Web 浏览器

# 代码检查
npm run lint

# 重置项目（清理缓存）
npm run reset-project
```

## 📱 核心功能模块

### 1. 用户认证
- 匿名用户 ID 生成和管理
- 无需注册/登录系统

### 2. 卡牌系统
- 卡牌列表展示
- 卡牌抽取动画
- 多风格卡牌图片支持

### 3. 牌阵功能
- 牌阵选择界面
- 抽牌流程和动画
- 牌位摆放显示

### 4. 解读系统
- 静态基础解读显示
- 付费 AI 解读入口
- 解读结果展示页面

### 5. 历史记录
- 用户历史解读查看
- 历史记录列表
- 详细记录查看

### 6. 离线同步
- 本地 SQLite 数据库
- 数据同步状态显示
- 手动同步触发

## 🎨 UI/UX 设计原则

### 主题风格
- 神秘、优雅的塔罗牌风格
- 深色主题为主，金色装饰
- 流畅的动画过渡

### 核心界面
1. **首页** - 牌阵选择入口
2. **抽牌页** - 卡牌洗牌/抽牌/翻牌动画
3. **解读页** - 牌阵结果和解读内容
4. **历史页** - 历史解读记录
5. **设置页** - 应用设置和同步控制

## 📊 本地数据存储

### SQLite 表结构（客户端）

#### 核心同步表
```typescript
// 从服务端同步的表
interface Card {
  id: number;
  name: string;
  arcana: string;
  suit?: string;
  number: number;
  image_url: string;
  style_id: number;
  deck: string;
}

interface CardStyle {
  id: number;
  name: string;
  image_base_url: string;
}

interface Dimension {
  id: number;
  name: string;
  category: string;
  description: string;
  aspect?: string;
  aspect_type?: string;
}

interface CardInterpretation {
  id: number;
  card_id: number;
  direction: string; // '正位' | '逆位'
  summary: string;
  detail?: string;
}

interface CardInterpretationDimension {
  id: number;
  interpretation_id: number;
  dimension_id: number;
  aspect?: string;
  aspect_type?: string;
  content: string;
}

interface Spread {
  id: number;
  name: string;
  description: string;
  card_count: number;
}
```

#### 客户端专用表
```typescript
// 仅客户端使用，不同步
interface UserHistory {
  id: number;
  user_id: string;
  timestamp: string;
  spread_id: number;
  card_ids: number[]; // JSON 数组
  interpretation_mode: 'default' | 'ai';
  result: any; // JSON 对象
}

interface SyncStatus {
  table_name: string;
  last_sync: string;
  version: number;
}
```

## 🔄 离线同步机制

### 同步流程
1. **启动检查** - 应用启动时检查数据版本
2. **增量更新** - 仅同步变更的数据
3. **手动同步** - 用户主动触发完整同步
4. **状态反馈** - 显示同步进度和结果

### 实现要点
```typescript
// 同步服务示例
interface SyncService {
  // 初始化同步（首次启动）
  initialSync(): Promise<void>;
  
  // 增量同步
  deltaSync(): Promise<void>;
  
  // 手动完整同步
  manualSync(): Promise<SyncResult>;
  
  // 检查同步状态
  getSyncStatus(): SyncStatus[];
}

interface SyncResult {
  success: boolean;
  updatedTables: string[];
  errors?: string[];
}
```

## 🔌 API 集成

### 服务端接口
```typescript
// API 客户端配置
const API_BASE_URL = 'https://api.tarot-app.com';

// 核心 API 方法
interface ApiClient {
  // 认证
  createAnonymousUser(): Promise<{ user_id: string }>;
  
  // 数据同步
  getInitialData(): Promise<InitialSyncData>;
  getDeltaUpdates(since: string): Promise<DeltaUpdateData>;
  
  // 解读服务
  createReading(request: ReadingRequest): Promise<Reading>;
  getReading(id: number): Promise<Reading>;
  
  // 支付
  createCheckoutSession(amount: number): Promise<{ checkout_url: string }>;
}
```

### 网络状态处理
- 离线模式检测
- 网络重连自动同步
- 请求失败重试机制

## 🎯 开发规范

### 组件开发
```typescript
// 组件文件命名：PascalCase
// components/CardFlipAnimation.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';

interface CardFlipAnimationProps {
  card: Card;
  isFlipped: boolean;
  onFlipComplete?: () => void;
}

export const CardFlipAnimation: React.FC<CardFlipAnimationProps> = ({
  card,
  isFlipped,
  onFlipComplete,
}) => {
  // 组件实现
  return <View style={styles.container}>{/* ... */}</View>;
};

const styles = StyleSheet.create({
  container: {
    // 样式定义
  },
});
```

### 页面开发
```typescript
// 页面文件：app/readings/[id].tsx (Expo Router)

import { useLocalSearchParams } from 'expo-router';
import { useReading } from '@/hooks/useReading';

export default function ReadingDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { reading, isLoading } = useReading(parseInt(id));

  // 页面实现
  return (
    // JSX
  );
}
```

### 自定义 Hooks
```typescript
// hooks/useReading.ts

export function useReading(readingId: number) {
  const [reading, setReading] = useState<Reading | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 获取解读数据的逻辑
  }, [readingId]);

  return { reading, isLoading };
}
```

### 样式规范
```typescript
// 使用 StyleSheet.create()
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e', // 深色主题
  },
  card: {
    width: 120,
    height: 200,
    borderRadius: 8,
  },
  text: {
    color: '#ffd700', // 金色文字
    fontSize: 16,
  },
});
```

## 🎨 资源管理

### 图片资源
```
assets/
├── images/
│   ├── cards/              # 卡牌图片
│   │   ├── major/          # 大阿卡纳
│   │   └── minor/          # 小阿卡纳
│   ├── backgrounds/        # 背景图片
│   └── icons/              # 图标
├── fonts/                  # 字体文件
└── sounds/                 # 音效文件（可选）
```

### 常量定义
```typescript
// constants/Colors.ts
export const Colors = {
  background: '#1a1a2e',
  surface: '#16213e',
  primary: '#ffd700',
  text: '#ffffff',
  textSecondary: '#cccccc',
};

// constants/Dimensions.ts
export const Dimensions = {
  cardWidth: 120,
  cardHeight: 200,
  borderRadius: 8,
  spacing: 16,
};
```

## 🧪 测试指南

### 单元测试
```typescript
// __tests__/components/CardComponent.test.tsx
import { render } from '@testing-library/react-native';
import { CardComponent } from '@/components/CardComponent';

describe('CardComponent', () => {
  it('renders card correctly', () => {
    // 测试实现
  });
});
```

### 集成测试
- 测试 API 集成
- 测试数据同步流程
- 测试支付流程

## 🚀 构建和发布

### EAS Build 配置
```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

### 发布流程
1. **开发构建** - `eas build --profile development`
2. **预览构建** - `eas build --profile preview`
3. **生产构建** - `eas build --profile production`
4. **应用商店发布** - `eas submit`

## 🐛 调试指南

### 开发工具
- **Expo Dev Tools** - 网络请求、日志查看
- **React DevTools** - 组件调试
- **Flipper** - 网络和数据库调试

### 常见问题
1. **同步失败** - 检查网络连接和 API 状态
2. **性能问题** - 使用 React DevTools Profiler
3. **构建失败** - 检查依赖版本和配置

## 💡 开发最佳实践

### 对 Claude 的指导
1. **遵循 Expo 最佳实践** - 使用官方推荐的模式和API
2. **类型安全优先** - 确保所有组件都有正确的 TypeScript 类型
3. **离线优先设计** - 考虑网络不稳定的场景
4. **性能优化** - 使用 React.memo、useMemo、useCallback 等优化手段
5. **用户体验** - 提供清晰的加载状态和错误处理

### 代码质量
- 使用 ESLint 和 Prettier 保持代码一致性
- 编写有意义的注释
- 保持组件单一职责
- 合理的文件组织结构

---

*此文档专门针对 my-tarot-app 前端开发，与根级别 CLAUDE.md 配合使用。*