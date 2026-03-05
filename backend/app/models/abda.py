from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class AbdaPacApo(Base):
    """ABDA PAC_APO raw data. All fields stored as TEXT to preserve leading zeros."""
    __tablename__ = "abda_pac_apo"

    pzn: Mapped[str] = mapped_column(String(20), primary_key=True)

    # 17 curated fields (from excel_export.py)
    gtin: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # EAN
    apo_ek: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    langname: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Name
    hersteller_name: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # joined from adr_apo
    packungsgroesse: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    normgroesse: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    breite: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hoehe: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    laenge: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    gewicht: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    arzneimittel: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    mwst: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    apopflicht: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    verkehrsstatus: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    vertriebsstatus: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    gdat_preise: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # 132 extra raw fields (from EXTRA_RAW_FIELDS in excel_export.py)
    apo_vk: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    artikelnr: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ampreisv_amg: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    btm: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    droge_chemikalie: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    eichung: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    feuchteempf: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    apu: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    import_reimport: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    krankenhaus_ek: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    kuehlkette: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    kurzname: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    lageempf: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    lagertemperatur_max: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    lagertemperatur_min: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    laufzeit_eichung: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    laufzeit_verfall: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    lichtempf: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    medizinprodukt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    negativliste: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    key_adr_anbieter: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    key_dar: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    key_fes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    key_war: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sortierbegriff: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tierarzneimittel: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tfg: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    verfalldatum: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    verpackungsart: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rezeptpflicht: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    vw_apo: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    vw_grosshandel: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    vw_krankenhausapo: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    vw_sonsteinzelhandel: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pzn_nachfolger: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pzn_original: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bruchgefahr: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    artikeltyp: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    mindestbestellmenge: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    key_adr_hersteller: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    langname_ungekuerzt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pangv: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    key_aus: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rab_apo: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rabwert_anbieter: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ampreisv_sgb: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hm_zum_verbrauch: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bedingte_erstatt_fam: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    zuzfrei_31sgb_tstr: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    lifestyle: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ausnahme_51amg: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rabwert_generikum: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rabwert_preismora: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sdb_erforderlich: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    zuzfrei_31sgb_feb: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    diaetetikum: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    lebensmittel: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    nem: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    generikum: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    biotech_fam: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    mitteilung_47_1camg: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    biozid: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pflanzenschutzmittel: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    festbetrag: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    festbetragsstufe: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rabwert_130a_2_sgb: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    t_rezept: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ausnahme_52b_2_amg: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    apbetro_15_1: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    apbetro_15_2: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    eu_bio_logo: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    kosmetikum_eg_vo: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    uvp: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    steril: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ausnahme_ersetzung: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    wirkstoff_eg_rl: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    elektrostoffv: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    importgruppennr: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    apu_78_3a_1_amg: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    am_mit_erstatt_130b: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ppu: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    apo_ek_ppu: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    apo_vk_ppu: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    diff_ppu_apu_78_3a_1: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bopstnr: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    biotech_am: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    explosivgrundstoff: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    veribeginn_pflicht: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    regnr_stiftung_ear: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    verbandmittel: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    medizinprodukt_amrl: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cmr_stoff: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    unnr: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    abloesung_130a_1_8: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    securpharm_pilot: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hochladedatum: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ivd_klasse: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    mp_klasse: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ntin: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ppn: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    mv_gruppe: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    udidi_mdr: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    wundbehand_31_1a_sgb: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    khaep_ppu: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    atmp: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    novel_food: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    key_adr_zulassung: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    key_adr_vertreter: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    orphan_drug: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bedingte_zulassung: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    zulassung_ausnahme: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    amnog: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    biosimilargruppe: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ref_biosimilar: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    preisstrukturmodell: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    stiftung_ear: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    batt_regnr: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    am_mit_altersg_dafo: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    am_mit_aufg_festb: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    am_bfarm_versorgung: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    am_bfarm_kinder: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    gdat_apu_78_3a_1: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    gdat_abloesung_130a: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    gdat_vertriebsinfo: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    medcang: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    lagertemperatur: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bestimmung_130b_1c: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    gdat_apu78_3a_130b1c: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    zuz_130b1c_61_1: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    eudr: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hs_code: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # System
    _updated_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)

    __table_args__ = (
        Index("ix_abda_pac_apo_gtin", "gtin"),
        Index("ix_abda_pac_apo_langname", "langname"),
        Index("ix_abda_pac_apo_key_adr_hersteller", "key_adr_hersteller"),
    )


class AbdaAdrApo(Base):
    """ABDA ADR_APO — Addresses/companies."""
    __tablename__ = "abda_adr_apo"

    key_adr: Mapped[str] = mapped_column(String(20), primary_key=True)
    firmenname: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    strasse: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    plz: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ort: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    land: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    telefon: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    email: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    webseite: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ik_nummer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    _updated_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)


class AbdaPgr2Apo(Base):
    """ABDA PGR2_APO — Pack sizes (multiple entries per PZN)."""
    __tablename__ = "abda_pgr2_apo"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    pzn: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    zaehler: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    einheit: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    komponentennr: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    typ: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    zahl: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    _updated_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)


class AbdaPgrApo(Base):
    """ABDA PGR_APO — Norm size classifications."""
    __tablename__ = "abda_pgr_apo"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    pzn: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    einstufung: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    _updated_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)


class AbdaImportLog(Base):
    """ABDA import history."""
    __tablename__ = "abda_import_log"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    file_name: Mapped[str] = mapped_column(String(500), nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False, default="excel")
    file_date: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    record_count_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    record_count_insert: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    record_count_update: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class AbdaPriceHistory(Base):
    """ABDA price change tracking."""
    __tablename__ = "abda_price_history"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    pzn: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    old_apo_ek: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    new_apo_ek: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    old_gdat_preise: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    new_gdat_preise: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    change_source: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    changed_at: Mapped[datetime] = mapped_column(server_default=func.now())
