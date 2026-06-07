## Tasks

### 1. 实现消息数组长度限制
**文件:** `src/components/ConceptBreakdownPage.tsx`

- 在 `handleQueryFollowup` 函数中，追问发送前检查消息数量
- 如果超过 20 条，移除最早的 user+assistant 消息对
- 同时更新传给 API 的 `history` 参数

### 2. 滚动性能优化
**文件:** `src/components/ConceptBreakdownPage.tsx`

- 将 `el.scrollTop = el.scrollHeight` 包装在 `requestAnimationFrame` 中
- 消息更新延迟 50ms 后再执行滚动