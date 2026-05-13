"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: entradas/routers/menu.py
Tipo: Adaptador HTTP → Menú/Carta
Líneas: ~35 / 200 MAX
Dependencias: 3 (fastapi, database, menu_service)

Rutas:
  GET  /menu/categorias   → Listar categorías
  GET  /menu/items        → Listar items (filtro por categoría)
  POST /menu/items        → Crear item (admin)
  PUT  /menu/items/{id}   → Actualizar item (admin)

Última Modificación: 2026-03-10 | Dajarony
Cambio: Reescrito para usar menu_service centralizado.
═══════════════════════════════════════════════════════════
"""

from fastapi import APIRouter, Depends, Query, UploadFile, File, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import time

from database import get_db
from contratos.menu import CategoriaResponse, ItemMenuCreate, ItemMenuResponse, ItemMenuUpdate
from contratos.respuesta import ApiResponse
from logica.menu_service import listar_categorias, listar_items, crear_item, actualizar_item
from logica.servicios.menu_ingest_service import procesar_csv_y_guardar
from seeds.seed_data import force_reseed_menu
from seguridad.deps import get_current_user, require_admin
from modelos.usuario import Usuario

router = APIRouter()


@router.get("/categorias", response_model=ApiResponse[list[CategoriaResponse]])
async def endpoint_categorias(
    db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Lista todas las categorías del menú."""
    cats = await listar_categorias(db, user.restaurante_id)
    return ApiResponse(success=True, data=cats)


@router.get("/items", response_model=ApiResponse[list[ItemMenuResponse]])
async def endpoint_items(
    categoria_id: Optional[int] = Query(None, description="Filtrar por categoría"),
    db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Lista items del menú (filtrar opcionalmente por categoría)."""
    items = await listar_items(db, user.restaurante_id, categoria_id)
    return ApiResponse(success=True, data=items)


@router.post("/items", response_model=ApiResponse[ItemMenuResponse], status_code=201)
async def endpoint_crear_item(
    datos: ItemMenuCreate,
    db: AsyncSession = Depends(get_db),
    admin: Usuario = Depends(require_admin),
):
    """Crea nuevo item en el menú (solo admin)."""
    item = await crear_item(db, datos, admin.restaurante_id)
    return ApiResponse(success=True, data=item)


@router.put("/items/{item_id}", response_model=ApiResponse[ItemMenuResponse])
async def endpoint_actualizar_item(
    item_id: int,
    datos: ItemMenuUpdate,
    db: AsyncSession = Depends(get_db),
    admin: Usuario = Depends(require_admin),
):
    """Actualiza un item del menú (solo admin)."""
    item = await actualizar_item(db, item_id, datos, admin.restaurante_id)
    return ApiResponse(success=True, data=item)


@router.post("/reseed", response_model=ApiResponse[dict])
async def endpoint_reseed_menu(
    db: AsyncSession = Depends(get_db),
    admin: Usuario = Depends(require_admin),
):
    """Borra menú viejo y recarga bebidas/vinos (solo admin)."""
    resultado = await force_reseed_menu(db, admin.restaurante_id)
    return ApiResponse(success=True, data=resultado)


@router.post("/ingestar", response_model=ApiResponse[dict], status_code=201)
async def endpoint_ingestar_csv(
    archivo: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin: Usuario = Depends(require_admin),
):
    """Ingesta CSV: parsea, categoriza con IA y guarda en DB."""
    contenido = await archivo.read()
    resultado = await procesar_csv_y_guardar(contenido, db, admin.restaurante_id)
    return ApiResponse(success=True, data=resultado)
# Rate limit simple en memoria (10 peticiones por minuto por IP)
_rate_limits = {}

def check_rate_limit(request: Request):
    ip = request.client.host
    now = time.time()
    if ip not in _rate_limits:
        _rate_limits[ip] = []
    _rate_limits[ip] = [t for t in _rate_limits[ip] if now - t < 60]
    if len(_rate_limits[ip]) >= 20: # Aumentado a 20 para ser generoso en la demo
        raise HTTPException(status_code=429, detail="Demasiadas peticiones. Intenta de nuevo en un minuto.")
    _rate_limits[ip].append(now)

@router.get("/public/{restaurante_id}", response_model=ApiResponse[dict])
async def endpoint_menu_publico(
    restaurante_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Obtiene categorías e items del menú de forma pública (para clientes QR)."""
    check_rate_limit(request)
    
    cats = await listar_categorias(db, restaurante_id)
    items = await listar_items(db, restaurante_id)
    
    return ApiResponse(success=True, data={
        "categorias": cats,
        "items": items
    })
