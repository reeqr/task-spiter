## 数据结构

```typescript
interface ConceptHistoryItem {
  id: string;           // UUID
  concept: string;      // 概念名称
  createdAt: number;   // 创建时间戳
  updatedAt: number;   // 更新时间戳
  breakdown: ConceptBreakdown;  // 完整拆解结果
}
```

## 存储键名

- localStorage key: `task_spiter_concept_history_v1`

## 核心逻辑

### 保存时机
- 拆解完成后调用 `saveToHistory(breakdown)`
- 检查概念名称是否已存在
  - 存在：更新 `updatedAt` 和 `breakdown`
  - 不存在：添加到数组头部

### 加载逻辑
- 页面初始化时从 localStorage 读取历史
- 点击历史项时将 `breakdown` 填充到 `result` 状态

### 删除逻辑
- hover 显示 × 按钮
- 点击删除从 localStorage 移除并更新 UI

## UI 设计

```
┌──────────────────────────────────────────────────────────┐
│ 概念: [________________________] [历史 ▼]  [开始拆解]   │
├──────────────────────────────────────────────────────────┤
│                           或从最近选择:                   │
│  [高等数学 ×] [计算机网络 ×] [操作系统 ×] ...            │
└──────────────────────────────────────────────────────────┘
```

## 依赖文件

- `src/types/concept.ts` - 添加 ConceptHistoryItem 类型
- `src/hooks/useConceptHistory.ts` - 新建，管理历史读写
- `src/components/ConceptBreakdownPage.tsx` - 集成历史功能
