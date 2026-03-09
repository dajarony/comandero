# FEATURE: CHECKOUT
Responsabilidad: Cobro de cuenta y cierre de mesa. Split bill por personas.

Estado: lee de useOrderStore, escribe en useTablesStore

Reglas:
- Al cobrar: limpia carrito de la mesa y libera la mesa en tablesStore
- UI solo renderiza y dispara handleCobrar
- Split bill es cálculo local, no requiere estado global

Errores:
- CHECKOUT_CLOSE_FAILED
