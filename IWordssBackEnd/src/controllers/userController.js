const { pool } = require('../config/db');

// 获取用户信息
exports.getUserInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const [users] = await pool.execute('SELECT id, username, email FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    res.json({ success: true, data: users[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取用户信息失败', error: error.message });
  }
};

// 更新用户信息
exports.updateUserInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email } = req.body;
    await pool.execute('UPDATE users SET username = ?, email = ? WHERE id = ?', [username, email, userId]);
    res.json({ success: true, message: '用户信息更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新用户信息失败', error: error.message });
  }
};