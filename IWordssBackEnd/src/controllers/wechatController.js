const { pool } = require('../config/db');
const { generateToken, hashPassword } = require('../utils/auth');

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
      'SELECT user_id FROM wechat_users WHERE openid = ?',
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
      'INSERT INTO wechat_users (user_id, wechat_openid) VALUES (?, ?)',
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

/**
 * 创建或获取微信用户
 * @param {string} openid - 微信openid
 * @param {string} nickname - 微信用户昵称
 * @param {string} avatarUrl - 微信用户头像URL
 * @returns {Promise<number>} - 返回用户ID
 */
const createUserFromWechat = async (openid, nickname, avatarUrl) => {
  // 查询是否有绑定关系
  const [bindings] = await pool.execute(
    'SELECT user_id FROM wechat_users WHERE wechat_openid = ?',
    [openid]
  );

  // 如果已有绑定关系，直接返回用户ID
  if (bindings.length > 0) {
    return bindings[0].user_id;
  }
  
  // 没有绑定关系，创建新用户
  // 使用微信昵称作为用户名，如果没有则使用默认格式
  const username = nickname ? nickname : `wx_${openid.substring(0, 8)}_${Math.floor(Math.random() * 1000)}`;
  // 生成随机密码
  const randomPassword = Math.random().toString(36).slice(-10);
  // 加密密码
  const hashedPassword = await hashPassword(randomPassword);
  
  // 创建新用户，包含头像URL
  const [userResult] = await pool.execute(
    'INSERT INTO users (username, password, email, avatar_url) VALUES (?, ?, ?, ?)',
    [username, hashedPassword, '', avatarUrl || '']
  );
  
  const userId = userResult.insertId;
  
  // 创建绑定关系
  await pool.execute(
    'INSERT INTO wechat_users (user_id, wechat_openid) VALUES (?, ?)',
    [userId, openid]
  );
  
  console.log(`自动创建新用户成功: ${username}, userId: ${userId}`);
  return userId;
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
    const secret = process.env.WECHAT_SECRET || '81ae78c06a529e80b9ae2c796caba86b'; // 从环境变量获取
    
    // 调用微信API获取openid
    const wxApiUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
    
    // 发起HTTP请求获取openid
    // Using dynamic import for node-fetch (ES Module)
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
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
    
    // 获取微信用户信息（昵称和头像）
    let nickname = req.body.nickname || null;
    let avatarUrl = req.body.avatarUrl || null;
    
    // 创建或获取用户
    const userId = await createUserFromWechat(openid, nickname, avatarUrl);

    // 获取用户信息
    const [users] = await pool.execute(
      'SELECT id, username, email, avatar_url FROM users WHERE id = ?',
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
          email: user.email,
          avatarUrl: user.avatar_url
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