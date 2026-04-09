from datetime import date
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select, func, extract, and_
from app.api.v1.dependencies.auth import CurrentUser, CurrentTenant, AdminRequired, DB
from app.db.models.models import Budget, Category, Transaction, TransactionTypeEnum
from app.schemas.budgets.schemas import BudgetCreate, BudgetUpdate, BudgetResponse, BudgetWithProgressResponse

router = APIRouter()


@router.get("", response_model=list[BudgetWithProgressResponse])
async def list_budgets(
    db: DB, current_user: CurrentUser, current_tenant: CurrentTenant,
    month: int | None = Query(None), year: int | None = Query(None),
):
    today = date.today()
    q_month = month or today.month
    q_year = year or today.year

    result = await db.execute(
        select(Budget)
        .where(Budget.tenant_id == current_tenant.id)
        .where(Budget.month == q_month)
        .where(Budget.year == q_year)
    )
    budgets = result.scalars().all()

    spent_stmt = (
        select(Transaction.category_id, func.sum(Transaction.amount).label("spent"))
        .where(Transaction.tenant_id == current_tenant.id)
        .where(Transaction.type == TransactionTypeEnum.EXPENSE)
        .where(extract("month", Transaction.date) == q_month)
        .where(extract("year", Transaction.date) == q_year)
        .group_by(Transaction.category_id)
    )
    spent_result = await db.execute(spent_stmt)
    spent_by_category = {str(row.category_id): float(row.spent) for row in spent_result}

    response = []
    for b in budgets:
        cat = await db.get(Category, b.category_id)
        spent = spent_by_category.get(str(b.category_id), 0.0)
        limit = float(b.monthly_limit)
        percentage = round(spent / limit * 100, 1) if limit > 0 else 0
        response.append(BudgetWithProgressResponse(
            id=b.id, tenant_id=b.tenant_id, category_id=b.category_id,
            monthly_limit=b.monthly_limit, month=b.month, year=b.year,
            category_name=cat.name if cat else "Sin categoría",
            category_icon=cat.icon if cat else "💰",
            category_color=cat.color if cat else "#94a3b8",
            spent=spent, percentage=percentage,
            status="danger" if percentage >= 100 else "warning" if percentage >= 80 else "ok",
        ))

    return sorted(response, key=lambda x: x.percentage, reverse=True)


@router.post("", response_model=BudgetResponse, status_code=201)
async def create_budget(data: BudgetCreate, db: DB, admin: AdminRequired, current_tenant: CurrentTenant):
    existing = await db.execute(
        select(Budget).where(and_(
            Budget.tenant_id == current_tenant.id,
            Budget.category_id == data.category_id,
            Budget.month == data.month,
            Budget.year == data.year,
        ))
    )
    budget = existing.scalar_one_or_none()
    if budget:
        budget.monthly_limit = data.monthly_limit
    else:
        budget = Budget(tenant_id=current_tenant.id, **data.model_dump())
        db.add(budget)
    await db.flush()
    return BudgetResponse.model_validate(budget)


@router.patch("/{budget_id}", response_model=BudgetResponse)
async def update_budget(budget_id: UUID, data: BudgetUpdate, db: DB, admin: AdminRequired, current_tenant: CurrentTenant):
    result = await db.execute(select(Budget).where(Budget.id == budget_id).where(Budget.tenant_id == current_tenant.id))
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado.")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(budget, field, value)
    await db.flush()
    return BudgetResponse.model_validate(budget)


@router.delete("/{budget_id}", status_code=204)
async def delete_budget(budget_id: UUID, db: DB, admin: AdminRequired, current_tenant: CurrentTenant):
    result = await db.execute(select(Budget).where(Budget.id == budget_id).where(Budget.tenant_id == current_tenant.id))
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado.")
    await db.delete(budget)