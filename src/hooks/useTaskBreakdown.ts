/**
 * 任务拆解 Hook
 */

import { useState } from 'react';
import { breakdownTask as breakdownTaskAPI } from '../utils/api';
import type { Task } from '../types/task';
import { generateId } from '../utils/api';

export function useTaskBreakdown() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 拆解任务为子任务
   */
  const breakdownTask = async (
    taskTitle: string,
    goal?: string,
    spicyLevel: number = 3,
    existingTasks?: string[]
  ): Promise<Task[]> => {
    console.log('%c🔧 useTaskBreakdown.breakdownTask 被调用', 'color: #FF85A2; font-size: 14px; font-weight: bold');
    console.log('%c任务标题:', 'color: #B19CD9; font-weight: bold', taskTitle);
    console.log('%c任务目标:', 'color: #B19CD9; font-weight: bold', goal);
    console.log('%c难度等级:', 'color: #B19CD9; font-weight: bold', spicyLevel);
    console.log('%c已有任务:', 'color: #B19CD9; font-weight: bold', existingTasks);

    setIsLoading(true);
    setError(null);

    try {
      // 开发环境 mock：URL 带 ?mock_breakdown=1 时返回模拟数据（用于 Playwright 等测试「拆解成功后页面不空白」）
      const mockByUrl =
        import.meta.env.DEV &&
        typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('mock_breakdown') === '1';
      const mockResponse = mockByUrl
          ? {
              subtasks: [
                { title: '安装 TypeScript', description: 'npm install -g typescript', completed: false },
                { title: '学习基础类型', description: '阅读官方文档', completed: false },
              ],
            }
          : null;

      if (mockResponse) {
        const now = new Date();
        const subtasks: Task[] = mockResponse.subtasks.map((subtask) => ({
          ...subtask,
          spicyLevel: (subtask as { spicyLevel?: number }).spicyLevel ?? 3,
          category: (subtask as { category?: string }).category,
          id: generateId(),
          subtasks: [],
          createdAt: now,
          updatedAt: now,
        }));
        setIsLoading(false);
        return subtasks;
      }

      console.log('%c⏳ 准备调用 breakdownTaskAPI...', 'color: #87CEEB; font-size: 14px; font-weight: bold');
      // 调用智谱AI API
      const response = await breakdownTaskAPI({
        task: taskTitle,
        goal,
        spicyLevel,
        existingTasks,
      });

      console.log('%c✅ breakdownTaskAPI 返回:', 'color: #98D8C8; font-size: 14px; font-weight: bold', response);

      // 转换为完整的 Task 对象（API 可能不返回 spicyLevel/category，给默认值避免渲染报错）
      const now = new Date();
      const subtasks: Task[] = response.subtasks.map((subtask) => ({
        ...subtask,
        spicyLevel: (subtask as { spicyLevel?: number }).spicyLevel ?? 3,
        category: (subtask as { category?: string }).category,
        id: generateId(),
        subtasks: [],
        createdAt: now,
        updatedAt: now,
      }));

      console.log('%c✨ 转换后的子任务:', 'color: #FFE48A; font-size: 14px; font-weight: bold', subtasks);

      setIsLoading(false);
      return subtasks;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '任务拆解失败';
      console.error('%c❌ useTaskBreakdown 错误', 'color: #FF5C8D; font-size: 16px; font-weight: bold', errorMessage);
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  };

  return {
    breakdownTask,
    isLoading,
    error,
  };
}
