# 微信小程序静默登录功能实现文档

## 功能概述

本功能实现了微信小程序的静默登录机制，通过微信提供的接口获取用户openid并自动完成登录流程，提供无感知的用户体验。用户打开小程序后，系统会自动调用微信登录API获取用户身份，无需用户手动点击登录按钮。

## 实现内容

### 后端实现

1. **数据库表结构**
   - 创建了`user_wechat_bindings`表，用于存储用户ID与微信openid的绑定关系
   - 表结构包含：id, user_id, openid, created_at, updated_at
   - 添加了唯一索引确保一个微信账号只能绑定一个系统账号

2. **API接口**
   - 微信绑定接口：`POST /api/users/bind-wechat`
   - 微信登录接口：`POST /api/wechat/login`

3. **控制器**
   - `wechatController.js`：实现了微信绑定和微信登录的业务逻辑
   - 登录逻辑：接收code -> 调用微信API获取openid -> 查询绑定关系 -> 获取用户信息 -> 生成JWT令牌
   - 使用微信官方API `jscode2session` 获取真实的用户openid

### 前端实现

1. **API调用方法**
   - 在`api.ts`中添加了微信绑定和微信登录的方法
   - 更新了API类型定义，添加了微信登录相关的接口类型

2. **应用启动自动登录**
   - 在`app.ts`的`onLaunch`方法中实现了静默登录逻辑
   - 通过`wx.login()`获取登录凭证code
   - 自动将code发送到后端进行身份验证
   - 登录成功后自动保存token和用户信息

## 使用方法

### 静默登录流程

1. 用户打开微信小程序
2. 系统自动调用`wx.login()`获取登录凭证code
3. 将code发送到后端换取用户openid
4. 后端查询openid是否已绑定系统账号
5. 如已绑定，自动完成登录并返回token
6. 如未绑定，保持未登录状态，用户可选择注册或登录系统账号

### 首次使用绑定流程

1. 用户使用用户名密码登录系统
2. 进入微信绑定页面
3. 点击"绑定微信账号"按钮
4. 系统会获取用户的微信openid并与当前登录的系统账号建立绑定关系
5. 绑定成功后，下次打开小程序将自动登录

## 注意事项

1. 实际项目中，需要在微信小程序管理后台配置合法域名
2. 微信登录使用了微信官方API获取openid，需要配置正确的AppID和AppSecret
3. 在后端代码中，AppID和AppSecret应通过环境变量配置，避免硬编码
4. 一个微信账号只能绑定一个系统账号，如需更换绑定，需要先解绑
5. 建议在生产环境中添加微信账号解绑功能
6. 静默登录可能会因为用户未授权或网络问题而失败，应提供手动登录作为备选方案

## 数据库变更

执行以下SQL脚本创建微信绑定表：

```sql
-- 创建微信用户绑定表
CREATE TABLE IF NOT EXISTS user_wechat_bindings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  openid VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY (openid)
);

-- 添加索引
CREATE INDEX idx_user_id ON user_wechat_bindings(user_id);
CREATE INDEX idx_openid ON user_wechat_bindings(openid);
```