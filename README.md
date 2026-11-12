# Comandero Digital

Comandero gratuito para restaurantes, bares y cafeterías. Las nuevas altas incluyen cuatro mesas y una carta editable de ejemplo. Desde la mesa se toma la comanda, se envía cada ronda a cocina y se cierra el servicio sin registrar un cobro. Las cuentas existentes conservan el modo TPV.

Repositorio principal: [github.com/dajarony/comandero](https://github.com/dajarony/comandero)

## Primer servicio con Comandero

1. Crea una cuenta desde **Crear cuenta gratis**. Edita los productos en **Ajustes → Gestión de carta** y añade las mesas que necesites desde Ajustes.
2. Abre una mesa, añade productos y usa **Revisar** para incluir notas. Cada toque en **Enviar a cocina** confirma una ronda. En **Comandas** puedes consultar las rondas y cerrar la mesa cuando termine el servicio.
3. Abre **Cocina** en otro dispositivo del local. Si el móvil de sala pierde conexión, las rondas pendientes quedan guardadas en ese móvil. Se reintentan al volver la conexión. Los envíos rechazados se muestran en Comandas para revisión.

### Impresora de cocina en Android

- Conecta el móvil y una térmica de red compatible con ESC/POS por TCP 9100 a la misma red local. En **Impresora**, busca dispositivos anunciados por DNS-SD o escribe la IP de la impresora.
- Selecciona el ancho, imprime una prueba y guarda la impresora si sale bien. Los siguientes envíos confirmados de ese móvil se mandan automáticamente a la térmica. Si hace falta repetir un envío, usa **Imprimir copia** desde Comandas.
- Usa **Mostrar QR** en el móvil configurado y **Escanear QR** en el otro. El QR contiene la dirección, el nombre y el ancho del papel. Desde un navegador está disponible la pantalla de cocina.

## Que Incluye

- App web/PWA para TPV movil con React, TypeScript y Vite.
- App Android con Capacitor.
- Backend FastAPI con autenticacion JWT, multi-tenant por restaurante y API REST.
- WebSocket para cocina/KDS en tiempo real.
- Outbox offline en IndexedDB para guardar mutaciones cuando falla la red.
- Idempotencia en pedidos para evitar duplicados en reintentos.
- Paneles de mesas, comandas, cocina, cobro, historico, gastos, usuarios, configuracion e IA.
- Ingestion de carta y herramientas IA para operar sobre datos del restaurante.

## Stack

| Capa | Tecnologia |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Zustand, CSS Modules |
| Movil | Capacitor Android |
| Backend | FastAPI, SQLAlchemy async, Pydantic |
| Base de datos | PostgreSQL, recomendado Neon |
| Tiempo real | WebSocket autenticado por JWT |
| Offline | IndexedDB con `idb-keyval` |
| Graficas | Chart.js |
| Deploy backend | Docker / Google Cloud Run |

## Funcionalidad Principal

- Mesas con estados y notas operativas.
- Comandas separadas por persona y continuacion de pedidos abiertos.
- Marcha a cocina/barra, retencion, liberacion y completado de pedidos.
- Ticket de texto e impresion desde webview/Android.
- Cobro con propina, descuento y metodo de pago.
- KDS/cocina con avisos en tiempo real.
- Dashboard con ventas, historico y estadisticas.
- Gestion de carta, categorias, usuarios, gastos y configuracion del restaurante.
- Registro de restaurante y creacion de personal desde rutas admin.
- Modo offline con cola de sincronizacion, estados pendientes/fallidos y reintento idempotente.

## Seguridad y Robustez

- Autenticacion JWT obligatoria para rutas privadas.
- Separacion multi-tenant por `restaurante_id` en backend.
- Registro publico limitado a alta de restaurante.
- Creacion de personal solo por administradores.
- Produccion exige `JWT_SECRET` real y bloquea credenciales demo por defecto.
- WebSocket sin token en query string: usa subprotocol `comandero-jwt`.
- Outbox con `X-Idempotency-Key` y deduplicacion backend para pedidos.
- Impresion segura sin inyeccion de HTML.
- Sincronizacion offline sin depender de `navigator.onLine`, que no es fiable en Android/Capacitor.

## Estructura

```text
comandero/
├── src/                      # App React/Vite
│   ├── app/                  # Router, guards y layout base
│   ├── core/                 # API client, offline store, sync manager, logging
│   ├── features/             # Modulos funcionales por dominio
│   └── shared/               # Componentes y hooks compartidos
├── android/                  # Proyecto Android Capacitor
├── backend/                  # API FastAPI, modelos, servicios, routers y tests
├── docs/                     # Documentacion tecnica y planes frontend
├── resources/                # Assets fuente
└── README.md
```

## Requisitos

- Node.js 20+ recomendado.
- npm 10+.
- Python 3.11+.
- PostgreSQL compatible con SQLAlchemy asyncpg.
- Android Studio si se va a compilar APK.

## Variables de Entorno

Frontend (`fronted/app/.env`):

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_RESTAURANT_NAME=Restaurante
```

Backend (`backend/.env`):

```env
DATABASE_URL=postgresql+asyncpg://user:password@host/dbname
JWT_SECRET=genera-un-secreto-seguro-de-al-menos-32-caracteres
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=480
CORS_ORIGINS=http://localhost:5173
APP_ENV=development
ENABLE_DEMO_USERS=false
ANTHROPIC_API_KEY=
```

En produccion usa `APP_ENV=production`, un `JWT_SECRET` fuerte y `ENABLE_DEMO_USERS=false`.

## Desarrollo Local

Backend:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

API local: `http://localhost:8000`  
Swagger/OpenAPI: `http://localhost:8000/docs`

Frontend:

```bash
npm install
npm run dev
```

App local: `http://localhost:5173`

## Android

```bash
npm run build
npx cap sync android
npx cap open android
```

Para ejecutar en dispositivo/emulador:

```bash
npx cap run android
```

## Scripts Frontend

```bash
npm run dev       # servidor Vite
npm run lint      # ESLint
npm run build     # TypeScript + build produccion
npm run preview   # preview del build
npm run cap:sync  # build + sync Capacitor
```

## Verificacion

Comandos usados para validar esta version:

```bash
npm run lint
npm run build

cd backend
py -m compileall entradas logica modelos seguridad
```

Para comprobar el envío, reintentos simultáneos y cierre de mesa con una base PostgreSQL de pruebas, apunta `DATABASE_URL` y `COMANDERO_TEST_DATABASE_URL` a esa misma base y ejecuta `pytest` desde `backend`.

## Despliegue

Backend con Docker/Cloud Run:

```bash
cd backend
./deploy.sh
```

Frontend web:

```bash
npm run build
```

El resultado queda en `dist`.

## Notas de Operacion

- La tabla `idempotency_records` se crea con `Base.metadata.create_all`; si se usan migraciones manuales, crearla tambien en produccion.
- Las sincronizaciones fallidas 4xx quedan marcadas como fallidas para revision, no se eliminan silenciosamente.
- El cliente envia idempotency keys en POST/PUT/DELETE; el backend deduplica las mutaciones criticas de pedidos.
- El token de WebSocket se envia como subprotocol para evitar que aparezca en logs de URL.

## Licencia

MIT. Ver `LICENSE`.
