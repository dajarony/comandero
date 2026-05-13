# Diseño: UserMenu — Avatar con logout
**Fecha:** 2026-04-05
**Estado:** Aprobado

---

## Problema

El avatar `👤` en `TablesPage.tsx` es un `<div>` vacío sin funcionalidad. No hay forma de cerrar sesión ni de ver qué usuario está logueado.

## Solución

Componente compartido `UserMenu` que puede insertarse en cualquier página. Muestra la inicial del nombre como avatar, y al pulsar despliega un panel con nombre, rol y botón de cerrar sesión.

---

## Archivos

| Acción | Archivo |
|---|---|
| Crear | `src/shared/components/UserMenu.tsx` |
| Crear | `src/shared/components/UserMenu.module.css` |
| Modificar | `src/features/tables/ui/TablesPage.tsx` |

---

## Componente `UserMenu.tsx`

### Comportamiento
- Muestra un círculo con la **inicial del nombre** del usuario logueado
- Al pulsar: abre panel flotante anclado top-right
- El panel muestra: nombre completo, badge de rol, botón cerrar sesión
- Al pulsar fuera del panel: se cierra (click outside handler con `useRef`)
- Al cerrar sesión: `authStore.logout()` → `navigate('/login')`
- Si no hay usuario: no renderiza nada (`return null`)

### Badge de rol
- `ADMIN` → fondo verde `#22c55e`
- `CAMARERO` → fondo azul `#3b82f6`
- `COCINA` → fondo naranja `#f97316`

### Visual
```
Avatar (cerrado):     Panel (abierto):
  ┌───┐               ┌──────────────────┐
  │ I │    →pulsar→   │  ┌──┐ Isaac D.   │
  └───┘               │  └──┘ [ADMIN]    │
                      │  ──────────────  │
                      │  🚪 Cerrar sesión │
                      └──────────────────┘
```

### SUME
- Max 50 líneas por función
- SUME Docblock v2.0
- No llama APIs directamente — solo usa `useAuthStore` y `useNavigate`

---

## Integración en TablesPage

Reemplazar:
```tsx
<div className={styles.avatar}>👤</div>
```

Por:
```tsx
<UserMenu />
```

---

## Criterios de éxito
- [ ] Al pulsar el avatar se abre el panel
- [ ] El panel muestra nombre y rol del usuario real
- [ ] Al pulsar "Cerrar sesión" limpia localStorage y va a `/login`
- [ ] Al pulsar fuera del panel se cierra
- [ ] El componente no explota si `usuario` es null
