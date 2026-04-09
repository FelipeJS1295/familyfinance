from decimal import Decimal
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, field_validator


class BudgetCreate(BaseModel):
    category_id: UUID
    monthly_limit: Decimal
    month: int
    year: int

    @field_validator("monthly_limit")
    @classmethod
    def limit_positive(cls, v):
        if v <= 0:
            raise ValueError("El límite debe ser mayor a cero.")
        return v


class BudgetUpdate(BaseModel):
    monthly_limit: Optional[Decimal] = None


class BudgetResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: UUID
    tenant_id: UUID
    category_id: UUID
    monthly_limit: Decimal
    month: int
    year: int


class BudgetWithProgressResponse(BudgetResponse):
    category_name: str
    category_icon: str
    category_color: str
    spent: float
    percentage: float
    status: str