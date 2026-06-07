from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.ai_model import Model, CurrentModel
from app.models.provider import Provider
from app.schemas.provider import ModelCreate, ModelUpdate, ModelResponse
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter(tags=["模型管理"])


@router.get("/providers/{provider_id}/models", response_model=List[ModelResponse])
def list_models(
    provider_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """列出提供商下的所有模型"""
    # 验证 provider 属于当前用户
    provider = db.query(Provider).filter(
        Provider.id == provider_id,
        Provider.user_id == current_user.id,
    ).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    models = db.query(Model).filter(Model.provider_id == provider_id).all()
    return models


@router.post("/models", response_model=ModelResponse)
def create_model(
    model_data: ModelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """创建新模型"""
    # 验证 provider 属于当前用户
    provider = db.query(Provider).filter(
        Provider.id == model_data.provider_id,
        Provider.user_id == current_user.id,
    ).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    model = Model(
        user_id=current_user.id,
        provider_id=model_data.provider_id,
        name=model_data.name,
        model_code=model_data.model_code,
        display_name=model_data.display_name or model_data.name,
        max_tokens=model_data.max_tokens or 65536,
        temperature=model_data.temperature or 0.10,
        supports_thinking=model_data.supports_thinking or False,
    )
    db.add(model)
    db.commit()
    db.refresh(model)
    return model


@router.put("/models/{model_id}", response_model=ModelResponse)
def update_model(
    model_id: UUID,
    model_data: ModelUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """更新模型"""
    model = db.query(Model).filter(
        Model.id == model_id,
        Model.user_id == current_user.id,
    ).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    update_data = model_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(model, key, value)

    db.commit()
    db.refresh(model)
    return model


@router.delete("/models/{model_id}")
def delete_model(
    model_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """删除模型"""
    model = db.query(Model).filter(
        Model.id == model_id,
        Model.user_id == current_user.id,
    ).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    db.delete(model)
    db.commit()
    return {"message": "Model deleted"}


@router.put("/models/current/{model_id}")
def set_current_model(
    model_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """设置当前使用的模型"""
    # 验证模型存在且属于当前用户
    model = db.query(Model).filter(
        Model.id == model_id,
        Model.user_id == current_user.id,
    ).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    # 更新或创建当前模型记录
    current = db.query(CurrentModel).filter(
        CurrentModel.user_id == current_user.id
    ).first()
    if current:
        current.model_id = model_id
    else:
        current = CurrentModel(user_id=current_user.id, model_id=model_id)
        db.add(current)

    db.commit()
    return {"message": "Current model set", "model_id": str(model_id)}


@router.get("/models/current", response_model=Optional[ModelResponse])
def get_current_model(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取当前使用的模型"""
    current = db.query(CurrentModel).filter(
        CurrentModel.user_id == current_user.id
    ).first()
    if not current or not current.model_id:
        return None

    model = db.query(Model).filter(Model.id == current.model_id).first()
    return model