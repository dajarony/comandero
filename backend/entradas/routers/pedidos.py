"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: entradas/routers/pedidos.py
Tipo: Adaptador HTTP → Pedidos/Comandas
Líneas: ~80 / 200 MAX
Dependencias: 5 (fastapi, database, pedido_service, printer_service, Response)

Rutas (ORDEN IMPORTANTE: estáticas antes que /{id}):
  POST /pedidos                    → Crear pedido nuevo
  GET  /pedidos/historial          → Historial pedidos cerrados
  GET  /pedidos/cocina/pendientes  → Pedidos en cocina (MARCHADO/LISTO)
  GET  /pedidos/mesa/{id}          → Listar pedidos de una mesa
  GET  /pedidos/{id}               → Obtener un pedido
  PUT  /pedidos/{id}/marchar       → Marchar pedido (con destino)
  PUT  /pedidos/{id}/retener       → Retener pedido
  PUT  /pedidos/{id}/liberar       → Liberar pedido retenido
  PUT  /pedidos/{id}/cerrar        → Cerrar pedido
  PUT  /pedidos/{id}/completar     → Marcar pedido como LISTO (cocina)
  POST /pedidos/{id}/lineas        → Añadir líneas a pedido existente
  GET  /pedidos/{id}/ticket        → Ticket texto plano ESC/POS

Última Modificación: 2026-04-02 | Fix rutas estáticas antes de dinámicas
═══════════════════════════════════════════════════════════
"""

from typing import Literal
from fastapi import APIRouter, Depends, Header, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from datetime import date
from database import get_db
from contratos.pedido import PedidoCreate, PedidoResponse, LineasAdd, PedidoCerrar
from contratos.respuesta import ApiResponse
from logica.pedido_service import (
    crear_pedido, obtener_pedido, listar_por_mesa, marchar_pedido, cerrar_pedido,
    retener_pedido, liberar_pedido, obtener_pedido_completo, agregar_lineas,
    listar_pedidos_cocina, completar_pedido_cocina, listar_historial_pedidos,
    eliminar_linea,
)
from logica.servicios.printer_service import generar_ticket_texto
from logica.idempotency_service import ejecutar_idempotente
from seguridad.deps import get_current_user
from modelos.usuario import Usuario

router = APIRouter()


@router.post("", response_model=ApiResponse[PedidoResponse], status_code=201)
async def endpoint_crear_pedido(
    datos: PedidoCreate,
    idempotency_key: str | None = Header(None, alias="X-Idempotency-Key"),
    db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Crea un pedido nuevo vinculado a una mesa."""
    pedido = await ejecutar_idempotente(
        db,
        idempotency_key,
        user.restaurante_id,
        "POST",
        "/pedidos",
        lambda: crear_pedido(db, datos, user.id, user.restaurante_id),
    )
    return ApiResponse(success=True, data=pedido)


# ── Rutas ESTÁTICAS primero (deben ir ANTES de /{pedido_id}) ──────────────────

@router.get("/historial", response_model=ApiResponse[list[PedidoResponse]])
async def endpoint_historial(
    fecha_inicio: date | None = Query(None),
    fecha_fin: date | None = Query(None),
    usuario_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Obtiene el historial de pedidos cerrados."""
    pedidos = await listar_historial_pedidos(db, user.restaurante_id, fecha_inicio, fecha_fin, usuario_id)
    return ApiResponse(success=True, data=pedidos)


@router.get("/cocina/pendientes", response_model=ApiResponse[list[PedidoResponse]])
async def endpoint_listar_cocina(
    db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Lista pedidos actualmente en preparación (estado MARCHADO o LISTO)."""
    pedidos = await listar_pedidos_cocina(db, user.restaurante_id)
    return ApiResponse(success=True, data=pedidos)


@router.get("/mesa/{mesa_id}", response_model=ApiResponse[list[PedidoResponse]])
async def endpoint_pedidos_mesa(
    mesa_id: int,
    db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Lista todos los pedidos de una mesa."""
    pedidos = await listar_por_mesa(db, mesa_id, user.restaurante_id)
    return ApiResponse(success=True, data=pedidos)


# ── Rutas DINÁMICAS con /{pedido_id} ─────────────────────────────────────────

@router.get("/{pedido_id}", response_model=ApiResponse[PedidoResponse])
async def endpoint_obtener_pedido(
    pedido_id: int,
    db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Obtiene un pedido con sus líneas."""
    pedido = await obtener_pedido(db, pedido_id, user.restaurante_id)
    return ApiResponse(success=True, data=pedido)


@router.put("/{pedido_id}/marchar", response_model=ApiResponse[PedidoResponse])
async def endpoint_marchar(
    pedido_id: int,
    destino: Literal["COCINA", "BARRA"] = Query("COCINA", description="Destino: COCINA o BARRA"),
    idempotency_key: str | None = Header(None, alias="X-Idempotency-Key"),
    db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Marca pedido como MARCHADO con destino."""
    pedido = await ejecutar_idempotente(
        db,
        idempotency_key,
        user.restaurante_id,
        "PUT",
        f"/pedidos/{pedido_id}/marchar",
        lambda: marchar_pedido(db, pedido_id, user.restaurante_id, destino),
    )
    return ApiResponse(success=True, data=pedido)


@router.put("/{pedido_id}/retener", response_model=ApiResponse[PedidoResponse])
async def endpoint_retener(
    pedido_id: int,
    idempotency_key: str | None = Header(None, alias="X-Idempotency-Key"),
    db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Retiene pedido (ABIERTO → RETENIDO)."""
    pedido = await ejecutar_idempotente(
        db,
        idempotency_key,
        user.restaurante_id,
        "PUT",
        f"/pedidos/{pedido_id}/retener",
        lambda: retener_pedido(db, pedido_id, user.restaurante_id),
    )
    return ApiResponse(success=True, data=pedido)


@router.put("/{pedido_id}/liberar", response_model=ApiResponse[PedidoResponse])
async def endpoint_liberar_pedido(
    pedido_id: int,
    idempotency_key: str | None = Header(None, alias="X-Idempotency-Key"),
    db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Libera pedido retenido (RETENIDO → ABIERTO)."""
    pedido = await ejecutar_idempotente(
        db,
        idempotency_key,
        user.restaurante_id,
        "PUT",
        f"/pedidos/{pedido_id}/liberar",
        lambda: liberar_pedido(db, pedido_id, user.restaurante_id),
    )
    return ApiResponse(success=True, data=pedido)


@router.put("/{pedido_id}/cerrar", response_model=ApiResponse[PedidoResponse])
async def endpoint_cerrar(
    pedido_id: int,
    datos: PedidoCerrar,
    idempotency_key: str | None = Header(None, alias="X-Idempotency-Key"),
    db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Marca pedido como CERRADO (completado) con propina opcional."""
    pedido = await ejecutar_idempotente(
        db,
        idempotency_key,
        user.restaurante_id,
        "PUT",
        f"/pedidos/{pedido_id}/cerrar",
        lambda: cerrar_pedido(db, pedido_id, user.restaurante_id, datos),
    )
    return ApiResponse(success=True, data=pedido)


@router.put("/{pedido_id}/completar", response_model=ApiResponse[PedidoResponse])
async def endpoint_completar_cocina(
    pedido_id: int,
    idempotency_key: str | None = Header(None, alias="X-Idempotency-Key"),
    db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Marca un pedido como LISTO (cocina terminó de prepararlo)."""
    pedido = await ejecutar_idempotente(
        db,
        idempotency_key,
        user.restaurante_id,
        "PUT",
        f"/pedidos/{pedido_id}/completar",
        lambda: completar_pedido_cocina(db, pedido_id, user.restaurante_id),
    )
    return ApiResponse(success=True, data=pedido)


@router.post("/{pedido_id}/lineas", response_model=ApiResponse[PedidoResponse])
async def endpoint_agregar_lineas(
    pedido_id: int,
    datos: LineasAdd,
    idempotency_key: str | None = Header(None, alias="X-Idempotency-Key"),
    db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Añade líneas a un pedido ABIERTO o RETENIDO (continuar persona)."""
    pedido = await ejecutar_idempotente(
        db,
        idempotency_key,
        user.restaurante_id,
        "POST",
        f"/pedidos/{pedido_id}/lineas",
        lambda: agregar_lineas(db, pedido_id, datos, user.restaurante_id),
    )
    return ApiResponse(success=True, data=pedido)


@router.delete("/{pedido_id}/lineas/{linea_id}", response_model=ApiResponse[PedidoResponse])
async def endpoint_eliminar_linea(
    pedido_id: int,
    linea_id: int,
    idempotency_key: str | None = Header(None, alias="X-Idempotency-Key"),
    db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Elimina una línea de un pedido ABIERTO o RETENIDO."""
    pedido = await ejecutar_idempotente(
        db,
        idempotency_key,
        user.restaurante_id,
        "DELETE",
        f"/pedidos/{pedido_id}/lineas/{linea_id}",
        lambda: eliminar_linea(db, pedido_id, linea_id, user.restaurante_id),
    )
    return ApiResponse(success=True, data=pedido)


@router.get("/{pedido_id}/ticket")
async def endpoint_ticket(
    pedido_id: int,
    db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Genera ticket texto plano 32 cols para impresora."""
    datos = await obtener_pedido_completo(db, pedido_id, user.restaurante_id)
    texto = generar_ticket_texto(datos, datos["mesa_numero"], user.nombre)
    return Response(content=texto, media_type="text/plain")
