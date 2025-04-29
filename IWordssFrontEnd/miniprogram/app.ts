// app.ts
// 导入环境配置
import { getEnvConfig } from './utils/config';

App<IAppOption>({
  globalData: {
    userInfo: null as WechatMiniprogram.UserInfo | null,
    isLoggedIn: false,
    // 使用环境配置中的API地址
    baseUrl: null as string | null
  },
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    
    // 初始化baseUrl
    this.globalData.baseUrl = getEnvConfig().apiBaseUrl
    
    // 检查登录状态并进行静默登录
    this.silentLogin()
  },
  
  // 静默登录方法
  silentLogin() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.isLoggedIn = true
      // 可以在这里验证token有效性
    } else {
      // 没有token，尝试微信静默登录
      this.wechatSilentLogin()
    }
  },
  
  // 微信静默登录
  wechatSilentLogin() {
    // 调用微信登录获取code
    wx.login({
      success: (res) => {
        if (res.code) {
          // 导入API
          const { userAPI } = require('./utils/api')
          // 发送code到后端换取登录态
          userAPI.wxLogin(res.code).then(loginRes => {
            if (loginRes.success && loginRes.data && loginRes.data.token) {
              // 登录成功，保存token
              wx.setStorageSync('token', loginRes.data.token)
              this.globalData.isLoggedIn = true
              this.globalData.userInfo = loginRes.data.user
              console.log('微信静默登录成功')
            } else {
              // 未绑定账号或其他错误，保持未登录状态
              this.globalData.isLoggedIn = false
              console.log('微信静默登录失败:', loginRes.message)
            }
          }).catch(err => {
            console.error('微信静默登录失败:', err)
            this.globalData.isLoggedIn = false
          })
        } else {
          console.error('获取微信code失败')
          this.globalData.isLoggedIn = false
        }
      },
      fail: () => {
        console.error('wx.login调用失败')
        this.globalData.isLoggedIn = false
      }
    })
  },
  
  // 检查是否需要登录
  checkAuth(pageObj: any) {
    const originalOnLoad = pageObj.onLoad
    pageObj.onLoad = function(options: any) {
      const app = getApp()
      if (!app.globalData.isLoggedIn) {
        // 未登录，跳转到登录页
        wx.navigateTo({
          url: '/pages/login/login'
        })
        return
      }
      
      // 已登录，执行原始onLoad
      if (originalOnLoad) {
        originalOnLoad.call(this, options)
      }
    }
    return pageObj
  }
})