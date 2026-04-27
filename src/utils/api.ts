/**
 * AI API 服务 - 用于任务拆解
 *
 * 支持多个 AI 模型提供商
 */

import type { BreakdownRequest, BreakdownResponse } from '../types/task';
import type { ConceptBreakdownRequest, ConceptBreakdownResponse } from '../types/concept';
import type { AIModel, AIProvider } from '../types/model';
import { PREDEFINED_MODELS } from '../types/model';
import {
  loadPromptTemplates,
  renderPromptTemplate,
  QUERY_ACTION_EXAM_ANGLE,
  QUERY_ACTION_KNOWLEDGE,
} from './promptConfig';

// 默认使用智谱AI（向后兼容）
const DEFAULT_API_KEY = import.meta.env.VITE_ZHIPU_API_KEY || '';

/**
 * 内部使用的完整模型配置类型
 * 包含从 provider 获取的认证信息和配置
 */
interface ModelConfig extends Omit<AIModel, 'providerId'> {
  provider: AIProvider;
  apiKey: string;
  baseURL: string;
  // supportsThinking: 是否模型支持思考模式
  // thinkingEnabled: 是否用户启用了思考模式
}

export interface QuerySource {
  title?: string;
  url: string;
  publishedAt?: string;
}

export interface WebSearchConfig {
  enabled: boolean;
  searchEngine: 'search_std' | 'search_pro';
  count: number;
  searchDomainFilter: string;
  searchRecencyFilter: 'noLimit' | '1d' | '1w' | '1m' | '1y';
  contentSize: 'low' | 'medium' | 'high';
  searchPrompt: string;
}

const WEB_SEARCH_CONFIG_KEY = 'task_spiter_web_search_config_v1';
const DEFAULT_WEB_SEARCH_CONFIG: WebSearchConfig = {
  enabled: false,
  searchEngine: 'search_pro',
  count: 5,
  searchDomainFilter: '',
  searchRecencyFilter: 'noLimit',
  contentSize: 'high',
  searchPrompt: '',
};

const WEB_SEARCH_PROVIDER_SUPPORT: Partial<Record<AIProvider, boolean>> = {
  zhipu: true,
};
const STREAM_PROVIDER_SUPPORT: Partial<Record<AIProvider, boolean>> = {
  zhipu: true,
};

const runtimeUnsupportedProviders = new Set<AIProvider>();
const runtimeUnsupportedStreamProviders = new Set<AIProvider>();
const FIXED_MODEL_TEMPERATURE = 0.1;

// 当前使用的模型配置
let currentModel: ModelConfig | null = null;
let webSearchConfigCache: WebSearchConfig | null = null;

/**
 * 初始化默认模型（向后兼容）
 */
function initializeDefaultModel() {
  if (DEFAULT_API_KEY && !currentModel) {
    const predefinedModel = PREDEFINED_MODELS['zhipu-glm-5'];
    currentModel = {
      id: predefinedModel.id,
      name: predefinedModel.name,
      model: predefinedModel.model,
      displayName: predefinedModel.displayName,
      maxTokens: predefinedModel.maxTokens,
      temperature: predefinedModel.temperature,
      supportsThinking: predefinedModel.supportsThinking,
      thinkingEnabled: predefinedModel.thinkingEnabled,
      provider: 'zhipu' as AIProvider,
      apiKey: DEFAULT_API_KEY,
      baseURL: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    };
    console.log('%c🔑 使用默认智谱AI模型 GLM-5', 'color: #FF85A2; font-size: 14px; font-weight: bold');
    console.log('%c🧠 思考模式:', 'color: #B19CD9; font-weight: bold', predefinedModel.thinkingEnabled ? '启用' : '禁用');
  }
}

// 在浏览器控制台显示 API Key 加载状态（用于调试）
if (typeof window !== 'undefined') {
  initializeDefaultModel();
  console.log('%c🔑 API Key 加载状态', 'color: #FF85A2; font-size: 14px; font-weight: bold');
  console.log('%c是否有 Key:', 'color: #B19CD9; font-weight: bold', !!DEFAULT_API_KEY);
  console.log('%cKey 长度:', 'color: #B19CD9; font-weight: bold', DEFAULT_API_KEY?.length || 0);
  console.log('%cKey 前缀:', 'color: #B19CD9; font-weight: bold', DEFAULT_API_KEY?.substring(0, 10) + '...');
  console.log('%c当前模型:', 'color: #B19CD9; font-weight: bold', currentModel ? '已设置' : '未设置');
}

/**
 * 设置当前使用的模型
 */
export function setCurrentModel(model: ModelConfig) {
  currentModel = model;
  console.log('%c🔄 切换模型:', 'color: #FF85A2; font-size: 14px; font-weight: bold', model.name);
}

/**
 * 获取当前模型
 */
export function getCurrentModel(): ModelConfig | null {
  if (!currentModel) {
    initializeDefaultModel();
  }
  return currentModel;
}

export function loadWebSearchConfig(): WebSearchConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_WEB_SEARCH_CONFIG };
  try {
    const stored = localStorage.getItem(WEB_SEARCH_CONFIG_KEY);
    if (!stored) return { ...DEFAULT_WEB_SEARCH_CONFIG };
    const parsed = JSON.parse(stored) as Partial<WebSearchConfig>;
    return {
      enabled: !!parsed.enabled,
      searchEngine: parsed.searchEngine === 'search_std' ? 'search_std' : 'search_pro',
      count: Math.min(50, Math.max(1, Number(parsed.count) || DEFAULT_WEB_SEARCH_CONFIG.count)),
      searchDomainFilter: String(parsed.searchDomainFilter || '').trim(),
      searchRecencyFilter: ['noLimit', '1d', '1w', '1m', '1y'].includes(String(parsed.searchRecencyFilter))
        ? (parsed.searchRecencyFilter as WebSearchConfig['searchRecencyFilter'])
        : 'noLimit',
      contentSize: ['low', 'medium', 'high'].includes(String(parsed.contentSize))
        ? (parsed.contentSize as WebSearchConfig['contentSize'])
        : 'high',
      searchPrompt: String(parsed.searchPrompt || '').trim(),
    };
  } catch {
    return { ...DEFAULT_WEB_SEARCH_CONFIG };
  }
}

export function saveWebSearchConfig(config: WebSearchConfig) {
  if (typeof window === 'undefined') return;
  const normalized: WebSearchConfig = {
    enabled: !!config.enabled,
    searchEngine: config.searchEngine === 'search_std' ? 'search_std' : 'search_pro',
    count: Math.min(50, Math.max(1, Number(config.count) || DEFAULT_WEB_SEARCH_CONFIG.count)),
    searchDomainFilter: String(config.searchDomainFilter || '').trim(),
    searchRecencyFilter: ['noLimit', '1d', '1w', '1m', '1y'].includes(String(config.searchRecencyFilter))
      ? config.searchRecencyFilter
      : 'noLimit',
    contentSize: ['low', 'medium', 'high'].includes(String(config.contentSize))
      ? config.contentSize
      : 'high',
    searchPrompt: String(config.searchPrompt || '').trim(),
  };
  webSearchConfigCache = normalized;
  localStorage.setItem(WEB_SEARCH_CONFIG_KEY, JSON.stringify(normalized));
}

function getWebSearchConfig(): WebSearchConfig {
  if (!webSearchConfigCache) webSearchConfigCache = loadWebSearchConfig();
  return webSearchConfigCache;
}

/**
 * 构建 API 请求头
 */
function buildHeaders(model: ModelConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  switch (model.provider) {
    case 'zhipu':
      headers['Authorization'] = `Bearer ${model.apiKey}`;
      break;
    case 'openai':
      headers['Authorization'] = `Bearer ${model.apiKey}`;
      break;
    case 'anthropic':
      headers['x-api-key'] = model.apiKey;
      headers['anthropic-version'] = '2023-06-01';
      break;
    case 'deepseek':
      headers['Authorization'] = `Bearer ${model.apiKey}`;
      break;
    case 'aihubmix':
      headers['Authorization'] = `Bearer ${model.apiKey}`;
      break;
    case 'minimax':
      headers['Authorization'] = `Bearer ${model.apiKey}`;
      break;
  }

  return headers;
}

/**
 * 构建 API 请求体
 */
interface RequestBuildOptions {
  maxTokens?: number;
  searchQuery?: string;
  webSearchConfig?: WebSearchConfig;
  forceDisableWebSearch?: boolean;
  stream?: boolean;
  toolStream?: boolean;
  signal?: AbortSignal;
}

function shouldTryWebSearch(model: ModelConfig, config: WebSearchConfig): boolean {
  if (!config.enabled) return false;
  if (runtimeUnsupportedProviders.has(model.provider)) return false;
  return WEB_SEARCH_PROVIDER_SUPPORT[model.provider] === true;
}

function shouldTryTextStream(model: ModelConfig): boolean {
  if (runtimeUnsupportedStreamProviders.has(model.provider)) return false;
  return STREAM_PROVIDER_SUPPORT[model.provider] === true;
}

interface WebSearchTool {
  type: 'web_search';
  web_search: {
    search_engine: WebSearchConfig['searchEngine'];
    search_query: string;
    search_result: boolean;
    count: number;
    search_recency_filter: WebSearchConfig['searchRecencyFilter'];
    content_size: WebSearchConfig['contentSize'];
    search_domain_filter?: string;
    search_prompt?: string;
  };
}

function buildWebSearchTool(config: WebSearchConfig, searchQuery: string) {
  const tool: WebSearchTool = {
    type: 'web_search',
    web_search: {
      search_engine: config.searchEngine,
      search_query: searchQuery,
      search_result: true,
      count: Math.min(50, Math.max(1, config.count)),
      search_recency_filter: config.searchRecencyFilter,
      content_size: config.contentSize,
    },
  };
  if (config.searchDomainFilter) tool.web_search.search_domain_filter = config.searchDomainFilter;
  if (config.searchPrompt) tool.web_search.search_prompt = config.searchPrompt;
  return tool;
}

function buildRequestBody(model: ModelConfig, prompt: string, options: RequestBuildOptions = {}) {
  // 根据不同提供商调整 max_tokens
  let adjustedMaxTokens = model.maxTokens || options.maxTokens || 65536;

  if (model.provider === 'zhipu') {
    // 智谱 AI 的 max_tokens 最大值为 32768
    adjustedMaxTokens = Math.min(adjustedMaxTokens, 32768);
  }

  const body: Record<string, unknown> = {
    model: model.model,
    max_tokens: adjustedMaxTokens,
    temperature: FIXED_MODEL_TEMPERATURE,
  };

  if (model.provider === 'anthropic') {
    // Anthropic 使用不同的消息格式
    body.messages = [{ role: 'user', content: prompt }];
  } else if (model.provider === 'zhipu') {
    // 智谱 AI - 根据用户配置决定是否启用思考模式
    body.messages = [{ role: 'user', content: prompt }];
    // 只有当模型支持思考模式且用户启用时才启用
    if (model.supportsThinking && model.thinkingEnabled) {
      body.thinking = { type: 'enabled' };
    } else {
      body.thinking = { type: 'disabled' };
    }
  } else {
    // OpenAI 格式（DeepSeek、Aihubmix 也兼容）
    body.messages = [{ role: 'user', content: prompt }];
  }

  const searchConfig = options.webSearchConfig || getWebSearchConfig();
  const canSearch = !options.forceDisableWebSearch && shouldTryWebSearch(model, searchConfig);
  if (canSearch) body.tools = [buildWebSearchTool(searchConfig, options.searchQuery || prompt)];
  if (options.stream) body.stream = true;
  if (options.stream && options.toolStream) body.tool_stream = true;

  return body;
}

interface RequestAnswerResult {
  content: string;
  sources: QuerySource[];
  webSearchAttempted: boolean;
  webSearchFallback: boolean;
  streamFallback?: boolean;
}

export interface QueryStreamHandlers {
  onDelta?: (deltaText: string) => void;
}

export interface QueryStreamOptions {
  signal?: AbortSignal;
}

function isWebSearchUnsupported(status: number, errorText: string): boolean {
  if (status < 400) return false;
  const text = errorText.toLowerCase();
  return (
    text.includes('web_search') ||
    text.includes('tools') ||
    text.includes('tool') ||
    text.includes('unsupported') ||
    text.includes('unknown field') ||
    text.includes('invalid parameter')
  );
}

function normalizeSources(input: unknown): QuerySource[] {
  if (!Array.isArray(input)) return [];
  const dedup = new Map<string, QuerySource>();
  for (const item of input) {
    if (!item || typeof item !== 'object') continue;
    const sourceItem = item as Record<string, unknown>;
    const url = String(sourceItem.url || sourceItem.link || sourceItem.source || '').trim();
    if (!url) continue;
    const source: QuerySource = {
      title: String(sourceItem.title || sourceItem.name || '').trim() || undefined,
      url,
      publishedAt: String(
        sourceItem.published_at || sourceItem.published_time || sourceItem.time || sourceItem.date || ''
      ).trim() || undefined,
    };
    if (!dedup.has(url)) dedup.set(url, source);
  }
  return Array.from(dedup.values());
}

function getNestedValue(input: unknown, path: Array<string | number>): unknown {
  let current: unknown = input;
  for (const key of path) {
    if (typeof key === 'number') {
      if (!Array.isArray(current) || key >= current.length) return undefined;
      current = current[key];
      continue;
    }
    if (!current || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function extractSourcesFromResponse(data: unknown): QuerySource[] {
  const candidates = [
    getNestedValue(data, ['web_search', 'search_result']),
    getNestedValue(data, ['search_result']),
    getNestedValue(data, ['references']),
    getNestedValue(data, ['choices', 0, 'message', 'search_result']),
    getNestedValue(data, ['choices', 0, 'message', 'references']),
    getNestedValue(data, ['choices', 0, 'message', 'tool_calls', 0, 'web_search', 'search_result']),
    getNestedValue(data, ['choices', 0, 'message', 'tool_calls', 0, 'search_result']),
  ];
  for (const candidate of candidates) {
    const parsed = normalizeSources(candidate);
    if (parsed.length > 0) return parsed;
  }
  return [];
}

function extractContentFromResponse(model: ModelConfig, data: unknown): string {
  if (model.provider === 'anthropic') return String(getNestedValue(data, ['content', 0, 'text']) || '').trim();
  return String(getNestedValue(data, ['choices', 0, 'message', 'content']) || '').trim();
}

async function requestWithOptionalWebSearch(
  model: ModelConfig,
  prompt: string,
  label: string,
  options: RequestBuildOptions = {}
): Promise<RequestAnswerResult> {
  const config = options.webSearchConfig || getWebSearchConfig();
  const webSearchAttempted = shouldTryWebSearch(model, config) && !options.forceDisableWebSearch;
  const firstBody = buildRequestBody(model, prompt, options);
  let response = await fetch(model.baseURL, {
    method: 'POST',
    headers: buildHeaders(model),
    body: JSON.stringify(firstBody),
    signal: options.signal,
  });

  let webSearchFallback = false;
  if (!response.ok) {
    const errorText = await response.text();
    if (webSearchAttempted && isWebSearchUnsupported(response.status, errorText)) {
      runtimeUnsupportedProviders.add(model.provider);
      webSearchFallback = true;
      const retryBody = buildRequestBody(model, prompt, { ...options, forceDisableWebSearch: true });
      response = await fetch(model.baseURL, {
        method: 'POST',
        headers: buildHeaders(model),
        body: JSON.stringify(retryBody),
        signal: options.signal,
      });
      if (!response.ok) {
        const retryError = await response.text();
        console.error(`❌ ${label} API 错误:`, retryError);
        throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
      }
    } else {
      console.error(`❌ ${label} API 错误:`, errorText);
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }
  }

  const data = await response.json();
  return {
    content: extractContentFromResponse(model, data),
    sources: extractSourcesFromResponse(data),
    webSearchAttempted,
    webSearchFallback,
  };
}

function isStreamUnsupported(status: number, errorText: string): boolean {
  if (status < 400) return false;
  const text = errorText.toLowerCase();
  return (
    text.includes('stream') ||
    text.includes('tool_stream') ||
    text.includes('not support stream') ||
    text.includes('unsupported')
  );
}

async function consumeStreamedText(
  response: Response,
  handlers?: QueryStreamHandlers,
  signal?: AbortSignal
): Promise<string> {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fullText = '';
  while (true) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const parsed = JSON.parse(payload) as unknown;
        const delta = String(getNestedValue(parsed, ['choices', 0, 'delta', 'content']) || '');
        if (!delta) continue;
        fullText += delta;
        handlers?.onDelta?.(delta);
      } catch {
        // Ignore malformed stream chunks and keep reading.
      }
    }
  }
  return fullText;
}

async function requestWithOptionalWebSearchStream(
  model: ModelConfig,
  prompt: string,
  label: string,
  handlers?: QueryStreamHandlers,
  options: RequestBuildOptions = {}
): Promise<RequestAnswerResult> {
  const config = options.webSearchConfig || getWebSearchConfig();
  const webSearchAttempted = shouldTryWebSearch(model, config) && !options.forceDisableWebSearch;
  const firstBody = buildRequestBody(model, prompt, { ...options, stream: true, toolStream: false });
  let response = await fetch(model.baseURL, {
    method: 'POST',
    headers: buildHeaders(model),
    body: JSON.stringify(firstBody),
    signal: options.signal,
  });

  let webSearchFallback = false;
  if (!response.ok) {
    const errorText = await response.text();
    if (webSearchAttempted && isWebSearchUnsupported(response.status, errorText)) {
      runtimeUnsupportedProviders.add(model.provider);
      webSearchFallback = true;
      const retryBody = buildRequestBody(model, prompt, { ...options, forceDisableWebSearch: true, stream: true, toolStream: false });
      response = await fetch(model.baseURL, {
        method: 'POST',
        headers: buildHeaders(model),
        body: JSON.stringify(retryBody),
        signal: options.signal,
      });
      if (!response.ok) {
        const retryError = await response.text();
        if (isStreamUnsupported(response.status, retryError)) {
          runtimeUnsupportedStreamProviders.add(model.provider);
          const fallbackResult = await requestWithOptionalWebSearch(model, prompt, label, {
            ...options,
            forceDisableWebSearch: true,
          });
          handlers?.onDelta?.(fallbackResult.content);
          return { ...fallbackResult, streamFallback: true, webSearchFallback: true };
        }
        console.error(`❌ ${label} API 错误:`, retryError);
        throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
      }
    } else if (isStreamUnsupported(response.status, errorText)) {
      runtimeUnsupportedStreamProviders.add(model.provider);
      const fallbackResult = await requestWithOptionalWebSearch(model, prompt, label, options);
      handlers?.onDelta?.(fallbackResult.content);
      return { ...fallbackResult, streamFallback: true };
    } else {
      console.error(`❌ ${label} API 错误:`, errorText);
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }
  }

  const content = await consumeStreamedText(response, handlers, options.signal);
  return {
    content: String(content || '').trim(),
    sources: [],
    webSearchAttempted,
    webSearchFallback,
    streamFallback: false,
  };
}

/**
 * 调用 AI API 拆解任务（支持多模型）
 */
export async function breakdownTask(request: BreakdownRequest): Promise<BreakdownResponse> {
  const { task, goal, spicyLevel, existingTasks = [] } = request;

  // 获取当前模型
  const model = getCurrentModel();

  console.log('%c🔍 开始拆解任务', 'color: #FF85A2; font-size: 14px; font-weight: bold');
  console.log('%c任务信息:', 'color: #B19CD9; font-weight: bold', { task, goal, spicyLevel, model: model?.name });
  console.log('%c已有任务:', 'color: #B19CD9; font-weight: bold', existingTasks);

  // 检查模型配置
  if (!model) {
    console.error('%c❌ 模型未配置！', 'color: #FF5C8D; font-size: 16px; font-weight: bold');
    throw new Error('未配置 AI 模型，请在设置中配置模型和 API Key');
  }

  console.log('%c✅ 使用模型:', 'color: #98D8C8; font-size: 14px; font-weight: bold', model.name);

  try {
    // 根据 spicyLevel 确定拆解的详细程度
    const subtaskCount = spicyLevel * 2; // 难度 1-5 对应 2-10 个子任务

    // 构建已有任务上下文
    let existingTasksContext = '';
    if (existingTasks.length > 0) {
      existingTasksContext = `
【重要】已有任务列表（请避免拆解出重复的任务）：
${existingTasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}

请确保拆解的子任务与上述已有任务不重复，如果发现相似的已经存在，请跳过或调整方向。
`;
    }

    const prompt = `请帮我将以下任务拆解为具体的、可执行的子任务。

任务标题：${task}
${goal ? `任务目标：${goal}` : ''}
${existingTasksContext}
要求：
1. 拆解为 ${subtaskCount} 个左右的子任务
2. 每个子任务要具体、可执行
3. 子任务之间要有逻辑顺序
4. 为每个子任务添加简短描述
5. 【重要】子任务标题必须与已有任务列表中的任务不同，避免重复

请以 JSON 格式返回，格式如下：
{
  "subtasks": [
    {
      "title": "子任务标题",
      "description": "子任务描述",
      "completed": false
    }
  ]
}`;

    console.log('%c📤 发送请求到 AI API...', 'color: #87CEEB; font-size: 14px; font-weight: bold');
    console.log('%c请求 URL:', 'color: #B19CD9; font-weight: bold', model.baseURL);

    const requestBody = buildRequestBody(model, prompt);
    console.log('%c📋 请求体:', 'color: #FFE48A; font-weight: bold', JSON.stringify(requestBody, null, 2));

    const result = await requestWithOptionalWebSearch(model, prompt, '任务拆解', { searchQuery: task });
    console.log('%c✅ API 调用成功', 'color: #98D8C8; font-size: 14px; font-weight: bold');
    if (result.webSearchFallback) {
      console.warn('%c⚠️ 联网工具不受支持，已自动降级为普通请求', 'color: #FFE48A; font-weight: bold');
    }
    let content = result.content;

    // 移除可能的 markdown 代码块标记
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    console.log('%c解析后的内容:', 'color: #B19CD9; font-weight: bold', content);

    // 解析 JSON
    const parsed = JSON.parse(content);

    // 验证返回的数据格式
    if (!parsed.subtasks || !Array.isArray(parsed.subtasks)) {
      console.error('%c❌ AI 返回的数据格式不正确', 'color: #FF5C8D; font-size: 16px; font-weight: bold');
      throw new Error('AI 返回的数据格式不正确');
    }

    console.log('%c✨ 拆解完成', 'color: #FFE48A; font-size: 14px; font-weight: bold', `生成了 ${parsed.subtasks.length} 个子任务`);
    console.log('%c子任务列表:', 'color: #B19CD9; font-weight: bold', parsed.subtasks);
    return parsed;
  } catch (error) {
    console.error('%c❌ 任务拆解失败', 'color: #FF5C8D; font-size: 16px; font-weight: bold', error);
    throw error;
  }
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * AI 解答请求参数
 */
interface ConsultRequest {
  task: string;
  description?: string;
}

/**
 * AI 解答响应
 */
interface ConsultResponse {
  answer: string;
}

export interface QueryActionRequest {
  actionId: string;
  term: string;
  concept?: string;
  termDefinition?: string;
  followupQuestion?: string;
  history?: QueryChatMessage[];
}

interface KnowledgeQueryResponse {
  answer: string;
  sources: QuerySource[];
  sourceNotice?: string;
}

interface ExamAngleQueryResponse {
  answer: string;
  sources: QuerySource[];
  sourceNotice?: string;
}

export interface QueryChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: QuerySource[];
  sourceNotice?: string;
}

function buildChatHistoryText(messages: QueryChatMessage[]): string {
  const recent = messages.slice(-6);
  if (recent.length === 0) return '无';
  return recent.map((item) => `${item.role === 'user' ? '用户' : '助手'}: ${item.content}`).join('\n');
}

function buildActionPrompt(request: QueryActionRequest): string {
  const { actionId, term, concept, termDefinition, followupQuestion, history = [] } = request;
  const templates = loadPromptTemplates();
  const action = templates.queryActions.find((item) => item.id === actionId) || templates.queryActions[0];
  const template = followupQuestion ? action.followupTemplate : action.queryTemplate;
  const variables = {
    term,
    concept: concept || '',
    termDefinition: termDefinition || '',
    targetConcept: concept || term,
    followupQuestion: followupQuestion || '',
    chatHistory: buildChatHistoryText(history),
  };
  return renderPromptTemplate(template, variables);
}

function buildKnowledgePrompt(request: QueryActionRequest): string {
  return buildActionPrompt({
    ...request,
    actionId: request.actionId || QUERY_ACTION_KNOWLEDGE,
  });
}

function buildExamAnglePrompt(request: QueryActionRequest): string {
  return buildActionPrompt({
    ...request,
    actionId: request.actionId || QUERY_ACTION_EXAM_ANGLE,
  });
}

function buildActionLabel(actionId: string): string {
  const action = loadPromptTemplates().queryActions.find((item) => item.id === actionId);
  return action?.label || '查询';
}

function buildPromptFromAction(request: QueryActionRequest): string {
  const { actionId } = request;
  if (actionId === QUERY_ACTION_KNOWLEDGE) return buildKnowledgePrompt(request);
  if (actionId === QUERY_ACTION_EXAM_ANGLE) return buildExamAnglePrompt(request);
  return buildActionPrompt(request);
}

/**
 * 调用 AI API 获取任务解答/说明（支持多模型）
 */
export async function consultAI(request: ConsultRequest): Promise<ConsultResponse> {
  const { task, description } = request;

  // 获取当前模型
  const model = getCurrentModel();

  // 检查模型配置
  if (!model) {
    throw new Error('未配置 AI 模型，请在设置中配置模型和 API Key');
  }

  try {
    // 从任务标题中提取核心知识点
    // 例如："掌握操作系统的基本结构" -> "操作系统的基本结构"
    const extractCoreTopic = (title: string): string => {
      // 移除常见的动作前缀
      const prefixes = [
        '学习', '掌握', '了解', '研究', '实践', '练习',
        '阅读', '总结', '安装', '配置', '实现', '完成',
        '尝试', '探索', '深入', '理解', '分析', '设计'
      ];

      let topic = title.trim();

      // 尝试移除前缀
      for (const prefix of prefixes) {
        if (topic.startsWith(prefix)) {
          topic = topic.substring(prefix.length);
          break;
        }
      }

      // 移除常见的后缀
      const suffixes = ['（可选）', '（必选）', '等', '等等'];
      for (const suffix of suffixes) {
        topic = topic.replace(suffix, '');
      }

      return topic.trim();
    };

    const coreTopic = extractCoreTopic(task);

    const prompt = `请对以下知识点进行详细的讲解和说明：

知识点：${coreTopic}
${description ? `补充说明：${description}` : ''}

请提供：
1. 这个知识点是什么（定义和概念）
2. 核心内容和要点
3. 关键细节和注意事项
4. 实际应用场景或示例
5. 学习建议和资源推荐

请以清晰、友好、详细的语气回答，帮助用户深入理解这个知识点。使用emoji让回答更生动有趣。`;

    console.log('📤 发送 AI 解答请求...', model.name);

    const result = await requestWithOptionalWebSearch(model, prompt, 'AI 解答', { searchQuery: coreTopic });
    const answer = result.content;

    console.log('✅ AI 解答完成');
    if (result.webSearchFallback) console.warn('⚠️ 联网工具不受支持，已自动降级为普通请求');
    return { answer };
  } catch (error) {
    console.error('❌ AI 解答失败:', error);
    throw error;
  }
}

/**
 * 查询术语相关考点（直接返回 AI 原文，不做分条解析）
 */
export async function queryKnowledgeAI(request: QueryActionRequest): Promise<KnowledgeQueryResponse> {
  const { term } = request;
  const model = getCurrentModel();

  if (!model) {
    throw new Error('未配置 AI 模型，请在设置中配置模型和 API Key');
  }

  try {
    const prompt = buildKnowledgePrompt(request);
    const result = await requestQueryAnswer(model, prompt, '考点查询', term);
    return result;
  } catch (error) {
    console.error('❌ 查询考点失败:', error);
    throw error;
  }
}

/**
 * 查询术语/概念的考研出题角度（直接返回 AI 原文）
 */
export async function queryExamAnglesAI(request: QueryActionRequest): Promise<ExamAngleQueryResponse> {
  const { term } = request;
  const model = getCurrentModel();

  if (!model) {
    throw new Error('未配置 AI 模型，请在设置中配置模型和 API Key');
  }

  try {
    const prompt = buildExamAnglePrompt(request);
    const result = await requestQueryAnswer(model, prompt, '出题角度查询', term);
    return result;
  } catch (error) {
    console.error('❌ 查询出题角度失败:', error);
    throw error;
  }
}

export async function streamKnowledgeFollowupAI(
  request: QueryActionRequest,
  handlers?: QueryStreamHandlers,
  options?: QueryStreamOptions
): Promise<KnowledgeQueryResponse> {
  const mergedRequest = { ...request, actionId: request.actionId || QUERY_ACTION_KNOWLEDGE };
  const { term } = mergedRequest;
  const model = getCurrentModel();
  if (!model) throw new Error('未配置 AI 模型，请在设置中配置模型和 API Key');
  const prompt = buildPromptFromAction(mergedRequest);
  return requestQueryAnswerStreaming(model, prompt, `${buildActionLabel(mergedRequest.actionId)}追问`, term, handlers, options);
}

export async function streamQueryActionAI(
  request: QueryActionRequest,
  handlers?: QueryStreamHandlers,
  options?: QueryStreamOptions
): Promise<KnowledgeQueryResponse> {
  const { term } = request;
  const model = getCurrentModel();
  if (!model) throw new Error('未配置 AI 模型，请在设置中配置模型和 API Key');
  const prompt = buildPromptFromAction(request);
  return requestQueryAnswerStreaming(model, prompt, `${buildActionLabel(request.actionId)}追问`, term, handlers, options);
}

export async function streamExamAngleFollowupAI(
  request: QueryActionRequest,
  handlers?: QueryStreamHandlers,
  options?: QueryStreamOptions
): Promise<ExamAngleQueryResponse> {
  return streamQueryActionAI({ ...request, actionId: request.actionId || QUERY_ACTION_EXAM_ANGLE }, handlers, options);
}

async function requestQueryAnswer(
  model: ModelConfig,
  prompt: string,
  label: string,
  searchQuery: string
): Promise<KnowledgeQueryResponse> {
  const result = await requestWithOptionalWebSearch(model, prompt, label, { searchQuery });
  const answer = String(result.content || '').trim();
  const sourceNotice = result.webSearchAttempted && result.sources.length === 0
    ? '联网已开启，但本次未获取到可追溯来源。'
    : result.webSearchFallback
      ? '当前模型不支持联网工具，已自动降级为普通回答。'
      : undefined;
  return { answer, sources: result.sources, sourceNotice };
}

async function requestQueryAnswerStreaming(
  model: ModelConfig,
  prompt: string,
  label: string,
  searchQuery: string,
  handlers?: QueryStreamHandlers,
  options?: QueryStreamOptions
): Promise<KnowledgeQueryResponse> {
  const canStream = shouldTryTextStream(model);
  const result = canStream
    ? await requestWithOptionalWebSearchStream(model, prompt, label, handlers, { searchQuery, signal: options?.signal })
    : await requestWithOptionalWebSearch(model, prompt, label, { searchQuery, signal: options?.signal });
  const answer = String(result.content || '').trim();
  if (!canStream) handlers?.onDelta?.(answer);
  const sourceNotice = result.streamFallback
    ? '当前模型不支持流式输出，已自动降级为普通回答。'
    : result.webSearchAttempted && result.sources.length === 0
      ? '联网已开启，但本次未获取到可追溯来源。'
      : result.webSearchFallback
        ? '当前模型不支持联网工具，已自动降级为普通回答。'
        : undefined;
  return { answer, sources: result.sources, sourceNotice };
}

/**
 * 调用 AI API 拆解概念（支持多模型）
 */
export async function breakdownConcept(request: ConceptBreakdownRequest): Promise<ConceptBreakdownResponse> {
  const { concept, existingTerminology = [], existingKnowledgePoints = [], nodePath = [] } = request;

  // 获取当前模型
  const model = getCurrentModel();

  console.log('%c🔍 开始拆解概念', 'color: #FF85A2; font-size: 14px; font-weight: bold');
  console.log('%c概念:', 'color: #B19CD9; font-weight: bold', concept);
  if (nodePath.length > 0) console.log('%c知识树位置:', 'color: #B19CD9; font-weight: bold', nodePath.join(' > '));
  console.log('%c使用模型:', 'color: #B19CD9; font-weight: bold', model?.name);

  // 检查模型配置
  if (!model) {
    console.error('%c❌ 模型未配置！', 'color: #FF5C8D; font-size: 16px; font-weight: bold');
    throw new Error('未配置 AI 模型，请在设置中配置模型和 API Key');
  }

  try {
    const templates = loadPromptTemplates();
    const prompt = renderPromptTemplate(templates.conceptBreakdown, {
      concept,
      existingTerminology: existingTerminology.length > 0 ? existingTerminology.join('、') : '无',
      existingKnowledgePoints: existingKnowledgePoints.length > 0 ? existingKnowledgePoints.join('、') : '无',
      treePosition: nodePath.length > 0 ? nodePath.join(' > ') : `根节点 > ${concept}`,
    });

    console.log('%c📤 发送请求到 AI API...', 'color: #87CEEB; font-size: 14px; font-weight: bold');
    console.log('%c请求 URL:', 'color: #B19CD9; font-weight: bold', model.baseURL);

    const requestBody = buildRequestBody(model, prompt);
    console.log('%c📋 请求体:', 'color: #FFE48A; font-weight: bold', JSON.stringify(requestBody, null, 2));

    const result = await requestWithOptionalWebSearch(model, prompt, '概念拆解', { searchQuery: concept });
    console.log('%c✅ API 调用成功', 'color: #98D8C8; font-size: 14px; font-weight: bold');
    if (result.webSearchFallback) {
      console.warn('%c⚠️ 联网工具不受支持，已自动降级为普通请求', 'color: #FFE48A; font-weight: bold');
    }

    // 解析 AI 返回的内容
    let content = result.content;

    // 移除可能的 markdown 代码块标记
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    console.log('%c解析后的内容:', 'color: #B19CD9; font-weight: bold', content);

    // 解析 JSON
    const parsed = JSON.parse(content) as ConceptBreakdownResponse;

    // 验证返回的数据格式
    if (!parsed.terminology || !Array.isArray(parsed.terminology)) {
      console.error('%c❌ AI 返回的数据格式不正确：缺少 terminology', 'color: #FF5C8D; font-size: 16px; font-weight: bold');
      throw new Error('AI 返回的数据格式不正确：缺少专业术语列表');
    }

    if (!parsed.knowledgePoints || !Array.isArray(parsed.knowledgePoints)) {
      parsed.knowledgePoints = [];
    }

    console.log('%c✨ 拆解完成', 'color: #FFE48A; font-size: 14px; font-weight: bold', `提取了 ${parsed.terminology.length} 个术语`);
    console.log('%c术语列表:', 'color: #B19CD9; font-weight: bold', parsed.terminology);

    return parsed;
  } catch (error) {
    console.error('%c❌ 概念拆解失败', 'color: #FF5C8D; font-size: 16px; font-weight: bold', error);
    throw error;
  }
}
