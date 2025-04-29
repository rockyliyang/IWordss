// pages/wordbook/wordbook.ts
import { wordbookAPI } from '../../utils/api';
import { Wordbook } from '../../utils/api.types';

// 定义错误类型
interface ErrorWithMessage {
  message?: string;
}

// 定义事件类型
interface DatasetEvent {
  currentTarget: {
    dataset: Record<string, any>;
  };
  detail: {
    value: any;
  };
}

Component({
  data: {
    loading: true,
    wordbooks: [] as Wordbook[],
    showModal: false,
    isEdit: false,
    editId: null as number | null,
    fileName: '',
    fileContent: '',
    formData: {
      name: '',
      description: '',
      words: ''
    },
    expandedSections: {}
  },

  lifetimes: {
    attached() {
      this.loadWordbooks();
    }
  },

  pageLifetimes: {
    show() {
      // 每次页面显示时重新加载数据
      this.loadWordbooks();
    }
  },

  methods: {
    // 加载单词本列表
    async loadWordbooks() {
      this.setData({ loading: true });
      try {
        // 调用API获取单词本列表
        const res = await wordbookAPI.getWordbooks();
        
        if (res.success) {
          this.setData({
            wordbooks: res.data,
            loading: false
          });
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

    // 显示创建单词本弹窗
    showCreateModal() {
      this.setData({
        showModal: true,
        isEdit: false,
        editId: null,
        formData: {
          name: '',
          description: '',
          words: ''
        },
        fileName: '',
        fileContent: ''
      });
    },

    // 显示编辑单词本弹窗
    async showEditModal(e: DatasetEvent) {
      const { id, name, description } = e.currentTarget.dataset;
      this.setData({
        showModal: true,
        isEdit: true,
        editId: id,
        formData: {
          name,
          description,
          words: ''
        },
        fileName: '',
        fileContent: ''
      });

      // 从API获取单词本详情
      try {
        const res = await wordbookAPI.getWordbookDetail(id);
        if (res.success && res.data) {
          this.setData({
            formData: {
              name: res.data.name,
              description: res.data.description || '',
              words: res.data.words || ''
            }
          });
        }
      } catch (error) {
        console.error('获取单词本详情失败:', error);
      }
    },

    // 关闭弹窗
    closeModal() {
      this.setData({
        showModal: false
      });
    },

    // 表单输入处理
    onInput(e: DatasetEvent) {
      const { field } = e.currentTarget.dataset;
      const { value } = e.detail;
      this.setData({
        [`formData.${field}`]: value
      });
    },

    // 选择文件
    chooseFile() {
      wx.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['txt'],
        success: (res) => {
          const file = res.tempFiles[0];
          this.setData({
            fileName: file.name
          });

          // 读取文件内容
          wx.getFileSystemManager().readFile({
            filePath: file.path,
            encoding: 'utf-8',
            success: (res) => {
              // 确保res.data是字符串类型
              const fileData = typeof res.data === 'string' ? res.data : '';
              this.setData({
                fileContent: fileData,
                'formData.words': fileData.replace(/\r\n|\r|\n/g, '|')
              });
            },
            fail: (error) => {
              console.error('读取文件失败:', error);
              wx.showToast({
                title: '读取文件失败',
                icon: 'none'
              });
            }
          });
        }
      });
    },

    // 提交表单
    async submitForm() {
      const { name, description, words } = this.data.formData;
      if (!name) {
        wx.showToast({
          title: '请输入单词本名称',
          icon: 'none'
        });
        return;
      }

      wx.showLoading({ title: '保存中...' });

      try {
        let res;
        
        if (this.data.isEdit) {
          // 更新单词本
          if (this.data.editId !== null) {
            res = await wordbookAPI.updateWordbook(this.data.editId, { name, description });
            
            // 如果有新单词，添加到单词本
            if (words) {
              await wordbookAPI.addWords(this.data.editId, words);
            }
          } else {
            throw new Error('编辑ID不能为空');
          }
        } else {
          // 创建单词本
          res = await wordbookAPI.createWordbook({ name, description, words });
        }
        
        wx.hideLoading();
        
        if (res.success) {
          wx.showToast({
            title: this.data.isEdit ? '更新成功' : '创建成功',
            icon: 'success'
          });

          this.setData({
            showModal: false
          });

          // 重新加载单词本列表
          this.loadWordbooks();
        } else {
          throw new Error(res.message || '操作失败');
        }
      } catch (error) {
        wx.hideLoading();
        console.error(this.data.isEdit ? '更新单词本失败:' : '创建单词本失败:', error);
        const err = error as ErrorWithMessage;
        wx.showToast({
          title: err.message || '操作失败',
          icon: 'none'
        });
      }
      // const method = this.data.isEdit ? 'PUT' : 'POST';
      // 
      // wx.request({
      //   url,
      //   method,
      //   data: { name, description, words },
      //   header: { 'Authorization': `Bearer ${wx.getStorageSync('token')}` },
      //   success: (res) => {
      //     wx.hideLoading();
      //     wx.showToast({
      //       title: this.data.isEdit ? '更新成功' : '创建成功',
      //       icon: 'success'
      //     });
      //     this.setData({ showModal: false });
      //     this.loadWordbooks();
      //   },
      //   fail: (error) => {
      //     wx.hideLoading();
      //     console.error('保存单词本失败:', error);
      //     wx.showToast({
      //       title: '保存失败',
      //       icon: 'none'
      //     });
      //   }
      // });
    },

    // 删除单词本
    deleteWordbook(e: DatasetEvent) {
      const { id, name } = e.currentTarget.dataset;
      
      wx.showModal({
        title: '确认删除',
        content: `确定要删除单词本「${name}」吗？`,
        confirmText: '删除',
        confirmColor: '#FF0000',
        success: async (res) => {
          if (res.confirm) {
            wx.showLoading({ title: '删除中...' });
            
            try {
              // 调用API删除单词本
              const res = await wordbookAPI.deleteWordbook(id);
              
              wx.hideLoading();
              
              if (res.success) {
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
                
                // 重新加载单词本列表
                this.loadWordbooks();
              } else {
                throw new Error(res.message || '删除失败');
              }
            } catch (error) {
              wx.hideLoading();
              console.error('删除单词本失败:', error);
              const err = error as ErrorWithMessage;
              wx.showToast({
                title: err.message || '删除失败',
                icon: 'none'
              });
            }
          }
        }
      });
    },

    // 查看单词本详情
    viewWordbookDetail(e: DatasetEvent) {
      const { id } = e.currentTarget.dataset;
      wx.navigateTo({
        url: `/pages/taskDetail/taskDetail?id=${id}&type=wordbook`
      });
    },

    // 创建记忆任务
    createTask(e: DatasetEvent) {
      const { id, name } = e.currentTarget.dataset;
      wx.navigateTo({
        url: `/pages/createTask/createTask?wordbookId=${id}&wordbookName=${name}`
      });
    }
  }
});