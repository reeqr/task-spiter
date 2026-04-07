/**
 * 任务管理 Hook（带 localStorage 持久化）
 */

import { useState, useEffect } from 'react';
import type { Task } from '../types/task';
import { generateId } from '../utils/api';

const STORAGE_KEY = 'task_spiter_tasks';

/**
 * 从 localStorage 加载任务
 */
function loadTasksFromStorage(): Task[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const tasks = JSON.parse(stored);
    // 将日期字符串转换回 Date 对象
    const convertDates = (task: any): Task => ({
      ...task,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      subtasks: task.subtasks.map(convertDates),
    });

    return tasks.map(convertDates);
  } catch (error) {
    console.error('加载任务失败:', error);
    return [];
  }
}

/**
 * 保存任务到 localStorage
 */
function saveTasksToStorage(tasks: Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('保存任务失败:', error);
  }
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasksFromStorage());
  const [isLoaded, setIsLoaded] = useState(false);

  // 初始化后标记已加载
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // 当任务变化时自动保存到 localStorage
  useEffect(() => {
    if (isLoaded) {
      saveTasksToStorage(tasks);
    }
  }, [tasks, isLoaded]);

  /**
   * 添加新任务
   */
  const addTask = (title: string, description?: string) => {
    const now = new Date();
    const newTask: Task = {
      id: generateId(),
      title,
      description,
      completed: false,
      spicyLevel: 3,
      subtasks: [],
      createdAt: now,
      updatedAt: now,
    };

    setTasks((prev) => [...prev, newTask]);
    return newTask;
  };

  /**
   * 更新任务
   */
  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const updateRecursive = (tasks: Task[]): Task[] => {
      return tasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            ...updates,
            updatedAt: new Date(),
          };
        }
        if (task.subtasks.length > 0) {
          return {
            ...task,
            subtasks: updateRecursive(task.subtasks),
          };
        }
        return task;
      });
    };

    setTasks(updateRecursive);
  };

  /**
   * 删除任务
   */
  const deleteTask = (taskId: string) => {
    const deleteRecursive = (tasks: Task[]): Task[] => {
      return tasks
        .filter((task) => task.id !== taskId)
        .map((task) => ({
          ...task,
          subtasks: deleteRecursive(task.subtasks),
        }));
    };

    setTasks(deleteRecursive);
  };

  /**
   * 为任务添加子任务
   */
  const addSubtasks = (taskId: string, subtasks: Task[]) => {
    const addRecursive = (tasks: Task[]): Task[] => {
      return tasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            subtasks: [...task.subtasks, ...subtasks],
            updatedAt: new Date(),
          };
        }
        if (task.subtasks.length > 0) {
          return {
            ...task,
            subtasks: addRecursive(task.subtasks),
          };
        }
        return task;
      });
    };

    setTasks(addRecursive);
  };

  /**
   * 切换任务完成状态
   */
  const toggleTaskComplete = (taskId: string) => {
    const toggleRecursive = (tasks: Task[]): Task[] => {
      return tasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            completed: !task.completed,
            updatedAt: new Date(),
          };
        }
        if (task.subtasks.length > 0) {
          return {
            ...task,
            subtasks: toggleRecursive(task.subtasks),
          };
        }
        return task;
      });
    };

    setTasks(toggleRecursive);
  };

  /**
   * 获取任务
   */
  const getTask = (taskId: string): Task | undefined => {
    const findRecursive = (tasks: Task[]): Task | undefined => {
      for (const task of tasks) {
        if (task.id === taskId) {
          return task;
        }
        if (task.subtasks.length > 0) {
          const found = findRecursive(task.subtasks);
          if (found) return found;
        }
      }
      return undefined;
    };

    return findRecursive(tasks);
  };

  /**
   * 清空所有任务
   */
  const clearAllTasks = () => {
    setTasks([]);
  };

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    addSubtasks,
    toggleTaskComplete,
    getTask,
    clearAllTasks,
  };
}
