"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: logica/mesa_service.py
Tipo: Lógica → Servicio de Mesas
Líneas: ~50 / 200 MAX
Dependencias: 3 (sqlalchemy, modelos, excepciones)

Acciones:
- Listar todas las mesas
- Obtener mesa individual
- Abrir mesa (estado → OCUPADA, registrar comensales)
- Liberar mesa (estado → LIBRE, resetear datos)
- Actualizar nota de mesa
- Cambiar estado arbitrariamente

Última Modificación: 2026-03-10 | Dajarony
Cambio: Implementación inicial gestión de mesas.
═══════════════════════════════════════════════════════════
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from modelos.mesa import Mesa
from contratos.mesa import MesaResponse, MesaCambioEstado
from seguridad.excepciones import NotFoundException
from seguridad.logger import obtener_logger

logger = obtener_logger("mesa_service")


async def listar_mesas(db: AsyncSession, restaurante_id: int) -> list[MesaResponse]:
    """Retorna todas las mesas del restaurante especificado."""
    result = await db.execute(select(Mesa).where(Mesa.restaurante_id == restaurante_id).order_by(Mesa.numero))
    mesas = result.scalars().all()
    logger.info(f"Listando {len(mesas)} mesas (restaurante={restaurante_id})")
    return [MesaResponse.model_validate(m) for m in mesas]


async def obtener_mesa(db: AsyncSession, mesa_id: int, restaurante_id: int) -> MesaResponse:
    """Obtiene una mesa por ID y restaurante_id."""
    mesa = await db.scalar(select(Mesa).where(Mesa.id == mesa_id, Mesa.restaurante_id == restaurante_id))
    if not mesa:
        raise NotFoundException("Mesa", mesa_id)
    return MesaResponse.model_validate(mesa)


async def abrir_mesa(db: AsyncSession, mesa_id: int, comensales: int, restaurante_id: int) -> MesaResponse:
    """Marca una mesa como OCUPADA con número de comensales."""
    mesa = await db.scalar(select(Mesa).where(Mesa.id == mesa_id, Mesa.restaurante_id == restaurante_id))
    if not mesa:
        raise NotFoundException("Mesa", mesa_id)

    mesa.estado = "OCUPADA"
    mesa.comensales = comensales
    from datetime import datetime, timezone, timedelta
    tz_madrid = timezone(timedelta(hours=2))
    mesa.hora_apertura = datetime.now(tz_madrid).strftime("%H:%M")
    await db.commit()
    await db.refresh(mesa)

    logger.info(f"Mesa {mesa.numero} abierta ({comensales} comensales)")
    return MesaResponse.model_validate(mesa)


async def liberar_mesa(db: AsyncSession, mesa_id: int, restaurante_id: int) -> MesaResponse:
    """Libera una mesa: resetea estado y datos."""
    mesa = await db.scalar(select(Mesa).where(Mesa.id == mesa_id, Mesa.restaurante_id == restaurante_id))
    if not mesa:
        raise NotFoundException("Mesa", mesa_id)

    mesa.estado = "LIBRE"
    mesa.comensales = None
    mesa.hora_apertura = None
    mesa.total_cuenta = 0.0
    mesa.nota = None
    await db.commit()
    await db.refresh(mesa)

    logger.info(f"Mesa {mesa.numero} liberada")
    return MesaResponse.model_validate(mesa)


async def actualizar_nota_mesa(db: AsyncSession, mesa_id: int, nota: str | None, restaurante_id: int) -> MesaResponse:
    """Actualiza la nota de una mesa."""
    mesa = await db.scalar(select(Mesa).where(Mesa.id == mesa_id, Mesa.restaurante_id == restaurante_id))
    if not mesa:
        raise NotFoundException("Mesa", mesa_id)
    mesa.nota = nota
    await db.commit()
    await db.refresh(mesa)
    logger.info(f"Mesa {mesa.numero} nota actualizada")
    return MesaResponse.model_validate(mesa)


async def cambiar_estado(db: AsyncSession, mesa_id: int, datos: MesaCambioEstado, restaurante_id: int) -> MesaResponse:
    """Cambia el estado de una mesa."""
    mesa = await db.scalar(select(Mesa).where(Mesa.id == mesa_id, Mesa.restaurante_id == restaurante_id))
    if not mesa:
        raise NotFoundException("Mesa", mesa_id)

    mesa.estado = datos.estado.value
    if datos.comensales is not None:
        mesa.comensales = datos.comensales
    await db.commit()
    await db.refresh(mesa)

    logger.info(f"Mesa {mesa.numero} → {datos.estado.value}")
    return MesaResponse.model_validate(mesa)
