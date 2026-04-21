## Why

当前术语区与概念标题区的查询入口是固定文案和固定提示词（如“解释”“出题角度”），无法按不同学习场景灵活切换。为了支持“同一位置多种出题视角”并减少重复改模板成本，需要将查询按钮改为可配置、可扩展的动态动作。

## What Changes

- 将术语项与概念标题区的固定查询按钮改为“动作配置驱动”的多按钮渲染。
- 新增查询动作配置能力，支持为每个按钮设置显示文案、启用状态、排序和对应提示词模板。
- 将首次查询与追问流程统一为按 `actionId` 路由到对应模板，保持多轮对话能力。
- 保持现有流式输出、来源展示、加载状态与错误提示语义不变。

## Capabilities

### New Capabilities
- `query-action-config`: 定义并管理查询动作配置（按钮文案、模板、启用状态、排序）及本地持久化规则。

### Modified Capabilities
- `knowledge-query-button`: 从固定“解释+出题角度”改为按已启用动作动态渲染按钮并触发对应查询。
- `exam-angle-query-button`: 从固定“出题角度”入口改为可由动作配置表达的通用查询入口语义。
- `query-followup-dialog`: 追问会话从固定类型切换为按动作配置隔离上下文并选择对应追问模板。

## Impact

- 受影响代码：`src/components/TerminologyList.tsx`、`src/components/ConceptBreakdownPage.tsx`、`src/utils/promptConfig.ts`、`src/utils/api.ts`、`src/components/ModelManager.tsx`。
- 数据结构影响：提示词模板配置需要扩展为可承载多动作定义与模板映射。
- 兼容性：需要提供默认动作并兼容已有本地存量模板，避免升级后按钮缺失或配置失效。
