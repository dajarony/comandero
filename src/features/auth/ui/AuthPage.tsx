/**
 * @module AuthPage
 * @description Página de login mobile-first con CSS modules
 * SUME Docblock v2.0
 * Entradas : Interacción del usuario (email, password, submit)
 * Lógica   : Delega en useAuthFlow, renderiza formulario responsive
 * Salidas  : JSX del formulario de login
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthFlow } from '../logic/useAuthFlow';
import styles from './AuthPage.module.css';

export function AuthPage() {
  const { email, setEmail, password, setPassword, error, loading, handleLogin } = useAuthFlow();
  const [showPass, setShowPass] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Logo */}
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>🍴</div>
          <h1 className={styles.logoTitle}>Comandero</h1>
          <p className={styles.logoSubtitle}>Comandas para sala y cocina</p>
        </div>

        {/* Card */}
        <form className={styles.card} onSubmit={handleLogin}>
          <h2 className={styles.cardTitle}>Iniciar Sesión</h2>
          <p className={styles.cardSubtitle}>Accede a tu local</p>

          {error && (
            <div className={styles.error}>
              <span>⚠️</span> {error}
            </div>
          )}

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoFocus
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="login-password">Contraseña</label>
            <div className={styles.passwordWrap}>
              <input
                id="login-password"
                className={styles.input}
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
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

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
          >
            <span className={styles.submitContent}>
              {loading ? (
                <><span className={styles.spinner}>⏳</span> Entrando...</>
              ) : (
                '🔐 Entrar'
              )}
            </span>
          </button>

          <p className={styles.hint}>
            ¿Restaurante nuevo? <Link to="/registro" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Crear cuenta gratis</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
