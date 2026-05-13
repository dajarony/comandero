"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: modelos/__init__.py
Tipo: Modelos → Registro central
Líneas: ~15 / 200 MAX
Dependencias: Todos los modelos ORM

Acciones:
- Importa todos los modelos para que SQLAlchemy los registre
- Facilita imports limpios desde otros módulos

Última Modificación: 2026-04-03 | Dajarony
Cambio: Añade modelo Gasto al registro central.
═══════════════════════════════════════════════════════════
"""

from .base import Base
from .usuario import Usuario
from .mesa import Mesa
from .menu import Categoria, MenuItem
from .pedido import Pedido, LineaPedido
from .restaurante import Restaurante
from .gasto import Gasto
from .idempotency import IdempotencyRecord

__all__ = ["Base", "Usuario", "Mesa", "Categoria", "MenuItem", "Pedido", "LineaPedido", "Restaurante", "Gasto", "IdempotencyRecord"]
