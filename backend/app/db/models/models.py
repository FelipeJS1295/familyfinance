import uuid
from datetime import datetime, date
from enum import Enum as PyEnum

from sqlalchemy import (
    Boolean, Column, Date, DateTime, Enum, ForeignKey,
    Integer, Numeric, SmallInteger, String, Text, func
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.db.session import Base


class PlanEnum(str, PyEnum):
    FREE = "free"
    PRO = "pro"
    FAMILIA_PLUS = "familia_plus"


class UserRoleEnum(str, PyEnum):
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    MEMBER = "member"
    CHILD = "child"


class TransactionTypeEnum(str, PyEnum):
    INCOME = "income"
    EXPENSE = "expense"


class TransactionSourceEnum(str, PyEnum):
    MANUAL = "manual"
    CSV_IMPORT = "csv_import"
    OCR = "ocr"


class BankEnum(str, PyEnum):
    BANCO_ESTADO = "banco_estado"
    SANTANDER = "santander"
    BCI = "bci"
    SCOTIABANK = "scotiabank"
    ITAU = "itau"
    FALABELLA = "falabella"
    OTRO = "otro"


class NotificationTypeEnum(str, PyEnum):
    BUDGET_ALERT = "budget_alert"
    WEEKLY_SUMMARY = "weekly_summary"
    GOAL_REACHED = "goal_reached"


class NotificationChannelEnum(str, PyEnum):
    EMAIL = "email"
    WHATSAPP = "whatsapp"
    PUSH = "push"


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    slug = Column(String(60), unique=True, nullable=False, index=True)
    plan = Column(Enum(PlanEnum), default=PlanEnum.FREE, nullable=False)
    stripe_customer_id = Column(String(100), nullable=True)
    stripe_subscription_id = Column(String(100), nullable=True)
    plan_expires_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="tenant", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="tenant", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="tenant", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="tenant", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="tenant", cascade="all, delete-orphan")
    bank_imports = relationship("BankImport", back_populates="tenant", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(80), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRoleEnum), default=UserRoleEnum.MEMBER, nullable=False)
    avatar_color = Column(String(7), default="#6366f1")
    phone_whatsapp = Column(String(20), nullable=True)
    notify_weekly = Column(Boolean, default=True)
    notify_budget_alerts = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tenant = relationship("Tenant", back_populates="users")
    transactions = relationship("Transaction", back_populates="user")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(255), nullable=False, unique=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="refresh_tokens")


class Category(Base):
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(60), nullable=False)
    icon = Column(String(10), default="💰")
    color = Column(String(7), default="#6366f1")
    is_default = Column(Boolean, default=False)
    is_income = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category")
    budgets = relationship("Budget", back_populates="category")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    amount = Column(Numeric(12, 2), nullable=False)
    type = Column(Enum(TransactionTypeEnum), nullable=False)
    date = Column(Date, nullable=False, default=date.today, index=True)
    note = Column(Text, nullable=True)
    source = Column(Enum(TransactionSourceEnum), default=TransactionSourceEnum.MANUAL)
    is_recurring = Column(Boolean, default=False)
    recurrence_rule = Column(String(200), nullable=True)
    recurrence_parent_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id"), nullable=True)
    import_id = Column(UUID(as_uuid=True), ForeignKey("bank_imports.id"), nullable=True)
    import_hash = Column(String(64), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tenant = relationship("Tenant", back_populates="transactions")
    user = relationship("User", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    bank_import = relationship("BankImport", back_populates="transactions")


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False)
    monthly_limit = Column(Numeric(12, 2), nullable=False)
    month = Column(SmallInteger, nullable=False)
    year = Column(SmallInteger, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tenant = relationship("Tenant", back_populates="budgets")
    category = relationship("Category", back_populates="budgets")


class Goal(Base):
    __tablename__ = "goals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    target_amount = Column(Numeric(12, 2), nullable=False)
    deadline = Column(Date, nullable=True)
    icon = Column(String(10), default="🎯")
    color = Column(String(7), default="#10b981")
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tenant = relationship("Tenant", back_populates="goals")


class BankImport(Base):
    __tablename__ = "bank_imports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    bank = Column(Enum(BankEnum), nullable=False)
    filename = Column(String(255), nullable=False)
    rows_total = Column(Integer, default=0)
    rows_imported = Column(Integer, default=0)
    rows_duplicated = Column(Integer, default=0)
    rows_error = Column(Integer, default=0)
    imported_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant", back_populates="bank_imports")
    transactions = relationship("Transaction", back_populates="bank_import")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(Enum(NotificationTypeEnum), nullable=False)
    channel = Column(Enum(NotificationChannelEnum), nullable=False)
    payload = Column(JSONB, nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant", back_populates="notifications")

class InvitationCode(Base):
    __tablename__ = "invitation_codes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    code = Column(String(6), nullable=False, unique=True, index=True)
    name = Column(String(80), nullable=False)       # Nombre de la persona invitada
    role = Column(Enum(UserRoleEnum), default=UserRoleEnum.MEMBER)
    used = Column(Boolean, default=False)
    used_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant", foreign_keys=[tenant_id])
    created_by = relationship("User", foreign_keys=[created_by_id])