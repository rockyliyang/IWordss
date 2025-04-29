// utils/config.ts

// 环境配置
export const ENV = {
  // 开发环境
  development: {
    apiBaseUrl: 'http://localhost:3000/api'
  },
  // 生产环境
  production: {
    apiBaseUrl: 'https://api.iwordss.com/api' // 替换为实际的生产环境API地址
  }
};

// 当前环境
// 可以通过修改此变量来切换环境，也可以通过其他方式动态设置
let currentEnv: 'development' | 'production' = wx.getAccountInfoSync().miniProgram.envVersion === 'release' ? 'production' : 'development';

// 获取当前环境配置
export const getEnvConfig = () => {
  return ENV[currentEnv];
};

// 手动切换环境（可选，用于测试）
export const switchEnv = (env: 'development' | 'production') => {
  currentEnv = env;
  console.log(`已切换到${env}环境`);
  return ENV[currentEnv];
};