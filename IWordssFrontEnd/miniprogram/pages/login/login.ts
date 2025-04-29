// pages/login/login.ts
import { userAPI } from '../../utils/api';

Page({
  data: {
    username: '',
    password: '',
    loading: false,
    errorMsg: ''
  },

  // 输入用户名
  onUsernameInput(e: any) {
    this.setData({
      username: e.detail.value,
      errorMsg: ''
    });
  },

  // 输入密码
  onPasswordInput(e: any) {
    this.setData({
      password: e.detail.value,
      errorMsg: ''
    });
  },

  // 登录
  async login() {
    const { username, password } = this.data;
    
    // 表单验证
    if (!username.trim()) {
      this.setData({ errorMsg: '请输入用户名' });
      return;
    }
    if (!password.trim()) {
      this.setData({ errorMsg: '请输入密码' });
      return;
    }

    this.setData({ loading: true, errorMsg: '' });

    try {
      // 调用登录API
      const res = await userAPI.login({ username, password });
      
      if (res.success && res.data && res.data.token) {
        // 保存token到本地
        wx.setStorageSync('token', res.data.token);
        
        // 返回上一页或跳转到首页
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500,
          success: () => {
            setTimeout(() => {
              const pages = getCurrentPages();
              if (pages.length > 1) {
                wx.navigateBack();
              } else {
                wx.switchTab({
                  url: '/pages/index/index'
                });
              }
            }, 1500);
          }
        });
      } else {
        this.setData({ 
          errorMsg: res.message || '登录失败，请检查用户名和密码',
          loading: false
        });
      }
    } catch (error) {
      console.error('登录失败:', error);
      this.setData({ 
        errorMsg: '登录失败，请稍后再试',
        loading: false
      });
    }
  },

  // 微信登录
  async wxLogin() {
    this.setData({ loading: true, errorMsg: '' });

    try {
      // 获取微信登录code
      const loginRes = await wx.login();
      
      if (loginRes.code) {
        // 调用微信登录API
        const res = await userAPI.wxLogin(loginRes.code);
        
        if (res.success && res.data && res.data.token) {
          // 保存token到本地
          wx.setStorageSync('token', res.data.token);
          
          // 返回上一页或跳转到首页
          wx.showToast({
            title: '登录成功',
            icon: 'success',
            duration: 1500,
            success: () => {
              setTimeout(() => {
                const pages = getCurrentPages();
                if (pages.length > 1) {
                  wx.navigateBack();
                } else {
                  wx.switchTab({
                    url: '/pages/index/index'
                  });
                }
              }, 1500);
            }
          });
        } else {
          this.setData({ 
            errorMsg: res.message || '微信登录失败',
            loading: false
          });
        }
      } else {
        this.setData({ 
          errorMsg: '获取微信授权失败',
          loading: false
        });
      }
    } catch (error) {
      console.error('微信登录失败:', error);
      this.setData({ 
        errorMsg: '微信登录失败，请稍后再试',
        loading: false
      });
    }
  },

  // 跳转到注册页面
  goToRegister() {
    wx.navigateTo({
      url: '/pages/register/register'
    });
  }
});