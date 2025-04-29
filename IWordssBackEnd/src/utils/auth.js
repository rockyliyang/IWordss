const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * 密码加密
 * @param {string} password - 原始密码
 * @returns {string} - 加密后的密码
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * 密码验证
 * @param {string} password - 原始密码
 * @param {string} hashedPassword - 加密后的密码
 * @returns {boolean} - 验证结果
 */
const verifyPassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * 生成JWT令牌
 * @param {object} payload - 令牌载荷
 * @returns {string} - JWT令牌
 */
const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'default_secret_key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * 验证JWT令牌
 * @param {string} token - JWT令牌
 * @returns {object|null} - 解码后的载荷或null
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key');
  } catch (error) {
    return null;
  }
};

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken
};