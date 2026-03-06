"""Central registry of all mappable Hub fields.

Used for:
  - Dropdown options in the mapping UI
  - CSV/Excel template generation
  - Validation of column mappings
  - Standard column map (label.lower() -> key)
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class HubField:
    key: str           # Internal key (e.g. "pzn", "ek_preis")
    label: str         # German display label (also used as standard CSV header)
    field_type: str    # "str", "price", "int", "float", "date", "bool", "dimension", "weight"
    example: str       # Example value for template
    category: str      # "identifikation", "artikeldaten", "preis", "masse", "logistik", "sonstiges"


HUB_FIELDS: list[HubField] = [
    # ── Identifikation ──
    HubField("pzn", "PZN", "str", "01234567", "identifikation"),
    HubField("nan", "NAN", "str", "12345678", "identifikation"),
    HubField("gtin_stueck", "GTIN Stueck", "str", "4012345678901", "identifikation"),
    HubField("gtin_karton", "GTIN Karton", "str", "4012345678918", "identifikation"),
    HubField("supplier_sku", "Lieferanten-Artikelnr", "str", "ABC-123", "identifikation"),

    # ── Artikeldaten ──
    HubField("name", "Artikelbezeichnung 1", "str", "Aspirin Plus C 20 Brausetabletten", "artikeldaten"),
    HubField("name_short", "Artikelbezeichnung 2", "str", "Aspirin Plus C 20 BTA", "artikeldaten"),
    HubField("lieferantenname", "Lieferantenname", "str", "Muster GmbH", "artikeldaten"),
    HubField("warengruppe", "Warengruppe", "str", "Schmerzmittel", "artikeldaten"),
    HubField("warengruppen_nr", "Warengruppen Nr", "str", "0815", "artikeldaten"),
    HubField("mengentext", "Mengentext", "str", "20 ST", "artikeldaten"),
    HubField("verpackungsinhalt", "Verpackungsinhalt", "float", "20", "artikeldaten"),
    HubField("verpackungseinheit", "Verpackungseinheit", "str", "ST", "artikeldaten"),
    HubField("einheit", "Einheit VE", "int", "10", "artikeldaten"),

    # ── Preise ──
    HubField("ek_preis", "EK-Preis", "price", "12,50", "preis"),
    HubField("uvp", "UVP", "price", "19,95", "preis"),
    HubField("mwst", "MwSt-Kennzeichen", "str", "vol", "preis"),
    HubField("gueltig_ab", "Gueltig ab", "date", "01.01.2025", "preis"),
    HubField("gueltig_bis", "Gueltig bis", "date", "31.12.2025", "preis"),

    # ── Masse & Gewicht ──
    HubField("stueck_breite", "Stueck Breite", "dimension", "50", "masse"),
    HubField("stueck_breite_einheit", "Stueck Breite Einheit", "str", "mm", "masse"),
    HubField("stueck_hoehe", "Stueck Hoehe", "dimension", "30", "masse"),
    HubField("stueck_hoehe_einheit", "Stueck Hoehe Einheit", "str", "mm", "masse"),
    HubField("stueck_tiefe", "Stueck Tiefe", "dimension", "100", "masse"),
    HubField("stueck_tiefe_einheit", "Stueck Tiefe Einheit", "str", "mm", "masse"),
    HubField("ve_breite", "VE Breite", "dimension", "200", "masse"),
    HubField("ve_breite_einheit", "VE Breite Einheit", "str", "mm", "masse"),
    HubField("ve_hoehe", "VE Hoehe", "dimension", "150", "masse"),
    HubField("ve_hoehe_einheit", "VE Hoehe Einheit", "str", "mm", "masse"),
    HubField("ve_tiefe", "VE Tiefe", "dimension", "300", "masse"),
    HubField("ve_tiefe_einheit", "VE Tiefe Einheit", "str", "mm", "masse"),
    HubField("stueck_gewicht", "Stueck Gewicht", "weight", "150", "masse"),
    HubField("stueck_gewicht_einheit", "Stueck Gewicht Einheit", "str", "g", "masse"),
    HubField("ve_gewicht", "VE Gewicht", "weight", "1500", "masse"),
    HubField("ve_gewicht_einheit", "VE Gewicht Einheit", "str", "g", "masse"),
    HubField("netto_gewicht_kg", "Netto-Gewicht kg", "weight", "1,5", "masse"),

    # ── Logistik ──
    HubField("palettenfaktor", "Palettenfaktor", "int", "120", "logistik"),
    HubField("gefahrengut", "Gefahrengut", "bool", "nein", "logistik"),
    HubField("restlaufzeit", "Restlaufzeit Tage", "int", "365", "logistik"),
    HubField("zolltarifnummer", "Zolltarifnummer", "str", "30049000", "logistik"),

    # ── Sonstiges ──
    HubField("bezugsweg", "Bezugsweg", "str", "DI", "sonstiges"),
    HubField("lieferanten_wawi", "Lieferanten WaWi", "str", "SAP", "sonstiges"),
    HubField("lieferant_rzf_nr", "Lieferant RZF-Nr", "str", "12345", "sonstiges"),
    HubField("ks", "KS", "str", "1", "sonstiges"),
    HubField("mengencode", "Mengencode", "str", "ST", "sonstiges"),
    HubField("eigenmarke", "Eigenmarke", "str", "nein", "sonstiges"),
    HubField("displaykennzeichen", "Displaykennzeichen", "str", "N", "sonstiges"),
    HubField("jugendschutz", "Jugendschutz", "str", "nein", "sonstiges"),
    HubField("altersgrenze", "Altersgrenze", "str", "0", "sonstiges"),
    HubField("eurelec", "Eurelec", "str", "", "sonstiges"),
    HubField("ean_ve_typ", "EAN VE Typ", "str", "ITF14", "sonstiges"),
    HubField("pfand", "Pfand", "str", "0", "sonstiges"),
    HubField("bemerkung", "Bemerkung", "str", "", "sonstiges"),
    HubField("staffel_1", "Staffel 1", "str", "10/5%", "sonstiges"),
    HubField("staffel_2", "Staffel 2", "str", "20/8%", "sonstiges"),
    HubField("staffel_3", "Staffel 3", "str", "50/10%", "sonstiges"),
    HubField("staffel_4", "Staffel 4", "str", "", "sonstiges"),
    HubField("staffel_5", "Staffel 5", "str", "", "sonstiges"),
    HubField("staffel_6", "Staffel 6", "str", "", "sonstiges"),
    HubField("staffel_7", "Staffel 7", "str", "", "sonstiges"),
    HubField("staffel_8", "Staffel 8", "str", "", "sonstiges"),
    HubField("staffel_9", "Staffel 9", "str", "", "sonstiges"),
]

# Lookup by key
HUB_FIELD_MAP: dict[str, HubField] = {f.key: f for f in HUB_FIELDS}

# Standard column map: label (lowercase) -> key
# Used when a supplier has no custom mapping configured
STANDARD_COLUMN_MAP: dict[str, str] = {f.label.lower(): f.key for f in HUB_FIELDS}


def get_hub_field_keys() -> list[str]:
    return [f.key for f in HUB_FIELDS]


def is_valid_hub_field(key: str) -> bool:
    return key in HUB_FIELD_MAP
