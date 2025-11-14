# 客户端变更设计文档（充值中心 + Google Play Billing）

版本：v1 首版实现（Android）
目标：在“设置-充值中心”整合 Google Play 积分购买与兑换码充值，确保成功购买后后端入账与余额刷新，提供稳定的错误兜底与可观测性。


## 1. 范围与不做
- 范围
  - 设置页的“充值中心”UI改造与交互
  - 接入 react-native-iap 获取商品、发起购买、完成交易
  - 成功后调用后端 `/api/v1/payments/google/verify` 入账并刷新 `/api/v1/me/balance`
  - 维持现有“兑换码充值”入口作为兜底
- 不做（首版）
  - iOS 内购
  - 订单历史完整列表页（保持简略/折叠）
  - RTDN/退款自动同步（后续版本）


## 2. 受影响区域
- 文件
  - `my-tarot-app/components/settings/RechargeSection.tsx`（主改动，新增商品区块与购买流程）
  - 可选：新增子组件
    - `my-tarot-app/components/settings/PackageCard.tsx`
    - `my-tarot-app/components/common/Toast.tsx`（如需统一轻提示）
- 依赖
  - 新增 `react-native-iap`


## 3. 信息架构与布局
- 结构（自上而下）
  1) 余额卡片（BalanceCard）：当前积分、说明、刷新按钮
  2) Google Play 购买区（PackagesGrid）：2 列卡片，3–6 种套餐（“最受欢迎”徽标）
  3) 兑换码充值（RedeemCard）：保留现入口，文案优化
  4) 常见问题/说明（FAQ）：计费规则、测试提示
  5) 最近交易（History，折叠，展示 1–2 条，展开查看最多 5 条）
- 视觉
  - 延续金色点缀（#d4af37）+ 玻璃拟态卡片
  - 购买按钮加载态与成功/失败条幅反馈


## 4. 关键用户流程
- 购买积分（Android）
  1) 初始化 IAP：`initConnection` → `getProducts([ids])`
  2) 用户点选套餐：`requestPurchase({ sku: productId })`
  3) 监听成功回调 → 取 `purchaseToken`
  4) 调后端校验：`POST /api/v1/payments/google/verify`（携带 `installation_id/product_id/purchase_token`）
  5) 后端成功返回 → UI显示“已到账 +X 积分” → 刷新 `/api/v1/me/balance`
  6) 完成交易：`finishTransaction(purchase, { isConsumable: true })`
- 购买失败/取消
  - 显示错误文案（取消/商店不可用/网络错误/校验失败），保持 UI 状态可重试
  - 兜底引导：使用兑换码充值
- 兑换码流程
  - 保持现有入口；成功后显示“+X 积分”，刷新余额


## 5. 组件与状态
- RechargeSection（现有，扩展）
  - 新增状态：`products`、`isIapReady`、`loadingProducts`、`purchasingProductId`、`verifying`、`error`
  - 平台判断：`Platform.OS === 'android'` 显示 IAP 区块
  - 生命周期：mount → init IAP → 拉取商品；unmount → 移除 listener、`endConnection`
- PackageCard（新增，简化 props）
  ```ts
  interface PackageCardProps {
    productId: string;
    title: string;       // e.g. "50 积分"
    price: string;       // 来自 IAP，本地化价格
    highlight?: 'popular' | 'bestValue';
    disabled?: boolean;
    loading?: boolean;
    onPress: () => void;
  }
  ```
- 兑换码入口（保留）
  - 文案强化为“使用兑换码充值（备用方式）”


## 6. API 交互
- 后端接口
  - `POST /api/v1/payments/google/verify`
    - body: `{ installation_id, product_id, purchase_token }`
    - success: `{ success: true, credits_awarded, new_balance }`
  - `GET /api/v1/me/balance`（需携带用户 JWT）
- 失败处理
  - 4xx：提示具体错误（如 token 无效/已消费）
  - 5xx/网络失败：提示“服务器繁忙，可稍后重试或使用兑换码”
- 幂等
  - 同一 `purchaseToken` 重复提交，后端应返回“已处理”；前端显示成功而非重复入账


## 7. IAP 集成要点（客户端）
- 依赖：`react-native-iap`
- 关键调用
  - `initConnection()` / `endConnection()`
  - `getProducts([ids])`
  - `requestPurchase({ sku })`
  - `purchaseUpdatedListener` / `purchaseErrorListener`
  - `finishTransaction(purchase, true)`
- 商品 ID（需与后端映射一致）
  - `com.mysixth.tarot.credits_5|10|20|50|100`
- 体验
  - 商品加载失败→“重试加载商品”按钮
  - 购买进行中→按钮内 loading，小条幅“正在联系商店…”
  - 校验进行中→顶部条幅“正在确认订单…”


### 7.1 启动可用性检查（Google Play/“Google Pay” 可用）
- 目的：在初始化阶段判断是否展示 IAP 区块与是否允许发起购买；不可用时自动降级到“兑换码充值”。
- 检查清单
  - 平台是否为 Android
  - `initConnection()` 是否成功
  -（可选）`getBillingClientVersion()` 返回的版本（记录日志，≥5 推荐）
  - `getProducts([ids])` 是否能返回非空商品列表
  - 失败时设置 `isIapReady=false` 并显示“商店不可用”提示条 + 兑换码入口
- 参考实现（示例片段）
  ```ts
  import * as RNIap from 'react-native-iap';
  import { Platform } from 'react-native';

  const productIds = [
    'com.mysixth.tarot.credits_5',
    'com.mysixth.tarot.credits_10',
    'com.mysixth.tarot.credits_20',
  ];

  async function preflightCheckIap() {
    if (Platform.OS !== 'android') {
      return { available: false, reason: 'not_android' };
    }
    try {
      const ok = await RNIap.initConnection();
      if (!ok) return { available: false, reason: 'init_failed' };

      const billingVersion = await (RNIap as any).getBillingClientVersion?.();
      // 可记录：console.log('BillingClient', billingVersion);

      const products = await RNIap.getProducts(productIds);
      if (!products || products.length === 0) {
        return { available: false, reason: 'no_products' };
      }

      return { available: true, products, billingVersion };
    } catch (e: any) {
      return { available: false, reason: e?.code || 'unknown', message: e?.message };
    }
  }
  ```
  - UI 使用：
    - `const { available, products } = await preflightCheckIap();`
    - `available=true` 显示 PackagesGrid，并缓存 `products`
    - `available=false` 隐藏 IAP 区块，显示“商店不可用”提示条与“使用兑换码充值”按钮


## 8. 文案与 i18n（新增/调整）
- 命名空间：`settings.recharge`（沿用）
- 新增键（示例）
  - `iap.title`: "购买积分（通过 Google Play）"
  - `iap.loading`: "正在加载商品…"
  - `iap.retry`: "重试加载商品"
  - `iap.unavailable`: "商店暂不可用，请稍后再试或使用兑换码"
  - `iap.popular`: "最受欢迎"
  - `iap.bestValue`: "超值"
  - `iap.success`: "已成功充值 {{credits}} 积分"
  - `iap.verifying`: "正在确认订单…"
  - `iap.error.cancelled`: "购买已取消"
  - `iap.error.failed`: "购买失败：{{message}}"
  - `iap.error.verify`: "订单校验失败，请稍后重试或使用兑换码"


## 9. 可达性与状态
- 按钮触达面 ≥ 44px，文本对比度合规
- 弱网：明确的加载/错误/可重试状态
- 骨架：余额与商品列表骨架屏，避免闪烁


## 10. 埋点（可选）
- 事件
  - `iap_products_loaded`（count）
  - `iap_purchase_tap`（productId）
  - `iap_purchase_success`（productId, credits）
  - `iap_purchase_failed`（code, message）
  - `iap_verify_success`（orderId, credits）
  - `iap_verify_failed`（httpStatus, message）
  - `balance_refreshed`（credits）


## 11. 风险与兜底
- 风险
  - Play 商店状态异常/测试账号配置问题 → 无法拉取商品
  - 购买成功但校验失败 → UI 需提示“重新校验”与“兑换码兜底”
  - 监听清理缺失 → 重复回调
- 兜底
  - 兑换码入口始终可用
  - 后端 `GOOGLE_PLAY_ENABLED=false` 时前端隐藏 IAP 区块


## 12. 验收标准（AC）
- Android 测试轨道安装后：可拉取商品并购买；成功后余额+X
- 购买取消/失败有明确反馈；可重试
- 校验幂等：相同 token 不重复入账
- 余额/交易记录与后端一致
- i18n 与平台判断正确；iOS/非 Android 不显示 IAP 块


## 13. 任务分解
1) 接入依赖与平台判断（0.5d）
2) PackagesGrid 与 PackageCard UI（0.5d）
3) 购买与监听、校验与入账、完成交易（1d）
4) 错误兜底、i18n、骨架与提示（0.5d）
5) 联调/验收与回归（0.5d）


## 14. 与后端对齐（必读）
- 产品映射：客户端商品 ID 必须与后端 `GooglePlayService._get_credits_for_product` 一致
- 入账接口：`/api/v1/payments/google/verify` 按定义返回 `credits_awarded/new_balance`
- 需要后端提供：
  - 幂等保障（按 `purchase_token` 去重）
  - `UserService.get_or_create_user` 或保证 `register_user` 流畅可用


（完）
