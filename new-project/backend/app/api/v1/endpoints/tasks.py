from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.task import Task
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskWithChildren,
    TaskListResponse,
)
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter(prefix="/tasks", tags=["任务管理"])


def build_task_tree(tasks: List[Task], parent_id: Optional[UUID] = None) -> List[TaskWithChildren]:
    """递归构建任务树"""
    result = []
    for task in tasks:
        if task.parent_id == parent_id:
            children = build_task_tree(tasks, task.id)
            task_with_children = TaskWithChildren(
                id=task.id,
                user_id=task.user_id,
                parent_id=task.parent_id,
                title=task.title,
                description=task.description,
                completed=task.completed,
                spicy_level=task.spicy_level,
                category=task.category,
                sort_order=task.sort_order,
                created_at=task.created_at,
                updated_at=task.updated_at,
                children=children,
            )
            result.append(task_with_children)
    return result


@router.get("", response_model=TaskListResponse)
def list_tasks(
    completed: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取任务列表"""
    query = db.query(Task).filter(Task.user_id == current_user.id)
    if completed is not None:
        query = query.filter(Task.completed == completed)

    tasks = query.order_by(Task.sort_order, Task.created_at.desc()).all()
    task_tree = build_task_tree(tasks)

    return TaskListResponse(items=task_tree, total=len(tasks))


@router.post("", response_model=TaskResponse)
def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """创建任务"""
    # 如果有 parent_id，验证父任务属于当前用户
    if task_data.parent_id:
        parent = db.query(Task).filter(
            Task.id == task_data.parent_id,
            Task.user_id == current_user.id,
        ).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent task not found")

    task = Task(
        user_id=current_user.id,
        parent_id=task_data.parent_id,
        title=task_data.title,
        description=task_data.description or "",
        spicy_level=task_data.spicy_level or 3,
        category=task_data.category or "",
        sort_order=task_data.sort_order or 0,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: UUID,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """更新任务"""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id,
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = task_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}")
def delete_task(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """删除任务及其子任务"""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id,
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # 递归删除所有子任务
    def delete_children(parent_id: UUID):
        children = db.query(Task).filter(Task.parent_id == parent_id).all()
        for child in children:
            delete_children(child.id)
        db.query(Task).filter(Task.id == parent_id).delete()

    delete_children(task_id)
    db.commit()
    return {"message": "Task deleted"}


@router.put("/{task_id}/toggle")
def toggle_task(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """切换任务完成状态"""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id,
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.completed = not task.completed
    db.commit()
    return {"id": task_id, "completed": task.completed}


@router.post("/breakdown")
async def breakdown_task(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """AI 拆解任务为子任务"""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id,
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # TODO: 实现 AI 拆解任务逻辑
    return {"message": "Not implemented yet", "task_id": str(task_id)}