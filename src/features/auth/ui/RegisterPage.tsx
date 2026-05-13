/**
 * @module RegisterPage
 * @description Página de registro de nuevo restaurante
 * SUME Docblock v2.0
 * Entradas : Formulario (nombre restaurante, tu nombre, email, password)
 * Lógica   : Delega en useRegisterFlow
 * Salidas  : JSX del formulario de registro
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRegisterFlow } from '../logic/useRegisterFlow';
import styles from './AuthPage.module.css';

export function RegisterPage() {
  const {
    nombreRestaurante, setNombreRestaurante,
    nombreAdmin, setNombreAdmin,
    email, setEmail,
    password, setPassword,
    error, loading, handleRegister,
  } = useRegisterFlow();
  const [showPass, setShowPass] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>🍴</div>
          <h1 className={styles.logoTitle}>Comandero</h1>
          <p className={styles.logoSubtitle}>Registra tu restaurante</p>
        </div>

        <form className={styles.card} onSubmit={handleRegister}>
          <h2 className={styles.cardTitle}>Crear cuenta</h2>
          <p className={styles.cardSubtitle}>Empieza gratis en menos de 1 minuto</p>

          {error && (
            <div className={styles.error}>
              <span>⚠️</span> {error}
            </div>
          )}

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="reg-restaurante">Nombre del restaurante</label>
            <input
              id="reg-restaurante"
              className={styles.input}
              type="text"
              value={nombreRestaurante}
              onChange={e => setNombreRestaurante(e.target.value)}
              placeholder="Ej: La Tasca de Juan"
              required
              autoFocus
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="reg-nombre">Tu nombre</label>
            <input
              id="reg-nombre"
              className={styles.input}
              type="text"
              value={nombreAdmin}
              onChange={e => setNombreAdmin(e.target.value)}
              placeholder="Ej: Juan García"
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              className={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="reg-password">Contraseña</label>
            <div className={styles.passwordWrap}>
              <input
                id="reg-password"
                className={styles.input}
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            <span className={styles.submitContent}>
              {loading ? (
                <><span className={styles.spinner}>⏳</span> Creando cuenta...</>
              ) : (
                '🚀 Crear restaurante'
              )}
            </span>
          </button>

          <p className={styles.hint}>
            ¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Iniciar sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
