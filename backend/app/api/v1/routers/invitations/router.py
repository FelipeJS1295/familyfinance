"""
Router de invitaciones — códigos para unirse a un hogar.
"""
import random
import string
from datetime import datetime, timezone, timedelta
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.v1.dependencies.auth import CurrentUser, CurrentTenant, AdminRequired, DB
from app.core.security import hash_password
from app.db.models.models import InvitationCode, User, UserRoleEnum
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class CreateInvitationRequest(BaseModel):
    name: str
    role: UserRoleEnum = UserRoleEnum.MEMBER


class JoinRequest(BaseModel):
    code: str
    email: str
    password: str


class InvitationResponse(BaseModel):
    id: UUID
    code: str
    name: str
    role: str
    used: bool
    expires_at: datetime
    created_at: datetime


def generate_code() -> str:
    """Genera un código de 6 dígitos único."""
    return ''.join(random.choices(string.digits, k=6))


@router.post("/create", response_model=InvitationResponse, status_code=201)
async def create_invitation(
    data: CreateInvitationRequest,
    db: DB,
    admin: AdminRequired,
    current_tenant: CurrentTenant,
):
    """Admin crea un código de invitación para una persona."""
    # Verificar límite de usuarios según plan
    result = await db.execute(
        select(User).where(User.tenant_id == current_tenant.id)
    )
    current_count = len(result.scalars().all())

    from app.core.config import settings
    limits = {
        "free": settings.FREE_MAX_USERS,
        "pro": settings.PRO_MAX_USERS,
        "familia_plus": settings.FAMILIA_PLUS_MAX_USERS,
    }
    max_users = limits.get(current_tenant.plan.value.lower(), 2)
    if current_count >= max_users:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Tu plan permite máximo {max_users} miembros.",
        )

    # Generar código único
    for _ in range(10):
        code = generate_code()
        existing = await db.execute(
            select(InvitationCode)
            .where(InvitationCode.code == code)
            .where(InvitationCode.used == False)
        )
        if not existing.scalar_one_or_none():
            break

    invitation = InvitationCode(
        tenant_id=current_tenant.id,
        created_by_id=admin.id,
        code=code,
        name=data.name,
        role=data.role,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(invitation)
    await db.flush()

    return InvitationResponse(
        id=invitation.id,
        code=invitation.code,
        name=invitation.name,
        role=invitation.role.value,
        used=invitation.used,
        expires_at=invitation.expires_at,
        created_at=invitation.created_at,
    )


@router.get("/list", response_model=list[InvitationResponse])
async def list_invitations(db: DB, admin: AdminRequired, current_tenant: CurrentTenant):
    """Lista todos los códigos de invitación del hogar."""
    result = await db.execute(
        select(InvitationCode)
        .where(InvitationCode.tenant_id == current_tenant.id)
        .order_by(InvitationCode.created_at.desc())
    )
    invitations = result.scalars().all()
    return [
        InvitationResponse(
            id=i.id, code=i.code, name=i.name,
            role=i.role.value, used=i.used,
            expires_at=i.expires_at, created_at=i.created_at,
        )
        for i in invitations
    ]


@router.delete("/{invitation_id}", status_code=204)
async def delete_invitation(
    invitation_id: UUID,
    db: DB,
    admin: AdminRequired,
    current_tenant: CurrentTenant,
):
    """Elimina un código de invitación no usado."""
    result = await db.execute(
        select(InvitationCode)
        .where(InvitationCode.id == invitation_id)
        .where(InvitationCode.tenant_id == current_tenant.id)
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Código no encontrado.")
    if inv.used:
        raise HTTPException(status_code=400, detail="No puedes eliminar un código ya usado.")
    await db.delete(inv)


@router.post("/join", status_code=201)
async def join_with_code(data: JoinRequest, db: DB):
    """Una persona usa el código para unirse al hogar."""
    # Verificar código
    result = await db.execute(
        select(InvitationCode)
        .where(InvitationCode.code == data.code)
        .where(InvitationCode.used == False)
    )
    invitation = result.scalar_one_or_none()

    if not invitation:
        raise HTTPException(status_code=404, detail="Código inválido o ya fue usado.")

    if invitation.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="El código ha expirado.")

    # Verificar email único
    existing_user = await db.execute(
        select(User).where(User.email == data.email.lower())
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Ya existe una cuenta con ese correo.")

    # Crear usuario
    user = User(
        tenant_id=invitation.tenant_id,
        name=invitation.name,
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        role=invitation.role,
    )
    db.add(user)

    # Marcar código como usado
    invitation.used = True
    invitation.used_by_id = user.id

    await db.flush()

    return {"message": f"Bienvenido {invitation.name}! Ya puedes iniciar sesión."}