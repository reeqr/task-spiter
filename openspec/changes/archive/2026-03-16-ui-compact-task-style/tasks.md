## 1. TaskItem 头部布局重构

- [x] 1.1 将任务头部的 `Space direction="vertical"` 改为 `flex row` 单行布局，category Tag、Rate 星级、标题文字水平排列
- [x] 1.2 移除独立的 category + Rate 行，合并到标题同行（使用 `flex wrap` 允许小屏换行）
- [x] 1.3 卡片 body padding 从 `16px 20px` 改为 `10px 14px`
- [x] 1.4 外层 `Space direction="vertical" size="middle"` 改为 `size="small"`

## 2. 描述文字截断

- [x] 2.1 将 `Paragraph ellipsis={{ rows: 2 }}` 改为 `rows: 1`
- [x] 2.2 description 为空时不渲染 `Paragraph` 组件，避免占位空白

## 3. 操作按钮常驻显示

- [x] 3.1 移除操作按钮 `Space` 上的 `opacity-0 group-hover:opacity-100` Tailwind 类，改为始终 `opacity-100`
- [x] 3.2 所有操作按钮（AI解答、AI拆解、展开/收起、编辑、删除）添加 `size="small"` prop
- [x] 3.3 删除 `Card` 上多余的 `group` class（用于 hover 触发，不再需要）

## 4. 子任务区域去 Collapse

- [x] 4.1 移除 `Collapse` 组件及其 `items` 配置
- [x] 4.2 改为带 `border-l-2` 左竖线的普通 `div`，在顶部渲染"📋 子任务 (N)"小文字标签
- [x] 4.3 复用已有的 `showSubtasks` 本地 state 控制列表显隐

## 5. 任务列表间距

- [x] 5.1 `App.tsx` 中任务列表的 `Space size="middle"` 改为 `size="small"`
