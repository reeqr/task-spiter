from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
import httpx
import json

from app.db.database import get_db
from app.models.user import User
from app.models.concept import ConceptHistory, Term, KnowledgePoint
from app.models.ai_model import Model, CurrentModel
from app.models.provider import Provider, ProviderCredential
from app.schemas.concept import (
    ConceptHistoryCreate,
    ConceptHistoryResponse,
    ConceptHistoryDetailResponse,
    BreakdownRequest,
    BreakdownResponse,
    TermResponse,
    KnowledgePointResponse,
    TermCreate,
    KnowledgePointCreate,
)
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter(prefix="/concepts", tags=["概念拆解"])


def render_template(template: str, variables: dict) -> str:
    """渲染提示词模板"""
    for key, value in variables.items():
        template = template.replace(f"{{{{{key}}}}}", str(value))
    return template


# 默认概念拆解提示词模板
DEFAULT_BREAKDOWN_TEMPLATE = """你是“知识架构师”。请将输入概念拆解为“下一层、同粒度、可递归”的知识节点，服务于后续逐节点继续拆解，最终形成知识树。

概念：{{concept}}
当前在知识树中的位置：{{treePosition}}

以下是已经拆解过的内容（禁止重复）：
- 已有知识：{{existingTerminology}}


任务目标：
- 当前仅输出第一层模块，不下钻到细节定理或技巧。
- 结果要覆盖考研{{concept}}主干，适合递归形成知识树。

【分层拆解规则（必须遵守）】
1. 先在内部确定 3-5 个拆解维度，再选择知识（不要输出维度标题）。
2. 所有知识必须处于同一抽象层级，禁止跨层混排（例如“大模块 + 具体技巧”混在一起）。
3. 按依赖关系排序输出：先修/基础 -> 核心机制 -> 关键约束/边界 -> 应用/实践。
4. 不追求一次穷尽全部细节，优先输出主干结构。
5. 输出知识必须同时符合“直接上级语义”和“整条路径语义”，避免只贴合父节点但偏离整棵树方向。

【知识质量规则】
1. 只输出专业知识列表（name + definition）。
2. name：简洁、明确、可区分，避免空泛词（如“方法”“技巧”“优化”这类无上下文名称）。
3. definition：建议 28-50 字，尽量单句；需明确该知识与“{{concept}}”的关系或作用。
4. 禁止与已有知识重复、近义改写、不同表述的同一概念。
5. 避免将步骤、例题、记忆口诀当作知识节点（除非父概念本身是流程体系）。

【边界策略】
1. 若输入概念范围很大（如学科/系统），优先输出“骨架层”知识。
2. 若输入概念范围较小（如单一定理/方法），优先输出“机制与构成层”知识。
3. 如概念存在歧义，默认采用主流语境。

请严格以 JSON 格式返回，不要输出任何额外说明，格式如下：
{
  "terminology": [
    {
      "name": "知识名称",
      "definition": "知识定义"
    }
  ]
}"""


@router.post("/breakdown", response_model=BreakdownResponse)
async def breakdown_concept(
    request: BreakdownRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """拆解概念为术语和考点"""
    # 获取当前模型
    current_model = db.query(CurrentModel).filter(
        CurrentModel.user_id == current_user.id
    ).first()

    if not current_model or not current_model.model_id:
        raise HTTPException(status_code=400, detail="No model selected")

    model = db.query(Model).filter(Model.id == current_model.model_id).first()
    if not model:
        raise HTTPException(status_code=400, detail="Model not found")

    provider = db.query(Provider).filter(Provider.id == model.provider_id).first()
    if not provider:
        raise HTTPException(status_code=400, detail="Provider not found")

    credential = db.query(ProviderCredential).filter(
        ProviderCredential.provider_id == provider.id
    ).first()
    if not credential:
        raise HTTPException(status_code=400, detail="API key not configured")

    # 构建提示词
    existing_knowledge = []
    if request.existing_terminology:
        existing_knowledge.extend(request.existing_terminology)
    if request.existing_knowledge_points:
        existing_knowledge.extend(request.existing_knowledge_points)
    deduped_existing_knowledge = list(dict.fromkeys(existing_knowledge))

    prompt = render_template(DEFAULT_BREAKDOWN_TEMPLATE, {
        "concept": request.concept,
        "existingTerminology": "、".join(deduped_existing_knowledge) if deduped_existing_knowledge else "无",
        "treePosition": " > ".join(request.node_path) if request.node_path else f"根节点 > {request.concept}",
    })

    # 调用 AI API
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{provider.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {credential.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model.model_code,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": float(model.temperature),
                },
                timeout=60.0,
            )
            response.raise_for_status()
            result = response.json()
            content = result["choices"][0]["message"]["content"]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI API call failed: {str(e)}")

    # 解析 AI 返回结果
    try:
        # 尝试提取 JSON
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]

        parsed = json.loads(content.strip())
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response")

    # 创建历史记录
    folder_uuid = UUID(request.folder_id) if request.folder_id else None
    history = ConceptHistory(
        user_id=current_user.id,
        folder_id=folder_uuid,
        concept=request.concept,
    )
    db.add(history)
    db.flush()

    # 创建术语
    terms = []
    for i, term_data in enumerate(parsed.get("terminology", [])):
        term = Term(
            history_id=history.id,
            name=term_data.get("name", ""),
            definition=term_data.get("definition", ""),
            sort_order=i,
            path=f"{request.concept} > {term_data.get('name', '')}",
        )
        db.add(term)
        terms.append(term)

    # 创建考点
    kps = []
    for i, kp_data in enumerate(parsed.get("knowledgePoints", [])):
        kp = KnowledgePoint(
            history_id=history.id,
            title=kp_data.get("title", ""),
            description=kp_data.get("description", ""),
            sort_order=i,
            path=f"{request.concept} > {kp_data.get('title', '')}",
        )
        db.add(kp)
        kps.append(kp)

    db.commit()

    # 返回结果
    return BreakdownResponse(
        concept=request.concept,
        terminology=[TermResponse.model_validate(t) for t in terms],
        knowledge_points=[KnowledgePointResponse.model_validate(k) for k in kps],
    )


@router.get("/history", response_model=List[ConceptHistoryResponse])
def list_concept_history(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取概念拆解历史"""
    history = db.query(ConceptHistory).filter(
        ConceptHistory.user_id == current_user.id
    ).order_by(ConceptHistory.created_at.desc()).offset(skip).limit(limit).all()
    return history


@router.get("/history/{history_id}", response_model=ConceptHistoryDetailResponse)
def get_concept_history_detail(
    history_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取概念拆解详情"""
    history = db.query(ConceptHistory).filter(
        ConceptHistory.id == history_id,
        ConceptHistory.user_id == current_user.id,
    ).first()
    if not history:
        raise HTTPException(status_code=404, detail="History not found")

    # 获取顶级术语（无父节点）
    terms = db.query(Term).filter(
        Term.history_id == history_id,
        Term.parent_id == None,
    ).order_by(Term.sort_order).all()

    # 获取顶级考点（无父节点）
    kps = db.query(KnowledgePoint).filter(
        KnowledgePoint.history_id == history_id,
        KnowledgePoint.parent_id == None,
    ).order_by(KnowledgePoint.sort_order).all()

    return ConceptHistoryDetailResponse(
        id=history.id,
        user_id=history.user_id,
        folder_id=history.folder_id,
        concept=history.concept,
        sort_order=history.sort_order,
        created_at=history.created_at,
        updated_at=history.updated_at,
        terms=[TermResponse.model_validate(t, from_attributes=True) for t in terms],
        knowledge_points=[KnowledgePointResponse.model_validate(k, from_attributes=True) for k in kps],
    )


@router.delete("/history/{history_id}")
def delete_concept_history(
    history_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """删除概念拆解历史"""
    history = db.query(ConceptHistory).filter(
        ConceptHistory.id == history_id,
        ConceptHistory.user_id == current_user.id,
    ).first()
    if not history:
        raise HTTPException(status_code=404, detail="History not found")

    db.delete(history)
    db.commit()
    return {"message": "History deleted"}
