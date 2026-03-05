from pydantic import BaseModel


class ManufacturerCreate(BaseModel):
    name: str
    country: str | None = None


class ManufacturerResponse(BaseModel):
    id: int
    name: str
    country: str | None
    created_at: str

    model_config = {"from_attributes": True}
