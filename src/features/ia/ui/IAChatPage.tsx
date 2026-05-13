/**
 * @module IAChatPage
 * @description Chat IA con function calling — muestra action cards cuando la IA ejecuta acciones.
 * SUME Docblock v2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIAStore } from '../state/iaStore';
import type { AccionEjecutada, MensajeChat } from '../types';
import styles from './IAChatPage.module.css';

type Tab = 'chat' | 'informe';

const INFORME_LABELS: Record<string, string> = {
  ventas:          'Ventas Totales',
  coste_diario:    'Coste del Día',
  beneficio_bruto: 'Beneficio Bruto',
  beneficio_neto:  'Beneficio Neto',
  reserva_iva:     'Reserva IVA',
};

const ACCION_ICON: Record<string, string> = {
  crear_empleado:      '👤',
  desactivar_empleado: '🚫',
  registrar_gasto:     '💰',
  eliminar_gasto:      '🗑️',
};

function formatTime(d: Date): string {
  return new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function ActionCard({ accion }: { accion: AccionEjecutada }) {
  const ok   = accion.resultado.startsWith('✅');
  const icon = ACCION_ICON[accion.funcion] ?? '⚡';
  return (
    <div className={`${styles.actionCard} ${ok ? styles.actionOk : styles.actionErr}`}>
      <span className={styles.actionIcon}>{icon}</span>
      <span className={styles.actionText}>{accion.resultado}</span>
    </div>
  );
}

function Bubble({ msg }: { msg: MensajeChat }) {
  const isUser = msg.rol === 'usuario';
  return (
    <div className={`${styles.bubbleWrap} ${isUser ? styles.bubbleWrapUser : ''}`}>
      <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleIA}`}>
        <p className={styles.bubbleText}>{msg.contenido}</p>
        <span className={styles.bubbleTime}>{formatTime(msg.timestamp)}</span>
      </div>
      {msg.accion && <ActionCard accion={msg.accion} />}
    </div>
  );
}

export const IAChatPage: React.FC = () => {
  const {
    historial, informe, sugerencias,
    isChatLoading, isLoading, error,
    enviarMensaje, generarInforme, cargarSugerencias, limpiarChat,
  } = useIAStore();

  const navigate = useNavigate();
  const [tab, setTab]     = useState<Tab>('chat');
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cargarSugerencias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [historial, isChatLoading]);

  const handleSend = async () => {
    const t = input.trim();
    if (!t || isChatLoading) return;
    setInput('');
    await enviarMensaje(t);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className={styles.container}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/mesas')} aria-label="Volver a mesas">
          ←
        </button>
        <div className={styles.headerText}>
          <h1 className={styles.headerTitle}>🤖 Asistente IA</h1>
          <p className={styles.headerSub}>Pregunta, gestiona y controla tu negocio</p>
        </div>
        {tab === 'chat' && historial.length > 0 && (
          <button className={styles.clearBtn} onClick={limpiarChat}>🗑</button>
        )}
      </header>

      {/* ── Tab Bar ── */}
      <div className={styles.tabBar}>
        <button className={`${styles.tab} ${tab === 'chat' ? styles.tabActive : ''}`} onClick={() => setTab('chat')}>
          💬 Chat
        </button>
        <button className={`${styles.tab} ${tab === 'informe' ? styles.tabActive : ''}`} onClick={() => setTab('informe')}>
          📊 Informe Diario
        </button>
      </div>

      {/* ── TAB CHAT ── */}
      {tab === 'chat' && (
        <>
          <div className={styles.chatContainer}>

            {historial.length === 0 && !isChatLoading && (
              <div className={styles.emptyChat}>
                <div className={styles.botAvatar}>🤖</div>
                <p className={styles.emptyTitle}>Tu asistente de negocio</p>
                <p className={styles.emptyText}>
                  Puedo informarte sobre ventas, gastos y personal.<br />
                  También puedo <strong>añadir empleados</strong> y <strong>registrar gastos</strong> directamente.
                </p>
                <div className={styles.chips}>
                  {sugerencias.map(s => (
                    <button key={s} className={styles.chip} onClick={() => setInput(s)}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {historial.map((msg, i) => <Bubble key={i} msg={msg} />)}

            {isChatLoading && (
              <div className={styles.bubbleWrap}>
                <div className={`${styles.bubble} ${styles.bubbleIA}`}>
                  <span className={styles.typingDots}>···</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className={styles.inputBar}>
            <input
              className={styles.chatInput}
              type="text"
              placeholder="Pregunta o pide una acción..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={isChatLoading}
            />
            <button className={styles.sendBtn} onClick={handleSend} disabled={!input.trim() || isChatLoading}>
              ➤
            </button>
          </div>
        </>
      )}

      {/* ── TAB INFORME ── */}
      {tab === 'informe' && (
        <div className={styles.informeSection}>
          <button className={styles.generarBtn} onClick={generarInforme} disabled={isLoading}>
            {isLoading ? '⏳ Analizando...' : '✨ Generar Informe del Día'}
          </button>

          {isLoading && <div className={styles.spinner}><span className={styles.spinnerDot} /></div>}

          {informe && !isLoading && (
            <>
              <div className={styles.informeGrid}>
                {(Object.keys(informe.datos) as Array<keyof typeof informe.datos>).map(k => (
                  <div key={k} className={styles.informeCard}>
                    <p className={styles.informeLabel}>{INFORME_LABELS[k] ?? k}</p>
                    <p className={styles.informeValue}>{informe.datos[k].toFixed(2)}€</p>
                  </div>
                ))}
              </div>
              <div className={styles.informeNarrativa}>
                <p className={styles.narrativaTitle}>📋 Análisis completo</p>
                <pre className={styles.narrativaText}>{informe.informe}</pre>
              </div>
            </>
          )}

          {!informe && !isLoading && (
            <div className={styles.informeEmpty}>
              Genera el informe para obtener un análisis completo con recomendaciones personalizadas.
            </div>
          )}
        </div>
      )}

      {error && <div className={styles.errorBanner}>{error}</div>}
    </div>
  );
};
