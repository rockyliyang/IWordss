// utils/api.ts

// 导入环境配置
import { getEnvConfig } from './config';
// 导入API类型定义
import { 
  ApiResponse, 
  User, 
  LoginResponse, 
  Wordbook, 
  WordbookDetail,
  Task, 
  TaskDetail, 
  TaskStatistics,
  CreateWordbookParams, 
  UpdateWordbookParams,
  CreateTaskParams,
  UpdateWordStatusParams,
  UpdateDailyTaskStatusParams,
  WechatBindParams
} from './api.types';

// 根据当前环境获取API基础URL
const BASE_URL = getEnvConfig().apiBaseUrl;

// 请求方法封装
const request = <T>(url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any): Promise<ApiResponse<T>> => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wx.getStorageSync('token')}` // 从本地存储获取token
      },
      success: (res: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          // 处理错误状态码
          if (res.statusCode === 401) {
            // token过期或无效，跳转到登录页
            wx.removeStorageSync('token');
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }
          reject(res);
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};

// 用户相关API
export const userAPI = {
  // 登录
  login: (data: { username: string; password: string }): Promise<ApiResponse<LoginResponse>> => {
    return request<LoginResponse>('/auth/login', 'POST', data);
  },
  
  // 微信登录
  wxLogin: (data: { code: string, nickname?: string, avatarUrl?: string }): Promise<ApiResponse<LoginResponse>> => {
    return request<LoginResponse>('/wechat/login', 'POST', data);
  },
  
  // 注册
  register: (data: { username: string; password: string; email?: string }): Promise<ApiResponse<User>> => {
    return request<User>('/auth/register', 'POST', data);
  },
  
  // 获取用户信息
  getUserInfo: (): Promise<ApiResponse<User>> => {
    return request<User>('/users/me', 'GET');
  },
  
  // 绑定微信用户ID
  bindWechat: (data: WechatBindParams): Promise<ApiResponse<User>> => {
    return request<User>('/users/bind-wechat', 'POST', data);
  }
};

// 单词本相关API
export const wordbookAPI = {
  // 获取单词本列表
  getWordbooks: (): Promise<ApiResponse<Wordbook[]>> => {
    return request<Wordbook[]>('/wordbooks', 'GET');
  },
  
  // 获取单词本详情
  getWordbookDetail: (id: number): Promise<ApiResponse<WordbookDetail>> => {
    return request<WordbookDetail>(`/wordbooks/${id}`, 'GET');
  },
  
  // 创建单词本
  createWordbook: (data: CreateWordbookParams): Promise<ApiResponse<Wordbook>> => {
    return request<Wordbook>('/wordbooks', 'POST', data);
  },
  
  // 更新单词本
  updateWordbook: (id: number, data: UpdateWordbookParams): Promise<ApiResponse<Wordbook>> => {
    return request<Wordbook>(`/wordbooks/${id}`, 'PUT', data);
  },
  
  // 删除单词本
  deleteWordbook: (id: number): Promise<ApiResponse<void>> => {
    return request<void>(`/wordbooks/${id}`, 'DELETE');
  },
  
  // 添加单词到单词本
  addWords: (id: number, words: string): Promise<ApiResponse<Wordbook>> => {
    return request<Wordbook>(`/wordbooks/${id}/words`, 'POST', { words });
  }
};

// 任务相关API
export const taskAPI = {
  // 获取所有记忆任务
  getTasks: (): Promise<ApiResponse<Task[]>> => {
    return request<Task[]>('/tasks', 'GET');
  },
  
  // 获取任务详情
  getTaskDetail: (id: number): Promise<ApiResponse<TaskDetail>> => {
    return request<TaskDetail>(`/tasks/${id}`, 'GET');
  },
  
  // 创建记忆任务
  createTask: (data: CreateTaskParams): Promise<ApiResponse<Task>> => {
    return request<Task>('/tasks', 'POST', data);
  },
  
  // 获取今日任务
  getTodayTasks: (): Promise<ApiResponse<Task[]>> => {
    return request<Task[]>('/tasks/today', 'GET');
  },
  
  // 获取任务统计
  getTaskStats: (): Promise<ApiResponse<TaskStatistics>> => {
    return request<TaskStatistics>('/tasks/stats', 'GET');
  },
  
  // 更新单词状态
  updateWordStatus: (data: UpdateWordStatusParams): Promise<ApiResponse<void>> => {
    return request<void>('/tasks/word-status', 'PUT', data);
  },
  
  // 更新每日任务状态
  updateDailyTaskStatus: (data: UpdateDailyTaskStatusParams): Promise<ApiResponse<void>> => {
    return request<void>('/tasks/daily-status', 'PUT', data);
  },
  
  // 暂停/恢复记忆任务
  updateTaskStatus: (id: number, status: 'active' | 'paused' | 'completed'): Promise<ApiResponse<Task>> => {
    return request<Task>(`/tasks/${id}/status`, 'PUT', { status });
  }
};