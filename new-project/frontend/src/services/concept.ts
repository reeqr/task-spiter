import api from './api';
import type { ConceptHistory, BreakdownRequest, Term, KnowledgePoint, QueryAction, WebSearchConfig } from '../types';

export interface BreakdownResponse {
  concept: string;
  history_id?: string;
  terminology: Term[];
  knowledge_points: KnowledgePoint[];
}

export const conceptApi = {
  // 拆解概念
  breakdown: async (request: BreakdownRequest): Promise<BreakdownResponse> => {
    const response = await api.post('/concepts/breakdown', request);
    return response.data;
  },

  // 拆解术语/考点节点
  breakdownTerm: async (termId: string): Promise<{
    terminology: Term[];
    knowledge_points: KnowledgePoint[];
  }> => {
    const response = await api.post(`/terms/${termId}/breakdown`);
    return response.data;
  },

  // 获取历史列表
  getHistory: async (skip = 0, limit = 20): Promise<ConceptHistory[]> => {
    const response = await api.get('/concepts/history', { params: { skip, limit } });
    return response.data;
  },

  // 获取历史详情
  getHistoryDetail: async (id: string): Promise<{
    id: string;
    user_id: string;
    concept: string;
    history_id: string;
    created_at: string;
    updated_at: string;
    terminology: Term[];
    knowledge_points: KnowledgePoint[];
  }> => {
    const response = await api.get(`/concepts/history/${id}`);
    return response.data;
  },

  // 删除历史
  deleteHistory: async (id: string): Promise<void> => {
    await api.delete(`/concepts/history/${id}`);
  },

  // 查询术语
  query: async (params: {
    action_id: string;
    term: string;
    concept?: string;
    term_definition?: string;
  }): Promise<{ answer: string; sources: Array<{ title?: string; url: string }>; source_notice: string }> => {
    const response = await api.post('/terms/query', null, { params });
    return response.data;
  },

  queryStream: async (
    params: {
      action_id: string;
      term: string;
      concept?: string;
      term_definition?: string;
    },
    handlers: {
      onChunk: (chunk: string) => void;
      onDone?: () => void;
      onError?: (message: string) => void;
    },
    options?: {
      signal?: AbortSignal;
    }
  ): Promise<void> => {
    const token = localStorage.getItem('access_token');
    const searchParams = new URLSearchParams();
    searchParams.set('action_id', params.action_id);
    searchParams.set('term', params.term);
    if (params.concept) searchParams.set('concept', params.concept);
    if (params.term_definition) searchParams.set('term_definition', params.term_definition);

    const response = await fetch(`/api/v1/terms/query/stream?${searchParams.toString()}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: options?.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Stream request failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const event of events) {
        const line = event
          .split('\n')
          .find(item => item.startsWith('data: '));
        if (!line) continue;

        const payload = JSON.parse(line.slice(6));
        if (payload.type === 'chunk') {
          handlers.onChunk(payload.content);
        } else if (payload.type === 'done') {
          handlers.onDone?.();
        } else if (payload.type === 'error') {
          handlers.onError?.(payload.message || '流式输出失败');
        }
      }
    }
  },

  // 追问
  followup: async (params: {
    action_id: string;
    term: string;
    concept?: string;
    followup_question: string;
  }): Promise<{ answer: string; sources: Array<{ title?: string; url: string }>; source_notice: string }> => {
    const response = await api.post('/terms/query/followup', null, { params });
    return response.data;
  },

  followupStream: async (
    params: {
      action_id: string;
      term: string;
      concept?: string;
      followup_question: string;
    },
    handlers: {
      onChunk: (chunk: string) => void;
      onDone?: () => void;
      onError?: (message: string) => void;
    },
    options?: {
      signal?: AbortSignal;
    }
  ): Promise<void> => {
    const token = localStorage.getItem('access_token');
    const searchParams = new URLSearchParams();
    searchParams.set('action_id', params.action_id);
    searchParams.set('term', params.term);
    if (params.concept) searchParams.set('concept', params.concept);
    searchParams.set('followup_question', params.followup_question);

    const response = await fetch(`/api/v1/terms/query/followup/stream?${searchParams.toString()}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: options?.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Stream request failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const event of events) {
        const line = event
          .split('\n')
          .find(item => item.startsWith('data: '));
        if (!line) continue;

        const payload = JSON.parse(line.slice(6));
        if (payload.type === 'chunk') {
          handlers.onChunk(payload.content);
        } else if (payload.type === 'done') {
          handlers.onDone?.();
        } else if (payload.type === 'error') {
          handlers.onError?.(payload.message || '流式输出失败');
        }
      }
    }
  },

  // 移动知识树到指定目录
  moveKnowledgeTree: async (ktId: string, folderId: string | null): Promise<void> => {
    await api.put(`/folders/knowledge-tree/${ktId}/move`, { folder_id: folderId });
  },
};

export const configApi = {
  // 获取操作按钮配置
  getActions: async (): Promise<{ items: QueryAction[]; total: number }> => {
    const response = await api.get('/config/actions');
    return response.data;
  },

  // 创建自定义操作按钮
  createAction: async (data: {
    label: string;
    query_template: string;
    followup_template: string;
    sort_order?: number;
  }): Promise<QueryAction> => {
    const response = await api.post('/config/actions', data);
    return response.data;
  },

  // 更新操作按钮
  updateAction: async (id: string, data: Partial<QueryAction>): Promise<QueryAction> => {
    const response = await api.put(`/config/actions/${id}`, data);
    return response.data;
  },

  // 删除操作按钮
  deleteAction: async (id: string): Promise<void> => {
    await api.delete(`/config/actions/${id}`);
  },

  // 获取联网搜索配置
  getWebSearchConfig: async (): Promise<WebSearchConfig> => {
    const response = await api.get('/config/web-search');
    return response.data;
  },

  // 更新联网搜索配置
  updateWebSearchConfig: async (data: Partial<WebSearchConfig>): Promise<WebSearchConfig> => {
    const response = await api.put('/config/web-search', data);
    return response.data;
  },

  // 获取提示词模板
  getPromptTemplate: async (): Promise<{ id: string; concept_breakdown_template: string }> => {
    const response = await api.get('/config/prompts');
    return response.data;
  },

  // 更新提示词模板
  updatePromptTemplate: async (template: string): Promise<{ id: string; concept_breakdown_template: string }> => {
    const response = await api.put('/config/prompts', { concept_breakdown_template: template });
    return response.data;
  },
};
