## Why

目前应用的界面主题是硬编码的"二次元粉色风"，所有配色和样式都固定在 `App.tsx` 和 `index.css` 中，用户无法根据个人偏好或使用场景切换外观。添加主题选择功能，让用户可以在多种风格之间切换，提升个性化体验和使用舒适度。

## What Changes

- **新增多套主题**：在"二次元粉色"之外，提供"暗夜（玻璃灰）"和"清新自然（浅绿）"两套主题选项
- **新增主题选择 UI**：在页面头部（靠近设置按钮区域）添加主题切换按钮/选择器
- **主题持久化**：用户选择的主题保存到 `localStorage`，刷新页面后自动恢复
- **动态切换**：切换主题时实时更新 Ant Design `ConfigProvider` 配置和全局 CSS 变量，无需刷新页面
- **主题定义集中管理**：将主题配置从 `App.tsx` 中抽离到独立模块

## Capabilities

### New Capabilities
- `theme-management`: 主题定义、存储和切换的核心逻辑，包括多套主题配置（颜色 token、算法）、localStorage 持久化 hook、以及 CSS 变量动态更新

### Modified Capabilities

## Impact

- `src/App.tsx`：使用主题 hook 替换硬编码的 `animeTheme` 对象，添加主题选择器组件
- `src/index.css`：CSS 变量改为支持多主题动态切换（通过 JS 动态写入 `:root`）
- 新增 `src/themes/` 目录：存放主题定义和相关 hook
- 新增主题选择器组件：`src/components/ThemeSelector.tsx`
