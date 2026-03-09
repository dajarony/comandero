import { create } from 'zustand';

interface CheckoutState {
  pagado: Record<string, boolean>;
  setPagado: (mesaId: string) => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  pagado: {},
  setPagado: (mesaId) => set(state => ({
    pagado: { ...state.pagado, [mesaId]: true },
  })),
}));
