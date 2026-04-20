## Context

当前术语行已经有“解释”和“继续拆解”交互，但缺少“命题视角”入口，用户无法直接获取“考研命题者会从哪些角度考”这类高价值信息。与此同时，模型管理中的提示词编辑区默认展开，信息密度高、占位大，影响日常配置效率。

本次变更同时涉及术语操作区、AI 查询流程、提示词模板配置与设置面板交互，属于跨组件联动改造，需要先统一交互与数据流。

## Goals / Non-Goals

**Goals:**
- 在术语行新增“出题角度”按钮，支持独立 loading 状态、防重复点击与结果弹窗
- 增加“出题角度”提示词模板，纳入现有模板加载/保存/恢复默认流程
- 将提示词编辑区改为默认收起、点击展开，减少设置页占位
- 保持“解释/继续拆解”现有行为不回退，按钮间状态互不干扰

**Non-Goals:**
- 不实现完整题库生成、做题判分或错题本功能
- 不引入新后端服务，仍使用现有前端直连模型方式
- 不改造全站设置页布局，仅针对提示词编辑区交互优化

## Decisions

### 1) 出题角度查询复用现有术语查询模式
- **Decision**: 在 `ConceptBreakdownPage` 中新增 `handleQueryExamAngles` 与独立 modal state，沿用“解释”按钮的请求与展示模式
- **Rationale**: 复用已验证的交互路径，能最低成本确保稳定性与一致体验
- **Alternative Considered**: 在 `TerminologyList` 内直接发请求；缺点是业务逻辑分散，不利于维护

### 2) 提示词模板体系新增字段，不新建独立配置中心
- **Decision**: 在 `PromptTemplates` 中新增 `examAngleQuery`，并扩展默认模板与保存逻辑
- **Rationale**: 与现有 `conceptBreakdown`、`knowledgeQuery` 形成同构结构，学习成本低
- **Alternative Considered**: 单独 localStorage key；缺点是配置分裂、恢复默认复杂

### 3) 提示词编辑区使用折叠面板（默认收起）
- **Decision**: 在 `ModelManager` 用 `Collapse`（accordion）承载模板编辑项，进入设置时默认不展开
- **Rationale**: 明显降低首屏占位，点击后再展开符合“按需编辑”场景
- **Alternative Considered**: 继续平铺 + 减少高度；缺点是信息噪音仍高

### 4) 按钮并列策略采用“解释 + 出题角度 + 继续拆解”
- **Decision**: 在术语操作区新增第三按钮，并确保“解释”和“出题角度”有各自 loading 状态
- **Rationale**: 功能语义清晰，避免共用 loading 造成误导
- **Alternative Considered**: 下拉菜单聚合按钮；缺点是多一步交互，学习效率场景不友好

## Risks / Trade-offs

- [Risk] 按钮增多导致术语行拥挤 → Mitigation: 保持 `size="small"`，并在窄屏优先按钮换行
- [Risk] AI 输出结构不稳定 → Mitigation: 首版按文本展示 + 标题约束，不强依赖 JSON 解析
- [Risk] 新旧提示词字段兼容问题（用户历史缓存） → Mitigation: 加载模板时为新字段提供默认兜底

## Migration Plan

1. 扩展提示词类型与默认模板，确保历史缓存可向后兼容
2. 新增出题角度 API 调用方法与页面处理函数
3. 在术语行接入“出题角度”按钮并串联结果弹窗
4. 将 ModelManager 提示词区改为折叠展开并加入新模板编辑项
5. 回归验证：解释、出题角度、继续拆解三按钮互不干扰，模板保存/恢复正常

## Open Questions

- 出题角度默认返回条数是否固定（例如 5 条）还是由模型自由决定？
- 结果展示是否需要后续升级为结构化卡片（角度/典型问法/易错点分栏）？
