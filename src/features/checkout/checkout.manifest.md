# FEATURE: CHECKOUT
Responsabilidad: Cobro de cuenta y cierre de mesa. Split bill por comanda/persona.

## Arquitectura (actualizado 2026-03-17)
- **Lógica**: `useCheckoutFlow.ts` — estado LOCAL con useState (no Zustand)
- **API**: `orderApi.cerrarPedido()` + `tablesApi.liberarMesa()`
- **UI**: `CheckoutPage.tsx` (puro render) + `CheckoutPage.helpers.tsx` (subcomponentes)

## Flujo
1. Carga pedidos activos de la mesa via API
2. Selecciona cuáles cobrar (por defecto todos)
3. Cierra pedidos seleccionados via API
4. Si todos cerrados → libera mesa. Si parcial → mesa sigue OCUPADA
5. Navega a /mesas

## Reglas
- UI solo renderiza y dispara handleCobrar
- Split bill es selección de comandas, cálculo local
- checkoutStore.ts ELIMINADO (era código muerto, no se usaba)

## Errores
- CHECKOUT_LOAD_FAILED — fallo al cargar pedidos
- CHECKOUT_CLOSE_FAILED — fallo al cerrar pedido
- CHECKOUT_LIBERAR_FAILED — fallo al liberar mesa sin pedidos

## Bugs resueltos (auditoría 2026-03-17)
- BUG #1 (infinite render loop): No existe — useCheckoutFlow usa useState local
- BUG #2 (wrong Zustand store V1/V2): No existe — no usa Zustand en absoluto
