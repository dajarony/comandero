"""Rutas del móvil impresora de cocina (modo Comandero, sala y cocina)."""

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, StringConstraints
from sqlalchemy.ext.asyncio import AsyncSession

from contratos.pedido import PedidoResponse
from contratos.respuesta import ApiResponse
from database import get_db
from logica.impresora_service import (
    ImpresoraEstado, activar_impresora, estado_impresora, liberar_impresora, marcar_impresa, rondas_sin_imprimir,
)
from modelos.usuario import Usuario
from seguridad.deps import require_local_comandero
from seguridad.socket_manager import socket_manager

router = APIRouter()

DispositivoId = Annotated[str, StringConstraints(strip_whitespace=True, min_length=8, max_length=64)]


class Activacion(BaseModel):
    dispositivo_id: DispositivoId
    nombre: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]
    reemplazar: bool = False


class Dispositivo(BaseModel):
    dispositivo_id: DispositivoId


class Impresion(BaseModel):
    pedido_id: int
    impreso_en: datetime


async def _avisar_cambio(restaurante_id: int, estado: ImpresoraEstado) -> None:
    await socket_manager.broadcast(restaurante_id, {
        "event": "PRINTER_STATION_CHANGED", "dispositivo_id": estado.dispositivo_id, "nombre": estado.nombre,
    })


@router.get("", response_model=ApiResponse[ImpresoraEstado])
async def endpoint_estado(db: AsyncSession = Depends(get_db), user: Usuario = Depends(require_local_comandero)):
    return ApiResponse(success=True, data=await estado_impresora(db, user.restaurante_id))


@router.put("", response_model=ApiResponse[ImpresoraEstado])
async def endpoint_activar(
    datos: Activacion, db: AsyncSession = Depends(get_db), user: Usuario = Depends(require_local_comandero),
):
    estado, cambio = await activar_impresora(
        db, user.restaurante_id, datos.dispositivo_id, datos.nombre, datos.reemplazar,
    )
    if cambio:
        await _avisar_cambio(user.restaurante_id, estado)
    return ApiResponse(success=True, data=estado)


@router.post("/liberar", response_model=ApiResponse[ImpresoraEstado])
async def endpoint_liberar(
    datos: Dispositivo, db: AsyncSession = Depends(get_db), user: Usuario = Depends(require_local_comandero),
):
    estado = await liberar_impresora(db, user.restaurante_id, datos.dispositivo_id, user.rol == "ADMIN")
    await _avisar_cambio(user.restaurante_id, estado)
    return ApiResponse(success=True, data=estado)


@router.get("/pendientes", response_model=ApiResponse[list[PedidoResponse]])
async def endpoint_pendientes(
    dispositivo_id: Annotated[str, Query(min_length=8, max_length=64)],
    db: AsyncSession = Depends(get_db), user: Usuario = Depends(require_local_comandero),
):
    return ApiResponse(success=True, data=await rondas_sin_imprimir(db, user.restaurante_id, dispositivo_id))


@router.post("/rondas/{pedido_id}/impresa", response_model=ApiResponse[Impresion])
async def endpoint_impresa(
    pedido_id: int, datos: Dispositivo,
    db: AsyncSession = Depends(get_db), user: Usuario = Depends(require_local_comandero),
):
    impreso_en = await marcar_impresa(db, user.restaurante_id, pedido_id, datos.dispositivo_id)
    return ApiResponse(success=True, data=Impresion(pedido_id=pedido_id, impreso_en=impreso_en))
