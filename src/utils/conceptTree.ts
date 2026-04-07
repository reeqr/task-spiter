/**
 * 概念树状态管理辅助函数
 */

import type { Term, KnowledgePoint } from '../types/concept';

/**
 * 通过 ID 递归查找术语
 */
export function findTermById(
  terms: Term[],
  id: string
): Term | null {
  for (const term of terms) {
    if (term.id === id) {
      return term;
    }
    // 递归查找子项中的术语
    if (term.children) {
      const found = findTermById(term.children.terminology, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 通过 ID 递归查找考点
 */
export function findKnowledgePointById(
  points: KnowledgePoint[],
  id: string
): KnowledgePoint | null {
  for (const point of points) {
    if (point.id === id) {
      return point;
    }
    // 递归查找子项中的考点
    if (point.children) {
      const found = findKnowledgePointById(point.children.knowledgePoints, id);
      if (found) return found;
      // 也要在子项的术语中查找
      const foundInTerms = findTermById(point.children.terminology, id);
      if (foundInTerms) return null; // 如果在术语中找到，说明不是考点
    }
  }
  return null;
}

/**
 * 通过 ID 更新术语（不可变方式）
 */
export function updateTermInTree(
  terms: Term[],
  id: string,
  updates: Partial<Term>
): Term[] {
  return terms.map(term => {
    if (term.id === id) {
      // 找到目标术语，返回更新后的对象
      return { ...term, ...updates };
    }
    // 如果有子项，递归更新
    if (term.children) {
      const updatedTerminology = updateTermInTree(term.children.terminology, id, updates);
      const updatedKnowledgePoints = updateKnowledgePointInTree(
        term.children.knowledgePoints,
        id,
        updates as any // 这里需要检查是否是术语更新
      );

      // 如果子项有变化，返回新的对象
      if (
        updatedTerminology !== term.children.terminology ||
        updatedKnowledgePoints !== term.children.knowledgePoints
      ) {
        return {
          ...term,
          children: {
            ...term.children,
            terminology: updatedTerminology,
            knowledgePoints: updatedKnowledgePoints,
          },
        };
      }
    }
    return term;
  });
}

/**
 * 通过 ID 更新考点（不可变方式）
 */
export function updateKnowledgePointInTree(
  points: KnowledgePoint[],
  id: string,
  updates: Partial<KnowledgePoint>
): KnowledgePoint[] {
  return points.map(point => {
    if (point.id === id) {
      // 找到目标考点，返回更新后的对象
      return { ...point, ...updates };
    }
    // 如果有子项，递归更新
    if (point.children) {
      const updatedTerminology = updateTermInTree(point.children.terminology, id, updates as any);
      const updatedKnowledgePoints = updateKnowledgePointInTree(
        point.children.knowledgePoints,
        id,
        updates
      );

      // 如果子项有变化，返回新的对象
      if (
        updatedTerminology !== point.children.terminology ||
        updatedKnowledgePoints !== point.children.knowledgePoints
      ) {
        return {
          ...point,
          children: {
            ...point.children,
            terminology: updatedTerminology,
            knowledgePoints: updatedKnowledgePoints,
          },
        };
      }
    }
    return point;
  });
}
