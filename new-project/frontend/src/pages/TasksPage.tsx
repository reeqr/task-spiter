import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Card, Button, Input, Checkbox,
  Space, Spin, Empty, Popconfirm, Badge, Tooltip, Modal, Select
} from '@douyinfe/semi-ui';
import {
  IconPlus, IconDelete, IconTreeTriangleRight, IconArrowLeft,
  IconChevronRight, IconChevronDown, IconEdit2
} from '@douyinfe/semi-icons';
import { taskApi } from '../services/task';

const { Title, Text, Paragraph } = Typography;

interface TaskNode {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  spicy_level: number;
  category: string;
  children: TaskNode[];
  is_expanded?: boolean;
  is_breaking_down?: boolean;
}

export default function TasksPage() {
  const navigate = useNavigate();

  // 任务列表状态
  const [tasks, setTasks] = useState<TaskNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  // 添加任务弹窗
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskSpicyLevel, setNewTaskSpicyLevel] = useState(1);
  const [newTaskCategory, setNewTaskCategory] = useState('');

  // 编辑任务弹窗
  const [editingTask, setEditingTask] = useState<TaskNode | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // 加载任务列表
  useEffect(() => {
    loadTasks();
  }, [showCompleted]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await taskApi.list(showCompleted ? undefined : false);
      // 将 children 转换为 is_expanded 状态
      setTasks(data.items.map((t: TaskNode) => ({ ...t, is_expanded: false, is_breaking_down: false })));
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // 切换任务展开/收起
  const toggleExpand = (taskId: string) => {
    const updateExpand = (tasks: TaskNode[]): TaskNode[] => {
      return tasks.map(t => {
        if (t.id === taskId) {
          return { ...t, is_expanded: !t.is_expanded };
        }
        if (t.children.length > 0) {
          return { ...t, children: updateExpand(t.children) };
        }
        return t;
      });
    };
    setTasks(updateExpand);
  };

  // 创建任务
  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      await taskApi.create({
        title: newTaskTitle,
        description: newTaskDescription,
        spicy_level: newTaskSpicyLevel,
        category: newTaskCategory,
      });
      setShowAddTask(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskSpicyLevel(1);
      setNewTaskCategory('');
      loadTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  // 更新任务
  const handleUpdateTask = async () => {
    if (!editingTask || !editTitle.trim()) return;

    try {
      await taskApi.update(editingTask.id, {
        title: editTitle,
        description: editDescription,
      });
      setEditingTask(null);
      loadTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  // 删除任务
  const handleDeleteTask = async (id: string) => {
    try {
      await taskApi.delete(id);
      loadTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  // 切换完成状态
  const handleToggleTask = async (id: string) => {
    try {
      await taskApi.toggle(id);
      loadTasks();
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  // AI 拆解任务
  const handleBreakdownTask = async (task: TaskNode) => {
    const updateBreaking = (tasks: TaskNode[], targetId: string, breaking: boolean): TaskNode[] => {
      return tasks.map(t => {
        if (t.id === targetId) {
          return { ...t, is_breaking_down: breaking };
        }
        if (t.children.length > 0) {
          return { ...t, children: updateBreaking(t.children, targetId, breaking) };
        }
        return t;
      });
    };

    setTasks(prev => updateBreaking(prev, task.id, true));

    try {
      await taskApi.breakdown(task.id);
      loadTasks();
    } catch (error) {
      console.error('Failed to breakdown task:', error);
      setTasks(prev => updateBreaking(prev, task.id, false));
    }
  };

  // 添加子任务
  const handleAddChildTask = async (parentId: string) => {
    try {
      await taskApi.create({
        title: '新子任务',
        description: '',
        parent_id: parentId,
        spicy_level: 1,
        category: '',
      });
      loadTasks();
    } catch (error) {
      console.error('Failed to add child task:', error);
    }
  };

  // 获取难度标签颜色
  const getSpicyColor = (level: number): string => {
    switch (level) {
      case 1: return 'blue';
      case 2: return 'yellow';
      case 3: return 'orange';
      case 4: return 'red';
      case 5: return 'red';
      default: return 'grey';
    }
  };

  // 获取难度标签
  const getSpicyLabel = (level: number): string => {
    switch (level) {
      case 1: return '简单';
      case 2: return '中等';
      case 3: return '较难';
      case 4: return '困难';
      case 5: return '极难';
      default: return '未知';
    }
  };

  // 渲染单个任务项
  const renderTaskItem = (task: TaskNode, depth = 0) => (
    <div key={task.id} style={{ marginLeft: depth * 20 }}>
      <Card
        style={{
          marginBottom: 8,
          padding: 12,
          opacity: task.completed ? 0.6 : 1,
          borderLeft: task.completed ? '3px solid green' : '3px solid transparent',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* 展开/收起按钮 */}
          {task.children.length > 0 ? (
            <Button
              size="small"
              icon={task.is_expanded ? <IconChevronDown /> : <IconChevronRight />}
              onClick={() => toggleExpand(task.id)}
              style={{ marginTop: 4 }}
            />
          ) : (
            <div style={{ width: 28 }} />
          )}

          {/* 完成复选框 */}
          <Checkbox
            checked={task.completed}
            onChange={() => handleToggleTask(task.id)}
            style={{ marginTop: 4 }}
          />

          {/* 任务内容 */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text strong style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
                {task.title}
              </Text>
              <Badge style={{ backgroundColor: getSpicyColor(task.spicy_level), marginLeft: 8 }}>
                {getSpicyLabel(task.spicy_level)}
              </Badge>
              {task.category && (
                <Text type="tertiary" size="small">
                  {task.category}
                </Text>
              )}
            </div>
            {task.description && (
              <Paragraph type="tertiary" style={{ margin: '4px 0 0 0', fontSize: 12 }}>
                {task.description}
              </Paragraph>
            )}
          </div>

          {/* 操作按钮 */}
          <Space>
            <Tooltip content="AI 拆解">
              <Button
                size="small"
                icon={<IconTreeTriangleRight />}
                loading={task.is_breaking_down}
                onClick={() => handleBreakdownTask(task)}
              />
            </Tooltip>
            <Tooltip content="添加子任务">
              <Button
                size="small"
                icon={<IconPlus />}
                onClick={() => handleAddChildTask(task.id)}
              />
            </Tooltip>
            <Tooltip content="编辑">
              <Button
                size="small"
                icon={<IconEdit2 />}
                onClick={() => {
                  setEditingTask(task);
                  setEditTitle(task.title);
                  setEditDescription(task.description);
                }}
              />
            </Tooltip>
            <Popconfirm
              title="确定删除此任务？"
              onConfirm={() => handleDeleteTask(task.id)}
            >
              <Button size="small" icon={<IconDelete />} />
            </Popconfirm>
          </Space>
        </div>

        {/* 子任务 */}
        {task.children.length > 0 && task.is_expanded && (
          <div style={{ marginTop: 12, borderLeft: '2px solid #eee', paddingLeft: 12 }}>
            {task.children.map(child => renderTaskItem(child, depth + 1))}
          </div>
        )}
      </Card>
    </div>
  );

  // 计算未完成任务数
  const uncompletedCount = tasks.filter(t => !t.completed).length;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button icon={<IconArrowLeft />} onClick={() => navigate('/')}>
            返回
          </Button>
          <div>
            <Title heading={4}>任务管理</Title>
            <Text type="tertiary">
              <Badge count={uncompletedCount} style={{ marginRight: 8 }} />
              未完成 {uncompletedCount} 个任务
            </Text>
          </div>
        </div>
        <Space>
          <Checkbox checked={showCompleted} onChange={(e: any) => setShowCompleted(e.target.checked)}>
            显示已完成
          </Checkbox>
          <Button type="primary" icon={<IconPlus />} onClick={() => setShowAddTask(true)}>
            添加任务
          </Button>
        </Space>
      </div>

      {/* 任务列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <Empty description="暂无任务，点击添加开始" />
        </Card>
      ) : (
        <Card>
          {tasks.map(task => renderTaskItem(task))}
        </Card>
      )}

      {/* 添加任务弹窗 */}
      <Modal
        title="添加任务"
        visible={showAddTask}
        onCancel={() => setShowAddTask(false)}
        onOk={handleCreateTask}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>任务标题</Text>
          <Input
            placeholder="输入任务标题"
            value={newTaskTitle}
            onChange={(value) => setNewTaskTitle(value as string)}
            style={{ width: '100%', marginTop: 4 }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text>任务描述</Text>
          <Input
            placeholder="输入任务描述（可选）"
            value={newTaskDescription}
            onChange={(value) => setNewTaskDescription(value as string)}
            style={{ width: '100%', marginTop: 4 }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text>难度等级</Text>
          <Select
            value={newTaskSpicyLevel}
            onChange={(value) => setNewTaskSpicyLevel(value as number)}
            style={{ width: '100%', marginTop: 4 }}
          >
            <Select.Option value={1}>简单</Select.Option>
            <Select.Option value={2}>中等</Select.Option>
            <Select.Option value={3}>较难</Select.Option>
            <Select.Option value={4}>困难</Select.Option>
            <Select.Option value={5}>极难</Select.Option>
          </Select>
        </div>
        <div>
          <Text>分类</Text>
          <Input
            placeholder="输入任务分类（可选）"
            value={newTaskCategory}
            onChange={(value) => setNewTaskCategory(value as string)}
            style={{ width: '100%', marginTop: 4 }}
          />
        </div>
      </Modal>

      {/* 编辑任务弹窗 */}
      <Modal
        title="编辑任务"
        visible={!!editingTask}
        onCancel={() => setEditingTask(null)}
        onOk={handleUpdateTask}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>任务标题</Text>
          <Input
            placeholder="输入任务标题"
            value={editTitle}
            onChange={(value) => setEditTitle(value as string)}
            style={{ width: '100%', marginTop: 4 }}
          />
        </div>
        <div>
          <Text>任务描述</Text>
          <Input
            placeholder="输入任务描述（可选）"
            value={editDescription}
            onChange={(value) => setEditDescription(value as string)}
            style={{ width: '100%', marginTop: 4 }}
          />
        </div>
      </Modal>
    </div>
  );
}