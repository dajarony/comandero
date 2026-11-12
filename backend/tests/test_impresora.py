from unittest.mock import AsyncMock
from uuid import uuid4

from comandero_utils import data, register, send_round, staff

IMPRESORA = "/api/v1/comandero/impresora"


def activar(client, headers, dispositivo, nombre="Cocina", reemplazar=False):
    return client.put(IMPRESORA, headers=headers, json={
        "dispositivo_id": dispositivo, "nombre": nombre, "reemplazar": reemplazar,
    })


def pendientes(client, headers, dispositivo):
    response = client.get(f"{IMPRESORA}/pendientes", headers=headers, params={"dispositivo_id": dispositivo})
    return response


def marcar(client, headers, pedido_id, dispositivo):
    return client.post(f"{IMPRESORA}/rondas/{pedido_id}/impresa", headers=headers, json={"dispositivo_id": dispositivo})


def ids(response):
    assert response.status_code == 200, response.text
    return [ronda["id"] for ronda in response.json()["data"]]


def pasar_a_tpv(client, restaurante_id):
    from sqlalchemy import update
    from database import AsyncSessionLocal
    from modelos.restaurante import Restaurante

    async def cambiar():
        async with AsyncSessionLocal() as db:
            await db.execute(update(Restaurante).where(Restaurante.id == restaurante_id).values(modo="TPV"))
            await db.commit()

    client.portal.call(cambiar)


def test_precio_cero_solo_en_comandero(client):
    _, admin = register(client)
    categoria = data(client, "menu/categorias", admin)[0]
    producto = data(client, "menu/items", admin)[0]

    gratis = client.post("/api/v1/menu/items", headers=admin, json={
        "nombre": "Pan", "precio": 0, "categoria_id": categoria["id"],
    })
    assert gratis.status_code == 201, gratis.text
    assert client.put(f'/api/v1/menu/items/{producto["id"]}', headers=admin,
                      json={"nombre": "Agua del grifo", "precio": 0}).status_code == 200

    pasar_a_tpv(client, data(client, "auth/me", admin)["restaurante_id"])
    assert data(client, "auth/me", admin)["modo"] == "TPV"
    rechazado = client.post("/api/v1/menu/items", headers=admin, json={
        "nombre": "Pan", "precio": 0, "categoria_id": categoria["id"],
    })
    assert rechazado.status_code == 422
    assert rechazado.json()["error"] == "El precio debe ser mayor que 0"
    assert client.put(f'/api/v1/menu/items/{producto["id"]}', headers=admin, json={"precio": 0}).status_code == 422
    assert client.put(f'/api/v1/menu/items/{producto["id"]}', headers=admin, json={"nombre": "Agua"}).status_code == 200
    assert client.post("/api/v1/menu/items", headers=admin, json={
        "nombre": "Pan", "precio": 1.5, "categoria_id": categoria["id"],
    }).status_code == 201


def test_un_solo_movil_impresora_por_local(client, monkeypatch):
    from seguridad.socket_manager import socket_manager

    broadcast = AsyncMock()
    monkeypatch.setattr(socket_manager, "broadcast", broadcast)
    _, admin = register(client)
    cocina = staff(client, admin, "COCINA")
    movil_cocina, movil_barra = uuid4().hex, uuid4().hex

    assert data(client, "comandero/impresora", cocina)["dispositivo_id"] is None
    assert activar(client, cocina, movil_cocina).status_code == 200
    assert broadcast.await_args.args[1] == {
        "event": "PRINTER_STATION_CHANGED", "dispositivo_id": movil_cocina, "nombre": "Cocina",
    }

    # Un segundo móvil no puede quitársela sin confirmarlo
    ocupado = activar(client, admin, movil_barra, "Barra")
    assert ocupado.status_code == 409
    assert "«Cocina»" in ocupado.json()["error"]
    assert data(client, "comandero/impresora", admin)["dispositivo_id"] == movil_cocina

    # Al confirmarlo, el anterior deja de imprimir y se avisa a todos
    assert activar(client, admin, movil_barra, "Barra", reemplazar=True).status_code == 200
    assert broadcast.await_args.args[1]["dispositivo_id"] == movil_barra
    assert pendientes(client, cocina, movil_cocina).status_code == 409
    assert pendientes(client, admin, movil_barra).status_code == 200

    # Solo el móvil titular o un administrador pueden desactivarla
    assert client.post(f"{IMPRESORA}/liberar", headers=cocina, json={"dispositivo_id": movil_cocina}).status_code == 403
    assert client.post(f"{IMPRESORA}/liberar", headers=admin, json={"dispositivo_id": movil_cocina}).status_code == 200
    assert data(client, "comandero/impresora", admin)["dispositivo_id"] is None

    # Cada local tiene su propia impresora
    _, otro = register(client)
    assert activar(client, otro, movil_cocina).status_code == 200
    assert data(client, "comandero/impresora", admin)["dispositivo_id"] is None


def test_reconectar_no_repite_rondas(client):
    _, admin = register(client)
    mesa = data(client, "mesas", admin)[0]
    producto = data(client, "menu/items", admin)[0]
    movil = uuid4().hex

    anterior = send_round(client, admin, mesa, producto)
    assert anterior.status_code == 201, anterior.text
    assert activar(client, admin, movil).status_code == 200

    primera = send_round(client, admin, mesa, producto).json()["data"]["id"]
    segunda = send_round(client, admin, mesa, producto).json()["data"]["id"]
    # Lo que ya estaba en cocina antes de activar la impresora no sale en papel
    assert ids(pendientes(client, admin, movil)) == [primera, segunda]

    marca = marcar(client, admin, primera, movil)
    assert marca.status_code == 200, marca.text
    repetida = marcar(client, admin, primera, movil)
    assert repetida.json()["data"]["impreso_en"] == marca.json()["data"]["impreso_en"]

    # Reconexión: solo vuelve la que falta
    assert ids(pendientes(client, admin, movil)) == [segunda]
    assert marcar(client, admin, segunda, movil).status_code == 200
    assert ids(pendientes(client, admin, movil)) == []

    # Reabrir la app y volver a activar el mismo móvil no reimprime nada
    assert activar(client, admin, movil).status_code == 200
    assert ids(pendientes(client, admin, movil)) == []

    tercera = send_round(client, admin, mesa, producto).json()["data"]["id"]
    assert ids(pendientes(client, admin, movil)) == [tercera]

    # Otro local no puede marcar rondas ajenas
    _, otro = register(client)
    otro_movil = uuid4().hex
    assert activar(client, otro, otro_movil).status_code == 200
    assert marcar(client, otro, tercera, otro_movil).status_code == 404
    assert ids(pendientes(client, otro, otro_movil)) == []
    assert ids(pendientes(client, admin, movil)) == [tercera]
