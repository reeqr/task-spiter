from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from uuid import UUID


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    parent_id: Optional[UUID] = None
    spicy_level: Optional[int] = 3
    category: Optional[str] = ""
    sort_order: Optional[int] = 0


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    spicy_level: Optional[int] = None
    category: Optional[str] = None
    sort_order: Optional[int] = None


class TaskResponse(BaseModel):
    id: UUID
    user_id: UUID
    parent_id: Optional[UUID]
    title: str
    description: str
    completed: bool
    spicy_level: int
    category: str
    sort_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaskWithChildren(TaskResponse):
    children: List["TaskWithChildren"] = []


class TaskListResponse(BaseModel):
    items: List[TaskWithChildren]
    total: int


# Update forward refs
TaskWithChildren.model_rebuild()