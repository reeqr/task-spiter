# ✨ AI 任务拆解工具

一个基于 React + TypeScript + Tailwind CSS 的智能任务管理工具，参考 [Goblin Tools](https://goblin.tools/ToDo) 设计，支持 AI 自动任务拆解功能。

## 功能特性

- 🎯 **任务输入** - 快速添加任务和目标描述
- ✨ **AI 智能拆解** - 点击魔法棒按钮，自动将任务拆解为可执行的子任务（已接入智谱AI）
- 🌶 **难度等级** - 设置任务难度（1-5 级），影响拆解粒度
- 📂 **多层级结构** - 支持无限层级子任务嵌套
- ✅ **任务管理** - 编辑、删除、标记完成任务
- 💾 **本地持久化** - 使用 localStorage 自动保存任务数据
- 📊 **进度跟踪** - 实时显示任务完成进度
- 🎨 **精美 UI** - 使用 Tailwind CSS 构建的现代化界面

## 技术栈

- **Vite 5.4** - 快速的前端构建工具
- **React 19** - 用户界面库
- **TypeScript** - 类型安全的 JavaScript
- **Tailwind CSS** - 实用优先的 CSS 框架
- **pnpm** - 快速、节省磁盘空间的包管理器
- **智谱AI API** - 智能任务拆解

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置智谱AI API Key

复制环境变量配置文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的智谱AI API Key：

```
VITE_ZHIPU_API_KEY=your_api_key_here
```

> 💡 获取 API Key：访问 [智谱AI开放平台](https://open.bigmodel.cn/)

### 3. 启动开发服务器

```bash
pnpm dev
```

应用将在 [http://localhost:5173](http://localhost:5173) 启动。

### 4. 构建生产版本

```bash
pnpm build
```

### 5. 预览生产构建

```bash
pnpm preview
```

## 项目结构

```
task_spiter/
├── src/
│   ├── components/         # React 组件
│   │   ├── TaskInput.tsx          # 任务输入组件
│   │   ├── TaskItem.tsx           # 任务项组件
│   │   └── SpicyLevelSelector.tsx # 难度选择器
│   ├── hooks/              # 自定义 Hooks
│   │   ├── useTaskBreakdown.ts    # 任务拆解 Hook
│   │   └── useTasks.ts            # 任务管理 Hook（含 localStorage）
│   ├── types/              # TypeScript 类型定义
│   │   └── task.ts
│   ├── utils/              # 工具函数
│   │   └── api.ts                 # 智谱AI API 调用
│   ├── App.tsx             # 主应用组件
│   ├── main.tsx            # 应用入口
│   └── index.css           # 全局样式
├── public/                 # 静态资源
├── .env                    # 环境变量配置（不提交）
├── .env.example            # 环境变量示例
├── tailwind.config.js      # Tailwind CSS 配置
├── vite.config.ts          # Vite 配置
└── tsconfig.json           # TypeScript 配置
```

## 使用说明

### 1. 添加任务
- 在顶部输入框中填写任务标题
- 可选填写任务描述和目标
- 点击"添加任务"按钮

### 2. AI 拆解任务
- 点击任务右侧的 ✨ 按钮
- AI 会根据任务难度自动拆解为子任务
- 难度越高，拆解越详细（难度1 = 2个子任务，难度5 = 10个子任务）

### 3. 继续拆解子任务
- 点击子任务右侧的 ✨ 按钮
- 支持多层级嵌套拆解

### 4. 管理任务
- ☑ 勾选复选框标记任务完成
- ✏️ 编辑任务标题和描述
- 🗑 删除不需要的任务
- ▼ 展开/收起子任务列表

### 5. 数据自动保存
- 所有任务数据自动保存到浏览器 localStorage
- 刷新页面后数据不会丢失

## 智谱AI API 说明

本项目已接入智谱AI GLM-4-Flash 模型，提供智能任务拆解功能：

- **模型**：`glm-4-flash`
- **功能**：根据任务标题、目标和难度等级，自动生成结构化的子任务列表
- **容错机制**：如果 API 调用失败，会自动降级使用模拟数据
- **成本**：Flash 模型性价比高，适合高频调用

### API 调用示例

```typescript
{
  model: "glm-4-flash",
  messages: [
    {
      role: "user",
      content: "请帮我将以下任务拆解为具体的、可执行的子任务..."
    }
  ],
  thinking: { type: "enabled" },
  max_tokens: 65536,
  temperature: 0.7
}
```

## 环境变量

| 变量名 | 说明 | 必填 | 默认值 |
|--------|------|------|--------|
| `VITE_ZHIPU_API_KEY` | 智谱AI API密钥 | 是 | 无 |

## 开发计划

- [x] 接入智谱AI API
- [x] 本地存储持久化（localStorage）
- [ ] 任务拖拽排序
- [ ] 导入/导出任务
- [ ] 任务分类和筛选
- [ ] 暗色主题
- [ ] 任务时间估算
- [ ] 协作功能

## 常见问题

### 1. AI 拆解失败怎么办？

- 检查 API Key 是否正确配置
- 查看浏览器控制台的错误信息
- 系统会自动降级使用模拟数据

### 2. 如何清空所有任务？

打开浏览器控制台，执行：

```javascript
localStorage.removeItem('task_spiter_tasks');
location.reload();
```

### 3. 任务数据保存在哪里？

- 保存在浏览器的 localStorage 中
- Key 为 `task_spiter_tasks`
- 仅保存在本地，不会上传到服务器

## 许可证

MIT

## 致谢

- 灵感来源于 [Goblin Tools](https://goblin.tools/ToDo)
- 使用 [智谱AI](https://open.bigmodel.cn/) 提供智能任务拆解功能
