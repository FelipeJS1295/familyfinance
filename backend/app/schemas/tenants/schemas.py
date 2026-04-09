from datetime import datetime
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.db.models.models import UserRoleEnum, PlanEnum


class TenantResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: UUID
    name: str
    slug: str
    plan: PlanEnum
    is_active: bool
    created_at: datetime


class TenantUpdate(BaseModel):
    name: Optional[str] = None


class MemberResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: UUID
    name: str
    email: str
    role: UserRoleEnum
    avatar_color: str
    is_active: bool
    last_login_at: Optional[datetime]
    created_at: datetime


class InviteMemberRequest(BaseModel):
    name: str
    email: EmailStr
    temporary_password: str
    role: UserRoleEnum = UserRoleEnum.MEMBER


class UpdateMemberRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[UserRoleEnum] = None
    is_active: Optional[bool] = None
    avatar_color: Optional[str] = None
    phone_whatsapp: Optional[str] = None
    notify_weekly: Optional[bool] = None
    notify_budget_alerts: Optional[bool] = None