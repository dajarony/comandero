"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: seguridad/deps.py
Tipo: Seguridad → Dependencias FastAPI
Líneas: ~45 / 200 MAX
Dependencias: 3 (fastapi, jwt_manager, database)

Acciones:
- get_current_user: Extrae el usuario autenticado del JWT
- require_admin: Verifica que el usuario sea admin
- Inyecta sesión de DB automáticamente

Última Modificación: 2026-03-10 | Dajarony
Cambio: Implementación inicial de dependencias.
═══════════════════════════════════════════════════════════
"""

from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from seguridad.jwt_manager import verificar_token
from seguridad.excepciones import AuthException, ForbiddenException
from seguridad.logger import obtener_logger
from modelos.usuario import Usuario
from modelos.restaurante import Restaurante

logger = obtener_logger("deps")
security_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    """Extrae y valida el usuario del token JWT."""
    payload = verificar_token(credentials.credentials)
    user_id = int(payload.get("sub"))
    restaurante_id = payload.get("restaurante_id")
    
    if not restaurante_id:
        raise AuthException("Token inválido: falta identificador de restaurante")

    result = await db.execute(select(Usuario).where(Usuario.id == user_id))
    usuario = result.scalar_one_or_none()

    if usuario is None or not usuario.activo:
        raise AuthException("Usuario no encontrado o inactivo")

    if str(usuario.restaurante_id) != str(restaurante_id):
         raise AuthException("Token inválido: discordancia de tenant")

    logger.info(f"Autenticado: {usuario.email} (rol={usuario.rol}, restaurante={usuario.restaurante_id})")
    return usuario


async def require_admin(
    usuario: Usuario = Depends(get_current_user),
) -> Usuario:
    """Exige que el usuario tenga rol ADMIN."""
    if usuario.rol != "ADMIN":
        raise ForbiddenException("Se requiere rol ADMIN")
    return usuario


async def modo_restaurante(db: AsyncSession, restaurante_id: int) -> str:
    """Devuelve el modo del local (COMANDERO o TPV)."""
    modo = await db.scalar(select(Restaurante.modo).where(Restaurante.id == restaurante_id))
    return modo or "TPV"


async def require_tpv(
    usuario: Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db),
) -> Usuario:
    if await modo_restaurante(db, usuario.restaurante_id) != "TPV":
        raise ForbiddenException("Esta función requiere el modo TPV")
    return usuario


async def require_comandero(
    usuario: Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db),
) -> Usuario:
    modo = await modo_restaurante(db, usuario.restaurante_id)
    if modo != "COMANDERO" or usuario.rol not in ("ADMIN", "CAMARERO"):
        raise ForbiddenException("Esta función requiere acceso de sala en modo Comandero")
    return usuario


async def require_local_comandero(
    usuario: Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db),
) -> Usuario:
    """Cualquier miembro del local (sala o cocina) en modo Comandero."""
    if await modo_restaurante(db, usuario.restaurante_id) != "COMANDERO":
        raise ForbiddenException("Esta función requiere el modo Comandero")
    return usuario
