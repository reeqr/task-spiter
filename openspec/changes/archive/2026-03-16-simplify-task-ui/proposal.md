## Why

当前任务卡片包含难度等级（spicyLevel，1-5 星）和分类标签（category，如"📚 学习"），这些信息在实际使用中较少参考，反而增加了视觉噪音和操作复杂度（输入时需要选择难度）。将每个任务简化为纯标题一行，移除这些辅助字段，可以让界面更简洁、信息密度更高，专注于任务本身。

## What Changes

- **移除难度等级显示**：`TaskItem` 中不再渲染 `Rate` 星级组件，`TaskInput` 中移除难度选择器
- **移除分类标签显示**：`TaskItem` 中不再渲染 `category` Tag
- **数据模型保留**：`Task` 接口的 `spicyLevel` 和 `category` 字段暂时保留（向后兼容已有数据），但前端不再展示和编辑
- **任务卡片极简化**：每条任务仅显示 Checkbox + 标题文字 + 操作按钮，无额外装饰
- **AI 拆解调整**：调用 AI 拆解时使用固定难度值（如 3），不再由用户指定

## Capabilities

### New Capabilities

### Modified Capabilities
- `task-item-layout`：任务卡片布局需求从"显示难度星级和分类标签"变更为"仅标题 + 按钮"

## Impact

- `src/components/TaskItem.tsx`：移除 `Rate`、`Tag` 渲染逻辑
- `src/components/TaskInput.tsx`：移除难度选择器（`spicyLevel` slider/rate）
- `src/App.tsx`：移除 `spicyLevel` state 和传递逻辑，固定传递默认值给 AI 拆解
- `src/types/task.ts`：接口保留 `spicyLevel` 和 `category` 字段（兼容性），但标记为可选或添加注释说明不再使用
- `src/utils/api.ts`：AI 拆解 prompt 中不再强调分类和难度要求
