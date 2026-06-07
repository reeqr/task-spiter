## Context

### 现有系统
当前是一个单页应用（task_spiter），使用 React + Ant Design + Tailwind CSS 构建：
- 数据存储在 localStorage（任务、概念拆解历史、AI 配置）
- AI 调用直接暴露在前端（API Key 在浏览器中）
- 没有用户系统，无法跨设备同步

### 需要解决的问题
1. **数据安全**：API Key 暴露在前端
2. **数据持久化**：localStorage 容量有限且无法跨设备
3. **多设备支持**：用户需要在不同设备访问同一数据
4. **组件库更换**：从 Ant Design 切换到 Semi Design

### 技术约束
- 前端：Semi Design（字节跳动 UI 组件库）
- 后端：Python FastAPI
- 数据库：PostgreSQL
- 无实时同步需求

## Goals / Non-Goals

**Goals:**
- 用户注册/登录系统
- 后端代理 AI 请求，API Key 不暴露在前端
- 所有数据（概念拆解历史、任务、操作按钮配置）存 PostgreSQL
- 支持用户自定义操作按钮（存数据库）
- 新项目与原项目隔离，不影响原代码

**Non-Goals:**
- 不迁移现有 localStorage 数据
- 不实现实时多人协作
- 不实现复杂的权限管理系统（单用户模型）

## Decisions

### Decision 1: 前后端分离 vs Monorepo

**选择**：前后端分离

```
new-project/
├── frontend/          # Semi Design React 项目
├── backend/           # Python FastAPI 后端
└── docker-compose.yml  # PostgreSQL + 服务编排
```

| 方案 | 优点 | 缺点 |
|------|------|------|
| 前后端分离 | 职责清晰，技术选型灵活 | 需要 CORS 配置 |
| Monorepo | 代码共享方便，部署统一 | 技术栈绑定，复杂度高 |

**原因**：后端 Python，前端 JS/TS，分离更自然。

---

### Decision 2: 认证方案

**选择**：JWT（JSON Web Token）+ bcrypt 密码哈希

```python
# 用户注册流程
1. 用户提交 email + password
2. 后端 bcrypt 哈希密码，存储用户
3. 返回 JWT access_token + refresh_token

# 请求认证流程
1. 前端请求带 Authorization: Bearer <token>
2. 后端验证 JWT，解码用户 ID
3. 查询对应用户数据
```

| 方案 | 优点 | 缺点 |
|------|------|------|
| JWT | 无状态，易扩展 | Token 泄露风险，需要刷新机制 |
| Session | 服务器控制，安全 | 需要 Redis 等存储，扩展复杂 |

**原因**：JWT 更适合 API 服务，且无需额外存储。

---

### Decision 3: 数据库 ORM

**选择**：SQLAlchemy 2.0 + Pydantic v2

```python
# 模型定义示例
class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# Pydantic schema
class UserCreate(BaseModel):
    email: str
    password: str
```

| 方案 | 优点 | 缺点 |
|------|------|------|
| SQLAlchemy | 成熟稳定，类型提示好 | 学习曲线 |
| Prisma | TS 原生，迁移方便 | 需要额外服务 |
| Raw SQL | 灵活 | 维护困难 |

**原因**：Python 原生，FastAPI 集成好，类型安全。

---

### Decision 4: API 设计

**选择**：RESTful API + JSON

```bash
# 概念拆解
POST   /api/v1/concepts/breakdown
GET    /api/v1/concepts/history

# 术语拆解
POST   /api/v1/terms/{term_id}/breakdown

# 查询操作
POST   /api/v1/terms/query

# 配置
GET    /api/v1/config/actions
PUT    /api/v1/config/actions
```

| 方案 | 优点 | 缺点 |
|------|------|------|
| RESTful | 清晰，易理解 | 对于复杂嵌套数据可能需要多次请求 |
| GraphQL | 一次请求获取多类型数据 | 增加复杂度 |
| gRPC | 高性能，二进制格式 | 前端集成复杂 |

**原因**：与现有前端 Axios 习惯一致，简单清晰。

---

### Decision 5: AI 代理模式

**选择**：后端统一代理，前端不持有 API Key

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   前端      │ ───────▶ │   后端      │ ───────▶ │   AI API    │
│  (Semi UI)  │         │ (FastAPI)   │         │ (智谱/OpenAI)│
└─────────────┘         └─────────────┘         └─────────────┘
                              │
                              ▼
                        ┌─────────────┐
                        │  PostgreSQL │
                        │ (配置存储)   │
                        └─────────────┘
```

```python
# 后端 AI 调用示例
@router.post("/concepts/breakdown")
async def breakdown_concept(
    request: BreakdownRequest,
    current_user: User = Depends(get_current_user)
):
    # 从数据库读取 provider api_key
    provider = await get_provider_config(current_user.id)
    # 调用 AI API
    response = await call_ai_api(provider.api_key, request)
    return response
```

---

### Decision 6: 操作按钮存储设计

**选择**：每个用户独立的操作按钮配置

```sql
-- 操作按钮配置表
CREATE TABLE query_actions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),  -- NULL 表示系统内置
    action_key VARCHAR(50) NOT NULL,     -- 'knowledge-explain'
    label VARCHAR(100) NOT NULL,         -- '解释'
    query_template TEXT NOT NULL,
    followup_template TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    is_system BOOLEAN DEFAULT false,     -- true = 内置不可删
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

系统内置按钮（解释、出题角度、易错点）is_system=true，无法删除。

---

## Risks / Trade-offs

| Risk | Description | Mitigation |
|------|-------------|------------|
| API Key 安全 | 后端存储 API Key 如果数据库被攻破 | 使用环境变量 + 加密存储，考虑 KMS |
| 密码安全 | 用户密码如果泄露 | bcrypt 强哈希，密码强度要求 |
| 数据一致性 | 多端同时修改可能导致冲突 | 乐观锁 / 最后写入优先 |
| AI 请求失败 | AI 服务不可用 | 重试机制，优雅降级 |

---

## Migration Plan

### Phase 1: 项目骨架
1. 创建 `new-project/` 目录结构
2. 初始化 FastAPI 后端项目
3. 初始化 Semi Design 前端项目
4. 配置 docker-compose（PostgreSQL）

### Phase 2: 后端核心
1. 数据库模型定义（User, Provider, Model, ConceptHistory, Task, QueryAction）
2. 用户认证 API（注册/登录/JWT）
3. 提供商/模型管理 API

### Phase 3: 前端核心
1. 登录/注册页面
2. API 服务层（Axios 封装 + JWT 拦截器）
3. 概念拆解页面（复用现有逻辑）

### Phase 4: 功能完善
1. 操作按钮配置页面（ModelManager 改写为 Semi Design）
2. 任务管理页面
3. 联网搜索配置

---

## Open Questions

1. **JWT 过期时间**：access_token 1小时够吗？refresh_token 7天？
2. **AI 请求超时**：30秒还是更长？前端如何展示 loading 状态？
3. **操作按钮图标**：系统内置按钮用固定图标，自定义按钮呢？
4. **数据库连接池**：生产环境需要多少连接数？