/**
 * 艾宾浩斯记忆曲线工具
 * 根据艾宾浩斯记忆曲线理论，记忆点安排在第1天、第2天、第4天、第7天、第15天、第30天
 */

/**
 * 计算复习日期
 * @param {Date} startDate - 开始学习的日期
 * @returns {Array} - 返回复习日期数组
 */
function calculateReviewDates(startDate) {
  // 艾宾浩斯记忆曲线间隔天数
  const intervals = [1, 2, 4, 7, 15, 30];
  const reviewDates = [];
  
  // 确保startDate是Date对象
  const start = new Date(startDate);
  
  // 计算每个复习日期
  intervals.forEach(interval => {
    const reviewDate = new Date(start);
    reviewDate.setDate(start.getDate() + interval);
    reviewDates.push(reviewDate);
  });
  
  return reviewDates;
}

/**
 * 生成每日任务单词列表
 * @param {Array} allWords - 所有单词数组
 * @param {number} wordsPerDay - 每天新学习的单词数量
 * @param {Date} startDate - 开始日期
 * @returns {Object} - 返回每日任务对象，键为日期字符串，值为当天需要学习的单词数组
 */
function generateDailyTasks(allWords, wordsPerDay, startDate) {
  const dailyTasks = {};
  const wordStatus = {}; // 记录每个单词的学习状态和复习日期
  
  // 确保startDate是Date对象
  const start = new Date(startDate);
  
  // 计算需要多少天才能学完所有单词
  const totalDays = Math.ceil(allWords.length / wordsPerDay);
  
  // 为每一天分配新单词
  for (let day = 0; day < totalDays; day++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + day);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // 当天的新单词
    const startIndex = day * wordsPerDay;
    const endIndex = Math.min(startIndex + wordsPerDay, allWords.length);
    const newWords = allWords.slice(startIndex, endIndex);
    
    // 初始化当天任务
    if (!dailyTasks[dateStr]) {
      dailyTasks[dateStr] = [];
    }
    
    // 添加新单词到当天任务
    dailyTasks[dateStr] = [...dailyTasks[dateStr], ...newWords];
    
    // 记录每个新单词的状态和复习日期
    newWords.forEach(word => {
      const reviewDates = calculateReviewDates(currentDate);
      wordStatus[word] = {
        status: 'not_started',
        reviewDates: reviewDates
      };
      
      // 将单词添加到每个复习日期的任务中
      reviewDates.forEach(reviewDate => {
        const reviewDateStr = reviewDate.toISOString().split('T')[0];
        if (!dailyTasks[reviewDateStr]) {
          dailyTasks[reviewDateStr] = [];
        }
        if (!dailyTasks[reviewDateStr].includes(word)) {
          dailyTasks[reviewDateStr].push(word);
        }
      });
    });
  }
  
  return {
    dailyTasks,
    wordStatus
  };
}

/**
 * 获取今天需要学习的单词
 * @param {Object} dailyTasks - 每日任务对象
 * @param {Date} date - 日期，默认为今天
 * @returns {Array} - 返回当天需要学习的单词数组
 */
function getTodayWords(dailyTasks, date = new Date()) {
  const dateStr = date.toISOString().split('T')[0];
  return dailyTasks[dateStr] || [];
}

/**
 * 更新单词记忆状态
 * @param {Object} wordStatus - 单词状态对象
 * @param {string} word - 单词
 * @param {string} status - 新状态 ('not_started', 'learning', 'remembered')
 * @returns {Object} - 返回更新后的单词状态对象
 */
function updateWordStatus(wordStatus, word, status) {
  if (wordStatus[word]) {
    wordStatus[word].status = status;
  }
  return wordStatus;
}

module.exports = {
  calculateReviewDates,
  generateDailyTasks,
  getTodayWords,
  updateWordStatus
};