import api from './api';
import type { Provider, ProviderCreate, Model, ModelCreate } from '../types';

export const providerApi = {
  // 获取提供商列表
  list: async (): Promise<Provider[]> => {
    const response = await api.get('/providers');
    return response.data;
  },

  // 创建提供商
  create: async (data: ProviderCreate): Promise<Provider> => {
    const response = await api.post('/providers', data);
    return response.data;
  },

  // 更新提供商
  update: async (id: string, data: Partial<ProviderCreate>): Promise<Provider> => {
    const response = await api.put(`/providers/${id}`, data);
    return response.data;
  },

  // 删除提供商
  delete: async (id: string): Promise<void> => {
    await api.delete(`/providers/${id}`);
  },

  // 获取预定义提供商
  getPredefined: async (): Promise<{ items: Array<{
    name: string;
    provider_type: string;
    base_url: string;
    icon: string;
    default_models: string[];
  }>; total: number }> => {
    const response = await api.get('/providers/config/predefined');
    return response.data;
  },

  // 获取模型列表
  getModels: async (providerId: string): Promise<Model[]> => {
    const response = await api.get(`/providers/${providerId}/models`);
    return response.data;
  },

  // 创建模型
  createModel: async (data: ModelCreate): Promise<Model> => {
    const response = await api.post('/models', data);
    return response.data;
  },

  // 更新模型
  updateModel: async (id: string, data: Partial<Model>): Promise<Model> => {
    const response = await api.put(`/models/${id}`, data);
    return response.data;
  },

  // 删除模型
  deleteModel: async (id: string): Promise<void> => {
    await api.delete(`/models/${id}`);
  },

  // 设置当前模型
  setCurrentModel: async (id: string): Promise<void> => {
    await api.put(`/models/current/${id}`);
  },

  // 获取当前模型
  getCurrentModel: async (): Promise<Model | null> => {
    const response = await api.get('/models/current');
    return response.data;
  },
};