# 保存用户记录功能实施计划

## 1. 确定保存记录的数据结构
- 使用 `UserHistory` 接口
- 需要包含：
  * user_id
  * spread_id
  * card_ids（JSON字符串）
  * interpretation_mode
  * result（JSON字符串）
  * timestamp

## 2. 实现保存逻辑
- 在 `ReadingService` 中实现 `saveReadingResult` 方法
- 调用 `UserDatabaseService` 的 `saveUserHistory` 方法
- 将 `ReadingResult` 转换为 `UserHistory` 格式

## 3. 集成到现有占卜流程
- 在完成解读步骤后自动触发保存
- 处理不同模式（离线/AI）的保存逻辑
- 添加错误处理机制

## 4. 用户体验优化
- 添加保存成功/失败的提示
- 处理可能的网络或数据库错误
- 确保用户数据安全和隐私

## 预期实现文件
- `lib/services/ReadingService.ts`（新建或修改）
- 可能修改 `lib/database/user-db.ts`

## 风险和注意事项
- 确保不重复保存记录
- 处理并发保存场景
- 避免保存敏感信息

## 技术实现细节

### 数据转换示例
```typescript
function convertReadingResultToUserHistory(
  readingResult: ReadingResult,
  userId: string
): Omit<UserHistory, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    spread_id: readingResult.spread.id,
    card_ids: JSON.stringify(readingResult.cards.map(card => card.card.id)),
    interpretation_mode: readingResult.metadata.interpretation_mode,
    result: JSON.stringify(readingResult),
    timestamp: new Date().toISOString()
  };
}
```

### 保存方法实现
```typescript
async saveReadingResult(
  sessionId: string,
  result: ReadingResult
): Promise<number> {
  try {
    const userHistory = convertReadingResultToUserHistory(
      result,
      result.metadata.user_id
    );

    const saveResult = await this.userDbService.saveUserHistory(userHistory);

    if (!saveResult.success) {
      throw new Error(saveResult.error || '保存记录失败');
    }

    return saveResult.data; // 返回插入的记录ID
  } catch (error) {
    console.error('保存用户记录出错:', error);
    throw error;
  }
}
```