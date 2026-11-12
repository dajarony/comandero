/**
 * OrderPageV2.hooks — Lógica de estado del comandero con grupos de menú
 * SUME Docblock v2.0 | Entradas: mesaId | Salidas: estado + handlers
 * Navegación: Grupos → Categorías → Items (3 niveles)
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { orderApi } from '../api/orderApi';
import type { CategoriaApi, MenuItemApi, LineaPedidoCreate } from '../api/orderApi';
import { tablesApi } from '@/features/tables/api/tablesApi';
import { MENU_GROUPS } from '../config/menuGroups';
import type { GrupoMenu } from '../config/menuGroups';
import type { LineaCarrito } from './OrderPageV2.helpers';

const FAV_KEY = 'comandero-favoritos';
export const FAV_CAT: CategoriaApi = { id: -1, nombre: 'Favoritos', emoji: '⭐', orden: 0 };

export function useOrderPageState(mesaId: string) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pedidoIdContinuar = searchParams.get('pedido') ? Number(searchParams.get('pedido')) : null;

  const [categorias, setCategorias] = useState<CategoriaApi[]>([]);
  const [items, setItems] = useState<MenuItemApi[]>([]);
  const [todosItems, setTodosItems] = useState<MenuItemApi[]>([]);
  const [grupoActivo, setGrupoActivo] = useState<GrupoMenu | null>(null);
  const [catActiva, setCatActiva] = useState<CategoriaApi | null>(null);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [errorMenu, setErrorMenu] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [tienePedidosActivos, setTienePedidosActivos] = useState(false);
  const [carrito, setCarrito] = useState<LineaCarrito[]>([]);
  const [carritoVisible, setCarritoVisible] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaActiva, setBusquedaActiva] = useState(false);
  const [favoritos, setFavoritos] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]'); } catch { return []; }
  });
  const [ultimaRonda, setUltimaRonda] = useState<LineaCarrito[]>(() => {
    try { return JSON.parse(localStorage.getItem(`ultima_ronda_${mesaId}`) ?? '[]'); } catch { return []; }
  });

  useEffect(() => { localStorage.setItem(FAV_KEY, JSON.stringify(favoritos)); }, [favoritos]);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      setErrorMenu(null);
      orderApi.fetchCategorias()
        .then(setCategorias)
        .catch(() => setErrorMenu('Error al cargar el menú.'))
        .finally(() => setLoadingCats(false));
      orderApi.fetchItems()
        .then(setTodosItems)
        .catch(() => setErrorMenu('Error al cargar artículos.'));
      orderApi.pedidosPorMesa(Number(mesaId))
        .then(p => setTienePedidosActivos(p.length > 0))
        .catch(() => setTienePedidosActivos(false));
    }, 0);
    return () => window.clearTimeout(initial);
  }, [mesaId]);

  useEffect(() => {
    if (!catActiva || catActiva.id === -1) return;
    let active = true;
    const initial = window.setTimeout(() => {
      setLoadingItems(true);
      setErrorMenu(null);
      orderApi.fetchItems(catActiva.id)
        .then(items => { if (active) setItems(items); })
        .catch(() => { if (active) setErrorMenu('Error al cargar esta categoría.'); })
        .finally(() => { if (active) setLoadingItems(false); });
    }, 0);
    return () => { active = false; window.clearTimeout(initial); };
  }, [catActiva]);

  // Categorías filtradas por grupo activo
  const categoriasDelGrupo = useMemo(() => {
    if (!grupoActivo) return [];
    const lower = grupoActivo.categorias.map(n => n.toLowerCase());
    return categorias.filter(c => lower.includes(c.nombre.toLowerCase()));
  }, [grupoActivo, categorias]);

  // Grupos con conteo de categorías disponibles
  const gruposConConteo = useMemo(() => {
    return MENU_GROUPS.map(g => ({
      ...g,
      count: categorias.filter(c => g.categorias.map(n => n.toLowerCase()).includes(c.nombre.toLowerCase())).length,
    }));
  }, [categorias]);

  const total = carrito.reduce((s, l) => s + l.item.precio * l.cantidad, 0);
  const totalItems = carrito.reduce((s, l) => s + l.cantidad, 0);

  const itemsMostrar = busqueda
    ? todosItems.filter(i => i.disponible && i.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : catActiva?.id === -1
      ? todosItems.filter(i => favoritos.includes(i.id))
      : items.filter(i => i.disponible);

  const addToCart = (item: MenuItemApi) => {
    setCarrito(prev => {
      const ex = prev.find(l => l.item.id === item.id);
      return ex
        ? prev.map(l => l.item.id === item.id ? { ...l, cantidad: l.cantidad + 1 } : l)
        : [...prev, { item, cantidad: 1, nota: '' }];
    });
    toast.success(`Añadido: ${item.nombre}`, {
      duration: 800,
      position: 'bottom-center',
      icon: '✅',
      style: { borderRadius: '12px', fontSize: '14px', fontWeight: '600' }
    });
  };

  const removeFromCart = (id: number) =>
    setCarrito(prev => {
      const ex = prev.find(l => l.item.id === id);
      return ex && ex.cantidad > 1
        ? prev.map(l => l.item.id === id ? { ...l, cantidad: l.cantidad - 1 } : l)
        : prev.filter(l => l.item.id !== id);
    });

  const updateNota = (id: number, nota: string) =>
    setCarrito(prev => prev.map(l => l.item.id === id ? { ...l, nota } : l));

  const repetirRonda = () => { if (ultimaRonda.length > 0) setCarrito(ultimaRonda); };

  const toggleFav = (e: React.MouseEvent, itemId: number) => {
    e.stopPropagation();
    setFavoritos(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]);
  };

  const handleMarchar = async () => {
    if (carrito.length === 0) return;
    setEnviando(true);
    const lineas: LineaPedidoCreate[] = carrito.map(l => ({ item_menu_id: l.item.id, cantidad: l.cantidad, nota: l.nota }));
    try {
      let pedido;
      if (pedidoIdContinuar) {
        // Añadir a persona existente
        pedido = await orderApi.agregarLineas(pedidoIdContinuar, lineas);
      } else {
        // Nueva persona
        await tablesApi.abrirMesa(Number(mesaId), 1).catch(() => {});
        pedido = await orderApi.crearPedido({ mesa_id: Number(mesaId), lineas });
      }
      localStorage.setItem(`ultima_ronda_${mesaId}`, JSON.stringify(carrito));
      setUltimaRonda(carrito);
      if ('_offlineQueued' in pedido) toast('Comanda guardada en este móvil. Pendiente de sincronizar.');
      else toast.success('Comanda guardada. Pulsa «Marchar» para enviarla a cocina.');
      navigate('/comandas', { replace: true });
    } catch {
      toast.error('No se pudo enviar el pedido. Se intentará reconectar.');
    } finally { setEnviando(false); }
  };

  const handlePedirCuenta = async () => {
    setEnviando(true);
    try {
      await tablesApi.cambiarEstado(Number(mesaId), 'PENDIENTE_COBRO');
      toast.success('Cuenta solicitada.');
      navigate('/mesas');
    } catch {
      toast.error('Error al solicitar la cuenta.');
    } finally { setEnviando(false); }
  };

  // Navegación 3 niveles: Items → Categorías → Grupos → Mesas
  const handleBack = () => {
    if (busquedaActiva) { setBusquedaActiva(false); setBusqueda(''); }
    else if (catActiva) { setCatActiva(null); setItems([]); }
    else if (grupoActivo) { setGrupoActivo(null); }
    else { navigate('/mesas'); }
  };

  // Subtítulo dinámico según nivel
  const subtitulo = catActiva
    ? catActiva.nombre
    : grupoActivo
      ? grupoActivo.nombre
      : pedidoIdContinuar
        ? `Añadiendo a comanda #${pedidoIdContinuar}`
        : 'Nueva persona';

  // Texto del botón back
  const backLabel = busquedaActiva ? 'Cerrar'
    : catActiva ? grupoActivo?.nombre ?? 'Menú'
    : grupoActivo ? 'Menú'
    : 'Mesas';

  return {
    categorias, categoriasDelGrupo, gruposConConteo,
    grupoActivo, setGrupoActivo,
    catActiva, setCatActiva, itemsMostrar,
    loadingCats, loadingItems, errorMenu, enviando,
    tienePedidosActivos, carrito, carritoVisible, setCarritoVisible,
    busqueda, setBusqueda, busquedaActiva, setBusquedaActiva,
    favoritos, ultimaRonda, total, totalItems,
    addToCart, removeFromCart, updateNota, repetirRonda,
    toggleFav, handleMarchar, handlePedirCuenta, handleBack,
    subtitulo, backLabel,
  };
}
