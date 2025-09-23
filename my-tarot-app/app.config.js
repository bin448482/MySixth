const { getDefaultConfig } = require('expo/metro-config');

// 标签页配置
const tabsConfig = {
  // 控制标签栏的显示/隐藏
  tabBarEnabled: true,
  
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
  // 合并现有的 app.json 配置
  const appConfig = {
    ...config,
    // 添加自定义标签页配置
    extra: {
      ...config.extra,
      tabsConfig
    }
  };

  return appConfig;
};