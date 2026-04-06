/**
 * @module StatsDashboard
 * @description Pantalla principal de reportes y análisis de ventas.
 */
import React, { useEffect } from 'react';
import { useStatsStore } from '../state/statsStore';
import { DashboardCard } from './DashboardCard';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import styles from './StatsDashboard.module.css';
import { BottomNav } from '@/shared/components/BottomNav';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const StatsDashboard: React.FC = () => {
  const { stats, periodo, setPeriodo, fetchStats, isLoading, error } = useStatsStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);

  // -- Configuración de Gráficos --

  const hourlyData = {
    labels: stats?.ventas_por_hora.map(d => d.hora) || [],
    datasets: [{
      label: 'Ventas (€)',
      data: stats?.ventas_por_hora.map(d => d.total) || [],
      borderColor: '#238636',
      backgroundColor: 'rgba(35, 134, 54, 0.2)',
      fill: true,
      tension: 0.4,
    }]
  };

  const topItemsData = {
    labels: stats?.top_items.map(i => `${i.emoji} ${i.nombre}`) || [],
    datasets: [{
      label: 'Unidades Vendidas',
      data: stats?.top_items.map(i => i.cantidad) || [],
      backgroundColor: [
        '#58a6ff', '#3fb950', '#d29922', '#f85149', '#8b949e'
      ],
      borderRadius: 6,
    }]
  };

  const categoryData = {
    labels: stats?.ventas_por_categoria.map(c => c.nombre) || [],
    datasets: [{
      data: stats?.ventas_por_categoria.map(c => c.total) || [],
      backgroundColor: [
        '#58a6ff', '#3fb950', '#d29922', '#f85149', '#ab7df8', '#ff7b72'
      ],
      borderWidth: 0,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#161b22',
        titleColor: '#fff',
        bodyColor: '#8b949e',
        borderColor: '#30363d',
        borderWidth: 1,
      }
    },
    scales: {
      y: { grid: { color: '#30363d' }, ticks: { color: '#8b949e' } },
      x: { grid: { display: false }, ticks: { color: '#8b949e' } }
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titles}>
            <span className={styles.badge}>BI</span>
            <h1>PANEL DE CONTROL</h1>
            <p>Análisis de rendimiento y ventas</p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.periodSelector}>
            {(['hoy', 'semana', 'mes'] as const).map((p) => (
              <button
                key={p}
                className={`${styles.periodBtn} ${periodo === p ? styles.active : ''}`}
                onClick={() => setPeriodo(p)}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Métricas Principales */}
      <section className={styles.statsGrid}>
        <DashboardCard 
          label="Ventas Totales" 
          value={formatCurrency(stats?.ventas_total || 0)} 
          icon="💰"
          color="#238636"
        />
        <DashboardCard 
          label="Ticket Medio" 
          value={formatCurrency(stats?.ticket_medio || 0)} 
          icon="🎫"
          color="#58a6ff"
        />
        <DashboardCard 
          label="Pedidos" 
          value={stats?.pedidos_count || 0} 
          icon="🧾"
          color="#d29922"
        />
        <DashboardCard 
          label="Mesas Atendidas" 
          value={stats?.mesas_atendidas || 0} 
          icon="🪑"
          color="#ab7df8"
        />
      </section>

      {/* Gráficos */}
      <section className={styles.chartsGrid}>
        <div className={`${styles.chartCard} ${styles.fullWidth}`}>
            <h3>📈 Ventas por Hora / Periodo</h3>
            <div className={styles.chartWrapper}>
                <Line data={hourlyData} options={chartOptions} />
            </div>
        </div>

        <div className={styles.chartCard}>
            <h3>🔥 Productos Estrella (Top 5)</h3>
            <div className={styles.chartWrapper}>
                <Bar 
                  data={topItemsData} 
                  options={{
                    ...chartOptions,
                    indexAxis: 'y' as const,
                  }} 
                />
            </div>
        </div>

        <div className={styles.chartCard}>
            <h3>📂 Rendimiento por Categoría</h3>
            <div className={styles.chartWrapper}>
                <Doughnut 
                   data={categoryData} 
                   options={{
                     ...chartOptions,
                     plugins: { ...chartOptions.plugins, legend: { display: true, position: 'bottom', labels: { color: '#8b949e' } } }
                   }} 
                />
            </div>
        </div>
      </section>

      {error && (
        <div className={styles.errorBanner}>
          <span>❌ {error}</span>
          <button className={styles.retryBtn} onClick={fetchStats}>Reintentar</button>
        </div>
      )}

      {isLoading && <div className={styles.overlay}><div className={styles.spinner}></div></div>}
      <BottomNav />
    </div>
  );
};
