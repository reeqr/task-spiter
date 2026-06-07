# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 当前项目：new-project (知识树后端重构版)

主要开发目录是 `new-project/`，这是原 task_spiter 的后端重构版本，使用 FastAPI + PostgreSQL + React。

### 技术栈

**前端**:
- **Vite 5** + **React 18** + **TypeScript**
- **Semi Design** (@douyinfe/semi-ui) - UI 组件库
- **React Router 6** - 路由
- **Axios** - HTTP 客户端

**后端**:
- **Python FastAPI**
- **SQLAlchemy 2.0** + **Pydantic v2**
- **PostgreSQL 15**
- **JWT** - 认证（bcrypt 密码哈希）

### 项目结构

```
new-project/
├── frontend/src/
│   ├── pages/
│   │   ├── HomePage.tsx      # 知识树首页（概念拆解）
│   │   ├── TasksPage.tsx     # 任务管理页面
│   │   ├── LoginPage.tsx     # 登录页
│   │   ├── RegisterPage.tsx  # 注册页
│   │   └── ConfigPage.tsx    # 配置页（提供商/模型/操作按钮）
│   ├── services/
│   │   ├── api.ts            # Axios 实例 + JWT 拦截器
│   │   ├── auth.ts          # 认证 API
│   │   ├── concept.ts        # 概念拆解 API
│   │   ├── task.ts           # 任务管理 API
│   │   └── provider.ts      # 提供商管理 API
│   ├── contexts/
│   │   └── AuthContext.tsx   # 登录状态管理
│   └── types/index.ts       # TypeScript 类型定义
├── backend/app/
│   ├── api/v1/endpoints/    # API 路由
│   │   ├── auth.py          # 认证 (register/login/refresh/logout)
│   │   ├── concepts.py      # 概念拆解 (breakdown/history)
│   │   ├── terms.py         # 术语查询 (breakdownTerm/query/followup)
│   │   ├── tasks.py         # 任务管理
│   │   ├── providers.py     # 提供商管理
│   │   ├── models.py        # 模型管理
│   │   └── config.py        # 配置 (actions/web-search/prompts)
│   ├── models/              # SQLAlchemy 模型
│   └── schemas/             # Pydantic schemas
└── docker-compose.yml        # 生产环境
```

### 启动命令（重要）

**不要使用 npm/pnpm 启动前端**，会有网络问题。

```bash
cd new-project

# 本地开发（使用 docker-compose.local.yml）
./start-local.sh

# 或手动启动
docker compose -f docker-compose.local.yml up -d

# 停止服务
docker compose -f docker-compose.local.yml down

# 删除数据（重置数据库）
docker compose -f docker-compose.local.yml down -v
```

启动后访问地址：
- 前端：http://localhost:5173
- 后端：http://localhost:8000
- API 文档：http://localhost:8000/docs

### 前端开发服务器代理配置

`frontend/vite.config.ts` 中的 proxy 配置：
- 开发时指向 `http://localhost:8000`（本地的 npm dev server）
- Docker 容器中指向 `http://backend:8000`（Docker 网络服务名）

### 主要功能

1. **用户认证**：注册/登录/JWT
2. **概念拆解**：输入概念 → AI 拆解为术语和考点 → 递归拆解子节点
3. **操作按钮**：解释、出题角度、易错点（可自定义）
4. **任务管理**：CRUD + AI 拆解
5. **提供商/模型管理**：支持多 AI 提供商（智谱、OpenAI、MiniMax 等）

### OpenSpec 工作流（用于原 task_spiter 功能变更）

```bash
/opsx-propose <name>   # 创建新变更
/opsx-apply            # 开始实现
/opsx-archive          # 归档完成
```

变更规格存储在 `openspec/changes/<name>/`。

### Playwright MCP

使用 Playwright MCP tools (`mcp__playwright__browser_*`) 验证 UI 功能。

---

## 原 task_spiter 项目（已重构，参考用）

旧版前端项目，使用 React + Ant Design + Tailwind CSS，数据存在 localStorage。

```bash
pnpm dev        # 原项目开发
pnpm build
```