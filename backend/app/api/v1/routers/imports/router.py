from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status
from sqlalchemy import select
from app.api.v1.dependencies.auth import CurrentUser, CurrentTenant, DB
from app.db.models.models import BankImport, BankEnum

router = APIRouter()


@router.get("/history")
async def import_history(db: DB, current_user: CurrentUser, current_tenant: CurrentTenant):
    result = await db.execute(
        select(BankImport)
        .where(BankImport.tenant_id == current_tenant.id)
        .order_by(BankImport.imported_at.desc())
        .limit(20)
    )
    imports = result.scalars().all()
    return [
        {
            "id": str(i.id),
            "bank": i.bank,
            "filename": i.filename,
            "rows_imported": i.rows_imported,
            "rows_duplicated": i.rows_duplicated,
            "imported_at": i.imported_at,
        }
        for i in imports
    ]


@router.post("/upload", status_code=201)
async def upload_bank_csv(
    db: DB,
    current_user: CurrentUser,
    current_tenant: CurrentTenant,
    file: UploadFile = File(...),
    bank: BankEnum = Form(...),
):
    return {"message": "Importación recibida", "filename": file.filename, "bank": bank}