## Context

当前 `concept_history` 表存储知识树，用户只能按时间顺序查看历史记录，是扁平无层级的结构。

```
当前结构：
concept_history (扁平列表)
├── 知识树A
├── 知识树B
└── 知识树C
```

需要改造为支持目录管理的树形结构：

```
目标结构：
folders (目录表，支持 parent_id 自引用嵌套)
├── 目录A
│   ├── 目录A1
│   └── 知识树X
└── 目录B

concept_history (增加 folder_id 外键)
├── 知识树A (folder_id: NULL → 根目录)
├── 知识树B (folder_id: 目录A.id)
└── ...
```

## Goals / Non-Goals

**Goals:**
- 支持多级目录嵌套（parent_id 自引用）
- 目录和知识树可拖拽排序/移动
- 右键菜单支持新建、重命名、删除
- 用户可按目录组织知识树

**Non-Goals:**
- 不迁移旧数据，旧数据保留在根目录（folder_id = NULL）
- 不支持知识树复制（只支持移动）
- 不支持目录复制

## Decisions

### 1. 数据库设计

**新增 `folders` 表**：
```sql
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**修改 `concept_history` 表**：
```sql
ALTER TABLE concept_history ADD COLUMN folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;
```

### 2. API 设计

**Folders API (`/folders`)**:
- `GET /folders/tree` - 获取完整目录树（含知识树）
- `POST /folders` - 创建目录
- `PUT /folders/{id}` - 更新目录（重命名、移动）
- `DELETE /folders/{id}` - 删除目录（级联删除）

**修改 Concepts API**:
- `POST /concepts/breakdown` - 支持 `folder_id` 参数
- `PUT /concepts/history/{id}/move` - 移动知识树到指定目录

### 3. 前端组件

使用 Semi Design 的 Tree 组件 + 自定义右键菜单：
- `folderTree` 状态管理目录树数据
- `ContextMenu` 组件处理右键菜单
- 拖拽使用 Tree 组件的 `draggable` 属性

### 4. 排序策略

目录和知识树各自使用 `sort_order` 字段：
- 同级别内按 `sort_order` 升序排列
- 拖拽时更新相邻项的 `sort_order`
- 新建时 `sort_order` = max + 1

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 删除目录时误删重要知识树 | 强制确认对话框，列出将被删除的内容 |
| 循环引用（父目录设为子目录） | 后端校验 parent_id 不能是自己的后代 |
| 深层嵌套导致 UI 层级过深 | 限制最大嵌套深度为 10 级，或使用缩进上限 |

## Open Questions

1. 拖拽跨越目录时，是否需要确认？
2. 重命名时是否需要校验目录名唯一性（同级内不能重名）？
3. 删除确认对话框是否需要列出具体子内容数量？
