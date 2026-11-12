"""
Impresora de cocina del Comandero.

Un único móvil por local imprime las rondas de todos los camareros. El servidor
guarda qué móvil es (`impresora_dispositivo`) y qué rondas ya salieron en papel
(`Pedido.impreso_en`), de modo que al reconectar el móvil solo pide las que faltan.
"""

from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from contratos.pedido import PedidoResponse
from logica.pedido_helpers import pedido_a_response
from modelos.pedido import Pedido
from modelos.restaurante import Restaurante
from seguridad.excepciones import AppException, NotFoundException

ESTADOS_EN_COCINA = ("MARCHADO", "LISTO")
MAX_PENDIENTES = 50


class ImpresoraEstado(BaseModel):
    dispositivo_id: str | None = None
    nombre: str | None = None
    activa_desde: datetime | None = None


def _estado(restaurante: Restaurante) -> ImpresoraEstado:
    return ImpresoraEstado(
        dispositivo_id=restaurante.impresora_dispositivo,
        nombre=restaurante.impresora_nombre,
        activa_desde=restaurante.impresora_desde,
    )


async def _restaurante(db: AsyncSession, restaurante_id: int, bloquear: bool = False) -> Restaurante:
    query = select(Restaurante).where(Restaurante.id == restaurante_id)
    restaurante = await db.scalar(query.with_for_update() if bloquear else query)
    if restaurante is None:
        raise NotFoundException("Restaurante", restaurante_id)
    return restaurante


async def _ahora(db: AsyncSession) -> datetime:
    # Misma referencia horaria que Pedido.created_at (server_default=now()).
    return await db.scalar(select(func.localtimestamp()))


async def _exigir_titular(db: AsyncSession, restaurante_id: int, dispositivo_id: str) -> Restaurante:
    restaurante = await _restaurante(db, restaurante_id)
    if restaurante.impresora_dispositivo != dispositivo_id:
        raise AppException("Este móvil ya no es la impresora de cocina del local.", 409)
    return restaurante


async def estado_impresora(db: AsyncSession, restaurante_id: int) -> ImpresoraEstado:
    return _estado(await _restaurante(db, restaurante_id))


async def activar_impresora(
    db: AsyncSession, restaurante_id: int, dispositivo_id: str, nombre: str, reemplazar: bool,
) -> tuple[ImpresoraEstado, bool]:
    """Convierte este móvil en la impresora del local. Devuelve (estado, cambió_de_móvil)."""
    restaurante = await _restaurante(db, restaurante_id, bloquear=True)
    actual = restaurante.impresora_dispositivo
    if actual and actual != dispositivo_id and not reemplazar:
        raise AppException(
            f"La impresora de cocina ya está activa en «{restaurante.impresora_nombre or 'otro móvil'}».", 409,
        )
    cambio = actual != dispositivo_id
    restaurante.impresora_nombre = nombre
    if cambio:
        restaurante.impresora_dispositivo = dispositivo_id
        # Solo imprime las rondas que lleguen desde ahora, no las que ya están en cocina.
        restaurante.impresora_desde = await _ahora(db)
    estado = _estado(restaurante)
    await db.commit()
    return estado, cambio


async def liberar_impresora(
    db: AsyncSession, restaurante_id: int, dispositivo_id: str, es_admin: bool,
) -> ImpresoraEstado:
    restaurante = await _restaurante(db, restaurante_id, bloquear=True)
    if restaurante.impresora_dispositivo and restaurante.impresora_dispositivo != dispositivo_id and not es_admin:
        raise AppException("Solo el propio móvil de cocina o un administrador pueden desactivarla.", 403)
    restaurante.impresora_dispositivo = None
    restaurante.impresora_nombre = None
    restaurante.impresora_desde = None
    estado = _estado(restaurante)
    await db.commit()
    return estado


async def rondas_sin_imprimir(db: AsyncSession, restaurante_id: int, dispositivo_id: str) -> list[PedidoResponse]:
    """Rondas en cocina que aún no han salido en papel, de la más antigua a la más nueva."""
    restaurante = await _exigir_titular(db, restaurante_id, dispositivo_id)
    ids = await db.scalars(
        select(Pedido.id)
        .where(
            Pedido.restaurante_id == restaurante_id,
            Pedido.estado.in_(ESTADOS_EN_COCINA),
            Pedido.impreso_en.is_(None),
            Pedido.created_at >= restaurante.impresora_desde,
        )
        .order_by(Pedido.id)
        .limit(MAX_PENDIENTES)
    )
    return [await pedido_a_response(db, pedido_id, restaurante_id) for pedido_id in ids]


async def marcar_impresa(db: AsyncSession, restaurante_id: int, pedido_id: int, dispositivo_id: str) -> datetime:
    """Registra que la ronda ya salió en papel. Repetir la llamada no cambia nada."""
    await _exigir_titular(db, restaurante_id, dispositivo_id)
    pedido = await db.scalar(
        select(Pedido).where(Pedido.id == pedido_id, Pedido.restaurante_id == restaurante_id).with_for_update()
    )
    if pedido is None:
        raise NotFoundException("Pedido", pedido_id)
    if pedido.impreso_en is None:
        pedido.impreso_en = await _ahora(db)
    impreso_en = pedido.impreso_en
    await db.commit()
    return impreso_en
