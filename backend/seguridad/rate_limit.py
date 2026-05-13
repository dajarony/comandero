"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: seguridad/rate_limit.py
Tipo: Middleware → Rate Limiting simple en memoria
Líneas: ~50 / 200 MAX
Dependencias: 2 (fastapi, time)

S (Setup): Diccionario en memoria con IP → intentos.
U (Use):   check_rate_limit() — dependency de FastAPI.
M (Manage): Limpia entradas expiradas automáticamente.
E (Error):  HTTPException 429 si se excede el límite.

Última Modificación: 2026-03-17 | Auditoría
Cambio: Implementación inicial para proteger auth endpoints.
═══════════════════════════════════════════════════════════
"""

import time
from collections import defaultdict
from fastapi import Request, HTTPException

# Almacén en memoria: IP → lista de timestamps
_attempts: dict[str, list[float]] = defaultdict(list)

# Configuración: máx 10 intentos por ventana de 60 segundos
MAX_ATTEMPTS = 10
WINDOW_SECONDS = 60


async def check_rate_limit(request: Request) -> None:
    """Dependency que limita intentos de login/registro por IP."""
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    cutoff = now - WINDOW_SECONDS

    # Limpiar intentos antiguos
    _attempts[client_ip] = [t for t in _attempts[client_ip] if t > cutoff]

    if len(_attempts[client_ip]) >= MAX_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail=f"Demasiados intentos. Espera {WINDOW_SECONDS}s.",
        )

    _attempts[client_ip].append(now)
