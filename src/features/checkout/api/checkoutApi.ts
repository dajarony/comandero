// Mock API — en Fase 3 enviará la factura al backend
export const checkoutApi = {
  cerrarCuenta: async (_mesaId: string) => Promise.resolve({ ok: true }),
};
