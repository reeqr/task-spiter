## Context

当前项目是一个 React + TypeScript + Vite 的 AI 任务拆解助手，使用 Ant Design 组件库和 Tailwind CSS。应用的外观主题完全硬编码在 `App.tsx`（`animeTheme` 对象用于 Ant Design ConfigProvider）和 `index.css`（CSS 自定义变量 `--anime-*`）中，只支持唯一的"二次元粉色"风格，无法扩展或由用户切换。

## Goals / Non-Goals

**Goals:**
- 支持 3 套预置主题：二次元粉色（anime）、暗夜玻璃灰（dark）、清新自然浅绿（nature）
- 主题配置集中管理，新增主题只需添加配置，不需修改组件逻辑
- 通过 localStorage 持久化用户选择
- 主题切换实时生效（Ant Design token + CSS 变量同步更新）
- 提供直观的主题选择 UI，集成到现有头部区域

**Non-Goals:**
- 用户自定义主题（自由配色）
- 服务端存储主题偏好
- 跟随系统 dark/light mode 自动切换

## Decisions

### 决策一：主题定义结构

**选择**：每个主题定义为一个对象，包含 `antdTheme`（Ant Design ConfigProvider 配置）和 `cssVars`（CSS 变量键值对）两部分。

```ts
interface AppTheme {
  id: string;
  name: string;
  emoji: string;
  antdTheme: ThemeConfig;       // Ant Design ConfigProvider theme 配置
  cssVars: Record<string, string>; // 写入 :root 的 CSS 变量
  bodyBg: string;               // body 背景（Tailwind 不适合动态注入）
}
```

**备选方案**：只用 CSS 变量管理所有样式，Ant Design 的 token 也通过变量注入。
**放弃原因**：Ant Design v5 的 Design Token 系统基于 CSS-in-JS，不能直接通过 CSS 变量控制，必须通过 `ConfigProvider` 的 `theme` prop 才能正确覆盖组件颜色。

---

### 决策二：主题切换机制

**选择**：使用自定义 hook `useTheme` 封装全部逻辑：
1. 从 localStorage 读取初始主题 ID，默认为 `anime`
2. 暴露 `currentTheme`（完整主题对象）和 `setTheme(id)` 方法
3. `setTheme` 调用时：持久化到 localStorage + 更新 React state + 通过 `document.documentElement.style.setProperty` 批量写入 CSS 变量 + 更新 `body.style.background`

**备选方案**：React Context + Provider 全局注入。
**放弃原因**：当前应用层级简单，无需跨多层传递主题状态，hook 即可满足需求，避免引入不必要的 Provider 嵌套。

---

### 决策三：主题文件组织

**选择**：`src/themes/` 目录结构：

```
src/themes/
  index.ts       // 导出所有主题和类型定义
  themes.ts      // 所有预置主题配置
  useTheme.ts    // 主题管理 hook
```

**理由**：与现有 `hooks/` 目录区分，主题不只是 hook，还包含静态配置数据，独立目录更清晰。

---

### 决策四：主题选择 UI

**选择**：在头部右侧（设置按钮旁）使用颜色圆点列表作为快速切换控件，Tooltip 显示主题名称。点击即切换，无需确认弹窗。

**备选方案**：下拉菜单（Ant Design Select 或 Dropdown）。
**放弃原因**：颜色圆点更直观，视觉上就能预览主题色，且操作路径更短（一次点击 vs 展开再选择）。

## Risks / Trade-offs

- **CSS 变量与 Tailwind 工具类冲突** → 现有 Tailwind 颜色类（如 `text-pink-500`）是静态的，主题切换不会影响它们。解决：需检查并将硬编码颜色类替换为依赖 CSS 变量的自定义类，或在主题定义中仅覆盖通用变量，保留 Tailwind 类的静态用法。
- **暗色主题与 Ant Design 算法** → 暗色主题需使用 `theme.darkAlgorithm`，与亮色主题的 `theme.defaultAlgorithm` 不同；切换时需确保算法也一起更新，否则组件色板不正确。
- **body 背景切换闪烁** → 在 JS 加载前，body 使用 CSS 文件中的默认背景。如果用户切换到非默认主题，刷新时会有短暂闪烁。缓解：在 `index.html` 的 `<head>` 中内联一段脚本，在 React 挂载前读取 localStorage 并设置 body 背景色。

## Migration Plan

1. 创建 `src/themes/` 目录及相关文件，不影响现有功能
2. 将 `App.tsx` 中的 `animeTheme` 对象迁移到主题定义中，保持默认主题不变
3. 引入 `useTheme` hook 替换 `App.tsx` 中的硬编码主题
4. 添加 `ThemeSelector` 组件到头部
5. `index.css` 的 `:root` 变量保留为默认值（二次元主题），主题切换时通过 JS 覆盖

无需数据迁移，无破坏性变更。

## Open Questions

- 是否需要一个"跟随系统深色/浅色模式"的自动选项？（当前标记为 Non-Goal，后续可考虑）
- 移动端主题选择器的展示形式是否需要与桌面端区分？
