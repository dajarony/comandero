// src/features/order/ui/OrderPageV2.tsx
import { useParams } from 'react-router-dom';
import { useOrderFlowV2 } from '../logic/useOrderFlowV2';
import { ItemModal } from './ItemModal';
import { MENU_MOCK_V2 } from '../api/menuMockV2';

export function OrderPageV2() {
  const { mesaId = '01' } = useParams<{ mesaId: string }>();
  const {
    nivel, bloques, bloqueActivo, subcatActiva,
    itemsSubcat, carrito, total, totalItems,
    carritoVisible, setCarritoVisible,
    itemModal, setItemModal, handleSelectBloque, handleSelectSubcat,
    handleBack, handleTapItem, handleConfirmModal, handleMarchar,
  } = useOrderFlowV2(mesaId);

  return (
    <div className="min-h-screen bg-[#f5f8f8] font-[Manrope,system-ui,sans-serif] flex flex-col">

      {/* HEADER */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-[#07d5a1] font-semibold text-sm"
          >
            ← {nivel === 'bloques' ? 'Mesas' : nivel === 'subcategorias' ? 'Menú' : bloqueActivo?.nombre}
          </button>
          <div className="text-center">
            <p className="font-extrabold text-slate-800 text-sm">Mesa {mesaId}</p>
            <p className="text-xs text-slate-400">
              {nivel === 'bloques' ? 'Selecciona categoría' : nivel === 'subcategorias' ? bloqueActivo?.nombre : subcatActiva?.nombre}
            </p>
          </div>
          <button
            onClick={() => setCarritoVisible(!carritoVisible)}
            className="relative w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl"
          >
            🛒
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#F04770] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* NIVEL 1 — BLOQUES */}
      {nivel === 'bloques' && (
        <div className="p-4 grid grid-cols-2 gap-4 flex-1">
          {bloques.map(bloque => (
            <button
              key={bloque.id}
              onClick={() => handleSelectBloque(bloque)}
              className={`${bloque.colorClass} border-2 rounded-2xl p-6 flex flex-col items-center gap-3 active:scale-95 transition-transform shadow-sm`}
            >
              <span className="text-5xl">{bloque.emoji}</span>
              <span className="font-extrabold text-slate-800 text-base">{bloque.nombre}</span>
              <span className="text-xs text-slate-500">{bloque.subcategorias.length} categorías</span>
            </button>
          ))}
        </div>
      )}

      {/* NIVEL 2 — SUB-CATEGORÍAS */}
      {nivel === 'subcategorias' && bloqueActivo && (
        <div className="p-4 grid grid-cols-2 gap-4 flex-1">
          {bloqueActivo.subcategorias.map(subcat => {
            const realCount = MENU_MOCK_V2.filter(i => i.subcategoria === subcat.id).length;
            return (
              <button
                key={subcat.id}
                onClick={() => handleSelectSubcat(subcat)}
                className="bg-white border-2 border-slate-200 rounded-2xl p-5 flex flex-col items-center gap-3 active:scale-95 transition-transform shadow-sm hover:border-[#07d5a1]"
              >
                <span className="text-4xl">{subcat.emoji}</span>
                <span className="font-bold text-slate-800 text-sm text-center">{subcat.nombre}</span>
                <span className="text-xs text-[#07d5a1] font-semibold">{realCount} items</span>
              </button>
            );
          })}
        </div>
      )}

      {/* NIVEL 3 — ITEMS */}
      {nivel === 'items' && (
        <div className="p-4 flex-1 space-y-3">
          {itemsSubcat.map(item => (
            <button
              key={item.id}
              onClick={() => handleTapItem(item)}
              className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-4 active:scale-[0.99] transition-transform text-left"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-3xl shrink-0 overflow-hidden">
                {item.foto
                  ? <img src={item.foto} alt={item.nombre} className="w-full h-full object-cover rounded-xl" />
                  : item.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm">{item.nombre}</p>
                <p className="text-xs text-slate-500 truncate">{item.descripcion}</p>
                {item.modificadores.length > 0 && (
                  <p className="text-xs text-[#07d5a1] mt-1">✦ Personalizable</p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="font-extrabold text-slate-800">{item.precio.toFixed(2)}€</p>
                <div className="mt-1 w-8 h-8 rounded-full bg-[#07d5a1] flex items-center justify-center text-white font-bold text-lg ml-auto">+</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* MODAL PERSONALIZACIÓN */}
      {itemModal && (
        <ItemModal
          item={itemModal}
          onConfirm={handleConfirmModal}
          onClose={() => setItemModal(null)}
        />
      )}

      {/* PANEL CARRITO */}
      {carritoVisible && carrito.length > 0 && (
        <div className="fixed inset-0 z-40 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCarritoVisible(false)} />
          <div className="relative w-full bg-white rounded-t-2xl p-5 max-h-[60vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-slate-800 text-lg">Comanda</h3>
              <button onClick={() => setCarritoVisible(false)} className="text-slate-400 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              {carrito.map((linea, i) => (
                <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-100">
                  <span className="text-2xl">{linea.item.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-800">{linea.item.nombre}</p>
                    {linea.nota && <p className="text-xs text-slate-400 italic">{linea.nota}</p>}
                  </div>
                  <span className="font-bold text-slate-800">{linea.precioUnitario.toFixed(2)}€</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4 font-extrabold text-lg text-slate-800">
              <span>Total</span><span>{total.toFixed(2)}€</span>
            </div>
          </div>
        </div>
      )}

      {/* FAB MARCHAR */}
      {carrito.length > 0 && !carritoVisible && (
        <div className="fixed bottom-4 left-4 right-4 z-30">
          <button
            onClick={handleMarchar}
            className="w-full py-4 rounded-2xl bg-[#F04770] text-white font-extrabold text-base shadow-xl active:scale-[0.98] transition-transform flex items-center justify-center gap-3"
          >
            🚀 MARCHAR PEDIDO
            <span className="bg-white/20 px-3 py-1 rounded-full">{total.toFixed(2)}€</span>
          </button>
        </div>
      )}
    </div>
  );
}
