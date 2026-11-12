import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/features/auth/state/authStore';
import { orderApi, type CategoriaApi, type MenuItemApi, type PedidoCreate } from '@/features/order/api/orderApi';
import { offlineStore } from '@/core/api/offlineStore';
import { tablesApi } from '@/features/tables/api/tablesApi';
import type { Mesa } from '@/features/tables/types/TablesTypes';
import { comanderoApi, ROUNDS_ENDPOINT } from './api';
import styles from './service.module.css';

type Line = { key: string; product: MenuItemApi; quantity: number; note: string };
type Menu = { categories: CategoriaApi[]; products: MenuItemApi[] };
const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export function ServiceOrderPage() {
  const { mesaId } = useParams();
  const id = Number(mesaId);
  return Number.isSafeInteger(id) && id > 0 ? <ServiceOrder key={id} mesaId={id} /> : <Navigate to="/mesas" replace />;
}

function ServiceOrder({ mesaId }: { mesaId: number }) {
  const navigate = useNavigate();
  const recover: string | undefined = useLocation().state?.recover;
  const userId = useAuthStore(s => s.usuario?.id);
  const favoritesKey = `comandero-favoritos-${userId}`;
  const [favorites, setFavorites] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem(favoritesKey) ?? '[]'); } catch { return []; }
  });
  const [mesa, setMesa] = useState<Mesa>();
  const [menu, setMenu] = useState<Menu>();
  const [lines, setLines] = useState<Line[]>([]);
  const [category, setCategory] = useState<number | 'favorites' | 'all'>('all');
  const [query, setQuery] = useState('');
  const [review, setReview] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const sendLock = useRef(false);

  useEffect(() => {
    let active = true;
    const table = tablesApi.fetchMesa(mesaId).catch(async () => {
      const cached = (await tablesApi.fetchMesas()).find(item => item.id === mesaId);
      if (!cached) throw new Error('No se pudo abrir esta mesa.');
      return cached;
    });
    Promise.all([table, orderApi.fetchCategorias(), orderApi.fetchItems(), recover ? offlineStore.getOutbox() : []])
      .then(([mesa, categories, products, outbox]) => {
        if (active) {
          setMesa(mesa);
          setMenu({ categories, products });
          const previous = outbox.find(item => item.id === recover && item.status === 'failed' && item.endpoint === ROUNDS_ENDPOINT);
          const draft = previous?.body as unknown as PedidoCreate | undefined;
          if (draft?.mesa_id === mesa.id) {
            const restored = draft.lineas.flatMap(line => {
              const product = products.find(product => product.id === line.item_menu_id);
              return product ? [{ key: crypto.randomUUID(), product, quantity: line.cantidad, note: line.nota }] : [];
            });
            setLines(restored);
            setReview(true);
            if (restored.length !== draft.lineas.length) setError('Hay productos de la ronda anterior que ya no están en la carta. Revisa la comanda antes de enviarla.');
          }
        }
      })
      .catch((err: Error) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [mesaId, recover]);

  function toggleFavorite(id: number) {
    const next = favorites.includes(id) ? favorites.filter(favorite => favorite !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem(favoritesKey, JSON.stringify(next));
  }

  function add(product: MenuItemApi) {
    const key = crypto.randomUUID();
    setLines(current => {
      const plain = current.find(line => line.product.id === product.id && !line.note);
      return plain
        ? current.map(line => line.key === plain.key ? { ...line, quantity: line.quantity + 1 } : line)
        : [...current, { key, product, quantity: 1, note: '' }];
    });
  }

  function adjust(key: string, difference: number) {
    setLines(current => current.map(line => line.key === key ? { ...line, quantity: line.quantity + difference } : line)
      .filter(line => line.quantity > 0));
  }

  async function send() {
    if (!mesa || lines.length === 0 || sendLock.current) return;
    sendLock.current = true;
    setSending(true);
    setError('');
    try {
      const response = await comanderoApi.enviar({
        mesa_id: mesa.id,
        turno: mesa.turno,
        lineas: lines.map(line => ({ item_menu_id: line.product.id, cantidad: line.quantity, nota: line.note.trim() })),
      });
      if ('_offlineQueued' in response) {
        toast('Guardada en este móvil. Pendiente de enviar a cocina.');
      } else {
        toast.success('Comanda enviada a cocina');
      }
      if (recover) await offlineStore.removeOutboxItem(recover).catch(() => {});
      navigate('/comandas', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la comanda.');
    } finally {
      sendLock.current = false;
      setSending(false);
    }
  }

  const term = normalize(query.trim());
  const products = menu?.products.filter(product => product.disponible && (term
    ? normalize(product.nombre).includes(term)
    : category === 'all' || (category === 'favorites' ? favorites.includes(product.id) : product.categoria_id === category))) ?? [];
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const quantities = new Map<number, number>();
  for (const line of lines) quantities.set(line.product.id, (quantities.get(line.product.id) ?? 0) + line.quantity);

  return (
    <main className={`${styles.page} ${styles.order}`}>
      <header className={styles.orderHeader}>
        <Link to="/mesas" className={styles.back}>← Mesas</Link>
        <h1>{mesa ? `Mesa ${mesa.numero}` : 'Comanda'}</h1>
        {count > 0 && <button type="button" onClick={() => setReview(!review)} disabled={sending}>{review ? 'Volver a la carta' : `Revisar (${count})`}</button>}
      </header>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {!menu && !error && <p role="status">Cargando carta…</p>}
      {menu && !review && (
        <>
          <label className={styles.search}><span className={styles.srOnly}>Buscar en la carta</span>
            <input type="search" value={query} placeholder="Buscar en la carta" onChange={event => setQuery(event.target.value)} />
          </label>
          {!term && <div className={styles.categories} aria-label="Categorías">
            <button aria-pressed={category === 'all'} onClick={() => setCategory('all')}>Todo</button>
            <button aria-pressed={category === 'favorites'} onClick={() => setCategory('favorites')}>Favoritos</button>
            {menu.categories.map(item => <button key={item.id} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.nombre}</button>)}
          </div>}
          <ul className={styles.products}>
            {products.map(product => (
              <li className={styles.product} key={product.id}>
                <button className={styles.add} onClick={() => add(product)} disabled={sending} aria-label={`Añadir ${product.nombre}`}>
                  <span>{product.nombre}</span>
                  <span className={styles.addMark} aria-hidden="true">{quantities.has(product.id) && <b>{quantities.get(product.id)}</b>} +</span>
                </button>
                <button className={styles.favorite} aria-label={`Favorito: ${product.nombre}`} aria-pressed={favorites.includes(product.id)}
                  onClick={() => toggleFavorite(product.id)}>{favorites.includes(product.id) ? '★' : '☆'}</button>
              </li>
            ))}
          </ul>
          {products.length === 0 && <p className={styles.empty}>{category === 'favorites' && !term ? 'Marca la estrella de tus productos habituales.' : 'No hay productos disponibles aquí.'}</p>}
        </>
      )}
      {review && <section aria-label="Revisar comanda" className={styles.stack}>
        {recover && <p>Revisa la ronda recuperada. Si la envías, se añadirá al servicio actual de esta mesa.</p>}
        {lines.map(line => <article key={line.key} className={styles.card}>
          <div className={styles.row}><strong>{line.product.nombre}</strong><div className={styles.stepper}>
            <button disabled={sending} aria-label={`Quitar una unidad de ${line.product.nombre}`} onClick={() => adjust(line.key, -1)}>−</button>
            <span>{line.quantity}</span>
            <button disabled={sending} aria-label={`Añadir una unidad de ${line.product.nombre}`} onClick={() => adjust(line.key, 1)}>+</button>
          </div></div>
          <label>Nota para cocina<input maxLength={300} disabled={sending} value={line.note} placeholder="Por ejemplo, sin cebolla"
            onChange={event => setLines(current => current.map(item => item.key === line.key ? { ...item, note: event.target.value } : item))} /></label>
        </article>)}
        {lines.length === 0 && <button onClick={() => setReview(false)}>Volver a la carta</button>}
      </section>}
      {count > 0 && <footer className={styles.sendBar}>
        <button type="button" className={styles.primary} onClick={() => void send()} disabled={sending || !mesa}>
          {sending ? 'Enviando…' : `Enviar ${count} ${count === 1 ? 'artículo' : 'artículos'} a cocina`}
        </button>
      </footer>}
    </main>
  );
}
