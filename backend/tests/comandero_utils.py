"""Ayudas compartidas por las pruebas del Comandero contra PostgreSQL."""

from uuid import uuid4


def _sin_limite_de_intentos():
    # El límite de 10 altas/login por minuto e IP es para personas, no para la batería de pruebas.
    from seguridad import rate_limit
    rate_limit._attempts.clear()


def register(client):
    _sin_limite_de_intentos()
    response = client.post("/api/v1/auth/registro-restaurante", json={
        "nombre_restaurante": "Bar de prueba", "nombre_admin": "Pruebas",
        "email": f"comandero-{uuid4().hex}@example.com", "password": "comandero-prueba-local",
    })
    assert response.status_code == 201, response.text
    profile = response.json()["data"]
    assert profile["usuario"]["modo"] == "COMANDERO"
    token = profile["access_token"]
    return token, {"Authorization": f"Bearer {token}"}


def staff(client, admin_headers, rol):
    """Crea un miembro del personal en el local del admin y devuelve sus cabeceras."""
    email, password = f"{rol.lower()}-{uuid4().hex}@example.com", "personal-prueba-local"
    created = client.post("/api/v1/usuarios/", headers=admin_headers, json={
        "nombre": f"Personal {rol}", "email": email, "password": password, "rol": rol,
    })
    assert created.status_code == 201, created.text
    _sin_limite_de_intentos()
    login = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200, login.text
    return {"Authorization": f"Bearer {login.json()['data']['access_token']}"}


def data(client, path, headers):
    response = client.get(f"/api/v1/{path}", headers=headers)
    assert response.status_code == 200, response.text
    return response.json()["data"]


def send_round(client, headers, mesa, producto, key=None):
    return client.post(
        "/api/v1/comandero/rondas",
        headers={**headers, "X-Idempotency-Key": key or uuid4().hex},
        json={"mesa_id": mesa["id"], "turno": mesa["turno"],
              "lineas": [{"item_menu_id": producto["id"], "cantidad": 1}]},
    )
