# 支付功能实施计划

## 总览
- 国内环境：先上线兑换码充值，最快速打通付费闭环。
- 国际环境：Android 使用 Google Play Billing；iOS 支付方案待定（需后续讨论）。

## 国内方案：兑换码充值

### 目标
- 在无企业支付资质的情况下，快速实现付费功能。
- 支撑匿名用户体系，通过安装 ID 与兑换码绑定权限。

### 流程概述
1. 运营侧生成兑换码并通过外部渠道售卖（例：小商店、社群、客服手动发放）。
2. 用户在 App 内输入兑换码。
3. 后端校验兑换码有效性、幂等性，写入订单并给用户账户增加点数（credits）。
4. 客户端刷新余额，提示兑换成功。

### 服务端改动
- 新增表
  - `redeem_codes`：code、product_id、credits、status、used_by、used_at、created_at。
  - `purchases`：order_id、platform=redeem_code、code、user_id、credits、status、created_at。
  - `users` / `user_balance`：若尚未创建，使用 installation_id 匿名建档。
- API
  - `POST /redeem`：入参 code、installationId；返回新增余额或错误信息。
  - `GET /me/balance`：返回当前 credits、最近订单。
  - `POST /consume`：生成/分析前扣点，余额不足时返回错误码。
- 校验要点
  - 兑换码一次性使用；并发下用事务锁定或 `SELECT FOR UPDATE`。
  - 处理过期/禁用状态，便于运营控制。

### 客户端改动
- 在“充值/权益”页面添加兑换码输入框与“兑换”按钮。
- 输入后调用 `/redeem`，成功则在本地更新余额状态（结合 `/me/balance`）。
- 余额不足时提示“请购买兑换码”并引导至运营渠道。

### 运营支持
- 兑换码生成工具：可先用脚本批量生成，导出 CSV。
- 售卖渠道：客服、社群、第三方发卡平台等。
- 风控：兑换码长度≥16，混合字母数字；服务端限制单设备每日尝试次数。

## 国际方案：Google Play Billing (Android)

### 目标
- 在拥有 Google Play 服务的环境提供原生内购体验。
- 通过服务器验证 purchase token，保证安全性。

### 流程概述
1. 客户端调用 Play Billing 查询商品，发起购买。
2. Google 返回 `purchaseToken`。
3. 客户端携带 `purchaseToken` 调用后端 `POST /payments/google/verify`。
4. 后端使用 Google Play Developer API 验证并消费订单，成功后给用户加点。
5. 客户端刷新余额并完成消费流程。

### 服务端改动
- 扩展 `purchases` 表：支持 `platform=google_play`、`purchase_token`、`product_id`、`package_name`、`acknowledged`。
- API
  - `POST /payments/google/verify`：校验 purchase token、写入订单、增加 credits。
  - `GET /payments/{order_id}`：可用于客户端轮询状态（可选）。
- Google 服务帐号
  - 配置 Google Play Developer API 权限；在后端存放凭据。
  - 使用 `purchases.products.get` 检查 `purchaseState`、`consumptionState`。
- 防重与安全
  - 订单幂等（`purchaseToken` 唯一）；重复调用直接返回已成功结果。
  - 成功后调用 `purchases.products.consume`（或在 BillingClient 侧消费），避免重复发货。

### 客户端改动
- 引入 Google Play Billing SDK（或 Expo IAP）。
- 商品配置：如 `credits_10`、`credits_30`、`credits_100`。
- 成功购买后调用后端验证接口；失败或已购买未消费需再次验证。
- 在余额不足提示中引导发起内购。

## 支付入口策略
- 启动时检测环境：是否存在 Google Play 服务或配置标记。
- 如果检测到国内渠道包或运行环境不支持 GMS，则隐藏 Google 内购入口，仅展示兑换码充值。
- 若用户切换到支持 Google Play 的环境，则展示内购入口，兑换码仍保留作为备用渠道。

## 后续计划
- iOS 支付方案待调研（可考虑 StoreKit 内购或 Paywall SDK）。
- 国内环境若需要更顺畅的在线支付，再评估聚合支付 H5/微信原生支付接入。
- 完成支付后在 LLM 调用前统一扣点，逐步补充风控日志与对账流程。
