"""Central registry of all mappable Hub fields.

Used for:
  - Dropdown options in the mapping UI
  - CSV/Excel template generation
  - Validation of column mappings
  - Standard column map (label.lower() -> key)

Categories (UI grouping):
  identifikation, artikeldaten, preis, masse, logistik, sonstiges

Field classes (semantic, for future conflict rules / required-field logic):
  identity       — PZN, EAN, NAN, Supplier SKU
  core_product   — Name, Hersteller, Warengruppe, Mengen
  packaging      — VE, Palette, Maße, Gewichte
  pricing        — EK, UVP, MwSt, Gültigkeit, Staffeln
  regulatory     — Gefahrgut, Zoll, Jugendschutz, MHD
  supplier_meta  — Bezugsweg, KS, Eigenmarke, etc.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class HubField:
    key: str           # Internal key (e.g. "pzn", "ek_preis")
    label: str         # German display label (also used as standard CSV header)
    field_type: str    # "str", "price", "int", "float", "date", "bool", "dimension", "weight"
    example: str       # Example value for template
    category: str      # UI group: "identifikation", "artikeldaten", "preis", "masse", "logistik", "sonstiges"
    field_class: str = "supplier_meta"  # Semantic class for conflict/required logic


HUB_FIELDS: list[HubField] = [
    # ── Identifikation ──
    HubField("pzn", "PZN", "str", "01234567", "identifikation", "identity"),
    HubField("nan", "NAN", "str", "12345678", "identifikation", "identity"),
    HubField("gtin_stueck", "GTIN Stueck", "str", "4012345678901", "identifikation", "identity"),
    HubField("gtin_karton", "GTIN Karton", "str", "4012345678918", "identifikation", "identity"),
    HubField("supplier_sku", "Lieferanten-Artikelnr", "str", "ABC-123", "identifikation", "identity"),

    # ── Artikeldaten ──
    HubField("name", "Artikelbezeichnung 1", "str", "Aspirin Plus C 20 Brausetabletten", "artikeldaten", "core_product"),
    HubField("name_short", "Artikelbezeichnung 2", "str", "Aspirin Plus C 20 BTA", "artikeldaten", "core_product"),
    HubField("lieferantenname", "Lieferantenname", "str", "Muster GmbH", "artikeldaten", "core_product"),
    HubField("warengruppe", "Warengruppe", "str", "Schmerzmittel", "artikeldaten", "core_product"),
    HubField("warengruppen_nr", "Warengruppen Nr", "str", "0815", "artikeldaten", "core_product"),
    HubField("mengentext", "Mengentext", "str", "20 ST", "artikeldaten", "core_product"),
    HubField("verpackungsinhalt", "Verpackungsinhalt", "float", "20", "artikeldaten", "core_product"),
    HubField("verpackungseinheit", "Verpackungseinheit", "str", "ST", "artikeldaten", "core_product"),
    HubField("einheit", "Einheit VE", "int", "10", "artikeldaten", "core_product"),
    # Bünting/Budni
    HubField("sortiment", "Sortiment", "str", "Drogerie", "artikeldaten", "core_product"),
    HubField("kategorie_langtext", "Kategorie (Langtext)", "str", "Haarpflege > Shampoo", "artikeldaten", "core_product"),
    # Zentrada/Osma
    HubField("obergruppe", "Obergruppe", "str", "Gesundheit", "artikeldaten", "core_product"),
    HubField("untergruppe", "Untergruppe", "str", "Nahrungsergänzung", "artikeldaten", "core_product"),
    HubField("lieferland", "Lieferland", "str", "DE", "artikeldaten", "core_product"),

    # ── Preise ──
    HubField("ek_preis", "EK-Preis", "price", "12,50", "preis", "pricing"),
    HubField("uvp", "UVP", "price", "19,95", "preis", "pricing"),
    HubField("mwst", "MwSt-Kennzeichen", "str", "vol", "preis", "pricing"),
    HubField("ust_satz", "USt-Satz (%)", "float", "19.0", "preis", "pricing"),
    HubField("gueltig_ab", "Gueltig ab", "date", "01.01.2025", "preis", "pricing"),
    HubField("gueltig_bis", "Gueltig bis", "date", "31.12.2025", "preis", "pricing"),

    # ── Maße & Gewicht ──
    HubField("stueck_breite", "Stueck Breite", "dimension", "50", "masse", "packaging"),
    HubField("stueck_breite_einheit", "Stueck Breite Einheit", "str", "mm", "masse", "packaging"),
    HubField("stueck_hoehe", "Stueck Hoehe", "dimension", "30", "masse", "packaging"),
    HubField("stueck_hoehe_einheit", "Stueck Hoehe Einheit", "str", "mm", "masse", "packaging"),
    HubField("stueck_tiefe", "Stueck Tiefe", "dimension", "100", "masse", "packaging"),
    HubField("stueck_tiefe_einheit", "Stueck Tiefe Einheit", "str", "mm", "masse", "packaging"),
    HubField("ve_breite", "VE Breite", "dimension", "200", "masse", "packaging"),
    HubField("ve_breite_einheit", "VE Breite Einheit", "str", "mm", "masse", "packaging"),
    HubField("ve_hoehe", "VE Hoehe", "dimension", "150", "masse", "packaging"),
    HubField("ve_hoehe_einheit", "VE Hoehe Einheit", "str", "mm", "masse", "packaging"),
    HubField("ve_tiefe", "VE Tiefe", "dimension", "300", "masse", "packaging"),
    HubField("ve_tiefe_einheit", "VE Tiefe Einheit", "str", "mm", "masse", "packaging"),
    HubField("stueck_gewicht", "Stueck Gewicht", "weight", "150", "masse", "packaging"),
    HubField("stueck_gewicht_einheit", "Stueck Gewicht Einheit", "str", "g", "masse", "packaging"),
    HubField("ve_gewicht", "VE Gewicht", "weight", "1500", "masse", "packaging"),
    HubField("ve_gewicht_einheit", "VE Gewicht Einheit", "str", "g", "masse", "packaging"),
    HubField("netto_gewicht_kg", "Netto-Gewicht kg", "weight", "1,5", "masse", "packaging"),

    # ── Logistik ──
    HubField("palettenfaktor", "Palettenfaktor", "int", "120", "logistik", "packaging"),
    HubField("bestellfaktor", "Bestellfaktor", "int", "6", "logistik", "packaging"),
    HubField("gefahrengut", "Gefahrengut", "bool", "nein", "logistik", "regulatory"),
    HubField("restlaufzeit", "Restlaufzeit Tage", "int", "365", "logistik", "regulatory"),
    HubField("zolltarifnummer", "Zolltarifnummer", "str", "30049000", "logistik", "regulatory"),
    # Bünting
    HubField("listung", "Listung", "str", "aktiv", "logistik", "supplier_meta"),
    # Budni
    HubField("warenverfuegbarkeit", "Warenverfügbarkeit", "str", "lieferbar", "logistik", "supplier_meta"),

    # ── Sonstiges ──
    HubField("bezugsweg", "Bezugsweg", "str", "DI", "sonstiges", "supplier_meta"),
    HubField("lieferanten_wawi", "Lieferanten WaWi", "str", "SAP", "sonstiges", "supplier_meta"),
    HubField("lieferant_rzf_nr", "Lieferant RZF-Nr", "str", "12345", "sonstiges", "supplier_meta"),
    HubField("ks", "KS", "str", "1", "sonstiges", "supplier_meta"),
    HubField("mengencode", "Mengencode", "str", "ST", "sonstiges", "supplier_meta"),
    HubField("eigenmarke", "Eigenmarke", "str", "nein", "sonstiges", "supplier_meta"),
    HubField("displaykennzeichen", "Displaykennzeichen", "str", "N", "sonstiges", "supplier_meta"),
    HubField("jugendschutz", "Jugendschutz", "str", "nein", "sonstiges", "regulatory"),
    HubField("altersgrenze", "Altersgrenze", "str", "0", "sonstiges", "regulatory"),
    HubField("eurelec", "Eurelec", "str", "", "sonstiges", "supplier_meta"),
    HubField("ean_ve_typ", "EAN VE Typ", "str", "ITF14", "sonstiges", "identity"),
    HubField("pfand", "Pfand", "str", "0", "sonstiges", "pricing"),
    HubField("bemerkung", "Bemerkung", "str", "", "sonstiges", "supplier_meta"),
    HubField("staffel_1", "Staffel 1", "str", "10/5%", "sonstiges", "pricing"),
    HubField("staffel_2", "Staffel 2", "str", "20/8%", "sonstiges", "pricing"),
    HubField("staffel_3", "Staffel 3", "str", "50/10%", "sonstiges", "pricing"),
    HubField("staffel_4", "Staffel 4", "str", "", "sonstiges", "pricing"),
    HubField("staffel_5", "Staffel 5", "str", "", "sonstiges", "pricing"),
    HubField("staffel_6", "Staffel 6", "str", "", "sonstiges", "pricing"),
    HubField("staffel_7", "Staffel 7", "str", "", "sonstiges", "pricing"),
    HubField("staffel_8", "Staffel 8", "str", "", "sonstiges", "pricing"),
    HubField("staffel_9", "Staffel 9", "str", "", "sonstiges", "pricing"),
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
