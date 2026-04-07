/**
 * AI 解答 Hook
 */

import { useState } from 'react';
import { consultAI } from '../utils/api';

export function useConsultAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 获取 AI 解答
   */
  const getAnswer = async (
    taskTitle: string,
    description?: string
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await consultAI({
        task: taskTitle,
        description,
      });

      setIsLoading(false);
      return response.answer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI 解答失败';
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  };

  return {
    getAnswer,
    isLoading,
    error,
  };
}
