from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from uuid import UUID


class ProviderCreate(BaseModel):
    name: str
    provider_type: str
    base_url: Optional[str] = ""
    icon: Optional[str] = ""
    api_key: str


class ProviderUpdate(BaseModel):
    name: Optional[str] = None
    provider_type: Optional[str] = None
    base_url: Optional[str] = None
    icon: Optional[str] = None


class ProviderResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    provider_type: str
    base_url: str
    icon: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ProviderWithCredential(ProviderResponse):
    has_api_key: bool = False


class ModelCreate(BaseModel):
    provider_id: UUID
    name: str
    model_code: str
    display_name: Optional[str] = ""
    max_tokens: Optional[int] = 65536
    temperature: Optional[float] = 0.10
    supports_thinking: Optional[bool] = False


class ModelUpdate(BaseModel):
    name: Optional[str] = None
    model_code: Optional[str] = None
    display_name: Optional[str] = None
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None
    supports_thinking: Optional[bool] = None
    thinking_enabled: Optional[bool] = None


class ModelResponse(BaseModel):
    id: UUID
    user_id: UUID
    provider_id: UUID
    name: str
    model_code: str
    display_name: str
    max_tokens: int
    temperature: float
    supports_thinking: bool
    thinking_enabled: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PredefinedProvider(BaseModel):
    name: str
    provider_type: str
    base_url: str
    icon: str
    default_models: List[str]