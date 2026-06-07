## 1. 项目初始化

- [x] 1.1 创建 new-project/ 目录结构
- [x] 1.2 创建 docker-compose.yml（PostgreSQL 15 + 服务网络）
- [x] 1.3 初始化 FastAPI 后端项目（Python 3.11+, requirements.txt）
- [x] 1.4 初始化 React + Vite + TypeScript 前端项目
- [x] 1.5 安装 Semi Design 依赖

## 2. 后端基础架构

- [x] 2.1 配置 SQLAlchemy 数据库连接
- [ ] 2.2 创建数据库迁移 Alembic 配置
- [x] 2.3 定义 User 模型（email, password_hash, created_at）
- [x] 2.4 实现 JWT 认证工具函数（create_access_token, verify_token）
- [x] 2.5 创建认证依赖 get_current_user

## 3. 后端 API：用户认证

- [x] 3.1 实现 POST /api/v1/auth/register（bcrypt 密码哈希）
- [x] 3.2 实现 POST /api/v1/auth/login（返回 JWT）
- [x] 3.3 实现 POST /api/v1/auth/refresh（刷新 access_token）
- [x] 3.4 实现 POST /api/v1/auth/logout（撤销 refresh_token）

## 4. 后端 API：提供商管理

- [x] 4.1 定义 Provider 模型（user_id, name, type, base_url, icon）
- [x] 4.2 定义 ProviderCredential 模型（provider_id, api_key_encrypted）
- [x] 4.3 实现 GET /api/v1/providers（列出用户提供商）
- [x] 4.4 实现 POST /api/v1/providers（添加提供商）
- [x] 4.5 实现 PUT /api/v1/providers/{id}（更新提供商）
- [x] 4.6 实现 DELETE /api/v1/providers/{id}（删除提供商）
- [x] 4.7 实现 GET /api/v1/config/predefined（预定义提供商模板）

## 5. 后端 API：模型管理

- [x] 5.1 定义 Model 模型（provider_id, name, model_code, display_name, max_tokens, temperature, supports_thinking）
- [x] 5.2 实现 GET /api/v1/providers/{provider_id}/models
- [x] 5.3 实现 POST /api/v1/models（添加模型）
- [x] 5.4 实现 PUT /api/v1/models/{id}（更新模型）
- [x] 5.5 实现 DELETE /api/v1/models/{id}（删除模型）
- [x] 5.6 实现 PUT /api/v1/models/current/{id}（设置当前模型）

## 6. 后端 API：概念拆解

- [x] 6.1 定义 ConceptHistory 模型（user_id, concept, created_at）
- [x] 6.2 定义 Term 模型（history_id, parent_id, name, definition, path, is_expanded）
- [x] 6.3 定义 KnowledgePoint 模型（history_id, parent_id, title, description, path, is_expanded）
- [x] 6.4 实现 POST /api/v1/concepts/breakdown（调用 AI 拆解概念）
- [x] 6.5 实现 GET /api/v1/concepts/history（列出历史）
- [x] 6.6 实现 GET /api/v1/concepts/history/{id}（获取详情）
- [x] 6.7 实现 DELETE /api/v1/concepts/history/{id}（删除历史）

## 7. 后端 API：术语和查询

- [x] 7.1 实现 POST /api/v1/terms/{term_id}/breakdown（递归拆解术语）
- [x] 7.2 实现 POST /api/v1/terms/query（查询术语：解释/出题角度、易错点）
- [x] 7.3 实现 POST /api/v1/concepts/query/followup（追问功能）
- [x] 7.4 实现 AI 代理调用（后端持有 API Key，调用智谱/OpenAI 等）

## 8. 后端 API：操作按钮配置

- [x] 8.1 定义 QueryAction 模型（user_id, action_key, label, query_template, followup_template, enabled, sort_order, is_system）
- [x] 8.2 实现 GET /api/v1/config/actions（获取用户操作按钮配置）
- [x] 8.3 实现 POST /api/v1/config/actions（创建自定义按钮）
- [x] 8.4 实现 PUT /api/v1/config/actions/{id}（更新按钮）
- [x] 8.5 实现 DELETE /api/v1/config/actions/{id}（删除自定义按钮）
- [x] 8.6 创建默认操作按钮种子数据（解释、出题角度、易错点）

## 9. 后端 API：任务管理

- [x] 9.1 定义 Task 模型（user_id, parent_id, title, description, completed, spicy_level, category）
- [x] 9.2 实现 GET /api/v1/tasks（列出任务，支持 completed 过滤）
- [x] 9.3 实现 POST /api/v1/tasks（创建任务）
- [x] 9.4 实现 PUT /api/v1/tasks/{id}（更新任务）
- [x] 9.5 实现 DELETE /api/v1/tasks/{id}（删除任务，含子任务）
- [x] 9.6 实现 PUT /api/v1/tasks/{id}/toggle（切换完成状态）
- [x] 9.7 实现 POST /api/v1/tasks/breakdown（AI 拆解任务）

## 10. 后端 API：联网搜索配置

- [x] 10.1 定义 WebSearchConfig 模型（user_id, enabled, search_engine, count, search_domain_filter, search_recency_filter）
- [x] 10.2 实现 GET /api/v1/config/web-search（获取配置）
- [x] 10.3 实现 PUT /api/v1/config/web-search（更新配置）

## 11. 前端基础架构

- [x] 11.1 配置 Semi Design 主题和全局样式
- [x] 11.2 创建 Axios 实例，配置 JWT 拦截器
- [x] 11.3 创建 AuthContext（登录状态管理）
- [x] 11.4 创建 API 服务层（authApi, providerApi, conceptApi, taskApi, configApi）

## 12. 前端页面：登录注册

- [x] 12.1 创建登录页面（email, password 表单）
- [x] 12.2 创建注册页面（email, password 确认）
- [x] 12.3 实现登录/注册 API 调用
- [x] 12.4 实现登录后跳转到首页

## 13. 前端页面：概念拆解

- [x] 13.1 创建 ConceptInput 组件
- [x] 13.2 创建 ConceptBreakdownPage 页面（集成在 HomePage）
- [ ] 13.3 创建 TerminologyTree 组件（术语树展示）- 简化实现
- [ ] 13.4 创建 KnowledgePointTree 组件（考点树展示，合并到术语树）- 简化实现
- [ ] 13.5 实现操作按钮渲染（根据 enabled 状态显示）- 简化实现
- [ ] 13.6 实现查询弹窗（解释、出题角度、易错点）
- [ ] 13.7 实现追问功能
- [x] 13.8 实现历史记录管理

## 14. 前端页面：操作按钮配置（ModelManager 改写）

- [x] 14.1 创建 ProviderManager 组件（添加/编辑/删除提供商）- 集成在 ConfigPage
- [x] 14.2 创建 ModelManager 组件（添加/编辑/删除模型）- 集成在 ConfigPage
- [x] 14.3 创建 ActionButtonConfig 组件（自定义操作按钮管理）- 集成在 ConfigPage
- [ ] 14.4 创建 PromptTemplateEditor 组件（提示词模板编辑）
- [ ] 14.5 创建 WebSearchConfig 组件（联网搜索配置）

## 15. 前端页面：任务管理

- [ ] 15.1 创建 TaskInput 组件
- [ ] 15.2 创建 TaskList 组件
- [ ] 15.3 创建 TaskItem 组件（展开/收起子任务）
- [ ] 15.4 实现任务完成切换
- [ ] 15.5 实现 AI 拆解任务

## 16. 集成测试

- [ ] 16.1 后端 API 测试（使用 pytest 或 curl）
- [ ] 16.2 前端页面渲染测试
- [ ] 16.3 登录注册流程测试
- [ ] 16.4 概念拆解流程测试
- [ ] 16.5 操作按钮配置测试

## 17. 部署配置

- [x] 17.1 配置后端环境变量（DATABASE_URL, SECRET_KEY）
- [x] 17.2 配置 CORS 允许前端访问
- [x] 17.3 配置 docker-compose 服务编排
- [ ] 17.4 编写 README.md（项目启动说明）