"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: logica/auth_service.py
Tipo: Lógica → Servicio de Autenticación
Líneas: ~45 / 200 MAX
Dependencias: 4 (sqlalchemy, passlib, jwt_manager, excepciones)

Acciones:
- Registrar usuario nuevo con password hasheado
- Login: valida credenciales y genera JWT real
- Verifica unicidad de email

Última Modificación: 2026-03-10 | Dajarony
Cambio: Implementación inicial autenticación real.
═══════════════════════════════════════════════════════════
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext
from modelos.usuario import Usuario
from modelos.restaurante import Restaurante
from contratos.usuario import UsuarioCreate, UsuarioResponse, TokenResponse, RegistroRestauranteCreate
from seguridad.jwt_manager import crear_token
from seguridad.excepciones import AppException, AuthException
from seguridad.logger import obtener_logger

logger = obtener_logger("auth_service")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def _email_ya_existe(db: AsyncSession, email: str) -> bool:
    """Evita login ambiguo: el login actual identifica usuarios solo por email."""
    existente = await db.execute(
        select(Usuario.id).where(Usuario.email == email.strip().lower())
    )
    return existente.scalar_one_or_none() is not None


async def registrar_usuario(
    db: AsyncSession,
    datos: UsuarioCreate,
    restaurante_id: int,
) -> UsuarioResponse:
    """Registra un nuevo usuario con password hasheado."""
    email = datos.email.strip().lower()
    if await _email_ya_existe(db, email):
        raise AppException("El email ya está registrado", status_code=409)

    nuevo = Usuario(
        nombre=datos.nombre,
        email=email,
        password_hash=pwd_context.hash(datos.password),
        rol=datos.rol.value,
        restaurante_id=restaurante_id,
    )
    db.add(nuevo)
    await db.commit()
    await db.refresh(nuevo)

    logger.info(f"Usuario registrado: {nuevo.email} (rol={nuevo.rol}, restaurante={nuevo.restaurante_id})")
    return UsuarioResponse.model_validate(nuevo)


async def login(db: AsyncSession, email: str, password: str) -> TokenResponse:
    """Valida credenciales y devuelve JWT real."""
    result = await db.execute(select(Usuario).where(Usuario.email == email.strip().lower()))
    usuarios = result.scalars().all()
    usuario = next(
        (u for u in usuarios if pwd_context.verify(password, u.password_hash)),
        None,
    )

    if not usuario:
        raise AuthException("Credenciales inválidas")

    if not usuario.activo:
        raise AuthException("Usuario desactivado")

    token = crear_token(data={"sub": str(usuario.id), "rol": usuario.rol, "restaurante_id": str(usuario.restaurante_id)})
    logger.info(f"Login exitoso: {usuario.email} (restaurante={usuario.restaurante_id})")

    return TokenResponse(
        access_token=token,
        usuario=UsuarioResponse.model_validate(usuario),
    )


async def registro_restaurante(db: AsyncSession, datos: RegistroRestauranteCreate) -> TokenResponse:
    """Crea un restaurante nuevo + su primer admin y devuelve JWT listo para usar."""
    email = datos.email.strip().lower()
    if await _email_ya_existe(db, email):
        raise AppException("El email ya estÃ¡ registrado", status_code=409)

    restaurante = Restaurante(nombre=datos.nombre_restaurante)
    db.add(restaurante)
    await db.flush()  # obtiene restaurante.id sin cerrar transacción

    admin = Usuario(
        nombre=datos.nombre_admin,
        email=email,
        password_hash=pwd_context.hash(datos.password),
        rol="ADMIN",
        restaurante_id=restaurante.id,
    )
    db.add(admin)
    await db.commit()
    await db.refresh(admin)

    token = crear_token(data={"sub": str(admin.id), "rol": admin.rol, "restaurante_id": str(restaurante.id)})
    logger.info(f"Restaurante '{restaurante.nombre}' registrado (id={restaurante.id}, admin={admin.email})")
    return TokenResponse(access_token=token, usuario=UsuarioResponse.model_validate(admin))
