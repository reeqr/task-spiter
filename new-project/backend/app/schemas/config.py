from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from uuid import UUID


class QueryActionCreate(BaseModel):
    label: str
    query_template: str
    followup_template: str
    sort_order: Optional[int] = 0


class QueryActionUpdate(BaseModel):
    label: Optional[str] = None
    query_template: Optional[str] = None
    followup_template: Optional[str] = None
    enabled: Optional[bool] = None
    sort_order: Optional[int] = None


class QueryActionResponse(BaseModel):
    id: UUID
    user_id: UUID
    action_key: str
    label: str
    query_template: str
    followup_template: str
    enabled: bool
    sort_order: int
    is_system: bool
    created_at: datetime

    class Config:
        from_attributes = True


class QueryActionListResponse(BaseModel):
    items: List[QueryActionResponse]
    total: int


class WebSearchConfigResponse(BaseModel):
    id: UUID
    user_id: UUID
    enabled: bool
    search_engine: str
    count: int
    search_domain_filter: str
    search_recency_filter: str
    content_size: str
    search_prompt: str

    class Config:
        from_attributes = True


class WebSearchConfigUpdate(BaseModel):
    enabled: Optional[bool] = None
    search_engine: Optional[str] = None
    count: Optional[int] = None
    search_domain_filter: Optional[str] = None
    search_recency_filter: Optional[str] = None
    content_size: Optional[str] = None
    search_prompt: Optional[str] = None


class PromptTemplateResponse(BaseModel):
    id: UUID
    user_id: UUID
    concept_breakdown_template: str

    class Config:
        from_attributes = True


class PromptTemplateUpdate(BaseModel):
    concept_breakdown_template: Optional[str] = None


class QueryRequest(BaseModel):
    action_id: str
    term: str
    concept: Optional[str] = ""
    term_definition: Optional[str] = ""
    followup_question: Optional[str] = ""


class QueryResponse(BaseModel):
    answer: str
    sources: List[dict] = []
    source_notice: Optional[str] = ""


class PredefinedProviderResponse(BaseModel):
    items: List[dict]
    total: int