### Requirement: 任务卡片紧凑单行布局
任务卡片 SHALL 仅显示 Checkbox、任务标题文字和操作按钮,不得显示难度星级（Rate）或分类标签（Tag）。卡片 body 内边距 SHALL 不超过 `10px 14px`。

#### Scenario: 标题与按钮单行（无星级无标签）
- **WHEN** 渲染任意任务
- **THEN** 仅显示 Checkbox、任务标题、操作按钮,不显示 Rate 星级或 category Tag

#### Scenario: 无额外装饰元素
- **WHEN** 渲染一条任务
- **THEN** 任务标题行不包含任何星级、标签等装饰元素,仅保留纯文字

---

### Requirement: 任务输入无难度选择
任务输入组件（`TaskInput`）SHALL 不提供难度等级选择器,用户添加任务时无需指定 `spicyLevel`。

#### Scenario: 添加任务时无难度选择
- **WHEN** 用户打开任务输入界面
- **THEN** 不显示难度选择器（Rate、Slider 等）,用户仅输入标题和描述

---

### Requirement: AI 拆解使用固定难度
调用 AI 拆解任务时 SHALL 使用固定的默认难度值（`spicyLevel: 3`）,无需用户指定。

#### Scenario: 拆解任务自动使用默认难度
- **WHEN** 用户触发 AI 拆解
- **THEN** 系统自动使用 `spicyLevel: 3` 调用 API,无需用户输入

---

### Requirement: 描述文字单行截断
任务描述（description）SHALL 默认截断为 1 行并显示省略号；无描述时该区域 SHALL 不占用任何垂直空间。

#### Scenario: 长描述截断
- **WHEN** 任务 description 超过 1 行长度
- **THEN** 显示第 1 行内容加省略号,不撑高卡片

#### Scenario: 无描述时零占位
- **WHEN** 任务 description 为空或 undefined
- **THEN** 卡片内没有描述区域对应的空白间距

---

### Requirement: 操作按钮始终可见
任务操作按钮（AI解答、AI拆解、编辑、删除等）SHALL 始终以可见状态显示,尺寸 SHALL 为 `small`,不依赖鼠标悬停显示。

#### Scenario: 按钮默认可见
- **WHEN** 用户在任何设备上查看任务列表
- **THEN** 所有操作按钮无需悬停即可见

#### Scenario: 按钮为小尺寸
- **WHEN** 渲染操作按钮区域
- **THEN** 按钮高度不超过 24px（Ant Design `size="small"` 规格）

---

### Requirement: 子任务区域无折叠头部
子任务列表 SHALL 以带左侧竖线的缩进方式展示,不使用带展开头部（arrow + 标题行）的折叠面板组件。子任务数量 SHALL 以小标签形式标注在区域顶部。

#### Scenario: 子任务直接展示
- **WHEN** 任务存在子任务且处于展开状态
- **THEN** 子任务列表直接呈现,无额外的折叠组件头部行

#### Scenario: 收起子任务
- **WHEN** 用户点击收起按钮
- **THEN** 子任务列表隐藏,卡片高度恢复为无子任务时的高度

---

### Requirement: 任务列表间距紧凑
任务卡片之间的垂直间距 SHALL 不超过 8px（Ant Design `size="small"` 对应间距）。

#### Scenario: 多任务列表间距
- **WHEN** 列表中存在 3 条以上任务
- **THEN** 相邻卡片间距不超过 8px
