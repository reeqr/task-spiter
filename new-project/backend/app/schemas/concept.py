from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from uuid import UUID


class TermBase(BaseModel):
    name: str
    definition: Optional[str] = ""


class TermCreate(TermBase):
    parent_id: Optional[UUID] = None
    sort_order: Optional[int] = 0
    path: Optional[str] = ""


class TermUpdate(BaseModel):
    name: Optional[str] = None
    definition: Optional[str] = None
    is_expanded: Optional[bool] = None
    is_breaking_down: Optional[bool] = None


class TermResponse(TermBase):
    id: UUID
    history_id: UUID
    parent_id: Optional[UUID]
    sort_order: int
    is_expanded: bool
    is_breaking_down: bool
    path: str
    created_at: datetime

    class Config:
        from_attributes = True


class TermWithChildren(TermResponse):
    children: List["TermWithChildren"] = []
    knowledge_points: List["KnowledgePointResponse"] = []


class KnowledgePointBase(BaseModel):
    title: str
    description: Optional[str] = ""


class KnowledgePointCreate(KnowledgePointBase):
    parent_id: Optional[UUID] = None
    sort_order: Optional[int] = 0
    path: Optional[str] = ""


class KnowledgePointUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_expanded: Optional[bool] = None
    is_breaking_down: Optional[bool] = None


class KnowledgePointResponse(KnowledgePointBase):
    id: UUID
    history_id: UUID
    parent_id: Optional[UUID]
    sort_order: int
    is_expanded: bool
    is_breaking_down: bool
    path: str
    created_at: datetime

    class Config:
        from_attributes = True


class KnowledgePointWithChildren(KnowledgePointResponse):
    children: List["KnowledgePointWithChildren"] = []


class ConceptHistoryCreate(BaseModel):
    concept: str


class ConceptHistoryResponse(BaseModel):
    id: UUID
    user_id: UUID
    folder_id: Optional[UUID] = None
    concept: str
    sort_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConceptHistoryDetailResponse(ConceptHistoryResponse):
    terms: List[TermWithChildren] = []
    knowledge_points: List[KnowledgePointWithChildren] = []


class BreakdownRequest(BaseModel):
    concept: str
    folder_id: Optional[str] = None
    existing_terminology: Optional[List[str]] = []
    existing_knowledge_points: Optional[List[str]] = []
    node_path: Optional[List[str]] = []


class BreakdownResponse(BaseModel):
    concept: str
    terminology: List[TermResponse] = []
    knowledge_points: List[KnowledgePointResponse] = []


# Update forward refs
TermWithChildren.model_rebuild()
KnowledgePointWithChildren.model_rebuild()