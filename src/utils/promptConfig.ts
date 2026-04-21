export const QUERY_ACTION_KNOWLEDGE = 'knowledge-explain';
export const QUERY_ACTION_EXAM_ANGLE = 'exam-angle';
export const QUERY_ACTION_COMMON_TRAPS = 'common-traps';

export interface QueryActionConfig {
  id: string;
  label: string;
  enabled: boolean;
  sort: number;
  queryTemplate: string;
  followupTemplate: string;
}

export interface PromptTemplates {
  conceptBreakdown: string;
  queryActions: QueryActionConfig[];
}

interface LegacyPromptTemplates {
  conceptBreakdown?: string;
  knowledgeQuery?: string;
  examAngleQuery?: string;
  knowledgeFollowupQuery?: string;
  examAngleFollowupQuery?: string;
}

const PROMPT_TEMPLATES_KEY = 'task_spiter_prompt_templates_v1';

const DEFAULT_QUERY_ACTIONS: QueryActionConfig[] = [
  {
    id: QUERY_ACTION_KNOWLEDGE,
    label: '解释',
    enabled: true,
    sort: 1,
    queryTemplate: '什么是{{term}}，解释{{termDefinition}}',
    followupTemplate: `你正在继续讲解术语“{{term}}”（所属概念：{{concept}}），定义参考：{{termDefinition}}。
以下是最近对话：
{{chatHistory}}

用户最新追问：{{followupQuestion}}

请延续上下文直接回答用户追问，回答要准确、简洁、结构清晰。`,
  },
  {
    id: QUERY_ACTION_EXAM_ANGLE,
    label: '出题角度',
    enabled: true,
    sort: 2,
    queryTemplate: '你是考研命题老师，请围绕术语“{{term}}”（所属概念：{{concept}}）给出可能出题角度，术语定义参考：{{termDefinition}}。',
    followupTemplate: `你正在继续分析术语“{{term}}”（所属概念：{{concept}}）的考研出题角度，定义参考：{{termDefinition}}。
以下是最近对话：
{{chatHistory}}

用户最新追问：{{followupQuestion}}

请基于已有上下文继续回答，聚焦命题思路、常见问法与易错点。`,
  },
  {
    id: QUERY_ACTION_COMMON_TRAPS,
    label: '易错点',
    enabled: true,
    sort: 3,
    queryTemplate: '请围绕术语“{{term}}”（所属概念：{{concept}}）总结常见易错点和混淆点，定义参考：{{termDefinition}}，给出避坑建议。',
    followupTemplate: `你正在继续分析术语“{{term}}”（所属概念：{{concept}}）的常见易错点，定义参考：{{termDefinition}}。
以下是最近对话：
{{chatHistory}}

用户最新追问：{{followupQuestion}}

请继续聚焦易错原因、纠正方法和快速自检要点。`,
  },
];

export const DEFAULT_PROMPT_TEMPLATES: PromptTemplates = {
  conceptBreakdown: `你是“知识架构师”。请将输入概念拆解为“下一层、同粒度、可递归”的术语节点，服务于后续逐节点继续拆解，最终形成知识树。

概念：{{concept}}
当前在知识树中的位置：{{treePosition}}

以下是已经拆解过的内容（禁止重复）：
- 已有术语：{{existingTerminology}}


任务目标：
- 当前仅输出第一层模块，不下钻到细节定理或技巧。
- 结果要覆盖考研{{concept}}主干，适合递归形成知识树。

【分层拆解规则（必须遵守）】
1. 先在内部确定 3-5 个拆解维度，再选择术语（不要输出维度标题）。
2. 所有术语必须处于同一抽象层级，禁止跨层混排（例如“大模块 + 具体技巧”混在一起）。
3. 按依赖关系排序输出：先修/基础 -> 核心机制 -> 关键约束/边界 -> 应用/实践。
4. 不追求一次穷尽全部细节，优先输出主干结构。
5. 输出术语必须同时符合“直接上级语义”和“整条路径语义”，避免只贴合父节点但偏离整棵树方向。

【术语质量规则】
1. 只输出专业术语列表（name + definition）。
2. name：简洁、明确、可区分，避免空泛词（如“方法”“技巧”“优化”这类无上下文名称）。
3. definition：建议 28-50 字，尽量单句；需明确该术语与“{{concept}}”的关系或作用。
4. 禁止与已有术语重复、近义改写、不同表述的同一概念。
5. 避免将步骤、例题、记忆口诀当作术语节点（除非父概念本身是流程体系）。

【边界策略】
1. 若输入概念范围很大（如学科/系统），优先输出“骨架层”术语。
2. 若输入概念范围较小（如单一定理/方法），优先输出“机制与构成层”术语。
3. 如概念存在歧义，默认采用主流语境。

请严格以 JSON 格式返回，不要输出任何额外说明，格式如下：
{
  "terminology": [
    {
      "name": "术语名称",
      "definition": "术语定义"
    }
  ]
}`,
  queryActions: DEFAULT_QUERY_ACTIONS,
};

function cloneDefaultActions(): QueryActionConfig[] {
  return DEFAULT_QUERY_ACTIONS.map((item) => ({ ...item }));
}

function normalizeAction(item: Partial<QueryActionConfig>, index: number): QueryActionConfig {
  const fallback = DEFAULT_QUERY_ACTIONS[index] || DEFAULT_QUERY_ACTIONS[0];
  return {
    id: String(item.id || fallback.id),
    label: String(item.label || fallback.label),
    enabled: true,
    sort: Number.isFinite(Number(item.sort)) ? Number(item.sort) : fallback.sort,
    queryTemplate: String(item.queryTemplate || fallback.queryTemplate),
    followupTemplate: String(item.followupTemplate || fallback.followupTemplate),
  };
}

function buildMigratedActions(parsed: Partial<PromptTemplates> & LegacyPromptTemplates): QueryActionConfig[] {
  const parsedActions = Array.isArray(parsed.queryActions) ? parsed.queryActions : [];
  const hasNewActions = parsedActions.length > 0;
  const currentActions = hasNewActions ? parsedActions.map((item, index) => normalizeAction(item, index)) : cloneDefaultActions();
  if (!hasNewActions) {
    const knowledge = currentActions.find((item) => item.id === QUERY_ACTION_KNOWLEDGE);
    if (knowledge) {
      if (parsed.knowledgeQuery) knowledge.queryTemplate = parsed.knowledgeQuery;
      if (parsed.knowledgeFollowupQuery) knowledge.followupTemplate = parsed.knowledgeFollowupQuery;
    }
    const examAngle = currentActions.find((item) => item.id === QUERY_ACTION_EXAM_ANGLE);
    if (examAngle) {
      if (parsed.examAngleQuery) examAngle.queryTemplate = parsed.examAngleQuery;
      if (parsed.examAngleFollowupQuery) examAngle.followupTemplate = parsed.examAngleFollowupQuery;
    }
  }
  if (!currentActions.some((item) => item.enabled)) currentActions[0].enabled = true;
  return currentActions.sort((a, b) => a.sort - b.sort);
}

export function loadPromptTemplates(): PromptTemplates {
  try {
    const stored = localStorage.getItem(PROMPT_TEMPLATES_KEY);
    if (!stored) {
      return {
        conceptBreakdown: DEFAULT_PROMPT_TEMPLATES.conceptBreakdown,
        queryActions: cloneDefaultActions(),
      };
    }
    const parsed = JSON.parse(stored) as Partial<PromptTemplates> & LegacyPromptTemplates;
    return {
      conceptBreakdown: parsed.conceptBreakdown || DEFAULT_PROMPT_TEMPLATES.conceptBreakdown,
      queryActions: buildMigratedActions(parsed),
    };
  } catch {
    return {
      conceptBreakdown: DEFAULT_PROMPT_TEMPLATES.conceptBreakdown,
      queryActions: cloneDefaultActions(),
    };
  }
}

export function savePromptTemplates(templates: PromptTemplates) {
  const normalized: PromptTemplates = {
    conceptBreakdown: String(templates.conceptBreakdown || DEFAULT_PROMPT_TEMPLATES.conceptBreakdown),
    queryActions: buildMigratedActions(templates).map((item) => ({ ...item, enabled: true })),
  };
  localStorage.setItem(PROMPT_TEMPLATES_KEY, JSON.stringify(normalized));
}

export function getEnabledQueryActions(templates: PromptTemplates): QueryActionConfig[] {
  return templates.queryActions.slice().sort((a, b) => a.sort - b.sort);
}

export function renderPromptTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? '');
}

