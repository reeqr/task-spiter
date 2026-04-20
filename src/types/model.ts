/**
 * AI 模型配置类型定义
 */

/**
 * AI 提供商类型
 */
export type AIProvider = 'zhipu' | 'openai' | 'anthropic' | 'deepseek' | 'aihubmix' | 'custom';

/**
 * 提供商配置
 */
export interface ProviderConfig {
  id: string;
  name: string;
  provider: AIProvider;
  apiKey: string;
  baseURL: string;
  icon?: string;
}

/**
 * 模型配置
 */
export interface AIModel {
  id: string;
  providerId: string; // 关联的提供商ID
  name: string;
  model: string; // 模型代码
  displayName?: string; // 显示名称
  maxTokens?: number;
  temperature?: number;
  supportsThinking?: boolean; // 是否支持思考模式
  thinkingEnabled?: boolean; // 是否启用思考模式（仅在支持时有效）
}

/**
 * 预定义的提供商配置
 */
export const PREDEFINED_PROVIDERS: Record<string, Omit<ProviderConfig, 'apiKey'>> = {
  'zhipu': {
    id: 'zhipu',
    name: '智谱 AI',
    provider: 'zhipu',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    icon: '🔮',
  },
  'openai': {
    id: 'openai',
    name: 'OpenAI',
    provider: 'openai',
    baseURL: 'https://api.openai.com/v1/chat/completions',
    icon: '🤖',
  },
  'anthropic': {
    id: 'anthropic',
    name: 'Anthropic',
    provider: 'anthropic',
    baseURL: 'https://api.anthropic.com/v1/messages',
    icon: '🧠',
  },
  'deepseek': {
    id: 'deepseek',
    name: 'DeepSeek',
    provider: 'deepseek',
    baseURL: 'https://api.deepseek.com/v1/chat/completions',
    icon: '🔬',
  },
  'aihubmix': {
    id: 'aihubmix',
    name: 'Aihubmix',
    provider: 'aihubmix',
    baseURL: 'https://api.aihubmix.com/v1/chat/completions',
    icon: '🌟',
  },
  'custom': {
    id: 'custom',
    name: '自定义',
    provider: 'custom',
    baseURL: '',
    icon: '⚙️',
  },
};

/**
 * 预定义的模型配置示例
 */
export const PREDEFINED_MODEL_EXAMPLES: Record<string, Omit<AIModel, 'providerId'>> = {
  'glm-4-flash': {
    id: 'glm-4-flash',
    name: 'GLM-4 Flash',
    model: 'glm-4-flash',
    displayName: '智谱 GLM-4 Flash',
    maxTokens: 65536,
    temperature: 0.7,
  },
  'glm-4-plus': {
    id: 'glm-4-plus',
    name: 'GLM-4 Plus',
    model: 'glm-4-plus',
    displayName: '智谱 GLM-4 Plus',
    maxTokens: 128000,
    temperature: 0.7,
  },
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    model: 'gpt-4o',
    displayName: 'OpenAI GPT-4o',
    maxTokens: 128000,
    temperature: 0.7,
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    model: 'gpt-4o-mini',
    displayName: 'OpenAI GPT-4o Mini',
    maxTokens: 128000,
    temperature: 0.7,
  },
  'claude-sonnet-4': {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    model: 'claude-sonnet-4-20250514',
    displayName: 'Claude Sonnet 4',
    maxTokens: 200000,
    temperature: 0.7,
  },
  'claude-haiku-4': {
    id: 'claude-haiku-4',
    name: 'Claude Haiku 4',
    model: 'claude-haiku-4-20250514',
    displayName: 'Claude Haiku 4',
    maxTokens: 200000,
    temperature: 0.7,
  },
  'deepseek-chat': {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    model: 'deepseek-chat',
    displayName: 'DeepSeek Chat',
    maxTokens: 128000,
    temperature: 0.7,
  },
  'qwen-turbo': {
    id: 'qwen-turbo',
    name: 'Qwen Turbo',
    model: 'qwen-turbo',
    displayName: 'Qwen Turbo (通义千问)',
    maxTokens: 8192,
    temperature: 0.7,
  },
};

/**
 * 向后兼容的预定义模型配置（用于旧数据迁移）
 */
export const PREDEFINED_MODELS: Record<string, Omit<AIModel, 'apiKey'>> = {
  // 智谱 AI 模型
  'zhipu-glm-5': {
    id: 'zhipu-glm-5',
    providerId: 'zhipu',
    name: 'glm-5',
    model: 'glm-5',
    displayName: '智谱 GLM-5 (推荐)',
    maxTokens: 65536,
    temperature: 1.0,
    supportsThinking: true,
    thinkingEnabled: false,
  },
  'zhipu-glm-4-flash': {
    id: 'zhipu-glm-4-flash',
    providerId: 'zhipu',
    name: 'glm-4-flash',
    model: 'glm-4-flash',
    displayName: '智谱 GLM-4 Flash',
    maxTokens: 65536,
    temperature: 0.7,
  },
  'zhipu-glm-4-plus': {
    id: 'zhipu-glm-4-plus',
    providerId: 'zhipu',
    name: 'glm-4-plus',
    model: 'glm-4-plus',
    displayName: '智谱 GLM-4 Plus',
    maxTokens: 128000,
    temperature: 0.7,
  },
  'zhipu-glm-4-air': {
    id: 'zhipu-glm-4-air',
    providerId: 'zhipu',
    name: 'glm-4-air',
    model: 'glm-4-air',
    displayName: '智谱 GLM-4 Air',
    maxTokens: 128000,
    temperature: 0.7,
  },

  // OpenAI 模型
  'openai-gpt-4o': {
    id: 'openai-gpt-4o',
    providerId: 'openai',
    name: 'gpt-4o',
    model: 'gpt-4o',
    displayName: 'OpenAI GPT-4o',
    maxTokens: 128000,
    temperature: 0.7,
  },
  'openai-gpt-4o-mini': {
    id: 'openai-gpt-4o-mini',
    providerId: 'openai',
    name: 'gpt-4o-mini',
    model: 'gpt-4o-mini',
    displayName: 'OpenAI GPT-4o Mini',
    maxTokens: 128000,
    temperature: 0.7,
  },
  'openai-gpt-3.5-turbo': {
    id: 'openai-gpt-3.5-turbo',
    providerId: 'openai',
    name: 'gpt-3.5-turbo',
    model: 'gpt-3.5-turbo',
    displayName: 'OpenAI GPT-3.5 Turbo',
    maxTokens: 16385,
    temperature: 0.7,
  },

  // Anthropic 模型
  'anthropic-claude-sonnet-4': {
    id: 'anthropic-claude-sonnet-4',
    providerId: 'anthropic',
    name: 'claude-sonnet-4',
    model: 'claude-sonnet-4-20250514',
    displayName: 'Claude Sonnet 4',
    maxTokens: 200000,
    temperature: 0.7,
  },
  'anthropic-claude-haiku-4': {
    id: 'anthropic-claude-haiku-4',
    providerId: 'anthropic',
    name: 'claude-haiku-4',
    model: 'claude-haiku-4-20250514',
    displayName: 'Claude Haiku 4',
    maxTokens: 200000,
    temperature: 0.7,
  },

  // DeepSeek 模型
  'deepseek-chat': {
    id: 'deepseek-chat',
    providerId: 'deepseek',
    name: 'deepseek-chat',
    model: 'deepseek-chat',
    displayName: 'DeepSeek Chat',
    maxTokens: 128000,
    temperature: 0.7,
  },
  'deepseek-coder': {
    id: 'deepseek-coder',
    providerId: 'deepseek',
    name: 'deepseek-coder',
    model: 'deepseek-coder',
    displayName: 'DeepSeek Coder',
    maxTokens: 128000,
    temperature: 0.7,
  },

  // Aihubmix - Qwen 模型（通义千问）
  'aihubmix-qwen-flash': {
    id: 'aihubmix-qwen-flash',
    providerId: 'aihubmix',
    name: 'qwen-flash',
    model: 'qwen-flash',
    displayName: 'Qwen Flash ⚡ (超快响应)',
    maxTokens: 8192,
    temperature: 0.7,
  },
  'aihubmix-qwen-turbo': {
    id: 'aihubmix-qwen-turbo',
    providerId: 'aihubmix',
    name: 'qwen-turbo',
    model: 'qwen-turbo',
    displayName: 'Qwen Turbo (通义千问)',
    maxTokens: 8192,
    temperature: 0.7,
  },
  'aihubmix-qwen-plus': {
    id: 'aihubmix-qwen-plus',
    providerId: 'aihubmix',
    name: 'qwen-plus',
    model: 'qwen-plus',
    displayName: 'Qwen Plus (通义千问)',
    maxTokens: 32768,
    temperature: 0.7,
  },
  'aihubmix-qwen-max': {
    id: 'aihubmix-qwen-max',
    providerId: 'aihubmix',
    name: 'qwen-max',
    model: 'qwen-max',
    displayName: 'Qwen Max (通义千问)',
    maxTokens: 6000,
    temperature: 0.7,
  },
  'aihubmix-qwen-long': {
    id: 'aihubmix-qwen-long',
    providerId: 'aihubmix',
    name: 'qwen-long',
    model: 'qwen-long',
    displayName: 'Qwen Long (通义千问长文本)',
    maxTokens: 1000000,
    temperature: 0.7,
  },
  'aihubmix-qwen-coder-turbo': {
    id: 'aihubmix-qwen-coder-turbo',
    providerId: 'aihubmix',
    name: 'qwen-coder-turbo',
    model: 'qwen-coder-turbo',
    displayName: 'Qwen Coder Turbo (代码模型)',
    maxTokens: 8192,
    temperature: 0.7,
  },
};

/**
 * 提供商显示名称
 */
export const PROVIDER_NAMES: Record<AIProvider, string> = {
  zhipu: '智谱 AI',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  deepseek: 'DeepSeek',
  aihubmix: 'Aihubmix',
  custom: '自定义',
};

/**
 * 提供商图标
 */
export const PROVIDER_ICONS: Record<AIProvider, string> = {
  zhipu: '🔮',
  openai: '🤖',
  anthropic: '🧠',
  deepseek: '🔬',
  aihubmix: '🌟',
  custom: '⚙️',
};
