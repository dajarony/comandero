/**
 * @module printTicket
 * @description Genera HTML de ticket térmico y abre el diálogo de impresión nativo
 * SUME Docblock v2.0
 * Entradas : pedido (PedidoApi), mesaNumero, destino opcional
 * Lógica   : crea iframe oculto, escribe HTML recibo, llama window.print()
 * Salidas  : void (efecto secundario: diálogo de impresión)
 */
import type { PedidoApi } from '@/features/order/api/orderApi';
import { PrintWebview } from '@webnativellc/capacitor-print-webview';

const RESTAURANT_NAME = import.meta.env.VITE_RESTAURANT_NAME || 'RESTAURANTE';

interface TicketLine {
  nombre: string;
  cantidad: number;
  subtotal: string;
}

/** Formatea fecha legible para ticket */
function formatFecha(isoDate: string): string {
  const d = new Date(isoDate);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

/** Convierte pedido en líneas de ticket */
function buildLines(pedido: PedidoApi): TicketLine[] {
  return pedido.lineas.map(l => ({
    nombre: l.item_nombre,
    cantidad: l.cantidad,
    subtotal: (l.cantidad * l.precio_unitario).toFixed(2),
  }));
}



/**
 * Abre el diálogo de impresión nativo con el ticket formateado.
 * Abre ventana nueva para máxima compatibilidad con Android WebView.
 */
export function printTicket(
  pedido: PedidoApi,
  mesaNumero: number | string,
  destino?: string | null,
): void {
  const lines = buildLines(pedido);
  const total = pedido.total.toFixed(2);
  const fecha = formatFecha(pedido.created_at);
  const tipo = destino || 'TICKET';
  const sep = '================================';
  const dash = '--------------------------------';
  const itemsTxt = lines.map(l => `${l.cantidad}x ${l.nombre.padEnd(20)} ${l.subtotal}€`).join('\n');
  const texto = `${sep}\n    ${RESTAURANT_NAME}\n${sep}\n${tipo}\nMesa: ${mesaNumero}  Fecha: ${fecha}\n${dash}\n${itemsTxt}\n${dash}\nTOTAL:${' '.repeat(20)}${total}€\n${sep}`;
  printInPage(texto);
}

/**
 * Imprime ticket a partir del texto plano del backend.
 * Envuelve el texto en <pre> y lanza print().
 */
export function printTicketFromText(texto: string): void {
  printInPage(texto);
}

/**
 * Imprime inyectando contenido en un div oculto + window.print().
 * Compatible con Capacitor/Android WebView.
 */
function printInPage(texto: string): void {
  /* Inyectar estilos de impresión si no existen */
  if (!document.getElementById('print-styles')) {
    const style = document.createElement('style');
    style.id = 'print-styles';
    style.textContent = `
      @media print {
        body > *:not(#print-zone) { display: none !important; }
        #print-zone {
          display: block !important;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          width: 72mm;
          margin: 0;
          padding: 0;
        }
        #print-zone pre { white-space: pre-wrap; margin: 0; }
        @page { margin: 2mm; }
      }
    `;
    document.head.appendChild(style);
  }

  /* Crear o reutilizar el div de impresión */
  let zone = document.getElementById('print-zone');
  if (!zone) {
    zone = document.createElement('div');
    zone.id = 'print-zone';
    zone.style.display = 'none';
    document.body.appendChild(zone);
  }

  zone.replaceChildren();
  const pre = document.createElement('pre');
  pre.textContent = texto;
  zone.appendChild(pre);

  /* Lanzar diálogo de impresión nativo de Android */
  setTimeout(async () => {
    try {
      await PrintWebview.print();
    } catch {
      /* Fallback web si el plugin no está disponible */
      try { window.print(); } catch { /* noop */ }
    }
    /* Limpiar después */
    setTimeout(() => { zone?.replaceChildren(); }, 500);
  }, 100);
}
