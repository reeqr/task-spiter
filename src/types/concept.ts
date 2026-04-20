/**
 * 概念拆解相关类型定义
 */

/**
 * 专业术语
 */
export interface Term {
  id: string;
  name: string;       // 术语名称
  definition: string; // 术语定义
  // 递归拆解相关字段
  children?: ConceptBreakdown | null;  // 子拆解结果
  isExpanded?: boolean;                // 展开状态
  isBreakingDown?: boolean;            // 拆解中状态
}

/**
 * 知识考点
 */
export interface KnowledgePoint {
  id: string;
  title: string;       // 考点标题
  description: string; // 考点描述
  // 递归拆解相关字段
  children?: ConceptBreakdown | null;  // 子拆解结果
  isExpanded?: boolean;                // 展开状态
  isBreakingDown?: boolean;            // 拆解中状态
}

/**
 * 概念拆解结果
 */
export interface ConceptBreakdown {
  concept: string;                    // 原始概念
  terminology: Term[];                // 专业术语列表
  knowledgePoints: KnowledgePoint[];  // 考点列表
}

/**
 * 概念拆解请求参数
 */
export interface ConceptBreakdownRequest {
  concept: string; // 要拆解的概念
  existingTerminology?: string[]; // 已拆解术语（避免重复）
  existingKnowledgePoints?: string[]; // 已拆解考点（避免重复）
  nodePath?: string[]; // 当前节点在知识树中的路径
}

/**
 * 概念拆解响应（AI API 返回的格式）
 */
export interface ConceptBreakdownResponse {
  terminology: Array<{
    name: string;
    definition: string;
  }>;
  knowledgePoints?: Array<{
    title: string;
    description: string;
  }>;
}
