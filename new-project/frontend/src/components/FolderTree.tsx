import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Tree, Input, Modal, Spin } from '@douyinfe/semi-ui';
import {
  IconFolder, IconFile, IconPlus, IconDelete, IconEdit
} from '@douyinfe/semi-icons';
import { conceptApi } from '../services/concept';

interface KnowledgeTreeSimple {
  id: string;
  concept: string;
  sort_order: number;
  created_at: string;
}

interface FolderTreeNode {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  type: 'folder' | 'root';
  created_at: string;
  children?: FolderTreeNode[];
  knowledge_trees?: KnowledgeTreeSimple[];
}

interface KnowledgeTreeNodeRef {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  type: 'knowledge_tree';
  created_at: string;
  concept: string;
}

type ContextMenuTarget = FolderTreeNode | KnowledgeTreeNodeRef;

interface FolderTreeProps {
  onSelectKnowledgeTree: (ktId: string, ktName: string) => void;
  onCreateKnowledgeTree: (folderId: string | null) => void;
  onCreated?: () => void; // 新建知识树/目录后刷新
  onFolderSelect?: (folderId: string | null, folderPath: string) => void; // 当前选中的文件夹
  onMoved?: () => void; // 知识树移动后刷新
}

export interface FolderTreeHandle {
  openCreateFolderDialog: () => void;
  getSelectedFolderId: () => string | null;
  expandAll: () => void;
  collapseAll: () => void;
  toggleExpandAll: () => void;
}

const FolderTree = forwardRef<FolderTreeHandle, FolderTreeProps>(({ onSelectKnowledgeTree, onCreateKnowledgeTree, onCreated, onFolderSelect, onMoved }, ref) => {
  const [treeData, setTreeData] = useState<FolderTreeNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuTarget, setContextMenuTarget] = useState<ContextMenuTarget | null>(null);

  const collectExpandableKeys = (nodes: FolderTreeNode[]): string[] => {
    const keys: string[] = [];

    const walk = (items: FolderTreeNode[]) => {
      items.forEach((node) => {
        const hasChildren = (node.children && node.children.length > 0) || (node.knowledge_trees && node.knowledge_trees.length > 0);
        if (node.type === 'folder' && hasChildren) {
          keys.push(node.id);
        }
        if (node.children && node.children.length > 0) {
          walk(node.children);
        }
      });
    };

    walk(nodes);
    return keys;
  };

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    openCreateFolderDialog: () => {
      setNewFolderName('');
      setCreateFolderDialogVisible(true);
      (window as any).__createFolderParentId = selectedFolderId;
    },
    getSelectedFolderId: () => selectedFolderId,
    expandAll: () => {
      setExpandedKeys(collectExpandableKeys(treeData));
    },
    collapseAll: () => {
      setExpandedKeys([]);
    },
    toggleExpandAll: () => {
      const allKeys = collectExpandableKeys(treeData);
      setExpandedKeys(prev => prev.length === allKeys.length ? [] : allKeys);
    },
  }), [selectedFolderId, treeData]);

  // Dialog states
  const [createFolderDialogVisible, setCreateFolderDialogVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameDialogVisible, setRenameDialogVisible] = useState(false);
  const [renameFolderName, setRenameFolderName] = useState('');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState<{ folder?: FolderTreeNode; childCount?: number; ktCount?: number }>({});
  const [deleteKtDialogVisible, setDeleteKtDialogVisible] = useState(false);
  const [deleteKtInfo, setDeleteKtInfo] = useState<{ kt?: KnowledgeTreeSimple }>({});

  const loadTree = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/v1/folders/tree', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setTreeData(data);
      setExpandedKeys(prev => {
        if (prev.length === 0) return prev;
        const nextSet = new Set(collectExpandableKeys(data));
        return prev.filter(key => nextSet.has(key));
      });
    } catch (error) {
      console.error('Failed to load folder tree:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTree();
    // 监听刷新事件
    const handleRefresh = () => loadTree();
    window.addEventListener('refreshFolderTree', handleRefresh);
    return () => window.removeEventListener('refreshFolderTree', handleRefresh);
  }, []);

  const handleRightClick = (e: React.MouseEvent, node: ContextMenuTarget) => {
    e.preventDefault();
    setContextMenuTarget(node);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuVisible(true);
  };

  const handleClick = (node: FolderTreeNode) => {
    if (node.type === 'folder') {
      // 选中文件夹，通知父组件
      setSelectedFolderId(node.id);
      // 计算路径
      const path = computeFolderPath(node);
      onFolderSelect?.(node.id, path);
    } else if (node.type === 'root') {
      // 选中根目录
      setSelectedFolderId(null);
      onFolderSelect?.(null, '/');
    }
  };

  // 计算文件夹的路径
  const computeFolderPath = (targetFolder: FolderTreeNode): string => {
    const paths: string[] = [];

    const findPath = (nodes: FolderTreeNode[], targetId: string, currentPath: string[]): boolean => {
      for (const node of nodes) {
        const newPath = [...currentPath, node.name];
        if (node.id === targetId) {
          paths.push(...newPath);
          return true;
        }
        if (node.children && node.children.length > 0) {
          if (findPath(node.children, targetId, newPath)) {
            return true;
          }
        }
      }
      return false;
    };

    // 遍历所有节点找目标文件夹
    for (const node of treeData) {
      if (node.type === 'root') {
        // 从根目录的孩子开始找
        if (node.children && findPath(node.children, targetFolder.id, [])) {
          break;
        }
      } else if (node.type === 'folder') {
        if (node.id === targetFolder.id) {
          paths.push(node.name);
          break;
        }
        if (node.children && findPath(node.children, targetFolder.id, [node.name])) {
          break;
        }
      }
    }

    return '/' + paths.join('/');
  };

  // Helper to find a node in treeData by key
  const toKnowledgeTreeRef = (kt: KnowledgeTreeSimple): KnowledgeTreeNodeRef => ({
    id: kt.id,
    name: kt.concept,
    concept: kt.concept,
    parent_id: null,
    sort_order: kt.sort_order,
    type: 'knowledge_tree',
    created_at: kt.created_at,
  });

  const findNodeByKey = (nodes: FolderTreeNode[], key: string | number | undefined): ContextMenuTarget | null => {
    if (!key) return null;
    const keyStr = String(key);

    for (const node of nodes) {
      // Check if this node's id matches
      if (node.id === keyStr) {
        return node;
      }

      // For root node, check knowledge_trees directly
      if (node.type === 'root' && node.knowledge_trees) {
        for (const kt of node.knowledge_trees) {
          if (kt.id === keyStr) {
            return toKnowledgeTreeRef(kt);
          }
        }
      }

      // For folder node, check its knowledge_trees
      if (node.type === 'folder' && node.knowledge_trees) {
        for (const kt of node.knowledge_trees) {
          if (kt.id === keyStr) {
            return toKnowledgeTreeRef(kt);
          }
        }
      }

      // Recursively search in children
      if (node.children && node.children.length > 0) {
        const found = findNodeByKey(node.children, key);
        if (found) return found;
      }
    }
    return null;
  };

  const closeContextMenu = () => {
    setContextMenuVisible(false);
  };

  const renderKnowledgeTreeLabel = (name: string) => (
    <div className="folder-tree-item folder-tree-item-file">
      <span className="folder-tree-item-text">{name}</span>
    </div>
  );

  const renderFolderLabel = (name: string) => (
    <div className="folder-tree-item folder-tree-item-folder">
      <span className="folder-tree-item-text">{name}</span>
    </div>
  );

  // 拖拽处理 - 移动知识树到指定目录
  const handleDrop = async (dragInfo: {
    dragNode: any;
    node: any;
    dropPosition: number;
    dropToGap: boolean;
  }) => {
    const { dragNode, node: dropNode } = dragInfo;
    console.log('handleDrop dragNode:', dragNode, 'dropNode:', dropNode);

    const dragKey = dragNode?.key;
    const dropKey = dropNode?.key;
    // 从 dropNode 获取 type，优先从 data 属性获取
    const dropType = dropNode?.type || dropNode?.data?.type;
    console.log('dropKey:', dropKey, 'dropType:', dropType);

    // 只有当目标是文件夹时才允许移动
    if ((dropType === 'folder') && dragKey && dropKey) {
      try {
        await conceptApi.moveKnowledgeTree(dragKey, dropKey);
        console.log('知识树移动成功到文件夹', dropKey);
        // 刷新树
        loadTree();
        onMoved?.();
      } catch (error) {
        console.error('移动知识树失败:', error);
      }
    } else {
      console.log('未满足移动条件 dropType:', dropType, 'dragKey:', dragKey, 'dropKey:', dropKey);
    }
  };

  // Create folder
  const handleCreateFolder = (parentId: string | null) => {
    setNewFolderName('');
    setCreateFolderDialogVisible(true);
    // Store parent id for later use
    (window as any).__createFolderParentId = parentId;
    closeContextMenu();
  };

  const confirmCreateFolder = async () => {
    console.log('confirmCreateFolder called, newFolderName:', newFolderName);
    // Use setTimeout to ensure state is updated
    setTimeout(async () => {
      const name = newFolderName;
      console.log('Using name:', name);
      if (!name.trim()) {
        console.log('Empty name, returning early');
        return;
      }
      try {
        const token = localStorage.getItem('access_token');
        console.log('Token:', token ? 'exists' : 'null');
        const parentId = (window as any).__createFolderParentId;
        console.log('ParentId:', parentId);
        const response = await fetch('/api/v1/folders', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: name,
            parent_id: parentId
          })
        });
        console.log('Response status:', response.status);
        setCreateFolderDialogVisible(false);
        loadTree();
        onCreated?.();
      } catch (error) {
        console.error('Failed to create folder:', error);
      }
    }, 100);
  };

  // Rename folder
  const handleRename = () => {
    if (!contextMenuTarget || contextMenuTarget.type === 'root') return;
    setRenameFolderName(contextMenuTarget.name);
    setRenameDialogVisible(true);
    closeContextMenu();
  };

  const confirmRename = async () => {
    if (!renameFolderName.trim() || !contextMenuTarget) return;
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`/api/v1/folders/${contextMenuTarget.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: renameFolderName })
      });
      setRenameDialogVisible(false);
      loadTree();
    } catch (error) {
      console.error('Failed to rename folder:', error);
    }
  };

  // Delete folder
  const handleDelete = () => {
    if (!contextMenuTarget || contextMenuTarget.type !== 'folder') return;
    const childCount = contextMenuTarget.children?.length || 0;
    const ktCount = contextMenuTarget.knowledge_trees?.length || 0;
    setDeleteInfo({ folder: contextMenuTarget, childCount, ktCount });
    setDeleteDialogVisible(true);
    closeContextMenu();
  };

  const confirmDelete = async () => {
    if (!deleteInfo.folder) return;
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`/api/v1/folders/${deleteInfo.folder.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setDeleteDialogVisible(false);
      loadTree();
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  // Create knowledge tree in folder
  const handleCreateKnowledgeTree = () => {
    if (!contextMenuTarget) return;
    const folderId = contextMenuTarget.type === 'folder' ? contextMenuTarget.id : null;
    onCreateKnowledgeTree(folderId);
    closeContextMenu();
  };

  // Delete knowledge tree
  const handleDeleteKt = () => {
    if (!contextMenuTarget || contextMenuTarget.type !== 'knowledge_tree') return;
    setDeleteKtInfo({
      kt: {
        id: contextMenuTarget.id,
        concept: contextMenuTarget.concept,
        sort_order: contextMenuTarget.sort_order,
        created_at: contextMenuTarget.created_at,
      }
    });
    setDeleteKtDialogVisible(true);
    closeContextMenu();
  };

  const confirmDeleteKt = async () => {
    if (!deleteKtInfo.kt) return;
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`/api/v1/concepts/history/${deleteKtInfo.kt.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setDeleteKtDialogVisible(false);
      loadTree();
      onCreated?.();
    } catch (error) {
      console.error('Failed to delete knowledge tree:', error);
    }
  };

  // Build tree data for Semi Tree - 不显示根目录
  const buildTreeData = () => {
    const result: any[] = [];

    treeData.forEach(node => {
      if (node.type === 'root') {
        // Root node: 添加知识树和子文件夹
        node.knowledge_trees?.forEach(kt => {
          result.push({
            key: kt.id,
            label: renderKnowledgeTreeLabel(kt.concept),
            value: kt.id,
            icon: <IconFile />,
            type: 'knowledge_tree',
            data: kt,
            onContextMenu: (e: React.MouseEvent) => handleRightClick(e, toKnowledgeTreeRef(kt))
          });
        });

        node.children?.forEach(folder => {
          result.push(buildFolderNode(folder));
        });
      } else if (node.type === 'folder') {
        result.push(buildFolderNode(node));
      }
    });

    return result;
  };

  const buildFolderNode = (folder: FolderTreeNode): any => {
    const children: any[] = [];

    // Add knowledge trees
    folder.knowledge_trees?.forEach(kt => {
      children.push({
        key: kt.id,
        label: renderKnowledgeTreeLabel(kt.concept),
        value: kt.id,
        icon: <IconFile />,
        type: 'knowledge_tree',
        data: kt,
        onClick: () => onSelectKnowledgeTree(kt.id, kt.concept),
        onContextMenu: (e: React.MouseEvent) => handleRightClick(e, toKnowledgeTreeRef(kt))
      });
    });

    // Add sub-folders
    folder.children?.forEach(subFolder => {
      children.push(buildFolderNode(subFolder));
    });

    return {
      key: folder.id,
      label: renderFolderLabel(folder.name),
      value: folder.id,
      icon: <IconFolder />,
      children: children.length > 0 ? children : undefined,
      type: 'folder',
      data: folder,
      onClick: () => handleClick(folder),
      onContextMenu: (e: React.MouseEvent) => handleRightClick(e, folder)
    };
  };

  // Context menu
  const renderContextMenu = () => {
    if (!contextMenuVisible) return null;

    const isRoot = contextMenuTarget?.type === 'root';
    const isFolder = contextMenuTarget?.type === 'folder';
    const isKnowledgeTree = contextMenuTarget?.type === 'knowledge_tree';

    return (
      <div
        className="folder-context-menu"
        style={{
          position: 'fixed',
          left: contextMenuPosition.x,
          top: contextMenuPosition.y,
          zIndex: 1000,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="folder-context-item"
          onClick={() => handleCreateFolder(contextMenuTarget?.type === 'folder' ? contextMenuTarget.id : null)}
        >
          <IconPlus style={{ fontSize: 14 }} /> 新建目录
        </div>
        {(isFolder || isRoot) && (
          <div
            className="folder-context-item"
            onClick={handleCreateKnowledgeTree}
          >
            <IconFile style={{ fontSize: 14 }} /> 新建知识树
          </div>
        )}
        {isKnowledgeTree && (
          <>
            <div className="folder-context-divider" />
            <div
              className="folder-context-item danger"
              onClick={handleDeleteKt}
            >
              <IconDelete style={{ fontSize: 14 }} /> 删除
            </div>
          </>
        )}
        {isFolder && (
          <>
            <div className="folder-context-divider" />
            <div
              className="folder-context-item"
              onClick={handleRename}
            >
              <IconEdit style={{ fontSize: 14 }} /> 重命名
            </div>
            <div
              className="folder-context-item danger"
              onClick={handleDelete}
            >
              <IconDelete style={{ fontSize: 14 }} /> 删除
            </div>
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <Spin />
      </div>
    );
  }

  return (
    <div onClick={closeContextMenu}>
      {/* 新建目录对话框 */}
      <Modal
        title="新建目录"
        visible={createFolderDialogVisible}
        onCancel={() => setCreateFolderDialogVisible(false)}
        onOk={() => {
          console.log('Modal onOk triggered');
          confirmCreateFolder();
        }}
      >
        <Input
          placeholder="目录名称"
          value={newFolderName}
          onChange={(value) => setNewFolderName(value as string)}
          style={{ width: '100%', marginTop: 12 }}
          autoFocus
        />
      </Modal>

      {/* 重命名对话框 */}
      <Modal
        title="重命名目录"
        visible={renameDialogVisible}
        onCancel={() => setRenameDialogVisible(false)}
        onOk={() => {
          console.log('Rename Modal onOk triggered');
          confirmRename();
        }}
      >
        <Input
          placeholder="目录名称"
          value={renameFolderName}
          onChange={(value) => setRenameFolderName(value as string)}
          style={{ width: '100%', marginTop: 12 }}
          autoFocus
        />
      </Modal>

      {/* 删除确认对话框 */}
      <Modal
        title="确认删除"
        visible={deleteDialogVisible}
        onCancel={() => setDeleteDialogVisible(false)}
        onOk={() => {
          console.log('Delete Modal onOk triggered');
          confirmDelete();
        }}
      >
        <div style={{ padding: '12px 0' }}>
          <p>确定要删除目录 "<strong>{deleteInfo.folder?.name}</strong>" 吗？</p>
          {deleteInfo.childCount !== undefined && deleteInfo.childCount > 0 && (
            <p style={{ color: '#ff6b6b' }}>此操作将删除 {deleteInfo.childCount} 个子目录</p>
          )}
          {deleteInfo.ktCount !== undefined && deleteInfo.ktCount > 0 && (
            <p style={{ color: '#ff6b6b' }}>此操作将删除 {deleteInfo.ktCount} 个知识树</p>
          )}
        </div>
      </Modal>

      {/* 删除知识树确认对话框 */}
      <Modal
        title="确认删除"
        visible={deleteKtDialogVisible}
        onCancel={() => setDeleteKtDialogVisible(false)}
        onOk={() => {
          console.log('Delete KT Modal onOk triggered');
          confirmDeleteKt();
        }}
      >
        <div style={{ padding: '12px 0' }}>
          <p>确定要删除知识树 "<strong>{deleteKtInfo.kt?.concept}</strong>" 吗？</p>
        </div>
      </Modal>

      {/* 目录树 */}
      <div
        onContextMenu={(e: React.MouseEvent) => {
          console.log('Context menu triggered!', e.target);
          e.preventDefault();
          // Find the clicked tree node
          const target = e.target as Element;
          const treeNode = target.closest?.('.semi-tree-option');
          console.log('treeNode found:', treeNode);
          if (treeNode) {
            const key = treeNode.getAttribute('data-key');
            console.log('key:', key);
            if (key) {
              const clickedNode = findNodeByKey(treeData, key);
              console.log('clickedNode:', clickedNode);
              if (clickedNode) {
                handleRightClick(e as any, clickedNode);
              }
            }
          }
        }}
      >
        <Tree
          className="folder-tree"
          treeData={buildTreeData()}
          expandedKeys={expandedKeys}
          draggable
          onExpand={(keys) => {
            setExpandedKeys(keys as string[]);
          }}
          onDragStart={(info) => {
            console.log('Tree onDragStart:', info);
          }}
          onDragEnd={(info) => {
            console.log('Tree onDragEnd:', info);
          }}
          onDrop={(info) => {
            console.log('Tree onDrop info:', info);
            handleDrop(info);
          }}
          onSelect={(selectedKey, selected, node) => {
            console.log('Tree onSelect:', selectedKey, selected, node);
            // Semi Tree 的 node 是数据对象，直接从 node 取 type
            const nodeType = (node as any)?.type;
            const nodeData = (node as any)?.data || node;
            console.log('nodeType:', nodeType, 'nodeData:', nodeData);
            if (nodeType === 'knowledge_tree') {
              onSelectKnowledgeTree(selectedKey as string, nodeData.label || nodeData.concept || '');
            } else if (nodeType === 'folder' && nodeData) {
              // 处理文件夹点击
              setSelectedFolderId(nodeData.id);
              const path = computeFolderPath(nodeData);
              console.log('Folder clicked, path:', path);
              onFolderSelect?.(nodeData.id, path);
            }
          }}
          style={{ padding: '8px 0' }}
        />
      </div>

      {/* 右键菜单 */}
      {renderContextMenu()}
    </div>
  );
});

export default FolderTree;
