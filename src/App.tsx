/**
 * 主应用组件 - 二次元风格任务管理
 */

import { useState } from 'react';
import { ConfigProvider, Layout, Card, Typography, Progress, Empty, Space, Button, Tooltip, Segmented } from 'antd';
import { SettingOutlined, AppstoreOutlined, BulbOutlined } from '@ant-design/icons';
import { useTasks } from './hooks/useTasks';
import { useTaskBreakdown } from './hooks/useTaskBreakdown';
import { TaskInput } from './components/TaskInput';
import { TaskItem } from './components/TaskItem';
import { ModelManager } from './components/ModelManager';
import { ThemeSelector } from './components/ThemeSelector';
import { ConceptBreakdownPage } from './components/ConceptBreakdownPage';
import { useTheme } from './themes';
import './App.css';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

function App() {
  const { tasks, addTask, updateTask, deleteTask, addSubtasks, toggleTaskComplete, getTask } = useTasks();
  const { breakdownTask, isLoading: isBreakingDown } = useTaskBreakdown();
  const { currentTheme, setTheme } = useTheme();
  const [showModelManager, setShowModelManager] = useState(false);
  const [currentPage, setCurrentPage] = useState<'tasks' | 'concept'>('concept');

  /**
   * 收集所有任务标题（包括子任务）
   */
  const collectAllTaskTitles = (): string[] => {
    const titles: string[] = [];

    const collect = (taskList: typeof tasks) => {
      taskList.forEach(task => {
        titles.push(task.title);
        if (task.subtasks && task.subtasks.length > 0) {
          collect(task.subtasks);
        }
      });
    };

    collect(tasks);
    return titles;
  };

  /**
   * 处理任务拆解
   */
  const handleBreakdown = async (taskId: string) => {
    console.log('%c📍 App.handleBreakdown 被调用', 'color: #FF85A2; font-size: 14px; font-weight: bold');
    console.log('%c任务 ID:', 'color: #B19CD9; font-weight: bold', taskId);

    const task = getTask(taskId);
    if (!task) {
      console.error('%c❌ 未找到任务', 'color: #FF5C8D; font-size: 16px; font-weight: bold', taskId);
      return;
    }

    console.log('%c✅ 找到任务:', 'color: #98D8C8; font-size: 14px; font-weight: bold', task.title);

    try {
      // 收集所有已有任务标题
      const existingTasks = collectAllTaskTitles();
      console.log('%c📋 已有任务列表:', 'color: #B19CD9; font-weight: bold', existingTasks);

      console.log('%c⏳ 调用 breakdownTask hook...', 'color: #87CEEB; font-size: 14px; font-weight: bold');
      const subtasks = await breakdownTask(task.title, task.description, 3, existingTasks);
      console.log('%c✅ breakdownTask 返回结果:', 'color: #98D8C8; font-size: 14px; font-weight: bold', subtasks);
      addSubtasks(taskId, subtasks);
      console.log('%c✅ 子任务已添加', 'color: #98D8C8; font-size: 14px; font-weight: bold');
    } catch (error) {
      console.error('%c❌ App.handleBreakdown 出错', 'color: #FF5C8D; font-size: 16px; font-weight: bold', error);
      throw error;
    }
  };

  /**
   * 统计信息
   */
  const totalTasks = tasks.reduce((count, task) => {
    return count + 1 + countAllSubtasks(task);
  }, 0);

  const completedTasks = tasks.reduce((count, task) => {
    const taskCount = task.completed ? 1 : 0;
    const subtaskCount = countCompletedSubtasks(task);
    return count + taskCount + subtaskCount;
  }, 0);

  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 辅助函数：递归计算所有子任务数量
  function countAllSubtasks(task: { subtasks: any[] }): number {
    return task.subtasks.reduce((count, subtask) => {
      return count + 1 + countAllSubtasks(subtask);
    }, 0);
  }

  // 辅助函数：递归计算已完成的子任务数量
  function countCompletedSubtasks(task: { subtasks: any[] }): number {
    return task.subtasks.reduce((count, subtask) => {
      const subtaskCount = subtask.completed ? 1 : 0;
      return count + subtaskCount + countCompletedSubtasks(subtask);
    }, 0);
  }

  return (
    <ConfigProvider theme={currentTheme.antdTheme}>
      <Layout className="min-h-screen bg-transparent">
        {/* 头部 - 二次元风格 */}
        <Header
          className="!bg-transparent !px-0 !h-auto"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 32px)' }}
        >
          <div className="max-w-3xl mx-auto px-4">
            <Card
              className="!rounded-2xl !border-2 !border-pink-200/30 !shadow-lg anime-header-card animate-bounce-in"
              styles={{ body: { padding: '24px' } }}
            >
              <Space direction="vertical" size="middle" className="w-full">
                {/* 标题区域 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <span className="text-4xl animate-sparkle" style={{ animationDelay: '0s' }}>✨</span>
                      <Title
                        level={2}
                        className="!mb-0 anime-title !text-3xl"
                        style={{
                          background: 'linear-gradient(135deg, #FF85A2 0%, #B19CD9 50%, #87CEEB 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        AI 学习助手
                      </Title>
                      <span className="text-4xl animate-sparkle" style={{ animationDelay: '0.5s' }}>✨</span>
                    </div>
                    <Text className="text-gray-500 text-base">
                      把任务和概念交给 AI，让学习变得更有趣 🌸
                    </Text>
                  </div>

                  {/* 右侧操作区 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ThemeSelector
                      currentThemeId={currentTheme.id}
                      onThemeChange={setTheme}
                    />
                    <Tooltip title="模型管理">
                      <Button
                        type="text"
                        icon={<SettingOutlined />}
                        onClick={() => setShowModelManager(true)}
                        className="!text-gray-600 hover:!text-pink-500"
                        style={{ fontSize: '18px' }}
                      />
                    </Tooltip>
                  </div>
                </div>

                {/* 页面导航 */}
                <div className="flex justify-center">
                  <Segmented
                    value={currentPage}
                    onChange={(value) => setCurrentPage(value as 'tasks' | 'concept')}
                    size="large"
                    options={[
                      {
                        label: (
                          <div className="flex items-center gap-2 px-2">
                            <BulbOutlined />
                            <span>概念拆解</span>
                          </div>
                        ),
                        value: 'concept',
                      },
                      {
                        label: (
                          <div className="flex items-center gap-2 px-2">
                            <AppstoreOutlined />
                            <span>任务拆解</span>
                          </div>
                        ),
                        value: 'tasks',
                      },
                    ]}
                    className="!rounded-xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      padding: '4px',
                    }}
                  />
                </div>

                {/* 进度显示 - 仅在任务页面显示 */}
                {currentPage === 'tasks' && totalTasks > 0 && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-3">
                      <Text strong className="text-gray-700 text-base">
                        📊 完成进度
                      </Text>
                      <Text className="text-gray-700 text-base">
                        <span className="!font-bold" style={{ color: '#FF85A2' }}>
                          {completedTasks}
                        </span>
                        <span className="mx-1">/</span>
                        <span>{totalTasks}</span>
                        <span className="ml-2 text-gray-400">({progress}%)</span>
                      </Text>
                    </div>
                    <Progress
                      percent={progress}
                      strokeColor={{
                        '0%': '#FF85A2',
                        '50%': '#B19CD9',
                        '100%': '#87CEEB',
                      }}
                      trailColor="#F0F0F0"
                      strokeWidth={12}
                      showInfo={false}
                      className="anime-progress"
                    />
                  </div>
                )}
              </Space>
            </Card>
          </div>
        </Header>

        {/* 内容区域 */}
        <Content className="!px-0 !py-4">
          {currentPage === 'tasks' ? (
            /* 任务管理页面 */
            <div className="max-w-3xl mx-auto px-4">
              {/* 任务输入 */}
              <Card
                className="!mb-6 !rounded-2xl !border-2 !border-pink-200/30 !shadow-lg animate-slide-up"
                styles={{ body: { padding: '24px' } }}
              >
                <TaskInput
                  onAddTask={addTask}
                  isLoading={isBreakingDown}
                />
              </Card>

              {/* 任务列表 */}
              {tasks.length === 0 ? (
                <Card className="!rounded-2xl !border-2 !border-pink-200/30 !shadow-lg animate-slide-up">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <Space direction="vertical" size="small">
                        <Text className="text-gray-400 text-lg">还没有任务哦~</Text>
                        <Text className="text-gray-300 text-base">
                          添加你的第一个任务吧 💝
                        </Text>
                      </Space>
                    }
                    imageStyle={{
                      height: 80,
                    }}
                  />
                </Card>
              ) : (
                <Space direction="vertical" size="small" className="w-full">
                  {tasks.map((task, index) => (
                    <div
                      key={task.id}
                      className="animate-slide-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <TaskItem
                        task={task}
                        onToggleComplete={toggleTaskComplete}
                        onDelete={deleteTask}
                        onUpdate={updateTask}
                        onBreakdown={handleBreakdown}
                        isLoading={isBreakingDown}
                      />
                    </div>
                  ))}
                </Space>
              )}
            </div>
          ) : (
            /* 概念拆解页面 */
            <ConceptBreakdownPage />
          )}
        </Content>

        {/* 底部 */}
        <Footer className="!bg-transparent !py-6">
          <div className="text-center">
            <Text className="text-gray-400 text-sm">
              Made with 💝 by AI · 让每一天都充满魔法 ✨
            </Text>
          </div>
        </Footer>
      </Layout>

      {/* 模型管理 */}
      <ModelManager
        visible={showModelManager}
        onClose={() => setShowModelManager(false)}
      />
    </ConfigProvider>
  );
}

export default App;
