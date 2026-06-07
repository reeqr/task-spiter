from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.provider import Provider, ProviderCredential
from app.schemas.provider import (
    ProviderCreate,
    ProviderUpdate,
    ProviderResponse,
)
from app.schemas.user import UserResponse
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter(prefix="/providers", tags=["提供商管理"])

# 预定义提供商模板
PREDEFINED_PROVIDERS = [
    {
        "name": "智谱 AI",
        "provider_type": "zhipu",
        "base_url": "https://open.bigmodel.cn/api/paas/v4",
        "icon": "🔮",
        "default_models": ["glm-4", "glm-4-plus", "glm-5"],
    },
    {
        "name": "OpenAI",
        "provider_type": "openai",
        "base_url": "https://api.openai.com/v1",
        "icon": "🤖",
        "default_models": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
    },
    {
        "name": "DeepSeek",
        "provider_type": "deepseek",
        "base_url": "https://api.deepseek.com/v1",
        "icon": "🌊",
        "default_models": ["deepseek-chat", "deepseek-coder"],
    },
    {
        "name": "Anthropic",
        "provider_type": "anthropic",
        "base_url": "https://api.anthropic.com/v1",
        "icon": "🧠",
        "default_models": ["claude-3-sonnet", "claude-3-opus"],
    },
]


@router.get("", response_model=List[ProviderResponse])
def list_providers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """列出用户的所有提供商"""
    providers = db.query(Provider).filter(Provider.user_id == current_user.id).all()
    return providers


@router.post("", response_model=ProviderResponse)
def create_provider(
    provider_data: ProviderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """创建新提供商"""
    # 检查是否已存在同类型提供商
    existing = db.query(Provider).filter(
        Provider.user_id == current_user.id,
        Provider.provider_type == provider_data.provider_type,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provider of this type already exists",
        )

    provider = Provider(
        user_id=current_user.id,
        name=provider_data.name,
        provider_type=provider_data.provider_type,
        base_url=provider_data.base_url or "",
        icon=provider_data.icon or "",
    )
    db.add(provider)
    db.flush()

    # 保存 API Key
    credential = ProviderCredential(
        provider_id=provider.id,
        api_key=provider_data.api_key,
    )
    db.add(credential)

    db.commit()
    db.refresh(provider)
    return provider


@router.put("/{provider_id}", response_model=ProviderResponse)
def update_provider(
    provider_id: UUID,
    provider_data: ProviderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """更新提供商"""
    provider = db.query(Provider).filter(
        Provider.id == provider_id,
        Provider.user_id == current_user.id,
    ).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    update_data = provider_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(provider, key, value)

    db.commit()
    db.refresh(provider)
    return provider


@router.put("/{provider_id}/api-key")
def update_provider_api_key(
    provider_id: UUID,
    api_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """更新提供商 API Key"""
    provider = db.query(Provider).filter(
        Provider.id == provider_id,
        Provider.user_id == current_user.id,
    ).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    credential = db.query(ProviderCredential).filter(
        ProviderCredential.provider_id == provider_id
    ).first()
    if credential:
        credential.api_key = api_key
    else:
        credential = ProviderCredential(provider_id=provider_id, api_key=api_key)
        db.add(credential)

    db.commit()
    return {"message": "API key updated"}


@router.delete("/{provider_id}")
def delete_provider(
    provider_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """删除提供商"""
    provider = db.query(Provider).filter(
        Provider.id == provider_id,
        Provider.user_id == current_user.id,
    ).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    db.delete(provider)
    db.commit()
    return {"message": "Provider deleted"}


@router.get("/config/predefined")
def get_predefined_providers():
    """获取预定义提供商模板"""
    return {"items": PREDEFINED_PROVIDERS, "total": len(PREDEFINED_PROVIDERS)}