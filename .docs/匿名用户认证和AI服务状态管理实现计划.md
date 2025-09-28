# 匿名用户认证和AI服务状态管理实现计划

## 📋 项目背景

基于塔罗牌应用的架构，需要实现以下功能：
1. 应用启动时检查AI服务健康状态
2. 实现匿名用户注册功能，获取JWT token
3. 优化占卜页面的AI服务状态检查逻辑
4. 为后续API调用提供统一的认证支持

## 🎯 实现目标

### 核心需求
- **应用启动时一次性检查**：AI服务健康状态 + 匿名用户注册
- **全局状态管理**：AI服务可用性和用户认证状态
- **优化页面逻辑**：type.tsx 直接获取状态，无需重复检查
- **统一认证机制**：所有API调用自动携带JWT token

### 技术要求
- 使用React Context进行全局状态管理
- AsyncStorage存储JWT token
- 错误处理和重试机制
- 与现有架构无缝集成

## 🛠️ 实现步骤

### 步骤1：创建认证服务 (AuthService.ts)

**文件位置**: `my-tarot-app/lib/services/AuthService.ts`

**功能实现**：
```typescript
class AuthService {
  // 调用后端 /auth/anon 接口
  async registerAnonymousUser(): Promise<{userId: string, token: string}>

  // 存储JWT token到AsyncStorage
  async saveToken(token: string): Promise<void>

  // 获取当前存储的token
  async getToken(): Promise<string | null>

  // 检查token是否有效
  async validateToken(): Promise<boolean>

  // 清除token（登出）
  async clearToken(): Promise<void>

  // 获取Authorization头
  async getAuthHeaders(): Promise<{Authorization: string} | {}>
}
```

**技术细节**：
- 单例模式，确保全局唯一实例
- 使用Expo SecureStore存储敏感token信息
- 提供token有效性验证
- 错误处理和网络异常处理

### 步骤2：创建全局应用状态Context

**文件位置**: `my-tarot-app/lib/contexts/AppContext.tsx`

**状态结构**：
```typescript
interface AppState {
  // AI服务状态
  isAIServiceAvailable: boolean
  isCheckingAIService: boolean
  aiServiceError: string | null

  // 认证状态
  isAuthenticated: boolean
  isAuthenticating: boolean
  authError: string | null
  userToken: string | null
  userId: string | null

  // 初始化状态
  isAppInitialized: boolean
  initializationError: string | null
}

interface AppContextType {
  state: AppState
  actions: {
    initializeApp: () => Promise<void>
    refreshAIServiceStatus: () => Promise<void>
    refreshAuthStatus: () => Promise<void>
  }
}
```

**核心功能**：
- 应用启动时执行完整初始化流程
- 提供AI服务状态和认证状态
- 支持手动刷新状态
- 错误状态管理和恢复机制

### 步骤3：修改应用根布局 (_layout.tsx)

**修改位置**: `my-tarot-app/app/_layout.tsx`

**添加内容**：
```typescript
// 在数据库初始化后添加
useEffect(() => {
  const initializeApp = async () => {
    try {
      // 1. 数据库初始化（现有逻辑）
      console.log('🚀 Starting database initialization...');
      const initializer = new DatabaseInitializer();
      const dbSuccess = await initializer.initialize();

      if (!dbSuccess) {
        console.error('❌ Database initialization failed');
        return;
      }

      // 2. AI服务健康检查
      console.log('🔍 Checking AI service health...');
      const aiService = AIReadingService.getInstance();
      const isAIHealthy = await aiService.checkServiceHealth();

      // 3. 匿名用户注册/验证
      console.log('👤 Initializing anonymous user...');
      const authService = AuthService.getInstance();
      await authService.initializeUser();

      // 4. 更新全局状态
      updateAppState({
        isAIServiceAvailable: isAIHealthy,
        isAuthenticated: true,
        isAppInitialized: true
      });

      console.log('✅ App initialization completed');
    } catch (error) {
      console.error('❌ App initialization error:', error);
      updateAppState({
        initializationError: error.message,
        isAppInitialized: true
      });
    }
  };

  initializeApp();
}, []);
```

**包装结构**：
```typescript
return (
  <AppProvider>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider config={tamaguiConfig}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          {/* 现有内容 */}
        </ThemeProvider>
      </TamaguiProvider>
    </GestureHandlerRootView>
  </AppProvider>
);
```

### 步骤4：优化type.tsx页面

**修改位置**: `my-tarot-app/app/(reading)/type.tsx`

**移除的代码**：
```typescript
// 删除以下逻辑
const [isAIServiceAvailable, setIsAIServiceAvailable] = useState(false);
const [isCheckingService, setIsCheckingService] = useState(true);

useEffect(() => {
  checkAIServiceHealth();
}, []);

const checkAIServiceHealth = async () => {
  // 整个函数删除
};
```

**新增的代码**：
```typescript
import { useAppContext } from '@/lib/contexts/AppContext';

export default function TypeSelectionScreen() {
  const router = useRouter();
  const { updateStep, updateType } = useReadingFlow();
  const { state } = useAppContext();

  // 直接从全局状态获取
  const isAIServiceAvailable = state.isAIServiceAvailable;
  const isCheckingService = state.isCheckingAIService || !state.isAppInitialized;

  // 其余逻辑保持不变
}
```

**优化效果**：
- 移除重复的健康检查逻辑
- 页面加载更快，直接获取状态
- 代码更简洁，职责更明确
- 状态同步，避免不一致

### 步骤5：升级AIReadingService认证支持

**修改位置**: `my-tarot-app/lib/services/AIReadingService.ts`

**添加认证支持**：
```typescript
import AuthService from './AuthService';

class AIReadingService {
  private authService: AuthService;

  private constructor() {
    // 现有构造函数逻辑
    this.authService = AuthService.getInstance();
  }

  // 获取带认证的请求头
  private async getRequestHeaders(): Promise<Record<string, string>> {
    const authHeaders = await this.authService.getAuthHeaders();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders
    };
  }

  // 更新所有API调用方法
  async analyzeDescription(description: string, spreadType: string = 'three-card'): Promise<AnalyzeResponse> {
    const headers = await this.getRequestHeaders();

    const response = await fetch(`${this.baseUrl}/api/v1/readings/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    // 处理401认证错误
    if (response.status === 401) {
      // 清除无效token，触发重新认证
      await this.authService.clearToken();
      throw new Error('认证失败，请重新登录');
    }

    // 其余逻辑保持不变
  }

  // 类似地更新 generateAIReading 方法
}
```

### 步骤6：创建统一的错误处理和重试机制

**文件位置**: `my-tarot-app/lib/utils/errorHandler.ts`

**功能实现**：
```typescript
export class NetworkError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthError extends Error {
  constructor(message: string = '认证失败') {
    super(message);
    this.name = 'AuthError';
  }
}

export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // 认证错误不重试
      if (error instanceof AuthError) {
        throw error;
      }

      // 最后一次重试失败
      if (i === maxRetries - 1) {
        throw lastError;
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }

  throw lastError!;
};
```

## 📁 文件结构

```
my-tarot-app/
├── lib/
│   ├── services/
│   │   ├── AuthService.ts          # 新增：认证服务
│   │   └── AIReadingService.ts     # 修改：添加认证支持
│   ├── contexts/
│   │   ├── AppContext.tsx          # 新增：全局应用状态
│   │   └── ReadingContext.tsx      # 现有：占卜流程状态
│   └── utils/
│       └── errorHandler.ts         # 新增：错误处理工具
├── app/
│   ├── _layout.tsx                 # 修改：添加应用初始化
│   └── (reading)/
│       └── type.tsx                # 修改：优化AI状态检查
```

## 🔄 工作流程

### 应用启动流程
```
1. 用户启动应用
   ↓
2. 数据库初始化
   ↓
3. AI服务健康检查
   ↓
4. 匿名用户认证
   ↓
5. 更新全局状态
   ↓
6. 应用就绪
```

### 后续API调用流程
```
1. 用户触发AI功能
   ↓
2. 从Context获取AI服务状态
   ↓
3. 如果可用，调用AIReadingService
   ↓
4. AuthService自动附加JWT token
   ↓
5. 发送认证请求到后端
```

## 🧪 测试计划

### 单元测试
- [ ] AuthService 各方法功能测试
- [ ] AppContext 状态管理测试
- [ ] 错误处理机制测试

### 集成测试
- [ ] 应用启动初始化流程测试
- [ ] AI服务健康检查集成测试
- [ ] 匿名用户注册集成测试
- [ ] API认证调用集成测试

### 用户体验测试
- [ ] 应用启动速度测试
- [ ] 网络异常处理测试
- [ ] 认证失效恢复测试
- [ ] AI服务不可用降级测试

## 🔧 技术细节

### AsyncStorage vs SecureStore
- **JWT Token**: 使用Expo SecureStore存储，确保安全性
- **用户偏好**: 使用AsyncStorage存储非敏感配置

### 错误边界处理
- 网络错误：自动重试机制
- 认证错误：清除token，重新认证
- AI服务错误：降级到离线模式

### 性能优化
- Context状态设计避免不必要的重渲染
- 懒加载非关键服务
- 缓存机制减少重复请求

## 📊 预期效果

### 用户体验改进
- ✅ 应用启动时一次性完成所有初始化
- ✅ 占卜页面快速加载，无需等待检查
- ✅ 网络异常时优雅降级
- ✅ 认证状态自动维护

### 开发体验改进
- ✅ 统一的认证管理机制
- ✅ 清晰的全局状态管理
- ✅ 可复用的错误处理工具
- ✅ 更好的代码组织和职责分离

### 系统稳定性
- ✅ 完善的错误处理和恢复机制
- ✅ 网络异常时的重试策略
- ✅ 认证失效时的自动重新认证
- ✅ AI服务不可用时的离线模式支持

## 📅 实施时间估算

- **步骤1 (AuthService)**: 2-3小时
- **步骤2 (AppContext)**: 2-3小时
- **步骤3 (_layout.tsx修改)**: 1小时
- **步骤4 (type.tsx优化)**: 30分钟
- **步骤5 (AIReadingService升级)**: 1-2小时
- **步骤6 (错误处理)**: 1-2小时
- **测试和调试**: 2-3小时

**总计**: 10-14小时（约2个工作日）

## 🚀 后续扩展

### 短期计划
- 添加用户偏好设置持久化
- 实现离线模式的更好提示
- 添加网络状态监听

### 长期计划
- 支持正式用户注册登录
- 实现用户数据云端同步
- 添加推送通知支持
- 多语言国际化支持

---

*本计划确保实现功能的同时，保持代码质量和用户体验，为后续功能扩展奠定良好基础。*