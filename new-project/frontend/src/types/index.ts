// 用户相关类型
export interface User {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// 提供商相关类型
export interface Provider {
  id: string;
  user_id: string;
  name: string;
  provider_type: string;
  base_url: string;
  icon: string;
  is_active: boolean;
  created_at: string;
}

export interface ProviderCreate {
  name: string;
  provider_type: string;
  base_url?: string;
  icon?: string;
  api_key: string;
}

// 模型相关类型
export interface Model {
  id: string;
  user_id: string;
  provider_id: string;
  name: string;
  model_code: string;
  display_name: string;
  max_tokens: number;
  temperature: number;
  supports_thinking: boolean;
  thinking_enabled: boolean;
  is_active: boolean;
  created_at: string;
}

export interface ModelCreate {
  provider_id: string;
  name: string;
  model_code: string;
  display_name?: string;
  max_tokens?: number;
  temperature?: number;
  supports_thinking?: boolean;
}

// 知识树节点 - 统一的数据结构，用于术语和考点
export interface KnowledgeTreeNode {
  id: string;
  history_id: string;
  parent_id: string | null;
  name: string;        // 术语名称或考点标题
  definition: string;  // 术语定义或考点描述
  type: 'term' | 'knowledge_point';  // 节点类型
  sort_order: number;
  is_expanded: boolean;
  is_breaking_down: boolean;
  path: string;
  created_at: string;
  // 递归子节点
  children: KnowledgeTreeNode[];
}

// 概念拆解相关类型
export interface Term {
  id: string;
  history_id: string;
  parent_id: string | null;
  name: string;
  definition: string;
  sort_order: number;
  is_expanded: boolean;
  is_breaking_down: boolean;
  path: string;
  created_at: string;
}

export interface KnowledgePoint {
  id: string;
  history_id: string;
  parent_id: string | null;
  title: string;
  description: string;
  sort_order: number;
  is_expanded: boolean;
  is_breaking_down: boolean;
  path: string;
  created_at: string;
}

export interface ConceptHistory {
  id: string;
  user_id: string;
  folder_id?: string;
  concept: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BreakdownRequest {
  concept: string;
  folder_id?: string;
  existing_terminology?: string[];
  existing_knowledge_points?: string[];
  node_path?: string[];
}

export interface BreakdownResponse {
  concept: string;
  history_id?: string;
  terminology: Term[];
  knowledge_points: KnowledgePoint[];
}

// 任务相关类型
export interface Task {
  id: string;
  user_id: string;
  parent_id: string | null;
  title: string;
  description: string;
  completed: boolean;
  spicy_level: number;
  category: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  children: Task[];
}

export interface TaskCreate {
  title: string;
  description?: string;
  parent_id?: string | null;
  spicy_level?: number;
  category?: string;
}

// 操作按钮配置
export interface QueryAction {
  id: string;
  user_id: string;
  action_key: string;
  label: string;
  query_template: string;
  followup_template: string;
  enabled: boolean;
  sort_order: number;
  is_system: boolean;
  created_at: string;
}

// 联网搜索配置
export interface WebSearchConfig {
  id: string;
  user_id: string;
  enabled: boolean;
  search_engine: string;
  count: number;
  search_domain_filter: string;
  search_recency_filter: string;
  content_size: string;
  search_prompt: string;
}

// API 响应类型
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}