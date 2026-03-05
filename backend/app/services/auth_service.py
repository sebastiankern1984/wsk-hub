from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

import jwt
import ldap3

from app.config import settings

logger = logging.getLogger(__name__)


def authenticate_ldap(username: str, password: str) -> dict | None:
    """
    Bind to AD with UPN format (user@domain), then search for display name.
    Returns {"username": str, "display_name": str} on success, None on failure.
    """
    server = ldap3.Server(settings.LDAP_URL, get_info=ldap3.NONE)
    bind_dn = f"{username}@{settings.LDAP_DOMAIN}"

    try:
        conn = ldap3.Connection(server, user=bind_dn, password=password, auto_bind=True)

        display_name = username
        try:
            base_dn = ",".join(f"DC={part}" for part in settings.LDAP_DOMAIN.split("."))
            conn.search(
                base_dn,
                f"(sAMAccountName={ldap3.utils.conv.escape_filter_chars(username)})",
                attributes=["displayName", "sAMAccountName", "mail"],
            )
            if conn.entries:
                dn = str(conn.entries[0].displayName) if conn.entries[0].displayName else username
                display_name = dn
        except Exception:
            pass

        conn.unbind()
        logger.info(f"LDAP login successful: {username} ({display_name})")
        return {"username": username.lower(), "display_name": display_name}
    except ldap3.core.exceptions.LDAPBindError:
        logger.warning(f"LDAP login failed for {username}: invalid credentials")
        return None
    except Exception as e:
        logger.error(f"LDAP error for {username}: {e}")
        return None


def create_jwt(username: str, role: str) -> str:
    payload = {
        "sub": username,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRE_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_jwt(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
