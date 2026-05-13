"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: entradas/routers/mesas.py
Tipo: Adaptador HTTP → Mesas
Líneas: ~45 / 200 MAX
Dependencias: 3 (fastapi, database, mesa_service)

Rutas:
  GET  /mesas              → Listar todas las mesas
  GET  /mesas/{id}         → Obtener una mesa
  PUT  /mesas/{id}/estado  → Cambiar estado
  PUT  /mesas/{id}/nota    → Actualizar nota de mesa
  POST /mesas/{id}/abrir   → Abrir mesa con comensales
  POST /mesas/{id}/liberar → Liberar y resetear mesa

Última Modificación: 2026-03-10 | Dajarony
Cambio: Implementación inicial router de mesas.
═══════════════════════════════════════════════════════════
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from contratos.mesa import MesaResponse, MesaCambioEstado, MesaNotaUpdate
from contratos.respuesta import ApiResponse
from logica.mesa_service import (
    listar_mesas, obtener_mesa, abrir_mesa, liberar_mesa,
    cambiar_estado, actualizar_nota_mesa,
)
from seguridad.deps import get_current_user
from modelos.usuario import Usuario

router = APIRouter()


@router.get("", response_model=ApiResponse[list[MesaResponse]])
async def endpoint_listar_mesas(
    db: AsyncSession = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """Lista todas las mesas del restaurante."""
    mesas = await listar_mesas(db, usuario.restaurante_id)
    return ApiResponse(success=True, data=mesas)


@router.get("/{mesa_id}", response_model=ApiResponse[MesaResponse])
async def endpoint_obtener_mesa(
    mesa_id: int,
    db: AsyncSession = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """Obtiene los datos de una mesa específica."""
    mesa = await obtener_mesa(db, mesa_id, usuario.restaurante_id)
    return ApiResponse(success=True, data=mesa)


@router.put("/{mesa_id}/estado", response_model=ApiResponse[MesaResponse])
async def endpoint_cambiar_estado(
    mesa_id: int,
    datos: MesaCambioEstado,
    db: AsyncSession = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """Cambia el estado de una mesa."""
    mesa = await cambiar_estado(db, mesa_id, datos, usuario.restaurante_id)
    return ApiResponse(success=True, data=mesa)


@router.put("/{mesa_id}/nota", response_model=ApiResponse[MesaResponse])
async def endpoint_nota_mesa(
    mesa_id: int,
    datos: MesaNotaUpdate,
    db: AsyncSession = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """Actualiza la nota de una mesa."""
    mesa = await actualizar_nota_mesa(db, mesa_id, datos.nota, usuario.restaurante_id)
    return ApiResponse(success=True, data=mesa)


@router.post("/{mesa_id}/abrir", response_model=ApiResponse[MesaResponse])
async def endpoint_abrir_mesa(
    mesa_id: int,
    comensales: int = Query(..., ge=1, description="Número de comensales"),
    db: AsyncSession = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """Abre una mesa: marca OCUPADA y registra comensales."""
    mesa = await abrir_mesa(db, mesa_id, comensales, usuario.restaurante_id)
    return ApiResponse(success=True, data=mesa)


@router.post("/{mesa_id}/liberar", response_model=ApiResponse[MesaResponse])
async def endpoint_liberar_mesa(
    mesa_id: int,
    db: AsyncSession = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """Libera una mesa: resetea estado y datos."""
    mesa = await liberar_mesa(db, mesa_id, usuario.restaurante_id)
    return ApiResponse(success=True, data=mesa)
