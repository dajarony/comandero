# ... (Docblock simplificado para brevedad en edición)
"""
Servicio -> Estadísticas Multi-tenant
Soporta agrupaciones por hora, categoría e ítems populares.
"""

from datetime import date, datetime, timedelta
from sqlalchemy import select, func, cast, Integer
from sqlalchemy.ext.asyncio import AsyncSession

from modelos.pedido import Pedido, LineaPedido
from modelos.menu import MenuItem, Categoria


async def _ventas_resumen(db: AsyncSession, restaurante_id: int, inicio: datetime, fin: datetime) -> dict:
    """Calcula ventas_total, pedidos_count, mesas_atendidas en un rango."""
    query = (
        select(
            func.coalesce(func.sum(Pedido.total), 0.0).label("ventas_total"),
            func.count(Pedido.id).label("pedidos_count"),
            func.count(func.distinct(Pedido.mesa_id)).label("mesas_atendidas"),
        )
        .where(Pedido.restaurante_id == restaurante_id)
        .where(Pedido.estado == "CERRADO")
        .where(Pedido.created_at.between(inicio, fin))
    )
    row = (await db.execute(query)).one()
    ventas = float(row.ventas_total)
    pedidos = int(row.pedidos_count)
    ticket = round(ventas / pedidos, 2) if pedidos > 0 else 0.0
    return {
        "ventas_total": round(ventas, 2),
        "pedidos_count": pedidos,
        "mesas_atendidas": int(row.mesas_atendidas),
        "ticket_medio": ticket,
    }


async def _top_items(db: AsyncSession, restaurante_id: int, inicio: datetime, fin: datetime) -> list[dict]:
    """Top 5 items más vendidos en el rango."""
    query = (
        select(
            MenuItem.nombre,
            MenuItem.emoji,
            func.sum(LineaPedido.cantidad).label("cantidad"),
            func.sum(LineaPedido.cantidad * LineaPedido.precio_unitario).label("total"),
        )
        .join(LineaPedido, LineaPedido.item_menu_id == MenuItem.id)
        .join(Pedido, Pedido.id == LineaPedido.pedido_id)
        .where(Pedido.restaurante_id == restaurante_id)
        .where(Pedido.estado == "CERRADO")
        .where(Pedido.created_at.between(inicio, fin))
        .group_by(MenuItem.id, MenuItem.nombre, MenuItem.emoji)
        .order_by(func.sum(LineaPedido.cantidad).desc())
        .limit(5)
    )
    rows = (await db.execute(query)).all()
    return [
        {
            "nombre": r.nombre,
            "emoji": r.emoji,
            "cantidad": int(r.cantidad),
            "total": round(float(r.total), 2),
        }
        for r in rows
    ]


async def _ventas_por_categoria(db: AsyncSession, restaurante_id: int, inicio: datetime, fin: datetime) -> list[dict]:
    """Ventas agrupadas por categoría."""
    query = (
        select(
            Categoria.nombre,
            func.sum(LineaPedido.cantidad * LineaPedido.precio_unitario).label("total"),
        )
        .join(MenuItem, MenuItem.categoria_id == Categoria.id)
        .join(LineaPedido, LineaPedido.item_menu_id == MenuItem.id)
        .join(Pedido, Pedido.id == LineaPedido.pedido_id)
        .where(Pedido.restaurante_id == restaurante_id)
        .where(Pedido.estado == "CERRADO")
        .where(Pedido.created_at.between(inicio, fin))
        .group_by(Categoria.id, Categoria.nombre)
        .order_by(func.sum(LineaPedido.cantidad * LineaPedido.precio_unitario).desc())
    )
    rows = (await db.execute(query)).all()
    return [
        {"nombre": r.nombre, "total": round(float(r.total), 2)}
        for r in rows
    ]


async def _ventas_por_hora(db: AsyncSession, restaurante_id: int, inicio: datetime, fin: datetime) -> list[dict]:
    """Ventas agrupadas por hora del día (para detectar horas pico)."""
    # Nota: extract 'hour' funciona en SQLite y Postgres
    query = (
        select(
            cast(func.extract("hour", Pedido.created_at), Integer).label("hora"),
            func.coalesce(func.sum(Pedido.total), 0.0).label("total"),
        )
        .where(Pedido.restaurante_id == restaurante_id)
        .where(Pedido.estado == "CERRADO")
        .where(Pedido.created_at.between(inicio, fin))
        .group_by(func.extract("hour", Pedido.created_at))
        .order_by(func.extract("hour", Pedido.created_at))
    )
    rows = (await db.execute(query)).all()
    return [
        {"hora": f"{int(r.hora):02d}:00", "total": round(float(r.total), 2)}
        for r in rows
    ]


async def estadisticas_resumen(db: AsyncSession, restaurante_id: int, periodo: str = "hoy") -> dict:
    """Genera todas las estadísticas para un periodo: 'hoy', 'semana' o 'mes'."""
    fin = datetime.now()
    
    if periodo == "semana":
        inicio = fin - timedelta(days=7)
    elif periodo == "mes":
        inicio = fin - timedelta(days=30)
    else: # hoy
        inicio = datetime.combine(date.today(), datetime.min.time())

    resumen = await _ventas_resumen(db, restaurante_id, inicio, fin)
    top = await _top_items(db, restaurante_id, inicio, fin)
    por_categoria = await _ventas_por_categoria(db, restaurante_id, inicio, fin)
    por_hora = await _ventas_por_hora(db, restaurante_id, inicio, fin)
    
    return {
        **resumen, 
        "top_items": top, 
        "ventas_por_categoria": por_categoria,
        "ventas_por_hora": por_hora
    }
