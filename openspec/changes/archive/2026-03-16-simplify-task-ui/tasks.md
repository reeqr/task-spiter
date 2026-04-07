## 1. TaskItem 移除星级和标签

- [x] 1.1 移除 `TaskItem` 中渲染 `Rate` 星级组件的代码块
- [x] 1.2 移除 `TaskItem` 中渲染 `category` Tag 的条件判断和 JSX
- [x] 1.3 调整标题行布局，移除星级和标签后只保留 Checkbox + 标题文字
- [x] 1.4 验证任务卡片不再显示任何星级或分类标签

## 2. TaskInput 移除难度选择器

- [x] 2.1 打开 `TaskInput.tsx`，定位难度选择器相关 UI（Rate、Slider 等）
- [x] 2.2 移除难度选择器的渲染逻辑和对应的 state 或 prop
- [x] 2.3 移除 `onSpicyLevelChange` callback 的调用（如果存在）
- [x] 2.4 验证添加任务界面不再显示难度选择器

## 3. App.tsx 固定难度参数

- [x] 3.1 移除 `App.tsx` 中的 `spicyLevel` state（如果存在）
- [x] 3.2 移除 `setSpicyLevel` 和相关的 prop 传递
- [x] 3.3 `handleBreakdown` 调用时硬编码传递 `spicyLevel: 3`
- [x] 3.4 移除 `TaskInput` 的 `spicyLevel` 和 `onSpicyLevelChange` props

## 4. 优化 API Prompt

- [x] 4.1 打开 `src/utils/api.ts`，定位 `breakdownTask` 函数的 prompt 构建部分（约 175-201 行）
- [x] 4.2 移除 prompt 中"为每个子任务分配难度等级（1-5）"的要求（第 5 条）
- [x] 4.3 移除 prompt 中"为每个子任务分配合适的分类"的要求（第 6 条）
- [x] 4.4 简化 JSON 返回格式示例，去掉 `spicyLevel` 和 `category` 字段
- [x] 4.5 调整要求编号，原第 7 条改为第 5 条

## 5. 清理导入和未使用代码

- [x] 5.1 检查 `TaskItem.tsx` 是否还需要 `Rate` 导入，移除未使用的 import
- [x] 5.2 检查 `TaskInput.tsx` 是否有未使用的难度相关 state/props，清理代码
- [x] 5.3 运行 lint 检查未使用变量
