# Design: Comandero Digital – Fase 1 (UI Mock)
**Date:** 2026-03-09
**Status:** Approved

---

## Objetivo
Construir las 4 pantallas core del comandero con datos mock, siguiendo Arquitectura Dajarony V1 (Feature-Driven + SUME Blocks). Sin backend real.

---

## Flujo de Navegación
```
/mesas              → Grid de mesas (estado visual por color)
/comanda/:mesaId    → Toma de comanda (categorías + items + carrito)
/cobro/:mesaId      → Cierre y pago (resumen + split bill)
/admin/carta        → Ingesta de carta por CSV (admin)
```

---

## Features

### 1. feature/tables (`/mesas`)
- Grid 3 columnas de tarjetas de mesa
- 3 estados: LIBRE (verde #06D7A0), OCUPADA (navy #073A4B), PENDIENTE_COBRO (rojo #F04770)
- Filtros: Todas / Libres / Ocupadas
- Tap mesa LIBRE → navega a /comanda/:mesaId
- Tap mesa OCUPADA → navega a /cobro/:mesaId
- Bottom navigation global

### 2. feature/order (`/comanda/:mesaId`)
- Header con número de mesa y botón back
- Pestañas de categorías: Bebidas, Cervezas, Vinos, Carnes, Postres, Otros
- Grid 2 columnas de tarjetas de items (nombre + precio)
- Tap item → añade al carrito con animación
- Carrito flotante lateral/inferior con cantidad y total
- Modificadores por item ("solo", "con hielo", "término medio")
- Botón "MARCHAR PEDIDO" → marca mesa OCUPADA, navega a /mesas

### 3. feature/checkout (`/cobro/:mesaId`)
- Header con mesa y botón back
- Lista consolidada de items pedidos con cantidades y subtotales
- Total general
- Sección Split Bill: input N personas → divide total automáticamente
- Botones de pago: Efectivo / Tarjeta / QR
- Botón "CERRAR MESA" → marca mesa LIBRE, navega a /mesas

### 4. feature/menu-ingest (`/admin/carta`)
- Área de upload CSV (drag & drop o click)
- Preview tabla con categoría auto-asignada (mock)
- Botón "Guardar en sistema"
- Accesible desde tab Ajustes en bottom nav

---

## Arquitectura (Dajarony V1)

Cada feature sigue la estructura:
```
src/features/<name>/
  ├── <name>.manifest.md
  ├── ui/          → Componentes React (solo renderizado)
  ├── logic/       → use<Action>Flow.ts (SUME blocks)
  ├── api/         → <name>Api.ts (mock data)
  ├── state/       → <name>Store.ts (Zustand)
  └── types/       → <Name>Types.ts
```

### Estado Global (Zustand)
- `tablesStore.ts` → array de mesas con estado
- `orderStore.ts` → carrito activo por mesa
- `checkoutStore.ts` → cuenta consolidada por mesa

### Router
- React Router v6 ya instalado
- Routes definidas en `src/app/router.tsx`

---

## Design System (existente)
- Primary: `#F04770` (rojo — CTAs, PENDIENTE_COBRO)
- Secondary: `#06D7A0` (verde menta — LIBRE, activos)
- Dark: `#073A4B` (navy — OCUPADA, contraste)
- Warning: `#FFD167` (amarillo — alertas)
- Font: Inter

---

## Datos Mock
- 12 mesas con estados variados
- 6 categorías de menú con ~5 items cada una
- Items de comanda pre-populados para pantalla checkout

---

## Secuencia de Construcción
1. Setup router + navegación base
2. feature/tables (refactor DashboardPage)
3. feature/order
4. feature/checkout
5. feature/menu-ingest
6. Conectar flujo completo end-to-end
