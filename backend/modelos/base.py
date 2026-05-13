"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: modelos/base.py
Tipo: Infraestructura → Base ORM
Líneas: ~15 / 200 MAX
Dependencias: 1 (sqlalchemy)

Acciones:
- Define DeclarativeBase compartida para todos los modelos ORM
- Centraliza la metadata de SQLAlchemy

Última Modificación: 2026-03-10 | Dajarony
Cambio: Implementación inicial.
═══════════════════════════════════════════════════════════
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base declarativa compartida para todos los modelos ORM."""
    pass
