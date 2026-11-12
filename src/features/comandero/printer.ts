import { Capacitor, registerPlugin } from '@capacitor/core';
import { useAuthStore } from '@/features/auth/state/authStore';
import type { PedidoApi } from '@/features/order/api/orderApi';

export type Printer = { name: string; ip: string; columns: 32 | 48 };
interface PrinterPlugin {
  discover(): Promise<{ printers: { name: string; ip: string }[] }>;
  print(options: { ip: string; text: string }): Promise<void>;
  keepAwake(options: { enabled: boolean }): Promise<void>;
}

export const printerAvailable = Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('KitchenPrinter');
const native = registerPlugin<PrinterPlugin>('KitchenPrinter');
const printerKey = () => `comandero-impresora-${useAuthStore.getState().usuario?.restaurante_id ?? 'local'}`;

export function validPrinterIp(value: string): boolean {
  if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) return false;
  const [a, b, c, d] = value.split('.').map(Number);
  return [a, b, c, d].every(n => n <= 255) && (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168));
}

export function printerQR(printer: Printer) {
  return `comandero://impresora?${new URLSearchParams({ v: '1', nombre: printer.name, ip: printer.ip, cols: String(printer.columns) })}`;
}

export function readPrinterQR(value: string): Printer {
  const url = new URL(value.trim());
  const ip = url.searchParams.get('ip') ?? '';
  const columns = url.searchParams.get('cols');
  if (url.protocol !== 'comandero:' || url.hostname !== 'impresora' || url.searchParams.get('v') !== '1'
      || !validPrinterIp(ip) || (columns !== '32' && columns !== '48')) throw new Error('Este QR no contiene una impresora válida de Comandero.');
  return { ip, columns: columns === '32' ? 32 : 48, name: (url.searchParams.get('nombre') || 'Cocina').slice(0, 50) };
}

export function getPrinter(): Printer | null {
  if (!printerAvailable) return null;
  try {
    const stored = localStorage.getItem(printerKey());
    return stored ? readPrinterQR(stored) : null;
  } catch { return null; }
}

export function savePrinter(printer: Printer | null) {
  if (printer) localStorage.setItem(printerKey(), printerQR(printer));
  else localStorage.removeItem(printerKey());
}

export async function discoverPrinters() {
  const { printers } = await native.discover();
  return printers.filter(printer => validPrinterIp(printer.ip));
}

export function printTest(printer: Printer) {
  return native.print({ ip: printer.ip, text: `COMANDERO\nPrueba de cocina\n${'='.repeat(printer.columns)}\n1 x Café\n    Sin azúcar\n` });
}

function clean(value: string) {
  return value.replace(/\p{Cc}/gu, ' ').trim();
}

function wrap(value: string, columns: number): string[] {
  const rows: string[] = [];
  let text = clean(value);
  while (text.length > columns) {
    const split = text.lastIndexOf(' ', columns);
    const end = split > 0 ? split : columns;
    rows.push(text.slice(0, end));
    text = text.slice(end).trimStart();
  }
  return [...rows, text];
}

export function printRound(printer: Printer, round: PedidoApi, copy = false) {
  const rows = [copy ? 'COPIA · COMANDA' : 'COMANDA · COCINA', ...wrap(`MESA ${round.mesa_numero ?? round.mesa_id}`, printer.columns),
    `Ronda #${round.id}`, '='.repeat(printer.columns)];
  for (const line of round.lineas) {
    rows.push(...wrap(`${line.cantidad} x ${line.item_nombre || 'Producto'}`, printer.columns));
    if (line.nota) rows.push(...wrap(`Nota: ${line.nota}`, printer.columns));
  }
  return native.print({ ip: printer.ip, text: rows.join('\n') });
}

/** Mantiene la pantalla encendida mientras este móvil es la impresora de cocina. */
export async function keepScreenOn(enabled: boolean) {
  if (!printerAvailable) return;
  await native.keepAwake({ enabled }).catch(() => undefined);
}
