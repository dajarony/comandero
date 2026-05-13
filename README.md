# Comandero Digital

TPV movil y comandero digital para restaurantes, bares y cafeterias. La aplicacion permite gestionar mesas, tomar comandas por persona, enviar pedidos a cocina en tiempo real, cobrar tickets, trabajar con tolerancia a cortes de red y administrar usuarios, carta, gastos, estadisticas e IA.

Repositorio principal: [github.com/dajarony/comandero](https://github.com/dajarony/comandero)

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
├── backend/                  # API FastAPI, modelos, servicios, routers y tests
├── fronted/app/              # App React/Vite/Capacitor
│   ├── src/app/              # Router, guards y layout base
│   ├── src/core/             # API client, offline store, sync manager, logging
│   ├── src/features/         # Modulos funcionales por dominio
│   ├── src/shared/           # Componentes y hooks compartidos
│   └── android/              # Proyecto Android Capacitor
├── docs/                     # Documentacion tecnica y planes
└── LICENSE
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
cd fronted/app
npm install
npm run dev
```

App local: `http://localhost:5173`

## Android

```bash
cd fronted/app
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
cd fronted/app
npm run lint
npm run build

cd ../../backend
py -m compileall entradas logica modelos seguridad
```

## Despliegue

Backend con Docker/Cloud Run:

```bash
cd backend
./deploy.sh
```

Frontend web:

```bash
cd fronted/app
npm run build
```

El resultado queda en `fronted/app/dist`.

## Notas de Operacion

- La tabla `idempotency_records` se crea con `Base.metadata.create_all`; si se usan migraciones manuales, crearla tambien en produccion.
- Las sincronizaciones fallidas 4xx quedan marcadas como fallidas para revision, no se eliminan silenciosamente.
- El cliente envia idempotency keys en POST/PUT/DELETE; el backend deduplica las mutaciones criticas de pedidos.
- El token de WebSocket se envia como subprotocol para evitar que aparezca en logs de URL.

## Licencia

MIT. Ver `LICENSE`.
