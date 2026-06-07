import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Typography, Card } from '@douyinfe/semi-ui';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <Card style={{ width: 400, padding: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title heading={2}>知识树</Title>
          <Text type="tertiary">登录以继续</Text>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <Input
              placeholder="邮箱"
              type="email"
              value={email}
              onChange={(value) => setEmail(value as string)}
              style={{ width: '100%' }}
              required
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <Input
              placeholder="密码"
              type="password"
              value={password}
              onChange={(value) => setPassword(value as string)}
              style={{ width: '100%' }}
              required
            />
          </div>

          {error && (
            <div style={{ color: 'red', marginBottom: 16, textAlign: 'center' }}>
              {error}
            </div>
          )}

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{ width: '100%', marginBottom: 16 }}
          >
            登录
          </Button>

          <div style={{ textAlign: 'center' }}>
            <Text type="tertiary">还没有账号？</Text>
            <Link to="/register" style={{ marginLeft: 8 }}>注册</Link>
          </div>
        </form>
      </Card>
    </div>
  );
}