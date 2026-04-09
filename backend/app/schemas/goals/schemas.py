from datetime import date as date_type, datetime
from decimal import Decimal
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, field_validator


class GoalCreate(BaseModel):
    name: str
    description: Optional[str] = None
    target_amount: Decimal
    deadline: Optional[date_type] = None
    icon: str = "🎯"
    color: str = "#10b981"

    @field_validator("target_amount")
    @classmethod
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError("La meta debe ser mayor a cero.")
        return v


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    target_amount: Optional[Decimal] = None
    deadline: Optional[date_type] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_completed: Optional[bool] = None


class GoalResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    name: str
    description: Optional[str]
    target_amount: Decimal
    current_amount: float
    percentage: float
    deadline: Optional[date_type]
    days_left: Optional[int]
    icon: str
    color: str
    is_completed: bool
    completed_at: Optional[datetime]
    created_at: datetime