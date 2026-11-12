/**
 * Móvil impresora de cocina.
 *
 * Un único Android por local imprime las rondas de todos los camareros (también las
 * tomadas desde la web). Recibe cada ronda por WebSocket y, para no perder ninguna,
 * al conectar, al reconectar y cada 20 s pide al servidor las que aún no han salido.
 *
 * Una ronda nunca sale dos veces: se recuerda en este móvil en cuanto se imprime y se
 * confirma al servidor, que deja de devolverla como pendiente.
 */
import { create } from 'zustand';
import toast from 'react-hot-toast';
import { ApiError } from '@/core/api/apiClient';
import type { PedidoApi } from '@/features/order/api/orderApi';
import { stationApi } from './api';
import { getPrinter, keepScreenOn, printRound } from './printer';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const DEVICE_KEY = 'comandero-dispositivo';
const ACTIVE_KEY = 'comandero-estacion-activa';
const PRINTED_KEY = 'comandero-estacion-impresas';
const RECENT_KEY = 'comandero-estacion-recientes';
const SYNC_EVERY_MS = 20_000;
const RETRY_DELAYS_MS = [0, 1_500, 4_000];
const MAX_PRINTED = 300;
const MAX_RECENT = 15;

type Connection = 'connecting' | 'online' | 'offline';

interface StationState {
  /** Restaurante para el que este móvil está activo como impresora (null = no imprime). */
  activeFor: number | null;
  connection: Connection;
  printerError: string;
  failed: PedidoApi[];
  recent: PedidoApi[];
  notice: string;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null');
    return value ?? fallback;
  } catch { return fallback; }
}

function writeJson(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sin almacenamiento: sigue en memoria */ }
}

export const useKitchenStation = create<StationState>(() => ({
  activeFor: readJson<number | null>(ACTIVE_KEY, null),
  connection: 'connecting',
  printerError: '',
  failed: [],
  recent: readJson<PedidoApi[]>(RECENT_KEY, []),
  notice: '',
}));

const set = useKitchenStation.setState;

export function deviceId(): string {
  let id = '';
  try { id = localStorage.getItem(DEVICE_KEY) ?? ''; } catch { /* se genera uno nuevo */ }
  if (id.length < 8) {
    id = crypto.randomUUID().replace(/-/g, '');
    try { localStorage.setItem(DEVICE_KEY, id); } catch { /* vale para esta sesión */ }
  }
  return id;
}

// ── Rondas ya impresas en este móvil ───────────────────────────
const printed = new Set<number>(readJson<number[]>(PRINTED_KEY, []));

function rememberPrinted(round: PedidoApi) {
  printed.add(round.id);
  writeJson(PRINTED_KEY, [...printed].slice(-MAX_PRINTED));
  const recent = [round, ...useKitchenStation.getState().recent.filter(item => item.id !== round.id)].slice(0, MAX_RECENT);
  writeJson(RECENT_KEY, recent);
  set(state => ({ recent, failed: state.failed.filter(item => item.id !== round.id), printerError: '' }));
}

// ── Motor ──────────────────────────────────────────────────────
let running = false;
let socket: WebSocket | null = null;
let reconnectTimer: number | undefined;
let syncTimer: number | undefined;
let backoff = 1_000;
const queue: PedidoApi[] = [];
const inQueue = new Set<number>();
const warned = new Set<number>();
let working = false;

const wait = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));

function lose(message: string) {
  writeJson(ACTIVE_KEY, null);
  set({ activeFor: null, notice: message });
  toast.error(message, { duration: 8_000 });
}

/** Avisa al servidor de que la ronda ya salió. Si falla, la próxima sincronización lo repite. */
async function confirm(roundId: number) {
  try {
    await stationApi.impresa(roundId, deviceId());
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) lose('Otro móvil es ahora la impresora de cocina. Este ha dejado de imprimir.');
  }
}

async function printWithRetries(round: PedidoApi): Promise<string> {
  const printer = getPrinter();
  if (!printer) return 'No hay ninguna impresora guardada en este móvil.';
  let lastError = '';
  for (const delay of RETRY_DELAYS_MS) {
    if (!running) return 'Impresión detenida.';
    if (delay) await wait(delay);
    try {
      await printRound(printer, round);
      return '';
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'No se pudo imprimir.';
    }
  }
  return lastError;
}

async function work() {
  if (working) return;
  working = true;
  try {
    while (running && queue.length) {
      const round = queue[0];
      const error = await printWithRetries(round);
      queue.shift();
      inQueue.delete(round.id);
      if (!running) break;
      if (!error) {
        rememberPrinted(round);
        warned.delete(round.id);
        await confirm(round.id);
        continue;
      }
      // Sin marcar en el servidor: la siguiente sincronización la vuelve a intentar sola.
      set(state => ({
        printerError: error,
        failed: [...state.failed.filter(item => item.id !== round.id), round],
      }));
      if (!warned.has(round.id)) {
        warned.add(round.id);
        toast.error(`Mesa ${round.mesa_numero ?? round.mesa_id}: no salió en papel. Se reintentará. ${error}`, { duration: 8_000 });
      }
    }
  } finally {
    working = false;
  }
}

function enqueue(round: PedidoApi) {
  if (!running || inQueue.has(round.id)) return;
  if (printed.has(round.id)) {
    // Ya salió en papel aquí; quizá el servidor no llegó a enterarse.
    void confirm(round.id);
    return;
  }
  inQueue.add(round.id);
  queue.push(round);
  void work();
}

async function sync() {
  if (!running) return;
  try {
    const rounds = await stationApi.pendientes(deviceId());
    rounds.forEach(enqueue);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) lose('Otro móvil es ahora la impresora de cocina. Este ha dejado de imprimir.');
    else if (error instanceof ApiError && error.status === 403) lose('Este local ya no usa la impresora de cocina del Comandero.');
    else if (!(error instanceof ApiError)) {
      // Sin red: el WebSocket puede seguir pareciendo abierto. Se cierra para reconectar de verdad.
      set({ connection: 'offline' });
      socket?.close();
    }
  }
}

function connect() {
  const token = localStorage.getItem('comandero_token');
  if (!running || !token) return;
  set({ connection: 'connecting' });
  const ws = new WebSocket(BASE_URL.replace(/^http/, 'ws') + '/ws/kitchen', ['comandero-jwt', token]);
  socket = ws;
  ws.onopen = () => {
    backoff = 1_000;
    set({ connection: 'online' });
    void sync();
  };
  ws.onmessage = event => {
    try {
      const message = JSON.parse(event.data) as { event?: string; pedido?: PedidoApi; dispositivo_id?: string | null; nombre?: string | null };
      if (message.event === 'ORDER_MARCHADO' && message.pedido?.estado === 'MARCHADO') enqueue(message.pedido);
      if (message.event === 'PRINTER_STATION_CHANGED' && message.dispositivo_id !== deviceId()) {
        lose(message.dispositivo_id
          ? `La impresora de cocina pasó a «${message.nombre ?? 'otro móvil'}». Este ha dejado de imprimir.`
          : 'Se desactivó la impresora de cocina.');
      }
    } catch { /* mensaje ajeno a la impresora */ }
  };
  ws.onclose = () => {
    if (socket !== ws) return;
    socket = null;
    if (!running) return;
    set({ connection: 'offline' });
    reconnectTimer = window.setTimeout(connect, backoff);
    backoff = Math.min(backoff * 2, 15_000);
  };
  ws.onerror = () => ws.close();
}

export const kitchenStation = {
  start() {
    if (running) return;
    running = true;
    backoff = 1_000;
    set({ failed: [], printerError: '' });
    void keepScreenOn(true);
    connect();
    void sync();
    syncTimer = window.setInterval(() => void sync(), SYNC_EVERY_MS);
  },

  stop() {
    running = false;
    window.clearTimeout(reconnectTimer);
    window.clearInterval(syncTimer);
    const ws = socket;
    socket = null;
    ws?.close();
    queue.length = 0;
    inQueue.clear();
    set({ connection: 'offline' });
    void keepScreenOn(false);
  },

  /** Reintenta ahora las rondas que no salieron. */
  retry() {
    useKitchenStation.getState().failed.forEach(enqueue);
    void sync();
  },

  /** Convierte este móvil en la impresora del local. Lanza ApiError 409 si ya la tiene otro móvil. */
  async activate(restauranteId: number, replace = false) {
    const printer = getPrinter();
    if (!printer) throw new Error('Guarda primero una impresora que haya impreso la prueba.');
    await stationApi.activar(deviceId(), printer.name, replace);
    writeJson(ACTIVE_KEY, restauranteId);
    set({ activeFor: restauranteId, notice: '' });
  },

  async deactivate() {
    try {
      await stationApi.liberar(deviceId());
    } catch (error) {
      // 403: otro móvil ya la tenía; aquí basta con dejar de imprimir.
      if (!(error instanceof ApiError && error.status === 403)) throw error;
    }
    writeJson(ACTIVE_KEY, null);
    set({ activeFor: null, notice: '' });
  },

  async reprint(round: PedidoApi) {
    const printer = getPrinter();
    if (!printer) throw new Error('No hay ninguna impresora guardada en este móvil.');
    await printRound(printer, round, true);
  },
};
