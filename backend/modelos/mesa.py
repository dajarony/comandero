"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: modelos/mesa.py
Tipo: Modelo ORM → Mesa
Líneas: ~40 / 200 MAX
Dependencias: 2 (sqlalchemy, base)

Campos:
- id, numero (string único), estado, comensales,
  hora_apertura, total_cuenta, nota

Relaciones:
- pedidos: Una mesa tiene muchos pedidos

Estados posibles: LIBRE | OCUPADA | PENDIENTE_COBRO

Última Modificación: 2026-03-10 | Dajarony
Cambio: Implementación inicial.
═══════════════════════════════════════════════════════════
"""

from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional
from .base import Base


class Mesa(Base):
    __tablename__ = "mesas"
    __table_args__ = (
        UniqueConstraint('restaurante_id', 'numero', name='uix_restaurante_numero'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    restaurante_id: Mapped[int] = mapped_column(ForeignKey("restaurantes.id"), nullable=False, index=True)
    numero: Mapped[str] = mapped_column(String(10), nullable=False)
    estado: Mapped[str] = mapped_column(String(20), default="LIBRE")
    comensales: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    hora_apertura: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    total_cuenta: Mapped[float] = mapped_column(Float, default=0.0)
    nota: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)

    # Relaciones
    restaurante: Mapped["Restaurante"] = relationship("Restaurante", back_populates="mesas")
    pedidos: Mapped[list["Pedido"]] = relationship("Pedido", back_populates="mesa", cascade="all, delete-orphan")
