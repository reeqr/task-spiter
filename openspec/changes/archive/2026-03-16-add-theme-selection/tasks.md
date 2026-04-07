## 1. 主题定义模块

- [x] 1.1 创建 `src/themes/` 目录结构（`index.ts`、`themes.ts`、`useTheme.ts`）
- [x] 1.2 定义 `AppTheme` 接口类型（id、name、emoji、antdTheme、cssVars、bodyBg）
- [x] 1.3 将 `App.tsx` 中的 `animeTheme` 对象迁移到 `themes.ts` 中作为 `animeTheme` 主题配置
- [x] 1.4 在 `themes.ts` 中添加"暗夜"主题（玻璃灰色系：`darkAlgorithm`，主色 `#A0AEC0`，背景深灰磨砂感渐变）
- [x] 1.5 在 `themes.ts` 中添加"清新自然"主题（浅绿色系：`defaultAlgorithm`，主色 `#52C41A`，背景浅绿米白渐变）
- [x] 1.7 在 `index.ts` 中导出主题列表、类型定义和默认主题 ID

## 2. 主题管理 Hook

- [x] 2.1 创建 `useTheme` hook，从 localStorage（键名 `app-theme`）读取初始主题 ID，无效值时回退 `anime`
- [x] 2.2 实现 `setTheme(id)` 方法：更新 React state、持久化到 localStorage、批量写入 CSS 变量到 `document.documentElement`、更新 `body.style.background`
- [x] 2.3 hook 初始化时立即应用 CSS 变量（确保刷新页面后样式正确）
- [x] 2.4 在 `index.ts` 中导出 `useTheme`

## 3. 主题选择器组件

- [x] 3.1 创建 `src/components/ThemeSelector.tsx`，接收 `currentThemeId` 和 `onThemeChange` props
- [x] 3.2 渲染所有主题的颜色圆点，使用每个主题的主色（`colorPrimary` token）作为圆点颜色
- [x] 3.3 当前激活主题的圆点添加选中状态样式（外圈边框 + 轻微放大）
- [x] 3.4 每个圆点用 Ant Design `Tooltip` 包裹，显示主题名称和 emoji
- [x] 3.5 点击圆点时调用 `onThemeChange(themeId)`

## 4. 集成到 App.tsx

- [x] 4.1 移除 `App.tsx` 中硬编码的 `animeTheme` 对象
- [x] 4.2 引入 `useTheme` hook，获取 `currentTheme` 和 `setTheme`
- [x] 4.3 将 `ConfigProvider` 的 `theme` prop 改为 `currentTheme.antdTheme`
- [x] 4.4 在头部右侧（设置按钮旁）引入 `ThemeSelector` 组件，传入当前主题 ID 和切换回调

## 5. 样式更新

- [x] 5.1 检查 `index.css` 中硬编码的 CSS 变量，确保其值与 `animeTheme` 的 `cssVars` 一致（作为默认值）
- [x] 5.2 检查 `App.css`（如有）和组件中使用的硬编码颜色值，评估是否需要改为 CSS 变量引用
- [x] 5.3 为暗色主题的文字对比度添加 CSS 变量（如 `--text-primary`、`--text-secondary`），确保可读性
