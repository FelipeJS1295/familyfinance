from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, field_validator


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    family_name: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres.")
        return v

    @field_validator("name", "family_name")
    @classmethod
    def not_empty(cls, v):
        if not v.strip():
            raise ValueError("Este campo no puede estar vacío.")
        return v.strip()


class UserResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    tenant_id: UUID
    name: str
    email: str
    role: str
    avatar_color: str
    notify_weekly: bool
    notify_budget_alerts: bool
    is_active: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse