/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo,
    isLoggedIn: boolean,
    baseUrl: string | null
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
  checkLoginStatus(): void,
  checkAuth(pageObj: any): any,
  silentLogin(): void,
  wechatSilentLogin(): void
}