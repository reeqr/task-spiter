/**
 * 模型管理组件 - 二次元风格
 * 支持提供商和模型两级管理
 */

import { useState, useEffect } from 'react';
import {
  Modal,
  Select,
  Input,
  Button,
  Space,
  Typography,
  Card,
  Tag,
  Popconfirm,
  message,
  Divider,
  Tooltip,
  Collapse,
  Empty,
  Switch,
} from 'antd';
import {
  DeleteOutlined,
  CheckOutlined,
  PlusOutlined,
  ApiOutlined,
  AppstoreOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useProviderManager } from '../hooks/useProviderManager';
import type { ProviderConfig, AIModel } from '../types/model';
import {
  loadPromptTemplates,
  savePromptTemplates,
  DEFAULT_PROMPT_TEMPLATES,
  type PromptTemplates,
} from '../utils/promptConfig';
import {
  loadWebSearchConfig,
  saveWebSearchConfig,
  type WebSearchConfig,
} from '../utils/api';

const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;
const { TextArea } = Input;
const PROMPT_VARIABLES = [
  { key: '{{concept}}', desc: '当前拆解的主概念名称，例如“高等数学”。' },
  { key: '{{term}}', desc: '当前查询的术语名，即按钮所在那一项。' },
  { key: '{{termDefinition}}', desc: '该术语已有定义，可用于补充上下文。' },
  { key: '{{targetConcept}}', desc: '目标概念，通常等于 concept 或 term。' },
  { key: '{{existingTerminology}}', desc: '已拆解出的术语列表，用于避免重复。' },
  { key: '{{existingKnowledgePoints}}', desc: '已拆解出的考点列表，用于避免重复。' },
  { key: '{{chatHistory}}', desc: '最近多轮对话上下文，追问模板常用。' },
  { key: '{{followupQuestion}}', desc: '用户本次在弹窗输入的追问内容。' },
];

interface ModelManagerProps {
  visible: boolean;
  onClose: () => void;
}

export function ModelManager({ visible, onClose }: ModelManagerProps) {
  const {
    providers,
    models,
    currentModelId,
    currentModel,
    addProvider,
    deleteProvider,
    updateProvider,
    addModel,
    deleteModel,
    updateModel,
    selectModel,
    getModelsByProvider,
    getAllPredefinedProviders,
  } = useProviderManager();

  const [showAddProvider, setShowAddProvider] = useState(false);
  const [selectedPredefinedProvider, setSelectedPredefinedProvider] = useState<string>('');
  const [providerApiKey, setProviderApiKey] = useState('');

  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [modelCode, setModelCode] = useState('');
  const [modelName, setModelName] = useState('');
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplates>(loadPromptTemplates());
  const [webSearchConfig, setWebSearchConfig] = useState<WebSearchConfig>(loadWebSearchConfig());

  useEffect(() => {
    if (visible) {
      setPromptTemplates(loadPromptTemplates());
      setWebSearchConfig(loadWebSearchConfig());
    }
  }, [visible]);

  // 调试日志
  console.log('%c🔍 ModelManager 状态', 'color: #FF85A2; font-size: 14px; font-weight: bold');
  console.log('%ccurrentModelId:', 'color: #B19CD9; font-weight: bold', currentModelId);
  console.log('%cproviders:', 'color: #B19CD9; font-weight: bold', providers);
  console.log('%gmodels:', 'color: #B19CD9; font-weight: bold', models);
  console.log('%ccurrentModel:', 'color: #98D8C8; font-weight: bold', currentModel);

  // 处理添加提供商
  const handleAddProvider = () => {
    if (!selectedPredefinedProvider) {
      message.warning('请选择一个提供商类型');
      return;
    }
    if (!providerApiKey.trim()) {
      message.warning('请输入 API Key');
      return;
    }

    try {
      const predefined = getAllPredefinedProviders().find(
        (p) => p.id === selectedPredefinedProvider
      );
      if (!predefined) {
        throw new Error('未找到预定义提供商');
      }

      const newProvider: ProviderConfig = {
        ...predefined,
        apiKey: providerApiKey.trim(),
      };

      addProvider(newProvider);
      message.success('提供商添加成功！');
      setShowAddProvider(false);
      setSelectedPredefinedProvider('');
      setProviderApiKey('');
    } catch (error) {
      message.error(`添加失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 处理删除提供商
  const handleDeleteProvider = (providerId: string) => {
    deleteProvider(providerId);
    message.success('提供商及其所有模型已删除');
  };

  // 处理更新提供商API Key
  const handleUpdateProviderKey = (providerId: string, newApiKey: string) => {
    if (!newApiKey.trim()) {
      message.warning('API Key 不能为空');
      return;
    }
    updateProvider(providerId, { apiKey: newApiKey.trim() });
    message.success('API Key 已更新');
  };

  // 处理添加模型
  const handleAddModel = () => {
    if (!selectedProviderId) {
      message.warning('请选择一个提供商');
      return;
    }
    if (!modelCode.trim()) {
      message.warning('请输入模型代码');
      return;
    }
    if (!modelName.trim()) {
      message.warning('请输入模型名称');
      return;
    }

    try {
      const newModel: AIModel = {
        id: `${selectedProviderId}-${Date.now()}`,
        providerId: selectedProviderId,
        name: modelName.trim(),
        model: modelCode.trim(),
        displayName: modelName.trim(),
      };

      addModel(newModel);
      message.success('模型添加成功！');
      setShowAddModel(false);
      setSelectedProviderId('');
      setModelCode('');
      setModelName('');
    } catch (error) {
      message.error(`添加失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 处理删除模型
  const handleDeleteModel = (modelId: string) => {
    deleteModel(modelId);
    message.success('模型已删除');
  };

  // 处理选择当前模型
  const handleSelectModel = (modelId: string) => {
    selectModel(modelId);
    message.success('已切换模型');
  };

  // 预定义提供商选项
  const predefinedProviderOptions = getAllPredefinedProviders().map((provider) => {
    const isAdded = providers.some((p) => p.provider === provider.provider);
    return {
      value: provider.id,
      label: `${provider.icon} ${provider.name} ${isAdded ? '(已添加)' : ''}`,
      disabled: isAdded,
    };
  });

  // 已添加的提供商选项
  const providerOptions = providers.map((p) => ({
    value: p.id,
    label: `${p.icon || '🔮'} ${p.name}`,
  }));

  const handleSavePrompts = () => {
    savePromptTemplates(promptTemplates);
    message.success('提示词模板已保存');
  };

  const handleResetPrompts = () => {
    setPromptTemplates(DEFAULT_PROMPT_TEMPLATES);
    savePromptTemplates(DEFAULT_PROMPT_TEMPLATES);
    message.success('提示词模板已恢复默认');
  };

  const handleSaveWebSearchConfig = () => {
    saveWebSearchConfig(webSearchConfig);
    message.success('联网搜索配置已保存');
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      title={
        <Space className="text-base">
          <Title level={4} className="!mb-0">
            AI 模型管理
          </Title>
        </Space>
      }
      footer={null}
      width={900}
      centered
      styles={{
        header: {
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF5F8 50%, #F5F0FF 100%)',
          borderBottom: '2px solid rgba(255, 133, 162, 0.3)',
        },
        body: { padding: '24px' },
      }}
      wrapClassName="anime-modal-wrapper"
    >
      <Space direction="vertical" size="large" className="w-full">
        {/* 当前使用的模型 */}
        {currentModel && (
          <Card
            className="!rounded-2xl !border-2 anime-header-card"
            style={{
              borderColor: 'rgba(255, 133, 162, 0.3)',
            }}
            styles={{ body: { padding: '16px' } }}
          >
            <Space direction="vertical" size="small" className="w-full">
              <div className="flex items-center justify-between">
                <Text strong style={{ fontSize: '15px', color: 'var(--anime-pink)' }}>
                  ✨ 当前使用模型
                </Text>
                <Tag color="success">使用中</Tag>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <Title level={5} className="!mb-1">
                    {currentModel.displayName || currentModel.name}
                  </Title>
                  <Text type="secondary" style={{ fontSize: '13px' }}>
                    {currentModel.model}
                  </Text>
                </div>
              </div>
            </Space>
          </Card>
        )}

        {/* 提供商和模型列表 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Text strong className="text-gray-700" style={{ fontSize: '15px' }}>
              🏢 提供商 ({providers.length})
            </Text>
            {!showAddProvider && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowAddProvider(true)}
                size="small"
                style={{
                  background: 'var(--gradient-magical)',
                  border: 'none',
                  borderRadius: '6px',
                }}
              >
                添加提供商
              </Button>
            )}
          </div>

          {providers.length === 0 ? (
            <Card
              className="!rounded-xl !border-2 !border-dashed"
              style={{ borderColor: 'var(--card-border)', background: '#FAFAFA' }}
            >
              <Empty description="还没有添加任何提供商，点击下方按钮添加" />
            </Card>
          ) : (
            <Collapse
              defaultActiveKey={[]}
              className="!bg-transparent"
              bordered={false}
              expandIconPosition="end"
            >
              {providers.map((provider) => {
                const providerModels = getModelsByProvider(provider.id);
                return (
                  <Panel
                    header={
                      <div className="flex items-center justify-between w-full pr-4">
                        <Space>
                          <span className="text-2xl">{provider.icon || '🔮'}</span>
                          <Text strong className="text-gray-800">
                            {provider.name}
                          </Text>
                          <Tag color="blue">{providerModels.length} 个模型</Tag>
                        </Space>
                      </div>
                    }
                    key={provider.id}
                    className="!mb-3 !rounded-xl !border-2"
                    style={{
                      background: '#FFF',
                      borderColor: 'var(--card-border)',
                    }}
                  >
                    <Space direction="vertical" size="middle" className="w-full">
                      {/* API Key 管理 */}
                      <Card
                        size="small"
                        className="!rounded-lg"
                        style={{
                          background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF5F8 50%, #F5F0FF 100%)',
                          borderColor: 'rgba(255, 133, 162, 0.25)',
                          borderWidth: '1px',
                        }}
                      >
                        <Space direction="vertical" size="small" className="w-full">
                          <Text strong style={{ fontSize: '13px', color: 'var(--anime-pink)' }}>
                            🔑 API Key
                          </Text>
                          <Input.Password
                            defaultValue={provider.apiKey}
                            onBlur={(e) =>
                              handleUpdateProviderKey(provider.id, e.target.value)
                            }
                            placeholder="API Key"
                            prefix={<ApiOutlined />}
                            style={{
                              borderRadius: '8px',
                              borderColor: 'var(--card-border)',
                            }}
                          />
                        </Space>
                      </Card>

                      {/* 模型列表 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Text strong style={{ fontSize: '14px' }}>
                            📋 模型列表 ({providerModels.length})
                          </Text>
                          <Button
                            type="primary"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => {
                              setSelectedProviderId(provider.id);
                              setShowAddModel(true);
                            }}
                            style={{
                              background: 'var(--gradient-magical)',
                              border: 'none',
                              borderRadius: '6px',
                            }}
                          >
                            添加模型
                          </Button>
                        </div>

                        {providerModels.length === 0 ? (
                          <Card
                            size="small"
                            className="!rounded-lg !border-dashed"
                            style={{ borderColor: 'var(--card-border)', background: '#FAFAFA' }}
                          >
                            <Text type="secondary" style={{ fontSize: '13px' }}>
                              还没有添加模型，点击上方按钮添加
                            </Text>
                          </Card>
                        ) : (
                          <Space direction="vertical" size="small" className="w-full">
                            {providerModels.map((model) => (
                              <Card
                                key={model.id}
                                size="small"
                                className="!rounded-lg transition-all hover:shadow-md"
                                style={{
                                  borderColor:
                                    currentModelId === model.id ? 'var(--anime-pink)' : 'var(--card-border)',
                                  background:
                                    currentModelId === model.id
                                      ? 'linear-gradient(135deg, #FFFFFF 0%, #FFF5F8 50%, #F5F0FF 100%)'
                                      : '#FFF',
                                  borderWidth: currentModelId === model.id ? '2px' : '1px',
                                }}
                              >
                                <Space direction="vertical" size="small" className="w-full">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <Text strong className="text-gray-800">
                                          {model.displayName || model.name}
                                        </Text>
                                        {currentModelId === model.id && (
                                          <Tag color="processing" className="!rounded-full">
                                            当前
                                          </Tag>
                                        )}
                                        {model.supportsThinking && (
                                          <Tag color="purple" className="!rounded-full">
                                            🧠 支持思考
                                          </Tag>
                                        )}
                                      </div>
                                      <Text
                                        type="secondary"
                                        style={{ fontSize: '12px' }}
                                      >
                                        {model.model}
                                      </Text>
                                    </div>

                                    <Space size="small">
                                      {currentModelId !== model.id && (
                                        <Tooltip title="切换到此模型">
                                          <Button
                                            type="text"
                                            size="small"
                                            icon={<CheckOutlined />}
                                            onClick={() => handleSelectModel(model.id)}
                                            style={{
                                              color: 'var(--anime-pink)',
                                              borderRadius: '4px',
                                            }}
                                          >
                                            使用
                                          </Button>
                                        </Tooltip>
                                      )}

                                      <Popconfirm
                                        title="确认删除"
                                        description="确定要删除这个模型吗？"
                                        onConfirm={() => handleDeleteModel(model.id)}
                                        okText="确定"
                                        cancelText="取消"
                                      >
                                        <Button
                                          type="text"
                                          size="small"
                                          danger
                                          icon={<DeleteOutlined />}
                                          disabled={currentModelId === model.id}
                                          style={{ borderRadius: '4px' }}
                                        >
                                          删除
                                        </Button>
                                      </Popconfirm>
                                    </Space>
                                  </div>

                                  {/* 思考模式开关 */}
                                  {model.supportsThinking && (
                                    <div className="flex items-center justify-between" style={{ marginTop: '4px' }}>
                                      <Text style={{ fontSize: '12px' }}>
                                        💭 启用思考模式（响应更深入但较慢）
                                      </Text>
                                      <Switch
                                        size="small"
                                        checked={model.thinkingEnabled || false}
                                        onChange={(checked) => {
                                          updateModel(model.id, { thinkingEnabled: checked });
                                          message.success(
                                            checked ? '思考模式已启用' : '思考模式已禁用'
                                          );
                                        }}
                                        style={{
                                          backgroundColor: model.thinkingEnabled ? 'var(--anime-purple)' : undefined,
                                        }}
                                      />
                                    </div>
                                  )}
                                </Space>
                              </Card>
                            ))}
                          </Space>
                        )}
                      </div>

                      {/* 删除提供商按钮 */}
                      <Popconfirm
                        title="确认删除"
                        description="确定要删除这个提供商及其所有模型吗？"
                        onConfirm={() => handleDeleteProvider(provider.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          block
                          style={{ borderRadius: '6px' }}
                        >
                          删除提供商
                        </Button>
                      </Popconfirm>
                    </Space>
                  </Panel>
                );
              })}
            </Collapse>
          )}
        </div>

        {/* 添加新提供商表单 */}
        {showAddProvider && (
          <Card
            className="!rounded-xl !border-2"
            style={{
              borderColor: 'var(--anime-purple)',
              background: 'var(--gradient-primary)',
            }}
            styles={{ body: { padding: '16px' } }}
            title={
              <Space>
                <PlusOutlined style={{ color: 'var(--anime-purple)' }} />
                <Text strong>添加新提供商</Text>
              </Space>
            }
          >
            <Space direction="vertical" size="middle" className="w-full">
              <div>
                <Text strong className="block mb-2" style={{ fontSize: '14px' }}>
                  选择提供商类型
                </Text>
                <Select
                  placeholder="请选择提供商类型"
                  value={selectedPredefinedProvider}
                  onChange={setSelectedPredefinedProvider}
                  className="w-full"
                  options={predefinedProviderOptions}
                  size="large"
                  style={{ borderRadius: '8px' }}
                />
              </div>

              <div>
                <Text strong className="block mb-2" style={{ fontSize: '14px' }}>
                  API Key
                </Text>
                <Input.Password
                  placeholder="请输入 API Key"
                  value={providerApiKey}
                  onChange={(e) => setProviderApiKey(e.target.value)}
                  size="large"
                  prefix={<ApiOutlined />}
                  style={{
                    borderRadius: '8px',
                    borderColor: 'var(--card-border)',
                  }}
                />
                <Paragraph
                  type="secondary"
                  style={{ fontSize: '12px', marginTop: '8px', marginBottom: 0 }}
                >
                  💡 API Key 仅保存在本地浏览器中，不会上传到服务器
                </Paragraph>
              </div>

              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddProvider}
                  style={{
                    background: 'var(--gradient-magical)',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                >
                  添加提供商
                </Button>
                <Button
                  onClick={() => setShowAddProvider(false)}
                  style={{ borderRadius: '8px' }}
                >
                  取消
                </Button>
              </Space>
            </Space>
          </Card>
        )}

        {/* 添加新模型表单 */}
        {showAddModel && (
          <Card
            className="!rounded-xl !border-2"
            style={{
              borderColor: 'var(--anime-pink)',
              background: 'var(--gradient-primary)',
            }}
            styles={{ body: { padding: '16px' } }}
            title={
              <Space>
                <AppstoreOutlined style={{ color: 'var(--anime-pink)' }} />
                <Text strong>添加新模型</Text>
              </Space>
            }
          >
            <Space direction="vertical" size="middle" className="w-full">
              <div>
                <Text strong className="block mb-2" style={{ fontSize: '14px' }}>
                  选择提供商
                </Text>
                <Select
                  placeholder="请选择提供商"
                  value={selectedProviderId}
                  onChange={setSelectedProviderId}
                  className="w-full"
                  options={providerOptions}
                  size="large"
                  style={{ borderRadius: '8px' }}
                />
                <Paragraph
                  type="secondary"
                  style={{ fontSize: '12px', marginTop: '8px', marginBottom: 0 }}
                >
                  仅显示已添加的提供商；要 MiniMax/OpenAI 等请先用顶栏「添加新提供商」配置 Key。
                </Paragraph>
              </div>

              <div>
                <Text strong className="block mb-2" style={{ fontSize: '14px' }}>
                  模型代码
                </Text>
                <Input
                  placeholder="例如: gpt-4, claude-3-sonnet, glm-4 等"
                  value={modelCode}
                  onChange={(e) => setModelCode(e.target.value)}
                  size="large"
                  style={{
                    borderRadius: '8px',
                    borderColor: 'var(--card-border)',
                  }}
                />
              </div>

              <div>
                <Text strong className="block mb-2" style={{ fontSize: '14px' }}>
                  模型名称
                </Text>
                <Input
                  placeholder="例如: GPT-4, Claude Sonnet 3 等"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  size="large"
                  style={{
                    borderRadius: '8px',
                    borderColor: 'var(--card-border)',
                  }}
                />
              </div>

              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddModel}
                  style={{
                    background: 'var(--gradient-magical)',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                >
                  添加模型
                </Button>
                <Button
                  onClick={() => setShowAddModel(false)}
                  style={{ borderRadius: '8px' }}
                >
                  取消
                </Button>
              </Space>
            </Space>
          </Card>
        )}

        <Card
          className="!rounded-xl"
          style={{
            background: 'linear-gradient(135deg, #F4FFFC 0%, #FFF 100%)',
            border: '2px solid #98D8C8',
          }}
          styles={{ body: { padding: '16px' } }}
        >
          <Space direction="vertical" size="small" className="w-full">
            <div className="flex items-center justify-between">
              <Text strong style={{ color: '#2F8F83' }}>🌐 联网搜索</Text>
              <Switch
                checked={webSearchConfig.enabled}
                onChange={(checked) => {
                  const next = { ...webSearchConfig, enabled: checked };
                  setWebSearchConfig(next);
                  saveWebSearchConfig(next);
                  message.success(checked ? '联网搜索已开启' : '联网搜索已关闭');
                }}
              />
            </div>
            <Text type="secondary">开启后所有 AI 请求优先尝试联网；关闭后保持本地模型回答。</Text>
            <Collapse bordered={false} className="!bg-transparent" items={[
              {
                key: 'web-search-advanced',
                label: '高级配置（可选）',
                children: (
                  <Space direction="vertical" size="middle" className="w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Text className="block mb-1">搜索引擎</Text>
                        <Select
                          value={webSearchConfig.searchEngine}
                          options={[
                            { value: 'search_pro', label: 'search_pro' },
                            { value: 'search_std', label: 'search_std' },
                          ]}
                          onChange={(value) => setWebSearchConfig((prev) => ({ ...prev, searchEngine: value }))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Text className="block mb-1">结果条数（1-50）</Text>
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          value={webSearchConfig.count}
                          onChange={(e) => setWebSearchConfig((prev) => ({ ...prev, count: Number(e.target.value || 1) }))}
                        />
                      </div>
                      <div>
                        <Text className="block mb-1">时间范围</Text>
                        <Select
                          value={webSearchConfig.searchRecencyFilter}
                          options={[
                            { value: 'noLimit', label: '不限' },
                            { value: '1d', label: '1天内' },
                            { value: '1w', label: '1周内' },
                            { value: '1m', label: '1月内' },
                            { value: '1y', label: '1年内' },
                          ]}
                          onChange={(value) => setWebSearchConfig((prev) => ({ ...prev, searchRecencyFilter: value }))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Text className="block mb-1">内容粒度</Text>
                        <Select
                          value={webSearchConfig.contentSize}
                          options={[
                            { value: 'low', label: 'low' },
                            { value: 'medium', label: 'medium' },
                            { value: 'high', label: 'high' },
                          ]}
                          onChange={(value) => setWebSearchConfig((prev) => ({ ...prev, contentSize: value }))}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div>
                      <Text className="block mb-1">域名过滤（可选）</Text>
                      <Input
                        value={webSearchConfig.searchDomainFilter}
                        placeholder="例如：www.sohu.com"
                        onChange={(e) => setWebSearchConfig((prev) => ({ ...prev, searchDomainFilter: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Text className="block mb-1">搜索摘要提示词（可选）</Text>
                      <TextArea
                        value={webSearchConfig.searchPrompt}
                        onChange={(e) => setWebSearchConfig((prev) => ({ ...prev, searchPrompt: e.target.value }))}
                        autoSize={{ minRows: 2, maxRows: 6 }}
                        placeholder="例如：请按重要性总结搜索结果并标注来源日期"
                      />
                    </div>
                    <Button type="primary" onClick={handleSaveWebSearchConfig}>保存高级配置</Button>
                  </Space>
                ),
              },
            ]} />
          </Space>
        </Card>

        <Divider style={{ margin: '8px 0' }} />

        <Card
          className="!rounded-xl"
          style={{
            background: 'linear-gradient(135deg, #F7FAFF 0%, #FFF 100%)',
            border: '2px solid #CFE3FF',
          }}
          styles={{ body: { padding: '16px' } }}
        >
          <Space direction="vertical" size="middle" className="w-full">
            <div className="flex items-center justify-between">
              <Text strong style={{ color: '#4D7CFE' }}>
                🧠 提示词模板配置
              </Text>
              <Tooltip title={(
                <div className="space-y-1" style={{ color: '#1f2937' }}>
                  {PROMPT_VARIABLES.map((item) => (
                    <div key={item.key}>
                      <Text code>{item.key}</Text>
                      <Text className="ml-2" style={{ color: '#374151' }}>{item.desc}</Text>
                    </div>
                  ))}
                </div>
              )} color="#ffffff" overlayInnerStyle={{ maxWidth: 520, border: '1px solid #dbeafe' }}>
                <Button type="text" size="small" icon={<InfoCircleOutlined />} />
              </Tooltip>
            </div>

            <Collapse accordion bordered={false} className="!bg-transparent">
              <Panel header="概念拆解提示词模板" key="conceptBreakdown">
                <TextArea
                  value={promptTemplates.conceptBreakdown}
                  onChange={(e) =>
                    setPromptTemplates((prev) => ({ ...prev, conceptBreakdown: e.target.value }))
                  }
                  autoSize={{ minRows: 8, maxRows: 16 }}
                />
              </Panel>
              {promptTemplates.queryActions
                .slice()
                .sort((a, b) => a.sort - b.sort)
                .map((action) => (
                  <Panel header={action.label} key={`action-${action.id}`}>
                    <Space direction="vertical" size="middle" className="w-full">
                      <div>
                        <div>
                          <Text className="block mb-1">按钮文案</Text>
                          <Input
                            value={action.label}
                            onChange={(e) => setPromptTemplates((prev) => ({
                              ...prev,
                              queryActions: prev.queryActions.map((item) => (
                                item.id === action.id ? { ...item, label: e.target.value } : item
                              )),
                            }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Text className="block mb-1">首轮提示词模板</Text>
                        <TextArea
                          value={action.queryTemplate}
                          onChange={(e) => setPromptTemplates((prev) => ({
                            ...prev,
                            queryActions: prev.queryActions.map((item) => (
                              item.id === action.id ? { ...item, queryTemplate: e.target.value } : item
                            )),
                          }))}
                          autoSize={{ minRows: 4, maxRows: 10 }}
                        />
                      </div>
                      <div>
                        <Text className="block mb-1">追问提示词模板</Text>
                        <TextArea
                          value={action.followupTemplate}
                          onChange={(e) => setPromptTemplates((prev) => ({
                            ...prev,
                            queryActions: prev.queryActions.map((item) => (
                              item.id === action.id ? { ...item, followupTemplate: e.target.value } : item
                            )),
                          }))}
                          autoSize={{ minRows: 4, maxRows: 10 }}
                        />
                      </div>
                    </Space>
                  </Panel>
                ))}
            </Collapse>

            <Space>
              <Button type="primary" onClick={handleSavePrompts}>
                保存模板
              </Button>
              <Button onClick={handleResetPrompts}>恢复默认</Button>
            </Space>
          </Space>
        </Card>

        {/* 使用说明 */}
        <Card
          className="!rounded-xl"
          style={{
            background: 'linear-gradient(135deg, #FFF9F0 0%, #FFF 100%)',
            border: '2px solid #FFE48A',
          }}
          styles={{ body: { padding: '16px' } }}
        >
          <Space direction="vertical" size="small">
            <Text strong style={{ color: '#FF85A2' }}>
              💡 使用说明
            </Text>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>
                <Text style={{ fontSize: '13px' }}>
                  先添加提供商并配置 API Key，再为提供商添加模型
                </Text>
              </li>
              <li>
                <Text style={{ fontSize: '13px' }}>
                  可以手动输入任意模型代码来添加模型
                </Text>
              </li>
              <li>
                <Text style={{ fontSize: '13px' }}>
                  API Key 仅保存在本地浏览器中，安全可靠
                </Text>
              </li>
              <li>
                <Text style={{ fontSize: '13px' }}>
                  可以为同一提供商添加多个模型
                </Text>
              </li>
            </ul>
          </Space>
        </Card>
      </Space>
    </Modal>
  );
}
