"""
Verificación de límites según el plan del tenant.
"""
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from datetime import date

from app.core.config import settings
from app.db.models.models import Tenant, Transaction, Goal, Budget, PlanEnum


def get_limits(plan: PlanEnum) -> dict:
    """Devuelve los límites según el plan."""
    if plan == PlanEnum.FREE:
        return {
            "max_users": settings.FREE_MAX_USERS,
            "max_transactions": settings.FREE_MAX_TRANSACTIONS_PER_MONTH,
            "max_goals": settings.FREE_MAX_GOALS,
            "max_budgets": settings.FREE_MAX_BUDGETS,
            "can_invite": False,
            "can_import_csv": False,
            "can_whatsapp": False,
            "can_export_pdf": False,
            "can_recurring": False,
            "can_weekly_summary": False,
        }
    elif plan == PlanEnum.PRO:
        return {
            "max_users": settings.PRO_MAX_USERS,
            "max_transactions": settings.PRO_MAX_TRANSACTIONS_PER_MONTH,
            "max_goals": settings.PRO_MAX_GOALS,
            "max_budgets": settings.PRO_MAX_BUDGETS,
            "can_invite": True,
            "can_import_csv": True,
            "can_whatsapp": False,
            "can_export_pdf": False,
            "can_recurring": True,
            "can_weekly_summary": True,
        }
    else:  # FAMILIA_PLUS
        return {
            "max_users": settings.FAMILIA_PLUS_MAX_USERS,
            "max_transactions": settings.FAMILIA_PLUS_MAX_TRANSACTIONS_PER_MONTH,
            "max_goals": settings.FAMILIA_PLUS_MAX_GOALS,
            "max_budgets": settings.FAMILIA_PLUS_MAX_BUDGETS,
            "can_invite": True,
            "can_import_csv": True,
            "can_whatsapp": True,
            "can_export_pdf": True,
            "can_recurring": True,
            "can_weekly_summary": True,
        }


async def check_transaction_limit(tenant: Tenant, db: AsyncSession):
    """Verifica si el tenant puede registrar más transacciones este mes."""
    limits = get_limits(tenant.plan)
    if limits["max_transactions"] == 999999:
        return

    today = date.today()
    count = await db.execute(
        select(func.count(Transaction.id))
        .where(Transaction.tenant_id == tenant.id)
        .where(extract("month", Transaction.date) == today.month)
        .where(extract("year", Transaction.date) == today.year)
    )
    total = count.scalar_one()

    if total >= limits["max_transactions"]:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Alcanzaste el límite de {limits['max_transactions']} movimientos mensuales del plan Gratuito. Actualiza a Pro para continuar.",
        )


async def check_goal_limit(tenant: Tenant, db: AsyncSession):
    """Verifica si el tenant puede crear más metas."""
    limits = get_limits(tenant.plan)
    if limits["max_goals"] == 999999:
        return

    count = await db.execute(
        select(func.count(Goal.id))
        .where(Goal.tenant_id == tenant.id)
        .where(Goal.is_completed == False)
    )
    total = count.scalar_one()

    if total >= limits["max_goals"]:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Alcanzaste el límite de {limits['max_goals']} metas del plan Gratuito. Actualiza a Pro para continuar.",
        )


async def check_budget_limit(tenant: Tenant, db: AsyncSession):
    """Verifica si el tenant puede crear más presupuestos."""
    limits = get_limits(tenant.plan)
    if limits["max_budgets"] == 999999:
        return

    today = date.today()
    count = await db.execute(
        select(func.count(Budget.id))
        .where(Budget.tenant_id == tenant.id)
        .where(Budget.month == today.month)
        .where(Budget.year == today.year)
    )
    total = count.scalar_one()

    if total >= limits["max_budgets"]:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Alcanzaste el límite de {limits['max_budgets']} presupuesto del plan Gratuito. Actualiza a Pro para continuar.",
        )


def check_invite_permission(tenant: Tenant):
    """Verifica si el tenant puede invitar miembros."""
    limits = get_limits(tenant.plan)
    if not limits["can_invite"]:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="La invitación de miembros está disponible desde el plan Pro.",
        )