// pages/task/task.ts
import { taskAPI } from '../../utils/api';
import { Task, TaskStatistics } from '../../utils/api.types';

Component({
  data: {
    loading: true,
    todayTasks: [] as Task[],
    taskStats: null as TaskStatistics | null,
    expandedSections: {
      stats: true
    } as Record<string, boolean>,
    statusText: {
      'pending': '待完成',
      'in_progress': '进行中',
      'completed': '已完成'
    }
  },

  lifetimes: {
    attached() {
      this.loadTodayTasks();
      this.loadTaskStats();
    }
  },

  pageLifetimes: {
    show() {
      // 每次页面显示时重新加载数据
      this.loadTodayTasks();
      this.loadTaskStats();
    }
  },

  methods: {
    // 加载今日任务
    async loadTodayTasks() {
      this.setData({ loading: true });
      try {
        // 调用API获取今日任务
        const res = await taskAPI.getTodayTasks();
        
        if (res.success) {
          this.setData({
            todayTasks: res.data,
            loading: false
          });
        } else {
          throw new Error(res.message || '获取任务失败');
        }
      } catch (error: any) {
        console.error('加载今日任务失败:', error);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
        this.setData({ loading: false });
      }
    },
    
    // 跳转到创建任务页面
    navigateToCreateTask() {
      wx.navigateTo({
        url: '/pages/createTask/createTask'
      });
    },
    
    // 跳转到任务详情页面
    navigateToTaskDetail(e: WechatMiniprogram.TouchEvent) {
      const { taskId } = e.currentTarget.dataset;
      wx.navigateTo({
        url: `/pages/taskDetail/taskDetail?id=${taskId}`
      });
    },

    // 加载任务统计
    async loadTaskStats() {
      try {
        // 调用API获取任务统计
        const res = await taskAPI.getTaskStats();
        
        if (res.success) {
          this.setData({
            taskStats: res.data
          });
        } else {
          throw new Error(res.message || '获取统计失败');
        }
      } catch (error: any) {
        console.error('加载任务统计失败:', error);
        wx.showToast({
          title: '统计加载失败',
          icon: 'none'
        });
      }
    },

    // 切换展开/折叠状态
    toggleSection(e: WechatMiniprogram.TouchEvent) {
      const { section, taskIndex } = e.currentTarget.dataset;
      const key = taskIndex !== undefined ? `${section}_${taskIndex}` : section;
      
      this.setData({
        [`expandedSections.${key}`]: !this.data.expandedSections[key]
      });
    },

    // 获取任务中的总单词数
    getTotalWords(words: {[key: string]: string[]} | undefined) {
      if (!words) return 0;
      return words.not_started.length + words.learning.length + words.remembered.length;
    },

    // 更新单词状态
    async updateWordStatus(e: WechatMiniprogram.TouchEvent) {
      const { taskId, word, status } = e.currentTarget.dataset;
      
      wx.showLoading({ title: '更新中...' });

      try {
        // 调用API更新单词状态
        const res = await taskAPI.updateWordStatus({ taskId, word, status });
        
        wx.hideLoading();
        
        if (res.success) {
          wx.showToast({
            title: '状态已更新',
            icon: 'success'
          });

          // 更新本地数据
          const todayTasks = [...this.data.todayTasks];
          const taskIndex = todayTasks.findIndex(task => task.memory_task_id === taskId);
          
          if (taskIndex !== -1) {
            const task = todayTasks[taskIndex];
            // 添加空值检查，确保task.words存在
            const oldStatus = task.words ? Object.keys(task.words).find(key => 
              task.words?.[key]?.includes(word)
            ) : undefined;
            
            if (oldStatus && oldStatus !== status && task.words) {
              // 从旧状态中移除
              task.words[oldStatus] = task.words[oldStatus]?.filter(w => w !== word) || [];
              // 添加到新状态
              task.words[status] = task.words[status] || [];
              task.words[status].push(word);
              
              this.setData({ todayTasks });
            }
          }
        } else {
          throw new Error(res.message || '更新失败');
        }
      } catch (error) {
        wx.hideLoading();
        console.error('更新单词状态失败:', error);
        wx.showToast({
          title: '更新失败',
          icon: 'none'
        });
      }
    },

    // 完成每日任务
    async completeDailyTask(e: WechatMiniprogram.TouchEvent) {
      const { dailyTaskId, status } = e.currentTarget.dataset;
      
      wx.showLoading({ title: '更新中...' });

      try {
        // 调用API更新每日任务状态
        const res = await taskAPI.updateDailyTaskStatus({ dailyTaskId, status });
        
        wx.hideLoading();
        
        if (res.success) {
          wx.showToast({
            title: status === 'completed' ? '任务已完成' : '任务已重启',
            icon: 'success'
          });

          // 更新本地数据
          const todayTasks = [...this.data.todayTasks];
          const taskIndex = todayTasks.findIndex(task => task.id === dailyTaskId);
          
          if (taskIndex !== -1) {
            todayTasks[taskIndex].status = status;
            this.setData({ todayTasks });
          }
        } else {
          throw new Error(res.message || '更新失败');
        }
      } catch (error) {
        wx.hideLoading();
        console.error('更新任务状态失败:', error);
        wx.showToast({
          title: '更新失败',
          icon: 'none'
        });
      }
    },

    // 导航到创建任务页面（已删除重复方法）
  }
});