# ⏳ PENDIENTE — Modularización pedido_service.py
**Estado:** Diferido conscientemente — hacer DESPUÉS de validar deploy IA en producción
**Fecha análisis:** 2026-04-04
**Prioridad:** Alta, pero NO urgente (el sistema funciona correctamente en producción)

---

## Por qué está diferido

- El deploy de la refactorización IA se acaba de realizar. Hay que dejar reposar y validar.
- `pedido_service.py` contiene 4 funciones 🔴 Crítico con WebSocket en tiempo real.
- Un error en esta refactorización en producción = el TPV no puede tomar comandas.
- **Hacer solo cuando:** IA en producción validada + prueba en móvil OK.

---

## Estado actual

- **Archivo:** `backend/logica/pedido_service.py`
- **Tamaño:** ~325 líneas / 14.4 KB — viola límite SUME de 200 líneas
- **Dependencias externas:** `entradas/routers/pedidos.py` importa masivamente en línea 37

---

## Plan de división aprobado

### Archivo 1: `pedido_lectura_service.py`
Operaciones de solo lectura — riesgo bajo, sin WebSocket.

| Función | Riesgo |
|---|---|
| `obtener_pedido` | Bajo |
| `listar_por_mesa` | Bajo |
| `listar_pedidos_cocina` | Bajo |
| `obtener_pedido_completo` | Medio |
| `listar_historial_pedidos` | Bajo |

### Archivo 2: `pedido_escritura_service.py`
Operaciones transaccionales + WebSocket — núcleo del TPV.

| Función | Riesgo |
|---|---|
| `crear_pedido` | 🔴 Crítico |
| `agregar_lineas` | 🔴 Crítico |
| `marchar_pedido` | 🔴 Crítico (WS cocina) |
| `completar_pedido_cocina` | 🔴 Crítico (WS camarero) |
| `cerrar_pedido` | 🟠 Alto |
| `retener_pedido` | 🟡 Medio |
| `liberar_pedido` | 🟡 Medio |
| `eliminar_linea` | 🟠 Alto |

### Archivo 3 (opcional): `pedido_helpers.py`
Si `pedido_a_response` se necesita en ambos servicios, extraerlo aquí evita duplicación.

---

## Puntos críticos a ejecutar con cuidado

1. **Re-vincular imports en el router:** `entradas/routers/pedidos.py` línea 37 tiene import masivo de `logica.pedido_service`. Hay que redirigir hacia los 2 nuevos módulos. Son 13 dependencias — hacer una por una, no en bloque.

2. **WebSocket solo en escritura:** `socket_manager` no debe aparecer en `pedido_lectura_service.py` bajo ningún concepto.

3. **Sin dependencias circulares:** Confirmado — las funciones no se llaman entre sí internamente. La separación es segura.

4. **Ejecutar tests antes y después:** `pytest tests/` debe pasar igual en ambos lados del cambio.

---

## Decisión sobre `logica/controladores/`

**Diferido indefinidamente.** Es deuda arquitectónica de papel — el sistema funciona sin esa capa. Solo tiene sentido crearla cuando haya cobertura de tests de integración que proteja la refactorización. Sin tests = más riesgo que beneficio.

---

## Checklist cuando se retome

- [ ] Validar IA en producción funcionando OK (chat, informe, sugerencias)
- [ ] Probar pedidos y cobros en el móvil sin errores
- [ ] Leer `pedido_service.py` completo antes de tocar nada
- [ ] Leer `entradas/routers/pedidos.py` para mapear los 13 imports
- [ ] Crear `pedido_helpers.py` primero (base compartida)
- [ ] Crear `pedido_lectura_service.py` (sin riesgo)
- [ ] Crear `pedido_escritura_service.py` (con cuidado)
- [ ] Actualizar imports en `pedidos.py`
- [ ] Ejecutar `pytest tests/` — todos deben pasar
- [ ] Deploy y validar en móvil
