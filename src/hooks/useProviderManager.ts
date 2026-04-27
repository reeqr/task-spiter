/**
 * 提供商和模型管理 Hook
 *
 * 用于管理 AI 提供商配置和模型配置，支持两级管理
 */

import { useState, useEffect, useMemo } from 'react';
import type { ProviderConfig, AIModel } from '../types/model';
import { setCurrentModel } from '../utils/api';
import { PREDEFINED_PROVIDERS } from '../types/model';

const PROVIDERS_STORAGE_KEY = 'task_spiter_providers';
const MODELS_STORAGE_KEY = 'task_spiter_models_v2';
const CURRENT_MODEL_KEY = 'task_spiter_current_model_v2';

/**
 * 从 localStorage 加载已保存的提供商配置
 */
function loadSavedProviders(): ProviderConfig[] {
  try {
    const stored = localStorage.getItem(PROVIDERS_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('加载提供商配置失败:', error);
    return [];
  }
}

/**
 * 保存提供商配置到 localStorage
 */
function saveProviders(providers: ProviderConfig[]) {
  try {
    localStorage.setItem(PROVIDERS_STORAGE_KEY, JSON.stringify(providers));
  } catch (error) {
    console.error('保存提供商配置失败:', error);
  }
}

/**
 * 从 localStorage 加载已保存的模型配置
 */
function loadSavedModels(): AIModel[] {
  try {
    const stored = localStorage.getItem(MODELS_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('加载模型配置失败:', error);
    return [];
  }
}

/**
 * 保存模型配置到 localStorage
 */
function saveModels(models: AIModel[]) {
  try {
    localStorage.setItem(MODELS_STORAGE_KEY, JSON.stringify(models));
  } catch (error) {
    console.error('保存模型配置失败:', error);
  }
}

/**
 * 加载当前选择的模型 ID
 */
function loadCurrentModelId(): string | null {
  try {
    return localStorage.getItem(CURRENT_MODEL_KEY);
  } catch (error) {
    console.error('加载当前模型失败:', error);
    return null;
  }
}

/**
 * 保存当前选择的模型 ID
 */
function saveCurrentModelId(modelId: string) {
  try {
    localStorage.setItem(CURRENT_MODEL_KEY, modelId);
  } catch (error) {
    console.error('保存当前模型失败:', error);
  }
}

export function useProviderManager() {
  const [providers, setProviders] = useState<ProviderConfig[]>(() => loadSavedProviders());
  const [models, setModels] = useState<AIModel[]>(() => loadSavedModels());
  const [currentModelId, setCurrentModelIdState] = useState<string | null>(() => loadCurrentModelId());

  // 初始化当前模型
  useEffect(() => {
    if (currentModelId) {
      const model = models.find((m) => m.id === currentModelId);
      if (model) {
        const provider = providers.find((p) => p.id === model.providerId);
        if (provider) {
          setCurrentModel({
            ...model,
            provider: provider.provider as any,
            apiKey: provider.apiKey,
            baseURL: provider.baseURL,
          });
        }
      } else {
        // 如果找不到当前模型，清空选择
        console.warn('当前模型不存在，已清空选择');
        setCurrentModelIdState(null);
        localStorage.removeItem(CURRENT_MODEL_KEY);
      }
    }
  }, [currentModelId, models, providers]);

  // 自动初始化默认提供商（如果环境变量中有 API Key 且没有提供商）
  useEffect(() => {
    // 只在没有提供商时自动初始化
    if (providers.length > 0) return;

    // MiniMax API Key（用户提供的）
    const minimaxApiKey = 'sk-cp-0ZRT2lQ9b1SQHEqG0S1uaVQIN8AzlFbF5qRuIMBfl5MLi4D7x7wJNC3yOI2n7Uhi8tgD4r5-HjtMoIApk_XBXPlqLjE-YkbC3JIAqOhNuHiq7TUfARea44g';
    if (!minimaxApiKey) return;

    console.log('%c🔑 自动初始化 MiniMax 提供商', 'color: #FF85A2; font-size: 14px; font-weight: bold');

    // 创建 MiniMax 提供商
    const minimaxProvider: ProviderConfig = {
      id: 'minimax',
      name: 'MiniMax',
      provider: 'minimax',
      apiKey: minimaxApiKey,
      baseURL: 'https://api.minimaxi.com/v1/chat/completions',
      icon: '✨',
    };

    // 创建 MiniMax-M2.7 模型
    const minimaxModel: AIModel = {
      id: 'minimax-m2-7',
      providerId: 'minimax',
      name: 'MiniMax-M2.7',
      model: 'MiniMax-M2.7',
      displayName: 'MiniMax M2.7 (默认)',
      maxTokens: 32768,
      temperature: 0.1,
      supportsThinking: false,
      thinkingEnabled: false,
    };

    // 添加提供商和模型
    setProviders([minimaxProvider]);
    saveProviders([minimaxProvider]);
    setModels([minimaxModel]);
    saveModels([minimaxModel]);

    // 设置为当前模型
    setCurrentModelIdState('minimax-m2-7');
    saveCurrentModelId('minimax-m2-7');

    console.log('%c✅ 默认提供商和模型初始化完成', 'color: #98D8C8; font-size: 14px; font-weight: bold');
  }, []); // 只在组件挂载时执行一次

  /**
   * 添加提供商
   */
  const addProvider = (provider: ProviderConfig) => {
    const newProviders = [...providers, provider];
    setProviders(newProviders);
    saveProviders(newProviders);
  };

  /**
   * 删除提供商
   */
  const deleteProvider = (providerId: string) => {
    // 删除提供商及其所有模型
    const newProviders = providers.filter((p) => p.id !== providerId);
    const newModels = models.filter((m) => m.providerId !== providerId);

    setProviders(newProviders);
    setModels(newModels);
    saveProviders(newProviders);
    saveModels(newModels);

    // 如果删除的是当前模型的提供商，切换到其他模型
    if (currentModelId) {
      const currentModel = models.find((m) => m.id === currentModelId);
      if (currentModel && currentModel.providerId === providerId) {
        if (newModels.length > 0) {
          selectModel(newModels[0].id);
        } else {
          setCurrentModelIdState(null);
          setCurrentModel(null as any);
        }
      }
    }
  };

  /**
   * 更新提供商
   */
  const updateProvider = (providerId: string, updates: Partial<ProviderConfig>) => {
    const newProviders = providers.map((p) =>
      p.id === providerId ? { ...p, ...updates } : p
    );
    setProviders(newProviders);
    saveProviders(newProviders);

    // 如果更新了API Key或baseURL，需要同步更新当前模型
    if (currentModelId) {
      const model = models.find((m) => m.id === currentModelId);
      if (model && model.providerId === providerId) {
        const provider = newProviders.find((p) => p.id === providerId);
        if (provider) {
          setCurrentModel({
            ...model,
            provider: provider.provider as any,
            apiKey: provider.apiKey,
            baseURL: provider.baseURL,
          });
        }
      }
    }
  };

  /**
   * 添加模型
   */
  const addModel = (model: AIModel) => {
    const newModels = [...models, model];
    setModels(newModels);
    saveModels(newModels);

    // 如果是第一个模型，自动设为当前模型
    if (newModels.length === 1) {
      selectModel(model.id);
    }
  };

  /**
   * 删除模型
   */
  const deleteModel = (modelId: string) => {
    const newModels = models.filter((m) => m.id !== modelId);
    setModels(newModels);
    saveModels(newModels);

    // 如果删除的是当前模型，切换到其他模型
    if (currentModelId === modelId) {
      if (newModels.length > 0) {
        selectModel(newModels[0].id);
      } else {
        setCurrentModelIdState(null);
        setCurrentModel(null as any);
      }
    }
  };

  /**
   * 更新模型
   */
  const updateModel = (modelId: string, updates: Partial<AIModel>) => {
    const newModels = models.map((m) =>
      m.id === modelId ? { ...m, ...updates } : m
    );
    setModels(newModels);
    saveModels(newModels);

    // 如果更新的是当前模型，同步更新当前模型
    if (currentModelId === modelId) {
      const updatedModel = newModels.find((m) => m.id === modelId);
      if (updatedModel) {
        const provider = providers.find((p) => p.id === updatedModel.providerId);
        if (provider) {
          setCurrentModel({
            ...updatedModel,
            provider: provider.provider as any,
            apiKey: provider.apiKey,
            baseURL: provider.baseURL,
          });
        }
      }
    }
  };

  /**
   * 选择当前模型
   */
  const selectModel = (modelId: string) => {
    console.log('%c🔄 selectModel 被调用', 'color: #FF85A2; font-size: 14px; font-weight: bold');
    console.log('%c模型 ID:', 'color: #B19CD9; font-weight: bold', modelId);
    console.log('%c当前 models:', 'color: #B19CD9; font-weight: bold', models);

    const model = models.find((m) => m.id === modelId);
    if (model) {
      const provider = providers.find((p) => p.id === model.providerId);
      if (provider) {
        console.log('%c✅ 找到模型和提供商，正在切换:', 'color: #98D8C8; font-weight: bold', model.name);
        setCurrentModelIdState(modelId);
        saveCurrentModelId(modelId);
        setCurrentModel({
          ...model,
          provider: provider.provider as any,
          apiKey: provider.apiKey,
          baseURL: provider.baseURL,
        });
        console.log('%c✅ 模型切换完成', 'color: #98D8C8; font-weight: bold');
      } else {
        console.error('%c❌ 未找到提供商:', 'color: #FF5C8D; font-weight: bold', model.providerId);
      }
    } else {
      console.error('%c❌ 未找到模型:', 'color: #FF5C8D; font-weight: bold', modelId);
    }
  };

  /**
   * 获取指定提供商的所有模型
   */
  const getModelsByProvider = (providerId: string) => {
    return models.filter((m) => m.providerId === providerId);
  };

  /**
   * 获取预定义提供商配置
   */
  const getPredefinedProvider = (providerId: string) => {
    return PREDEFINED_PROVIDERS[providerId];
  };

  /**
   * 获取所有预定义提供商列表
   */
  const getAllPredefinedProviders = () => {
    return Object.entries(PREDEFINED_PROVIDERS).map(([_providerId, provider]) => ({
      ...provider,
    }));
  };

  /**
   * 获取当前模型对象
   */
  const currentModel = useMemo((): any | undefined => {
    if (!currentModelId) {
      console.log('%c⚠️ currentModelId 为空，返回 undefined', 'color: #FFE48A; font-weight: bold');
      return undefined;
    }
    const model = models.find((m) => m.id === currentModelId);
    if (model) {
      const provider = providers.find((p) => p.id === model.providerId);
      if (provider) {
        const found = {
          ...model,
          provider: provider.provider as any,
          apiKey: provider.apiKey,
          baseURL: provider.baseURL,
        };
        console.log('%c✅ useMemo 计算得到当前模型:', 'color: #98D8C8; font-weight: bold', found.name);
        return found;
      }
    }
    console.warn('%c⚠️ useMemo 未找到模型，ID:', 'color: #FFE48A; font-weight: bold', currentModelId);
    return undefined;
  }, [currentModelId, models, providers]);

  return {
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
    getPredefinedProvider,
    getAllPredefinedProviders,
  };
}
