/**
 * 专业术语列表组件
 */

import { Card, Empty, Space, Typography, Button } from 'antd';
import {
  BookOutlined,
  DownOutlined,
  RightOutlined,
  ThunderboltOutlined,
  LoadingOutlined,
  QuestionCircleOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import type { Term } from '../types/concept';
import { KnowledgePointList } from './KnowledgePointList';

const { Text } = Typography;

interface TerminologyListProps {
  terminology: Term[];
  level?: number; // 当前层级，用于缩进
  onBreakdown?: (termId: string) => void; // 处理继续拆解
  onToggleExpand?: (termId: string) => void; // 处理展开/收起
  onQueryKnowledge?: (termId: string, termName: string, termDefinition?: string) => void | Promise<void>; // 处理查询考点
  onQueryExamAngles?: (termId: string, termName: string, termDefinition?: string) => void | Promise<void>; // 处理查询出题角度
  queryingKnowledgeTermId?: string | null;
  queryingExamAngleTermId?: string | null;
}

export function TerminologyList({
  terminology,
  level = 0,
  onBreakdown,
  onToggleExpand,
  onQueryKnowledge,
  onQueryExamAngles,
  queryingKnowledgeTermId = null,
  queryingExamAngleTermId = null,
}: TerminologyListProps) {
  // 空状态处理
  if (terminology.length === 0) {
    return (
      <Card
        className="!rounded-2xl !border-2 !border-purple-200/30 !shadow-lg"
        styles={{ body: { padding: '48px 24px' } }}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical" size="small">
              <Text className="text-gray-400 text-lg">暂无专业术语</Text>
              <Text className="text-gray-300 text-base">
                未能提取到相关术语
              </Text>
            </Space>
          }
          imageStyle={{ height: 60 }}
        />
      </Card>
    );
  }

  return (
    <div className="w-full space-y-1.5">
      {terminology.map((term, index) => {
        const hasChildren = Boolean(term.children && (
          term.children.terminology.length > 0 ||
          term.children.knowledgePoints.length > 0
        ));
        const isQueryingKnowledge = queryingKnowledgeTermId === term.id;
        const isQueryingExamAngle = queryingExamAngleTermId === term.id;

        return (
          <Card
            key={term.id}
            className="!rounded-2xl !border-2 !border-purple-200/30 !shadow-lg hover:!shadow-xl transition-shadow animate-slide-up"
            style={{
              animationDelay: `${index * 0.05}s`,
              marginLeft: `${level * 16}px`, // 根据层级添加缩进
              borderLeftWidth: level > 0 ? '4px' : '2px',
              borderLeftColor: level > 0 ? '#B19CD9' : undefined,
            }}
            styles={{ body: { padding: '8px 10px' } }}
          >
            <div className="w-full space-y-1.5" style={{ lineHeight: '1.2' }}>
              {/* 第一行：标题 */}
              <div className="flex items-center gap-2 min-w-0">
                {hasChildren && onToggleExpand && (
                  <Button
                    type="text"
                    size="small"
                    icon={term.isExpanded ? <DownOutlined /> : <RightOutlined />}
                    onClick={() => onToggleExpand(term.id)}
                    className="!p-0 !w-6 !h-6 flex items-center justify-center flex-shrink-0"
                  />
                )}
                <BookOutlined className="text-base flex-shrink-0" style={{ color: '#B19CD9' }} />
                <Text
                  strong
                  className="text-sm min-w-0"
                  style={{
                    background: 'linear-gradient(135deg, #B19CD9 0%, #87CEEB 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {term.name}
                </Text>
              </div>

              {/* 第二行：内容 + 按钮 */}
              <div className="flex items-center gap-2 min-w-0">
                <Text className="text-gray-700 text-sm flex-1 min-w-0 sm:truncate" style={{ lineHeight: '1.2' }}>
                  {term.definition}
                </Text>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {onQueryKnowledge && (
                    <Button
                      size="small"
                      icon={isQueryingKnowledge ? <LoadingOutlined /> : <QuestionCircleOutlined />}
                      onClick={() => onQueryKnowledge(term.id, term.name, term.definition)}
                      loading={isQueryingKnowledge}
                      disabled={isQueryingKnowledge}
                      className="!rounded-full"
                    >
                      {isQueryingKnowledge ? '查询中' : '解释'}
                    </Button>
                  )}
                  {onQueryExamAngles && (
                    <Button
                      size="small"
                      icon={isQueryingExamAngle ? <LoadingOutlined /> : <BulbOutlined />}
                      onClick={() => onQueryExamAngles(term.id, term.name, term.definition)}
                      loading={isQueryingExamAngle}
                      disabled={isQueryingExamAngle}
                      className="!rounded-full"
                    >
                      {isQueryingExamAngle ? '查询中' : '出题角度'}
                    </Button>
                  )}
                  {onBreakdown && (
                    <Button
                      type="primary"
                      size="small"
                      icon={term.isBreakingDown ? <LoadingOutlined /> : <ThunderboltOutlined />}
                      onClick={() => onBreakdown(term.id)}
                      disabled={term.isBreakingDown || hasChildren || isQueryingKnowledge || isQueryingExamAngle}
                      className="!rounded-full"
                      style={{
                        background: 'linear-gradient(135deg, #B19CD9 0%, #87CEEB 100%)',
                        border: 'none',
                      }}
                    >
                      {term.isBreakingDown ? '拆解中' : '继续拆解'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

              {/* 递归渲染子项 */}
              {hasChildren && term.isExpanded && term.children && (
                <div className="mt-1.5 space-y-1.5">
                  {/* 子术语列表 */}
                  {term.children.terminology.length > 0 && (
                    <TerminologyList
                      terminology={term.children.terminology}
                      level={level + 1}
                      onBreakdown={onBreakdown}
                      onToggleExpand={onToggleExpand}
                      onQueryKnowledge={onQueryKnowledge}
                      onQueryExamAngles={onQueryExamAngles}
                      queryingKnowledgeTermId={queryingKnowledgeTermId}
                      queryingExamAngleTermId={queryingExamAngleTermId}
                    />
                  )}

                  {/* 子考点列表 */}
                  {term.children.knowledgePoints.length > 0 && (
                    <KnowledgePointList
                      knowledgePoints={term.children.knowledgePoints}
                      level={level + 1}
                      onBreakdown={onBreakdown}
                      onToggleExpand={onToggleExpand}
                    />
                  )}
                </div>
              )}
          </Card>
        );
      })}
    </div>
  );
}
