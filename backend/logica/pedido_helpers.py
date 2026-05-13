"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: logica/pedido_helpers.py
Tipo: Helper → Serialización de Pedidos
Líneas: ~50 / 200 MAX
Dependencias: 3 (sqlalchemy, modelos, contratos)

S (Setup): Imports de modelos y contratos.
U (Use):   pedido_a_response() — serializa Pedido ORM → PedidoResponse.
M (Manage): Carga eager de líneas + items.
E (Error):  NotFoundException si pedido no existe.

Última Modificación: 2026-03-17 | Auditoría
Cambio: Extraído de pedido_service.py para respetar límite 200 líneas.
═══════════════════════════════════════════════════════════
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from modelos.pedido import Pedido, LineaPedido
from modelos.mesa import Mesa
from contratos.pedido import PedidoResponse, LineaPedidoResponse
from seguridad.excepciones import NotFoundException


async def pedido_a_response(db: AsyncSession, pedido_id: int, restaurante_id: int) -> PedidoResponse:
    """Carga pedido con líneas, datos de items y número de mesa para la respuesta."""
    query = (
        select(Pedido)
        .where(Pedido.id == pedido_id, Pedido.restaurante_id == restaurante_id)
        .options(
            selectinload(Pedido.lineas).selectinload(LineaPedido.item_menu),
            selectinload(Pedido.mesa)
        )
    )
    result = await db.execute(query)
    pedido = result.scalar_one_or_none()
    if not pedido:
        raise NotFoundException("Pedido", pedido_id)

    lineas_resp = [LineaPedidoResponse(
        id=l.id, item_menu_id=l.item_menu_id,
        item_nombre=l.item_menu.nombre if l.item_menu else None,
        item_emoji=l.item_menu.emoji if l.item_menu else None,
        cantidad=l.cantidad, precio_unitario=l.precio_unitario, nota=l.nota,
    ) for l in pedido.lineas]

    return PedidoResponse(
        id=pedido.id, 
        mesa_id=pedido.mesa_id, 
        mesa_numero=pedido.mesa.numero if pedido.mesa else "??",
        usuario_id=pedido.usuario_id,
        estado=pedido.estado, 
        destino=pedido.destino, 
        total=pedido.total,
        notas=pedido.notas, 
        created_at=pedido.created_at, 
        lineas=lineas_resp,
    )
