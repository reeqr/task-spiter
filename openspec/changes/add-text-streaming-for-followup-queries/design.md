## Context

当前概念页面的“解释追问”和“出题角度追问”通过 `queryKnowledgeAI` / `queryExamAnglesAI` 发起一次性请求，前端在请求完成前只显示发送中状态，最终整段文本一次渲染。  
项目已具备统一请求层（`src/utils/api.ts`）与会话弹窗（`src/components/ConceptBreakdownPage.tsx`），但缺少流式读取、增量写入与流式回退机制。

## Goals / Non-Goals

**Goals:**
- 为“解释追问”和“出题角度追问”提供文本流式输出，支持边生成边展示。
- 保留现有非流式链路，作为 provider 或模型不支持时的自动回退路径。
- 复用现有会话状态结构，在最小改动范围内实现占位消息增量更新。

**Non-Goals:**
- 不实现工具调用参数流（`tool_stream`）的可视化展示。
- 不实现来源信息（sources）的流式增量展示，仅在结束时补齐。
- 不扩展到任务拆解、概念拆解等非追问场景。

## Decisions

### Decision 1: 仅在追问场景启用文本流
流式能力先限定在 `followupQuestion` 非空的解释追问与出题角度追问请求。首轮查询继续沿用一次性返回。
**Rationale:** 追问最需要缩短体感等待时间，且改动范围可控。  
**Alternatives considered:** 全量查询都流式，收益更大但回归面更宽。

### Decision 2: 请求层新增流式 API，不替换旧 API
在 `api.ts` 中新增流式函数（如 `streamQueryKnowledgeAI`、`streamQueryExamAnglesAI`）并保留原函数。UI 只在追问时调用流式函数。
**Rationale:** 兼容现有调用方，降低功能回退风险。  
**Alternatives considered:** 直接改原函数为流式，调用方改动少但影响范围不可控。

### Decision 3: UI 使用“占位 assistant 消息 + 末条增量追加”
发送追问后先插入一条空 assistant 消息，流每到一段就追加到该消息 `content`，流结束后关闭 sending 状态。
**Rationale:** 与现有会话数组结构兼容，交互连续且实现简单。  
**Alternatives considered:** 单独维护 streaming buffer 再合并，状态更复杂。

### Decision 4: 不支持流式时自动回退非流式
当 provider 或模型不支持 `stream=true` 或流解析失败时，自动降级到原一次性请求并返回完整结果。
**Rationale:** 保证功能可用优先，避免追问不可用。  
**Alternatives considered:** 直接失败提示，用户体验较差。

## Risks / Trade-offs

- [流式 chunk 解析不稳定] → 采用健壮的 SSE/chunk 解析与缓冲拼接策略。  
- [provider 差异导致兼容问题] → 仅对已知支持模型启用流式，其余自动回退。  
- [状态更新过于频繁] → 采用轻量节流/批量追加策略，避免高频重渲染。  
- [追问中断后消息不完整] → 在异常时保留已生成文本并给出明确提示。

## Migration Plan

1. 先接入请求层流式函数，保持默认追问仍可回退非流式。  
2. 前端追问入口改用流式函数，首轮查询保持不变。  
3. 验证支持模型、非支持模型、异常中断三种路径。  
4. 若出现问题可快速切回原非流式函数调用。

## Open Questions

- 是否需要在 UI 中增加“正在生成中…”光标效果来提升流式感知？  
- 是否需要为长文本流加入手动停止按钮？
