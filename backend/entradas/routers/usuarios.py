"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: entradas/routers/usuarios.py
Tipo: Endpoint → Router de Gestión de Personal
Líneas: ~50 / 200 MAX
Dependencias: 5 (fastapi, sqlalchemy, deps, contratos, service)

Endpoints:
- GET /: Listar personal (Admin only)
- POST /: Crear personal (Admin only)
- PUT /{id}: Actualizar perfil (Admin only)
- POST /{id}/password: Resetear clave (Admin only)
═══════════════════════════════════════════════════════════
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from seguridad.deps import require_admin
from modelos.usuario import Usuario
from contratos.usuario import UsuarioCreate, UsuarioUpdate, UsuarioResponse, UsuarioPasswordReset
from logica import usuarios_service as service

router = APIRouter()


@router.get("/", response_model=list[UsuarioResponse])
async def get_usuarios(
    db: AsyncSession = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    """Lista todo el personal del restaurante actual."""
    return await service.listar_usuarios(db, admin.restaurante_id)


@router.post("/", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
async def create_usuario(
    datos: UsuarioCreate,
    db: AsyncSession = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    """Crea un nuevo miembro del personal."""
    return await service.crear_usuario_personal(db, datos, admin.restaurante_id)


@router.put("/{user_id}", response_model=UsuarioResponse)
async def update_usuario(
    user_id: int,
    datos: UsuarioUpdate,
    db: AsyncSession = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    """Actualiza datos de un usuario de la plantilla."""
    return await service.actualizar_usuario(db, user_id, admin.restaurante_id, datos)


@router.post("/{user_id}/password")
async def reset_password(
    user_id: int,
    datos: UsuarioPasswordReset,
    db: AsyncSession = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    """Resetea la contraseña de un usuario de la plantilla."""
    return await service.resetear_password(db, user_id, admin.restaurante_id, datos)
