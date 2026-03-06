"""API endpoints for import profiles (1:n profiles per supplier)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models.import_profile import ImportProfile
from app.models.import_profile_mapping import ImportProfileMapping
from app.models.supplier import Supplier
from app.models.user import User
from app.schemas.column_mapping import (
    AutoDetectResult,
    ColumnMappingResponse,
    HubFieldInfo,
    ImportProfileCreate,
    ImportProfileMappingResponse,
    ImportProfileMappingSave,
    ImportProfileResponse,
    ImportProfileUpdate,
)
from app.services.hub_field_registry import HUB_FIELD_MAP, HUB_FIELDS
from app.services.supplier_mapping_service import (
    auto_detect_mappings,
    extract_headers_from_file,
)

router = APIRouter(tags=["import-profiles"])


def _profile_to_response(profile: ImportProfile) -> ImportProfileResponse:
    return ImportProfileResponse(
        id=profile.id,
        supplier_id=profile.supplier_id,
        profile_code=profile.profile_code,
        profile_name=profile.profile_name,
        file_type=profile.file_type,
        description=profile.description,
        is_active=profile.is_active,
        mapping_count=len(profile.mappings) if profile.mappings else 0,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


# ── Profile CRUD ──

@router.get(
    "/suppliers/{supplier_id}/import-profiles",
    response_model=list[ImportProfileResponse],
)
async def list_profiles(
    supplier_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """List all import profiles for a supplier."""
    supplier = await db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(404, "Lieferant nicht gefunden")

    result = await db.execute(
        select(ImportProfile)
        .options(selectinload(ImportProfile.mappings))
        .where(ImportProfile.supplier_id == supplier_id)
        .order_by(ImportProfile.profile_name)
    )
    profiles = result.unique().scalars().all()
    return [_profile_to_response(p) for p in profiles]


@router.post(
    "/suppliers/{supplier_id}/import-profiles",
    response_model=ImportProfileResponse,
    status_code=201,
)
async def create_profile(
    supplier_id: int,
    body: ImportProfileCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("manager")),
):
    """Create a new import profile for a supplier."""
    supplier = await db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(404, "Lieferant nicht gefunden")

    # Check uniqueness of profile_code within supplier
    existing = await db.execute(
        select(ImportProfile).where(
            ImportProfile.supplier_id == supplier_id,
            ImportProfile.profile_code == body.profile_code,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            409, f"Profil-Code '{body.profile_code}' existiert bereits für diesen Lieferanten"
        )

    profile = ImportProfile(
        supplier_id=supplier_id,
        profile_code=body.profile_code,
        profile_name=body.profile_name,
        file_type=body.file_type,
        description=body.description,
        is_active=body.is_active,
    )
    db.add(profile)
    await db.flush()
    return _profile_to_response(profile)


@router.put(
    "/suppliers/{supplier_id}/import-profiles/{profile_id}",
    response_model=ImportProfileResponse,
)
async def update_profile(
    supplier_id: int,
    profile_id: int,
    body: ImportProfileUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("manager")),
):
    """Update an import profile."""
    result = await db.execute(
        select(ImportProfile)
        .options(selectinload(ImportProfile.mappings))
        .where(
            ImportProfile.id == profile_id,
            ImportProfile.supplier_id == supplier_id,
        )
    )
    profile = result.unique().scalar_one_or_none()
    if not profile:
        raise HTTPException(404, "Import-Profil nicht gefunden")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    return _profile_to_response(profile)


@router.delete(
    "/suppliers/{supplier_id}/import-profiles/{profile_id}",
    status_code=204,
)
async def delete_profile(
    supplier_id: int,
    profile_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("manager")),
):
    """Delete an import profile and all its mappings."""
    result = await db.execute(
        select(ImportProfile).where(
            ImportProfile.id == profile_id,
            ImportProfile.supplier_id == supplier_id,
        )
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(404, "Import-Profil nicht gefunden")

    await db.delete(profile)


# ── Profile Mappings ──

@router.get(
    "/suppliers/{supplier_id}/import-profiles/{profile_id}/mappings",
    response_model=list[ImportProfileMappingResponse],
)
async def get_profile_mappings(
    supplier_id: int,
    profile_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Get all column mappings for an import profile."""
    result = await db.execute(
        select(ImportProfile).where(
            ImportProfile.id == profile_id,
            ImportProfile.supplier_id == supplier_id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Import-Profil nicht gefunden")

    result = await db.execute(
        select(ImportProfileMapping)
        .where(ImportProfileMapping.profile_id == profile_id)
        .order_by(ImportProfileMapping.csv_column)
    )
    mappings = result.scalars().all()
    return [
        ImportProfileMappingResponse(
            id=m.id, csv_column=m.csv_column, hub_field=m.hub_field
        )
        for m in mappings
    ]


@router.put(
    "/suppliers/{supplier_id}/import-profiles/{profile_id}/mappings",
    response_model=list[ImportProfileMappingResponse],
)
async def save_profile_mappings(
    supplier_id: int,
    profile_id: int,
    body: ImportProfileMappingSave,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("manager")),
):
    """Replace all column mappings for an import profile (bulk save)."""
    result = await db.execute(
        select(ImportProfile).where(
            ImportProfile.id == profile_id,
            ImportProfile.supplier_id == supplier_id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Import-Profil nicht gefunden")

    # Delete existing mappings
    await db.execute(
        delete(ImportProfileMapping).where(
            ImportProfileMapping.profile_id == profile_id
        )
    )

    # Insert new
    new_mappings = []
    for m in body.mappings:
        csv_col = m.csv_column.strip()
        hub_field = m.hub_field.strip()
        if not csv_col or not hub_field:
            continue
        if hub_field not in HUB_FIELD_MAP:
            continue

        mapping = ImportProfileMapping(
            profile_id=profile_id,
            csv_column=csv_col.lower(),
            hub_field=hub_field,
        )
        db.add(mapping)
        new_mappings.append(mapping)

    await db.flush()
    return [
        ImportProfileMappingResponse(
            id=m.id, csv_column=m.csv_column, hub_field=m.hub_field
        )
        for m in new_mappings
    ]


@router.post(
    "/suppliers/{supplier_id}/import-profiles/{profile_id}/auto-detect-file",
    response_model=list[AutoDetectResult],
)
async def auto_detect_profile_from_file(
    supplier_id: int,
    profile_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Auto-detect mappings for a profile by uploading a CSV/Excel file."""
    result = await db.execute(
        select(ImportProfile).where(
            ImportProfile.id == profile_id,
            ImportProfile.supplier_id == supplier_id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Import-Profil nicht gefunden")

    if not file.filename:
        raise HTTPException(400, "Dateiname fehlt")

    content = await file.read()
    headers, first_row = extract_headers_from_file(content, file.filename)

    if not headers:
        raise HTTPException(400, "Keine Spaltenüberschriften in der Datei gefunden")

    example_map = {
        h: first_row[i] if i < len(first_row) else None
        for i, h in enumerate(headers)
    }

    results = auto_detect_mappings(headers)
    return [
        AutoDetectResult(
            csv_column=r["csv_column"],
            hub_field=r["hub_field"],
            confidence=r["confidence"],
            example_value=example_map.get(r["csv_column"]),
        )
        for r in results
    ]
