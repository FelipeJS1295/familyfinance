from datetime import date as date_type, datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, field_validator
from app.db.models.models import TransactionTypeEnum, TransactionSourceEnum
from typing import Optional


class CategoryMinimal(BaseModel):
    model_config = {"from_attributes": True}
    id: UUID
    name: str
    icon: str
    color: str


class UserMinimal(BaseModel):
    model_config = {"from_attributes": True}
    id: UUID
    name: str
    avatar_color: str


class GoalMinimal(BaseModel):
    model_config = {"from_attributes": True}
    id: UUID
    name: str
    icon: str
    color: str


class TransactionCreate(BaseModel):
    amount: Decimal
    type: TransactionTypeEnum
    date: date_type
    category_id: Optional[UUID] = None
    goal_id: Optional[UUID] = None
    note: Optional[str] = None
    is_recurring: bool = False
    recurrence_rule: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError("El monto debe ser mayor a cero.")
        return v


class TransactionUpdate(BaseModel):
    amount: Optional[Decimal] = None
    type: Optional[TransactionTypeEnum] = None
    date: Optional[date_type] = None
    category_id: Optional[UUID] = None
    goal_id: Optional[UUID] = None
    note: Optional[str] = None
    is_recurring: Optional[bool] = None
    recurrence_rule: Optional[str] = None


class TransactionResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: UUID
    tenant_id: UUID
    user_id: UUID
    amount: Decimal
    type: TransactionTypeEnum
    date: date_type
    note: Optional[str]
    source: TransactionSourceEnum
    is_recurring: bool
    recurrence_rule: Optional[str]
    category: Optional[CategoryMinimal]
    goal: Optional[GoalMinimal]
    user: Optional[UserMinimal]
    created_at: datetime


class TransactionListResponse(BaseModel):
    items: list[TransactionResponse]
    total: int
    page: int
    page_size: int
    total_income: float
    total_expense: float
    balance: float