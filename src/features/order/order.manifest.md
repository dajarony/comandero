# FEATURE: ORDER
Responsabilidad: Toma de comandas por mesa. Gestión del carrito y envío a cocina/barra.

Estado: useOrderStore (Zustand) — carrito por mesa

Reglas:
- UI solo renderiza y dispara eventos de addItem/removeItem
- useOrderFlow centraliza la lógica de carrito y navegación
- Al marchar pedido, tablesStore actualiza el estado de la mesa

Errores:
- ORDER_SEND_FAILED
