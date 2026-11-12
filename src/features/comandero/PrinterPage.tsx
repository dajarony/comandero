import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { IScannerControls } from '@zxing/browser';
import { discoverPrinters, getPrinter, printerAvailable, printerQR, printTest, readPrinterQR, savePrinter, validPrinterIp, type Printer } from './printer';
import styles from './service.module.css';

const defaultPrinter: Printer = { name: 'Cocina', ip: '', columns: 32 };

export function PrinterPage() {
  const [saved, setSaved] = useState(getPrinter);
  const [draft, setDraft] = useState<Printer>(() => getPrinter() ?? defaultPrinter);
  const [test, setTest] = useState('');
  const [results, setResults] = useState<{ name: string; ip: string }[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [scan, setScan] = useState(false);
  const [qr, setQR] = useState('');
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!scan || !video.current) return;
    const element = video.current;
    let cancelled = false;
    let controls: IScannerControls | undefined;
    void import('@zxing/browser').then(async ({ BrowserQRCodeReader }) => {
      if (cancelled) return;
      const reader = new BrowserQRCodeReader();
      controls = await reader.decodeFromConstraints({ audio: false, video: { facingMode: { ideal: 'environment' } } }, element,
        (result, _, control) => {
          if (!result || cancelled) return;
          control.stop();
          setScan(false);
          try {
            setDraft(readPrinterQR(result.getText()));
            setTest('');
            setError('');
            setMessage('QR leído. Envía una prueba para verificar la impresora.');
          } catch {
            setError('Usa un QR generado desde los ajustes de impresora de Comandero.');
          }
        });
      if (cancelled) controls.stop();
    }).catch(() => {
      if (!cancelled) { setScan(false); setError('No se pudo abrir la cámara. Revisa el permiso o introduce la dirección IP.'); }
    });
    return () => { cancelled = true; controls?.stop(); };
  }, [scan]);

  async function discover() {
    setBusy(true);
    setError('');
    setMessage('Buscando impresoras…');
    try {
      const devices = await discoverPrinters();
      setResults(devices);
      setMessage(devices.length ? 'Elige una impresora y envía una prueba.' : 'No se detectó ninguna. Puedes escribir la IP de la impresora.');
    } catch { setError('No se pudo buscar en la red. Puedes introducir la dirección IP.'); setMessage(''); }
    finally { setBusy(false); }
  }

  async function testDraft() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await printTest(draft);
      setTest(printerQR(draft));
      setMessage('Prueba enviada. Si ha salido el papel correctamente, guarda la impresora.');
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo enviar la prueba.'); }
    finally { setBusy(false); }
  }

  return <main className={styles.page}>
    <header className={styles.hero}><div><p className={styles.brand}>Comandero</p><h1>Impresora</h1></div><Link className={styles.back} to="/mesas">← Mesas</Link></header>
    {!printerAvailable ? <p className={styles.empty}>La impresión directa se configura desde la app de Android. Puedes usar la pantalla de cocina desde este dispositivo.</p> : <>
      <p>Conecta el móvil y la impresora térmica ESC/POS a la misma red local.</p>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <div className={styles.stack}>
        <section className={styles.card}>
          <div className={styles.row}><button disabled={busy || scan} onClick={() => void discover()}>Buscar impresora</button>
            <button disabled={busy} onClick={() => setScan(!scan)}>{scan ? 'Cerrar cámara' : 'Escanear QR'}</button></div>
          {scan && <video ref={video} autoPlay muted playsInline className={styles.video} aria-label="Cámara para escanear el QR" />}
          {results.map(item => <button key={item.ip} disabled={busy || scan} onClick={() => { setDraft({ ...draft, ...item }); setTest(''); }}>
            {item.name} · {item.ip}
          </button>)}
          <label>Nombre<input disabled={busy} value={draft.name} maxLength={50} onChange={event => setDraft({ ...draft, name: event.target.value })} /></label>
          <label>Dirección IP<input disabled={busy} value={draft.ip} inputMode="decimal" placeholder="192.168.1.100" onChange={event => setDraft({ ...draft, ip: event.target.value.trim() })} /></label>
          <label>Papel<select disabled={busy} value={draft.columns} onChange={event => setDraft({ ...draft, columns: event.target.value === '32' ? 32 : 48 })}>
            <option value="32">58 mm · 32 columnas</option><option value="48">80 mm · 48 columnas</option>
          </select></label>
          <div className={styles.row}><button disabled={busy || scan || !validPrinterIp(draft.ip)} onClick={() => void testDraft()}>Imprimir prueba</button>
            <button className={styles.primary} disabled={busy || test !== printerQR(draft) || !draft.name.trim()} onClick={() => {
              savePrinter(draft); setSaved(draft); setQR(''); setMessage('Impresora guardada. Las nuevas comandas se imprimirán automáticamente desde este móvil.');
            }}>Guardar impresora</button></div>
        </section>
        {saved && <section className={styles.card}>
          <h2>Impresión automática activa</h2><p>{saved.name} · {saved.ip}</p>
          <div className={styles.row}><button onClick={() => {
            void import('qrcode').then(module => module.toDataURL(printerQR(saved), { width: 320 })).then(setQR)
              .catch(() => setError('No se pudo crear el QR.'));
          }}>Mostrar QR</button>
          <button onClick={() => { savePrinter(null); setSaved(null); setTest(''); setQR(''); setMessage('Impresión automática desactivada.'); }}>Desconectar</button></div>
          {qr && <img className={styles.qr} src={qr} alt="QR para configurar la impresora en otro móvil con Comandero" />}
        </section>}
      </div>
    </>}
  </main>;
}
