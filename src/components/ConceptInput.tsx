/**
 * 概念输入组件
 */

import { useState } from 'react';
import { Input, Button, Space, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface ConceptInputProps {
  onSubmit: (concept: string) => void;
  isLoading?: boolean;
}

export function ConceptInput({ onSubmit, isLoading = false }: ConceptInputProps) {
  const [concept, setConcept] = useState('');

  /**
   * 处理提交
   */
  const handleSubmit = () => {
    const trimmedConcept = concept.trim();

    // 空输入验证
    if (!trimmedConcept) {
      message.warning('请输入要拆解的概念');
      return;
    }

    onSubmit(trimmedConcept);
  };

  /**
   * 处理键盘事件（Ctrl/Cmd + Enter 提交）
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Space direction="vertical" size="middle" className="w-full">
      <TextArea
        value={concept}
        onChange={(e) => setConcept(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="输入要拆解的概念或术语，例如：考研高数..."
        autoSize={{ minRows: 3, maxRows: 6 }}
        disabled={isLoading}
        className="!text-base"
        style={{
          borderRadius: '12px',
          padding: '12px',
        }}
      />

      <div className="flex justify-end">
        <Button
          type="primary"
          size="large"
          icon={<SendOutlined />}
          onClick={handleSubmit}
          loading={isLoading}
          disabled={isLoading || !concept.trim()}
          className="!rounded-xl"
          style={{
            background: 'linear-gradient(135deg, #FF85A2 0%, #B19CD9 100%)',
            border: 'none',
            boxShadow: '0 4px 12px rgba(255, 133, 162, 0.3)',
          }}
        >
          {isLoading ? '拆解中...' : '开始拆解'}
        </Button>
      </div>

      <div className="text-sm text-gray-400 text-center">
        💡 提示：按 Ctrl/Cmd + Enter 快速提交
      </div>
    </Space>
  );
}
