from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.setting import Setting

DEFAULT_SETTINGS = [
    {
        "key": "alphaplan_rest_url",
        "value": "",
        "description": "Alphaplan REST API Base-URL (z.B. http://10.55.88.22:8080)",
        "is_secret": False,
    },
    {
        "key": "alphaplan_rest_user",
        "value": "",
        "description": "Alphaplan REST API Benutzername",
        "is_secret": False,
    },
    {
        "key": "alphaplan_rest_password",
        "value": "",
        "description": "Alphaplan REST API Passwort",
        "is_secret": True,
    },
    {
        "key": "alphaplan_rest_enabled",
        "value": "false",
        "description": "Alphaplan REST API aktiviert (true/false)",
        "is_secret": False,
    },
]


async def get_setting(db: AsyncSession, key: str) -> str | None:
    result = await db.execute(select(Setting).where(Setting.key == key))
    setting = result.scalar_one_or_none()
    return setting.value if setting else None


async def set_setting(db: AsyncSession, key: str, value: str | None) -> Setting:
    result = await db.execute(select(Setting).where(Setting.key == key))
    setting = result.scalar_one_or_none()
    if setting:
        setting.value = value
    else:
        setting = Setting(key=key, value=value)
        db.add(setting)
    await db.flush()
    return setting


async def get_all_settings(db: AsyncSession) -> list[Setting]:
    result = await db.execute(select(Setting).order_by(Setting.key))
    return list(result.scalars().all())


async def seed_defaults(db: AsyncSession) -> None:
    for default in DEFAULT_SETTINGS:
        result = await db.execute(select(Setting).where(Setting.key == default["key"]))
        if not result.scalar_one_or_none():
            db.add(Setting(**default))
    await db.commit()
