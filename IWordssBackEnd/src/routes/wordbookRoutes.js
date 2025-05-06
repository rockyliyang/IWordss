const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { 
  getWordbooks, 
  createWordbook, 
  createWordbookFromFile, 
  getWordbookById, 
  updateWordbook,
  deleteWordbook 
} = require('../controllers/wordbookController');
const multer = require('multer');
const path = require('path');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// 单词本路由
// 获取单词本列表
router.get('/', authenticate, getWordbooks);

// 创建新单词本
router.post('/', authenticate, createWordbook);

// 通过文件上传创建单词本
router.post('/upload', authenticate, upload.single('file'), createWordbookFromFile);

// 获取单词本详情
router.get('/:id', authenticate, getWordbookById);

// 更新单词本
router.put('/:id', authenticate, updateWordbook);

// 删除单词本
router.delete('/:id', authenticate, deleteWordbook);

module.exports = router;