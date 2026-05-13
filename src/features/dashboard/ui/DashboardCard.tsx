/**
 * @module DashboardCard
 * @description Tarjeta de métrica para el dashboard.
 */
import React from 'react';
import styles from './DashboardCard.module.css';

interface DashboardCardProps {
  label: string;
  value: string | number;
  icon: string;
  trend?: string;
  color?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ label, value, icon, trend, color = '#238636' }) => {
  return (
    <div className={styles.card}>
      <div className={styles.iconContainer} style={{ backgroundColor: `${color}15`, color }}>
        {icon}
      </div>
      <div className={styles.info}>
        <span className={styles.label}>{label}</span>
        <h2 className={styles.value}>{value}</h2>
        {trend && <span className={styles.trend}>{trend}</span>}
      </div>
    </div>
  );
};
