/**
 * 概念拆解页面组件
 */

import { useEffect, useRef, useState } from 'react';
import { Card, Typography, message, Button, Space, Modal, Empty, Input, Tag } from 'antd';
import { ReloadOutlined, BulbOutlined, QuestionCircleOutlined, LoadingOutlined, SearchOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { ConceptInput } from './ConceptInput';
import { TerminologyList } from './TerminologyList';
import { useConceptBreakdown } from '../hooks/useConceptBreakdown';
import { useConceptHistory } from '../hooks/useConceptHistory';
import type { ConceptBreakdown } from '../types/concept';
import { updateTermInTree } from '../utils/conceptTree';
import { streamQueryActionAI, type QueryChatMessage } from '../utils/api';
import {
  getEnabledQueryActions,
  loadPromptTemplates,
  QUERY_ACTION_COMMON_TRAPS,
  QUERY_ACTION_EXAM_ANGLE,
  QUERY_ACTION_KNOWLEDGE,
} from '../utils/promptConfig';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface QueryChatModalState {
  visible: boolean;
  actionId: string;
  actionLabel: string;
  termId: string;
  termName: string;
  termDefinition?: string;
  messages: QueryChatMessage[];
  input: string;
  sending: boolean;
}

function createInitialQueryChatModalState(): QueryChatModalState {
  return {
    visible: false,
    actionId: '',
    actionLabel: '',
    termId: '',
    termName: '',
    termDefinition: '',
    messages: [],
    input: '',
    sending: false,
  };
}

/** 将 LaTeX 的 \\(...\\)、\\[...\\] 转为 remark-math 的 $/$$，勿再 strip \\(|\\)（会破坏公式）；MiniMax 等常输出 \\(...\\) 而非 $ */
function prepareMathForMarkdown(raw: string): string {
  let t = raw.replace(/\\\$/g, '$');
  t = t.replace(/\\\[([\s\S]*?)\\\]/g, (_, b) => `$$\n${b.trim()}\n$$`);
  t = t.replace(/\\\(([\s\S]*?)\\\)/g, (_, b) => `$${b}$`);
  return t.trim();
}

function getQueryActionIcon(actionId: string) {
  if (actionId === QUERY_ACTION_KNOWLEDGE) return <QuestionCircleOutlined />;
  if (actionId === QUERY_ACTION_EXAM_ANGLE) return <SearchOutlined />;
  if (actionId === QUERY_ACTION_COMMON_TRAPS) return <BulbOutlined />;
  return <QuestionCircleOutlined />;
}

export function ConceptBreakdownPage() {
  const { breakdownConcept, isLoading } = useConceptBreakdown();
  const { history, saveToHistory, deleteFromHistory } = useConceptHistory();
  const [result, setResult] = useState<ConceptBreakdown | null>(null);
  const [lastConcept, setLastConcept] = useState<string>('');
  const [queryingTermByAction, setQueryingTermByAction] = useState<Record<string, string | null>>({});
  const [queryingRootByAction, setQueryingRootByAction] = useState<Record<string, boolean>>({});
  const [queryModal, setQueryModal] = useState<QueryChatModalState>(createInitialQueryChatModalState());
  const queryScrollRef = useRef<HTMLDivElement | null>(null);
  const queryRequestIdRef = useRef(0);
  const queryAbortRef = useRef<AbortController | null>(null);
  const [queryAutoScroll, setQueryAutoScroll] = useState(true);
  // 追踪是否有活跃的拆解操作
  const breakdownRef = useRef(false);

  const enabledQueryActions = getEnabledQueryActions(loadPromptTemplates());
  const getActionById = (actionId: string) => enabledQueryActions.find((item) => item.id === actionId) || enabledQueryActions[0];

  const cancelQueryStream = () => {
    queryAbortRef.current?.abort();
    queryAbortRef.current = null;
  };

  const resetQueryState = () => {
    cancelQueryStream();
    queryRequestIdRef.current += 1;
    setQueryingTermByAction({});
    setQueryingRootByAction({});
    setQueryModal(createInitialQueryChatModalState());
  };

  useEffect(() => {
    if (!queryModal.visible || !queryAutoScroll) return;
    const el = queryScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [queryModal.messages, queryModal.visible, queryAutoScroll]);

  useEffect(() => () => {
    cancelQueryStream();
  }, []);

  // 当 result 变化且不在拆解过程中时，自动保存到历史
  useEffect(() => {
    if (result && !breakdownRef.current) {
      saveToHistory(result);
    }
  }, [result, saveToHistory]);

  const handleBreakdown = async (concept: string) => {
    try {
      breakdownRef.current = true;
      setLastConcept(concept);
      const breakdown = await breakdownConcept(concept);
      setResult(breakdown);
      message.success('拆解完成！');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '拆解失败，请重试');
    } finally {
      breakdownRef.current = false;
    }
  };

  const handleRetry = () => {
    if (lastConcept) handleBreakdown(lastConcept);
  };

  const handleLoadHistory = (breakdown: ConceptBreakdown) => {
    breakdownRef.current = true;
    setResult(breakdown);
    setLastConcept(breakdown.concept);
    message.success('已加载历史拆解结果');
    // 短暂延迟后重置，防止触发自动保存
    setTimeout(() => {
      breakdownRef.current = false;
    }, 100);
  };

  const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // 删除前设置标记，防止触发自动保存
    breakdownRef.current = true;
    deleteFromHistory(id);
    message.success('已删除历史记录');
    setTimeout(() => {
      breakdownRef.current = false;
    }, 100);
  };

  const handleBreakdownTerm = async (termId: string) => {
    if (!result) return;
    const collectExistingItems = (current: ConceptBreakdown) => {
      const terminologySet = new Set<string>();
      const knowledgeSet = new Set<string>();
      const walk = (node: ConceptBreakdown) => {
        node.terminology.forEach((term) => {
          terminologySet.add(term.name);
          if (term.children) walk(term.children);
        });
        node.knowledgePoints.forEach((point) => knowledgeSet.add(point.title));
      };
      walk(current);
      return { terminology: Array.from(terminologySet), knowledgePoints: Array.from(knowledgeSet) };
    };
    try {
      const findTermWithPath = (
        terms: typeof result.terminology,
        ancestors: string[] = []
      ): { term: typeof result.terminology[0]; path: string[] } | null => {
        for (const term of terms) {
          const currentPath = [...ancestors, term.name];
          if (term.id === termId) return { term, path: currentPath };
          if (term.children) {
            const found = findTermWithPath(term.children.terminology, currentPath);
            if (found) return found;
          }
        }
        return null;
      };
      const foundTerm = findTermWithPath(result.terminology, [result.concept]);
      if (!foundTerm) {
        message.error('未找到该术语');
        return;
      }
      const { term, path } = foundTerm;
      setResult((prev) => (prev ? { ...prev, terminology: updateTermInTree(prev.terminology, termId, { isBreakingDown: true }) } : prev));
      const existing = collectExistingItems(result);
      const breakdown = await breakdownConcept(term.name, existing, path);
      setResult((prev) => (prev
        ? {
          ...prev,
          terminology: updateTermInTree(prev.terminology, termId, {
            children: breakdown,
            isBreakingDown: false,
            isExpanded: true,
          }),
        }
        : prev));
      message.success(`"${term.name}" 拆解完成！`);
    } catch (error) {
      setResult((prev) => (prev ? { ...prev, terminology: updateTermInTree(prev.terminology, termId, { isBreakingDown: false }) } : prev));
      message.error(error instanceof Error ? error.message : '拆解失败，请重试');
    }
  };

  const handleToggleTermExpand = (termId: string) => {
    if (!result) return;
    setResult((prev) => {
      if (!prev) return prev;
      const findTerm = (terms: typeof result.terminology): boolean => {
        for (const term of terms) {
          if (term.id === termId) return term.isExpanded || false;
          if (term.children && findTerm(term.children.terminology)) return true;
        }
        return false;
      };
      const currentExpanded = findTerm(prev.terminology);
      return { ...prev, terminology: updateTermInTree(prev.terminology, termId, { isExpanded: !currentExpanded }) };
    });
  };

  const runQueryAction = async (params: { actionId: string; termId: string; termName: string; termDefinition?: string; isRoot?: boolean }) => {
    if (!result) return;
    const { actionId, termId, termName, termDefinition, isRoot = false } = params;
    if (isRoot ? queryingRootByAction[actionId] : queryingTermByAction[actionId] === termId) return;
    const action = getActionById(actionId);
    if (!action) return;
    cancelQueryStream();
    const requestId = ++queryRequestIdRef.current;
    const controller = new AbortController();
    queryAbortRef.current = controller;
    if (isRoot) setQueryingRootByAction((prev) => ({ ...prev, [actionId]: true }));
    else setQueryingTermByAction((prev) => ({ ...prev, [actionId]: termId }));
    setQueryModal({
      visible: true,
      actionId: action.id,
      actionLabel: action.label,
      termId,
      termName,
      termDefinition: termDefinition || '',
      messages: [{ role: 'assistant', content: '' }],
      input: '',
      sending: true,
    });
    try {
      const response = await streamQueryActionAI({
        actionId: action.id,
        term: termName,
        concept: result.concept,
        termDefinition,
      }, {
        onDelta: (deltaText) => {
          if (requestId !== queryRequestIdRef.current) return;
          setQueryModal((prev) => {
            const messages = [...prev.messages];
            const lastIndex = messages.length - 1;
            if (lastIndex < 0 || messages[lastIndex].role !== 'assistant') return prev;
            messages[lastIndex] = { ...messages[lastIndex], content: `${messages[lastIndex].content || ''}${deltaText}` };
            return { ...prev, messages };
          });
        },
      }, { signal: controller.signal });
      if (requestId !== queryRequestIdRef.current) return;
      setQueryModal((prev) => ({
        ...prev,
        messages: prev.messages.map((msg, idx) => (
          idx === prev.messages.length - 1 && msg.role === 'assistant'
            ? { ...msg, content: response.answer, sources: response.sources, sourceNotice: response.sourceNotice }
            : msg
        )),
        sending: false,
      }));
      if (queryAbortRef.current === controller) queryAbortRef.current = null;
    } catch (error) {
      if (requestId !== queryRequestIdRef.current) return;
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setQueryModal((prev) => ({ ...prev, sending: false }));
      message.error(error instanceof Error ? error.message : `查询${action.label}失败，请稍后重试`);
    } finally {
      if (requestId === queryRequestIdRef.current) {
        if (isRoot) setQueryingRootByAction((prev) => ({ ...prev, [actionId]: false }));
        else setQueryingTermByAction((prev) => ({ ...prev, [actionId]: null }));
      }
    }
  };

  const handleQueryAction = async (actionId: string, termId: string, termName: string, termDefinition?: string) => {
    await runQueryAction({ actionId, termId, termName, termDefinition, isRoot: false });
  };

  const handleQueryRootAction = async (actionId: string) => {
    if (!result) return;
    await runQueryAction({ actionId, termId: '__root__', termName: result.concept, isRoot: true });
  };

  const handleQueryFollowup = async () => {
    if (!result) return;
    const followupQuestion = queryModal.input.trim();
    if (!followupQuestion || queryModal.sending || !queryModal.visible || !queryModal.actionId) return;
    cancelQueryStream();
    const requestId = ++queryRequestIdRef.current;
    const controller = new AbortController();
    queryAbortRef.current = controller;
    const history = queryModal.messages;
    setQueryModal((prev) => ({
      ...prev,
      messages: [...prev.messages, { role: 'user', content: followupQuestion }, { role: 'assistant', content: '' }],
      input: '',
      sending: true,
    }));
    setQueryAutoScroll(true);
    try {
      const response = await streamQueryActionAI({
        actionId: queryModal.actionId,
        term: queryModal.termName,
        concept: result.concept,
        termDefinition: queryModal.termDefinition,
        followupQuestion,
        history,
      }, {
        onDelta: (deltaText) => {
          if (requestId !== queryRequestIdRef.current) return;
          setQueryModal((prev) => {
            const messages = [...prev.messages];
            const lastIndex = messages.length - 1;
            if (lastIndex < 0 || messages[lastIndex].role !== 'assistant') return prev;
            messages[lastIndex] = { ...messages[lastIndex], content: `${messages[lastIndex].content || ''}${deltaText}` };
            return { ...prev, messages };
          });
        },
      }, { signal: controller.signal });
      if (requestId !== queryRequestIdRef.current) return;
      setQueryModal((prev) => ({
        ...prev,
        messages: prev.messages.map((msg, idx) => (
          idx === prev.messages.length - 1 && msg.role === 'assistant'
            ? { ...msg, content: response.answer, sources: response.sources, sourceNotice: response.sourceNotice }
            : msg
        )),
        sending: false,
      }));
      if (queryAbortRef.current === controller) queryAbortRef.current = null;
    } catch (error) {
      if (requestId !== queryRequestIdRef.current) return;
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setQueryModal((prev) => ({ ...prev, sending: false }));
      message.error(error instanceof Error ? error.message : `${queryModal.actionLabel}追问失败，请稍后重试`);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-8">
      <div className="max-w-3xl mx-auto px-4">
        <Card className="!mb-6 !rounded-2xl !border-2 !border-pink-200/30 !shadow-lg animate-slide-up" styles={{ body: { padding: '24px' } }}>
          <ConceptInput onSubmit={handleBreakdown} isLoading={isLoading} />
          {history.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Text type="secondary" className="text-xs">从最近选择:</Text>
              <div className="flex flex-wrap gap-2 mt-2">
                {history.slice(0, 5).map((item) => (
                  <Tag
                    key={item.id}
                    closable
                    onClose={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleDeleteHistory(e, item.id);
                    }}
                    onClick={() => handleLoadHistory(item.breakdown)}
                    className="cursor-pointer !rounded-full !border-pink-200 !px-3 !py-1"
                  >
                    {item.concept}
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </Card>
        {result && (
          <Space direction="vertical" size="large" className="w-full">
            <Card className="!rounded-2xl !border-2 !border-pink-200/30 !shadow-lg animate-slide-up" styles={{ body: { padding: '20px' } }}>
              <Space direction="vertical" size="small" className="w-full">
                <Text className="text-gray-500 text-sm">正在拆解的概念</Text>
                <div className="flex items-center justify-between gap-2">
                  <Title level={4} className="!mb-0" style={{ color: '#FF85A2' }}>{result.concept}</Title>
                  <div className="flex items-center gap-1.5 flex-shrink-0" style={{ marginRight: '-6px' }}>
                    {enabledQueryActions.map((action) => (
                      <Button
                        key={action.id}
                        size="small"
                        icon={queryingRootByAction[action.id] ? <LoadingOutlined /> : getQueryActionIcon(action.id)}
                        onClick={() => void handleQueryRootAction(action.id)}
                        loading={queryingRootByAction[action.id]}
                        disabled={queryingRootByAction[action.id]}
                        className="!rounded-full"
                      >
                        {queryingRootByAction[action.id] ? '查询中' : action.label}
                      </Button>
                    ))}
                    <Button
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={handleRetry}
                      loading={isLoading}
                      className="!rounded-full"
                      type="primary"
                      style={{ background: 'linear-gradient(135deg, #B19CD9 0%, #87CEEB 100%)', border: 'none' }}
                    >
                      重新拆解
                    </Button>
                  </div>
                </div>
              </Space>
            </Card>
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <TerminologyList
                terminology={result.terminology}
                onBreakdown={handleBreakdownTerm}
                onToggleExpand={handleToggleTermExpand}
                queryActions={enabledQueryActions}
                onQueryAction={handleQueryAction}
                queryingTermByAction={queryingTermByAction}
              />
            </div>
          </Space>
        )}
        <Modal
          title={`"${queryModal.termName}" 的${queryModal.actionLabel}`}
          open={queryModal.visible}
          onCancel={resetQueryState}
          footer={null}
          width={800}
          className="concept-knowledge-modal"
        >
          {queryModal.messages.length > 0 ? (
            <div
              ref={queryScrollRef}
              className="prose prose-sm max-w-none text-gray-700 prose-p:my-3 prose-strong:text-gray-900 prose-headings:text-gray-900"
              style={{ maxHeight: '60vh', overflowY: 'auto' }}
              onScroll={(e) => {
                const target = e.currentTarget;
                const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
                setQueryAutoScroll(distanceToBottom < 24);
              }}
            >
              {queryModal.messages.map((msg, index) => (
                <div key={`${msg.role}-${index}`} style={{ marginBottom: '12px' }}>
                  {msg.role === 'user' && <Text strong className="text-pink-500">问题</Text>}
                  {msg.role === 'assistant' ? (
                    <div>
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {prepareMathForMarkdown(msg.content)}
                      </ReactMarkdown>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 rounded-lg border border-pink-100 bg-pink-50/40 p-2">
                          <Text strong className="text-pink-500">来源</Text>
                          <ul className="mt-1 mb-0 pl-5">
                            {msg.sources.map((source) => (
                              <li key={source.url} className="text-sm">
                                <a href={source.url} target="_blank" rel="noreferrer" className="text-blue-500">
                                  {source.title || source.url}
                                </a>
                                {source.publishedAt ? <span className="ml-2 text-gray-500">({source.publishedAt})</span> : null}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {msg.sourceNotice ? <Text type="secondary">{msg.sourceNotice}</Text> : null}
                    </div>
                  ) : (
                    <div className="text-gray-700 mt-1 whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无回答" style={{ padding: '40px 0' }} />
          )}
          {queryModal.sending ? (
            <div className="mt-4">
              <Text type="secondary">正在生成回答中...</Text>
            </div>
          ) : (
            <div className="mt-4">
              <TextArea
                value={queryModal.input}
                onChange={(e) => setQueryModal((prev) => ({ ...prev, input: e.target.value }))}
                onPressEnter={(e) => {
                  if ((e.nativeEvent as KeyboardEvent).isComposing || e.shiftKey) return;
                  e.preventDefault();
                  void handleQueryFollowup();
                }}
                placeholder="继续追问，按 Enter 发送（Shift+Enter 换行）"
                autoSize={{ minRows: 2, maxRows: 5 }}
                disabled={queryModal.sending}
              />
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
