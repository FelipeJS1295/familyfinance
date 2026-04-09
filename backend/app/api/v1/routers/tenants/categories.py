"""
Endpoint de categorías — dentro del router de tenants.
"""
from uuid import UUID
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from app.api.v1.dependencies.auth import CurrentUser, CurrentTenant, DB
from app.db.models.models import Category

router = APIRouter()


@router.get("/categories")
async def list_categories(
    db: DB,
    current_user: CurrentUser,
    current_tenant: CurrentTenant,
):
    result = await db.execute(
        select(Category)
        .where(Category.tenant_id == current_tenant.id)
        .order_by(Category.is_income, Category.name)
    )
    cats = result.scalars().all()
    return [
        {
            "id": str(c.id),
            "name": c.name,
            "icon": c.icon,
            "color": c.color,
            "is_income": c.is_income,
            "is_default": c.is_default,
        }
        for c in cats
    ]


@router.post("/categories", status_code=status.HTTP_201_CREATED)
async def create_category(
    data: dict,
    db: DB,
    current_user: CurrentUser,
    current_tenant: CurrentTenant,
):
    cat = Category(
        tenant_id=current_tenant.id,
        name=data.get("name", "Nueva categoría"),
        icon=data.get("icon", "💰"),
        color=data.get("color", "#6366f1"),
        is_income=data.get("is_income", False),
    )
    db.add(cat)
    await db.flush()
    return {
        "id": str(cat.id),
        "name": cat.name,
        "icon": cat.icon,
        "color": cat.color,
        "is_income": cat.is_income,
    }


@router.delete("/categories/{cat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    cat_id: UUID,
    db: DB,
    current_user: CurrentUser,
    current_tenant: CurrentTenant,
):
    result = await db.execute(
        select(Category)
        .where(Category.id == cat_id)
        .where(Category.tenant_id == current_tenant.id)
    )
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada.")
    if cat.is_default:
        raise HTTPException(status_code=400, detail="No puedes eliminar categorías predeterminadas.")
    await db.delete(cat)