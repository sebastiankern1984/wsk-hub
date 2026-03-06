"""API endpoints for Hub fields, column mappings, and import templates."""
from __future__ import annotations

import csv
import io

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models.supplier import Supplier
from app.models.user import User
from app.schemas.column_mapping import (
    AutoDetectRequest,
    AutoDetectResult,
    ColumnMappingItem,
    ColumnMappingResponse,
    ColumnMappingSave,
    HubFieldInfo,
)
from app.services.hub_field_registry import HUB_FIELDS
from app.services.supplier_mapping_service import (
    auto_detect_mappings,
    get_mappings,
    save_mappings,
)
from app.services.template_service import generate_template_csv, generate_template_xlsx

router = APIRouter(tags=["column-mappings"])


# ── Hub Fields (all available target fields) ─────────────────────

@router.get("/hub-fields", response_model=list[HubFieldInfo])
async def list_hub_fields(
    _user: User = Depends(get_current_user),
):
    """Return all Hub fields for dropdown menus in the mapping UI."""
    return [
        HubFieldInfo(
            key=f.key,
            label=f.label,
            field_type=f.field_type,
            example=f.example,
            category=f.category,
        )
        for f in HUB_FIELDS
    ]


# ── Supplier Column Mappings ─────────────────────────────────────

@router.get(
    "/suppliers/{supplier_id}/column-mappings",
    response_model=list[ColumnMappingResponse],
)
async def get_supplier_mappings(
    supplier_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Get all column mappings for a supplier."""
    supplier = await db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(404, "Lieferant nicht gefunden")

    mappings = await get_mappings(db, supplier_id)
    return [
        ColumnMappingResponse(id=m.id, csv_column=m.csv_column, hub_field=m.hub_field)
        for m in mappings
    ]


@router.put(
    "/suppliers/{supplier_id}/column-mappings",
    response_model=list[ColumnMappingResponse],
)
async def save_supplier_mappings(
    supplier_id: int,
    body: ColumnMappingSave,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("manager")),
):
    """Replace all column mappings for a supplier (bulk save)."""
    supplier = await db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(404, "Lieferant nicht gefunden")

    mappings = await save_mappings(
        db,
        supplier_id,
        [{"csv_column": m.csv_column, "hub_field": m.hub_field} for m in body.mappings],
    )
    await db.commit()

    return [
        ColumnMappingResponse(id=m.id, csv_column=m.csv_column, hub_field=m.hub_field)
        for m in mappings
    ]


@router.post(
    "/suppliers/{supplier_id}/column-mappings/auto-detect",
    response_model=list[AutoDetectResult],
)
async def auto_detect_supplier_mappings(
    supplier_id: int,
    body: AutoDetectRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Auto-detect mappings from CSV/Excel headers."""
    supplier = await db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(404, "Lieferant nicht gefunden")

    results = auto_detect_mappings(body.headers)
    return [
        AutoDetectResult(
            csv_column=r["csv_column"],
            hub_field=r["hub_field"],
            confidence=r["confidence"],
        )
        for r in results
    ]


# ── Import Templates ─────────────────────────────────────────────

@router.get("/imports/supplier/template")
async def download_standard_template(
    format: str = Query("csv", regex="^(csv|xlsx)$"),
    _user: User = Depends(get_current_user),
):
    """Download standard import template (all Hub fields)."""
    if format == "xlsx":
        content = generate_template_xlsx()
        return Response(
            content=content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=import-vorlage.xlsx"},
        )
    else:
        content = generate_template_csv()
        return Response(
            content=content,
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": "attachment; filename=import-vorlage.csv"},
        )


@router.get("/suppliers/{supplier_id}/import-template")
async def download_supplier_template(
    supplier_id: int,
    format: str = Query("csv", regex="^(csv|xlsx)$"),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Download supplier-specific import template (only mapped fields)."""
    supplier = await db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(404, "Lieferant nicht gefunden")

    mappings_db = await get_mappings(db, supplier_id)

    if not mappings_db:
        raise HTTPException(
            400,
            "Kein Mapping konfiguriert. Bitte zuerst Spalten-Zuordnung einrichten oder Standard-Vorlage nutzen.",
        )

    mappings = [{"csv_column": m.csv_column, "hub_field": m.hub_field} for m in mappings_db]
    safe_name = supplier.name.lower().replace(" ", "-")

    if format == "xlsx":
        content = generate_template_xlsx(mappings)
        return Response(
            content=content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=vorlage-{safe_name}.xlsx"
            },
        )
    else:
        content = generate_template_csv(mappings)
        return Response(
            content=content,
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": f"attachment; filename=vorlage-{safe_name}.csv"
            },
        )
