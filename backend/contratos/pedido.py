"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: contratos/pedido.py
Tipo: Contrato → Schemas de Pedido/Comanda
Líneas: ~45 / 200 MAX
Dependencias: 1 (pydantic)

Entradas/Salidas:
- PedidoEstado: Enum del ciclo de vida del pedido.
- LineaPedidoCreate: Una línea del carrito (item + cantidad + nota).
- PedidoCreate: Payload completo para crear un pedido.
- PedidoResponse: Pedido con sus líneas incluidas.

Última Modificación: 2026-03-10 | Dajarony
Cambio: Implementación inicial de contratos de pedido.
═══════════════════════════════════════════════════════════
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime


class PedidoEstado(str, Enum):
    ABIERTO = "ABIERTO"
    RETENIDO = "RETENIDO"
    MARCHADO = "MARCHADO"
    LISTO = "LISTO"
    CERRADO = "CERRADO"


class LineaPedidoCreate(BaseModel):
    item_menu_id: int
    cantidad: int = Field(..., ge=1)
    nota: Optional[str] = None


class PedidoCreate(BaseModel):
    mesa_id: int
    lineas: List[LineaPedidoCreate] = Field(..., min_length=1)
    notas: Optional[str] = None


class LineaPedidoResponse(BaseModel):
    id: int
    item_menu_id: int
    item_nombre: Optional[str] = None
    item_emoji: Optional[str] = None
    cantidad: int
    precio_unitario: float
    nota: Optional[str]

    model_config = {"from_attributes": True}


class LineasAdd(BaseModel):
    """Payload para añadir líneas a un pedido existente."""
    lineas: List[LineaPedidoCreate] = Field(..., min_length=1)


class PedidoResponse(BaseModel):
    id: int
    mesa_id: int
    mesa_numero: Optional[str] = None
    usuario_id: int
    estado: PedidoEstado
    destino: Optional[str] = None
    total: float
    propina: float = 0.0
    descuento: float = 0.0
    metodo_pago: Optional[str] = None
    notas: Optional[str]
    created_at: Optional[datetime] = None
    lineas: List[LineaPedidoResponse] = []

    model_config = {"from_attributes": True}

class PedidoCerrar(BaseModel):
    """Payload para cerrar un pedido con propina, descuento y método de pago."""
    propina: float = Field(0.0, ge=0.0)
    descuento: float = Field(0.0, ge=0.0)
    metodo_pago: str = "EFECTIVO"
