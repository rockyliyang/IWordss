// pages/wechat-bind/wechat-bind.ts
import { userAPI } from '../../utils/api';
import { User, ApiResponse } from '../../utils/api.types';

Page({
  data: {
    isLoggedIn: false,
    isWechatBound: false,
    userInfo: null as User | null,
    openid: '',
    bindMessage: ''
  },

  onLoad() {
    // 检查用户是否已登录
    const token = wx.getStorageSync('token');
    if (token) {
      this.setData({ isLoggedIn: true });
      this.getUserInfo();
    }
  },

  // 获取用户信息
  getUserInfo() {
    userAPI.getUserInfo().then(res => {
      if (res.success && res.data) {
        this.setData({
          userInfo: res.data,
          isWechatBound: !!res.data.openid
        });
      }
    }).catch((err: Error) => {
      console.error('获取用户信息失败', err);
      wx.showToast({
        title: '获取用户信息失败',
        icon: 'none'
      });
    });
  },

  // 微信登录
  handleWechatLogin() {
    wx.login({
      success: (res) => {
        if (res.code) {
          userAPI.wxLogin({code: res.code}).then((loginRes: ApiResponse<any>) => {
            if (loginRes.success && loginRes.data) {
              wx.setStorageSync('token', loginRes.data.token);
              this.setData({
                isLoggedIn: true,
                userInfo: loginRes.data.user,
                isWechatBound: true
              });
              wx.showToast({
                title: '微信登录成功',
                icon: 'success'
              });
            } else {
              // 处理登录失败情况
              wx.showToast({
                title: loginRes.message || '微信登录失败',
                icon: 'none'
              });
            }
          }).catch((err: Error) => {
            console.error('微信登录失败', err);
            wx.showToast({
              title: '微信登录失败',
              icon: 'none'
            });
          });
        } else {
          wx.showToast({
            title: '获取微信code失败',
            icon: 'none'
          });
        }
      }
    });
  },

  // 绑定微信账号
  handleBindWechat() {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录系统账号',
        icon: 'none'
      });
      return;
    }

    // 如果没有openid，先获取
    if (!this.data.openid) {
      wx.login({
        success: (res) => {
          if (res.code) {
            // 这里假设后端有一个接口可以根据code获取openid
            // 实际项目中可能需要调整
            this.setData({ openid: `wx_${res.code}` }); // 模拟获取openid
            this.bindWechatAccount();
          } else {
            wx.showToast({
              title: '获取微信code失败',
              icon: 'none'
            });
          }
        }
      });
    } else {
      this.bindWechatAccount();
    }
  },

  // 执行绑定操作
  bindWechatAccount() {
    userAPI.bindWechat({ openid: this.data.openid }).then((res: ApiResponse<any>) => {
      if (res.success) {
        this.setData({
          isWechatBound: true,
          bindMessage: '微信账号绑定成功'
        });
        wx.showToast({
          title: '绑定成功',
          icon: 'success'
        });
        // 刷新用户信息
        this.getUserInfo();
      } else {
        this.setData({
          bindMessage: res.message || '绑定失败'
        });
        wx.showToast({
          title: res.message || '绑定失败',
          icon: 'none'
        });
      }
    }).catch((err: Error) => {
      console.error('绑定微信账号失败', err);
      this.setData({
        bindMessage: '绑定失败，请重试'
      });
      wx.showToast({
        title: '绑定失败，请重试',
        icon: 'none'
      });
    });
  },

  // 跳转到登录页
  navigateToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  }
});