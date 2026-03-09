# FEATURE: MENU-INGEST
Responsabilidad: Importación y categorización automática de carta desde CSV.

Estado: useMenuIngestStore (Zustand) — items importados y estado del proceso

Reglas:
- La categorización mock vive en menuIngestApi.procesarCSV
- En Fase 3 se reemplaza por llamada real a LLM
- UI solo dispara handleArchivoCSV y handleGuardar
- Accesible desde tab Ajustes en BottomNav (/admin/carta)

Errores:
- MENU_INGEST_PARSE_FAILED
- MENU_INGEST_SAVE_FAILED
