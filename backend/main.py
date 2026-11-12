"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: main.py
Tipo: Punto de entrada → FastAPI Application
Líneas: ~75 / 200 MAX
Dependencias: 6 (fastapi, uvicorn, database, routers,
                  excepciones, seed_data)

Acciones:
- Inicializa la app FastAPI con título y versión
- Configura CORS desde .env
- Registra middleware global de excepciones
- Registra todos los routers bajo /api/v1
- Crea tablas en DB al arrancar
- Ejecuta seed de datos iniciales si DB vacía
- Expone /health para verificación

Última Modificación: 2026-04-03 | Dajarony
Cambio: Añadidos routers gastos e IA (GPT-4o).
═══════════════════════════════════════════════════════════
"""

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from sqlalchemy import text
from config import get_settings
from database import engine, AsyncSessionLocal
from modelos import Base
from entradas.routers import auth, comandero, impresora, mesas, menu, pedidos, stats, ws_kitchen, usuarios, restaurante, gastos, ia
from seguridad.deps import require_tpv
from seguridad.excepciones import AppException, global_exception_handler
from seguridad.logger import obtener_logger
from seeds.seed_data import seed_all

logger = obtener_logger("main")
settings = get_settings()

app = FastAPI(
    title="Comandero Digital API — DAJARONY",
    description="Backend TPV: gestión de mesas, menú, pedidos y autenticación",
    version="1.0.0",
    redirect_slashes=False,   # Evita redirects http→https en Cloud Run (SSL termination)
)

# ── Middleware Global de Excepciones ─────────────────────
app.add_exception_handler(AppException, global_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# ── CORS (configurable desde .env) ───────────────────────
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
use_credentials = "*" not in origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=use_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────
app.include_router(auth.router,    prefix="/api/v1/auth",    tags=["Auth"])
app.include_router(mesas.router,   prefix="/api/v1/mesas",   tags=["Mesas"])
app.include_router(menu.router,    prefix="/api/v1/menu",    tags=["Menú"])
app.include_router(pedidos.router, prefix="/api/v1/pedidos", tags=["Pedidos"])
app.include_router(comandero.router, prefix="/api/v1/comandero", tags=["Comandero"])
app.include_router(impresora.router, prefix="/api/v1/comandero/impresora", tags=["Comandero"])
app.include_router(stats.router,   prefix="/api/v1/stats",   tags=["Stats"], dependencies=[Depends(require_tpv)])
app.include_router(usuarios.router, prefix="/api/v1/usuarios", tags=["Usuarios"])
app.include_router(ws_kitchen.router, prefix="/api/v1/ws", tags=["WebSockets"])
app.include_router(restaurante.router, prefix="/api/v1/restaurante", tags=["Restaurante"])
app.include_router(gastos.router,     prefix="/api/v1/gastos",      tags=["Gastos"], dependencies=[Depends(require_tpv)])
app.include_router(ia.router,         prefix="/api/v1/ia",          tags=["IA"], dependencies=[Depends(require_tpv)])


# ── Eventos de ciclo de vida ──────────────────────────────
@app.on_event("startup")
async def startup_event():
    """Crea tablas y ejecuta seed si la DB está vacía."""
    logger.info("═══ Arrancando Comandero Digital API v1.0 ═══")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text("ALTER TABLE restaurantes ADD COLUMN IF NOT EXISTS modo VARCHAR(12) NOT NULL DEFAULT 'TPV'"))
        await conn.execute(text("ALTER TABLE mesas ADD COLUMN IF NOT EXISTS turno INTEGER NOT NULL DEFAULT 0"))
        await conn.execute(text("ALTER TABLE restaurantes ADD COLUMN IF NOT EXISTS impresora_dispositivo VARCHAR(64)"))
        await conn.execute(text("ALTER TABLE restaurantes ADD COLUMN IF NOT EXISTS impresora_nombre VARCHAR(50)"))
        await conn.execute(text("ALTER TABLE restaurantes ADD COLUMN IF NOT EXISTS impresora_desde TIMESTAMP"))
        await conn.execute(text("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS impreso_en TIMESTAMP"))
    logger.info("Tablas DB verificadas/creadas")

    # Migration: add nota column to mesas if missing
    try:
        async with engine.begin() as conn:
            await conn.execute(text(
                "ALTER TABLE mesas ADD COLUMN IF NOT EXISTS nota VARCHAR(300)"
            ))
        logger.info("Migration: columna 'nota' verificada en mesas")
    except Exception:
        logger.warning("Migration nota: tabla mesas aún no existe o error")

    # Migration: add destino column to pedidos if missing
    try:
        async with engine.begin() as conn:
            await conn.execute(text(
                "ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS destino VARCHAR(20)"
            ))
            await conn.execute(text(
                "ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS propina FLOAT DEFAULT 0.0"
            ))
        logger.info("Migration: columna 'destino' y 'propina' verificada en pedidos")
    except Exception as e:
        logger.warning(f"Migration error: {e}")

    # Seed de datos iniciales
    async with AsyncSessionLocal() as session:
        await seed_all(session)

    logger.info("═══ Servidor listo ═══")


# ── Health check ──────────────────────────────────────────
@app.get("/health", tags=["Sistema"])
def health_check():
    """Verificación de estado del servidor."""
    return {"status": "ok", "version": "1.0.0", "service": "Comandero Digital"}


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
