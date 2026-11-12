from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from contratos.mesa import MesaResponse
from contratos.pedido import PedidoCreate, PedidoResponse
from logica.pedido_service import crear_pedido
from modelos.menu import Categoria, MenuItem
from modelos.mesa import Mesa
from modelos.pedido import Pedido
from seguridad.excepciones import AppException, NotFoundException


async def preparar_local(db: AsyncSession, restaurante_id: int) -> None:
    db.add_all(Mesa(numero=str(numero), restaurante_id=restaurante_id) for numero in range(1, 5))
    bebidas = Categoria(nombre="Bebidas", emoji="🥤", restaurante_id=restaurante_id)
    tapas = Categoria(nombre="Tapas", emoji="🍽️", orden=1, restaurante_id=restaurante_id)
    db.add_all([bebidas, tapas])
    await db.flush()
    for categoria, nombres in [(bebidas, ["Agua", "Café", "Refresco"]), (tapas, ["Tortilla", "Croquetas"])]:
        db.add_all(
            MenuItem(nombre=nombre, precio=0, categoria_id=categoria.id, restaurante_id=restaurante_id)
            for nombre in nombres
        )


async def bloquear_mesa(db: AsyncSession, mesa_id: int, restaurante_id: int, turno: int) -> Mesa:
    mesa = await db.scalar(
        select(Mesa).where(Mesa.id == mesa_id, Mesa.restaurante_id == restaurante_id).with_for_update()
    )
    if mesa is None:
        raise NotFoundException("Mesa", mesa_id)
    if mesa.turno != turno:
        raise AppException("El servicio de esta mesa ya cambió. Actualiza la mesa antes de continuar.", 409)
    return mesa


async def enviar_ronda(
    db: AsyncSession, datos: PedidoCreate, turno: int, usuario_id: int, restaurante_id: int,
) -> PedidoResponse:
    mesa = await bloquear_mesa(db, datos.mesa_id, restaurante_id, turno)
    if mesa.estado == "LIBRE":
        mesa.estado = "OCUPADA"
        mesa.hora_apertura = datetime.now(timezone.utc).strftime("%H:%M")
    return await crear_pedido(db, datos, usuario_id, restaurante_id, mesa_servicio=mesa)


async def cerrar_servicio(db: AsyncSession, mesa_id: int, restaurante_id: int, turno: int) -> MesaResponse:
    mesa = await bloquear_mesa(db, mesa_id, restaurante_id, turno)
    if mesa.estado == "LIBRE":
        raise AppException("Esta mesa ya está libre.", 409)
    await db.execute(
        update(Pedido)
        .where(Pedido.mesa_id == mesa_id, Pedido.restaurante_id == restaurante_id,
               Pedido.estado.in_(("ABIERTO", "RETENIDO", "MARCHADO", "LISTO")))
        .values(estado="FINALIZADO")
    )
    mesa.estado = "LIBRE"
    mesa.total_cuenta = 0.0
    mesa.comensales = None
    mesa.hora_apertura = None
    mesa.nota = None
    mesa.turno += 1
    resultado = MesaResponse.model_validate(mesa)
    await db.commit()
    return resultado


async def guardar_nuevo(db: AsyncSession, registro: Mesa | Categoria, error: str) -> None:
    db.add(registro)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise AppException(error, 409) from None
    await db.refresh(registro)
