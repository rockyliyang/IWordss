const express = require('express');
const router = express.Router();
const { wxLogin } = require('../controllers/wechatController');

// 微信登录
router.post('/login', wxLogin);

module.exports = router;