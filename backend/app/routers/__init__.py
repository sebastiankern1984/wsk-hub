from fastapi import APIRouter

from app.routers.auth import router as auth_router
from app.routers.products import router as products_router
from app.routers.suppliers import router as suppliers_router
from app.routers.events import router as events_router

api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router)
api_router.include_router(products_router)
api_router.include_router(suppliers_router)
api_router.include_router(events_router)
