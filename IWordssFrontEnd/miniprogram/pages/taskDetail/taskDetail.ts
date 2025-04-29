// pages/taskDetail/taskDetail.ts
import { taskAPI } from '../../utils/api';
import { TaskDetail } from '../../utils/api.types';

Component({
  data: {
    loading: true,
    task: null as TaskDetail | null,
    totalWords: 0,
    statusText: {
      'active': '进行中',
      'paused': '已暂停',
      'completed': '已完成'
    }
  },

  properties: {
    taskId: {
      type: Number,
      value: undefined
    }
  },

  observers: {
    'taskId': function(taskId: number | null) {
      if (taskId !== null) {
        this.loadTaskDetail(taskId);
      }
    }
  },

  lifetimes: {
    attached() {
      // 从页面参数获取任务ID
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const taskId = currentPage.options.id;
      
      if (taskId) {
        this.setData({ taskId: parseInt(taskId) });
      }
    }
  },

  pageLifetimes: {
    show() {
      // 每次页面显示时重新加载数据
      if (this.data.taskId !== null) {
        this.loadTaskDetail(this.data.taskId);
      }
    }
  },

  methods: {
    // 加载任务详情
    async loadTaskDetail(taskId: number) {
      this.setData({ loading: true });
      try {
        const res = await taskAPI.getTaskDetail(taskId);
        
        if (res.success && res.data) {
          const task = res.data;
          // 添加更完善的空值检查，确保即使stats或其子属性为undefined时也能正确计算
          const notStarted = task.stats?.not_started ?? 0;
          const learning = task.stats?.learning ?? 0;
          const remembered = task.stats?.remembered ?? 0;
          const totalWords = notStarted + learning + remembered;
          
          this.setData({
            task,
            totalWords,
            loading: false
          });
        } else {
          throw new Error(res.message || '获取任务详情失败');
        }
      } catch (error: any) {
        console.error('加载任务详情失败:', error);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
        this.setData({ loading: false });
      }
    },

    // 切换任务状态（暂停/恢复）
    async toggleTaskStatus() {
      const { task } = this.data;
      if (!task) return;
      
      const newStatus = task.status === 'active' ? 'paused' : 'active';
      
      try {
        const res = await taskAPI.updateTaskStatus(task.id, newStatus);
        
        if (res.success) {
          wx.showToast({
            title: newStatus === 'active' ? '已恢复任务' : '已暂停任务',
            icon: 'success'
          });
          
          // 更新本地状态
          this.setData({
            'task.status': newStatus
          });
        } else {
          throw new Error(res.message || '更新任务状态失败');
        }
      } catch (error: any) {
        console.error('更新任务状态失败:', error);
        wx.showToast({
          title: error.message || '操作失败',
          icon: 'none'
        });
      }
    },

    // 跳转到今日任务
    navigateToTodayTask() {
      wx.switchTab({
        url: '/pages/task/task'
      });
    }
  }
});