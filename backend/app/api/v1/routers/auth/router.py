from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Response, Cookie, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.security import (
    verify_password, hash_password,
    create_access_token, create_refresh_token,
    hash_refresh_token, refresh_token_expiry,
)
from app.db.session import get_db
from app.db.models.models import User, Tenant, RefreshToken, PlanEnum, UserRoleEnum
from app.schemas.auth.schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.api.v1.dependencies.auth import CurrentUser, DB
from fastapi import Depends

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: RegisterRequest, response: Response, db: DB):
    existing = await db.execute(select(User).where(User.email == data.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Ya existe una cuenta con ese correo.")

    import secrets
    slug = data.family_name.lower().replace(" ", "-")[:40]
    tenant = Tenant(
        name=data.family_name,
        slug=f"{slug}-{secrets.token_hex(4)}",
        plan=PlanEnum.FREE,
    )
    db.add(tenant)
    await db.flush()

    user = User(
        tenant_id=tenant.id,
        name=data.name,
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        role=UserRoleEnum.ADMIN,
    )
    db.add(user)
    await db.flush()

    await _create_default_categories(db, tenant.id)

    access_token = create_access_token({"sub": str(user.id), "tid": str(tenant.id)})
    token_raw, token_hash = create_refresh_token()
    rt = RefreshToken(user_id=user.id, token_hash=token_hash, expires_at=refresh_token_expiry())
    db.add(rt)
    _set_refresh_cookie(response, token_raw)

    return TokenResponse(access_token=access_token, token_type="bearer", user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, response: Response, db: DB):
    result = await db.execute(select(User).where(User.email == data.email.lower()))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="El correo o la contraseña son incorrectos.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Tu cuenta está desactivada.")

    user.last_login_at = datetime.now(timezone.utc)
    access_token = create_access_token({"sub": str(user.id), "tid": str(user.tenant_id)})
    token_raw, token_hash = create_refresh_token()
    rt = RefreshToken(user_id=user.id, token_hash=token_hash, expires_at=refresh_token_expiry())
    db.add(rt)
    _set_refresh_cookie(response, token_raw)

    return TokenResponse(access_token=access_token, token_type="bearer", user=UserResponse.model_validate(user))


@router.post("/refresh", response_model=TokenResponse)
async def refresh(response: Response, db: DB, refresh_token: str | None = Cookie(default=None, alias="ff_refresh")):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Sesión expirada.")

    token_hash = hash_refresh_token(refresh_token)
    result = await db.execute(
        select(RefreshToken)
        .where(RefreshToken.token_hash == token_hash)
        .where(RefreshToken.revoked == False)
    )
    rt = result.scalar_one_or_none()
    if not rt or rt.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Sesión expirada.")

    rt.revoked = True
    new_raw, new_hash = create_refresh_token()
    new_rt = RefreshToken(user_id=rt.user_id, token_hash=new_hash, expires_at=refresh_token_expiry())
    db.add(new_rt)

    result = await db.execute(select(User).where(User.id == rt.user_id))
    user = result.scalar_one()
    access_token = create_access_token({"sub": str(user.id), "tid": str(user.tenant_id)})
    _set_refresh_cookie(response, new_raw)

    return TokenResponse(access_token=access_token, token_type="bearer", user=UserResponse.model_validate(user))


@router.post("/logout")
async def logout(response: Response, db: DB, current_user: CurrentUser, refresh_token: str | None = Cookie(default=None, alias="ff_refresh")):
    if refresh_token:
        token_hash = hash_refresh_token(refresh_token)
        result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
        rt = result.scalar_one_or_none()
        if rt:
            rt.revoked = True
    response.delete_cookie("ff_refresh")
    return {"message": "Sesión cerrada."}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: CurrentUser):
    return UserResponse.model_validate(current_user)


def _set_refresh_cookie(response: Response, token: str):
    response.set_cookie(
        key="ff_refresh", value=token,
        httponly=True, secure=False, samesite="lax",
        max_age=30 * 24 * 60 * 60, path="/api/v1/auth",
    )


async def _create_default_categories(db: AsyncSession, tenant_id):
    from app.db.models.models import Category
    defaults = [
        {"name": "Supermercado",   "icon": "🛒", "color": "#10b981", "is_income": False},
        {"name": "Cuentas",        "icon": "💡", "color": "#3b82f6", "is_income": False},
        {"name": "Transporte",     "icon": "🚗", "color": "#f59e0b", "is_income": False},
        {"name": "Salud",          "icon": "💊", "color": "#ef4444", "is_income": False},
        {"name": "Educación",      "icon": "📚", "color": "#8b5cf6", "is_income": False},
        {"name": "Ocio",           "icon": "🎬", "color": "#ec4899", "is_income": False},
        {"name": "Hogar",          "icon": "🏠", "color": "#6366f1", "is_income": False},
        {"name": "Ropa",           "icon": "👕", "color": "#14b8a6", "is_income": False},
        {"name": "Restaurantes",   "icon": "🍽️", "color": "#f97316", "is_income": False},
        {"name": "Otros gastos",   "icon": "💸", "color": "#94a3b8", "is_income": False},
        {"name": "Sueldo",         "icon": "💼", "color": "#10b981", "is_income": True},
        {"name": "Bono",           "icon": "🎁", "color": "#f59e0b", "is_income": True},
        {"name": "Otros ingresos", "icon": "💰", "color": "#3b82f6", "is_income": True},
    ]
    for cat_data in defaults:
        cat = Category(tenant_id=tenant_id, is_default=True, **cat_data)
        db.add(cat)