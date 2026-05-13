"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: seguridad/jwt_manager.py
Tipo: Seguridad → Gestión real de JWT
Líneas: ~45 / 200 MAX
Dependencias: 2 (python-jose, config)

Acciones:
- Genera tokens JWT firmados con el secret de .env
- Verifica y decodifica tokens con manejo de expiración
- Extrae el usuario del payload del token

Última Modificación: 2026-03-10 | Dajarony
Cambio: Implementación inicial JWT real (reemplaza dummy).
═══════════════════════════════════════════════════════════
"""

from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from config import get_settings
from seguridad.excepciones import AuthException
from seguridad.logger import obtener_logger

logger = obtener_logger("jwt_manager")
settings = get_settings()


def crear_token(data: dict) -> str:
    """Crea un JWT firmado con expiración configurable."""
    to_encode = data.copy()
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    to_encode.update({"exp": expires})

    token = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    logger.info(f"Token creado para: {data.get('sub', 'unknown')}")
    return token


def verificar_token(token: str) -> dict:
    """Decodifica y valida un JWT. Lanza AuthException si falla."""
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise AuthException("Token inválido: sin identificador de usuario")
        return payload
    except JWTError as e:
        logger.warning(f"Token inválido o expirado: {str(e)}")
        raise AuthException("Token inválido o expirado")
