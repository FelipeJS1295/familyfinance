from datetime import date
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select, func, extract
from sqlalchemy.orm import selectinload
from app.api.v1.dependencies.auth import CurrentUser, CurrentTenant, DB
from app.db.models.models import Transaction, Category, TransactionTypeEnum
from app.schemas.transactions.schemas import TransactionCreate, TransactionUpdate, TransactionResponse, TransactionListResponse

router = APIRouter()


@router.get("", response_model=TransactionListResponse)
async def list_transactions(
    db: DB, current_user: CurrentUser, current_tenant: CurrentTenant,
    month: int | None = Query(None), year: int | None = Query(None),
    page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=200),
):
    today = date.today()
    q_month = month or today.month
    q_year = year or today.year

    stmt = (
        select(Transaction)
        .where(Transaction.tenant_id == current_tenant.id)
        .where(extract("month", Transaction.date) == q_month)
        .where(extract("year", Transaction.date) == q_year)
        .options(selectinload(Transaction.category), selectinload(Transaction.user))
        .order_by(Transaction.date.desc(), Transaction.created_at.desc())
    )

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    offset = (page - 1) * page_size
    result = await db.execute(stmt.offset(offset).limit(page_size))
    transactions = result.scalars().all()

    totals_stmt = (
        select(Transaction.type, func.sum(Transaction.amount).label("total"))
        .where(Transaction.tenant_id == current_tenant.id)
        .where(extract("month", Transaction.date) == q_month)
        .where(extract("year", Transaction.date) == q_year)
        .group_by(Transaction.type)
    )
    totals_result = await db.execute(totals_stmt)
    totals = {row.type: float(row.total) for row in totals_result}

    return TransactionListResponse(
        items=[TransactionResponse.model_validate(t) for t in transactions],
        total=total, page=page, page_size=page_size,
        total_income=totals.get(TransactionTypeEnum.INCOME, 0.0),
        total_expense=totals.get(TransactionTypeEnum.EXPENSE, 0.0),
        balance=totals.get(TransactionTypeEnum.INCOME, 0.0) - totals.get(TransactionTypeEnum.EXPENSE, 0.0),
    )


@router.post("", response_model=TransactionResponse, status_code=201)
async def create_transaction(data: TransactionCreate, db: DB, current_user: CurrentUser, current_tenant: CurrentTenant):
    if data.category_id:
        cat = await db.get(Category, data.category_id)
        if not cat or cat.tenant_id != current_tenant.id:
            raise HTTPException(status_code=404, detail="Categoría no encontrada.")
    tx = Transaction(tenant_id=current_tenant.id, user_id=current_user.id, **data.model_dump())
    db.add(tx)
    await db.flush()
    await db.refresh(tx, ["category", "user"])
    return TransactionResponse.model_validate(tx)


@router.get("/summary/by-category")
async def summary_by_category(
    db: DB, current_user: CurrentUser, current_tenant: CurrentTenant,
    month: int | None = Query(None), year: int | None = Query(None),
):
    today = date.today()
    q_month = month or today.month
    q_year = year or today.year

    stmt = (
        select(Category.id, Category.name, Category.icon, Category.color,
               func.sum(Transaction.amount).label("total"), func.count(Transaction.id).label("count"))
        .join(Transaction, Transaction.category_id == Category.id)
        .where(Transaction.tenant_id == current_tenant.id)
        .where(Transaction.type == TransactionTypeEnum.EXPENSE)
        .where(extract("month", Transaction.date) == q_month)
        .where(extract("year", Transaction.date) == q_year)
        .group_by(Category.id, Category.name, Category.icon, Category.color)
        .order_by(func.sum(Transaction.amount).desc())
    )
    result = await db.execute(stmt)
    rows = result.all()
    total = sum(float(r.total) for r in rows)
    return [
        {"category_id": str(r.id), "name": r.name, "icon": r.icon, "color": r.color,
         "total": float(r.total), "count": r.count,
         "percentage": round(float(r.total) / total * 100, 1) if total > 0 else 0}
        for r in rows
    ]


@router.get("/{tx_id}", response_model=TransactionResponse)
async def get_transaction(tx_id: UUID, db: DB, current_user: CurrentUser, current_tenant: CurrentTenant):
    stmt = (select(Transaction).where(Transaction.id == tx_id)
            .where(Transaction.tenant_id == current_tenant.id)
            .options(selectinload(Transaction.category), selectinload(Transaction.user)))
    result = await db.execute(stmt)
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=404, detail="Transacción no encontrada.")
    return TransactionResponse.model_validate(tx)


@router.patch("/{tx_id}", response_model=TransactionResponse)
async def update_transaction(tx_id: UUID, data: TransactionUpdate, db: DB, current_user: CurrentUser, current_tenant: CurrentTenant):
    result = await db.execute(select(Transaction).where(Transaction.id == tx_id).where(Transaction.tenant_id == current_tenant.id))
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=404, detail="Transacción no encontrada.")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(tx, field, value)
    await db.flush()
    await db.refresh(tx, ["category", "user"])
    return TransactionResponse.model_validate(tx)


@router.delete("/{tx_id}", status_code=204)
async def delete_transaction(tx_id: UUID, db: DB, current_user: CurrentUser, current_tenant: CurrentTenant):
    result = await db.execute(select(Transaction).where(Transaction.id == tx_id).where(Transaction.tenant_id == current_tenant.id))
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=404, detail="Transacción no encontrada.")
    await db.delete(tx)