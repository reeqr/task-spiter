## Why

当前概念拆解界面将术语和考点作为并列的两个列表展示,占用空间较大且信息密度低。用户希望将考点改为按需查询的方式,同时压缩列表展示以便在一屏内看到更多内容,提升浏览效率。

## What Changes

- 移除独立的"知识考点"列表区域和所有分组标题("专业术语"、"知识考点"等)
- 为每个术语项添加"查询考点"按钮,点击后弹出模态框显示相关考点
- 将列表项从多行卡片压缩为单行展示(术语名称+定义在一行,不截断)
- 修改AI提示词,要求生成更短的术语定义(20-30字以内)
- 减小行间距和卡片内边距
- 移除递归子项中的"专业术语"、"知识考点"分组标题
- 保持递归拆解功能不变

## Capabilities

### New Capabilities
- `compact-list-layout`: 紧凑的单行列表布局,包括压缩行间距和内边距
- `knowledge-query-button`: 为每个术语添加"查询考点"按钮和弹窗展示

### Modified Capabilities
- `concept-breakdown-ui`: 移除考点列表,调整整体布局结构
- `recursive-breakdown-ui`: 适配新的紧凑布局,保持递归功能

## Impact

- 影响文件: `ConceptBreakdownPage.tsx`, `TerminologyList.tsx`, `KnowledgePointList.tsx`
- UI 组件:需要重新设计卡片样式和间距
- API 调用:考点查询改为按需触发,而不是一次性加载
- 用户体验:需要额外点击才能查看考点,但整体浏览效率提升
