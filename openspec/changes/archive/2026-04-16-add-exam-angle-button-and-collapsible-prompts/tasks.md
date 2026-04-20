## 1. 扩展提示词模板与 AI 查询能力

- [x] 1.1 在 `src/utils/promptConfig.ts` 扩展 `PromptTemplates`，新增 `examAngleQuery` 默认模板并兼容历史缓存
- [x] 1.2 在 `src/utils/api.ts` 新增出题角度查询方法，支持 `term/concept/termDefinition` 入参
- [x] 1.3 在模型设置保存与恢复默认逻辑中接入新增模板字段，确保读写一致

## 2. 术语区新增“出题角度”按钮

- [x] 2.1 在 `src/components/TerminologyList.tsx` 增加“出题角度”按钮及独立 loading 状态透传
- [x] 2.2 在 `src/components/ConceptBreakdownPage.tsx` 增加 `handleQueryExamAngles` 查询处理与错误提示
- [x] 2.3 在 `src/components/ConceptBreakdownPage.tsx` 新增出题角度结果弹窗并绑定当前术语上下文

## 3. 提示词编辑面板折叠化

- [x] 3.1 在 `src/components/ModelManager.tsx` 将提示词编辑区改为默认收起、点击展开（accordion）
- [x] 3.2 在折叠面板中新增“出题角度提示词模板”编辑项，并保持原模板可编辑
- [x] 3.3 验证模板折叠后保存/恢复默认/再次打开设置均行为正确

## 4. 回归与体验校验

- [x] 4.1 验证“解释/出题角度/继续拆解”三按钮并列显示且状态互不干扰
- [x] 4.2 验证出题角度查询成功、失败、连续点击不同术语三条路径
- [x] 4.3 验证移动端或窄屏下按钮区域不遮挡、布局可用
