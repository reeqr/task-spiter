## Why

当前“解释”和“出题角度”弹窗只支持单次回答，用户在学习过程中无法围绕同一术语继续追问，导致理解链路被打断。随着术语学习深度增加，需要在原有结果弹窗中提供低摩擦的多轮追问能力。

## What Changes

- 在“解释”与“出题角度”结果弹窗中新增对话输入区，支持在同一弹窗继续追问
- 采用会话流展示（用户提问 + AI 回答），支持连续多轮问答
- 明确交互规则：按 `Enter` 发送消息（发送中禁重复），不额外依赖顶部按钮触发
- 明确会话生命周期：关闭弹窗即清空会话历史与输入缓存
- 会话隔离：解释弹窗与出题角度弹窗分别维护独立上下文，不共享消息

## Capabilities

### New Capabilities
- `query-followup-dialog`: 定义解释/出题角度结果弹窗中的多轮追问能力、发送规则、会话清理与隔离要求

### Modified Capabilities
- `knowledge-query-button`: 将解释结果展示从“单次展示”扩展为“可继续追问的会话式展示”

## Impact

- `src/components/ConceptBreakdownPage.tsx`：扩展两个结果弹窗状态结构，增加会话消息、输入与发送流程
- `src/components/TerminologyList.tsx`：保留现有查询入口，必要时补充按钮状态与可用性联动
- `src/utils/api.ts`：新增/扩展多轮追问接口入参（历史上下文、追问内容、查询类型）
- `src/utils/promptConfig.ts`：扩展追问模板（解释追问、出题角度追问）及默认值
- `src/components/ModelManager.tsx`：新增追问模板编辑项（与现有模板同一配置体系）
