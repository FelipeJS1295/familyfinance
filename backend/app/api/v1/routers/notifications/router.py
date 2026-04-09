from fastapi import APIRouter
from sqlalchemy import select
from app.api.v1.dependencies.auth import CurrentUser, CurrentTenant, DB
from app.db.models.models import Notification

router = APIRouter()


@router.get("")
async def list_notifications(db: DB, current_user: CurrentUser, current_tenant: CurrentTenant):
    result = await db.execute(
        select(Notification)
        .where(Notification.tenant_id == current_tenant.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    notifications = result.scalars().all()
    return [
        {
            "id": str(n.id),
            "type": n.type,
            "channel": n.channel,
            "sent_at": n.sent_at,
            "payload": n.payload,
        }
        for n in notifications
    ]