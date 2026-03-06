from fastapi import APIRouter

from app.routers.auth import router as auth_router
from app.routers.products import router as products_router
from app.routers.suppliers import router as suppliers_router
from app.routers.events import router as events_router
from app.routers.manufacturers import router as manufacturers_router
from app.routers.settings import router as settings_router
from app.routers.imports import router as imports_router
from app.routers.abda import router as abda_router
from app.routers.alphaplan import router as alphaplan_router
from app.routers.column_mappings import router as column_mappings_router
from app.routers.discount_rules import router as discount_rules_router
from app.routers.discount_rules import recalculate_router
from app.routers.import_profiles import router as import_profiles_router

api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router)
api_router.include_router(products_router)
api_router.include_router(suppliers_router)
api_router.include_router(events_router)
api_router.include_router(manufacturers_router)
api_router.include_router(settings_router)
api_router.include_router(imports_router)
api_router.include_router(abda_router)
api_router.include_router(alphaplan_router)
api_router.include_router(column_mappings_router)
api_router.include_router(discount_rules_router)
api_router.include_router(recalculate_router)
api_router.include_router(import_profiles_router)
