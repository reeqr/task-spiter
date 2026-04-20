## Why

当前“查询考点”在术语未拆解时会回退显示全局考点，用户点击不同术语后内容常常不变化，造成“按钮无效”的感知。同时列表项间距偏大、留白较多，单页可见信息密度不足。

## What Changes

- 调整“查询考点”交互：点击术语“考点”按钮时，优先自动拆解该术语并在完成后展示该术语专属考点。
- 增加“查询考点”加载与状态反馈：按钮进入 loading，失败时给出明确提示，避免弹出陈旧或无关内容。
- 优化考点弹窗数据策略：优先显示当前术语子树考点，不再默认回退全局考点。
- 压缩术语/考点列表的项间距、内边距与无关换行，提升单页信息承载量与浏览效率。

## Capabilities

### New Capabilities
- `knowledge-query-autobreakdown`: 点击“考点”时自动拆解并展示术语专属考点的完整交互能力

### Modified Capabilities
- `knowledge-query-button`: 修改考点查询数据来源与交互时序（从“直接查询/全局回退”调整为“自动拆解后展示专属数据”）
- `compact-list-layout`: 进一步压缩列表间距与换行策略，强化单行紧凑展示

## Impact

- 前端组件：`src/components/ConceptBreakdownPage.tsx`、`src/components/TerminologyList.tsx`、`src/components/KnowledgePointList.tsx`
- 状态与树更新：`src/utils/conceptTree.ts`、`src/hooks/useConceptBreakdown.ts`
- 类型与接口约束：`src/types/concept.ts`
- OpenSpec 文档：新增/修改 `knowledge-query-autobreakdown`、`knowledge-query-button`、`compact-list-layout` 相关规格与任务
