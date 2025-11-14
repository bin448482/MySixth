const { withAndroidManifest } = require('@expo/config-plugins');

// 标签页配置
const tabsConfig = {
  // 控制标签栏的显示/隐藏
  tabBarEnabled: false,

  // 可选：如果需要保留单个标签页的配置
  tabs: {
    home: {
      enabled: true,
      title: 'Home',
      icon: 'house.fill',
    },
    explore: {
      enabled: true,
      title: 'Explore',
      icon: 'paperplane.fill',
    },
  },
};

module.exports = ({ config }) => {
  // 合并现有 app.json 配置，并显式设置 android.package（EAS 构建必需）
  let appConfig = {
    ...config,
    // 添加自定义标签页配置
    extra: {
      ...config.extra,
      tabsConfig,
    },
    android: {
      ...config.android,
      // 优先使用 app.json 中声明的包名；否则允许用环境变量覆盖；再否则使用默认值
      package:
        (config.android && config.android.package) ||
        process.env.ANDROID_PACKAGE ||
        'com.mysixth.tarot',
    },
  };

  appConfig = withAndroidManifest(appConfig, (manifestConfig) => {
    const application = manifestConfig.modResults.manifest.application ?? [];
    if (application.length > 0) {
      application[0].$['android:usesCleartextTraffic'] = 'true';
    }
    return manifestConfig;
  });

  return appConfig;
};
