export interface PromptTemplates {
  conceptBreakdown: string;
  knowledgeQuery: string;
}

const PROMPT_TEMPLATES_KEY = 'task_spiter_prompt_templates_v1';

export const DEFAULT_PROMPT_TEMPLATES: PromptTemplates = {
  conceptBreakdown: `请分析以下概念，构建尽可能完整且不重复且具有层次结构的术语体系。

概念：{{concept}}

以下是已经拆解过的内容（请避免重复）：
- 已有术语：{{existingTerminology}}

要求：
1. 只输出专业术语列表
2. 提取相关的专业术语，每个术语包含：
- name: 术语名称（简洁明确）
- definition: 术语定义（建议 28-50 字，尽量单句；在解释术语本身的同时，明确其与“{{concept}}”的关系或作用）
3. 术语集合要尽可能覆盖全面，做到不重不漏：避免同义重复，也避免明显关键术语缺失，且尽量只拆解下面的一层，了解更详解的内容我会用这个术语继续拆解，最后构成一个术语知识树
4. 新输出内容不得与“已经拆解过的内容”重复或仅改写措辞
5. 避免空泛描述，优先使用“用于解释/刻画/分析 {{concept}} 的……”这类关联表达
6. 使用中文回答

请以 JSON 格式返回，格式如下：
{
"terminology": [
{
"name": "术语名称",
"definition": "术语定义"
}
]
}`,
  knowledgeQuery: `什么是{{term}}，解释{{termDefinition}}`,
};

export function loadPromptTemplates(): PromptTemplates {
  try {
    const stored = localStorage.getItem(PROMPT_TEMPLATES_KEY);
    if (!stored) return DEFAULT_PROMPT_TEMPLATES;
    const parsed = JSON.parse(stored) as Partial<PromptTemplates>;
    return {
      conceptBreakdown: parsed.conceptBreakdown || DEFAULT_PROMPT_TEMPLATES.conceptBreakdown,
      knowledgeQuery: parsed.knowledgeQuery || DEFAULT_PROMPT_TEMPLATES.knowledgeQuery,
    };
  } catch {
    return DEFAULT_PROMPT_TEMPLATES;
  }
}

export function savePromptTemplates(templates: PromptTemplates) {
  localStorage.setItem(PROMPT_TEMPLATES_KEY, JSON.stringify(templates));
}

export function renderPromptTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? '');
}

