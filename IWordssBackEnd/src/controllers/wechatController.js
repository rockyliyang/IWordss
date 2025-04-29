const { pool } = require('../config/db');
const { generateToken } = require('../utils/auth');

// 绑定微信用户ID与系统用户ID
exports.bindWechatUser = async (req, res) => {
  try {
    const userId = req.user.id; // 从认证中间件获取当前登录用户ID
    const { openid } = req.body; // 从请求体获取微信openid

    if (!openid) {
      return res.status(400).json({ success: false, message: '微信openid为必填项' });
    }

    // 检查openid是否已经绑定其他账号
    const [existingBindings] = await pool.execute(
      'SELECT user_id FROM user_wechat_bindings WHERE openid = ?',
      [openid]
    );

    if (existingBindings.length > 0 && existingBindings[0].user_id !== userId) {
      return res.status(400).json({
        success: false,
        message: '该微信账号已绑定其他用户'
      });
    }

    // 如果已经绑定了当前用户，则返回成功
    if (existingBindings.length > 0 && existingBindings[0].user_id === userId) {
      return res.json({
        success: true,
        message: '该微信账号已绑定当前用户',
        data: { userId, openid }
      });
    }

    // 创建绑定关系
    await pool.execute(
      'INSERT INTO user_wechat_bindings (user_id, openid) VALUES (?, ?)',
      [userId, openid]
    );

    res.status(201).json({
      success: true,
      message: '微信账号绑定成功',
      data: { userId, openid }
    });
  } catch (error) {
    console.error('微信账号绑定失败:', error);
    res.status(500).json({
      success: false,
      message: '微信账号绑定失败',
      error: error.message
    });
  }
};

// 微信登录
exports.wxLogin = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: '微信登录code为必填项'
      });
    }

    // 微信小程序appid和secret配置
    const appid = process.env.WECHAT_APPID || 'wxc735d0106f610d74'; // 从环境变量获取或使用默认值
    const secret = process.env.WECHAT_SECRET || ''; // 从环境变量获取
    
    // 调用微信API获取openid
    const wxApiUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
    
    // 发起HTTP请求获取openid
    const fetch = require('node-fetch');
    const response = await fetch(wxApiUrl);
    const wxResult = await response.json();
    
    if (wxResult.errcode) {
      return res.status(400).json({
        success: false,
        message: `获取微信openid失败: ${wxResult.errmsg}`,
        error: wxResult.errcode
      });
    }
    
    const openid = wxResult.openid; // 获取真实openid

    // 查询是否有绑定关系
    const [bindings] = await pool.execute(
      'SELECT user_id FROM user_wechat_bindings WHERE openid = ?',
      [openid]
    );

    if (bindings.length === 0) {
      return res.status(404).json({
        success: false,
        message: '该微信账号未绑定系统用户',
        data: { openid }
      });
    }

    const userId = bindings[0].user_id;

    // 获取用户信息
    const [users] = await pool.execute(
      'SELECT id, username, email FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const user = users[0];

    // 生成JWT令牌
    const token = generateToken({
      id: user.id,
      username: user.username
    });

    res.json({
      success: true,
      message: '微信登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('微信登录失败:', error);
    res.status(500).json({
      success: false,
      message: '微信登录失败',
      error: error.message
    });
  }
};