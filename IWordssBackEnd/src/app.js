require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 导入路由
const userRoutes = require('./routes/userRoutes');
const wordbookRoutes = require('./routes/wordbookRoutes');
const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');
const wechatRoutes = require('./routes/wechatRoutes');

// 使用路由
app.use('/api/users', userRoutes);
app.use('/api/wordbooks', wordbookRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/wechat', wechatRoutes);

// 根路由
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to IWordss API' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;