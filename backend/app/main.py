from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import close_import_pool, init_db
from app.routers import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Seed default settings
    from app.database import async_session
    from app.services.settings_service import seed_defaults
    async with async_session() as db:
        await seed_defaults(db)
    yield
    await close_import_pool()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/api/health")
async def health():
    return {"ok": True, "version": settings.APP_VERSION, "name": settings.APP_NAME}
