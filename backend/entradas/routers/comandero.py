from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel, Field, StringConstraints
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from contratos.menu import CategoriaResponse
from contratos.mesa import MesaResponse
from contratos.pedido import PedidoCreate, PedidoResponse
from contratos.respuesta import ApiResponse
from database import get_db
from logica.comandero_service import cerrar_servicio, enviar_ronda, guardar_nuevo
from logica.idempotency_service import ejecutar_ronda_idempotente
from logica.pedido_helpers import pedido_a_response
from modelos.menu import Categoria
from modelos.mesa import Mesa
from modelos.pedido import Pedido
from modelos.usuario import Usuario
from seguridad.deps import require_admin, require_comandero
from seguridad.socket_manager import socket_manager

router = APIRouter(dependencies=[Depends(require_comandero)])


class RondaCreate(PedidoCreate):
    turno: int = Field(ge=0)


class Turno(BaseModel):
    turno: int = Field(ge=0)


class MesaCreate(BaseModel):
    numero: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=10)]


class CategoriaCreate(BaseModel):
    nombre: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]


@router.post("/rondas", response_model=ApiResponse[PedidoResponse], status_code=201)
async def endpoint_enviar_ronda(
    datos: RondaCreate,
    idempotency_key: Annotated[str, Header(alias="X-Idempotency-Key")],
    db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(require_comandero),
):
    restaurante_id = user.restaurante_id
    pedido, nuevo = await ejecutar_ronda_idempotente(
        db, idempotency_key, restaurante_id,
        lambda: enviar_ronda(db, datos, datos.turno, user.id, restaurante_id),
    )
    if nuevo:
        await socket_manager.broadcast(restaurante_id, {
            "event": "ORDER_MARCHADO", "pedido": pedido.model_dump(mode="json"),
        })
    else:
        pedido = await pedido_a_response(db, PedidoResponse.model_validate(pedido).id, restaurante_id)
    return ApiResponse(success=True, data=pedido)


@router.get("/rondas", response_model=ApiResponse[list[PedidoResponse]])
async def endpoint_rondas_activas(
    db: AsyncSession = Depends(get_db), user: Usuario = Depends(require_comandero),
):
    restaurante_id = user.restaurante_id
    ids = await db.scalars(select(Pedido.id).where(
        Pedido.restaurante_id == restaurante_id, Pedido.estado.in_(("MARCHADO", "LISTO")),
    ).order_by(Pedido.id.desc()))
    rondas = [await pedido_a_response(db, pedido_id, restaurante_id) for pedido_id in ids]
    return ApiResponse(success=True, data=rondas)


@router.post("/mesas/{mesa_id}/cerrar", response_model=ApiResponse[MesaResponse])
async def endpoint_cerrar_mesa(
    mesa_id: int, datos: Turno, db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(require_comandero),
):
    restaurante_id = user.restaurante_id
    mesa = await cerrar_servicio(db, mesa_id, restaurante_id, datos.turno)
    await socket_manager.broadcast(restaurante_id, {"event": "TABLE_CLOSED", "mesa_id": mesa_id})
    return ApiResponse(success=True, data=mesa)


@router.post("/mesas", response_model=ApiResponse[MesaResponse], status_code=201)
async def endpoint_crear_mesa(
    datos: MesaCreate, db: AsyncSession = Depends(get_db), admin: Usuario = Depends(require_admin),
):
    mesa = Mesa(numero=datos.numero, restaurante_id=admin.restaurante_id)
    await guardar_nuevo(db, mesa, "Ya existe una mesa con ese nombre")
    return ApiResponse(success=True, data=MesaResponse.model_validate(mesa))


@router.post("/categorias", response_model=ApiResponse[CategoriaResponse], status_code=201)
async def endpoint_crear_categoria(
    datos: CategoriaCreate, db: AsyncSession = Depends(get_db), admin: Usuario = Depends(require_admin),
):
    categoria = Categoria(nombre=datos.nombre, restaurante_id=admin.restaurante_id)
    await guardar_nuevo(db, categoria, "Ya existe una categoría con ese nombre")
    return ApiResponse(success=True, data=CategoriaResponse.model_validate(categoria))
