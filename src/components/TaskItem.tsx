/**
 * 任务项组件 - 二次元风格
 */

import { useState } from 'react';
import {
  Card,
  Checkbox,
  Space,
  Typography,
  Button,
  Tooltip,
  Modal,
  message,
  Input,
} from 'antd';
import {
  RobotOutlined,
  ThunderboltOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  ExpandAltOutlined,
  ShrinkOutlined,
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { useConsultAI } from '../hooks/useConsultAI';
import type { Task } from '../types/task';

const { Text, Paragraph, Title } = Typography;

interface TaskItemProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onBreakdown: (taskId: string) => Promise<void>;
  onAddSubtask?: (taskId: string) => void;
  isLoading?: boolean;
}

export function TaskItem({
  task,
  onToggleComplete,
  onDelete,
  onUpdate,
  onBreakdown,
  onAddSubtask,
  isLoading = false,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [isBreakingDown, setIsBreakingDown] = useState(false);

  // AI 解答相关状态
  const { getAnswer, isLoading: isConsulting } = useConsultAI();
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [aiAnswer, setAiAnswer] = useState('');

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      onUpdate(task.id, { title: editTitle.trim() });
      setIsEditing(false);
    }
  };

  const handleBreakdown = async () => {
    console.log('%c🔘 点击拆解按钮', 'color: #FF85A2; font-size: 14px; font-weight: bold');
    console.log('%c任务 ID:', 'color: #B19CD9; font-weight: bold', task.id);
    console.log('%c任务标题:', 'color: #B19CD9; font-weight: bold', task.title);
    if (!task) {
      message.error('任务不存在');
      return;
    }

    setIsBreakingDown(true);
    try {
      console.log('%c⏳ 开始调用 onBreakdown...', 'color: #87CEEB; font-size: 14px; font-weight: bold');
      message.loading({ content: 'AI 正在拆解任务中... ✨', key: 'breakdown', duration: 0 });
      await onBreakdown(task.id);
      console.log('%c✅ onBreakdown 调用完成', 'color: #98D8C8; font-size: 14px; font-weight: bold');
      message.success({ content: '任务拆解成功！💝', key: 'breakdown', duration: 2 });
    } catch (error) {
      console.error('%c❌ 任务拆解失败', 'color: #FF5C8D; font-size: 16px; font-weight: bold', error);
      message.error({ content: '任务拆解失败，请稍后重试', key: 'breakdown', duration: 3 });
    } finally {
      setIsBreakingDown(false);
    }
  };

  // 处理 AI 解答
  const handleConsultAI = async () => {
    try {
      message.loading({ content: 'AI 正在解答中... 🤖', key: 'consult', duration: 0 });
      const answer = await getAnswer(task.title, task.description);
      message.success({ content: '解答完成！', key: 'consult', duration: 1 });
      setAiAnswer(answer);
      setShowConsultModal(true);
    } catch (error) {
      console.error('AI 解答失败:', error);
      message.error({ content: 'AI 解答失败，请稍后重试', key: 'consult', duration: 3 });
    }
  };

  const hasSubtasks = task.subtasks.length > 0;

  // 根据辛辣等级获取颜色和标签
  const getSpicyConfig = (level: number) => {
    const configs = [
      { color: '#98D8C8', label: '🌸 轻松', borderColor: '#98D8C8' },
      { color: '#87CEEB', label: '🍀 简单', borderColor: '#87CEEB' },
      { color: '#B19CD9', label: '💫 普通', borderColor: '#B19CD9' },
      { color: '#FF85A2', label: '🔥 困难', borderColor: '#FF85A2' },
      { color: '#FF5C8D', label: '⚡ 超难', borderColor: '#FF5C8D' },
    ];
    return configs[Math.min(level - 1, 4)];
  };

  const spicyConfig = getSpicyConfig(task.spicyLevel ?? 3);

  return (
    <>
      <Card
        className={`anime-task-card ${task.completed ? 'opacity-60' : ''}`}
        styles={{
          body: { padding: '10px 14px' },
        }}
        style={{
          borderRadius: '16px',
          border: '2px solid',
          borderColor: task.completed ? '#E8E8E8' : `${spicyConfig.color}30`,
          background: task.completed
            ? '#FAFAFA'
            : `linear-gradient(135deg, white 0%, ${spicyConfig.color}08 100%)`,
          transition: 'all 0.3s ease',
        }}
        hoverable
      >
        <Space direction="vertical" size="small" className="w-full">
          {/* 任务头部 */}
          <div className="flex items-start gap-2">
            {/* 完成复选框 */}
            <Checkbox
              checked={task.completed}
              onChange={() => onToggleComplete(task.id)}
              className="mt-1"
            />

            {/* 任务内容 */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <Space.Compact className="w-full">
                  <Input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') {
                        setEditTitle(task.title);
                        setIsEditing(false);
                      }
                    }}
                    autoFocus
                    style={{ borderRadius: '8px 0 0 8px' }}
                  />
                  <Button
                    type="primary"
                    size="large"
                    icon={<CheckOutlined />}
                    onClick={handleSaveEdit}
                    style={{ borderRadius: 0 }}
                  />
                  <Button
                    size="large"
                    icon={<CloseOutlined />}
                    onClick={() => {
                      setEditTitle(task.title);
                      setIsEditing(false);
                    }}
                    style={{ borderRadius: '0 8px 8px 0' }}
                  />
                </Space.Compact>
              ) : (
                <div className="w-full">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <Text
                      className={`!text-base !font-medium min-w-0 ${
                      task.completed ? '!line-through !text-gray-400' : '!text-gray-800'
                    }`}
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                      }}
                    >
                      {task.title}
                    </Text>
                  </div>
                  {task.description && (
                    <Paragraph
                      className={`!mb-0 !text-sm ${
                        task.completed ? '!text-gray-400' : '!text-gray-600'
                      }`}
                      ellipsis={{ rows: 1 }}
                    >
                      {task.description}
                    </Paragraph>
                  )}
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            {!isEditing && (
              <Space size="small" className="opacity-90 hover:opacity-100 transition-opacity">
                {/* AI 解答按钮 */}
                <Tooltip title="AI 解答">
                  <Button
                    size="small"
                    icon={<RobotOutlined />}
                    onClick={handleConsultAI}
                    disabled={isConsulting || task.completed}
                    loading={isConsulting}
                    className="anime-icon-button"
                    style={{ color: '#B19CD9', borderColor: '#B19CD9' }}
                  />
                </Tooltip>

                {/* AI 拆解按钮 */}
                <Tooltip title="AI 拆解">
                  <Button
                    size="small"
                    icon={<ThunderboltOutlined />}
                    onClick={handleBreakdown}
                    disabled={isBreakingDown || isLoading || task.completed}
                    loading={isBreakingDown}
                    className="anime-icon-button"
                    style={{ color: '#FF85A2', borderColor: '#FF85A2' }}
                  />
                </Tooltip>

                {/* 展开/收起子任务 */}
                {hasSubtasks && (
                  <Tooltip title={showSubtasks ? '收起子任务' : '展开子任务'}>
                    <Button
                      size="small"
                      icon={showSubtasks ? <ShrinkOutlined /> : <ExpandAltOutlined />}
                      onClick={() => setShowSubtasks(!showSubtasks)}
                      className="anime-icon-button"
                    />
                  </Tooltip>
                )}

                {/* 编辑按钮 */}
                <Tooltip title="编辑">
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => setIsEditing(true)}
                    className="anime-icon-button"
                  />
                </Tooltip>

                {/* 删除按钮 */}
                <Tooltip title="删除">
                  <Button
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => onDelete(task.id)}
                    danger
                    className="anime-icon-button"
                  />
                </Tooltip>
              </Space>
            )}
          </div>

          {/* 子任务列表 */}
          {hasSubtasks && showSubtasks && (
            <div className="ml-8 pl-4 border-l-2 animate-slide-up" style={{ borderColor: `${spicyConfig.color}40` }}>
              <Text strong className="text-gray-700 text-xs block mb-2">
                📋 子任务 ({task.subtasks.length})
              </Text>
              <Space direction="vertical" size="small" className="w-full">
                {task.subtasks.map((subtask) => (
                  <TaskItem
                    key={subtask.id}
                    task={subtask}
                    onToggleComplete={onToggleComplete}
                    onDelete={onDelete}
                    onUpdate={onUpdate}
                    onBreakdown={onBreakdown}
                    onAddSubtask={onAddSubtask}
                    isLoading={isLoading}
                  />
                ))}
              </Space>
            </div>
          )}
        </Space>
      </Card>

      {/* AI 解答模态框 */}
      <Modal
        open={showConsultModal}
        onCancel={() => setShowConsultModal(false)}
        title={
          <Space className="text-base">
            <span className="text-xl">🤖</span>
            <Text strong>知识点讲解：</Text>
            <Text strong style={{ color: '#FF85A2' }}>
              {task.title}
            </Text>
          </Space>
        }
        footer={null}
        width={700}
        centered
        styles={{
          header: {
            background: 'linear-gradient(135deg, #FFF5F8 0%, #F5F0FF 100%)',
            borderBottom: '2px solid rgba(255, 133, 162, 0.2)',
          },
          body: { padding: '24px' },
        }}
        wrapClassName="anime-modal-wrapper"
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '8px' }}>
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <Title level={3} className="!text-gray-800 !mb-4">
                  {children}
                </Title>
              ),
              h2: ({ children }) => (
                <Title level={4} className="!text-gray-800 !mb-3">
                  {children}
                </Title>
              ),
              h3: ({ children }) => (
                <Title level={5} className="!text-gray-800 !mb-2">
                  {children}
                </Title>
              ),
              p: ({ children }) => (
                <Paragraph className="!text-gray-700 !mb-3 !text-base">
                  {children}
                </Paragraph>
              ),
              ul: ({ children }) => (
                <ul className="!pl-6 !mb-4" style={{ listStyleType: 'disc' }}>
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="!pl-6 !mb-4" style={{ listStyleType: 'decimal' }}>
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="!mb-2 !text-gray-700" style={{ lineHeight: '1.8' }}>
                  {children}
                </li>
              ),
              strong: ({ children }) => (
                <Text strong style={{ color: '#FF85A2' }}>
                  {children}
                </Text>
              ),
              code: ({ children }) => (
                <code
                  style={{
                    background: 'linear-gradient(135deg, #FFF5F8 0%, #F5F0FF 100%)',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '0.9em',
                    color: '#B19CD9',
                    border: '1px solid rgba(177, 156, 217, 0.3)',
                  }}
                >
                  {children}
                </code>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#FF85A2', textDecoration: 'underline' }}
                >
                  {children}
                </a>
              ),
            }}
          >
            {aiAnswer}
          </ReactMarkdown>
        </div>
      </Modal>
    </>
  );
}
