## MODIFIED Requirements

### Requirement: 任务卡片紧凑单行布局
任务卡片 SHALL 仅显示 Checkbox、任务标题文字和操作按钮，不得显示难度星级（Rate）或分类标签（Tag）。卡片 body 内边距 SHALL 不超过 `10px 14px`。

#### Scenario: 标题与按钮单行（无星级无标签）
- **WHEN** 渲染任意任务
- **THEN** 仅显示 Checkbox、任务标题、操作按钮，不显示 Rate 星级或 category Tag

#### Scenario: 无额外装饰元素
- **WHEN** 渲染一条任务
- **THEN** 任务标题行不包含任何星级、标签等装饰元素，仅保留纯文字

---

## ADDED Requirements

### Requirement: 任务输入无难度选择
任务输入组件（`TaskInput`）SHALL 不提供难度等级选择器，用户添加任务时无需指定 `spicyLevel`。

#### Scenario: 添加任务时无难度选择
- **WHEN** 用户打开任务输入界面
- **THEN** 不显示难度选择器（Rate、Slider 等），用户仅输入标题和描述

---

### Requirement: AI 拆解使用固定难度
调用 AI 拆解任务时 SHALL 使用固定的默认难度值（`spicyLevel: 3`），无需用户指定。

#### Scenario: 拆解任务自动使用默认难度
- **WHEN** 用户触发 AI 拆解
- **THEN** 系统自动使用 `spicyLevel: 3` 调用 API，无需用户输入
