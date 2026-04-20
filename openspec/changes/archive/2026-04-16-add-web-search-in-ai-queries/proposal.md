## Why

当前 AI 请求（任务拆解、概念拆解、术语问答）主要依赖模型离线知识与提示词上下文，缺少对最新信息的检索能力。为了提升答案的时效性与可验证性，需要在请求阶段增加统一且可控的联网搜索能力。

## What Changes

- 增加一个全局联网搜索开关，开启后所有 AI 请求默认尝试附带 `web_search` 工具参数。
- 增加联网搜索配置能力，支持搜索条数、来源域名过滤、时间范围过滤等基础参数。
- 在回答中保留来源信息（至少包含链接与时间信息），便于用户追溯与校验。
- 采用“能力表 + 运行时探测”判断 provider 支持性：支持则联网，不支持或失败则自动降级，不中断原有流程。

## Capabilities

### New Capabilities
- `query-web-search-integration`: 为所有 AI 请求提供统一联网搜索开关，并定义支持性判断、降级与来源展示行为。

### Modified Capabilities
- `knowledge-query-button`: 将“查询考点”能力扩展为支持联网增强回答与来源可追溯。
- `concept-breakdown-ui`: 将概念拆解能力扩展为支持全局开关开启时的联网增强与自动降级。

## Impact

- 受影响代码：`src/utils/api.ts`、`src/utils/promptConfig.ts`、`src/components/ModelManager.tsx`、`src/components/ConceptBreakdownPage.tsx`、模型/配置相关类型与 hooks。
- 受影响接口：智谱（或兼容 provider）的 Completion 请求体将新增 `tools.web_search` 可选字段。
- 兼容性影响：对不支持联网工具调用的 provider 保持向后兼容（自动降级）。
