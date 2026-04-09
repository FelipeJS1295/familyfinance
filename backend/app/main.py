"""
FamilyFinance — Punto de entrada principal
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1.routers.auth import router as auth_router
from app.api.v1.routers.transactions import router as transactions_router
from app.api.v1.routers.budgets import router as budgets_router
from app.api.v1.routers.goals import router as goals_router
from app.api.v1.routers.tenants import router as tenants_router
from app.api.v1.routers.notifications import router as notifications_router
from app.api.v1.routers.imports import router as imports_router
from app.core.config import settings
from app.core.limiter import limiter
from app.db.session import engine, Base
from app.workers.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    start_scheduler()
    yield
    stop_scheduler()
    await engine.dispose()


app = FastAPI(
    title="FamilyFinance API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"

app.include_router(auth_router,          prefix=f"{API_PREFIX}/auth",          tags=["auth"])
app.include_router(tenants_router,       prefix=f"{API_PREFIX}/tenants",       tags=["tenants"])
app.include_router(transactions_router,  prefix=f"{API_PREFIX}/transactions",  tags=["transactions"])
app.include_router(budgets_router,       prefix=f"{API_PREFIX}/budgets",       tags=["budgets"])
app.include_router(goals_router,         prefix=f"{API_PREFIX}/goals",         tags=["goals"])
app.include_router(notifications_router, prefix=f"{API_PREFIX}/notifications", tags=["notifications"])
app.include_router(imports_router,       prefix=f"{API_PREFIX}/imports",       tags=["imports"])


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "version": "1.0.0"}