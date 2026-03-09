export type MesaEstado = 'LIBRE' | 'OCUPADA' | 'PENDIENTE_COBRO';

export interface Mesa {
  id: string;
  estado: MesaEstado;
  totalCuenta?: number;
  horaApertura?: string;
  comensales?: number;
}

export type FiltroMesa = 'TODAS' | 'LIBRES' | 'OCUPADAS' | 'PENDIENTE_COBRO';
