"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: logica/usuarios_service.py
Tipo: Lógica → Servicio de Gestión de Personal
Líneas: ~60 / 200 MAX
Dependencias: 4 (sqlalchemy, passlib, modelos, contratos)

Acciones:
- Listar usuarios por restaurante
- Crear usuario de staff (hashing automático)
- Actualizar perfil de usuario
- Resetear contraseña
═══════════════════════════════════════════════════════════
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext
from modelos.usuario import Usuario
from contratos.usuario import UsuarioCreate, UsuarioUpdate, UsuarioResponse, UsuarioPasswordReset
from seguridad.excepciones import AppException
from seguridad.logger import obtener_logger

logger = obtener_logger("usuarios_service")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def listar_usuarios(db: AsyncSession, restaurante_id: int) -> list[UsuarioResponse]:
    """Obtiene la lista de personal de un restaurante específico."""
    result = await db.execute(
        select(Usuario).where(Usuario.restaurante_id == restaurante_id).order_by(Usuario.nombre)
    )
    usuarios = result.scalars().all()
    return [UsuarioResponse.model_validate(u) for u in usuarios]


async def crear_usuario_personal(db: AsyncSession, datos: UsuarioCreate, restaurante_id: int) -> UsuarioResponse:
    """Crea un nuevo usuario vinculado al restaurante del admin."""
    # Verificar email único
    email = datos.email.strip().lower()
    existente = await db.execute(select(Usuario).where(Usuario.email == email))
    if existente.scalar_one_or_none():
        raise AppException("El email ya está registrado", status_code=409)

    nuevo = Usuario(
        nombre=datos.nombre,
        email=email,
        password_hash=pwd_context.hash(datos.password),
        rol=datos.rol.value,
        restaurante_id=restaurante_id,
        activo=True
    )
    
    db.add(nuevo)
    await db.commit()
    await db.refresh(nuevo)
    
    logger.info(f"Nuevo personal creado: {nuevo.email} (rol={nuevo.rol}) por restaurante {restaurante_id}")
    return UsuarioResponse.model_validate(nuevo)


async def actualizar_usuario(db: AsyncSession, user_id: int, restaurante_id: int, datos: UsuarioUpdate) -> UsuarioResponse:
    """Actualiza los datos de un usuario si pertenece al restaurante."""
    result = await db.execute(
        select(Usuario).where(Usuario.id == user_id, Usuario.restaurante_id == restaurante_id)
    )
    usuario = result.scalar_one_or_none()
    
    if not usuario:
        raise AppException("Usuario no encontrado o sin permisos", status_code=404)

    # Actualizar campos proporcionados
    update_data = datos.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "rol" and value:
            setattr(usuario, key, value.value)
        else:
            setattr(usuario, key, value)

    await db.commit()
    await db.refresh(usuario)
    
    logger.info(f"Usuario {user_id} actualizado por restaurante {restaurante_id}")
    return UsuarioResponse.model_validate(usuario)


async def resetear_password(db: AsyncSession, user_id: int, restaurante_id: int, datos: UsuarioPasswordReset):
    """Permite al admin resetear la contraseña de un empleado."""
    result = await db.execute(
        select(Usuario).where(Usuario.id == user_id, Usuario.restaurante_id == restaurante_id)
    )
    usuario = result.scalar_one_or_none()
    
    if not usuario:
        raise AppException("Usuario no encontrado", status_code=404)

    usuario.password_hash = pwd_context.hash(datos.nueva_password)
    await db.commit()
    
    logger.info(f"Password reseteado para usuario {user_id}")
    return {"message": "Contraseña actualizada correctamente"}
