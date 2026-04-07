/**
 * 模型管理 Hook
 *
 * 用于管理 AI 模型配置，支持保存、切换模型
 */

import { useState, useEffect, useMemo } from 'react';
import type { AIModel } from '../types/model';
import { PREDEFINED_MODELS } from '../types/model';
import { setCurrentModel } from '../utils/api';

const STORAGE_KEY = 'task_spiter_models';
const CURRENT_MODEL_KEY = 'task_spiter_current_model';

/**
 * 从 localStorage 加载已保存的模型配置
 */
function loadSavedModels(): AIModel[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
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

export function useModelManager() {
  const [savedModels, setSavedModels] = useState<AIModel[]>(() => loadSavedModels());
  const [currentModelId, setCurrentModelIdState] = useState<string | null>(() => loadCurrentModelId());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 初始化当前模型
  useEffect(() => {
    if (currentModelId) {
      const model = savedModels.find((m) => m.id === currentModelId);
      if (model) {
        // 注意：useModelManager 是旧版本，不包含完整配置
        // 实际使用应该用 useProviderManager
        // 这里临时修复类型错误
        setCurrentModel(model as any);
      } else {
        // 如果找不到当前模型，清空选择
        console.warn('当前模型不存在，已清空选择');
        setCurrentModelIdState(null);
        localStorage.removeItem(CURRENT_MODEL_KEY);
      }
    }
  }, [currentModelId, savedModels]);

  /**
   * 添加新模型
   */
  const addModel = (model: AIModel) => {
    const newModels = [...savedModels, model];
    setSavedModels(newModels);
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
    const newModels = savedModels.filter((m) => m.id !== modelId);
    setSavedModels(newModels);
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
    const newModels = savedModels.map((m) =>
      m.id === modelId ? { ...m, ...updates } : m
    );
    setSavedModels(newModels);
    saveModels(newModels);

    // 如果更新的是当前模型，同步更新当前模型
    if (currentModelId === modelId) {
      const updatedModel = newModels.find((m) => m.id === modelId);
      if (updatedModel) {
        setCurrentModel(updatedModel as any);
      }
    }
  };

  /**
   * 选择当前模型
   */
  const selectModel = (modelId: string) => {
    console.log('%c🔄 selectModel 被调用', 'color: #FF85A2; font-size: 14px; font-weight: bold');
    console.log('%c模型 ID:', 'color: #B19CD9; font-weight: bold', modelId);
    console.log('%c当前 savedModels:', 'color: #B19CD9; font-weight: bold', savedModels);

    const model = savedModels.find((m) => m.id === modelId);
    if (model) {
      console.log('%c✅ 找到模型，正在切换:', 'color: #98D8C8; font-weight: bold', model.name);
      setCurrentModelIdState(modelId);
      saveCurrentModelId(modelId);
      setCurrentModel(model as any);
      console.log('%c✅ 模型切换完成', 'color: #98D8C8; font-weight: bold');
    } else {
      console.error('%c❌ 未找到模型:', 'color: #FF5C8D; font-weight: bold', modelId);
    }
  };

  /**
   * 获取预定义模型配置（不包含 API Key）
   */
  const getPredefinedModel = (modelId: string) => {
    return PREDEFINED_MODELS[modelId];
  };

  /**
   * 获取所有预定义模型列表
   */
  const getAllPredefinedModels = () => {
    return Object.entries(PREDEFINED_MODELS).map(([_modelId, model]) => ({
      ...model,
    }));
  };

  /**
   * 从预定义模型创建配置（需要提供 API Key）
   */
  const createFromPredefined = (modelId: string): AIModel => {
    const predefined = PREDEFINED_MODELS[modelId];
    if (!predefined) {
      throw new Error(`未找到预定义模型: ${modelId}`);
    }
    return {
      ...predefined,
    } as AIModel;
  };

  /**
   * 获取当前模型对象
   */
  const currentModel = useMemo((): AIModel | undefined => {
    if (!currentModelId) {
      console.log('%c⚠️ currentModelId 为空，返回 undefined', 'color: #FFE48A; font-weight: bold');
      return undefined;
    }
    const found = savedModels.find((m) => m.id === currentModelId);
    if (found) {
      console.log('%c✅ useMemo 计算得到当前模型:', 'color: #98D8C8; font-weight: bold', found.name);
    } else {
      console.warn('%c⚠️ useMemo 未找到模型，ID:', 'color: #FFE48A; font-weight: bold', currentModelId);
    }
    return found;
  }, [currentModelId, savedModels]);

  return {
    savedModels,
    currentModelId,
    currentModel,
    isModalOpen,
    setIsModalOpen,
    addModel,
    deleteModel,
    updateModel,
    selectModel,
    getPredefinedModel,
    getAllPredefinedModels,
    createFromPredefined,
  };
}
