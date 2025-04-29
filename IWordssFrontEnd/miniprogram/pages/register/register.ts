// pages/register/register.ts
import { userAPI } from '../../utils/api';

Page({
  data: {
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
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

  // 输入确认密码
  onConfirmPasswordInput(e: any) {
    this.setData({
      confirmPassword: e.detail.value,
      errorMsg: ''
    });
  },

  // 输入邮箱
  onEmailInput(e: any) {
    this.setData({
      email: e.detail.value,
      errorMsg: ''
    });
  },

  // 注册
  async register() {
    const { username, password, confirmPassword, email } = this.data;
    
    // 表单验证
    if (!username.trim()) {
      this.setData({ errorMsg: '请输入用户名' });
      return;
    }
    if (!password.trim()) {
      this.setData({ errorMsg: '请输入密码' });
      return;
    }
    if (password !== confirmPassword) {
      this.setData({ errorMsg: '两次输入的密码不一致' });
      return;
    }

    this.setData({ loading: true, errorMsg: '' });

    try {
      // 调用注册API
      const res = await userAPI.register({ username, password, email });
      
      if (res.success) {
        wx.showToast({
          title: '注册成功',
          icon: 'success',
          duration: 1500,
          success: () => {
            setTimeout(() => {
              // 返回登录页
              wx.navigateBack();
            }, 1500);
          }
        });
      } else {
        this.setData({ 
          errorMsg: res.message || '注册失败，请稍后再试',
          loading: false
        });
      }
    } catch (error) {
      console.error('注册失败:', error);
      this.setData({ 
        errorMsg: '注册失败，请稍后再试',
        loading: false
      });
    }
  },

  // 返回登录页
  goToLogin() {
    wx.navigateBack();
  }
});