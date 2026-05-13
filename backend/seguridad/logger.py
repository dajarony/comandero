"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: seguridad/logger.py
Tipo: Seguridad → Logger Centralizado
Líneas: ~35 / 200 MAX
Dependencias: 1 (logging, config)

Acciones:
- Configura un logger estándar unificado
- Nivel de log configurable via LOG_LEVEL en .env
- Formato consistente: timestamp - nombre - nivel - mensaje

Última Modificación: 2026-03-10 | Dajarony
Cambio: Añade nivel configurable y alias obtener_logger.
═══════════════════════════════════════════════════════════
"""

import logging
import sys
from functools import lru_cache


@lru_cache(maxsize=32)
def obtener_logger(name: str) -> logging.Logger:
    """Configura y retorna un logger estándar unificado."""
    logger = logging.getLogger(f"comandero.{name}")

    if not logger.handlers:
        # Importación lazy para evitar circular
        try:
            from config import get_settings
            level = getattr(logging, get_settings().LOG_LEVEL.upper(), logging.INFO)
        except Exception:
            level = logging.INFO

        logger.setLevel(level)
        formatter = logging.Formatter(
            "%(asctime)s | %(name)s | %(levelname)s | %(message)s",
            datefmt="%H:%M:%S",
        )
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

    return logger


# Alias para compatibilidad con código existente
get_logger = obtener_logger
