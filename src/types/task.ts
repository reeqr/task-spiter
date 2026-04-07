/**
 * 任务类型定义
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  spicyLevel: number; // 1-5，表示任务难度
  category?: string; // 任务分类
  subtasks: Task[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AI 拆解请求参数
 */
export interface BreakdownRequest {
  task: string;
  goal?: string;
  spicyLevel: number;
  existingTasks?: string[]; // 已有任务标题列表，用于避免重复
}

/**
 * AI 拆解响应
 */
export interface BreakdownResponse {
  subtasks: Omit<Task, 'id' | 'subtasks' | 'createdAt' | 'updatedAt'>[];
}
