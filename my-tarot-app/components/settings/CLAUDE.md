# 系统说明组件开发指南 (components/settings/CLAUDE.md)

## 📱 组件概述

**components/settings** 是系统说明页面的组件库，提供应用信息、充值管理、使用声明、隐私政策等功能模块。

### 技术栈
- **框架**: React Native + TypeScript
- **样式**: StyleSheet + 统一主题系统
- **导航**: 单页面滚动布局
- **动画**: React Native Reanimated

## 📁 组件结构

```
components/settings/
├── AppInfoSection.tsx       # 应用基本信息组件
├── RechargeSection.tsx      # 充值管理组件
├── DisclaimerSection.tsx    # 使用声明组件
├── PrivacySection.tsx       # 隐私政策组件
├── SupportSection.tsx       # 帮助支持组件
├── styles.ts               # 统一样式定义
└── index.ts                # 组件统一导出
```

## 🏗️ 核心组件设计

### 1. AppInfoSection - 应用基本信息

#### 设计规范
- **布局**: 卡片式容器，垂直排列
- **内容结构**:
  - 应用Logo和名称
  - 版本信息
  - 愿景声明
  - 使命描述

#### 实现要点
```typescript
interface AppInfoSectionProps {
  version?: string;
  buildNumber?: string;
}

export const AppInfoSection: React.FC<AppInfoSectionProps> = ({
  version = "1.0.0",
  buildNumber = "1"
}) => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>应用信息</Text>

      {/* Logo区域 */}
      <View style={styles.logoContainer}>
        <Text style={styles.appLogo}>🔮</Text>
        <Text style={styles.appName}>神秘塔罗牌</Text>
        <Text style={styles.versionText}>v{version} ({buildNumber})</Text>
      </View>

      {/* 愿景使命 */}
      <View style={styles.missionContainer}>
        <InfoCard
          icon="✨"
          title="我们的愿景"
          content="为用户提供深入、个性化的塔罗牌洞察"
        />
        <InfoCard
          icon="🎯"
          title="我们的使命"
          content="结合传统塔罗智慧与现代AI技术，帮助用户探索内心世界"
        />
      </View>
    </View>
  );
};
```

### 2. RechargeSection - 充值管理组件

#### 设计规范
- **功能**: 积分说明、套餐展示、充值记录
- **布局**: 分区块展示，每个区块独立
- **状态**: 准备UI界面，暂不实现支付逻辑

#### 实现要点
```typescript
interface RechargeSectionProps {
  currentCredits?: number;
  rechargeHistory?: RechargeRecord[];
}

export const RechargeSection: React.FC<RechargeSectionProps> = ({
  currentCredits = 0,
  rechargeHistory = []
}) => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>积分管理</Text>

      {/* 当前余额 */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>当前积分余额</Text>
        <Text style={styles.balanceAmount}>{currentCredits}</Text>
        <Text style={styles.balanceNote}>1 积分 = 1 元人民币</Text>
      </View>

      {/* 充值套餐 */}
      <View style={styles.packagesContainer}>
        <Text style={styles.subsectionTitle}>充值套餐</Text>
        <PackageGrid packages={rechargePackages} />
      </View>

      {/* 充值记录 */}
      <View style={styles.historyContainer}>
        <Text style={styles.subsectionTitle}>充值记录</Text>
        <RechargeHistory records={rechargeHistory} />
      </View>
    </View>
  );
};
```

#### 套餐配置
```typescript
const rechargePackages = [
  { amount: 10, credits: 10, popular: false },
  { amount: 30, credits: 30, popular: true },
  { amount: 50, credits: 50, popular: false },
  { amount: 100, credits: 100, popular: false },
  { amount: 300, credits: 300, popular: false },
  { amount: 500, credits: 500, popular: false }
];
```

### 3. DisclaimerSection - 使用声明组件

#### 设计规范
- **内容**: 4项核心声明，每项带图标
- **布局**: 垂直列表，每项独立卡片
- **视觉**: 警告色调，突出重要性

#### 实现要点
```typescript
export const DisclaimerSection: React.FC = () => {
  const disclaimers = [
    {
      icon: "💫",
      title: "应用目的",
      content: "本应用专为塔罗牌爱好者设计，用于学习塔罗牌知识"
    },
    {
      icon: "⚠️",
      title: "免责声明",
      content: "塔罗牌解读仅供参考，不构成医学、法律、金融等专业建议"
    },
    {
      icon: "🧘",
      title: "使用建议",
      content: "请勿将占卜结果作为重要决策依据，保持理性思考"
    },
    {
      icon: "👶",
      title: "年龄限制",
      content: "未成年人使用需监护人同意和指导"
    }
  ];

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>使用声明</Text>
      {disclaimers.map((item, index) => (
        <DisclaimerCard key={index} {...item} />
      ))}
    </View>
  );
};
```

### 4. PrivacySection - 隐私政策组件

#### 设计规范
- **内容**: 数据收集、使用方式、保护承诺
- **布局**: 折叠式展示，支持展开/收起
- **重点**: 突出数据安全和用户权利

#### 实现要点
```typescript
export const PrivacySection: React.FC = () => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const privacyItems = [
    {
      id: "collection",
      title: "数据收集说明",
      icon: "📊",
      summary: "我们遵循最小化、必要性原则收集数据",
      details: "我们仅收集提供服务所必需的数据，包括占卜记录、使用偏好等..."
    },
    {
      id: "usage",
      title: "数据使用方式",
      icon: "🎯",
      summary: "用于改进体验与个性化，不出售数据",
      details: "您的数据仅用于改善用户体验、提供个性化服务..."
    },
    {
      id: "protection",
      title: "数据保护承诺",
      icon: "🔒",
      summary: "加密存储、定期审计、支持导出与删除",
      details: "我们采用行业标准的加密技术保护您的数据..."
    }
  ];

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>隐私政策</Text>
      {privacyItems.map((item) => (
        <PrivacyCard
          key={item.id}
          {...item}
          expanded={expandedItem === item.id}
          onToggle={() => setExpandedItem(
            expandedItem === item.id ? null : item.id
          )}
        />
      ))}
    </View>
  );
};
```

### 5. SupportSection - 帮助支持组件

#### 设计规范
- **功能**: 联系方式、反馈渠道、版本检查
- **布局**: 按钮式操作项，支持点击交互
- **交互**: 邮件、链接跳转等外部调用

#### 实现要点
```typescript
export const SupportSection: React.FC = () => {
  const handleContact = (type: string) => {
    switch (type) {
      case 'email':
        Linking.openURL('mailto:support@tarotapp.com');
        break;
      case 'feedback':
        // 打开反馈表单或跳转到反馈页面
        break;
      case 'update':
        // 检查应用更新
        break;
    }
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>帮助与支持</Text>

      <SupportButton
        icon="✉️"
        title="联系我们"
        subtitle="发送邮件获取帮助"
        onPress={() => handleContact('email')}
      />

      <SupportButton
        icon="💬"
        title="用户反馈"
        subtitle="分享您的建议和意见"
        onPress={() => handleContact('feedback')}
      />

      <SupportButton
        icon="🔄"
        title="检查更新"
        subtitle="获取最新版本"
        onPress={() => handleContact('update')}
      />
    </View>
  );
};
```

## 🎨 统一样式系统

### 颜色主题
```typescript
export const SettingsColors = {
  // 背景色
  background: '#0a0a1a',
  cardBackground: 'rgba(20, 20, 40, 0.95)',

  // 主题色
  primary: '#d4af37',
  secondary: '#b8860b',

  // 文字色
  titleText: '#d4af37',
  bodyText: '#e6e6fa',
  mutedText: '#8b8878',

  // 功能色
  warning: '#f39c12',
  danger: '#e74c3c',
  success: '#27ae60',

  // 边框和分割线
  border: 'rgba(212, 175, 55, 0.3)',
  divider: 'rgba(255, 255, 255, 0.1)',
};
```

### 间距系统
```typescript
export const SettingsSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,

  // 组件特定间距
  sectionGap: 24,
  cardPadding: 16,
  itemSpacing: 12,
};
```

### 排版规范
```typescript
export const SettingsTypography = {
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: SettingsColors.titleText,
    marginBottom: SettingsSpacing.md,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: SettingsColors.titleText,
    marginBottom: SettingsSpacing.sm,
  },

  bodyText: {
    fontSize: 14,
    lineHeight: 20,
    color: SettingsColors.bodyText,
  },

  mutedText: {
    fontSize: 12,
    color: SettingsColors.mutedText,
  },
};
```

## 🎭 交互动画

### 卡片动画
```typescript
const cardEnterAnimation = {
  from: { opacity: 0, transform: [{ translateY: 20 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
  config: { duration: 300, easing: Easing.out(Easing.quad) },
};

const cardPressAnimation = {
  from: { transform: [{ scale: 1 }] },
  to: { transform: [{ scale: 0.98 }] },
  config: { duration: 150 },
};
```

### 展开动画
```typescript
const expandAnimation = {
  from: { height: 0, opacity: 0 },
  to: { height: 'auto', opacity: 1 },
  config: { duration: 250, easing: Easing.inOut(Easing.quad) },
};
```

## 📋 组件使用示例

### 完整页面组装
```typescript
import {
  AppInfoSection,
  RechargeSection,
  DisclaimerSection,
  PrivacySection,
  SupportSection
} from '@/components/settings';

export default function SettingsPage() {
  return (
    <ScrollView style={styles.container}>
      <AppInfoSection version="1.0.0" buildNumber="1" />
      <RechargeSection currentCredits={50} />
      <DisclaimerSection />
      <PrivacySection />
      <SupportSection />
    </ScrollView>
  );
}
```

## 🔄 状态管理

### 组件级状态
```typescript
// 折叠展开状态
const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

// 充值相关状态
const [rechargeLoading, setRechargeLoading] = useState(false);
const [currentCredits, setCurrentCredits] = useState(0);

// 版本检查状态
const [updateAvailable, setUpdateAvailable] = useState(false);
```

### 数据获取
```typescript
// 获取用户积分余额
const fetchUserCredits = async () => {
  try {
    // API调用获取余额
  } catch (error) {
    console.error('获取积分余额失败:', error);
  }
};

// 获取充值记录
const fetchRechargeHistory = async () => {
  try {
    // API调用获取充值记录
  } catch (error) {
    console.error('获取充值记录失败:', error);
  }
};
```

## 🛠️ 开发指导

### 组件开发原则
1. **模块化设计**: 每个功能区域独立组件
2. **数据驱动**: 通过props传入配置和数据
3. **交互一致**: 统一的点击反馈和动画效果
4. **可扩展性**: 支持未来功能扩展和配置调整

### 测试要点
- 组件渲染正确性
- 交互功能响应
- 动画效果流畅性
- 不同屏幕尺寸适配

---

*此文档定义了系统说明页面各组件的详细设计规范，确保实现一致、优雅的用户体验。*