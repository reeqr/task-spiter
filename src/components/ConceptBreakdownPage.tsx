/**
 * 概念拆解页面组件
 */

import { useState } from 'react';
import { Card, Typography, message, Button, Space, Modal, Empty } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { ConceptInput } from './ConceptInput';
import { TerminologyList } from './TerminologyList';
import { useConceptBreakdown } from '../hooks/useConceptBreakdown';
import type { ConceptBreakdown } from '../types/concept';
import { updateTermInTree } from '../utils/conceptTree';
import { queryKnowledgeAI } from '../utils/api';

const { Title, Text } = Typography;

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

  // 考点模态框状态
  const [knowledgeModal, setKnowledgeModal] = useState<{
    visible: boolean;
    termId: string;
    termName: string;
    answer: string;
  }>({
    visible: false,
    termId: '',
    termName: '',
    answer: '',
  });

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

    setQueryingKnowledgeTermId(termId);

    try {
      const response = await queryKnowledgeAI({
        term: termName,
        concept: result.concept,
        termDefinition,
      });
      setKnowledgeModal({
        visible: true,
        termId,
        termName,
        answer: response.answer,
      });
    } catch (error) {
      setKnowledgeModal({
        visible: false,
        termId: '',
        termName: '',
        answer: '',
      });
      message.error(error instanceof Error ? error.message : '查询考点失败，请稍后重试');
    } finally {
      setQueryingKnowledgeTermId(null);
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
                <Title level={4} className="!mb-0" style={{ color: '#FF85A2' }}>
                  {result.concept}
                </Title>
                <Button
                  type="text"
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={handleRetry}
                  loading={isLoading}
                  className="!text-gray-400 hover:!text-pink-500"
                >
                  重新拆解
                </Button>
              </Space>
            </Card>

            {/* 专业术语列表 */}
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <TerminologyList
                terminology={result.terminology}
                onBreakdown={handleBreakdownTerm}
                onToggleExpand={handleToggleTermExpand}
                onQueryKnowledge={handleQueryKnowledge}
                queryingKnowledgeTermId={queryingKnowledgeTermId}
              />
            </div>
          </Space>
        )}

        {/* 考点查询模态框 */}
        <Modal
          title={`"${knowledgeModal.termName}" 的相关考点`}
          open={knowledgeModal.visible}
          onCancel={() => setKnowledgeModal(prev => ({ ...prev, visible: false }))}
          footer={null}
          width={800}
          className="concept-knowledge-modal"
        >
          {knowledgeModal.answer ? (
            <div
              className="prose prose-sm max-w-none text-gray-700 prose-p:my-3 prose-strong:text-gray-900 prose-headings:text-gray-900"
              style={{ maxHeight: '60vh', overflowY: 'auto' }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {normalizeAiAnswer(knowledgeModal.answer)}
              </ReactMarkdown>
            </div>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无回答" style={{ padding: '40px 0' }} />
          )}
        </Modal>
      </div>
    </div>
  );
}
