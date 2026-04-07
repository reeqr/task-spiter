## Context

当前 `TaskItem` 组件使用 Ant Design `Space direction="vertical" size="middle"` 堆叠多个信息行：第一行 category 标签 + 难度星级，第二行任务标题，第三行描述文字，最后是操作按钮区（桌面端悬停才显示）。子任务用 `Collapse` 组件包裹，带额外展开头部。每张卡片 body padding 为 `16px 20px`，卡片间距为 `middle`（16px）。整体在超过 3-4 条任务时需要大量滚动，移动端尤为突出。

## Goals / Non-Goals

**Goals:**
- 将任务标题行与 category/stars 合并为单行（flex row）
- description 截断为 1 行（ellipsis），无描述时零占位
- 操作按钮缩小为 `size="small"`，始终可见（去除 hover-only 逻辑）
- 卡片 padding 从 `16px 20px` → `10px 14px`
- 子任务区域去掉 `Collapse`，改为直接缩进列表
- 任务列表 `Space size` 从 `middle` → `small`

**Non-Goals:**
- 重新设计视觉风格（颜色、字体、圆角保持不变）
- 修改 `TaskInput` 或 `ModelManager` 组件
- 响应式断点重设计

## Decisions

### 决策一：标题行合并方式

**选择**：`flex` 单行布局——左侧 `Checkbox`，中间区域用 `flex row wrap` 放 category Tag + Rate + Title 文字，右侧操作按钮。Tag 和 Rate 使用 `flex-shrink: 0` 防止被挤压，Title 文字 `flex: 1 1 auto` 自然换行（手机端）或单行截断（桌面端）。

**备选**：继续用 `Space direction="vertical"` 但减小 `size`。
**放弃原因**：仅减小间距效果有限，无法把标签/星级和标题压缩到同一行。

---

### 决策二：操作按钮可见性

**选择**：移除 `lg:opacity-0 lg:group-hover:opacity-100` 的 Tailwind 类，按钮始终以 `opacity-100` 显示。

**原因**：移动端没有 hover，按钮完全不可见是 bug 级别的交互问题；桌面端用户也反映需要额外移入才能操作，频次较高时体验差。始终可见的小尺寸按钮视觉噪音可接受。

---

### 决策三：子任务折叠区域

**选择**：移除 Ant Design `Collapse` 组件，改为带 `border-l` 左侧线的普通 `div` + 一个折叠状态的本地 toggle 按钮（已有 `showSubtasks` state）。子任务计数显示在左侧线顶部的小标签里。

**备选**：保留 `Collapse` 但调整样式。
**放弃原因**：`Collapse` 组件自带的 header bar 和 arrow 图标占用额外高度（约 40px），且样式覆盖成本高。直接用原生 div 更轻量，`showSubtasks` toggle 逻辑已有，只需调整渲染结构。

## Risks / Trade-offs

- **按钮始终可见增加视觉噪音** → 使用 `size="small"` + 较低 opacity（如 `opacity-70` hover 变 `opacity-100`）平衡存在感和干扰
- **标题行 flex wrap 在极长标题时可能换行** → 这是预期行为，优于截断导致的信息丢失；Rate 组件设为 `flex-shrink: 0` 避免被压缩变形

## Migration Plan

纯前端 UI 改动，无数据迁移，无 API 变更。直接修改组件文件即可，刷新页面生效。
