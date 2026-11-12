from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4
from unittest.mock import AsyncMock

from comandero_utils import data, register


def test_enviar_reintentar_y_cerrar_mesa_sin_cobro(client, monkeypatch):
    from seguridad.socket_manager import socket_manager

    broadcast = AsyncMock()
    monkeypatch.setattr(socket_manager, "broadcast", broadcast)
    _, headers = register(client)
    assert data(client, "auth/me", headers)["modo"] == "COMANDERO"
    mesa = data(client, "mesas", headers)[0]
    productos = data(client, "menu/items", headers)
    first_key = uuid4().hex

    def send(key, producto, note=""):
        return client.post("/api/v1/comandero/rondas", headers={**headers, "X-Idempotency-Key": key}, json={
            "mesa_id": mesa["id"], "turno": mesa["turno"],
            "lineas": [{"item_menu_id": producto["id"], "cantidad": 1, "nota": note}],
        })

    first = send(first_key, productos[0], "Sin azúcar")
    assert first.status_code == 201, first.text
    ronda = first.json()["data"]
    event = broadcast.await_args.args[1]
    assert event["event"] == "ORDER_MARCHADO"
    assert event["pedido"]["id"] == ronda["id"]
    assert event["pedido"]["lineas"][0]["nota"] == "Sin azúcar"
    assert data(client, f'mesas/{mesa["id"]}', headers)["estado"] == "OCUPADA"

    replay = send(first_key, productos[0], "Sin azúcar")
    assert replay.json()["data"]["id"] == ronda["id"]
    second = send(uuid4().hex, productos[1])
    assert second.status_code == 201, second.text
    second_round = second.json()["data"]
    assert broadcast.await_count == 2
    assert broadcast.await_args.args[1]["pedido"]["id"] == second_round["id"]
    assert len(second_round["lineas"]) == 1
    assert second_round["lineas"][0]["item_menu_id"] == productos[1]["id"]
    assert len(data(client, "pedidos/cocina/pendientes", headers)) == 2

    assert client.put(f'/api/v1/pedidos/{ronda["id"]}/cerrar', headers=headers, json={}).status_code == 403
    assert client.get("/api/v1/pedidos/historial", headers=headers).status_code == 403
    close = client.post(f'/api/v1/comandero/mesas/{mesa["id"]}/cerrar', headers=headers, json={"turno": mesa["turno"]})
    assert close.status_code == 200, close.text
    assert close.json()["data"]["estado"] == "LIBRE"
    assert broadcast.await_args.args[1] == {"event": "TABLE_CLOSED", "mesa_id": mesa["id"]}

    assert data(client, "pedidos/cocina/pendientes", headers) == []
    assert data(client, "comandero/rondas", headers) == []
    closed_replay = send(first_key, productos[0], "Sin azúcar").json()["data"]
    assert closed_replay["id"] == ronda["id"]
    assert closed_replay["estado"] == "FINALIZADO"
    assert send(uuid4().hex, productos[0]).status_code == 409


def test_reintentos_concurrentes_crean_una_sola_ronda(client):
    _, headers = register(client)
    mesa = data(client, "mesas", headers)[0]
    item = data(client, "menu/items", headers)[0]
    request_headers = {**headers, "X-Idempotency-Key": uuid4().hex}
    payload = {"mesa_id": mesa["id"], "turno": mesa["turno"], "lineas": [{"item_menu_id": item["id"], "cantidad": 2}]}

    def send():
        return client.post("/api/v1/comandero/rondas", headers=request_headers, json=payload)

    with ThreadPoolExecutor(max_workers=2) as workers:
        first, second = (future.result(timeout=15) for future in [workers.submit(send), workers.submit(send)])
    assert first.status_code == second.status_code == 201
    assert first.json()["data"]["id"] == second.json()["data"]["id"]
    assert len(data(client, "comandero/rondas", headers)) == 1

    _, other = register(client)
    denied = client.post("/api/v1/comandero/rondas", headers={**other, "X-Idempotency-Key": uuid4().hex}, json=payload)
    assert denied.status_code == 404
    assert data(client, "pedidos/cocina/pendientes", other) == []
