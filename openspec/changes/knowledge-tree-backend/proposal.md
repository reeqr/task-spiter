## Why

当前应用使用 localStorage 存储数据，无法跨设备同步，且 AI API 调用直接暴露在前端，存在安全隐患。将应用重构为前后端分离架构，支持用户登录系统，通过后端代理访问 AI 服务，所有数据存储在 PostgreSQL 数据库中。

## What Changes

### 前端变化
- **全新项目**：在 `new-project/frontend/` 目录新建，使用 Semi Design 组件库
- **用户认证**：登录/注册功能
- **数据同步**：前端操作实时同步到后端数据库

### 后端变化
- **新建后端**：在 `new-project/backend/` 目录，使用 Python FastAPI
- **数据库**：PostgreSQL，使用 SQLAlchemy ORM
- **AI 代理**：后端统一代理 AI 请求，API Key 不暴露在前端
- **数据持久化**：概念拆解历史、任务、操作按钮配置等全部存数据库

### 数据迁移
- **不迁移**：现有 localStorage 数据不迁移，用户在新系统中重新开始

## Capabilities

### New Capabilities

- **user-auth**: 用户注册、登录、JWT 认证
- **provider-management**: AI 提供商配置管理（添加/编辑/删除）
- **model-management**: 模型配置管理
- **concept-breakdown-api**: 概念拆解 API，复用现有提示词逻辑
- **concept-history-api**: 概念拆解历史存储与查询
- **term-breakdown-api**: 术语递归拆解 API
- **query-action-api**: 术语查询 API（解释/出题角度/易错点）
- **query-followup-api**: 追问功能 API
- **task-api**: 任务 CRUD API
- **action-button-config**: 操作按钮（提示词模板）配置，支持用户自定义按钮
- **web-search-config**: 联网搜索配置

### Modified Capabilities

<!-- 现有 spec 行为未改变，仅实现方式变化 -->
- 无

## Impact

### 新增目录结构
```
new-project/
├── frontend/          # Semi Design React 项目
├── backend/          # Python FastAPI 后端
└── docker-compose.yml # PostgreSQL + 服务编排
```

### 影响的现有代码
- 原项目 `src/` 目录保持不变，作为参考

### 依赖变更
- 前端：React, Vite, Semi Design, React Router, Axios
- 后端：Python 3.11+, FastAPI, SQLAlchemy, PostgreSQL, Pydantic, python-jose
- 数据库：PostgreSQL 15+