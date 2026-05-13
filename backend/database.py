"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: database.py
Tipo: Configuración → Conexión DB
Líneas: ~55 / 200 MAX
Dependencias: 2 (sqlalchemy, config)

Acciones:
- Crea el engine async para Neon PostgreSQL
- Limpia sslmode del URL (asyncpg no lo soporta como param)
- Configura SSL nativo para Neon
- Provee fábrica de sesiones async

Última Modificación: 2026-03-10 | Dajarony
Cambio: Fix SSL handling para compatibilidad con Neon + asyncpg.
═══════════════════════════════════════════════════════════
"""

import ssl
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from config import get_settings

settings = get_settings()


def _build_engine():
    """Construye el engine con SSL apropiado para Neon."""
    url = settings.DATABASE_URL

    # asyncpg no soporta ?sslmode=require como query param
    # Lo removemos y configuramos SSL nativamente
    clean_url = url.split("?")[0] if "?" in url else url

    connect_args = {}
    if "neon" in url or "sslmode" in url:
        ssl_ctx = ssl.create_default_context()
        connect_args["ssl"] = ssl_ctx

    return create_async_engine(
        clean_url,
        echo=(settings.APP_ENV == "development"),
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        connect_args=connect_args,
    )


engine = _build_engine()

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:
    """Genera sesión DB para inyección de dependencias."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
