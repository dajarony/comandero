"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: entradas/routers/auth.py
Tipo: Adaptador HTTP → Auth
Líneas: ~45 / 200 MAX
Dependencias: 3 (fastapi, database, auth_service)

Rutas:
  POST /login    → login con email/password → JWT
  POST /register → crear nuevo usuario
  GET  /me       → datos del usuario autenticado

Última Modificación: 2026-03-10 | Dajarony
Cambio: Reescrito para usar auth_service real (bcrypt + JWT).
═══════════════════════════════════════════════════════════
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from contratos.usuario import UsuarioLogin, UsuarioCreate, TokenResponse, UsuarioResponse, RegistroRestauranteCreate
from contratos.respuesta import ApiResponse
from logica.auth_service import login, perfil_usuario, registrar_usuario, registro_restaurante
from seguridad.deps import get_current_user, require_admin
from seguridad.rate_limit import check_rate_limit
from modelos.usuario import Usuario

router = APIRouter()


@router.post("/login", response_model=ApiResponse[TokenResponse],
             dependencies=[Depends(check_rate_limit)])
async def endpoint_login(datos: UsuarioLogin, db: AsyncSession = Depends(get_db)):
    """Autenticación de camarero/admin → retorna JWT real (rate limited)."""
    resultado = await login(db, datos.email, datos.password)
    return ApiResponse(success=True, data=resultado)


@router.post("/register", response_model=ApiResponse[UsuarioResponse], status_code=201)
async def endpoint_register(
    datos: UsuarioCreate,
    db: AsyncSession = Depends(get_db),
    admin: Usuario = Depends(require_admin),
):
    """Crea personal del restaurante del admin autenticado."""
    resultado = await registrar_usuario(db, datos, admin.restaurante_id)
    return ApiResponse(success=True, data=resultado)


@router.post("/registro-restaurante", response_model=ApiResponse[TokenResponse], status_code=201,
             dependencies=[Depends(check_rate_limit)])
async def endpoint_registro_restaurante(datos: RegistroRestauranteCreate, db: AsyncSession = Depends(get_db)):
    """Registro público: crea restaurante + primer admin → devuelve JWT."""
    resultado = await registro_restaurante(db, datos)
    return ApiResponse(success=True, data=resultado)


@router.get("/me", response_model=ApiResponse[UsuarioResponse])
async def endpoint_me(usuario: Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Devuelve datos del usuario autenticado."""
    return ApiResponse(
        success=True,
        data=await perfil_usuario(db, usuario),
    )
