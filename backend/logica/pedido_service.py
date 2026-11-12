"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: logica/pedido_service.py
Tipo: Lógica → Servicio de Pedidos/Comandas
Líneas: ~180 / 200 MAX
Dependencias: 5 (sqlalchemy, modelos, contratos, excepciones, logger)
Acciones: crear, obtener, listar, marchar(+destino),
  retener, liberar, cerrar, agregar_lineas, obtener_completo(ticket)
Última Modificación: 2026-03-17 | Auditoría
Cambio: Extraído _pedido_a_response → pedido_helpers.py
═══════════════════════════════════════════════════════════
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from modelos.pedido import Pedido, LineaPedido
from modelos.mesa import Mesa
from modelos.menu import MenuItem
from contratos.pedido import PedidoCreate, PedidoResponse, LineasAdd, PedidoCerrar
from seguridad.excepciones import NotFoundException, AppException
from seguridad.logger import obtener_logger
from datetime import datetime
from logica.pedido_helpers import pedido_a_response
from seguridad.socket_manager import socket_manager

logger = obtener_logger("pedido_service")


async def crear_pedido(
    db: AsyncSession, datos: PedidoCreate, usuario_id: int, restaurante_id: int,
    *, mesa_servicio: Mesa | None = None,
) -> PedidoResponse:
    """Crea un pedido con sus líneas, validando mesa e items."""
    mesa = mesa_servicio or await db.scalar(select(Mesa).where(Mesa.id == datos.mesa_id, Mesa.restaurante_id == restaurante_id))
    if not mesa:
        raise NotFoundException("Mesa", datos.mesa_id)

    total = 0.0
    lineas_db = []

    for linea in datos.lineas:
        item = await db.scalar(select(MenuItem).where(MenuItem.id == linea.item_menu_id, MenuItem.restaurante_id == restaurante_id))
        if not item:
            raise NotFoundException("MenuItem", linea.item_menu_id)
        if not item.disponible:
            raise AppException(f"Item '{item.nombre}' no disponible", 422)

        subtotal = item.precio * linea.cantidad
        total += subtotal
        lineas_db.append(LineaPedido(
            restaurante_id=restaurante_id,
            item_menu_id=item.id,
            cantidad=linea.cantidad,
            precio_unitario=item.precio,
            nota=linea.nota,
        ))

    pedido = Pedido(
        mesa_id=datos.mesa_id,
        usuario_id=usuario_id,
        restaurante_id=restaurante_id,
        total=round(total, 2),
        notas=datos.notas,
    )
    if mesa_servicio is not None:
        pedido.estado = "MARCHADO"
        pedido.destino = "COCINA"
    pedido.lineas = lineas_db
    db.add(pedido)

    mesa.total_cuenta = round(mesa.total_cuenta + total, 2)
    if mesa_servicio is None:
        await db.commit()
        await db.refresh(pedido)
    else:
        await db.flush()

    logger.info(f"Pedido #{pedido.id} creado en mesa {mesa.numero} ({total}€) (restaurante={restaurante_id})")
    return await pedido_a_response(db, pedido.id, restaurante_id)


async def obtener_pedido(db: AsyncSession, pedido_id: int, restaurante_id: int) -> PedidoResponse:
    """Obtiene un pedido con sus líneas."""
    return await pedido_a_response(db, pedido_id, restaurante_id)


async def listar_por_mesa(db: AsyncSession, mesa_id: int, restaurante_id: int, solo_activos: bool = True) -> list[PedidoResponse]:
    """Lista pedidos de una mesa. Por defecto solo activos (no CERRADOS)."""
    mesa = await db.scalar(select(Mesa).where(Mesa.id == mesa_id, Mesa.restaurante_id == restaurante_id))
    if not mesa:
        raise NotFoundException("Mesa", mesa_id)

    query = select(Pedido).where(Pedido.mesa_id == mesa_id, Pedido.restaurante_id == restaurante_id)
    if solo_activos:
        query = query.where(Pedido.estado != "CERRADO")
    query = query.options(selectinload(Pedido.lineas)).order_by(Pedido.created_at.desc())

    result = await db.execute(query)
    pedidos = result.scalars().all()

    responses = []
    for p in pedidos:
        responses.append(await pedido_a_response(db, p.id, restaurante_id))
    return responses


async def marchar_pedido(db: AsyncSession, pedido_id: int, restaurante_id: int, destino: str = "COCINA") -> PedidoResponse:
    """Cambia estado: ABIERTO → MARCHADO con destino (COCINA/BARRA)."""
    pedido = await db.scalar(select(Pedido).where(Pedido.id == pedido_id, Pedido.restaurante_id == restaurante_id))
    if not pedido:
        raise NotFoundException("Pedido", pedido_id)
    if pedido.estado not in ("ABIERTO",):
        raise AppException(f"Solo se puede marchar un pedido ABIERTO (actual: {pedido.estado})")

    pedido.estado = "MARCHADO"
    pedido.destino = destino
    await db.commit()
    
    response = await pedido_a_response(db, pedido_id, restaurante_id)
    
    # Notificar a la cocina vía WebSocket
    await socket_manager.broadcast(restaurante_id, {
        "event": "ORDER_MARCHADO",
        "pedido": response.model_dump(mode="json")
    })
    
    logger.info(f"Pedido #{pedido_id} MARCHADO → {destino} (Notificado a KDS)")
    return response


async def retener_pedido(db: AsyncSession, pedido_id: int, restaurante_id: int) -> PedidoResponse:
    """Cambia estado: ABIERTO → RETENIDO (en espera)."""
    pedido = await db.scalar(select(Pedido).where(Pedido.id == pedido_id, Pedido.restaurante_id == restaurante_id))
    if not pedido:
        raise NotFoundException("Pedido", pedido_id)
    if pedido.estado != "ABIERTO":
        raise AppException(f"Solo se puede retener un pedido ABIERTO (actual: {pedido.estado})")
    pedido.estado = "RETENIDO"
    await db.commit()
    logger.info(f"Pedido #{pedido_id} RETENIDO")
    return await pedido_a_response(db, pedido_id, restaurante_id)


async def liberar_pedido(db: AsyncSession, pedido_id: int, restaurante_id: int) -> PedidoResponse:
    """Cambia estado: RETENIDO → ABIERTO (listo para enviar)."""
    pedido = await db.scalar(select(Pedido).where(Pedido.id == pedido_id, Pedido.restaurante_id == restaurante_id))
    if not pedido:
        raise NotFoundException("Pedido", pedido_id)
    if pedido.estado != "RETENIDO":
        raise AppException(f"Solo se puede liberar un pedido RETENIDO (actual: {pedido.estado})")
    pedido.estado = "ABIERTO"
    await db.commit()
    logger.info(f"Pedido #{pedido_id} liberado → ABIERTO")
    return await pedido_a_response(db, pedido_id, restaurante_id)


async def cerrar_pedido(db: AsyncSession, pedido_id: int, restaurante_id: int, datos: PedidoCerrar) -> PedidoResponse:
    """Cambia estado: ABIERTO/MARCHADO/LISTO → CERRADO y guarda la propina."""
    pedido = await db.scalar(select(Pedido).where(Pedido.id == pedido_id, Pedido.restaurante_id == restaurante_id))
    if not pedido:
        raise NotFoundException("Pedido", pedido_id)
    if pedido.estado == "CERRADO":
        raise AppException("El pedido ya está cerrado")

    estado_previo = pedido.estado
    pedido.estado = "CERRADO"
    pedido.propina = datos.propina
    pedido.descuento = datos.descuento
    pedido.metodo_pago = datos.metodo_pago
    await db.commit()
    logger.info(f"Pedido #{pedido_id} CERRADO (era {estado_previo}) propina={datos.propina}€ descuento={datos.descuento}€ metodo={datos.metodo_pago}")
    return await pedido_a_response(db, pedido_id, restaurante_id)


async def agregar_lineas(db: AsyncSession, pedido_id: int, datos: LineasAdd, restaurante_id: int) -> PedidoResponse:
    """Añade líneas nuevas a un pedido ABIERTO o RETENIDO."""
    pedido = await db.scalar(select(Pedido).where(Pedido.id == pedido_id, Pedido.restaurante_id == restaurante_id))
    if not pedido:
        raise NotFoundException("Pedido", pedido_id)
    if pedido.estado not in ("ABIERTO", "RETENIDO"):
        raise AppException(f"Solo ABIERTO/RETENIDO admiten líneas (actual: {pedido.estado})")

    mesa = await db.scalar(select(Mesa).where(Mesa.id == pedido.mesa_id, Mesa.restaurante_id == restaurante_id))
    extra = 0.0

    for linea in datos.lineas:
        item = await db.scalar(select(MenuItem).where(MenuItem.id == linea.item_menu_id, MenuItem.restaurante_id == restaurante_id))
        if not item:
            raise NotFoundException("MenuItem", linea.item_menu_id)
        if not item.disponible:
            raise AppException(f"Item '{item.nombre}' no disponible", 422)
        subtotal = item.precio * linea.cantidad
        extra += subtotal
        db.add(LineaPedido(
            restaurante_id=restaurante_id,
            pedido_id=pedido_id,
            item_menu_id=item.id,
            cantidad=linea.cantidad,
            precio_unitario=item.precio,
            nota=linea.nota,
        ))

    pedido.total = round(pedido.total + extra, 2)
    if mesa:
        mesa.total_cuenta = round(mesa.total_cuenta + extra, 2)
    await db.commit()
    logger.info(f"Pedido #{pedido_id}: +{len(datos.lineas)} líneas (+{extra}€)")
    return await pedido_a_response(db, pedido_id, restaurante_id)


async def eliminar_linea(db: AsyncSession, pedido_id: int, linea_id: int, restaurante_id: int) -> PedidoResponse:
    """Elimina una línea de un pedido ABIERTO o RETENIDO y recalcula el total."""
    pedido = await db.scalar(select(Pedido).where(Pedido.id == pedido_id, Pedido.restaurante_id == restaurante_id))
    if not pedido:
        raise NotFoundException("Pedido", pedido_id)
    if pedido.estado not in ("ABIERTO", "RETENIDO"):
        raise AppException(f"Solo se pueden eliminar líneas de pedidos ABIERTO/RETENIDO (actual: {pedido.estado})")

    linea = await db.scalar(select(LineaPedido).where(LineaPedido.id == linea_id, LineaPedido.pedido_id == pedido_id))
    if not linea:
        raise NotFoundException("LineaPedido", linea_id)

    subtotal = round(linea.precio_unitario * linea.cantidad, 2)
    pedido.total = round(max(pedido.total - subtotal, 0), 2)

    # Actualizar total_cuenta de la mesa
    mesa = await db.scalar(select(Mesa).where(Mesa.id == pedido.mesa_id, Mesa.restaurante_id == restaurante_id))
    if mesa:
        mesa.total_cuenta = round(max(mesa.total_cuenta - subtotal, 0), 2)

    await db.delete(linea)
    await db.commit()
    logger.info(f"Pedido #{pedido_id}: línea #{linea_id} eliminada (-{subtotal}€)")
    return await pedido_a_response(db, pedido_id, restaurante_id)


async def listar_pedidos_cocina(db: AsyncSession, restaurante_id: int) -> list[PedidoResponse]:
    """Lista pedidos actualmente en cocina (estado MARCHADO o LISTO)."""
    query = (
        select(Pedido)
        .where(Pedido.restaurante_id == restaurante_id, Pedido.estado.in_(["MARCHADO", "LISTO"]))
        .options(selectinload(Pedido.lineas))
        .order_by(Pedido.created_at.asc())  # Los más viejos primero
    )
    result = await db.execute(query)
    pedidos = result.scalars().all()
    
    responses = []
    for p in pedidos:
        responses.append(await pedido_a_response(db, p.id, restaurante_id))
    return responses


async def completar_pedido_cocina(db: AsyncSession, pedido_id: int, restaurante_id: int) -> PedidoResponse:
    """Marca un pedido de cocina como LISTO (LISTO_PARA_ENTREGAR)."""
    pedido = await db.scalar(select(Pedido).where(
        Pedido.id == pedido_id, Pedido.restaurante_id == restaurante_id,
    ).with_for_update())
    if not pedido:
        raise NotFoundException("Pedido", pedido_id)
    if pedido.estado != "MARCHADO":
        raise AppException(f"Solo pedidos MARCHADO pueden pasar a LISTO (actual: {pedido.estado})")

    pedido.estado = "LISTO"
    await db.commit()
    
    response = await pedido_a_response(db, pedido_id, restaurante_id)
    
    # Notificar a los camareros (TPV) que el pedido está listo
    await socket_manager.broadcast(restaurante_id, {
        "event": "ORDER_READY",
        "pedido_id": pedido_id,
        "pedido": response.model_dump(mode="json")
    })
    
    logger.info(f"Pedido #{pedido_id} marcado como LISTO (Notificado a TPV)")
    return response


async def obtener_pedido_completo(db: AsyncSession, pedido_id: int, restaurante_id: int) -> dict:
    """Devuelve pedido como dict con mesa_numero para el ticket."""
    query = (
        select(Pedido)
        .where(Pedido.id == pedido_id, Pedido.restaurante_id == restaurante_id)
        .options(
            selectinload(Pedido.lineas).selectinload(LineaPedido.item_menu),
            selectinload(Pedido.mesa),
        )
    )
    result = await db.execute(query)
    pedido = result.scalar_one_or_none()
    if not pedido:
        raise NotFoundException("Pedido", pedido_id)

    return {
        "id": pedido.id, "mesa_id": pedido.mesa_id,
        "mesa_numero": pedido.mesa.numero if pedido.mesa else "?",
        "total": pedido.total, "created_at": pedido.created_at,
        "lineas": [{
            "item_nombre": l.item_menu.nombre if l.item_menu else "Item",
            "cantidad": l.cantidad, "precio_unitario": l.precio_unitario,
            "nota": l.nota,
        } for l in pedido.lineas],
    }

async def listar_historial_pedidos(
    db: AsyncSession, 
    restaurante_id: int, 
    fecha_inicio: datetime | None = None,
    fecha_fin: datetime | None = None,
    usuario_id: int | None = None
) -> list[dict]:
    """Lista todos los pedidos cerrados con filtros de fecha y camarero."""
    query = select(Pedido).where(
        Pedido.restaurante_id == restaurante_id,
        Pedido.estado == "CERRADO"
    ).order_by(Pedido.created_at.desc())

    if fecha_inicio:
        query = query.where(Pedido.created_at >= fecha_inicio)
    if fecha_fin:
        query = query.where(Pedido.created_at <= fecha_fin)
    if usuario_id:
        query = query.where(Pedido.usuario_id == usuario_id)

    result = await db.execute(query)
    pedidos = result.scalars().all()
    
    # Serializar usando el helper (que ahora incluye mesa_numero)
    results = []
    for p in pedidos:
        results.append(await pedido_a_response(db, p.id, restaurante_id))
    return results
