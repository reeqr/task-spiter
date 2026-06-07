from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.config import QueryAction, PromptTemplate, WebSearchConfig
from app.core.query_actions import SYSTEM_ACTIONS
from app.schemas.config import (
    QueryActionCreate,
    QueryActionUpdate,
    QueryActionResponse,
    QueryActionListResponse,
    WebSearchConfigResponse,
    WebSearchConfigUpdate,
    PromptTemplateResponse,
    PromptTemplateUpdate,
)
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter(prefix="/config", tags=["配置管理"])

def init_default_actions(db: Session, user_id: UUID):
    """初始化用户的默认操作按钮"""
    for i, action in enumerate(SYSTEM_ACTIONS):
        existing = db.query(QueryAction).filter(
            QueryAction.user_id == user_id,
            QueryAction.action_key == action["action_key"],
        ).first()
        if not existing:
            query_action = QueryAction(
                user_id=user_id,
                action_key=action["action_key"],
                label=action["label"],
                query_template=action["query_template"],
                followup_template=action["followup_template"],
                sort_order=i,
                is_system=True,
                enabled=True,
            )
            db.add(query_action)


@router.get("/actions", response_model=QueryActionListResponse)
def list_actions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取用户操作按钮配置"""
    # 确保有默认操作按钮
    init_default_actions(db, current_user.id)
    db.commit()  # 确保初始化数据被提交

    actions = db.query(QueryAction).filter(
        QueryAction.user_id == current_user.id
    ).order_by(QueryAction.sort_order).all()

    return QueryActionListResponse(items=actions, total=len(actions))


@router.post("/actions", response_model=QueryActionResponse)
def create_action(
    action_data: QueryActionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """创建自定义操作按钮"""
    action = QueryAction(
        user_id=current_user.id,
        action_key=f"custom-{UUID.randomUUID().hex[:8]}",
        label=action_data.label,
        query_template=action_data.query_template,
        followup_template=action_data.followup_template,
        sort_order=action_data.sort_order or 100,
        is_system=False,
        enabled=True,
    )
    db.add(action)
    db.commit()
    db.refresh(action)
    return action


@router.put("/actions/{action_id}", response_model=QueryActionResponse)
def update_action(
    action_id: UUID,
    action_data: QueryActionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """更新操作按钮"""
    action = db.query(QueryAction).filter(
        QueryAction.id == action_id,
        QueryAction.user_id == current_user.id,
    ).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    # 系统内置按钮不允许修改 is_system 属性
    if action.is_system:
        if action_data.enabled is not None:
            action.enabled = action_data.enabled
        if action_data.sort_order is not None:
            action.sort_order = action_data.sort_order
    else:
        update_data = action_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(action, key, value)

    db.commit()
    db.refresh(action)
    return action


@router.delete("/actions/{action_id}")
def delete_action(
    action_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """删除自定义操作按钮（系统内置不可删除）"""
    action = db.query(QueryAction).filter(
        QueryAction.id == action_id,
        QueryAction.user_id == current_user.id,
    ).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    if action.is_system:
        raise HTTPException(status_code=400, detail="Cannot delete system action")

    db.delete(action)
    db.commit()
    return {"message": "Action deleted"}


@router.get("/web-search", response_model=WebSearchConfigResponse)
def get_web_search_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取联网搜索配置"""
    config = db.query(WebSearchConfig).filter(
        WebSearchConfig.user_id == current_user.id
    ).first()
    if not config:
        # 返回默认配置
        return WebSearchConfigResponse(
            id=UUID("00000000-0000-0000-0000-000000000000"),
            user_id=current_user.id,
            enabled=False,
            search_engine="search_pro",
            count=5,
            search_domain_filter="",
            search_recency_filter="noLimit",
            content_size="high",
            search_prompt="",
        )
    return config


@router.put("/web-search", response_model=WebSearchConfigResponse)
def update_web_search_config(
    config_data: WebSearchConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """更新联网搜索配置"""
    config = db.query(WebSearchConfig).filter(
        WebSearchConfig.user_id == current_user.id
    ).first()

    if not config:
        config = WebSearchConfig(user_id=current_user.id)
        db.add(config)

    update_data = config_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(config, key, value)

    db.commit()
    db.refresh(config)
    return config


@router.get("/prompts", response_model=PromptTemplateResponse)
def get_prompt_template(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取提示词模板"""
    template = db.query(PromptTemplate).filter(
        PromptTemplate.user_id == current_user.id
    ).first()
    if not template:
        return PromptTemplateResponse(
            id=UUID("00000000-0000-0000-0000-000000000000"),
            user_id=current_user.id,
            concept_breakdown_template="",
        )
    return template


@router.put("/prompts", response_model=PromptTemplateResponse)
def update_prompt_template(
    template_data: PromptTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """更新提示词模板"""
    template = db.query(PromptTemplate).filter(
        PromptTemplate.user_id == current_user.id
    ).first()

    if not template:
        template = PromptTemplate(user_id=current_user.id)
        db.add(template)

    if template_data.concept_breakdown_template is not None:
        template.concept_breakdown_template = template_data.concept_breakdown_template

    db.commit()
    db.refresh(template)
    return template
