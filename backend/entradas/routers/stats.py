"""
===============================================================
SUME DOCBLOCK v2.0
===============================================================
Archivo: entradas/routers/stats.py
Tipo: Adaptador HTTP → Estadisticas
Lineas: ~30 / 200 MAX
Dependencias: 3 (fastapi, database, stats_service)

Rutas:
  GET /stats/hoy → Estadisticas del dia actual

Ultima Modificacion: 2026-03-15 | Dajarony
Cambio: Implementacion inicial router de estadisticas.
===============================================================
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from database import get_db
from contratos.respuesta import ApiResponse
from logica.servicios.stats_service import estadisticas_resumen
from seguridad.deps import get_current_user
from modelos.usuario import Usuario

router = APIRouter()


@router.get("/resumen", response_model=ApiResponse[dict])
async def endpoint_stats_resumen(
    periodo: str = Query("hoy", enum=["hoy", "semana", "mes"]),
    db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """
    Devuelve estadísticas de ventas para el periodo solicitado.
    Filtra automáticamente por el restaurante del usuario autenticado.
    """
    stats = await estadisticas_resumen(db, restaurante_id=user.restaurante_id, periodo=periodo)
    return ApiResponse(success=True, data=stats)
