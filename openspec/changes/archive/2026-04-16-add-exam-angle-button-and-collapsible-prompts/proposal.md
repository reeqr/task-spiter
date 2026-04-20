## Why

当前术语区域只有“解释”入口，缺少“命题视角”的学习辅助，用户无法快速知道考研可能从哪些角度出题。同时模型设置里的提示词编辑区长期铺开，占用较大空间，影响配置效率。需要补充“出题角度”能力并优化提示词编辑面板交互。

## What Changes

- 新增“出题角度”按钮：在术语条目中增加独立按钮，点击后向 AI 查询该术语/概念的考研命题角度
- 新增“出题角度”结果展示：提供加载态、防重复点击、结果弹窗与失败提示
- 新增“出题角度提示词模板”：纳入可编辑模板体系（加载、保存、恢复默认）
- 优化提示词配置 UI：将现有提示词编辑面板改为点击展开（默认收起）以减少占位
- 保持现有“解释/拆解”能力不变，仅增强入口与配置体验

## Capabilities

### New Capabilities
- `exam-angle-query-button`: 提供术语“出题角度”查询入口、调用流程和结果展示规范
- `prompt-template-panel-toggle`: 提供提示词模板面板默认收起、按需展开的交互规范

### Modified Capabilities
- `knowledge-query-button`: 术语操作区新增并列查询入口后，按钮状态与交互优先级规则需要同步扩展

## Impact

- `src/components/TerminologyList.tsx`：新增“出题角度”按钮及状态透传
- `src/components/ConceptBreakdownPage.tsx`：新增出题角度查询处理逻辑与结果弹窗状态
- `src/utils/api.ts`：新增出题角度 AI 查询方法
- `src/utils/promptConfig.ts`：扩展模板类型与默认模板（新增 `examAngleQuery`）
- `src/components/ModelManager.tsx`：提示词编辑面板改为折叠展开，并新增“出题角度模板”编辑项
