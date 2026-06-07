from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.folder import Folder
from app.models.concept import ConceptHistory
from app.schemas.folder import (
    FolderCreate,
    FolderUpdate,
    FolderResponse,
    FolderTreeNode,
    KnowledgeTreeSimple,
    MoveKnowledgeTreeRequest,
)
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter(prefix="/folders", tags=["目录管理"])


def is_descendant(db: Session, folder_id: UUID, potential_ancestor_id: UUID) -> bool:
    """检查 folder_id 是否是 potential_ancestor_id 的后代"""
    current = db.query(Folder).filter(Folder.id == folder_id).first()
    while current and current.parent_id:
        if current.parent_id == potential_ancestor_id:
            return True
        current = db.query(Folder).filter(Folder.id == current.parent_id).first()
    return False


@router.get("/tree", response_model=List[FolderTreeNode])
def get_folder_tree(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取完整目录树（含子目录和知识树）"""
    # 获取根目录（无父节点）
    root_folders = db.query(Folder).filter(
        Folder.user_id == current_user.id,
        Folder.parent_id == None,
    ).order_by(Folder.sort_order).all()

    # 获取根目录下的知识树（folder_id 为 NULL）
    root_knowledge_trees = db.query(ConceptHistory).filter(
        ConceptHistory.user_id == current_user.id,
        ConceptHistory.folder_id == None,
    ).order_by(ConceptHistory.sort_order).all()

    def build_folder_tree(folder: Folder) -> FolderTreeNode:
        # 获取子目录
        sub_folders = db.query(Folder).filter(
            Folder.parent_id == folder.id
        ).order_by(Folder.sort_order).all()

        # 获取该目录下的知识树
        knowledge_trees = db.query(ConceptHistory).filter(
            ConceptHistory.folder_id == folder.id
        ).order_by(ConceptHistory.sort_order).all()

        return FolderTreeNode(
            id=folder.id,
            name=folder.name,
            parent_id=folder.parent_id,
            sort_order=folder.sort_order,
            type="folder",
            created_at=folder.created_at,
            children=[build_folder_tree(f) for f in sub_folders],
            knowledge_trees=[
                KnowledgeTreeSimple(
                    id=kt.id,
                    concept=kt.concept,
                    sort_order=kt.sort_order,
                    created_at=kt.created_at,
                )
                for kt in knowledge_trees
            ],
        )

    # 构建根节点
    root_nodes = [build_folder_tree(f) for f in root_folders]

    # 添加根级别的知识树作为虚拟根节点的子节点
    root_knowledge_trees_node = FolderTreeNode(
        id=UUID("00000000-0000-0000-0000-000000000000"),
        name="根目录",
        parent_id=None,
        sort_order=-1,
        type="root",
        created_at=datetime.min,
        children=[],
        knowledge_trees=[
            KnowledgeTreeSimple(
                id=kt.id,
                concept=kt.concept,
                sort_order=kt.sort_order,
                created_at=kt.created_at,
            )
            for kt in root_knowledge_trees
        ],
    )

    return [root_knowledge_trees_node] + root_nodes


@router.post("", response_model=FolderResponse)
def create_folder(
    folder_data: FolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """创建新目录"""
    # 如果有父目录，验证父目录存在且属于当前用户
    if folder_data.parent_id:
        parent = db.query(Folder).filter(
            Folder.id == folder_data.parent_id,
            Folder.user_id == current_user.id,
        ).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent folder not found")

        # 检查循环引用
        if is_descendant(db, folder_data.parent_id, folder_data.parent_id):
            raise HTTPException(status_code=400, detail="Cannot create folder under itself")

    # 获取同级最大 sort_order
    max_order = db.query(Folder).filter(
        Folder.user_id == current_user.id,
        Folder.parent_id == folder_data.parent_id,
    ).count()

    folder = Folder(
        user_id=current_user.id,
        parent_id=folder_data.parent_id,
        name=folder_data.name,
        sort_order=max_order,
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


@router.put("/{folder_id}", response_model=FolderResponse)
def update_folder(
    folder_id: UUID,
    folder_data: FolderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """更新目录（重命名、移动）"""
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.user_id == current_user.id,
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    # 如果移动到新父目录
    if folder_data.parent_id is not None and folder_data.parent_id != folder.parent_id:
        parent = db.query(Folder).filter(
            Folder.id == folder_data.parent_id,
            Folder.user_id == current_user.id,
        ).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent folder not found")

        # 检查循环引用：不能把目录移到自己的后代下
        if is_descendant(db, folder_data.parent_id, folder_id):
            raise HTTPException(status_code=400, detail="Cannot move folder to its own descendant")

        folder.parent_id = folder_data.parent_id

    if folder_data.name is not None:
        folder.name = folder_data.name

    if folder_data.sort_order is not None:
        folder.sort_order = folder_data.sort_order

    db.commit()
    db.refresh(folder)
    return folder


@router.delete("/{folder_id}")
def delete_folder(
    folder_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """删除目录（级联删除子目录和知识树）"""
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.user_id == current_user.id,
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    # 删除目录下的知识树（folder_id 设为 NULL 会自动解除关系，但这里级联删除）
    knowledge_trees = db.query(ConceptHistory).filter(
        ConceptHistory.folder_id == folder_id
    ).all()
    for kt in knowledge_trees:
        db.delete(kt)

    # 递归删除子目录
    def delete_children(parent_id: UUID):
        children = db.query(Folder).filter(Folder.parent_id == parent_id).all()
        for child in children:
            # 删除子目录下的知识树
            child_kts = db.query(ConceptHistory).filter(ConceptHistory.folder_id == child.id).all()
            for ckt in child_kts:
                db.delete(ckt)
            # 递归删除子子目录
            delete_children(child.id)
            db.delete(child)

    delete_children(folder_id)
    db.delete(folder)
    db.commit()
    return {"message": "Folder deleted"}


@router.put("/knowledge-tree/{kt_id}/move", response_model=dict)
def move_knowledge_tree(
    kt_id: UUID,
    move_data: MoveKnowledgeTreeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """移动知识树到指定目录"""
    knowledge_tree = db.query(ConceptHistory).filter(
        ConceptHistory.id == kt_id,
        ConceptHistory.user_id == current_user.id,
    ).first()
    if not knowledge_tree:
        raise HTTPException(status_code=404, detail="Knowledge tree not found")

    # 验证目标目录存在（如果指定了 folder_id）
    if move_data.folder_id:
        folder = db.query(Folder).filter(
            Folder.id == move_data.folder_id,
            Folder.user_id == current_user.id,
        ).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Target folder not found")

    knowledge_tree.folder_id = move_data.folder_id
    db.commit()
    return {"message": "Knowledge tree moved"}


from datetime import datetime