const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { getUserInfo, updateUserInfo } = require('../controllers/userController');
const { bindWechatUser } = require('../controllers/wechatController');

// 获取当前用户信息
router.get('/me', authenticate, getUserInfo);

// 更新当前用户信息
router.put('/me', authenticate, updateUserInfo);

// 绑定微信用户ID
router.post('/bind-wechat', authenticate, bindWechatUser);

module.exports = router;