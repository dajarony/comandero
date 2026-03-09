# FEATURE: TABLES
Responsabilidad: Visualizar y gestionar el estado de las mesas del restaurante.

Estado: useTablesStore (Zustand)

Reglas:
- UI solo renderiza y dispara eventos
- La lógica de navegación vive en useTablesFlow
- El store es la única fuente de verdad del estado de mesas
- Mesa LIBRE/OCUPADA → navega a /comanda/:id
- Mesa PENDIENTE_COBRO → navega a /cobro/:id

Errores:
- TABLES_NAVIGATE_FAILED
