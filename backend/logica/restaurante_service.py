"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: logica/restaurante_service.py
Tipo: Lógica → Servicio de Restaurante (configuración)
Líneas: ~35 / 200 MAX

Acciones:
- Obtener datos del restaurante por ID
- Actualizar nombre/activo del restaurante

Última Modificación: 2026-04-02 | Dajarony
Cambio: Implementación inicial configuración de restaurante.
═══════════════════════════════════════════════════════════
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from modelos.restaurante import Restaurante
from contratos.restaurante import RestauranteResponse, RestauranteUpdate
from seguridad.excepciones import NotFoundException
from seguridad.logger import obtener_logger

logger = obtener_logger("restaurante_service")


async def obtener_restaurante(db: AsyncSession, restaurante_id: int) -> RestauranteResponse:
    """Devuelve los datos del restaurante."""
    r = await db.scalar(select(Restaurante).where(Restaurante.id == restaurante_id))
    if not r:
        raise NotFoundException("Restaurante", restaurante_id)
    return RestauranteResponse.model_validate(r)


async def actualizar_restaurante(db: AsyncSession, restaurante_id: int, datos: RestauranteUpdate) -> RestauranteResponse:
    """Actualiza los datos editables del restaurante."""
    r = await db.scalar(select(Restaurante).where(Restaurante.id == restaurante_id))
    if not r:
        raise NotFoundException("Restaurante", restaurante_id)

    if datos.nombre is not None:
        r.nombre = datos.nombre
    if datos.activo is not None:
        r.activo = datos.activo

    await db.commit()
    await db.refresh(r)
    logger.info(f"Restaurante #{restaurante_id} actualizado: nombre='{r.nombre}'")
    return RestauranteResponse.model_validate(r)
