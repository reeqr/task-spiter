## MODIFIED Requirements

### Requirement: 查询结果弹窗多轮追问
系统 MUST 在“解释”和“出题角度”结果弹窗中提供可连续追问的对话能力，并在追问阶段支持流式文本追加。

#### Scenario: 首轮结果进入会话流
- **WHEN** 用户触发任一术语查询并收到首轮 AI 结果
- **THEN** 系统 MUST 打开对应弹窗并将首轮结果作为当前会话中的第一条 AI 消息展示

#### Scenario: 连续追问展示
- **WHEN** 用户在弹窗中提交新的追问
- **THEN** 系统 MUST 将该问题与后续 AI 回复按时间顺序追加到同一会话流

#### Scenario: 追问流式增量展示
- **WHEN** 追问请求采用流式返回
- **THEN** 系统 MUST 将同一条助手消息按增量实时更新，直到流结束

### Requirement: 追问发送规则
系统 MUST 采用 Enter 作为追问发送快捷方式，并在请求进行中避免重复发送。

#### Scenario: Enter 发送
- **WHEN** 用户在追问输入框按下 Enter 且输入有效
- **THEN** 系统 MUST 触发一次追问请求并清空输入框

#### Scenario: 发送中防重入
- **WHEN** 当前追问请求尚未完成（包括流式生成阶段）
- **THEN** 系统 MUST 禁止再次触发发送并提供进行中状态反馈
