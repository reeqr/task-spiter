import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Card, Button, Input, List, Switch, Modal, Form, Select,
  Space, Spin, Empty, Popconfirm
} from '@douyinfe/semi-ui';
import { IconArrowLeft, IconPlus, IconDelete, IconTreeTriangleRight } from '@douyinfe/semi-icons';
import { providerApi } from '../services/provider';
import { configApi } from '../services/concept';

const { Title, Text } = Typography;

export default function ConfigPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<any[]>([]);
  const [predefinedProviders, setPredefinedProviders] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [currentModel, setCurrentModel] = useState<any>(null);
  const [actions, setActions] = useState<any[]>([]);

  // 添加提供商弹窗
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [selectedProviderType, setSelectedProviderType] = useState('');
  const [providerApiKey, setProviderApiKey] = useState('');

  // 添加模型弹窗
  const [showAddModel, setShowAddModel] = useState(false);
  const [modelName, setModelName] = useState('');
  const [modelCode, setModelCode] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('');

  // 自定义操作按钮弹窗
  const [showAddAction, setShowAddAction] = useState(false);
  const [actionLabel, setActionLabel] = useState('');
  const [actionQueryTemplate, setActionQueryTemplate] = useState('');
  const [actionFollowupTemplate, setActionFollowupTemplate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [providerList, predefined, modelData, actionData] = await Promise.all([
        providerApi.list(),
        providerApi.getPredefined(),
        providerApi.getCurrentModel().catch(() => null),
        configApi.getActions(),
      ]);
      setProviders(providerList);
      setPredefinedProviders(predefined.items);
      setCurrentModel(modelData);
      setActions(actionData.items);

      // 加载所有模型的模型
      const allModels: any[] = [];
      for (const p of providerList) {
        const ms = await providerApi.getModels(p.id).catch(() => []);
        allModels.push(...ms.map((m: any) => ({ ...m, providerName: p.name })));
      }
      setModels(allModels);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProvider = async () => {
    const selected = predefinedProviders.find(p => p.provider_type === selectedProviderType);
    if (!selected || !providerApiKey) return;

    try {
      await providerApi.create({
        name: selected.name,
        provider_type: selected.provider_type,
        base_url: selected.base_url,
        icon: selected.icon,
        api_key: providerApiKey,
      });
      setShowAddProvider(false);
      setProviderApiKey('');
      loadData();
    } catch (error) {
      console.error('Failed to add provider:', error);
    }
  };

  const handleDeleteProvider = async (id: string) => {
    try {
      await providerApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete provider:', error);
    }
  };

  const handleAddModel = async () => {
    if (!selectedProviderId || !modelName || !modelCode) return;

    try {
      await providerApi.createModel({
        provider_id: selectedProviderId,
        name: modelName,
        model_code: modelCode,
        display_name: modelName,
      });
      setShowAddModel(false);
      setModelName('');
      setModelCode('');
      loadData();
    } catch (error) {
      console.error('Failed to add model:', error);
    }
  };

  const handleSetCurrentModel = async (id: string) => {
    try {
      await providerApi.setCurrentModel(id);
      setCurrentModel(models.find(m => m.id === id));
    } catch (error) {
      console.error('Failed to set current model:', error);
    }
  };

  const handleDeleteModel = async (id: string) => {
    try {
      await providerApi.deleteModel(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete model:', error);
    }
  };

  const handleToggleAction = async (id: string, enabled: boolean) => {
    try {
      await configApi.updateAction(id, { enabled });
      loadData();
    } catch (error) {
      console.error('Failed to toggle action:', error);
    }
  };

  const handleAddAction = async () => {
    if (!actionLabel || !actionQueryTemplate) return;

    try {
      await configApi.createAction({
        label: actionLabel,
        query_template: actionQueryTemplate,
        followup_template: actionFollowupTemplate,
      });
      setShowAddAction(false);
      setActionLabel('');
      setActionQueryTemplate('');
      setActionFollowupTemplate('');
      loadData();
    } catch (error) {
      console.error('Failed to add action:', error);
    }
  };

  const handleDeleteAction = async (id: string) => {
    try {
      await configApi.deleteAction(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete action:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 16 }}>
        <Button icon={<IconArrowLeft />} onClick={() => navigate('/')}>
          返回
        </Button>
        <Title heading={4}>配置管理</Title>
        <Button icon={<IconTreeTriangleRight />} onClick={() => navigate('/tasks')} style={{ marginLeft: 'auto' }}>
          任务管理
        </Button>
      </div>

      {/* 当前模型 */}
      <Card style={{ marginBottom: 24 }}>
        <Title heading={5}>当前模型</Title>
        {currentModel ? (
          <Text>{currentModel.display_name || currentModel.name} ({currentModel.model_code})</Text>
        ) : (
          <Text type="tertiary">未选择模型</Text>
        )}
      </Card>

      {/* 提供商管理 */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title heading={5}>AI 提供商</Title>
          <Button icon={<IconPlus />} onClick={() => setShowAddProvider(true)}>
            添加提供商
          </Button>
        </div>

        {providers.length === 0 ? (
          <Empty description="暂无提供商，点击添加" />
        ) : (
          <List
            dataSource={providers}
            renderItem={(provider) => (
              <List.Item
                extra={
                  <Space>
                    <Button size="small" onClick={() => {
                      setSelectedProviderId(provider.id);
                      setShowAddModel(true);
                    }}>添加模型</Button>
                    <Popconfirm
                      title="确定删除此提供商？"
                      onConfirm={() => handleDeleteProvider(provider.id)}
                    >
                      <Button size="small" icon={<IconDelete />}>删除</Button>
                    </Popconfirm>
                  </Space>
                }
              >
                <Text strong>{provider.icon} {provider.name}</Text>
                <Text type="tertiary" style={{ marginLeft: 8 }}>({provider.provider_type})</Text>
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* 模型管理 */}
      <Card style={{ marginBottom: 24 }}>
        <Title heading={5} style={{ marginBottom: 16 }}>模型列表</Title>

        {models.length === 0 ? (
          <Empty description="暂无模型" />
        ) : (
          <List
            dataSource={models}
            renderItem={(model) => (
              <List.Item
                extra={
                  <Space>
                    {currentModel?.id === model.id && <Text type="tertiary">使用中</Text>}
                    <Button size="small" onClick={() => handleSetCurrentModel(model.id)}>
                      {currentModel?.id === model.id ? '取消' : '使用'}
                    </Button>
                    <Popconfirm
                      title="确定删除此模型？"
                      onConfirm={() => handleDeleteModel(model.id)}
                    >
                      <Button size="small" icon={<IconDelete />}>删除</Button>
                    </Popconfirm>
                  </Space>
                }
              >
                <Text>{model.display_name || model.name}</Text>
                <Text type="tertiary" style={{ marginLeft: 8 }}>({model.model_code})</Text>
                <Text type="tertiary" style={{ marginLeft: 8 }}>- {model.providerName}</Text>
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* 操作按钮配置 */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title heading={5}>操作按钮</Title>
          <Button icon={<IconPlus />} onClick={() => setShowAddAction(true)}>
            添加自定义按钮
          </Button>
        </div>

        {actions.length === 0 ? (
          <Empty description="暂无操作按钮" />
        ) : (
          <List
            dataSource={actions}
            renderItem={(action) => (
              <List.Item
                extra={
                  <Space>
                    <Switch checked={action.enabled} onChange={(checked) => handleToggleAction(action.id, checked)} />
                    {!action.is_system && (
                      <Popconfirm
                        title="确定删除此按钮？"
                        onConfirm={() => handleDeleteAction(action.id)}
                      >
                        <Button size="small" icon={<IconDelete />}>删除</Button>
                      </Popconfirm>
                    )}
                  </Space>
                }
              >
                <Text strong>{action.label}</Text>
                {action.is_system && <Text type="tertiary" style={{ marginLeft: 8 }}>(系统内置)</Text>}
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* 添加提供商弹窗 */}
      <Modal
        title="添加提供商"
        visible={showAddProvider}
        onCancel={() => setShowAddProvider(false)}
        onOk={handleAddProvider}
      >
        <Form>
          <div style={{ marginBottom: 16 }}>
            <Text>提供商类型</Text>
            <Select
              placeholder="选择提供商"
              value={selectedProviderType}
              onChange={(value) => setSelectedProviderType(value as string)}
              style={{ width: '100%', marginTop: 4 }}
            >
              {predefinedProviders.map((p) => (
                <Select.Option key={p.provider_type} value={p.provider_type}>
                  {p.icon} {p.name}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div>
            <Text>API Key</Text>
            <Input
              placeholder="输入 API Key"
              value={providerApiKey}
              onChange={(value) => setProviderApiKey(value as string)}
              style={{ width: '100%', marginTop: 4 }}
              mode="password"
            />
          </div>
        </Form>
      </Modal>

      {/* 添加模型弹窗 */}
      <Modal
        title="添加模型"
        visible={showAddModel}
        onCancel={() => setShowAddModel(false)}
        onOk={handleAddModel}
      >
        <Form>
          <div style={{ marginBottom: 16 }}>
            <Text>模型名称</Text>
            <Input
              placeholder="如：智谱 GLM-5"
              value={modelName}
              onChange={(value) => setModelName(value as string)}
              style={{ width: '100%', marginTop: 4 }}
            />
          </div>
          <div>
            <Text>模型代码</Text>
            <Input
              placeholder="如：glm-5"
              value={modelCode}
              onChange={(value) => setModelCode(value as string)}
              style={{ width: '100%', marginTop: 4 }}
            />
          </div>
        </Form>
      </Modal>

      {/* 添加操作按钮弹窗 */}
      <Modal
        title="添加自定义操作按钮"
        visible={showAddAction}
        onCancel={() => setShowAddAction(false)}
        onOk={handleAddAction}
      >
        <Form>
          <div style={{ marginBottom: 16 }}>
            <Text>按钮文案</Text>
            <Input
              placeholder="如：详细解释"
              value={actionLabel}
              onChange={(value) => setActionLabel(value as string)}
              style={{ width: '100%', marginTop: 4 }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text>首轮提示词模板</Text>
            <Input
              placeholder="使用 {{term}} 等变量"
              value={actionQueryTemplate}
              onChange={(value) => setActionQueryTemplate(value as string)}
              style={{ width: '100%', marginTop: 4 }}
            />
          </div>
          <div>
            <Text>追问提示词模板</Text>
            <Input
              placeholder="使用 {{term}} {{followupQuestion}} 等变量"
              value={actionFollowupTemplate}
              onChange={(value) => setActionFollowupTemplate(value as string)}
              style={{ width: '100%', marginTop: 4 }}
            />
          </div>
        </Form>
      </Modal>
    </div>
  );
}