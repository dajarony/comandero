"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: entradas/routers/restaurante.py
Tipo: Adaptador HTTP → Configuración del Restaurante
Líneas: ~35 / 200 MAX

Rutas:
  GET /restaurante/mi-restaurante → datos del restaurante actual
  PUT /restaurante/mi-restaurante → actualizar nombre/activo (solo ADMIN)

Última Modificación: 2026-04-02 | Dajarony
Cambio: Implementación inicial.
═══════════════════════════════════════════════════════════
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from contratos.restaurante import RestauranteResponse, RestauranteUpdate
from contratos.respuesta import ApiResponse
from logica.restaurante_service import obtener_restaurante, actualizar_restaurante
from seguridad.deps import get_current_user, require_admin
from modelos.usuario import Usuario

router = APIRouter()


@router.get("/mi-restaurante", response_model=ApiResponse[RestauranteResponse])
async def endpoint_get_restaurante(
    usuario: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Devuelve los datos del restaurante del usuario autenticado."""
    resultado = await obtener_restaurante(db, usuario.restaurante_id)
    return ApiResponse(success=True, data=resultado)


@router.put("/mi-restaurante", response_model=ApiResponse[RestauranteResponse])
async def endpoint_update_restaurante(
    datos: RestauranteUpdate,
    usuario: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Actualiza nombre y estado del restaurante (solo ADMIN)."""
    resultado = await actualizar_restaurante(db, usuario.restaurante_id, datos)
    return ApiResponse(success=True, data=resultado)
