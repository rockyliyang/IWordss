const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

/**
 * 获取单词本列表
 */
const getWordbooks = async (req, res) => {
  try {
    const userId = req.user.id;

    // 获取用户的单词本列表
    const [wordbooks] = await pool.execute(
      'SELECT id, name, description, word_count, created_at, updated_at FROM wordbooks WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );

    res.json({
      success: true,
      data: wordbooks
    });
  } catch (error) {
    console.error('获取单词本列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取单词本列表失败',
      error: error.message
    });
  }
};

/**
 * 创建新单词本
 */
const createWordbook = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, words } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '单词本名称为必填项'
      });
    }

    // 创建单词本
    const [result] = await pool.execute(
      'INSERT INTO wordbooks (user_id, name, description, word_count) VALUES (?, ?, ?, ?)',
      [userId, name, description || '', words ? words.split('|').length : 0]
    );

    const wordbookId = result.insertId;

    // 如果提供了单词，添加到单词本
    if (words && words.trim()) {
      await pool.execute(
        'INSERT INTO wordbook_words (wordbook_id, words) VALUES (?, ?)',
        [wordbookId, words.trim()]
      );
    }

    res.status(201).json({
      success: true,
      message: '单词本创建成功',
      data: {
        id: wordbookId,
        name,
        description,
        word_count: words ? words.split('|').length : 0,
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('创建单词本失败:', error);
    res.status(500).json({
      success: false,
      message: '创建单词本失败',
      error: error.message
    });
  }
};

/**
 * 通过文件上传创建单词本
 */
const createWordbookFromFile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description } = req.body;
    const file = req.file;

    if (!name || !file) {
      return res.status(400).json({
        success: false,
        message: '单词本名称和文件为必填项'
      });
    }

    // 读取文件内容
    const fileContent = fs.readFileSync(file.path, 'utf8');
    const words = fileContent.replace(/\r\n|\r|\n/g, '|').trim();

    // 创建单词本
    const [result] = await pool.execute(
      'INSERT INTO wordbooks (user_id, name, description, word_count) VALUES (?, ?, ?, ?)',
      [userId, name, description || '', words.split('|').length]
    );

    const wordbookId = result.insertId;

    // 添加单词到单词本
    await pool.execute(
      'INSERT INTO wordbook_words (wordbook_id, words) VALUES (?, ?)',
      [wordbookId, words]
    );

    // 删除临时文件
    fs.unlinkSync(file.path);

    res.status(201).json({
      success: true,
      message: '单词本创建成功',
      data: {
        id: wordbookId,
        name,
        description,
        word_count: words.split('|').length,
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('通过文件创建单词本失败:', error);
    res.status(500).json({
      success: false,
      message: '通过文件创建单词本失败',
      error: error.message
    });
  }
};

/**
 * 获取单词本详情
 */
const getWordbookById = async (req, res) => {
  try {
    const userId = req.user.id;
    const wordbookId = req.params.id;

    // 获取单词本信息
    const [wordbooks] = await pool.execute(
      'SELECT id, name, description, word_count, created_at, updated_at FROM wordbooks WHERE id = ? AND user_id = ?',
      [wordbookId, userId]
    );

    if (wordbooks.length === 0) {
      return res.status(404).json({
        success: false,
        message: '单词本不存在或无权访问'
      });
    }

    // 获取单词本中的单词
    const [wordEntries] = await pool.execute(
      'SELECT words FROM wordbook_words WHERE wordbook_id = ?',
      [wordbookId]
    );

    const wordbook = wordbooks[0];
    wordbook.words = wordEntries.length > 0 ? wordEntries[0].words.split('|') : [];

    res.json({
      success: true,
      data: wordbook
    });
  } catch (error) {
    console.error('获取单词本详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取单词本详情失败',
      error: error.message
    });
  }
};

/**
 * 更新单词本
 */
const updateWordbook = async (req, res) => {
  try {
    const userId = req.user.id;
    const wordbookId = req.params.id;
    const { name, description, words } = req.body;

    // 检查单词本是否存在且属于当前用户
    const [wordbooks] = await pool.execute(
      'SELECT id FROM wordbooks WHERE id = ? AND user_id = ?',
      [wordbookId, userId]
    );

    if (wordbooks.length === 0) {
      return res.status(404).json({
        success: false,
        message: '单词本不存在或无权访问'
      });
    }

    // 更新单词本信息
    const updateFields = [];
    const updateValues = [];

    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }

    if (words !== undefined) {
      updateFields.push('word_count = ?');
      updateValues.push(words ? words.split('|').length : 0);
    }

    if (updateFields.length > 0) {
      updateValues.push(wordbookId);
      await pool.execute(
        `UPDATE wordbooks SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
        updateValues
      );
    }

    // 如果提供了新的单词列表，更新单词
    if (words !== undefined) {
      // 先删除旧的单词
      await pool.execute('DELETE FROM wordbook_words WHERE wordbook_id = ?', [wordbookId]);

      // 添加新的单词
      if (words && words.trim()) {
        await pool.execute(
          'INSERT INTO wordbook_words (wordbook_id, words) VALUES (?, ?)',
          [wordbookId, words.trim()]
        );
      }
    }

    res.json({
      success: true,
      message: '单词本更新成功'
    });
  } catch (error) {
    console.error('更新单词本失败:', error);
    res.status(500).json({
      success: false,
      message: '更新单词本失败',
      error: error.message
    });
  }
};

/**
 * 删除单词本
 */
const deleteWordbook = async (req, res) => {
  try {
    const userId = req.user.id;
    const wordbookId = req.params.id;

    // 检查单词本是否存在且属于当前用户
    const [wordbooks] = await pool.execute(
      'SELECT id FROM wordbooks WHERE id = ? AND user_id = ?',
      [wordbookId, userId]
    );

    if (wordbooks.length === 0) {
      return res.status(404).json({
        success: false,
        message: '单词本不存在或无权访问'
      });
    }

    // 删除单词本及相关数据
    await pool.execute('DELETE FROM wordbook_words WHERE wordbook_id = ?', [wordbookId]);
    await pool.execute('DELETE FROM wordbooks WHERE id = ?', [wordbookId]);

    res.json({
      success: true,
      message: '单词本删除成功'
    });
  } catch (error) {
    console.error('删除单词本失败:', error);
    res.status(500).json({
      success: false,
      message: '删除单词本失败',
      error: error.message
    });
  }
};

module.exports = {
  getWordbooks,
  createWordbook,
  createWordbookFromFile,
  getWordbookById,
  updateWordbook,
  deleteWordbook
};