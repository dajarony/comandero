# Diseño: Modularización de ia.py + Fix Bug 503
**Fecha:** 2026-04-04
**Autor:** Dajarony
**Estado:** Aprobado

---

## Problema

`backend/entradas/routers/ia.py` tiene 335 líneas, violando el límite SUME de 200 líneas/archivo.
Mezcla tres responsabilidades en un solo archivo:
1. Definición y ejecución de tools de OpenAI
2. Construcción del contexto de negocio (queries DB)
3. Endpoints HTTP

Adicionalmente, cuando falta `OPENAI_API_KEY` el endpoint devuelve un `HTTPException(503)` crudo que rompe el contrato `ApiResponse` esperado por el frontend.

---

## Decisión Arquitectónica

**Opción A — 2 archivos nuevos en `logica/servicios/`**

Justificación según doc de arquitectura SUME+STDG:
- `entradas/routers/` → solo adaptadores HTTP (rutas + schemas)
- `logica/servicios/` → lógica pura de negocio

---

## Estructura Resultante

```
backend/
├── entradas/
│   └── routers/
│       └── ia.py              ← REESCRITO  (~110 líneas)
└── logica/
    └── servicios/
        ├── ia_context.py      ← NUEVO      (~55 líneas)
        └── ia_tools.py        ← NUEVO      (~75 líneas)
```

---

## Detalle por Archivo

### `logica/servicios/ia_context.py`
**Responsabilidad:** Recopilar datos reales del negocio para el contexto de GPT-4o.

Funciones (todas < 50 líneas):
| Función | Entradas | Salida |
|---|---|---|
| `_gastos_ctx(db, rid)` | AsyncSession, int | dict: total_mensual, coste_diario, detalle |
| `_personal_ctx(db, rid)` | AsyncSession, int | list: empleados activos |
| `_historial_ctx(db, rid)` | AsyncSession, int | list: últimos 20 pedidos 7 días |
| `build_context(db, rid)` | AsyncSession, int | str: prompt de contexto completo |

Logger: `obtener_logger("ia_context")` — obligatorio per SUME doc.

---

### `logica/servicios/ia_tools.py`
**Responsabilidad:** Definir y ejecutar las tools que GPT-4o puede invocar.

Contenido:
| Elemento | Tipo | Descripción |
|---|---|---|
| `IA_FUNCTIONS` | `list[dict]` | Schemas OpenAI para las 4 tools |
| `_exec_crear_empleado` | async fn | Crea empleado en DB |
| `_exec_desactivar_empleado` | async fn | Desactiva empleado por ID |
| `_exec_registrar_gasto` | async fn | Crea gasto en DB |
| `_exec_eliminar_gasto` | async fn | Elimina gasto por ID |
| `ejecutar_tool(nombre, args, db, rid)` | async fn pública | Despacha a ejecutor correcto, fallback explícito si no existe |

Logger: `obtener_logger("ia_tools")` — obligatorio per SUME doc.

---

### `entradas/routers/ia.py` (reescrito)
**Responsabilidad:** Solo schemas Pydantic + 3 endpoints HTTP.

Imports de servicios:
```python
from logica.servicios.ia_context import build_context
from logica.servicios.ia_tools import IA_FUNCTIONS, ejecutar_tool
```

Endpoints:
| Ruta | Método | Descripción |
|---|---|---|
| `/chat` | POST | Chat + function calling |
| `/informe` | POST | Informe narrativo diario |
| `/sugerencias` | GET | Chips contextuales |

---

## Bug Fix: 503 sin ApiResponse

**Antes (rompe contrato):**
```python
raise HTTPException(503, "OPENAI_API_KEY no configurada")
```

**Después (respeta contrato ApiResponse):**
```python
from fastapi.responses import JSONResponse
return JSONResponse(
    status_code=503,
    content={"success": False, "data": None, "error": "OPENAI_API_KEY no configurada"}
)
```

Se aplica en `/chat` e `/informe`. El endpoint `/sugerencias` devuelve lista vacía en su lugar (no necesita OpenAI).

---

## Errores Corregidos de Paso

| # | Error | Fix |
|---|---|---|
| 1 | `raise HTTPException(503)` rompe ApiResponse | JSONResponse 503 con contrato estandarizado |
| 2 | `EJECUTORES` dict suelto sin control de errores | `ejecutar_tool()` con fallback explícito |
| 3 | `_build_context` privada, no testeable | Pasa a `build_context()` pública |
| 4 | Logger ausente en contexto e ia_tools | `obtener_logger()` en ambos servicios nuevos |

---

## Criterios de Éxito

- [ ] Los 3 archivos por debajo de 200 líneas
- [ ] Todas las funciones por debajo de 50 líneas
- [ ] `/chat` e `/informe` devuelven `ApiResponse` con status 503 si falta API key
- [ ] Comportamiento funcional idéntico al actual (sin regresiones)
- [ ] SUME Docblock v2.0 en cada archivo nuevo
