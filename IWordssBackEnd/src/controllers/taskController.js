const { pool } = require('../config/db');
const { generateDailyTasks, getTodayWords, updateWordStatus } = require('../utils/ebbinghaus');

/**
 * 创建记忆任务
 */
const createTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { wordbookId, name, wordsPerDay } = req.body;

    if (!wordbookId || !wordsPerDay) {
      return res.status(400).json({
        success: false,
        message: '单词本ID和每日单词数量为必填项'
      });
    }

    // 检查单词本是否存在且属于当前用户
    const [wordbooks] = await pool.execute(
      'SELECT id, name FROM wordbooks WHERE id = ? AND user_id = ?',
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

    if (wordEntries.length === 0 || !wordEntries[0].words) {
      return res.status(400).json({
        success: false,
        message: '单词本中没有单词'
      });
    }

    const allWords = wordEntries[0].words.split('|');
    const taskName = name || `${wordbooks[0].name}的记忆任务`;
    const startDate = new Date();

    // 创建记忆任务
    const [taskResult] = await pool.execute(
      'INSERT INTO memory_tasks (user_id, wordbook_id, name, words_per_day, start_date) VALUES (?, ?, ?, ?, ?)',
      [userId, wordbookId, taskName, wordsPerDay, startDate.toISOString().split('T')[0]]
    );

    const taskId = taskResult.insertId;

    // 生成每日任务
    const { dailyTasks, wordStatus } = generateDailyTasks(allWords, wordsPerDay, startDate);

    // 保存每日任务到数据库
    const dailyTaskPromises = Object.entries(dailyTasks).map(async ([dateStr, words]) => {
      return pool.execute(
        'INSERT INTO daily_tasks (memory_task_id, task_date, words) VALUES (?, ?, ?)',
        [taskId, dateStr, words.join('|')]
      );
    });

    // 保存单词记忆状态到数据库
    const wordStatusPromises = Object.entries(wordStatus).map(async ([word, status]) => {
      return pool.execute(
        'INSERT INTO word_memory_status (user_id, memory_task_id, word, status, next_review_date) VALUES (?, ?, ?, ?, ?)',
        [
          userId,
          taskId,
          word,
          status.status,
          status.reviewDates[0].toISOString().split('T')[0]
        ]
      );
    });

    await Promise.all([...dailyTaskPromises, ...wordStatusPromises]);

    res.status(201).json({
      success: true,
      message: '记忆任务创建成功',
      data: {
        id: taskId,
        name: taskName,
        wordbook_id: wordbookId,
        words_per_day: wordsPerDay,
        start_date: startDate.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('创建记忆任务失败:', error);
    res.status(500).json({
      success: false,
      message: '创建记忆任务失败',
      error: error.message
    });
  }
};

/**
 * 获取用户的记忆任务列表
 */
const getTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    // 获取用户的记忆任务列表
    const [tasks] = await pool.execute(
      `SELECT mt.id, mt.name, mt.wordbook_id, wb.name as wordbook_name, 
              mt.words_per_day, mt.start_date, mt.status, mt.created_at 
       FROM memory_tasks mt 
       JOIN wordbooks wb ON mt.wordbook_id = wb.id 
       WHERE mt.user_id = ? 
       ORDER BY mt.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('获取记忆任务列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取记忆任务列表失败',
      error: error.message
    });
  }
};

/**
 * 获取记忆任务详情
 */
const getTaskById = async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;

    // 获取记忆任务信息
    const [tasks] = await pool.execute(
      `SELECT mt.id, mt.name, mt.wordbook_id, wb.name as wordbook_name, 
              mt.words_per_day, mt.start_date, mt.status, mt.created_at 
       FROM memory_tasks mt 
       JOIN wordbooks wb ON mt.wordbook_id = wb.id 
       WHERE mt.id = ? AND mt.user_id = ?`,
      [taskId, userId]
    );

    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: '记忆任务不存在或无权访问'
      });
    }

    const task = tasks[0];

    // 获取任务的单词记忆状态统计
    const [statusStats] = await pool.execute(
      `SELECT status, COUNT(*) as count 
       FROM word_memory_status 
       WHERE memory_task_id = ? 
       GROUP BY status`,
      [taskId]
    );

    // 格式化统计结果
    const stats = {
      not_started: 0,
      learning: 0,
      remembered: 0
    };

    statusStats.forEach(stat => {
      stats[stat.status] = stat.count;
    });

    task.stats = stats;

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('获取记忆任务详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取记忆任务详情失败',
      error: error.message
    });
  }
};

/**
 * 获取今日任务
 */
const getTodayTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // 获取今日任务
    const [dailyTasks] = await pool.execute(
      `SELECT dt.id, dt.memory_task_id, mt.name as task_name, dt.words, dt.status 
       FROM daily_tasks dt 
       JOIN memory_tasks mt ON dt.memory_task_id = mt.id 
       WHERE mt.user_id = ? AND dt.task_date = ?`,
      [userId, today]
    );

    // 处理每个任务的单词
    const processedTasks = await Promise.all(dailyTasks.map(async task => {
      const words = task.words.split('|');
      
      // 获取每个单词的记忆状态
      const [wordStatuses] = await pool.execute(
        `SELECT word, status 
         FROM word_memory_status 
         WHERE user_id = ? AND memory_task_id = ? AND word IN (${words.map(() => '?').join(',')})`,
        [userId, task.memory_task_id, ...words]
      );

      // 将单词按状态分组
      const groupedWords = {
        not_started: [],
        learning: [],
        remembered: []
      };

      // 创建单词状态映射
      const wordStatusMap = {};
      wordStatuses.forEach(status => {
        wordStatusMap[status.word] = status.status;
      });

      // 分组单词
      words.forEach(word => {
        const status = wordStatusMap[word] || 'not_started';
        groupedWords[status].push(word);
      });

      return {
        id: task.id,
        memory_task_id: task.memory_task_id,
        task_name: task.task_name,
        status: task.status,
        words: groupedWords
      };
    }));

    res.json({
      success: true,
      data: processedTasks
    });
  } catch (error) {
    console.error('获取今日任务失败:', error);
    res.status(500).json({
      success: false,
      message: '获取今日任务失败',
      error: error.message
    });
  }
};

/**
 * 更新单词记忆状态
 */
const updateWordMemoryStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId, word, status } = req.body;

    if (!taskId || !word || !status) {
      return res.status(400).json({
        success: false,
        message: '任务ID、单词和状态为必填项'
      });
    }

    // 检查任务是否存在且属于当前用户
    const [tasks] = await pool.execute(
      'SELECT id FROM memory_tasks WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );

    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: '记忆任务不存在或无权访问'
      });
    }

    // 检查单词状态是否存在
    const [wordStatuses] = await pool.execute(
      'SELECT id, status FROM word_memory_status WHERE user_id = ? AND memory_task_id = ? AND word = ?',
      [userId, taskId, word]
    );

    if (wordStatuses.length === 0) {
      return res.status(404).json({
        success: false,
        message: '单词记忆状态不存在'
      });
    }

    // 更新单词状态
    await pool.execute(
      'UPDATE word_memory_status SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, wordStatuses[0].id]
    );

    // 如果单词状态从未背诵变为正在背诵或已背熟，更新复习次数
    if (wordStatuses[0].status === 'not_started' && (status === 'learning' || status === 'remembered')) {
      await pool.execute(
        'UPDATE word_memory_status SET review_count = review_count + 1 WHERE id = ?',
        [wordStatuses[0].id]
      );
    }

    res.json({
      success: true,
      message: '单词记忆状态更新成功'
    });
  } catch (error) {
    console.error('更新单词记忆状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新单词记忆状态失败',
      error: error.message
    });
  }
};

/**
 * 更新每日任务状态
 */
const updateDailyTaskStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dailyTaskId, status } = req.body;

    if (!dailyTaskId || !status) {
      return res.status(400).json({
        success: false,
        message: '每日任务ID和状态为必填项'
      });
    }

    // 检查每日任务是否存在且属于当前用户
    const [dailyTasks] = await pool.execute(
      `SELECT dt.id 
       FROM daily_tasks dt 
       JOIN memory_tasks mt ON dt.memory_task_id = mt.id 
       WHERE dt.id = ? AND mt.user_id = ?`,
      [dailyTaskId, userId]
    );

    if (dailyTasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: '每日任务不存在或无权访问'
      });
    }

    // 更新每日任务状态
    await pool.execute(
      'UPDATE daily_tasks SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, dailyTaskId]
    );

    res.json({
      success: true,
      message: '每日任务状态更新成功'
    });
  } catch (error) {
    console.error('更新每日任务状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新每日任务状态失败',
      error: error.message
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  getTodayTask,
  updateWordMemoryStatus,
  updateDailyTaskStatus
};