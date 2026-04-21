## Why

当前“解释追问”和“出题角度追问”在等待 AI 返回期间是整段结果一次性显示，用户只能看到加载状态，等待体验较差。为了提升响应体感与可读性，需要先为这两类追问场景引入纯文本流式输出能力。

## What Changes

- 为“解释追问”和“出题角度追问”新增纯文本流式返回能力，支持边生成边展示。
- 保留现有非流式调用链路作为回退路径，确保不支持流式的模型/provider 仍可正常使用。
- 在弹窗会话中引入“占位消息 + 增量追加”的展示机制，流结束后再进入完成态。
- 明确本次范围仅处理文本流，不包含工具调用参数流或来源信息流式增量。

## Capabilities

### New Capabilities
- `followup-text-streaming`: 定义追问场景的文本流式响应与增量渲染行为。

### Modified Capabilities
- `query-followup-dialog`: 追问会话由“整段返回”扩展为支持流式追加与结束态收敛。
- `exam-angle-query-button`: 出题角度追问流程扩展为支持流式输出与兼容回退。

## Impact

- 受影响代码：`src/utils/api.ts`、`src/components/ConceptBreakdownPage.tsx` 及相关类型定义。
- 受影响接口：`chat.completions` 请求将按条件启用 `stream=true`（本次仅文本流）。
- 兼容性策略：provider 或模型不支持流式时自动回退到现有非流式逻辑。
