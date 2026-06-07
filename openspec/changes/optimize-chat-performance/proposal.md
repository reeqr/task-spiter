## Context

当前概念拆解页面的追问功能在消息数量增多后页面会明显卡顿。问题表现为：

- 追问10+轮后，UI 响应变慢
- 每次发送追问后有明显的渲染延迟
- Modal 滚动和自动定位变卡

## Goals / Non-Goals

**Goals:**
- 解决追问数量多时页面卡顿的问题
- 保持追问功能的正常使用
- 不影响正常（5轮以内）的追问体验

**Non-Goals:**
- 不改变追问的业务逻辑
- 不添加虚拟列表（改动量过大）
- 不改变消息的数据结构
- 不优化 Markdown 渲染（数学公式是刚需）

## Decisions

### 1) 消息数组长度限制

在 `ConceptBreakdownPage.tsx` 中限制 `queryModal.messages` 的长度：

- 保留最近 20 条消息（10轮对话）
- 超出时丢弃最早的 user message 和对应的 assistant response
- 丢弃时同步更新 API 调用用的 history 参数

### 2) 滚动优化

当前 `useEffect` 监听 `queryModal.messages` 每次变化都执行滚动：

- 使用 `requestAnimationFrame` 批量滚动
- 只在用户没有手动滚动时自动滚动
- 新消息到达时延迟 50ms 再滚动，避免渲染未完成

### 3) 实现位置

```
src/components/ConceptBreakdownPage.tsx
├── 消息限制逻辑（handleQueryFollowup 函数内）
└── 滚动优化（useEffect 内）
```

## Risks / Unknowns

- 消息限制可能丢失上下文关键信息（概率低，因为只保留最近 20 条）