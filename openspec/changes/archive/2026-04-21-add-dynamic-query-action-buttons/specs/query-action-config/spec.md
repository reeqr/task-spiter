## ADDED Requirements

### Requirement: 查询动作配置模型
系统 MUST 提供查询动作配置模型，用于定义可渲染的查询按钮及其模板映射。

#### Scenario: 动作字段完整性
- **WHEN** 系统加载查询动作配置
- **THEN** 每个动作 MUST 至少包含 `id`、`label`、`enabled`、`sort`、`queryTemplate`、`followupTemplate`

#### Scenario: 动作排序
- **WHEN** 系统渲染查询动作按钮组
- **THEN** 按钮 MUST 按 `sort` 升序展示

### Requirement: 查询动作本地持久化
系统 MUST 将查询动作配置持久化到本地并在再次打开设置后恢复。

#### Scenario: 保存动作配置
- **WHEN** 用户修改动作文案或模板并执行保存
- **THEN** 系统 MUST 持久化最新动作配置并在后续读取时返回一致内容

#### Scenario: 打开设置恢复
- **WHEN** 用户关闭并重新打开设置面板
- **THEN** 系统 MUST 读取并展示最近一次保存的动作配置

### Requirement: 旧配置兼容迁移
系统 MUST 兼容旧版固定模板配置，确保升级后可直接使用动态按钮。

#### Scenario: 旧配置自动补全
- **WHEN** 系统读取到不包含查询动作数组的旧配置
- **THEN** 系统 MUST 自动生成默认动作并将旧模板映射到对应默认动作

#### Scenario: 缺失字段补默认
- **WHEN** 动作配置中缺失非关键字段
- **THEN** 系统 MUST 使用默认值补齐并继续可用
