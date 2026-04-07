/**
 * 知识考点列表组件
 */

import { Card, Empty, Space, Typography, Button } from 'antd';
import {
  BulbOutlined,
  DownOutlined,
  RightOutlined,
  ThunderboltOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import type { KnowledgePoint } from '../types/concept';
import { TerminologyList } from './TerminologyList';

const { Text } = Typography;

interface KnowledgePointListProps {
  knowledgePoints: KnowledgePoint[];
  level?: number; // 当前层级，用于缩进
  onBreakdown?: (pointId: string) => void; // 处理继续拆解
  onToggleExpand?: (pointId: string) => void; // 处理展开/收起
}

export function KnowledgePointList({
  knowledgePoints,
  level = 0,
  onBreakdown,
  onToggleExpand,
}: KnowledgePointListProps) {
  // 空状态处理
  if (knowledgePoints.length === 0) {
    return (
      <Card
        className="!rounded-2xl !border-2 !border-blue-200/30 !shadow-lg"
        styles={{ body: { padding: '48px 24px' } }}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical" size="small">
              <Text className="text-gray-400 text-lg">暂无知识考点</Text>
              <Text className="text-gray-300 text-base">
                未能提取到相关考点
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
      {knowledgePoints.map((point, index) => {
        const hasChildren = Boolean(point.children && (
          point.children.terminology.length > 0 ||
          point.children.knowledgePoints.length > 0
        ));

        return (
          <Card
            key={point.id}
            className="!rounded-2xl !border-2 !border-blue-200/30 !shadow-lg hover:!shadow-xl transition-shadow animate-slide-up"
            style={{
              animationDelay: `${index * 0.05}s`,
              marginLeft: `${level * 16}px`, // 根据层级添加缩进
              borderLeftWidth: level > 0 ? '4px' : '2px',
              borderLeftColor: level > 0 ? '#87CEEB' : undefined,
            }}
            styles={{ body: { padding: '8px 10px' } }}
          >
            <div className="w-full space-y-1.5">
              {/* 第一行：标题 */}
              <div className="flex items-center gap-2 min-w-0">
                {hasChildren && onToggleExpand && (
                  <Button
                    type="text"
                    size="small"
                    icon={point.isExpanded ? <DownOutlined /> : <RightOutlined />}
                    onClick={() => onToggleExpand(point.id)}
                    className="!p-0 !w-6 !h-6 flex items-center justify-center"
                  />
                )}

                <BulbOutlined
                  className="text-base flex-shrink-0"
                  style={{ color: '#87CEEB' }}
                />
                <Text
                  strong
                  className="text-sm min-w-0"
                  style={{
                    background: 'linear-gradient(135deg, #87CEEB 0%, #FF85A2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {point.title}
                </Text>
              </div>

              {/* 第二行：内容 + 按钮 */}
              <div className="flex items-center gap-2 min-w-0">
                <Text className="text-gray-700 text-sm flex-1 min-w-0 sm:truncate" style={{ lineHeight: '1.2' }}>
                  {point.description}
                </Text>
                {onBreakdown && (
                  <Button
                    type="primary"
                    size="small"
                    icon={point.isBreakingDown ? <LoadingOutlined /> : <ThunderboltOutlined />}
                    onClick={() => onBreakdown(point.id)}
                    disabled={point.isBreakingDown || hasChildren}
                    className="!rounded-full flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #87CEEB 0%, #FF85A2 100%)',
                      border: 'none',
                    }}
                  >
                    {point.isBreakingDown ? '拆解中' : '继续拆解'}
                  </Button>
                )}
              </div>

              {/* 递归渲染子项 */}
              {hasChildren && point.isExpanded && point.children && (
                <div className="mt-1.5 space-y-1.5">
                  {/* 子术语列表 */}
                  {point.children.terminology.length > 0 && (
                    <TerminologyList
                      terminology={point.children.terminology}
                      level={level + 1}
                      onBreakdown={onBreakdown}
                      onToggleExpand={onToggleExpand}
                    />
                  )}

                  {/* 子考点列表 */}
                  {point.children.knowledgePoints.length > 0 && (
                    <KnowledgePointList
                      knowledgePoints={point.children.knowledgePoints}
                      level={level + 1}
                      onBreakdown={onBreakdown}
                      onToggleExpand={onToggleExpand}
                    />
                  )}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
