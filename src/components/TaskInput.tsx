/**
 * 任务输入组件 - 二次元风格
 */

import { useState } from 'react';
import { Input, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

interface TaskInputProps {
  onAddTask: (title: string, description?: string) => void;
  isLoading?: boolean;
}

export function TaskInput({
  onAddTask,
  isLoading = false,
}: TaskInputProps) {
  const [title, setTitle] = useState('');

  const handleSubmit = () => {
    if (title.trim()) {
      onAddTask(title.trim());
      setTitle('');
    }
  };

  return (
    <Space direction="vertical" size="middle" className="w-full">
      {/* 标题输入 */}
      <Input
        placeholder="✨ 添加一个新任务..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onPressEnter={() => {
          if (title.trim()) {
            handleSubmit();
          }
        }}
        size="large"
        disabled={isLoading}
        prefix={
          <span className="animate-sparkle" style={{ animationDelay: '0s' }}>
            ✨
          </span>
        }
        className="anime-input"
        style={{ borderRadius: '12px', border: '2px solid rgba(255, 133, 162, 0.2)' }}
      />

      {/* 添加任务按钮 */}
      <Button
        type="primary"
        onClick={handleSubmit}
        disabled={isLoading || !title.trim()}
        size="large"
        icon={<PlusOutlined />}
        className="anime-submit-button w-full"
        style={{ height: 'auto', padding: '12px 24px' }}
      >
        {isLoading ? '添加中...' : '添加任务'}
      </Button>
    </Space>
  );
}
