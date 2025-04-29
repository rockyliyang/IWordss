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