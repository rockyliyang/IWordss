// utils/api.types.ts

// 通用API响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// 用户相关接口
export interface User {
  id: number;
  username: string;
  email?: string;
  avatar?: string;
  createdAt?: string;
  openid?: string; // 微信小程序openid
}

export interface LoginResponse {
  token: string;
  user: User;
  openid?: string; // 微信登录时可能返回的openid
}

// 单词本相关接口
export interface Wordbook {
  id: number;
  name: string;
  description?: string;
  wordCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface WordbookDetail extends Wordbook {
  words?: string; // 单词列表，以|分隔
  wordList?: string[]; // 单词数组形式
}

// 任务相关接口
export interface Task {
  id: number;
  name: string;
  wordbookId: number;
  wordbookName?: string;
  wordsPerDay: number;
  status: 'active' | 'paused' | 'completed';
  progress?: number; // 进度百分比
  createdAt?: string;
  updatedAt?: string;
  memory_task_id?: number; // 用于关联每日任务
  words?: {
    not_started: string[];
    learning: string[];
    remembered: string[];
    [key: string]: string[];
  };
}

export interface TaskDetail extends Task {
  wordbook?: Wordbook;
  dailyTasks?: DailyTask[];
  statistics?: TaskStatistics;
  stats?: {
    not_started: number;
    learning: number;
    remembered: number;
  };
}

export interface DailyTask {
  id: number;
  taskId: number;
  date: string;
  words: string; // 单词列表，以|分隔
  status: 'pending' | 'in_progress' | 'completed';
  completedCount?: number;
  totalCount?: number;
}

export interface TaskStatistics {
  totalWords: number;
  learnedWords: number;
  remainingWords: number;
  completedDays: number;
  streakDays: number;
}

export interface WordStatus {
  word: string;
  status: 'new' | 'learning' | 'reviewing' | 'mastered';
  lastReviewedAt?: string;
}

// 创建/更新请求参数接口
export interface CreateWordbookParams {
  name: string;
  description?: string;
  words?: string;
}

export interface UpdateWordbookParams {
  name?: string;
  description?: string;
}

export interface CreateTaskParams {
  wordbookId: number;
  name?: string;
  wordsPerDay: number;
}

export interface UpdateWordStatusParams {
  taskId: number;
  word: string;
  status: string;
}

export interface UpdateDailyTaskStatusParams {
  dailyTaskId: number;
  status: string;
}

// 微信绑定参数接口
export interface WechatBindParams {
  openid: string;
}