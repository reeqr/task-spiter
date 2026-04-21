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
  SearchOutlined,
} from '@ant-design/icons';
import type { Term } from '../types/concept';
import type { QueryActionConfig } from '../utils/promptConfig';
import {
  QUERY_ACTION_COMMON_TRAPS,
  QUERY_ACTION_EXAM_ANGLE,
  QUERY_ACTION_KNOWLEDGE,
} from '../utils/promptConfig';
import { KnowledgePointList } from './KnowledgePointList';

const { Text } = Typography;

interface TerminologyListProps {
  terminology: Term[];
  level?: number; // 当前层级，用于缩进
  onBreakdown?: (termId: string) => void; // 处理继续拆解
  onToggleExpand?: (termId: string) => void; // 处理展开/收起
  queryActions?: QueryActionConfig[];
  onQueryAction?: (actionId: string, termId: string, termName: string, termDefinition?: string) => void | Promise<void>;
  queryingTermByAction?: Record<string, string | null>;
}

function getQueryActionIcon(actionId: string) {
  if (actionId === QUERY_ACTION_KNOWLEDGE) return <QuestionCircleOutlined />;
  if (actionId === QUERY_ACTION_EXAM_ANGLE) return <SearchOutlined />;
  if (actionId === QUERY_ACTION_COMMON_TRAPS) return <BulbOutlined />;
  return <QuestionCircleOutlined />;
}

export function TerminologyList({
  terminology,
  level = 0,
  onBreakdown,
  onToggleExpand,
  queryActions = [],
  onQueryAction,
  queryingTermByAction = {},
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
        const isAnyQuerying = queryActions.some((action) => queryingTermByAction[action.id] === term.id);

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
                  {onQueryAction && queryActions.map((action) => {
                    const isQuerying = queryingTermByAction[action.id] === term.id;
                    return (
                      <Button
                        key={action.id}
                        size="small"
                        icon={isQuerying ? <LoadingOutlined /> : getQueryActionIcon(action.id)}
                        onClick={() => onQueryAction(action.id, term.id, term.name, term.definition)}
                        loading={isQuerying}
                        disabled={isQuerying}
                        className="!rounded-full"
                      >
                        {isQuerying ? '查询中' : action.label}
                      </Button>
                    );
                  })}
                  {onBreakdown && (
                    <Button
                      type="primary"
                      size="small"
                      icon={term.isBreakingDown ? <LoadingOutlined /> : <ThunderboltOutlined />}
                      onClick={() => onBreakdown(term.id)}
                      disabled={term.isBreakingDown || isAnyQuerying}
                      className="!rounded-full"
                      style={{
                        background: 'linear-gradient(135deg, #B19CD9 0%, #87CEEB 100%)',
                        border: 'none',
                      }}
                    >
                      {term.isBreakingDown ? '拆解中' : hasChildren ? '重新拆解' : '继续拆解'}
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
                      queryActions={queryActions}
                      onQueryAction={onQueryAction}
                      queryingTermByAction={queryingTermByAction}
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
