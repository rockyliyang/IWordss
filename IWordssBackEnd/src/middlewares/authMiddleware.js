const { verifyToken } = require('../utils/auth');

/**
 * 验证用户是否已登录的中间件
 */
const authenticate = (req, res, next) => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供授权令牌'
      });
    }

    // 提取token
    const token = authHeader.split(' ')[1];
    
    // 验证token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: '无效或过期的令牌'
      });
    }

    // 将用户信息添加到请求对象
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '授权失败',
      error: error.message
    });
  }
};

/**
 * 验证微信小程序用户的中间件
 */
const authenticateWechat = async (req, res, next) => {
  try {
    // 从请求头获取微信code或token
    const wxCode = req.headers['x-wx-code'];
    const wxToken = req.headers['x-wx-token'];

    if (!wxCode && !wxToken) {
      return res.status(401).json({
        success: false,
        message: '未提供微信授权信息'
      });
    }

    // 如果有token，验证token
    if (wxToken) {
      const decoded = verifyToken(wxToken);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: '无效或过期的微信令牌'
        });
      }
      req.user = decoded;
      return next();
    }

    // 如果有code，需要通过微信API获取openid
    // 这部分逻辑将在authController中实现
    req.wxCode = wxCode;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '微信授权失败',
      error: error.message
    });
  }
};

module.exports = {
  authenticate,
  authenticateWechat
};