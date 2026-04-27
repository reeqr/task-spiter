/**
 * 概念拆解历史记录 Hook（带 localStorage 持久化）
 */

import { useState, useEffect, useCallback } from 'react';
import type { ConceptBreakdown, ConceptHistoryItem } from '../types/concept';
import { generateId } from '../utils/api';

const STORAGE_KEY = 'task_spiter_concept_history_v1';

/**
 * 从 localStorage 加载历史记录
 */
function loadHistoryFromStorage(): ConceptHistoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('加载概念历史失败:', error);
    return [];
  }
}

/**
 * 保存历史记录到 localStorage
 */
function saveHistoryToStorage(history: ConceptHistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('保存概念历史失败:', error);
  }
}

export function useConceptHistory() {
  const [history, setHistory] = useState<ConceptHistoryItem[]>(() => loadHistoryFromStorage());
  const [isLoaded, setIsLoaded] = useState(false);

  // 初始化后标记已加载
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // 当历史变化时自动保存到 localStorage
  useEffect(() => {
    if (isLoaded) {
      saveHistoryToStorage(history);
    }
  }, [history, isLoaded]);

  /**
   * 保存拆解结果到历史记录
   * 如果概念已存在则更新，不存在则添加
   */
  const saveToHistory = useCallback((breakdown: ConceptBreakdown) => {
    const now = Date.now();
    const existingIndex = history.findIndex(
      (item) => item.concept === breakdown.concept
    );

    if (existingIndex !== -1) {
      // 概念已存在，更新
      setHistory((prev) => {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          breakdown,
          updatedAt: now,
        };
        // 将更新的项移到最前面
        return [updated[existingIndex], ...updated.slice(0, existingIndex), ...updated.slice(existingIndex + 1)];
      });
    } else {
      // 新概念，添加到最前面
      const newItem: ConceptHistoryItem = {
        id: generateId(),
        concept: breakdown.concept,
        createdAt: now,
        updatedAt: now,
        breakdown,
      };
      setHistory((prev) => [newItem, ...prev]);
    }
  }, [history]);

  /**
   * 从历史记录中删除
   */
  const deleteFromHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  /**
   * 获取单个历史记录
   */
  const getFromHistory = useCallback((id: string): ConceptHistoryItem | undefined => {
    return history.find((item) => item.id === id);
  }, [history]);

  /**
   * 根据概念名称获取历史记录
   */
  const getByConcept = useCallback((concept: string): ConceptHistoryItem | undefined => {
    return history.find((item) => item.concept === concept);
  }, [history]);

  /**
   * 清空所有历史记录
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    history,
    saveToHistory,
    deleteFromHistory,
    getFromHistory,
    getByConcept,
    clearHistory,
  };
}
