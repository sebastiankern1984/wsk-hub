from __future__ import annotations

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.settings_service import get_setting


class AlphaplanClient:
    """REST client for Alphaplan WebService API."""

    def __init__(self, base_url: str, username: str, password: str):
        self.base_url = base_url.rstrip("/")
        self.auth = httpx.BasicAuth(username, password)

    @classmethod
    async def from_settings(cls, db: AsyncSession) -> AlphaplanClient:
        url = await get_setting(db, "alphaplan_rest_url")
        user = await get_setting(db, "alphaplan_rest_user")
        password = await get_setting(db, "alphaplan_rest_password")
        if not url or not user:
            raise ValueError("Alphaplan ist nicht konfiguriert. Bitte URL und Benutzer in den Einstellungen setzen.")
        return cls(url, user, password or "")

    async def check_connection(self) -> dict:
        try:
            async with httpx.AsyncClient(auth=self.auth, timeout=10) as client:
                resp = await client.get(
                    f"{self.base_url}/AlphaplanWebService/Reader/Artikel/1/ArtikelNr"
                )
                if resp.status_code == 200:
                    return {"status": "ok", "message": "Verbindung erfolgreich"}
                return {
                    "status": "error",
                    "message": f"HTTP {resp.status_code}: {resp.text[:200]}",
                }
        except httpx.ConnectError:
            return {"status": "error", "message": f"Verbindung zu {self.base_url} fehlgeschlagen"}
        except httpx.TimeoutException:
            return {"status": "error", "message": "Timeout bei Verbindungsversuch"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def read_field(self, table: str, record_id: str, field: str) -> str | None:
        async with httpx.AsyncClient(auth=self.auth, timeout=15) as client:
            resp = await client.get(
                f"{self.base_url}/AlphaplanWebService/Reader/{table}/{record_id}/{field}"
            )
            if resp.status_code == 200:
                return resp.text
            return None

    async def read_bulk(self, table: str, fields: list[str], filters: dict | None = None) -> list[dict]:
        payload = {
            "TableName": table,
            "FieldPaths": fields,
        }
        if filters:
            payload["Filters"] = filters
        async with httpx.AsyncClient(auth=self.auth, timeout=30) as client:
            resp = await client.post(
                f"{self.base_url}/AlphaplanWebService/Reader",
                json=payload,
            )
            if resp.status_code == 200:
                return resp.json()
            return []

    async def read_etl(self, table: str, record_id: str) -> dict | None:
        async with httpx.AsyncClient(auth=self.auth, timeout=15) as client:
            resp = await client.get(
                f"{self.base_url}/AlphaplanWebService/ETL/{table}/{record_id}"
            )
            if resp.status_code == 200:
                return resp.json()
            return None

    async def get_stock(self, artikel_nr: str) -> dict | None:
        try:
            data = await self.read_bulk(
                "Lager",
                ["LagerID", "ArtikelNummer", "LagerOrt", "LagerPlatz", "Bestand", "MHD", "Charge"],
                {"ArtikelNummer": artikel_nr},
            )
            if data:
                return {
                    "artikel_nr": artikel_nr,
                    "locations": data,
                    "total_stock": sum(
                        float(item.get("Bestand", 0)) for item in data if item.get("Bestand")
                    ),
                }
            return {"artikel_nr": artikel_nr, "locations": [], "total_stock": 0}
        except Exception as e:
            return {"artikel_nr": artikel_nr, "error": str(e)}
