/**
 * 概念拆解页面组件
 */

import { useEffect, useRef, useState } from 'react';
import { Card, Typography, message, Button, Space, Modal, Empty, Input } from 'antd';
import { ReloadOutlined, BulbOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { ConceptInput } from './ConceptInput';
import { TerminologyList } from './TerminologyList';
import { useConceptBreakdown } from '../hooks/useConceptBreakdown';
import type { ConceptBreakdown } from '../types/concept';
import { updateTermInTree } from '../utils/conceptTree';
import {
  streamKnowledgeFollowupAI,
  streamExamAngleFollowupAI,
  type QueryChatMessage,
} from '../utils/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface QueryChatModalState {
  visible: boolean;
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
    termId: '',
    termName: '',
    termDefinition: '',
    messages: [],
    input: '',
    sending: false,
  };
}

function normalizeAiAnswer(answer: string): string {
  return answer
    // AI 常输出转义美元符，恢复为数学分隔符
    .replace(/\\\$/g, '$')
    // 兼容转义括号数学语法
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .trim();
}

export function ConceptBreakdownPage() {
  const { breakdownConcept, isLoading } = useConceptBreakdown();
  const [result, setResult] = useState<ConceptBreakdown | null>(null);
  const [lastConcept, setLastConcept] = useState<string>('');
  const [queryingKnowledgeTermId, setQueryingKnowledgeTermId] = useState<string | null>(null);
  const [queryingExamAngleTermId, setQueryingExamAngleTermId] = useState<string | null>(null);
  const [queryingRootKnowledge, setQueryingRootKnowledge] = useState(false);
  const [queryingRootExamAngle, setQueryingRootExamAngle] = useState(false);

  const [knowledgeModal, setKnowledgeModal] = useState<QueryChatModalState>(createInitialQueryChatModalState());
  const [examAngleModal, setExamAngleModal] = useState<QueryChatModalState>(createInitialQueryChatModalState());
  const knowledgeScrollRef = useRef<HTMLDivElement | null>(null);
  const examAngleScrollRef = useRef<HTMLDivElement | null>(null);
  const knowledgeRequestIdRef = useRef(0);
  const examAngleRequestIdRef = useRef(0);
  const knowledgeAbortRef = useRef<AbortController | null>(null);
  const examAngleAbortRef = useRef<AbortController | null>(null);
  const [knowledgeAutoScroll, setKnowledgeAutoScroll] = useState(true);
  const [examAngleAutoScroll, setExamAngleAutoScroll] = useState(true);

  const cancelKnowledgeStream = () => {
    knowledgeAbortRef.current?.abort();
    knowledgeAbortRef.current = null;
  };

  const cancelExamAngleStream = () => {
    examAngleAbortRef.current?.abort();
    examAngleAbortRef.current = null;
  };

  useEffect(() => {
    if (!knowledgeModal.visible || !knowledgeAutoScroll) return;
    const el = knowledgeScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [knowledgeModal.messages, knowledgeModal.visible, knowledgeAutoScroll]);

  useEffect(() => {
    if (!examAngleModal.visible || !examAngleAutoScroll) return;
    const el = examAngleScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [examAngleModal.messages, examAngleModal.visible, examAngleAutoScroll]);

  useEffect(() => () => {
    cancelKnowledgeStream();
    cancelExamAngleStream();
  }, []);

  /**
   * 处理概念拆解
   */
  const handleBreakdown = async (concept: string) => {
    try {
      console.log('%c📍 ConceptBreakdownPage.handleBreakdown 被调用', 'color: #FF85A2; font-size: 14px; font-weight: bold');
      console.log('%c概念:', 'color: #B19CD9; font-weight: bold', concept);

      setLastConcept(concept);
      const breakdown = await breakdownConcept(concept);
      setResult(breakdown);

      message.success('拆解完成！');
    } catch (error) {
      console.error('%c❌ ConceptBreakdownPage 错误', 'color: #FF5C8D; font-size: 16px; font-weight: bold', error);
      message.error(error instanceof Error ? error.message : '拆解失败，请重试');
    }
  };

  /**
   * 处理重试
   */
  const handleRetry = () => {
    if (lastConcept) {
      handleBreakdown(lastConcept);
    }
  };

  /**
   * 处理术语的继续拆解
   */
  const handleBreakdownTerm = async (termId: string) => {
    if (!result) return;

    const collectExistingItems = (current: ConceptBreakdown) => {
      const terminologySet = new Set<string>();
      const knowledgeSet = new Set<string>();

      const walk = (node: ConceptBreakdown) => {
        node.terminology.forEach((term) => {
          terminologySet.add(term.name);
          if (term.children) {
            walk(term.children);
          }
        });
        node.knowledgePoints.forEach((point) => {
          knowledgeSet.add(point.title);
        });
      };

      walk(current);
      return {
        terminology: Array.from(terminologySet),
        knowledgePoints: Array.from(knowledgeSet),
      };
    };

    try {
      // 找到要拆解的术语
      const findTerm = (terms: typeof result.terminology): typeof result.terminology[0] | null => {
        for (const term of terms) {
          if (term.id === termId) return term;
          if (term.children) {
            const found = findTerm(term.children.terminology);
            if (found) return found;
          }
        }
        return null;
      };

      const term = findTerm(result.terminology);
      if (!term) {
        message.error('未找到该术语');
        return;
      }

      // 设置拆解中状态
      setResult(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          terminology: updateTermInTree(prev.terminology, termId, { isBreakingDown: true }),
        };
      });

      // 调用 AI 拆解
      const existing = collectExistingItems(result);
      const breakdown = await breakdownConcept(term.name, existing);

      // 更新结果，添加子项并设置为展开状态
      setResult(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          terminology: updateTermInTree(prev.terminology, termId, {
            children: breakdown,
            isBreakingDown: false,
            isExpanded: true,
          }),
        };
      });

      message.success(`"${term.name}" 拆解完成！`);
    } catch (error) {
      console.error('术语拆解错误:', error);

      // 失败时重置拆解中状态
      setResult(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          terminology: updateTermInTree(prev.terminology, termId, { isBreakingDown: false }),
        };
      });

      message.error(error instanceof Error ? error.message : '拆解失败，请重试');
    }
  };

  /**
   * 处理术语展开/收起
   */
  const handleToggleTermExpand = (termId: string) => {
    if (!result) return;

    setResult(prev => {
      if (!prev) return prev;

      // 找到术语当前状态
      const findTerm = (terms: typeof result.terminology): boolean => {
        for (const term of terms) {
          if (term.id === termId) return term.isExpanded || false;
          if (term.children && findTerm(term.children.terminology)) {
            return true;
          }
        }
        return false;
      };

      const currentExpanded = findTerm(prev.terminology);

      return {
        ...prev,
        terminology: updateTermInTree(prev.terminology, termId, { isExpanded: !currentExpanded }),
      };
    });
  };

  /**
   * 处理查询考点
   */
  const handleQueryKnowledge = async (termId: string, termName: string, termDefinition?: string) => {
    if (!result) return;

    if (queryingKnowledgeTermId === termId) return;

    cancelKnowledgeStream();
    const requestId = ++knowledgeRequestIdRef.current;
    const controller = new AbortController();
    knowledgeAbortRef.current = controller;
    setQueryingKnowledgeTermId(termId);
    setKnowledgeModal({
      visible: true,
      termId,
      termName,
      termDefinition: termDefinition || '',
      messages: [{ role: 'assistant', content: '' }],
      input: '',
      sending: true,
    });

    try {
      const response = await streamKnowledgeFollowupAI({
        term: termName,
        concept: result.concept,
        termDefinition,
      }, {
        onDelta: (deltaText) => {
          if (requestId !== knowledgeRequestIdRef.current) return;
          setKnowledgeModal(prev => {
            const messages = [...prev.messages];
            const lastIndex = messages.length - 1;
            if (lastIndex < 0 || messages[lastIndex].role !== 'assistant') return prev;
            messages[lastIndex] = {
              ...messages[lastIndex],
              content: `${messages[lastIndex].content || ''}${deltaText}`,
            };
            return { ...prev, messages };
          });
        },
      }, { signal: controller.signal });
      if (requestId !== knowledgeRequestIdRef.current) return;
      setKnowledgeModal(prev => ({
        ...prev,
        messages: prev.messages.map((msg, idx) => (
          idx === prev.messages.length - 1 && msg.role === 'assistant'
            ? { ...msg, content: response.answer, sources: response.sources, sourceNotice: response.sourceNotice }
            : msg
        )),
        sending: false,
      }));
      if (knowledgeAbortRef.current === controller) knowledgeAbortRef.current = null;
    } catch (error) {
      if (requestId !== knowledgeRequestIdRef.current) return;
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setKnowledgeModal(prev => ({ ...prev, sending: false }));
      message.error(error instanceof Error ? error.message : '查询考点失败，请稍后重试');
    } finally {
      if (requestId === knowledgeRequestIdRef.current) setQueryingKnowledgeTermId(null);
    }
  };

  /**
   * 处理查询出题角度
   */
  const handleQueryExamAngles = async (termId: string, termName: string, termDefinition?: string) => {
    if (!result) return;
    if (queryingExamAngleTermId === termId) return;
    cancelExamAngleStream();
    const requestId = ++examAngleRequestIdRef.current;
    const controller = new AbortController();
    examAngleAbortRef.current = controller;
    setQueryingExamAngleTermId(termId);
    setExamAngleModal({
      visible: true,
      termId,
      termName,
      termDefinition: termDefinition || '',
      messages: [{ role: 'assistant', content: '' }],
      input: '',
      sending: true,
    });
    try {
      const response = await streamExamAngleFollowupAI({
        term: termName,
        concept: result.concept,
        termDefinition,
      }, {
        onDelta: (deltaText) => {
          if (requestId !== examAngleRequestIdRef.current) return;
          setExamAngleModal(prev => {
            const messages = [...prev.messages];
            const lastIndex = messages.length - 1;
            if (lastIndex < 0 || messages[lastIndex].role !== 'assistant') return prev;
            messages[lastIndex] = {
              ...messages[lastIndex],
              content: `${messages[lastIndex].content || ''}${deltaText}`,
            };
            return { ...prev, messages };
          });
        },
      }, { signal: controller.signal });
      if (requestId !== examAngleRequestIdRef.current) return;
      setExamAngleModal(prev => ({
        ...prev,
        messages: prev.messages.map((msg, idx) => (
          idx === prev.messages.length - 1 && msg.role === 'assistant'
            ? { ...msg, content: response.answer, sources: response.sources, sourceNotice: response.sourceNotice }
            : msg
        )),
        sending: false,
      }));
      if (examAngleAbortRef.current === controller) examAngleAbortRef.current = null;
    } catch (error) {
      if (requestId !== examAngleRequestIdRef.current) return;
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setExamAngleModal(prev => ({ ...prev, sending: false }));
      message.error(error instanceof Error ? error.message : '查询出题角度失败，请稍后重试');
    } finally {
      if (requestId === examAngleRequestIdRef.current) setQueryingExamAngleTermId(null);
    }
  };

  const handleKnowledgeFollowup = async () => {
    if (!result) return;
    const followupQuestion = knowledgeModal.input.trim();
    if (!followupQuestion || knowledgeModal.sending || !knowledgeModal.visible) return;
    cancelKnowledgeStream();
    const requestId = ++knowledgeRequestIdRef.current;
    const controller = new AbortController();
    knowledgeAbortRef.current = controller;
    const history = knowledgeModal.messages;
    setKnowledgeModal(prev => ({
      ...prev,
      messages: [
        ...prev.messages,
        { role: 'user', content: followupQuestion },
        { role: 'assistant', content: '' },
      ],
      input: '',
      sending: true,
    }));
    setKnowledgeAutoScroll(true);
    try {
      const response = await streamKnowledgeFollowupAI({
        term: knowledgeModal.termName,
        concept: result.concept,
        termDefinition: knowledgeModal.termDefinition,
        followupQuestion,
        history,
      }, {
        onDelta: (deltaText) => {
          if (requestId !== knowledgeRequestIdRef.current) return;
          setKnowledgeModal(prev => {
            const messages = [...prev.messages];
            const lastIndex = messages.length - 1;
            if (lastIndex < 0 || messages[lastIndex].role !== 'assistant') return prev;
            messages[lastIndex] = {
              ...messages[lastIndex],
              content: `${messages[lastIndex].content || ''}${deltaText}`,
            };
            return { ...prev, messages };
          });
        },
      }, { signal: controller.signal });
      if (requestId !== knowledgeRequestIdRef.current) return;
      setKnowledgeModal(prev => ({
        ...prev,
        messages: prev.messages.map((msg, idx) => (
          idx === prev.messages.length - 1 && msg.role === 'assistant'
            ? { ...msg, content: response.answer, sources: response.sources, sourceNotice: response.sourceNotice }
            : msg
        )),
        sending: false,
      }));
      if (knowledgeAbortRef.current === controller) knowledgeAbortRef.current = null;
    } catch (error) {
      if (requestId !== knowledgeRequestIdRef.current) return;
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setKnowledgeModal(prev => ({ ...prev, sending: false }));
      message.error(error instanceof Error ? error.message : '追问失败，请稍后重试');
    }
  };

  const handleExamAngleFollowup = async () => {
    if (!result) return;
    const followupQuestion = examAngleModal.input.trim();
    if (!followupQuestion || examAngleModal.sending || !examAngleModal.visible) return;
    cancelExamAngleStream();
    const requestId = ++examAngleRequestIdRef.current;
    const controller = new AbortController();
    examAngleAbortRef.current = controller;
    const history = examAngleModal.messages;
    setExamAngleModal(prev => ({
      ...prev,
      messages: [
        ...prev.messages,
        { role: 'user', content: followupQuestion },
        { role: 'assistant', content: '' },
      ],
      input: '',
      sending: true,
    }));
    setExamAngleAutoScroll(true);
    try {
      const response = await streamExamAngleFollowupAI({
        term: examAngleModal.termName,
        concept: result.concept,
        termDefinition: examAngleModal.termDefinition,
        followupQuestion,
        history,
      }, {
        onDelta: (deltaText) => {
          if (requestId !== examAngleRequestIdRef.current) return;
          setExamAngleModal(prev => {
            const messages = [...prev.messages];
            const lastIndex = messages.length - 1;
            if (lastIndex < 0 || messages[lastIndex].role !== 'assistant') return prev;
            messages[lastIndex] = {
              ...messages[lastIndex],
              content: `${messages[lastIndex].content || ''}${deltaText}`,
            };
            return { ...prev, messages };
          });
        },
      }, { signal: controller.signal });
      if (requestId !== examAngleRequestIdRef.current) return;
      setExamAngleModal(prev => ({
        ...prev,
        messages: prev.messages.map((msg, idx) => (
          idx === prev.messages.length - 1 && msg.role === 'assistant'
            ? { ...msg, content: response.answer, sources: response.sources, sourceNotice: response.sourceNotice }
            : msg
        )),
        sending: false,
      }));
      if (examAngleAbortRef.current === controller) examAngleAbortRef.current = null;
    } catch (error) {
      if (requestId !== examAngleRequestIdRef.current) return;
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setExamAngleModal(prev => ({ ...prev, sending: false }));
      message.error(error instanceof Error ? error.message : '追问失败，请稍后重试');
    }
  };

  const handleQueryRootKnowledge = async () => {
    if (!result || queryingRootKnowledge) return;
    cancelKnowledgeStream();
    const requestId = ++knowledgeRequestIdRef.current;
    const controller = new AbortController();
    knowledgeAbortRef.current = controller;
    setQueryingRootKnowledge(true);
    setKnowledgeModal({
      visible: true,
      termId: '__root__',
      termName: result.concept,
      termDefinition: '',
      messages: [{ role: 'assistant', content: '' }],
      input: '',
      sending: true,
    });
    try {
      const response = await streamKnowledgeFollowupAI({
        term: result.concept,
        concept: result.concept,
      }, {
        onDelta: (deltaText) => {
          if (requestId !== knowledgeRequestIdRef.current) return;
          setKnowledgeModal(prev => {
            const messages = [...prev.messages];
            const lastIndex = messages.length - 1;
            if (lastIndex < 0 || messages[lastIndex].role !== 'assistant') return prev;
            messages[lastIndex] = {
              ...messages[lastIndex],
              content: `${messages[lastIndex].content || ''}${deltaText}`,
            };
            return { ...prev, messages };
          });
        },
      }, { signal: controller.signal });
      if (requestId !== knowledgeRequestIdRef.current) return;
      setKnowledgeModal(prev => ({
        ...prev,
        messages: prev.messages.map((msg, idx) => (
          idx === prev.messages.length - 1 && msg.role === 'assistant'
            ? { ...msg, content: response.answer, sources: response.sources, sourceNotice: response.sourceNotice }
            : msg
        )),
        sending: false,
      }));
      if (knowledgeAbortRef.current === controller) knowledgeAbortRef.current = null;
    } catch (error) {
      if (requestId !== knowledgeRequestIdRef.current) return;
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setKnowledgeModal(prev => ({ ...prev, sending: false }));
      message.error(error instanceof Error ? error.message : '查询解释失败，请稍后重试');
    } finally {
      if (requestId === knowledgeRequestIdRef.current) setQueryingRootKnowledge(false);
    }
  };

  const handleQueryRootExamAngles = async () => {
    if (!result || queryingRootExamAngle) return;
    cancelExamAngleStream();
    const requestId = ++examAngleRequestIdRef.current;
    const controller = new AbortController();
    examAngleAbortRef.current = controller;
    setQueryingRootExamAngle(true);
    setExamAngleModal({
      visible: true,
      termId: '__root__',
      termName: result.concept,
      termDefinition: '',
      messages: [{ role: 'assistant', content: '' }],
      input: '',
      sending: true,
    });
    try {
      const response = await streamExamAngleFollowupAI({
        term: result.concept,
        concept: result.concept,
      }, {
        onDelta: (deltaText) => {
          if (requestId !== examAngleRequestIdRef.current) return;
          setExamAngleModal(prev => {
            const messages = [...prev.messages];
            const lastIndex = messages.length - 1;
            if (lastIndex < 0 || messages[lastIndex].role !== 'assistant') return prev;
            messages[lastIndex] = {
              ...messages[lastIndex],
              content: `${messages[lastIndex].content || ''}${deltaText}`,
            };
            return { ...prev, messages };
          });
        },
      }, { signal: controller.signal });
      if (requestId !== examAngleRequestIdRef.current) return;
      setExamAngleModal(prev => ({
        ...prev,
        messages: prev.messages.map((msg, idx) => (
          idx === prev.messages.length - 1 && msg.role === 'assistant'
            ? { ...msg, content: response.answer, sources: response.sources, sourceNotice: response.sourceNotice }
            : msg
        )),
        sending: false,
      }));
      if (examAngleAbortRef.current === controller) examAngleAbortRef.current = null;
    } catch (error) {
      if (requestId !== examAngleRequestIdRef.current) return;
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setExamAngleModal(prev => ({ ...prev, sending: false }));
      message.error(error instanceof Error ? error.message : '查询出题角度失败，请稍后重试');
    } finally {
      if (requestId === examAngleRequestIdRef.current) setQueryingRootExamAngle(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* 概念输入区 */}
        <Card
          className="!mb-6 !rounded-2xl !border-2 !border-pink-200/30 !shadow-lg animate-slide-up"
          styles={{ body: { padding: '24px' } }}
        >
          <ConceptInput onSubmit={handleBreakdown} isLoading={isLoading} />
        </Card>

        {/* 拆解结果区 */}
        {result && (
          <Space direction="vertical" size="large" className="w-full">
            {/* 当前概念标题 */}
            <Card
              className="!rounded-2xl !border-2 !border-pink-200/30 !shadow-lg animate-slide-up"
              styles={{ body: { padding: '20px' } }}
            >
              <Space direction="vertical" size="small" className="w-full">
                <Text className="text-gray-500 text-sm">正在拆解的概念</Text>
                <div className="flex items-center justify-between gap-2">
                  <Title level={4} className="!mb-0" style={{ color: '#FF85A2' }}>
                    {result.concept}
                  </Title>
                  <div className="flex items-center gap-1.5 flex-shrink-0" style={{ marginRight: '-6px' }}>
                    <Button
                      size="small"
                      icon={<QuestionCircleOutlined />}
                      onClick={() => void handleQueryRootKnowledge()}
                      loading={queryingRootKnowledge}
                      disabled={queryingRootKnowledge}
                      className="!rounded-full"
                    >
                      解释
                    </Button>
                    <Button
                      size="small"
                      icon={<BulbOutlined />}
                      onClick={() => void handleQueryRootExamAngles()}
                      loading={queryingRootExamAngle}
                      disabled={queryingRootExamAngle}
                      className="!rounded-full"
                    >
                      出题角度
                    </Button>
                    <Button
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={handleRetry}
                      loading={isLoading}
                      className="!rounded-full"
                      type="primary"
                      style={{
                        background: 'linear-gradient(135deg, #B19CD9 0%, #87CEEB 100%)',
                        border: 'none',
                      }}
                    >
                      重新拆解
                    </Button>
                  </div>
                </div>
              </Space>
            </Card>

            {/* 专业术语列表 */}
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <TerminologyList
                terminology={result.terminology}
                onBreakdown={handleBreakdownTerm}
                onToggleExpand={handleToggleTermExpand}
                onQueryKnowledge={handleQueryKnowledge}
                onQueryExamAngles={handleQueryExamAngles}
                queryingKnowledgeTermId={queryingKnowledgeTermId}
                queryingExamAngleTermId={queryingExamAngleTermId}
              />
            </div>
          </Space>
        )}

        {/* 考点查询模态框 */}
        <Modal
          title={`"${knowledgeModal.termName}" 的解释`}
          open={knowledgeModal.visible}
          onCancel={() => {
            cancelKnowledgeStream();
            knowledgeRequestIdRef.current += 1;
            setQueryingKnowledgeTermId(null);
            setQueryingRootKnowledge(false);
            setKnowledgeModal(createInitialQueryChatModalState());
          }}
          footer={null}
          width={800}
          className="concept-knowledge-modal"
        >
          {knowledgeModal.messages.length > 0 ? (
            <div
              ref={knowledgeScrollRef}
              className="prose prose-sm max-w-none text-gray-700 prose-p:my-3 prose-strong:text-gray-900 prose-headings:text-gray-900"
              style={{ maxHeight: '60vh', overflowY: 'auto' }}
              onScroll={(e) => {
                const target = e.currentTarget;
                const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
                setKnowledgeAutoScroll(distanceToBottom < 24);
              }}
            >
              {knowledgeModal.messages.map((msg, index) => (
                <div key={`${msg.role}-${index}`} style={{ marginBottom: '12px' }}>
                  {msg.role === 'user' && <Text strong className="text-pink-500">问题</Text>}
                  {msg.role === 'assistant' ? (
                    <div>
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {normalizeAiAnswer(msg.content)}
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
          {knowledgeModal.sending ? (
            <div className="mt-4">
              <Text type="secondary">正在生成回答中...</Text>
            </div>
          ) : (
            <div className="mt-4">
              <TextArea
                value={knowledgeModal.input}
                onChange={(e) => setKnowledgeModal(prev => ({ ...prev, input: e.target.value }))}
                onPressEnter={(e) => {
                  if ((e.nativeEvent as KeyboardEvent).isComposing || e.shiftKey) return;
                  e.preventDefault();
                  void handleKnowledgeFollowup();
                }}
                placeholder="继续追问，按 Enter 发送（Shift+Enter 换行）"
                autoSize={{ minRows: 2, maxRows: 5 }}
                disabled={knowledgeModal.sending}
              />
            </div>
          )}
        </Modal>

        {/* 出题角度查询模态框 */}
        <Modal
          title={`"${examAngleModal.termName}" 的出题角度`}
          open={examAngleModal.visible}
          onCancel={() => {
            cancelExamAngleStream();
            examAngleRequestIdRef.current += 1;
            setQueryingExamAngleTermId(null);
            setQueryingRootExamAngle(false);
            setExamAngleModal(createInitialQueryChatModalState());
          }}
          footer={null}
          width={800}
          className="concept-knowledge-modal"
        >
          {examAngleModal.messages.length > 0 ? (
            <div
              ref={examAngleScrollRef}
              className="prose prose-sm max-w-none text-gray-700 prose-p:my-3 prose-strong:text-gray-900 prose-headings:text-gray-900"
              style={{ maxHeight: '60vh', overflowY: 'auto' }}
              onScroll={(e) => {
                const target = e.currentTarget;
                const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
                setExamAngleAutoScroll(distanceToBottom < 24);
              }}
            >
              {examAngleModal.messages.map((msg, index) => (
                <div key={`${msg.role}-${index}`} style={{ marginBottom: '12px' }}>
                  {msg.role === 'user' && <Text strong className="text-pink-500">问题</Text>}
                  {msg.role === 'assistant' ? (
                    <div>
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {normalizeAiAnswer(msg.content)}
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
          {examAngleModal.sending ? (
            <div className="mt-4">
              <Text type="secondary">正在生成回答中...</Text>
            </div>
          ) : (
            <div className="mt-4">
              <TextArea
                value={examAngleModal.input}
                onChange={(e) => setExamAngleModal(prev => ({ ...prev, input: e.target.value }))}
                onPressEnter={(e) => {
                  if ((e.nativeEvent as KeyboardEvent).isComposing || e.shiftKey) return;
                  e.preventDefault();
                  void handleExamAngleFollowup();
                }}
                placeholder="继续追问，按 Enter 发送（Shift+Enter 换行）"
                autoSize={{ minRows: 2, maxRows: 5 }}
                disabled={examAngleModal.sending}
              />
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
