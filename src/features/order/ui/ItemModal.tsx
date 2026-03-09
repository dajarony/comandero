// src/features/order/ui/ItemModal.tsx
import { useState } from 'react';
import type { MenuItemV2, ModificadorSeleccionado } from '../types/OrderTypesV2';

interface ItemModalProps {
  item: MenuItemV2;
  onConfirm: (mods: ModificadorSeleccionado[], nota: string) => void;
  onClose: () => void;
}

export function ItemModal({ item, onConfirm, onClose }: ItemModalProps) {
  const [selecciones, setSelecciones] = useState<Record<string, string | string[] | number>>({});
  const [nota, setNota] = useState('');

  const calcularTotal = () => {
    let extra = 0;
    item.modificadores.forEach(mod => {
      const sel = selecciones[mod.id];
      if (mod.tipo === 'radio' && sel) {
        const op = mod.opciones.find(o => o.id === sel);
        if (op) extra += op.precioExtra;
      }
      if (mod.tipo === 'checkbox' && Array.isArray(sel)) {
        sel.forEach(selId => {
          const op = mod.opciones.find(o => o.id === selId);
          if (op) extra += op.precioExtra;
        });
      }
      if (mod.tipo === 'stepper' && typeof sel === 'number' && sel > 0) {
        const op = mod.opciones[sel];
        if (op) extra += op.precioExtra;
      }
    });
    return item.precio + extra;
  };

  const handleRadio = (modId: string, opId: string) => {
    setSelecciones(prev => ({ ...prev, [modId]: opId }));
  };

  const handleCheckbox = (modId: string, opId: string) => {
    setSelecciones(prev => {
      const current = (prev[modId] as string[]) ?? [];
      const updated = current.includes(opId) ? current.filter(x => x !== opId) : [...current, opId];
      return { ...prev, [modId]: updated };
    });
  };

  const handleStepper = (modId: string, delta: number, max: number) => {
    setSelecciones(prev => {
      const current = (prev[modId] as number) ?? 0;
      const next = Math.max(0, Math.min(max, current + delta));
      return { ...prev, [modId]: next };
    });
  };

  const handleConfirm = () => {
    const mods: ModificadorSeleccionado[] = [];
    item.modificadores.forEach(mod => {
      const sel = selecciones[mod.id];
      if (mod.tipo === 'radio' && sel) {
        const op = mod.opciones.find(o => o.id === sel);
        mods.push({ modificadorId: mod.id, valor: sel as string, precioExtra: op?.precioExtra ?? 0 });
      }
      if (mod.tipo === 'checkbox' && Array.isArray(sel) && sel.length > 0) {
        const extra = sel.reduce((acc, sid) => acc + (mod.opciones.find(o => o.id === sid)?.precioExtra ?? 0), 0);
        mods.push({ modificadorId: mod.id, valor: sel, precioExtra: extra });
      }
      if (mod.tipo === 'stepper' && typeof sel === 'number' && sel > 0) {
        const op = mod.opciones[sel];
        mods.push({ modificadorId: mod.id, valor: sel, precioExtra: op?.precioExtra ?? 0 });
      }
    });
    onConfirm(mods, nota);
  };

  const stepperLabels = ['Ración simple', 'Ración doble', 'Ración triple'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

        {/* Header con foto */}
        <div className="relative h-44 shrink-0">
          {item.foto ? (
            <img src={item.foto} alt={item.nombre} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center text-7xl">
              {item.emoji}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-5">
            <div>
              <h2 className="text-white text-xl font-extrabold tracking-tight">{item.nombre}</h2>
              <p className="text-[#07d5a1] font-semibold text-sm">{item.descripcion}</p>
              <p className="text-white/80 font-bold">Desde {item.precio.toFixed(2)}€</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full p-2 text-white transition-colors"
          >
            <span className="text-xl leading-none">✕</span>
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="overflow-y-auto flex-1 p-5 space-y-7">
          {item.modificadores.map(mod => (
            <section key={mod.id}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                <span className="text-[#07d5a1]">■</span>
                {mod.nombre}
                {mod.obligatorio && <span className="text-red-400 text-xs">(obligatorio)</span>}
              </h3>

              {/* RADIO */}
              {mod.tipo === 'radio' && (
                <div className="grid grid-cols-2 gap-2">
                  {mod.opciones.map(op => {
                    const sel = selecciones[mod.id] === op.id;
                    return (
                      <button
                        key={op.id}
                        onClick={() => handleRadio(mod.id, op.id)}
                        className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                          sel
                            ? 'border-[#07d5a1] bg-teal-50 text-teal-700'
                            : 'border-slate-200 text-slate-600 hover:border-teal-300'
                        }`}
                      >
                        {op.label}
                        {op.precioExtra > 0 && <span className="block text-xs text-teal-600">+{op.precioExtra.toFixed(2)}€</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* CHECKBOX */}
              {mod.tipo === 'checkbox' && (
                <div className="space-y-2">
                  {mod.opciones.map(op => {
                    const checked = ((selecciones[mod.id] as string[]) ?? []).includes(op.id);
                    return (
                      <label
                        key={op.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-teal-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleCheckbox(mod.id, op.id)}
                            className="w-5 h-5 rounded accent-teal-500"
                          />
                          <span className="font-medium text-sm">{op.label}</span>
                        </div>
                        {op.precioExtra > 0 && (
                          <span className="text-[#07d5a1] font-bold text-sm">+{op.precioExtra.toFixed(2)}€</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              {/* STEPPER */}
              {mod.tipo === 'stepper' && (
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-semibold text-sm text-slate-700">Cantidad de carne</span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleStepper(mod.id, -1, mod.maxStepper ?? 3)}
                      className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-lg font-bold hover:bg-[#07d5a1] hover:text-white hover:border-[#07d5a1] transition-all"
                    >−</button>
                    <span className="text-sm font-bold min-w-[80px] text-center text-slate-800">
                      {stepperLabels[(selecciones[mod.id] as number) ?? 0] ?? 'Ración simple'}
                    </span>
                    <button
                      onClick={() => handleStepper(mod.id, 1, mod.maxStepper ?? 3)}
                      className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-lg font-bold hover:bg-[#07d5a1] hover:text-white hover:border-[#07d5a1] transition-all"
                    >+</button>
                  </div>
                </div>
              )}

              {/* TEXTAREA (notas) */}
              {mod.tipo === 'textarea' && (
                <textarea
                  value={nota}
                  onChange={e => setNota(e.target.value)}
                  placeholder="Ej: Sin cebolla, salsas aparte, alergia a frutos secos..."
                  className="w-full h-20 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#07d5a1] focus:ring-1 focus:ring-[#07d5a1] p-3 text-sm outline-none resize-none"
                />
              )}
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-white shrink-0">
          <button
            onClick={handleConfirm}
            className="w-full py-4 rounded-2xl bg-[#F04770] hover:bg-[#d63d61] text-white font-bold text-base flex items-center justify-center gap-4 transition-all shadow-lg active:scale-[0.98]"
          >
            <span>Confirmar y Añadir</span>
            <span className="w-px h-5 bg-white/30" />
            <span>{calcularTotal().toFixed(2)}€</span>
          </button>
        </div>
      </div>
    </div>
  );
}
