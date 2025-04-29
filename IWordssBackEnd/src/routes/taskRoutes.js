const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { 
  createTask, 
  getTasks, 
  getTaskById 
} = require('../controllers/taskController');

// 记忆任务路由
// 获取任务列表
router.get('/', authenticate, getTasks);

// 创建新任务
router.post('/', authenticate, createTask);

// 获取任务详情
router.get('/:id', authenticate, getTaskById);

module.exports = router;