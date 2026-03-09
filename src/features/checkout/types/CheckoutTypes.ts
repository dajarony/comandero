export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'QR';

export interface ItemResumen {
  nombre: string;
  cantidad: number;
  precioUnit: number;
  emoji: string;
  subtotal: number;
}
