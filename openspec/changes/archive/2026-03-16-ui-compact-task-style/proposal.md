## Why

当前每条任务卡片（`TaskItem`）占用空间较多：category 标签、难度星级、标题、描述各占一行，再加上操作按钮区域，导致任务列表在有多条任务时需要大量滚动。整体视觉节奏偏松散，不够紧凑美观，尤其在移动端体验更差。通过压缩布局、合并信息行、统一视觉层次，可以让更多任务同屏可见，同时保持二次元风格的精致感。

## What Changes

- **任务头部布局压缩**：将 category 标签、难度星级和任务标题合并到同一行（inline 布局），减少垂直占用
- **描述默认收起**：`description` 超过 1 行时默认截断，仅展示单行；无描述时不占位
- **操作按钮常驻但紧凑**：按钮缩小为 `small` 尺寸，取消悬停才显示的交互（移动端友好），改为始终可见
- **卡片内边距收紧**：`padding` 从 `16px 20px` 缩减为 `10px 14px`
- **子任务折叠区域**：移除 Ant Design `Collapse` 包裹，改为简单的缩进列表，减少额外视觉层级
- **整体间距统一**：Space `size="middle"` → `size="small"`，卡片间距由 `middle` → `small`

## Capabilities

### New Capabilities

### Modified Capabilities
- `task-item-layout`：任务卡片的视觉布局需求从"宽松多行"变更为"紧凑单行优先"，需要新 delta spec

## Impact

- `src/components/TaskItem.tsx`：主要改动文件，布局、padding、按钮尺寸、Collapse 替换
- `src/App.tsx`：任务列表的 Space `size` 属性调整
- `src/App.css` / `src/index.css`：可能涉及 `.anime-task-card` 相关样式微调
