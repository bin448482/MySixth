const { getDefaultConfig } = require('expo/metro-config');

// 标签页配置
const tabsConfig = {
  // 控制标签栏的显示/隐藏
  tabBarEnabled: false,
  
  // 可选：如果需要保留单个标签页的配置
  tabs: {
    home: {
      enabled: true,
      title: 'Home',
      icon: 'house.fill'
    },
    explore: {
      enabled: true,
      title: 'Explore',
      icon: 'paperplane.fill'
    }
  }
};

module.exports = ({ config }) => {
  // 合并现有 app.json 配置，并显式设置 android.package（EAS 构建必需）
  const appConfig = {
    ...config,
    // 添加自定义标签页配置
    extra: {
      ...config.extra,
      tabsConfig,
    },
    android: {
      ...config.android,
      // 使用环境变量可覆盖，默认使用原生工程中的包名
      package: process.env.ANDROID_PACKAGE || 'com.biiinnn.mytarotapp',
    },
  };

  return appConfig;
};
