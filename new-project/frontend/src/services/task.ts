import api from './api';
import type { Task, TaskCreate } from '../types';

export const taskApi = {
  // 获取任务列表
  list: async (completed?: boolean): Promise<{ items: Task[]; total: number }> => {
    const response = await api.get('/tasks', { params: { completed } });
    return response.data;
  },

  // 创建任务
  create: async (data: TaskCreate): Promise<Task> => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  // 更新任务
  update: async (id: string, data: Partial<TaskCreate>): Promise<Task> => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  // 删除任务
  delete: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  // 切换完成状态
  toggle: async (id: string): Promise<{ id: string; completed: boolean }> => {
    const response = await api.put(`/tasks/${id}/toggle`);
    return response.data;
  },

  // AI 拆解任务
  breakdown: async (id: string): Promise<{ message: string }> => {
    const response = await api.post(`/tasks/breakdown`, { task_id: id });
    return response.data;
  },
};