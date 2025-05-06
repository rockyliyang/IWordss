// pages/createTask/createTask.ts
import { wordbookAPI, taskAPI } from '../../utils/api';
import { Wordbook } from '../../utils/api.types';

Component({
  data: {
    loading: false,
    wordbooks: [] as Wordbook[],
    selectedWordbookIndex: -1,
    formData: {
      name: '',
      wordbookId: null as number | null,
      wordsPerDay: 20
    }
  },

  properties: {
    wordbookId: {
      type: String,
      value: ''
    },
    wordbookName: {
      type: String,
      value: ''
    }
  },

  lifetimes: {
    attached() {
      console.log('组件attached');
      // 在attached生命周期就开始加载数据
      this.loadWordbooks();
    },
    ready() {
      console.log('组件ready');
      
      // 获取页面参数
      //const pages = getCurrentPages();
      const currentPage = getCurrentPages().pop(); //pages[pages.length - 1];
      const options = currentPage?.options;
      
      if (options?.wordbookId && options?.wordbookName) {
        this.setData({
          'formData.wordbookId': Number(options.wordbookId),
          'formData.name': `${options.wordbookName}的学习任务`
        });
      }
      
      // 确保数据已加载
      if (this.data.wordbooks.length === 0) {
        console.log('在ready中重新加载单词本');
        this.loadWordbooks();
      }
    }
  },

  methods: {
    // 加载单词本列表
    async loadWordbooks() {
      this.setData({ loading: true });
      try {
        const res = await wordbookAPI.getWordbooks();
        
        if (res.success) {
          console.log('获取单词本成功:', res.data);
          this.setData({
            wordbooks: res.data,
            loading: false
          });
          // 打印设置后的数据，确认数据已正确设置
          console.log('设置后的单词本数据:', this.data.wordbooks);
        } else {
          throw new Error(res.message || '获取单词本失败');
        }
      } catch (error) {
        console.error('加载单词本列表失败:', error);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
        this.setData({ loading: false });
      }
    },

    // 选择单词本
    onWordbookChange(e: WechatMiniprogram.PickerChange) {
      const index = parseInt(e.detail.value as string);
      console.log('选择的单词本索引:', index);
      
      // 确保wordbooks数组存在且有数据
      if (this.data.wordbooks && this.data.wordbooks.length > 0 && index >= 0) {
        const wordbookId = this.data.wordbooks[index].id;
        console.log('选择的单词本ID:', wordbookId);
        
        this.setData({
          selectedWordbookIndex: index,
          'formData.wordbookId': wordbookId
        });
        
        // 打印设置后的状态
        console.log('设置后的状态:', {
          selectedWordbookIndex: this.data.selectedWordbookIndex,
          wordbookId: this.data.formData.wordbookId
        });
      } else {
        console.error('单词本数据不存在或索引无效');
      }
    },

    // 输入任务名称
    onInput(e: WechatMiniprogram.Input) {
      const { field } = e.currentTarget.dataset;
      this.setData({
        [`formData.${field}`]: e.detail.value
      });
    },

    // 调整每日单词数量
    onSliderChange(e: WechatMiniprogram.SliderChange) {
      this.setData({
        'formData.wordsPerDay': e.detail.value
      });
    },

    // 创建任务
    async createTask() {
      const { wordbookId, name, wordsPerDay } = this.data.formData;
      
      if (!wordbookId) {
        wx.showToast({
          title: '请选择单词本',
          icon: 'none'
        });
        return;
      }

      this.setData({ loading: true });
      
      try {
        const res = await taskAPI.createTask({
          wordbookId: wordbookId as number,
          name,
          wordsPerDay
        });
        
        if (res.success) {
          wx.showToast({
            title: '创建成功',
            icon: 'success'
          });
          
          // 延迟返回，让用户看到成功提示
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          throw new Error(res.message || '创建任务失败');
        }
      } catch (error: any) {
        console.error('创建任务失败:', error);
        wx.showToast({
          title: error.message || '创建失败',
          icon: 'none'
        });
        this.setData({ loading: false });
      }
    }
  }
});