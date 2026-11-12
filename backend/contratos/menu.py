"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: contratos/menu.py
Tipo: Contrato → Schemas de Menú
Líneas: ~40 / 200 MAX
Dependencias: 1 (pydantic)

Entradas/Salidas:
- CategoriaResponse: Categoría con su emoji y orden.
- ItemMenuCreate: Payload para crear un item del menú.
- ItemMenuResponse: Item completo con categoría incluida.

Última Modificación: 2026-03-10 | Dajarony
Cambio: Implementación inicial de contratos de menú.
═══════════════════════════════════════════════════════════
"""

from pydantic import BaseModel, Field
from typing import Optional


class CategoriaResponse(BaseModel):
    id: int
    nombre: str
    emoji: str
    orden: int

    model_config = {"from_attributes": True}


class ItemMenuCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=200)
    descripcion: Optional[str] = None
    precio: float = Field(..., ge=0)
    emoji: str = "🍽️"
    categoria_id: int
    disponible: bool = True


class ItemMenuResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    precio: float
    emoji: str
    disponible: bool
    categoria_id: int
    categoria_nombre: Optional[str] = None

    model_config = {"from_attributes": True}


class ItemMenuUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = Field(default=None, ge=0)
    emoji: Optional[str] = None
    disponible: Optional[bool] = None
    categoria_id: Optional[int] = None
