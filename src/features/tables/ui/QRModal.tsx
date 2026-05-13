import React from 'react';

interface QRModalProps {
  mesaNumero: string | number;
  onClose: () => void;
}

/**
 * @component QRModal
 * @description Modal que genera y muestra el código QR para que el cliente vea la carta.
 * Utiliza una API externa simple para no añadir dependencias pesadas.
 */
export const QRModal: React.FC<QRModalProps> = ({ mesaNumero, onClose }) => {
  // Construimos la URL de la carta (en producción esto debería ser la URL real del host)
  const baseUrl = window.location.origin;
  const menuUrl = `${baseUrl}/menu/1?mesa=${mesaNumero}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(menuUrl)}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl animate-scale-in">
        <div className="p-8 text-center">
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl text-2xl font-black">
            QR
          </div>
          
          <h2 className="text-2xl font-black text-slate-800 mb-2">Mesa {mesaNumero}</h2>
          <p className="text-slate-500 text-sm font-medium mb-8">
            Escanea este código para ver la carta digital en tu móvil.
          </p>

          <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200 mb-8 inline-block">
            <img 
              src={qrImageUrl} 
              alt={`QR Mesa ${mesaNumero}`}
              className="w-48 h-48 rounded-xl"
            />
          </div>

          <div className="grid gap-3">
            <button
              onClick={() => window.print()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-95"
            >
              Imprimir Código
            </button>
            <button
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-2xl transition-all active:scale-95"
            >
              Cerrar
            </button>
          </div>
        </div>

        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {menuUrl}
          </p>
        </div>
      </div>
    </div>
  );
};
