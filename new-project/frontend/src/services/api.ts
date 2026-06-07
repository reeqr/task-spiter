import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';

// 创建 axios 实例
const api: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加 JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理 token 过期
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // token 过期，尝试使用 refresh_token 获取新 token
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post('/api/v1/auth/refresh', {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token: new_refresh_token } = response.data;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', new_refresh_token);

          // 重试原始请求
          if (error.config) {
            error.config.headers.Authorization = `Bearer ${access_token}`;
            return axios(error.config);
          }
        } catch {
          // refresh 也失败了，清除 token 并跳转到登录页
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } else {
        // 没有 refresh_token，跳转到登录页
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;