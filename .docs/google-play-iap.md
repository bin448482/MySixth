# Google Play IAP（积分充值）集成实施方案

目标：在 Android 端实现应用内购买“积分”，通过 Google Play Billing 完成付款，服务端用 Google Play Developer API 校验并入账，最终更新用户积分余额与交易记录。


## 一、架构对齐

- 客户端（Expo React Native，my-tarot-app/）
  - 使用 `react-native-iap` 获取商品列表、拉起购买、监听购买结果。
  - 成功购买后把 `productId` 与 `purchaseToken` 发送到后端 `/api/v1/payments/google/verify` 验证并入账，随后在客户端完成 `finishTransaction`（消费/确认）。
- 后端（FastAPI，tarot-backend/）
  - 已有模型：`users/user_balance/credit_transactions/purchases`。
  - 已有接口与服务骨架：`/api/v1/payments/google/verify`、`/api/v1/payments/google/consume`，`app/services/google_play.py` 使用 AndroidPublisher v3 验证并入账。
  - 需配置服务账号 JSON、启用 `GOOGLE_PLAY_ENABLED`、补齐产品映射与少量服务方法。
- 管理后台（Next.js，tarot-admin-web/）
  - 可选：增加“订单/积分变动”可视化与检索，不影响首版上线。


## 二、Google Play Console 准备

1. 应用与测试轨道
   - 创建/选择应用，开启内部测试轨道（Internal Testing）。
   - 在“许可测试人员”添加测试账号（测试充值不真实扣款）。
2. 创建应用内商品（In‑app products → Managed product）
   - 示例：`credits_5`、`credits_10`、`credits_20`、`credits_50`、`credits_100`；完整 ID 建议：`com.mysixth.tarot.credits_5` 等。
   - 填写定价与本地化信息，保存并“激活”。
3. 启用 API 访问与服务账号
   - Play Console → API access 关联 GCP 项目。
   - 创建 Service Account，授予 Android Publisher 权限（至少“查看财务数据除外的发布权限”，建议针对购买校验授予“查看应用内购买订单”等必要权限）。
   - 生成并下载服务账号密钥 JSON。
4.（可选）实时开发者通知 RTDN
   - 消耗型商品可不强制；若后续支持订阅/退款自动化，再接入 Pub/Sub。


## 三、后端实施（FastAPI）

1. 环境变量与凭据
   - `tarot-backend/.env` 添加：
     ```env
     GOOGLE_PLAY_ENABLED=true
     GOOGLE_PACKAGE_NAME=com.mysixth.tarot
     GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=/app/creds/google-service-account.json
     ```
   - 部署时将下载的 JSON 放到容器可读路径（见“部署”章节）。
2. 产品映射
   - 更新 `app/services/google_play.py::_get_credits_for_product`，确保与 Play Console 的商品 ID 一致：
     ```python
     product_credits = {
         'com.mysixth.tarot.credits_5': 5,
         'com.mysixth.tarot.credits_10': 10,
         ...
     }
     ```
3. 校验与入账流程（已就绪，需微调）
   - 入口：`POST /api/v1/payments/google/verify` → `GooglePlayService.verify_purchase`：
     - 调用 AndroidPublisher `purchases.products.get` 校验 `purchaseToken` 与 `productId`；校验 `purchaseState == 0`；若 `consumptionState == 1` 视为已消费。
     - 幂等：按 `purchase_token` 查重，避免重复入账。
     - 新建 `purchases` 订单、写入 `credit_transactions`，更新 `user_balance`。
   - 注意：当前服务引用 `UserService.get_or_create_user`，仓库中未实现。请新增同步方法或改用现有 `UserService.register_user(db, installation_id)`（建议新增一个 `get_or_create_user(db, installation_id)` 包装）。
4. 消费/确认
   - 方案 A（推荐）：客户端购买成功→后端校验入账→客户端 `finishTransaction({isConsumable:true})` 完成“消费/确认”。
   - 方案 B：后端调用 `purchases.products.consume`（`/api/v1/payments/google/consume` 已有框架）；与方案 A 二选一，避免重复。
5. 安全与日志
   - 开启 `PAYMENT_RATE_LIMIT_PER_HOUR` 防刷；记录失败原因与调用链路 ID。
   - 记录 `orderId/purchaseToken/productId/installation_id`，便于审计。
6. 管理/查询（可选）
   - 增加订单列表与筛选 API，或在 admin 前端展示用户购买与余额变动。


## 四、客户端实施（React Native / Expo）

1. 依赖与配置
   - 安装 `react-native-iap`（EAS Managed 可用，需配置插件）：
     ```bash
     npm install react-native-iap
     # 或 yarn add react-native-iap
     ```
   - 确保使用 EAS 构建；在 `app.json/app.config.ts` 添加 Android 计费权限（若插件未自动注入）。
2. 关键流程
   - 初始化与获取商品：`getProducts([productIds])`。
   - 拉起购买：`requestPurchase({sku: productId})`。
   - 监听购买结果：`purchaseUpdatedListener` / `purchaseErrorListener`。
   - 成功后：调用后端 `/api/v1/payments/google/verify` 传入 `installation_id/productId/purchaseToken` 入账；返回成功再 `finishTransaction(purchase, {isConsumable:true})`。
3. 简要示例（核心片段）
   ```ts
   import * as RNIap from 'react-native-iap';

   const productIds = [
     'com.mysixth.tarot.credits_5',
     'com.mysixth.tarot.credits_10',
   ];

   async function initIap() {
     await RNIap.initConnection();
     const products = await RNIap.getProducts(productIds);
     // 展示 products 给用户选择
   }

   async function buy(productId: string) {
     const purchase = await RNIap.requestPurchase({ sku: productId });
     const token = purchase.purchaseToken ?? purchase.transactionReceipt;
     // 调后端校验与入账
     await api.post('/api/v1/payments/google/verify', {
       installation_id,
       product_id: productId,
       purchase_token: token,
     });
     // 完成交易（消费/确认）
     await RNIap.finishTransaction(purchase, true);
     // 刷新余额
   }
   ```
4. UI 融合
   - 在 `my-tarot-app/components/settings/RechargeSection.tsx` 增加商品列表与“购买”按钮（现仅有“兑换码”入口）。
   - 购买成功后刷新 `GET /api/v1/me/balance` 并在设置页显示更新后的积分。


## 五、测试计划

- 账号准备：把测试设备登录为“许可测试人员”，安装内部测试轨道 APK。
- 流程验证：商品拉取 → 购买 → 后端校验入账 → 客户端完成交易 → 余额刷新。
- 幂等测试：重复提交同一 `purchaseToken` 不应重复入账。
- 异常测试：取消购买、网络中断、后端 4xx/5xx；客户端需回滚 UI 状态并提示。
- 数据校验：后端 `purchases/credit_transactions/user_balance` 一致性。


## 六、部署与环境

1. Docker（backend）
   - 将服务账号密钥放入仓库安全路径（示例）：`deploy/secrets/google-service-account.json`（勿提交 Git）。
   - 在 `docker-compose.yml` 为 backend 增加只读挂载：
     ```yaml
     services:
       backend:
         volumes:
           - ./deploy/secrets/google-service-account.json:/app/creds/google-service-account.json:ro
         env_file: ./tarot-backend/.env
     ```
2. 变量与健康检查
   - `.env` 开启 `GOOGLE_PLAY_ENABLED=true`；启动后留意日志 `Google Play Developer API service initialized successfully`。
3. 证书与权限
   - 服务账号需具备 androidpublisher 作用域；密钥文件权限仅容器内可读。


## 七、上线与回滚

- 上线顺序：后端（开启校验服务）→ 发布内部测试包（含 IAP）→ 小范围测试 → 提升到开放测试/生产。
- 监控：购买成功率、接口耗时、错误码分布、余额异常报警。
- 回滚方案：客户端保留“兑换码充值”入口；后端可随时关闭 `GOOGLE_PLAY_ENABLED` 做降级处理。


## 八、TODO 与代码对齐清单

- [ ] 后端新增 `UserService.get_or_create_user(db, installation_id)` 或调整 `google_play_service` 调用为 `register_user`。
- [ ] 确认 `payments.py` 中引用的 `RedeemCodeResponse` import 是否缺失，修正类型引用问题。
- [ ] 补充产品映射与金额单位换算（`priceAmountMicros` → 货币分）。
- [ ] 客户端集成 `react-native-iap`、新增购买 UI、打通校验接口、完成交易。
- [ ] 添加基础告警与日志字段（orderId/purchaseToken）。


— 本文档面向首版“积分充值（Google Play）”落地，后续若扩展订阅或退款同步，再补充 RTDN 与对账流程。 

