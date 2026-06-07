import api from './api';
import type { TokenResponse, User } from '../types';

export const authApi = {
  // 注册
  register: async (email: string, password: string): Promise<User> => {
    const response = await api.post('/auth/register', { email, password });
    return response.data;
  },

  // 登录
  login: async (email: string, password: string): Promise<TokenResponse> => {
    const response = await api.post('/auth/login', { email, password });
    const { access_token, refresh_token } = response.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    return response.data;
  },

  // 刷新 token
  refresh: async (refresh_token: string): Promise<TokenResponse> => {
    const response = await api.post('/auth/refresh', { refresh_token });
    return response.data;
  },

  // 登出
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  // 获取当前用户
  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};