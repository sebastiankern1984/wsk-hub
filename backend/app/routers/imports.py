import os
import tempfile

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models.abda import AbdaImportLog
from app.models.import_log import ImportLog
from app.models.user import User
from app.schemas.abda import AbdaImportLogResponse
from app.services.abda_import_service import import_abda_excel
from app.services.supplier_import_service import import_supplier_csv

router = APIRouter(prefix="/imports", tags=["imports"])


# ── ABDA Import ──────────────────────────────────────────────────

def _to_response(log: AbdaImportLog) -> dict:
    return {
        "id": log.id,
        "file_name": log.file_name,
        "file_type": log.file_type,
        "file_date": log.file_date,
        "record_count_total": log.record_count_total,
        "record_count_insert": log.record_count_insert,
        "record_count_update": log.record_count_update,
        "status": log.status,
        "error_message": log.error_message,
        "started_at": log.started_at.isoformat() if log.started_at else None,
        "completed_at": log.completed_at.isoformat() if log.completed_at else None,
        "created_at": log.created_at.isoformat() if log.created_at else None,
    }


async def _run_abda_import(import_log_id: int, file_path: str):
    """Background task wrapper for ABDA import."""
    from app.database import async_session

    async with async_session() as db:
        try:
            await import_abda_excel(db, import_log_id, file_path)
        finally:
            try:
                os.unlink(file_path)
            except OSError:
                pass


@router.post("/abda", response_model=AbdaImportLogResponse, status_code=202)
async def upload_abda_excel(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("manager")),
):
    if not file.filename or not (file.filename.endswith(".xlsx") or file.filename.endswith(".xls")):
        raise HTTPException(400, "Nur Excel-Dateien (.xlsx, .xls) erlaubt")

    suffix = ".xlsx" if file.filename.endswith(".xlsx") else ".xls"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    log = AbdaImportLog(
        file_name=file.filename,
        file_type="excel",
        status="pending",
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)

    background_tasks.add_task(_run_abda_import, log.id, tmp_path)

    return _to_response(log)


@router.get("/abda", response_model=list[AbdaImportLogResponse])
async def list_abda_imports(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AbdaImportLog).order_by(AbdaImportLog.created_at.desc()).limit(50)
    )
    return [_to_response(log) for log in result.scalars().all()]


@router.get("/abda/{import_id}", response_model=AbdaImportLogResponse)
async def get_abda_import(
    import_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    log = await db.get(AbdaImportLog, import_id)
    if not log:
        raise HTTPException(404, "Import nicht gefunden")
    return _to_response(log)


# ── Supplier CSV Import ──────────────────────────────────────────

def _supplier_import_to_response(log: ImportLog) -> dict:
    return {
        "id": log.id,
        "filename": log.filename,
        "supplier_id": log.supplier_id,
        "supplier_name": log.supplier.name if log.supplier else None,
        "status": log.status,
        "total_rows": log.total_rows,
        "processed_rows": log.processed_rows,
        "imported_rows": log.imported_rows,
        "skipped_rows": log.skipped_rows,
        "error_message": log.error_message,
        "started_at": log.started_at.isoformat() if log.started_at else None,
        "completed_at": log.completed_at.isoformat() if log.completed_at else None,
        "created_at": log.created_at.isoformat(),
    }


async def _run_supplier_import(import_log_id: int, file_content: bytes, user_id: str | None):
    """Background task wrapper for supplier CSV import."""
    from app.database import async_session

    async with async_session() as db:
        await import_supplier_csv(db, import_log_id, file_content, user_id=user_id)


@router.post("/supplier", status_code=202)
async def upload_supplier_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("manager")),
):
    """Upload a supplier CSV file for import."""
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Nur CSV-Dateien erlaubt")

    content = await file.read()

    # Create import log
    log = ImportLog(
        filename=file.filename,
        status="pending",
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)

    background_tasks.add_task(
        _run_supplier_import, log.id, content, user.username
    )

    return _supplier_import_to_response(log)


@router.get("/supplier")
async def list_supplier_imports(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ImportLog)
        .options(selectinload(ImportLog.supplier))
        .order_by(ImportLog.created_at.desc())
        .limit(50)
    )
    return [_supplier_import_to_response(log) for log in result.scalars().all()]


@router.get("/supplier/{import_id}")
async def get_supplier_import(
    import_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ImportLog)
        .options(selectinload(ImportLog.supplier))
        .where(ImportLog.id == import_id)
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(404, "Import nicht gefunden")
    return _supplier_import_to_response(log)
