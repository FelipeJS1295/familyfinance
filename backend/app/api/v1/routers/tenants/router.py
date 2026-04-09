"""
Router de tenants — gestión del hogar, miembros y categorías.
"""
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.v1.dependencies.auth import CurrentUser, CurrentTenant, AdminRequired, DB
from app.core.security import hash_password
from app.db.models.models import User, Tenant, UserRoleEnum, Category
from app.schemas.tenants.schemas import (
    TenantResponse, TenantUpdate,
    InviteMemberRequest, MemberResponse, UpdateMemberRequest
)

router = APIRouter()


@router.get("/me", response_model=TenantResponse)
async def get_my_tenant(current_tenant: CurrentTenant):
    return TenantResponse.model_validate(current_tenant)


@router.patch("/me", response_model=TenantResponse)
async def update_tenant(data: TenantUpdate, db: DB, admin: AdminRequired, current_tenant: CurrentTenant):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(current_tenant, field, value)
    await db.flush()
    return TenantResponse.model_validate(current_tenant)


@router.get("/members", response_model=list[MemberResponse])
async def list_members(db: DB, current_user: CurrentUser, current_tenant: CurrentTenant):
    result = await db.execute(
        select(User)
        .where(User.tenant_id == current_tenant.id)
        .order_by(User.created_at)
    )
    return [MemberResponse.model_validate(u) for u in result.scalars().all()]


@router.post("/members/invite", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
async def invite_member(data: InviteMemberRequest, db: DB, admin: AdminRequired, current_tenant: CurrentTenant):
    from app.core.config import settings

    result = await db.execute(select(User).where(User.tenant_id == current_tenant.id))
    current_count = len(result.scalars().all())

    limits = {
        "free": settings.FREE_MAX_USERS,
        "pro": settings.PRO_MAX_USERS,
        "familia_plus": settings.FAMILIA_PLUS_MAX_USERS,
    }
    max_users = limits.get(current_tenant.plan.value, 2)
    if current_count >= max_users:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Tu plan permite máximo {max_users} miembros.",
        )

    existing = await db.execute(select(User).where(User.email == data.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Ya existe una cuenta con ese correo.")

    user = User(
        tenant_id=current_tenant.id,
        name=data.name,
        email=data.email.lower(),
        password_hash=hash_password(data.temporary_password),
        role=data.role,
    )
    db.add(user)
    await db.flush()
    return MemberResponse.model_validate(user)


@router.patch("/members/{user_id}", response_model=MemberResponse)
async def update_member(
    user_id: UUID,
    data: UpdateMemberRequest,
    db: DB,
    admin: AdminRequired,
    current_tenant: CurrentTenant,
):
    result = await db.execute(
        select(User).where(User.id == user_id).where(User.tenant_id == current_tenant.id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Miembro no encontrado.")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    await db.flush()
    return MemberResponse.model_validate(user)


@router.delete("/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(user_id: UUID, db: DB, admin: AdminRequired, current_tenant: CurrentTenant):
    result = await db.execute(
        select(User).where(User.id == user_id).where(User.tenant_id == current_tenant.id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Miembro no encontrado.")
    if user.role == UserRoleEnum.ADMIN:
        raise HTTPException(status_code=400, detail="No puedes eliminar al administrador.")
    await db.delete(user)


# ── Categorías ────────────────────────────────────────────────

@router.get("/categories")
async def list_categories(db: DB, current_user: CurrentUser, current_tenant: CurrentTenant):
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
async def create_category(data: dict, db: DB, current_user: CurrentUser, current_tenant: CurrentTenant):
    cat = Category(
        tenant_id=current_tenant.id,
        name=data.get("name", "Nueva categoría"),
        icon=data.get("icon", "💰"),
        color=data.get("color", "#6366f1"),
        is_income=data.get("is_income", False),
    )
    db.add(cat)
    await db.flush()
    return {"id": str(cat.id), "name": cat.name, "icon": cat.icon, "color": cat.color}


@router.delete("/categories/{cat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(cat_id: UUID, db: DB, current_user: CurrentUser, current_tenant: CurrentTenant):
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