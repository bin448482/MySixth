# 塔罗牌应用 - 占卜历史功能设计文档

## 1. 功能概述

### 1.1 设计目标
- 为用户提供完整的占卜历史追溯功能
- 支持匿名用户历史记录
- 提供流畅的历史记录浏览体验
- 确保数据离线可用

### 1.2 关键特性
- 历史记录列表展示
- 历史记录详情查看
- 本地存储与同步
- 多维度筛选和排序

## 2. 数据模型

### 2.1 历史记录表结构 (`user_history`)
```typescript
interface UserHistory {
  id: string;                 // 唯一标识
  user_id: string;            // 匿名用户ID
  timestamp: Date;            // 占卜时间
  spread_id: number;          // 牌阵类型
  card_ids: number[];         // 抽取的卡牌ID
  interpretation_mode: 'default' | 'ai';  // 解读模式
  result: {
    basic_interpretation: string;
    ai_interpretation?: string;
    dimensions?: string[];
  };
}
```

### 2.2 本地存储策略
- 使用 SQLite 存储历史记录
- 支持无限制保存所有历史记录
- 读取时默认显示最新100条记录
- 支持分页加载更多历史记录

## 3. 前端组件设计

### 3.1 历史列表页面组件
```typescript
// components/history/HistoryList.tsx
export const HistoryList = () => {
  const [histories, setHistories] = useState<UserHistory[]>([]);
  const [filter, setFilter] = useState({
    mode: 'all',
    dateRange: null
  });

  const fetchHistories = async () => {
    // 从本地数据库获取历史记录
  };

  return (
    <View style={styles.container}>
      <HistoryFilterBar
        onFilterChange={setFilter}
      />
      <FlatList
        data={histories}
        renderItem={({ item }) => (
          <HistoryListItem
            history={item}
            onPress={() => navigateToDetail(item.id)}
          />
        )}
      />
    </View>
  );
};
```

### 3.2 历史记录详情组件
```typescript
// components/history/HistoryDetail.tsx
export const HistoryDetail = ({ route }) => {
  const { historyId } = route.params;
  const [historyDetail, setHistoryDetail] = useState<UserHistory>(null);

  const loadHistoryDetail = async () => {
    // 加载具体历史记录详情
  };

  return (
    <ScrollView style={styles.container}>
      <CardSpread cards={historyDetail.card_ids} />
      <InterpretationSection
        basicInterpretation={historyDetail.result.basic_interpretation}
        aiInterpretation={historyDetail.result.ai_interpretation}
      />
    </ScrollView>
  );
};
```

## 4. 本地存储机制

### 4.1 SQLite 存储实现
```typescript
class HistoryStorage {
  // 保存历史记录（无限制保存）
  async saveHistory(history: UserHistory) {
    // 插入新记录，不限制数量
  }

  // 获取历史记录列表（默认最新100条）
  async getHistories(filter?: HistoryFilter, limit: number = 100, offset: number = 0): Promise<UserHistory[]> {
    // 根据筛选条件和分页参数获取历史记录
  }

  // 获取历史记录总数
  async getHistoryCount(filter?: HistoryFilter): Promise<number> {
    // 返回符合筛选条件的记录总数
  }

  // 获取单条历史记录
  async getHistoryById(id: string): Promise<UserHistory> {
    // 根据ID查询具体历史记录
  }
}
```

### 4.2 同步策略
- 优先使用本地存储
- 网络良好时支持云端同步 （暂时不实现）
- 提供手动同步选项 （暂时不实现）

## 5. 用户交互流程

1. 占卜完成后自动保存历史
2. 从首页导航进入历史记录页
3. 可筛选和搜索历史记录
4. 点击记录查看详情
5. 支持删除历史记录

## 6. 性能与优化

- 使用虚拟列表减少渲染开销
- 分页加载历史记录（默认100条/页）
- 本地缓存优化访问速度
- 最小化数据库查询开销
- 支持无限滚动加载更多历史

## 7. 安全与隐私

- 匿名用户ID
- 本地加密存储
- 用户可主动清除历史
- 遵循最小数据收集原则

## 8. 待办事项

- [ ] 实现本地存储模块（支持无限制保存）
- [ ] 开发历史列表组件（分页加载）
- [ ] 完成历史详情页面
- [ ] 添加筛选和搜索功能
- [ ] 性能测试与优化（虚拟列表）
- [ ] 用户隐私设置

## 9. 技术栈

- React Native
- Expo SQLite
- TypeScript
- React Navigation
