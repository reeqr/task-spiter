import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Typography, Spin, Modal,
  Badge, AIChatInput
} from '@douyinfe/semi-ui';
import {
  IconSetting, IconTreeTriangleRight, IconFolder,
  IconSidebar, IconFile, IconChevronUpDown
} from '@douyinfe/semi-icons';
import { useAuth } from '../contexts/AuthContext';
import { conceptApi } from '../services/concept';
import FolderTree, { FolderTreeHandle } from '../components/FolderTree';
import RichContent from '../components/RichContent';
import type { KnowledgeTreeNode } from '../types';
import { useRef } from 'react';

const SIDEBAR_WIDTH = 280;
const SUGGESTION_PROMPTS = [
  '高等数学',
  '线性代数',
  '概率论与数理统计',
  'SQL 优化',
  '操作系统',
  '计算机网络',
];

const { Title, Text } = Typography;
// 将后端数据转换为统一树节点
function convertToTreeNode(
  item: { id: string; name: string; definition: string; path: string; is_expanded?: boolean; is_breaking_down?: boolean; children?: KnowledgeTreeNode[]; created_at?: string },
  type: 'term' | 'knowledge_point',
  historyId: string
): KnowledgeTreeNode {
  return {
    id: item.id,
    history_id: historyId,
    parent_id: null,
    name: item.name,
    definition: item.definition,
    type,
    sort_order: 0,
    is_expanded: item.is_expanded ?? false,
    is_breaking_down: item.is_breaking_down ?? false,
    path: item.path,
    created_at: item.created_at || new Date().toISOString(),
    children: item.children || [],
  };
}

// 查找节点及其路径
function findNodeAndPath(
  nodes: KnowledgeTreeNode[],
  targetId: string,
  path: KnowledgeTreeNode[] = []
): { node: KnowledgeTreeNode; path: KnowledgeTreeNode[] } | null {
  for (const node of nodes) {
    const currentPath = [...path, node];
    if (node.id === targetId) {
      return { node, path: currentPath };
    }
    if (node.children.length > 0) {
      const found = findNodeAndPath(node.children, targetId, currentPath);
      if (found) return found;
    }
  }
  return null;
}

// 更新树中的节点
function updateNodeInTree(
  nodes: KnowledgeTreeNode[],
  targetId: string,
  update: Partial<KnowledgeTreeNode>
): KnowledgeTreeNode[] {
  return nodes.map(node => {
    if (node.id === targetId) {
      return { ...node, ...update };
    }
    if (node.children.length > 0) {
      return { ...node, children: updateNodeInTree(node.children, targetId, update) };
    }
    return node;
  });
}

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // 左侧边栏状态
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentKnowledgeTreeName, setCurrentKnowledgeTreeName] = useState<string>('');
  const folderTreeRef = useRef<FolderTreeHandle>(null);

  // 概念拆解状态
  const [concept, setConcept] = useState('');
  const [loading, setLoading] = useState(false);
  const [knowledgeTree, setKnowledgeTree] = useState<KnowledgeTreeNode[]>([]);

  // 查询弹窗状态
  const [queryModalVisible, setQueryModalVisible] = useState(false);
  const [queryModalContent, setQueryModalContent] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [currentTerm, setCurrentTerm] = useState('');
  const [currentAction, setCurrentAction] = useState('');
  const [followupQuestion, setFollowupQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [streaming, setStreaming] = useState(false);
  const queryAbortRef = useRef<AbortController | null>(null);

  const extractPlainText = (inputContents: Array<{ type: string; [key: string]: any }>) => {
    return inputContents
      .map((item) => {
        if (item.type === 'text') return item.text || '';
        if (item.type === 'inputSlot') return item.placeholder || '';
        if (item.type === 'selectSlot') return item.value || '';
        if (item.type === 'skillSlot') return item.label || item.value || '';
        return '';
      })
      .join('');
  };

  const parseChatInput = (payload: { inputContents?: Array<{ type: string; [key: string]: any }> }) => {
    return extractPlainText(payload.inputContents || []).trim();
  };

  const handleBreakdown = async (conceptText?: string) => {
    const finalConcept = (conceptText ?? concept).trim();
    if (!finalConcept) return;
    setLoading(true);
    try {
      setConcept(finalConcept);
      const data = await conceptApi.breakdown({ concept: finalConcept, folder_id: currentFolderId || undefined });
      const treeNodes: KnowledgeTreeNode[] = [
        ...data.terminology.map((t: any) => convertToTreeNode(t, 'term', data.history_id || '')),
        ...data.knowledge_points.map((kp: any) => convertToTreeNode({ ...kp, name: kp.title, definition: kp.description }, 'knowledge_point', data.history_id || '')),
      ];
      setKnowledgeTree(treeNodes);
      // 刷新目录树
      setTimeout(() => {
        const event = new CustomEvent('refreshFolderTree');
        window.dispatchEvent(event);
      }, 100);
    } catch (error) {
      console.error('Failed to breakdown concept:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载历史详情
  const loadHistoryDetail = async (historyId: string) => {
    try {
      const detail = await conceptApi.getHistoryDetail(historyId);
      setConcept(detail.concept);
      const treeNodes: KnowledgeTreeNode[] = [
        ...(detail.terminology || []).map((t: any) => convertToTreeNode(t, 'term', detail.history_id)),
        ...(detail.knowledge_points || []).map((kp: any) => convertToTreeNode({ ...kp, name: kp.title, definition: kp.description }, 'knowledge_point', detail.history_id)),
      ];
      setKnowledgeTree(treeNodes);
    } catch (error) {
      console.error('Failed to load history detail:', error);
    }
  };

  // 递归拆解节点
  const handleBreakdownNode = async (nodeId: string) => {
    const found = findNodeAndPath(knowledgeTree, nodeId);
    if (!found) return;

    setKnowledgeTree(prev => updateNodeInTree(prev, nodeId, { is_breaking_down: true }));

    try {
      const data = await conceptApi.breakdownTerm(nodeId);
      const newChildren: KnowledgeTreeNode[] = [
        ...(data.terminology || []).map((t: any) => convertToTreeNode(t, 'term', found.node.history_id)),
        ...(data.knowledge_points || []).map((kp: any) => convertToTreeNode({ ...kp, name: kp.title, definition: kp.description }, 'knowledge_point', found.node.history_id)),
      ];

      setKnowledgeTree(prev => updateNodeInTree(prev, nodeId, {
        is_breaking_down: false,
        is_expanded: true,
        children: newChildren,
      }));
    } catch (error) {
      console.error('Failed to breakdown term:', error);
      setKnowledgeTree(prev => updateNodeInTree(prev, nodeId, { is_breaking_down: false }));
    }
  };

  // 展开/收起节点
  const handleToggleExpand = (nodeId: string) => {
    const found = findNodeAndPath(knowledgeTree, nodeId);
    if (!found) return;
    setKnowledgeTree(prev => updateNodeInTree(prev, nodeId, { is_expanded: !found.node.is_expanded }));
  };

  // 查询术语/考点
  const handleQuery = async (actionId: string, nodeName: string, actionLabel: string) => {
    setCurrentTerm(nodeName);
    setCurrentAction(actionLabel);
    setQueryLoading(true);
    setStreaming(true);
    setQueryModalContent('');
    setChatHistory([]);
    setQueryModalVisible(true);
    queryAbortRef.current?.abort();
    queryAbortRef.current = new AbortController();
    let streamedAnswer = '';

    try {
      await conceptApi.queryStream({
        action_id: actionId,
        term: nodeName,
        concept: concept,
      }, {
        onChunk: (chunk) => {
          streamedAnswer += chunk;
          setQueryModalContent(prev => prev + chunk);
        },
        onDone: () => {
          setChatHistory([{ role: 'assistant', content: streamedAnswer }]);
        },
        onError: () => {
          setQueryModalContent('查询失败，请重试');
        },
      }, { signal: queryAbortRef.current.signal });
    } catch (error) {
      setQueryModalContent('查询失败，请重试');
    } finally {
      setQueryLoading(false);
      setStreaming(false);
    }
  };

  // 追问
  const handleFollowup = async (questionText?: string) => {
    const finalQuestion = (questionText ?? followupQuestion).trim();
    if (!finalQuestion) return;

    setQueryLoading(true);
    setStreaming(true);
    const currentQuestion = finalQuestion;
    setChatHistory(prev => [...prev, { role: 'user', content: currentQuestion }]);
    setFollowupQuestion('');
    setQueryModalContent(prev => prev ? `${prev}\n\n---\n\n` : '');
    let streamedAnswer = '';
    queryAbortRef.current?.abort();
    queryAbortRef.current = new AbortController();

    try {
      await conceptApi.followupStream({
        action_id: currentAction === '解释' ? 'knowledge-explain' :
                   currentAction === '出题角度' ? 'exam-angle' : 'common-traps',
        term: currentTerm,
        concept: concept,
        followup_question: currentQuestion,
      }, {
        onChunk: (chunk) => {
          streamedAnswer += chunk;
          setQueryModalContent(prev => prev + chunk);
        },
        onDone: () => {
          setChatHistory(prev => [...prev, { role: 'assistant', content: streamedAnswer }]);
        },
        onError: () => {
          setQueryModalContent(prev => prev + '\n\n查询失败，请重试');
        },
      }, { signal: queryAbortRef.current.signal });
    } catch (error) {
      console.error('Failed to followup:', error);
    } finally {
      setQueryLoading(false);
      setStreaming(false);
    }
  };

  // 渲染知识树节点（卡片样式）
  const renderKnowledgeCard = (node: KnowledgeTreeNode) => {
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className="knowledge-node">
        <div className="knowledge-card">
          <div className="knowledge-card-header">
            {hasChildren && (
              <Button
                size="small"
                type="tertiary"
                icon={node.is_expanded ? <IconTreeTriangleRight style={{ transform: 'rotate(90deg)', fontSize: 10 }} /> : <IconTreeTriangleRight style={{ fontSize: 10 }} />}
                onClick={() => handleToggleExpand(node.id)}
                className="knowledge-expand-button"
              />
            )}
            <div className="knowledge-card-main">
              <Text strong className="knowledge-card-title">{node.name}</Text>
            </div>
          </div>

          <div className="knowledge-card-meta-row">
            <div className="knowledge-card-definition-wrap">
              {node.definition && (
                <Text type="tertiary" className="knowledge-card-definition">
                  {node.definition}
                </Text>
              )}
            </div>

            <div className="knowledge-card-actions">
              <Button
                size="small"
                type="tertiary"
                onClick={() => handleQuery('knowledge-explain', node.name, '解释')}
                className="knowledge-pill-button"
              >
                解释
              </Button>
              <Button
                size="small"
                type="tertiary"
                onClick={() => handleQuery('exam-angle', node.name, '出题角度')}
                className="knowledge-pill-button"
              >
                出题角度
              </Button>
              <Button
                size="small"
                type="secondary"
                icon={<IconTreeTriangleRight style={{ fontSize: 10 }} />}
                loading={node.is_breaking_down}
                onClick={() => handleBreakdownNode(node.id)}
                className="knowledge-pill-button knowledge-pill-button-primary"
              >
                {node.is_breaking_down ? '拆解' : '继续拆解'}
              </Button>
            </div>
          </div>
        </div>

        {hasChildren && node.is_expanded && (
          <div className="knowledge-children">
            {node.children.map(child => renderKnowledgeCard(child))}
          </div>
        )}
      </div>
    );
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // 处理从目录树选择知识树
  const handleSelectKnowledgeTree = (ktId: string, ktName: string) => {
    setCurrentKnowledgeTreeName(ktName);
    loadHistoryDetail(ktId);
  };

  // 处理从目录树新建知识树
  const handleCreateKnowledgeTree = (folderId: string | null) => {
    // 如果没有传入 folderId，使用当前选中的
    const targetFolderId = folderId !== undefined ? folderId : folderTreeRef.current?.getSelectedFolderId() ?? null;
    // 清除当前知识树，开启新对话
    setConcept('');
    setKnowledgeTree([]);
    setCurrentFolderId(targetFolderId);
    setCurrentKnowledgeTreeName('');
    // 聚焦到输入框
    setTimeout(() => {
      const input = document.querySelector('input[placeholder*="拆解概念"]') as HTMLInputElement;
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // 处理文件夹选中
  const handleFolderSelect = (folderId: string | null, _folderPath: string) => {
    setCurrentFolderId(folderId);
    // 选择文件夹时清除当前知识树名称
    setCurrentKnowledgeTreeName('');
  };

  const handleSuggestionClick = (value: string) => {
    setConcept(value);
  };

  const handleStopGenerate = () => {
    queryAbortRef.current?.abort();
    setQueryLoading(false);
    setStreaming(false);
  };

  const handleMainSend = (message: { inputContents?: Array<{ type: string; [key: string]: any }> }) => {
    const text = parseChatInput(message);
    handleBreakdown(text);
  };

  const handleFollowupSend = (message: { inputContents?: Array<{ type: string; [key: string]: any }> }) => {
    const text = parseChatInput(message);
    handleFollowup(text);
  };

  return (
    <div className="workspace-shell">
      {/* 左侧边栏 */}
      {!sidebarCollapsed && (
        <div className="workspace-sidebar" style={{ width: SIDEBAR_WIDTH }}>
          <div className="sidebar-tools">
            <div className="sidebar-tools-row">
              <Button
                theme="borderless"
                icon={<IconChevronUpDown />}
                onClick={() => folderTreeRef.current?.toggleExpandAll()}
                className="sidebar-icon-button"
                title="全部展开/收起"
              />
              <Button
                theme="borderless"
                icon={<IconFolder />}
                onClick={() => folderTreeRef.current?.openCreateFolderDialog()}
                className="sidebar-icon-button"
                title="新建目录"
              />
              <Button
                theme="borderless"
                icon={<IconFile />}
                onClick={() => handleCreateKnowledgeTree(null)}
                className="sidebar-icon-button"
                title="新建知识树"
              />
            </div>
          </div>

          <div className="sidebar-tree-shell">
            <FolderTree
              ref={folderTreeRef}
              onSelectKnowledgeTree={handleSelectKnowledgeTree}
              onCreateKnowledgeTree={handleCreateKnowledgeTree}
              onFolderSelect={handleFolderSelect}
              onMoved={() => {
                setCurrentKnowledgeTreeName('');
              }}
            />
          </div>

          <div className="sidebar-account">
            <button
              type="button"
              className="sidebar-account-button"
              onClick={handleLogout}
            >
              <div className="sidebar-account-avatar">
                {(user?.email?.[0] || 'U').toUpperCase()}
              </div>
              <div className="sidebar-account-meta">
                <span className="sidebar-account-name">
                  {user?.email?.split('@')[0] || '当前用户'}
                </span>
                <span className="sidebar-account-action">退出登录</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <div className="workspace-main">
        {/* Header */}
        <div className="workspace-header">
          <div className="workspace-header-left">
            <Button
              theme="borderless"
              icon={<IconSidebar />}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="sidebar-toggle-button"
              title={sidebarCollapsed ? '展开边栏' : '收起边栏'}
            >
            </Button>
            <div>
              {currentKnowledgeTreeName && (
                <Title heading={3} style={{ margin: 0 }} className="workspace-title">
                  {currentKnowledgeTreeName}
                </Title>
              )}
            </div>
          </div>
          <Button
            theme="borderless"
            icon={<IconSetting />}
            onClick={() => navigate('/config')}
            className="sidebar-toggle-button"
            title="配置"
          />
        </div>

        {/* 结果展示 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <Text type="tertiary" style={{ display: 'block', marginTop: 8 }}>正在拆解概念...</Text>
          </div>
        )}

        {!loading && knowledgeTree.length === 0 && (
          <div className="home-empty-state">
            <div className="home-empty-copy">
              <Title heading={2} className="home-empty-title">开始构建你的知识树</Title>
              <Text type="tertiary" className="home-empty-subtitle">
                选择一个概念，我们会先拆出主干节点，再逐层递归展开。
              </Text>
            </div>

            <div className="home-suggestion-grid">
              {SUGGESTION_PROMPTS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <AIChatInput
              className="home-ai-chat-input"
              placeholder="输入一个概念"
              generating={loading}
              canSend={!!concept.trim()}
              onMessageSend={handleMainSend}
              onStopGenerate={() => undefined}
              onContentChange={(content) => {
                setConcept(extractPlainText(content).trim());
              }}
              sendHotKey="enter"
              showUploadButton={false}
              showReference={false}
              showUploadFile={false}
              renderConfigureArea={() => null}
              renderActionArea={(props) => (
                <div className={props.className} style={{ width: '100%', justifyContent: 'flex-end' }}>
                  {props.menuItem}
                </div>
              )}
              style={{ width: 'min(920px, 100%)', background: '#fff' }}
            />
          </div>
        )}

        {/* 知识树卡片列表 */}
        {knowledgeTree.length > 0 && (
          <div className="knowledge-tree-shell">
            <div className="knowledge-tree-toolbar">
              <Title heading={5} style={{ margin: 0 }}>知识树</Title>
              <Badge count={knowledgeTree.length} />
            </div>
            <div className="concept-summary-card">
              <div className="concept-summary-row">
                <div className="knowledge-card-main">
                  <input
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    placeholder="输入要重新拆解的概念"
                    className="concept-summary-input"
                  />
                </div>
                <div className="knowledge-card-actions">
                  <Button
                    size="small"
                    type="tertiary"
                    onClick={() => handleQuery('knowledge-explain', concept, '解释')}
                    className="knowledge-pill-button"
                    disabled={!concept.trim()}
                  >
                    解释
                  </Button>
                  <Button
                    size="small"
                    type="tertiary"
                    onClick={() => handleQuery('exam-angle', concept, '出题角度')}
                    className="knowledge-pill-button"
                    disabled={!concept.trim()}
                  >
                    出题角度
                  </Button>
                  <Button
                    size="small"
                    type="secondary"
                    icon={<IconTreeTriangleRight style={{ fontSize: 10 }} />}
                    loading={loading}
                    onClick={() => handleBreakdown()}
                    className="knowledge-pill-button knowledge-pill-button-primary"
                  >
                    重新拆解
                  </Button>
                </div>
              </div>
            </div>
            <div className="knowledge-tree-list">
              {knowledgeTree.map(node => renderKnowledgeCard(node))}
            </div>
          </div>
        )}
      </div>

      {/* 查询弹窗 */}
      <Modal
        title={`${currentAction}: ${currentTerm}`}
        visible={queryModalVisible}
        onCancel={() => setQueryModalVisible(false)}
        footer={null}
        width={920}
      >
        <div style={{ maxHeight: 620, overflowY: 'auto', marginBottom: 12, paddingTop: 2 }} className="answer-modal-body">
          <RichContent content={queryModalContent} />
          {streaming && (
            <Text type="tertiary" style={{ fontSize: 13, marginTop: 8, display: 'block' }}>
              正在生成...
            </Text>
          )}
        </div>

        {chatHistory.length > 1 && (
          <div style={{ marginBottom: 16, padding: 14, backgroundColor: '#f7f8fa', borderRadius: 14 }}>
            {chatHistory.map((msg, index) => (
              <div key={index} style={{ marginBottom: 8 }}>
                <Text strong>{msg.role === 'user' ? '我' : 'AI'}：</Text>
                <div style={{ marginTop: 4 }}>
                  <RichContent content={msg.content} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!streaming && (
          <AIChatInput
            className="followup-ai-chat-input"
            placeholder="继续追问这个知识点..."
            generating={queryLoading}
            canSend={!!followupQuestion.trim()}
            onMessageSend={handleFollowupSend}
            onStopGenerate={handleStopGenerate}
            onContentChange={(content) => {
              setFollowupQuestion(extractPlainText(content).trim());
            }}
            sendHotKey="enter"
            showUploadButton={false}
            showReference={false}
            showUploadFile={false}
            renderConfigureArea={() => null}
            renderActionArea={(props) => (
              <div className={props.className} style={{ width: '100%', justifyContent: 'flex-end' }}>
                {props.menuItem}
              </div>
            )}
            style={{ width: '100%', background: '#fff' }}
          />
        )}
      </Modal>
    </div>
  );
}
