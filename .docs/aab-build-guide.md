# AAB 打包最简路径（Expo EAS 为主；附带纯 RN/Gradle 方案）

目标：尽快产出可上传到 Google Play 内部测试轨道的 `.aab`，并确保包含 Play Billing 权限以解锁“应用内商品”创建入口。

适用仓库：`my-tarot-app`（Expo React Native）

---

## 一、Expo EAS 路线（推荐）

前提
- 已安装 Node.js / npm，且项目为 Expo 应用（Managed 或 Prebuild）。
- 有 Expo 账号，命令行可登录。

1) 安装工具并登录
```bash
npm i -g eas-cli
eas login         # 或 npx expo login
```

2) 配置包名与权限
- 在 `my-tarot-app/app.json` 或 `app.config.ts` 中确认/加入以下关键字段（示例）：
```json
{
  "expo": {
    "name": "my-tarot-app",
    "slug": "my-tarot-app",
    "version": "1.0.0",
    "android": {
      "package": "com.mysixth.tarot",
      "versionCode": 1,
      "permissions": ["com.android.vending.BILLING"]  // 确保 Play 识别 IAP
    }
  }
}
```
要点
- `android.package` 必须与 Play Console 中该应用的包名一致。
- `com.android.vending.BILLING` 一般由 IAP 库自动注入；为了让 Play 尽快识别，建议显式添加。
- 每次上传需递增 `versionCode`。

3) 首次配置 EAS
```bash
cd my-tarot-app
eas build:configure   # 选择 Android；按需创建/导入 keystore
```

4) 生成 AAB
```bash
eas build -p android --profile production
```
完成后命令行会给出构建详情页和 `.aab` 下载链接（artifact）。

5) 验证（可选）
- 确认生成的 `.aab` AndroidManifest 中包含 `com.android.vending.BILLING`。
- 可用 Android Studio 或 bundletool/aapt2 检查。

6) 上传到内部测试
- Play Console → 测试和发布 → 内部测试 → 创建新的发布版本 → 上传 `.aab` → 保存并提交。
- 上传成功数分钟后，“借助 Play 变现 → 商品 → 一次性商品”将可用，从而创建 Managed Product。

---

## 二、纯 React Native（Bare/Gradle）路线

前提
- 工程存在 `android/` 子目录，且已配置 Release 签名。

1) 配置包名/版本与权限
- `android/app/build.gradle` 中设置：
  - `defaultConfig.applicationId "com.mysixth.tarot"`
  - `defaultConfig.versionCode 1`
  - `defaultConfig.versionName "1.0.0"`
- 权限（若库未自动注入，可在 `AndroidManifest.xml` 声明）：
```xml
<uses-permission android:name="com.android.vending.BILLING" />
```

2) 生成 AAB
```bash
cd android
./gradlew bundleRelease
```
产物路径：
```
android/app/build/outputs/bundle/release/app-release.aab
```

3) 上传到内部测试（步骤同上）

签名说明（简述）
- 需准备 release keystore，并在 `android/gradle.properties` 和 `android/app/build.gradle` 中配置 `signingConfigs.release` 与 `buildTypes.release.signingConfig`。无签名将无法在 Play 正常分发。

---

## 三、Play Console 上传与 IAP 解锁

1) 内部测试发布
- 内部测试轨道 → 创建发布 → 上传 `.aab` → 填写版本说明 → 保存/提交。

2) IAP 面板解锁
- 成功上传且 Play 识别到 `BILLING` 权限后，`借助 Play 变现 → 商品 → 一次性商品` 将允许创建/保存商品（即便先不激活）。

3) 测试账号
- 在“内部测试”中添加“电子邮件列表”或“许可测试人员（License Testing）”。许可测试购买不会真实扣款，适合联调。

---

## 常见问题与排查

- 看不到“应用内商品/一次性商品”入口
  - 尚未上传包含 `com.android.vending.BILLING` 的 `.aab`；请先按上文打一次包并上传。
  - 上传后等待几分钟并刷新。

- 包名不匹配导致拒绝
  - `android.package` / `applicationId` 与 Play Console 应用包名必须一致。

- 重复上传失败
  - 递增 `versionCode` 后再构建上传。

- EAS 未配置签名
  - 运行 `eas build:configure` 并选择由 EAS 生成 keystore（或导入现有 keystore）。

---

## 最小命令速查（Expo EAS）
```bash
npm i -g eas-cli
eas login
# 编辑 app.json/app.config.ts：设置 android.package/versionCode，并加入 BILLING 权限
eas build:configure
eas build -p android --profile production
```

产出 AAB 后，上传到内部测试轨道即可。若需要，我可以在你上传成功后，代为创建以下应用内商品骨架（不激活）：`credits_5`、`credits_10`、`credits_20`、`credits_50`、`credits_100`（或使用前缀 `com.mysixth.tarot.credits_5` 等）。

