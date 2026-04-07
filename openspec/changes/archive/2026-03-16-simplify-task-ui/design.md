## Context

当前 `Task` 接口包含 `spicyLevel`（1-5难度）和 `category`（分类标签如"📚 学习"）字段，`TaskItem` 组件渲染时会显示 Rate 星级和 Tag 标签，`TaskInput` 组件提供难度选择器。AI 拆解任务时会根据 `spicyLevel` 调整子任务数量和粒度，并生成 `category`。实际使用中发现这些字段使用频率低，且增加了输入负担和视觉复杂度。

## Goals / Non-Goals

**Goals:**
- 移除 `TaskItem` 中 `Rate` 和 `Tag` 的渲染逻辑
- 移除 `TaskInput` 中的难度选择器
- 简化 AI 拆解流程，使用固定难度值（如 3）调用 API
- 数据模型保留 `spicyLevel` 和 `category` 字段（向后兼容已有数据）
- 任务卡片布局退化为 Checkbox + 标题 + 按钮，无额外视觉元素

**Non-Goals:**
- 删除 `Task` 接口中的 `spicyLevel` 和 `category` 字段（避免破坏已有数据）
- 修改后端 API 或数据库 schema
- 影响子任务拆解的功能本身（仅简化参数传递）

## Decisions

### 决策一：数据模型是否删除字段

**选择**：保留 `Task` 接口的 `spicyLevel` 和 `category` 字段，但前端不再使用和展示。

**原因**：已有 localStorage 数据可能包含这些字段，删除类型定义会导致类型错误；保留字段可以平滑迁移，未来如需恢复功能也更简单。

**备选方案**：彻底删除字段 + 数据迁移脚本清理旧数据。  
**放弃原因**：过重，且用户数据在本地无法批量迁移。

---

### 决策二：AI 拆解的默认难度

**选择**：`App.tsx` 中固定传递 `spicyLevel: 3`（中等难度）给 `onBreakdown`。

**原因**：AI 拆解依然需要 `spicyLevel` 参数，传固定值 3 可以保持原有拆解质量（2-10 个子任务），无需用户手动选择。

**备选方案**：完全移除难度参数，AI prompt 中不再使用。  
**放弃原因**：可能影响拆解粒度，需要重新调参 prompt，风险较高。

---

### 决策三：移除 `category` 展示但保留生成

**选择**：AI 拆解时仍生成 `category`，但 `TaskItem` 不渲染。

**原因**：保持 API 返回数据结构不变，避免修改 `utils/api.ts` 的 prompt（prompt 中仍要求分类可以让 AI 更好组织思路）。

**备选方案**：保留 prompt 中的分类和难度生成，仅前端不展示。  
**放弃原因**：既然前端完全不使用，继续让 AI 生成会浪费 token 和推理时间，应彻底简化。

## Risks / Trade-offs

- **已有数据的 `spicyLevel` 和 `category` 成为"僵尸字段"** → 可接受，占用存储极小，未来可选择性清理
- **用户无法再手动指定拆解粒度** → 固定难度 3 覆盖大部分场景，如需调整可在未来恢复或增加"快速拆解 / 详细拆解"二选一开关

## Migration Plan

纯前端改动，无需数据迁移，直接修改组件即可。已有任务的 `spicyLevel` 和 `category` 字段仍会保留在 localStorage 中，不影响展示。
