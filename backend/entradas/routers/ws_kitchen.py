"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: entradas/routers/ws_kitchen.py
Tipo: Adaptador → WebSocket Kitchen Router
Líneas: ~40 / 100 MAX
Dependencias: 3 (fastapi, socket_manager, jwt_manager)

Acciones:
- Proveer un túnel de tiempo real para pantallas de cocina
- Autenticar vía token en Query Param (estándar WS)
- Gestionar ciclo de vida de la conexión (Connect/Disconnect)

Última Modificación: 2026-03-29 | Dajarony
Cambio: Endpoint WebSocket para KDS.
═══════════════════════════════════════════════════════════
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from seguridad.socket_manager import socket_manager
from seguridad.jwt_manager import verificar_token
from seguridad.logger import obtener_logger

logger = obtener_logger("ws_kitchen")
router = APIRouter()


def _token_from_subprotocol(websocket: WebSocket) -> str | None:
    protocols_header = websocket.headers.get("sec-websocket-protocol", "")
    protocols = [part.strip() for part in protocols_header.split(",") if part.strip()]
    try:
        marker_index = protocols.index("comandero-jwt")
    except ValueError:
        return None

    if marker_index + 1 >= len(protocols):
        return None
    return protocols[marker_index + 1]


@router.websocket("/kitchen")
async def kitchen_websocket_endpoint(
    websocket: WebSocket,
    token: str | None = Query(None, description="JWT Token para compatibilidad legacy")
):
    """
    Controlador WebSocket para la pantalla de cocina.
    Segmenta las conexiones por restaurante_id basándose en el JWT.
    """
    restaurante_id = None
    try:
        protocol_token = _token_from_subprotocol(websocket)
        token = protocol_token or token
        if not token:
            await websocket.close(code=1008)
            return

        # 1. Validar sesión y extraer tenant
        payload = verificar_token(token)
        restaurante_id = payload.get("restaurante_id")
        
        if not restaurante_id:
            logger.warning("Intento de conexión WS sin restaurante_id en payload")
            await websocket.close(code=1008)
            return

        # 2. Registrar conexión en el manager global
        await socket_manager.connect(websocket, restaurante_id, "comandero-jwt" if protocol_token else None)
        logger.info(f"🔌 KDS ONLINE: Restaurante {restaurante_id}")

        # 3. Bucle de escucha (Keep alive & Heartbeat)
        try:
            while True:
                # Actualmente el KDS es pasivo (solo recibe), 
                # pero mantenemos la conexión abierta escuchando pings.
                await websocket.receive_text()
        except WebSocketDisconnect:
            logger.info(f"🔌 KDS OFFLINE: Restaurante {restaurante_id}")
        finally:
            socket_manager.disconnect(websocket, restaurante_id)

    except Exception as e:
        logger.error(f"❌ Error crítico en WS Kitchen: {str(e)}")
        if websocket:
            await websocket.close(code=1008)
