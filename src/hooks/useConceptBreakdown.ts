/**
 * 概念拆解 Hook
 */

import { useState } from 'react';
import { breakdownConcept as breakdownConceptAPI } from '../utils/api';
import { generateId } from '../utils/api';
import type { ConceptBreakdown } from '../types/concept';

export function useConceptBreakdown() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 拆解概念为专业术语和知识考点
   */
  const breakdownConcept = async (
    concept: string,
    existing?: { terminology: string[]; knowledgePoints: string[] },
    nodePath?: string[]
  ): Promise<ConceptBreakdown> => {
    console.log('%c🔧 useConceptBreakdown.breakdownConcept 被调用', 'color: #FF85A2; font-size: 14px; font-weight: bold');
    console.log('%c概念:', 'color: #B19CD9; font-weight: bold', concept);

    setIsLoading(true);
    setError(null);

    // 创建 AbortController 用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 30000); // 30 秒超时

    try {
      console.log('%c⏳ 准备调用 breakdownConceptAPI...', 'color: #87CEEB; font-size: 14px; font-weight: bold');

      // 调用 AI API
      const response = await breakdownConceptAPI({
        concept,
        existingTerminology: existing?.terminology ?? [],
        existingKnowledgePoints: existing?.knowledgePoints ?? [],
        nodePath: nodePath ?? [],
      });

      console.log('%c✅ breakdownConceptAPI 返回:', 'color: #98D8C8; font-size: 14px; font-weight: bold', response);

      // 为每个术语和考点生成唯一 ID
      const terminology = response.terminology.map((term) => ({
        ...term,
        id: generateId(),
      }));

      const knowledgePoints = (response.knowledgePoints ?? []).map((point) => ({
        ...point,
        id: generateId(),
      }));

      const result: ConceptBreakdown = {
        concept,
        terminology,
        knowledgePoints,
      };

      console.log('%c✨ 拆解结果:', 'color: #FFE48A; font-size: 14px; font-weight: bold', result);

      clearTimeout(timeoutId);
      setIsLoading(false);
      return result;
    } catch (err) {
      clearTimeout(timeoutId);

      let errorMessage = '概念拆解失败';

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = '请求超时，请重试';
        } else {
          errorMessage = err.message;
        }
      }

      console.error('%c❌ useConceptBreakdown 错误', 'color: #FF5C8D; font-size: 16px; font-weight: bold', errorMessage);
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  };

  return {
    breakdownConcept,
    isLoading,
    error,
  };
}
