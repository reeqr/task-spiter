## 1. 数据库迁移

- [x] 1.1 创建 Folder 模型（`backend/app/models/folder.py`）
- [x] 1.2 在 `concept_history` 表添加 `folder_id` 字段
- [x] 1.3 创建数据库迁移脚本
- [x] 1.4 更新 `__init__.py` 导出 Folder 模型

## 2. 后端 API

- [x] 2.1 创建 Folder 的 Pydantic Schema（`backend/app/schemas/folder.py`）
- [x] 2.2 实现 `GET /folders/tree` - 获取完整目录树（含知识树）
- [x] 2.3 实现 `POST /folders` - 创建目录
- [x] 2.4 实现 `PUT /folders/{id}` - 更新目录（重命名、移动）
- [x] 2.5 实现 `DELETE /folders/{id}` - 删除目录（级联删除子目录和知识树）
- [x] 2.6 修改 `POST /concepts/breakdown` 支持 `folder_id` 参数
- [x] 2.7 实现 `PUT /concepts/history/{id}/move` - 移动知识树到指定目录
- [x] 2.8 添加循环引用校验（parent_id 不能是后代）

## 3. 前端目录树组件

- [x] 3.1 创建 `FolderTree` 组件（使用 Semi Tree）
- [x] 3.2 实现右键菜单组件 `ContextMenu`（新建目录、新建知识树、重命名、删除）
- [x] 3.3 实现拖拽排序和拖拽移动功能
- [x] 3.4 实现选中态管理（单击/双击选中，高亮）
- [x] 3.5 创建新建目录对话框
- [x] 3.6 创建重命名对话框
- [x] 3.7 创建删除确认对话框（显示将被删除的子内容）

## 4. 集成与测试

- [x] 4.1 替换 SideSheet 中的历史记录列表为目录树
- [ ] 4.2 测试目录 CRUD 操作
- [ ] 4.3 测试知识树创建并归属到目录
- [ ] 4.4 测试拖拽排序
- [ ] 4.5 测试拖拽移动知识树到不同目录
- [ ] 4.6 测试删除目录（确认级联删除）