from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from uuid import UUID


class FolderBase(BaseModel):
    name: str
    parent_id: Optional[UUID] = None


class FolderCreate(FolderBase):
    pass


class FolderUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[UUID] = None
    sort_order: Optional[int] = None


class FolderResponse(FolderBase):
    id: UUID
    user_id: UUID
    sort_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FolderTreeNode(BaseModel):
    """目录树节点，包含子目录和知识树"""
    id: UUID
    name: str
    parent_id: Optional[UUID]
    sort_order: int
    type: str  # "folder" or "knowledge_tree"
    created_at: datetime

    # 仅 type == "folder" 时有这些字段
    children: Optional[List["FolderTreeNode"]] = []
    knowledge_trees: Optional[List["KnowledgeTreeSimple"]] = []


class KnowledgeTreeSimple(BaseModel):
    """简单的知识树信息（用于目录树中）"""
    id: UUID
    concept: str
    sort_order: int
    created_at: datetime

    class Config:
        from_attributes = True


class MoveKnowledgeTreeRequest(BaseModel):
    folder_id: Optional[UUID]  # None 表示移到根目录


# 更新 forward refs
FolderTreeNode.model_rebuild()