## Why

当前历史记录是扁平列表，无组织无层级。用户无法对知识树进行分类管理，只能按时间顺序查看。随着知识树数量增加，查找和管理变得困难。

## What Changes

- 新增 **Folder（目录）表**，支持多级嵌套（parent_id 自引用）
- `ConceptHistory`（知识树）增加 `folder_id` 外键，支持归属目录
- 新增目录 CRUD API：创建目录、重命名、删除（含级联）、获取目录树
- 新增知识树移动 API：可将知识树移动到不同目录
- 前端侧边栏改为目录树视图，支持：
  - 单击/双击选中目录或知识树
  - 右键菜单：新建目录、新建知识树、重命名、删除
  - 拖拽排序（同级调整顺序）
  - 拖拽移动（跨目录移动）
- 目录和知识树用不同图标区分（📁 vs 📄）

## Capabilities

### New Capabilities

- `folder-directory`: 目录管理能力，包含目录的创建、重命名、删除、移动、排序，以及目录树的查询
- `knowledge-tree-folder`: 知识树的目录归属能力，包含知识树的目录分配和移动

### Modified Capabilities

- `concept-breakdown-ui`: 知识树创建入口从"历史记录"改为"目录树"，不影响拆解能力本身

## Impact

- **数据库**：新增 `folders` 表，`concept_history` 表增加 `folder_id` 列
- **后端 API**：新增 `/folders` 端点，修改 `/concepts/breakdown` 支持 `folder_id` 参数
- **前端**：侧边栏 SideSheet 改造为目录树组件（Tree/TreeSelect + 自定义右键菜单 + 拖拽）