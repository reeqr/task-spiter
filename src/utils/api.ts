/**
 * AI API 服务 - 用于任务拆解
 *
 * 支持多个 AI 模型提供商
 */

import type { BreakdownRequest, BreakdownResponse } from '../types/task';
import type { ConceptBreakdownRequest, ConceptBreakdownResponse } from '../types/concept';
import type { AIModel, AIProvider } from '../types/model';
import { PREDEFINED_MODELS } from '../types/model';
import { loadPromptTemplates, renderPromptTemplate } from './promptConfig';

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

// 当前使用的模型配置
let currentModel: ModelConfig | null = null;

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
  }

  return headers;
}

/**
 * 构建 API 请求体
 */
function buildRequestBody(model: ModelConfig, prompt: string, maxTokens: number = 65536) {
  // 根据不同提供商调整 max_tokens
  let adjustedMaxTokens = model.maxTokens || maxTokens;

  if (model.provider === 'zhipu') {
    // 智谱 AI 的 max_tokens 最大值为 32768
    adjustedMaxTokens = Math.min(adjustedMaxTokens, 32768);
  }

  const body: any = {
    model: model.model,
    max_tokens: adjustedMaxTokens,
    temperature: model.temperature || 0.7,
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

  return body;
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

    const response = await fetch(model.baseURL, {
      method: 'POST',
      headers: buildHeaders(model),
      body: JSON.stringify(requestBody),
    });

    console.log('%c📥 收到响应', 'color: #87CEEB; font-size: 14px; font-weight: bold', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('%c❌ AI API 错误', 'color: #FF5C8D; font-size: 16px; font-weight: bold', errorText);
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('%c✅ API 调用成功', 'color: #98D8C8; font-size: 14px; font-weight: bold');
    console.log('%c响应数据:', 'color: #B19CD9; font-weight: bold', data);

    // 解析 AI 返回的内容
    let content: string;

    if (model.provider === 'anthropic') {
      // Anthropic 使用不同的响应格式
      content = data.content[0].text;
    } else {
      // OpenAI 格式
      content = data.choices[0].message.content;
    }

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

interface KnowledgeQueryRequest {
  term: string;
  concept?: string;
  termDefinition?: string;
}

interface KnowledgeQueryResponse {
  answer: string;
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

    const response = await fetch(model.baseURL, {
      method: 'POST',
      headers: buildHeaders(model),
      body: JSON.stringify(buildRequestBody(model, prompt)),
    });

    console.log('📥 收到 AI 解答响应:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ AI API 错误:', errorText);
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let answer: string;

    if (model.provider === 'anthropic') {
      answer = data.content[0].text;
    } else {
      answer = data.choices[0].message.content;
    }

    console.log('✅ AI 解答完成');
    return { answer };
  } catch (error) {
    console.error('❌ AI 解答失败:', error);
    throw error;
  }
}

/**
 * 查询术语相关考点（直接返回 AI 原文，不做分条解析）
 */
export async function queryKnowledgeAI(request: KnowledgeQueryRequest): Promise<KnowledgeQueryResponse> {
  const { term, concept, termDefinition } = request;
  const model = getCurrentModel();

  if (!model) {
    throw new Error('未配置 AI 模型，请在设置中配置模型和 API Key');
  }

  try {
    const templates = loadPromptTemplates();
    const prompt = renderPromptTemplate(templates.knowledgeQuery, {
      term,
      concept: concept || '',
      termDefinition: termDefinition || '',
      targetConcept: concept || term,
    });

    const response = await fetch(model.baseURL, {
      method: 'POST',
      headers: buildHeaders(model),
      body: JSON.stringify(buildRequestBody(model, prompt)),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 考点查询 API 错误:', errorText);
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let answer: string;

    if (model.provider === 'anthropic') {
      answer = data.content[0].text;
    } else {
      answer = data.choices[0].message.content;
    }

    return { answer: answer.trim() };
  } catch (error) {
    console.error('❌ 查询考点失败:', error);
    throw error;
  }
}

/**
 * 调用 AI API 拆解概念（支持多模型）
 */
export async function breakdownConcept(request: ConceptBreakdownRequest): Promise<ConceptBreakdownResponse> {
  const { concept, existingTerminology = [], existingKnowledgePoints = [] } = request;

  // 获取当前模型
  const model = getCurrentModel();

  console.log('%c🔍 开始拆解概念', 'color: #FF85A2; font-size: 14px; font-weight: bold');
  console.log('%c概念:', 'color: #B19CD9; font-weight: bold', concept);
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
    });

    console.log('%c📤 发送请求到 AI API...', 'color: #87CEEB; font-size: 14px; font-weight: bold');
    console.log('%c请求 URL:', 'color: #B19CD9; font-weight: bold', model.baseURL);

    const requestBody = buildRequestBody(model, prompt);
    console.log('%c📋 请求体:', 'color: #FFE48A; font-weight: bold', JSON.stringify(requestBody, null, 2));

    const response = await fetch(model.baseURL, {
      method: 'POST',
      headers: buildHeaders(model),
      body: JSON.stringify(requestBody),
    });

    console.log('%c📥 收到响应', 'color: #87CEEB; font-size: 14px; font-weight: bold', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('%c❌ AI API 错误', 'color: #FF5C8D; font-size: 16px; font-weight: bold', errorText);
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('%c✅ API 调用成功', 'color: #98D8C8; font-size: 14px; font-weight: bold');
    console.log('%c响应数据:', 'color: #B19CD9; font-weight: bold', data);

    // 解析 AI 返回的内容
    let content: string;

    if (model.provider === 'anthropic') {
      // Anthropic 使用不同的响应格式
      content = data.content[0].text;
    } else {
      // OpenAI 格式
      content = data.choices[0].message.content;
    }

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
