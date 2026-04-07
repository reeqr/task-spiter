## ADDED Requirements

### Requirement: 预置主题集合
系统 SHALL 提供 3 套预置主题：二次元粉色（anime）、暗夜玻璃灰（dark）、清新自然浅绿（nature）。每套主题 SHALL 包含唯一 ID、展示名称、代表 emoji/图标、Ant Design token 配置和 CSS 变量配置。

#### Scenario: 主题配置完整性
- **WHEN** 应用加载主题配置模块
- **THEN** 所有预置主题均包含 id、name、emoji、antdTheme、cssVars、bodyBg 字段，且无任何字段为空

#### Scenario: 默认主题为二次元粉色
- **WHEN** 用户首次访问应用（无 localStorage 记录）
- **THEN** 应用显示"二次元粉色"主题，与原有视觉效果完全一致

---

### Requirement: 主题持久化
系统 SHALL 将用户最后选择的主题 ID 保存到 localStorage（键名 `app-theme`）。

#### Scenario: 选择主题后持久化
- **WHEN** 用户切换到任意主题
- **THEN** localStorage 中 `app-theme` 键的值更新为所选主题的 ID

#### Scenario: 刷新页面恢复主题
- **WHEN** 用户刷新页面，且 localStorage 中存有 `app-theme` 值
- **THEN** 应用自动加载并应用该主题，无需用户重新选择

#### Scenario: localStorage 值无效时回退默认
- **WHEN** localStorage 中 `app-theme` 值不对应任何已知主题 ID
- **THEN** 应用回退到"二次元粉色"默认主题

---

### Requirement: 实时主题切换
系统 SHALL 在用户选择新主题后立即更新界面，无需页面刷新。切换 SHALL 同时更新 Ant Design ConfigProvider 配置和全局 CSS 自定义变量。

#### Scenario: Ant Design 组件颜色实时更新
- **WHEN** 用户切换主题
- **THEN** 所有 Ant Design 组件（按钮、卡片、输入框、进度条等）立即呈现新主题的颜色

#### Scenario: CSS 变量实时更新
- **WHEN** 用户切换主题
- **THEN** `document.documentElement` 上的 CSS 变量立即更新，依赖这些变量的自定义样式随之改变

#### Scenario: 页面背景实时更新
- **WHEN** 用户切换主题
- **THEN** `body` 的背景样式立即更新为新主题的背景色

---

### Requirement: 主题选择 UI
系统 SHALL 在应用头部提供主题选择控件，展示所有可用主题的视觉代表色，当前激活主题 SHALL 有明显的选中状态。

#### Scenario: 主题控件可见
- **WHEN** 用户打开应用
- **THEN** 头部区域显示主题选择控件，可见所有主题的颜色圆点

#### Scenario: 当前主题高亮
- **WHEN** 当前激活主题为 X
- **THEN** 主题 X 对应的颜色圆点显示选中状态（如外圈边框或缩放效果）

#### Scenario: 切换主题
- **WHEN** 用户点击某个主题颜色圆点
- **THEN** 界面立即切换到对应主题，该圆点变为选中状态

#### Scenario: Tooltip 提示主题名
- **WHEN** 用户将鼠标悬停在某个主题颜色圆点上
- **THEN** 显示该主题的名称文字
