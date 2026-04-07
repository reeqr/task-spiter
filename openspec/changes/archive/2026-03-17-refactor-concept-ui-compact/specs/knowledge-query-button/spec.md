## ADDED Requirements

### Requirement: 查询考点按钮
系统必须为每个术语提供"查询考点"按钮。

#### Scenario: 按钮显示
- **WHEN** 系统渲染术语列表项
- **THEN** 每个术语项必须显示"查询考点"按钮

#### Scenario: 按钮位置
- **WHEN** 系统布局术语列表项
- **THEN** "查询考点"按钮必须位于术语项的右侧操作区域

#### Scenario: 按钮样式
- **WHEN** 系统渲染"查询考点"按钮
- **THEN** 按钮必须使用小尺寸(size="small")且包含图标

### Requirement: 考点模态框展示
系统必须在模态框中展示术语的相关考点。

#### Scenario: 点击按钮打开模态框
- **WHEN** 用户点击"查询考点"按钮
- **THEN** 系统必须打开模态框显示该术语的考点列表

#### Scenario: 模态框标题
- **WHEN** 系统打开考点模态框
- **THEN** 模态框标题必须显示当前术语名称

#### Scenario: 模态框内容
- **WHEN** 系统渲染模态框内容
- **THEN** 系统必须使用 KnowledgePointList 组件展示考点

#### Scenario: 关闭模态框
- **WHEN** 用户点击关闭按钮或遮罩层
- **THEN** 系统必须关闭模态框

### Requirement: 考点数据来源
系统必须使用已有的拆解结果中的考点数据。

#### Scenario: 复用拆解结果
- **WHEN** 用户点击"查询考点"按钮
- **THEN** 系统必须从当前术语的 children 中获取 knowledgePoints 数据

#### Scenario: 无考点数据处理
- **WHEN** 当前术语没有关联的考点数据
- **THEN** 系统必须显示"暂无考点"提示

### Requirement: 递归考点查询
系统必须支持在任意层级的术语上查询考点。

#### Scenario: 子术语考点查询
- **WHEN** 用户点击递归拆解后的子术语的"查询考点"按钮
- **THEN** 系统必须展示该子术语对应的考点

#### Scenario: 多层级独立查询
- **WHEN** 用户在不同层级分别查询考点
- **THEN** 每个模态框必须显示对应术语的考点,互不干扰
