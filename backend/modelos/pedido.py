"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: modelos/pedido.py
Tipo: Modelo ORM → Pedido + LineaPedido
Líneas: ~65 / 200 MAX
Dependencias: 2 (sqlalchemy, base)

Modelos:
- Pedido: id, mesa_id, usuario_id, estado, total,
          notas, created_at
- LineaPedido: id, pedido_id, item_menu_id, cantidad,
               precio_unitario, nota

Estados de Pedido: ABIERTO | RETENIDO | MARCHADO | LISTO | CERRADO

Relaciones:
- Pedido → mesa (N:1), usuario (N:1), lineas (1:N)
- LineaPedido → pedido (N:1), item_menu (N:1)

Última Modificación: 2026-03-10 | Dajarony
Cambio: Implementación inicial.
═══════════════════════════════════════════════════════════
"""

from sqlalchemy import String, Integer, Float, ForeignKey, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional
from .base import Base


class Pedido(Base):
    __tablename__ = "pedidos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    restaurante_id: Mapped[int] = mapped_column(ForeignKey("restaurantes.id"), nullable=False, index=True)
    mesa_id: Mapped[int] = mapped_column(ForeignKey("mesas.id"), nullable=False, index=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False, index=True)
    estado: Mapped[str] = mapped_column(String(20), default="ABIERTO")
    destino: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    total: Mapped[float] = mapped_column(Float, default=0.0)
    propina: Mapped[float] = mapped_column(Float, default=0.0)
    descuento: Mapped[float] = mapped_column(Float, default=0.0)
    metodo_pago: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    notas: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    impreso_en: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relaciones
    restaurante: Mapped["Restaurante"] = relationship("Restaurante", back_populates="pedidos")
    mesa: Mapped["Mesa"] = relationship("Mesa", back_populates="pedidos")
    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="pedidos")
    lineas: Mapped[list["LineaPedido"]] = relationship(
        "LineaPedido", back_populates="pedido", cascade="all, delete-orphan"
    )


class LineaPedido(Base):
    __tablename__ = "lineas_pedido"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    restaurante_id: Mapped[int] = mapped_column(ForeignKey("restaurantes.id"), nullable=False, index=True)
    pedido_id: Mapped[int] = mapped_column(ForeignKey("pedidos.id"), nullable=False, index=True)
    item_menu_id: Mapped[int] = mapped_column(ForeignKey("menu_items.id"), nullable=False, index=True)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    precio_unitario: Mapped[float] = mapped_column(Float, nullable=False)
    nota: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)

    # Relaciones
    pedido: Mapped["Pedido"] = relationship("Pedido", back_populates="lineas")
    item_menu: Mapped["MenuItem"] = relationship("MenuItem", back_populates="lineas_pedido")
