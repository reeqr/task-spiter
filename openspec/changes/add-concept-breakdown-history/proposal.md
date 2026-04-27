## Context

当前概念拆解结果仅存储在内存（React state）中，刷新页面后拆解结果会丢失。用户每次进入页面都需要重新拆解，效率低下。

## Goals / Non-Goals

**Goals:**
- 拆解完成后自动保存到 localStorage
- 支持从历史记录中选择并加载之前的拆解结果
- 支持删除历史记录

**Non-Goals:**
- 不需要搜索功能
- 不需要标签/分类
- 不需要导出/导入
- 不需要多人协作

## Decisions

### 1) 存储方案
- 使用 localStorage，key 为 `task_spiter_concept_history_v1`
- 数据结构：ConceptHistoryItem 数组
- 拆解完成时自动保存
- 概念名称相同则更新，不重复创建

### 2) UI 方案
- 在概念输入框旁边添加"历史"下拉菜单
- 显示最近使用的概念名称
- hover 显示删除按钮
- 点击加载历史拆解结果
