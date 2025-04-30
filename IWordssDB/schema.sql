-- IWordss数据库设计

-- 创建数据库
CREATE DATABASE IF NOT EXISTS iwordss CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON iwordss.* TO 'WordssWebUser'@'localhost';

USE iwordss;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,  -- 存储加密后的密码
    phone VARCHAR(20),
    email VARCHAR(100),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 微信用户关联表
CREATE TABLE IF NOT EXISTS wechat_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  wechat_openid VARCHAR(100) NOT NULL,
  wechat_unionid VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY (wechat_openid)
);

-- 添加索引
CREATE INDEX idx_user_id ON wechat_users(user_id);
CREATE INDEX idx_openid ON wechat_users(wechat_openid);

-- 单词本表
CREATE TABLE IF NOT EXISTS wordbooks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    word_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 单词表 (每个单词本的所有单词用|分割存在一条记录里面)
CREATE TABLE IF NOT EXISTS wordbook_words (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wordbook_id INT NOT NULL,
    words TEXT NOT NULL,  -- 存储用|分隔的单词列表
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (wordbook_id) REFERENCES wordbooks(id) ON DELETE CASCADE
);

-- 记忆任务表
CREATE TABLE IF NOT EXISTS memory_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    wordbook_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    words_per_day INT NOT NULL DEFAULT 10,
    start_date DATE NOT NULL,
    status ENUM('active', 'paused', 'completed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (wordbook_id) REFERENCES wordbooks(id) ON DELETE CASCADE
);

-- 每日任务表
CREATE TABLE IF NOT EXISTS daily_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    memory_task_id INT NOT NULL,
    task_date DATE NOT NULL,
    words TEXT NOT NULL,  -- 存储用|分隔的单词列表
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (memory_task_id) REFERENCES memory_tasks(id) ON DELETE CASCADE,
    UNIQUE KEY (memory_task_id, task_date)
);

-- 单词记忆状态表
CREATE TABLE IF NOT EXISTS word_memory_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    memory_task_id INT NOT NULL,
    word VARCHAR(255) NOT NULL,
    status ENUM('not_started', 'learning', 'remembered') DEFAULT 'not_started',
    review_count INT DEFAULT 0,
    next_review_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (memory_task_id) REFERENCES memory_tasks(id) ON DELETE CASCADE,
    UNIQUE KEY (user_id, memory_task_id, word)
);