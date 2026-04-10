from datetime import date
from uuid import UUID
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, func
from app.api.v1.dependencies.auth import CurrentUser, CurrentTenant, DB
from app.db.models.models import Goal, Transaction, TransactionTypeEnum
from app.schemas.goals.schemas import GoalCreate, GoalUpdate, GoalResponse

router = APIRouter()


async def _goal_response(db, goal: Goal) -> GoalResponse:
    """Calcula el progreso real sumando transacciones vinculadas a esta meta."""
    result = await db.execute(
        select(func.sum(Transaction.amount))
        .where(Transaction.goal_id == goal.id)
        .where(Transaction.type == TransactionTypeEnum.INCOME)
    )
    current_amount = float(result.scalar_one() or 0)

    target = float(goal.target_amount)
    percentage = round(current_amount / target * 100, 1) if target > 0 else 0
    days_left = (goal.deadline - date.today()).days if goal.deadline else None

    return GoalResponse(
        id=goal.id,
        tenant_id=goal.tenant_id,
        name=goal.name,
        description=goal.description,
        target_amount=goal.target_amount,
        current_amount=current_amount,
        percentage=min(percentage, 100),
        deadline=goal.deadline,
        days_left=days_left,
        icon=goal.icon,
        color=goal.color,
        is_completed=goal.is_completed,
        completed_at=goal.completed_at,
        created_at=goal.created_at,
    )


@router.get("", response_model=list[GoalResponse])
async def list_goals(db: DB, current_user: CurrentUser, current_tenant: CurrentTenant):
    result = await db.execute(
        select(Goal).where(Goal.tenant_id == current_tenant.id)
        .order_by(Goal.is_completed, Goal.created_at.desc())
    )
    return [await _goal_response(db, g) for g in result.scalars().all()]


@router.post("", response_model=GoalResponse, status_code=201)
async def create_goal(data: GoalCreate, db: DB, current_user: CurrentUser, current_tenant: CurrentTenant):
    goal = Goal(tenant_id=current_tenant.id, **data.model_dump())
    db.add(goal)
    await db.flush()
    return await _goal_response(db, goal)


@router.patch("/{goal_id}", response_model=GoalResponse)
async def update_goal(goal_id: UUID, data: GoalUpdate, db: DB, current_user: CurrentUser, current_tenant: CurrentTenant):
    result = await db.execute(select(Goal).where(Goal.id == goal_id).where(Goal.tenant_id == current_tenant.id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Meta no encontrada.")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(goal, field, value)
    await db.flush()
    return await _goal_response(db, goal)


@router.delete("/{goal_id}", status_code=204)
async def delete_goal(goal_id: UUID, db: DB, current_user: CurrentUser, current_tenant: CurrentTenant):
    result = await db.execute(select(Goal).where(Goal.id == goal_id).where(Goal.tenant_id == current_tenant.id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Meta no encontrada.")
    await db.delete(goal)