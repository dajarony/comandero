"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: seguridad/socket_manager.py
Tipo: Utilidad → WebSocket Connection Manager
Líneas: ~30 / 100 MAX
Dependencias: 1 (fastapi)

Acciones:
- Gestionar conexiones activas de WebSockets por restaurante_id
- Proteger el aislamiento multi-tenant: los mensajes de una 
  cocina solo llegan a sus TPV/KDS correspondientes.
- Métodos: connect, disconnect, broadcast

Última Modificación: 2026-03-29 | Dajarony
Cambio: Creado manager para el KDS en tiempo real.
═══════════════════════════════════════════════════════════
"""

import json
from typing import Dict, List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Mapeo: { restaurante_id: [WebSocket, ...] }
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, restaurante_id: int, subprotocol: str | None = None):
        await websocket.accept(subprotocol=subprotocol)
        if restaurante_id not in self.active_connections:
            self.active_connections[restaurante_id] = []
        self.active_connections[restaurante_id].append(websocket)

    def disconnect(self, websocket: WebSocket, restaurante_id: int):
        if restaurante_id in self.active_connections:
            self.active_connections[restaurante_id].remove(websocket)
            if not self.active_connections[restaurante_id]:
                del self.active_connections[restaurante_id]

    async def broadcast(self, restaurante_id: int, message: dict):
        """Envía un mensaje JSON a todos los clientes del restaurante especificado."""
        if restaurante_id in self.active_connections:
            for connection in self.active_connections[restaurante_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    # Si falla, posiblemente la conexión se cerró sin disconnect
                    pass

# Singleton global para toda la app
socket_manager = ConnectionManager()
