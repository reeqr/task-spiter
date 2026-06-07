from typing import AsyncGenerator, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import httpx
import json

from app.db.database import get_db
from app.models.user import User
from app.models.concept import Term, KnowledgePoint
from app.models.ai_model import Model, CurrentModel
from app.models.provider import Provider, ProviderCredential
from app.models.config import QueryAction
from app.core.query_actions import SYSTEM_ACTION_MAP
from app.schemas.concept import TermResponse, KnowledgePointResponse
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter(prefix="/terms", tags=["术语查询"])


def render_template(template: str, variables: dict) -> str:
    """渲染提示词模板"""
    for key, value in variables.items():
        template = template.replace(f"{{{{{key}}}}}", str(value))
    return template


def get_query_action_templates(db: Session, current_user_id: UUID, action_id: str) -> dict:
    action = db.query(QueryAction).filter(
        QueryAction.user_id == current_user_id,
        QueryAction.action_key == action_id,
        QueryAction.enabled == True,
    ).first()
    if action:
        return {
            "query_template": action.query_template,
            "followup_template": action.followup_template,
        }

    system_action = SYSTEM_ACTION_MAP.get(action_id)
    if system_action:
        return {
            "query_template": system_action["query_template"],
            "followup_template": system_action["followup_template"],
        }

    fallback = SYSTEM_ACTION_MAP["knowledge-explain"]
    return {
        "query_template": fallback["query_template"],
        "followup_template": fallback["followup_template"],
    }


def get_model_context(db: Session, current_user: User) -> tuple[Model, Provider, ProviderCredential]:
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

    return model, provider, credential


async def stream_chat_completion(
    provider: Provider,
    credential: ProviderCredential,
    model: Model,
    prompt: str,
) -> AsyncGenerator[str, None]:
    try:
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream(
                "POST",
                f"{provider.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {credential.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model.model_code,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": float(model.temperature),
                    "stream": True,
                },
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line or not line.startswith("data:"):
                        continue

                    data = line[len("data:"):].strip()
                    if data == "[DONE]":
                        break

                    try:
                        payload = json.loads(data)
                    except json.JSONDecodeError:
                        continue

                    delta = payload.get("choices", [{}])[0].get("delta", {})
                    content = delta.get("content")
                    if content:
                        yield content
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=500, detail=f"AI API call failed: {str(exc)}")


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


@router.post("/{term_id}/breakdown")
async def breakdown_term(
    term_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """递归拆解术语或考点"""
    # 先尝试查询术语
    term = db.query(Term).filter(Term.id == term_id).first()

    # 如果不是术语，尝试查询考点
    if not term:
        kp = db.query(KnowledgePoint).filter(KnowledgePoint.id == term_id).first()
        if not kp:
            raise HTTPException(status_code=404, detail="Term not found")

        # 获取父术语（如果考点是从属于某个术语的话）
        parent_term = None
        if kp.parent_term_id:
            parent_term = db.query(Term).filter(Term.id == kp.parent_term_id).first()

        # 确定 history_id 和路径
        history_id = parent_term.history_id if parent_term else kp.history_id
        term_name = kp.title
        term_path = kp.path
        parent_id = kp.id  # 考点作为父节点
        is_knowledge_point = True
    else:
        history_id = term.history_id
        term_name = term.name
        term_path = term.path
        parent_id = term.id
        is_knowledge_point = False

    # 获取历史记录中的已有术语/考点（用于避免重复）
    existing_terms = db.query(Term).filter(Term.history_id == history_id).all()
    existing_terminology = [t.name for t in existing_terms]

    existing_kps = db.query(KnowledgePoint).filter(KnowledgePoint.history_id == history_id).all()
    existing_knowledge_points = [kp.title for kp in existing_kps]

    # 获取当前模型
    current_model = db.query(CurrentModel).filter(CurrentModel.user_id == current_user.id).first()
    if not current_model or not current_model.model_id:
        raise HTTPException(status_code=400, detail="No model selected")

    model = db.query(Model).filter(Model.id == current_model.model_id).first()
    if not model:
        raise HTTPException(status_code=400, detail="Model not found")

    provider = db.query(Provider).filter(Provider.id == model.provider_id).first()
    if not provider:
        raise HTTPException(status_code=400, detail="Provider not found")

    credential = db.query(ProviderCredential).filter(ProviderCredential.provider_id == provider.id).first()
    if not credential:
        raise HTTPException(status_code=400, detail="API key not configured")

    existing_knowledge = existing_terminology + existing_knowledge_points
    deduped_existing_knowledge = list(dict.fromkeys(existing_knowledge))

    prompt = render_template(DEFAULT_BREAKDOWN_TEMPLATE, {
        "concept": term_name,
        "existingTerminology": "、".join(deduped_existing_knowledge) if deduped_existing_knowledge else "无",
        "treePosition": term_path,
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

    # 解析结果
    try:
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        parsed = json.loads(content.strip())
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response")

    # 如果是考点，更新其状态；如果是术语，也更新状态
    if is_knowledge_point:
        kp.is_breaking_down = False
        kp.is_expanded = True
    else:
        term.is_breaking_down = False
        term.is_expanded = True

    # 创建子术语
    terms = []
    for i, term_data in enumerate(parsed.get("terminology", [])):
        child = Term(
            history_id=history_id,
            parent_id=parent_id if not is_knowledge_point else None,
            name=term_data.get("name", ""),
            definition=term_data.get("definition", ""),
            sort_order=i,
            path=f"{term_path} > {term_data.get('name', '')}",
        )
        db.add(child)
        terms.append(child)

    # 创建子考点
    kps = []
    for i, kp_data in enumerate(parsed.get("knowledgePoints", [])):
        child_kp = KnowledgePoint(
            history_id=history_id,
            parent_id=parent_id if is_knowledge_point else None,
            parent_term_id=parent_id if not is_knowledge_point else None,
            title=kp_data.get("title", ""),
            description=kp_data.get("description", ""),
            sort_order=i,
            path=f"{term_path} > {kp_data.get('title', '')}",
        )
        db.add(child_kp)
        kps.append(child_kp)

    db.commit()

    return {
        "terminology": [TermResponse.model_validate(t) for t in terms],
        "knowledge_points": [KnowledgePointResponse.model_validate(k) for k in kps],
    }


@router.post("/query")
async def query_term(
    action_id: str,
    term: str,
    concept: Optional[str] = "",
    term_definition: Optional[str] = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """查询知识（解释、出题角度、易错点）"""
    model, provider, credential = get_model_context(db, current_user)
    templates = get_query_action_templates(db, current_user.id, action_id)
    template = templates["query_template"]
    prompt = render_template(template, {
        "term": term,
        "concept": concept or "",
        "termDefinition": f"已知定义：{term_definition}" if term_definition else "",
        "followupQuestion": "",
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

    return {"answer": content, "sources": [], "source_notice": ""}


@router.post("/query/stream")
async def query_term_stream(
    request: Request,
    action_id: str,
    term: str,
    concept: Optional[str] = "",
    term_definition: Optional[str] = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """流式查询知识（解释、出题角度、易错点）"""
    model, provider, credential = get_model_context(db, current_user)
    templates = get_query_action_templates(db, current_user.id, action_id)
    prompt = render_template(templates["query_template"], {
        "term": term,
        "concept": concept or "",
        "termDefinition": f"已知定义：{term_definition}" if term_definition else "",
        "followupQuestion": "",
    })

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            async for chunk in stream_chat_completion(provider, credential, model, prompt):
                if await request.is_disconnected():
                    break
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk}, ensure_ascii=False)}\n\n"
            yield "data: {\"type\":\"done\"}\n\n"
        except HTTPException as exc:
            yield f"data: {json.dumps({'type': 'error', 'message': exc.detail}, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/query/followup")
async def query_followup(
    action_id: str,
    term: str,
    concept: Optional[str] = "",
    followup_question: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """追问功能"""
    model, provider, credential = get_model_context(db, current_user)
    templates = get_query_action_templates(db, current_user.id, action_id)
    prompt = render_template(templates["followup_template"], {
        "term": term,
        "concept": concept or "",
        "termDefinition": "",
        "followupQuestion": followup_question,
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

    return {"answer": content, "sources": [], "source_notice": ""}


@router.post("/query/followup/stream")
async def query_followup_stream(
    request: Request,
    action_id: str,
    term: str,
    concept: Optional[str] = "",
    followup_question: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """流式追问功能"""
    model, provider, credential = get_model_context(db, current_user)
    templates = get_query_action_templates(db, current_user.id, action_id)
    prompt = render_template(templates["followup_template"], {
        "term": term,
        "concept": concept or "",
        "termDefinition": "",
        "followupQuestion": followup_question,
    })

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            async for chunk in stream_chat_completion(provider, credential, model, prompt):
                if await request.is_disconnected():
                    break
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk}, ensure_ascii=False)}\n\n"
            yield "data: {\"type\":\"done\"}\n\n"
        except HTTPException as exc:
            yield f"data: {json.dumps({'type': 'error', 'message': exc.detail}, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
