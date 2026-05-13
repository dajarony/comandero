/**
 * @module useTicketFlow
 * @description Hook de lógica para la página de Ticket
 * SUME Docblock v2.0
 * Entradas : pedidoId (string de URL params)
 * Lógica   : carga pedido y ticket texto via orderApi
 * Salidas  : { pedido, loading, ticketTexto, handlers }
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { orderApi, type PedidoApi } from '../api/orderApi';
import { handleError } from '../../../core/errors/errorHandler';

export function useTicketFlow() {
  const { pedidoId } = useParams<{ pedidoId: string }>();
  const [searchParams] = useSearchParams();
  const mesaNum = searchParams.get('mesa') || '?';
  const navigate = useNavigate();

  const [pedido, setPedido] = useState<PedidoApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [ticketTexto, setTicketTexto] = useState<string | null>(null);

  useEffect(() => {
    if (!pedidoId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    orderApi.fetchPedido(Number(pedidoId))
      .then(setPedido)
      .catch((err) => handleError(err, 'Cargando Pedido'))
      .finally(() => setLoading(false));
  }, [pedidoId]);

  const handleVolverMesas = () => navigate('/mesas', { replace: true });

  const handleVolverComanda = () => {
    if (pedido) navigate(`/comanda/${pedido.mesa_id}`, { replace: true });
    else navigate('/mesas', { replace: true });
  };

  const handleVerTicketCocina = async () => {
    if (!pedidoId) return;
    try {
      const texto = await orderApi.fetchTicketTexto(Number(pedidoId));
      setTicketTexto(texto);
    } catch (err) {
      handleError(err, 'Ver Ticket');
    }
  };

  const handleCerrarTicket = () => setTicketTexto(null);

  return {
    pedido, loading, ticketTexto, mesaNum,
    handleVolverMesas, handleVolverComanda,
    handleVerTicketCocina, handleCerrarTicket,
  };
}
