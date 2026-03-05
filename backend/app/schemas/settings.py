from pydantic import BaseModel


class SettingResponse(BaseModel):
    key: str
    value: str | None
    description: str | None
    is_secret: bool
    updated_at: str

    model_config = {"from_attributes": True}


class SettingUpdate(BaseModel):
    value: str | None = None
